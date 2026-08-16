(function () {
  "use strict";

  var app = document.getElementById("writerApp");
  if (!app) return;

  var editor = document.getElementById("writerEditor");
  var paper = document.getElementById("writerPaper");
  var titleInput = document.getElementById("writerTitle");
  var excerptInput = document.getElementById("writerExcerpt");
  var categoryInput = document.getElementById("writerCategory");
  var tagsInput = document.getElementById("writerTags");
  var toolbar = app.querySelector(".writer-toolbar");
  var fontSizeSelect = document.getElementById("writerFontSize");
  var slashMenu = document.getElementById("writerSlashMenu");
  var slashOptions = document.getElementById("writerSlashOptions");
  var mediaInput = document.getElementById("writerMediaInput");
  var addBlockButton = document.getElementById("writerAddBlock");
  var previewToggle = document.getElementById("writerPreviewToggle");
  var previewClose = document.getElementById("writerPreviewClose");
  var previewPanel = document.getElementById("writerPreview");
  var previewContent = document.getElementById("writerPreviewContent");
  var clearButton = document.getElementById("writerClear");
  var copyButton = document.getElementById("writerCopyMarkdown");
  var exportButton = document.getElementById("writerExport");
  var publishButton = document.getElementById("writerPublish");
  var saveState = document.getElementById("writerSaveState");
  var countState = document.getElementById("writerCount");
  var toast = document.getElementById("writerToast");

  var DRAFT_DB = "minnong-writer";
  var DRAFT_STORE = "drafts";
  var DRAFT_KEY = "current";
  var MAX_MEDIA_BYTES = 15 * 1024 * 1024;

  var savedRange = null;
  var activeSlashBlock = null;
  var slashSelectionIndex = 0;
  var pendingMediaReference = null;
  var saveTimer = null;
  var previewTimer = null;
  var toastTimer = null;
  var dragDepth = 0;
  var mediaStore = new Map();

  var slashCommands = [
    { id: "text", label: "텍스트", description: "기본 문단으로 작성", icon: "ri-text", shortcut: "T", keywords: "text paragraph 문단 본문" },
    { id: "h1", label: "큰 제목", description: "페이지 안의 가장 큰 제목", icon: "ri-h-1", shortcut: "H1", keywords: "heading title 제목" },
    { id: "h2", label: "중간 제목", description: "내용을 구분하는 섹션 제목", icon: "ri-h-2", shortcut: "H2", keywords: "heading subtitle 소제목" },
    { id: "h3", label: "작은 제목", description: "세부 내용을 나누는 제목", icon: "ri-h-3", shortcut: "H3", keywords: "heading subtitle 소제목" },
    { id: "bullet", label: "글머리 목록", description: "항목을 목록으로 정리", icon: "ri-list-unordered", shortcut: "•", keywords: "list bullet 목록 리스트" },
    { id: "quote", label: "인용", description: "중요한 문장이나 인용문", icon: "ri-double-quotes-l", shortcut: "\u201c", keywords: "quote callout 인용 강조" },
    { id: "toggle", label: "토글", description: "필요할 때 펼쳐보는 내용", icon: "ri-arrow-right-s-line", shortcut: "▸", keywords: "toggle details 접기 펼치기" },
    { id: "code", label: "코드 블록", description: "언어를 선택해 코드 작성", icon: "ri-code-box-line", shortcut: "</>", keywords: "code block 코드 개발" },
    { id: "math", label: "수학 블록", description: "LaTeX 수식과 실시간 미리보기", icon: "ri-function-line", shortcut: "∑", keywords: "math latex formula 수학 수식" },
    { id: "embed", label: "임베드", description: "YouTube 또는 웹 링크를 블록으로 삽입", icon: "ri-layout-masonry-line", shortcut: "↗", keywords: "embed iframe youtube 임베드 링크" },
    { id: "media", label: "이미지 · GIF", description: "파일을 선택하거나 끌어놓기", icon: "ri-image-add-line", shortcut: "IMG", keywords: "image gif media upload 사진 이미지 업로드" }
  ];

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeYaml(value) {
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/\"/g, "\\\"")
      .replace(/\r?\n/g, " ");
  }

  function makeId(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function slugify(value) {
    var slug = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-");
    return slug || ("study-note-" + Date.now().toString(36));
  }

  function safeFilename(value, fallbackExtension) {
    var raw = String(value || "media").trim();
    var parts = raw.split(".");
    var extension = parts.length > 1 ? parts.pop().toLowerCase() : (fallbackExtension || "png");
    var base = parts.join(".") || "media";
    base = base
      .normalize("NFKC")
      .replace(/[^a-zA-Z0-9가-힣_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "media";
    extension = extension.replace(/[^a-z0-9]/g, "") || "png";
    return base + "." + extension;
  }

  function uniqueFilename(filename) {
    var existing = new Set(Array.from(mediaStore.values()).map(function (item) { return item.filename; }));
    if (!existing.has(filename)) return filename;
    var dot = filename.lastIndexOf(".");
    var base = dot > -1 ? filename.slice(0, dot) : filename;
    var extension = dot > -1 ? filename.slice(dot) : "";
    var count = 2;
    var candidate = base + "-" + count + extension;
    while (existing.has(candidate)) {
      count += 1;
      candidate = base + "-" + count + extension;
    }
    return candidate;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  function setSaveState(mode, label) {
    saveState.classList.toggle("is-saving", mode === "saving");
    saveState.classList.toggle("is-error", mode === "error");
    var icon = mode === "saving" ? "ri-loader-4-line" : mode === "error" ? "ri-error-warning-line" : "ri-checkbox-circle-line";
    saveState.innerHTML = '<i class="' + icon + '"></i> ' + label;
  }

  function autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
  }

  function updateCount() {
    var characters = editor.innerText.replace(/\s+/g, " ").trim().length;
    var blocks = editor.children.length;
    countState.textContent = characters.toLocaleString("ko-KR") + "자 · " + blocks + "블록";
  }

  function openDatabase() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB unavailable"));
        return;
      }
      var request = window.indexedDB.open(DRAFT_DB, 1);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(DRAFT_STORE)) db.createObjectStore(DRAFT_STORE);
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error("Draft database failed")); };
    });
  }

  var databasePromise = openDatabase();

  function collectDraft() {
    return {
      title: titleInput.value,
      excerpt: excerptInput.value,
      category: categoryInput.value,
      tags: tagsInput.value,
      html: editor.innerHTML,
      updatedAt: new Date().toISOString()
    };
  }

  function saveDraftNow() {
    clearTimeout(saveTimer);
    setSaveState("saving", "저장 중");
    return databasePromise.then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(DRAFT_STORE, "readwrite");
        transaction.objectStore(DRAFT_STORE).put(collectDraft(), DRAFT_KEY);
        transaction.oncomplete = function () { resolve(); };
        transaction.onerror = function () { reject(transaction.error || new Error("Draft save failed")); };
      });
    }).then(function () {
      setSaveState("saved", "이 기기에 저장됨");
    }).catch(function () {
      setSaveState("error", "자동 저장 불가");
    });
  }

  function scheduleSave() {
    setSaveState("saving", "변경사항 저장 중");
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveDraftNow, 650);
  }

  function loadDraft() {
    return databasePromise.then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(DRAFT_STORE, "readonly");
        var request = transaction.objectStore(DRAFT_STORE).get(DRAFT_KEY);
        request.onsuccess = function () { resolve(request.result || null); };
        request.onerror = function () { reject(request.error || new Error("Draft load failed")); };
      });
    });
  }

  function deleteDraft() {
    return databasePromise.then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(DRAFT_STORE, "readwrite");
        transaction.objectStore(DRAFT_STORE).delete(DRAFT_KEY);
        transaction.oncomplete = function () { resolve(); };
        transaction.onerror = function () { reject(transaction.error || new Error("Draft delete failed")); };
      });
    });
  }

  function createParagraph() {
    var paragraph = document.createElement("p");
    paragraph.dataset.blockType = "paragraph";
    paragraph.innerHTML = "<br>";
    return paragraph;
  }

  function focusAtEnd(element) {
    if (!element) return;
    element.focus();
    var range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    savedRange = range.cloneRange();
  }

  function restoreSelection() {
    if (!savedRange) {
      focusAtEnd(editor);
      return;
    }
    try {
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRange);
    } catch (error) {
      focusAtEnd(editor);
    }
  }

  function getCurrentBlock() {
    var selection = window.getSelection();
    var node = selection && selection.rangeCount ? selection.anchorNode : null;
    if (!node && savedRange) node = savedRange.startContainer;
    if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    while (node && node.parentElement !== editor) node = node.parentElement;
    if (node && node.parentElement === editor) return node;
    return editor.lastElementChild || null;
  }

  function placeNodeAfter(reference, node, addParagraph) {
    if (reference && reference.parentElement === editor) {
      reference.insertAdjacentElement("afterend", node);
    } else {
      editor.appendChild(node);
    }
    if (addParagraph) {
      var paragraph = createParagraph();
      node.insertAdjacentElement("afterend", paragraph);
      focusAtEnd(paragraph);
    }
    scheduleSave();
    updateCount();
    schedulePreview();
    return node;
  }

  function replaceBlockTag(block, tagName) {
    if (!block || block.parentElement !== editor) return null;
    var replacement = document.createElement(tagName);
    replacement.innerHTML = block.innerHTML || "<br>";
    replacement.dataset.blockType = tagName === "p" ? "paragraph" : tagName.toLowerCase();
    if (block.style.fontSize) replacement.style.fontSize = block.style.fontSize;
    block.replaceWith(replacement);
    focusAtEnd(replacement);
    scheduleSave();
    updateCount();
    schedulePreview();
    return replacement;
  }

  function createRemoveButton() {
    return '<button type="button" data-remove-block aria-label="블록 삭제"><i class="ri-delete-bin-6-line"></i></button>';
  }

  function createCodeBlock() {
    var block = document.createElement("section");
    block.className = "writer-special-block writer-code-block";
    block.dataset.blockType = "code";
    block.setAttribute("contenteditable", "false");
    block.innerHTML =
      '<header class="writer-special-head">' +
        '<span class="writer-special-label"><i class="ri-code-box-line"></i> Code block</span>' +
        '<div class="writer-special-actions">' +
          '<select class="writer-code-language" aria-label="코드 언어">' +
            '<option value="python">Python</option><option value="javascript">JavaScript</option>' +
            '<option value="typescript">TypeScript</option><option value="html">HTML</option>' +
            '<option value="css">CSS</option><option value="sql">SQL</option>' +
            '<option value="bash">Bash</option><option value="java">Java</option>' +
            '<option value="text">Plain text</option>' +
          '</select>' + createRemoveButton() +
        '</div>' +
      '</header>' +
      '<textarea class="writer-code-input" aria-label="코드 입력" spellcheck="false" placeholder="코드를 입력하세요"></textarea>';
    return block;
  }

  function createMathBlock() {
    var block = document.createElement("section");
    block.className = "writer-special-block writer-math-block";
    block.dataset.blockType = "math";
    block.setAttribute("contenteditable", "false");
    block.innerHTML =
      '<header class="writer-special-head">' +
        '<span class="writer-special-label"><i class="ri-function-line"></i> Math · LaTeX</span>' +
        '<div class="writer-special-actions">' + createRemoveButton() + '</div>' +
      '</header>' +
      '<textarea class="writer-math-input" aria-label="LaTeX 수식 입력" spellcheck="false" placeholder="\\hat{y} = wx + b"></textarea>' +
      '<div class="writer-math-preview" aria-label="수식 미리보기"></div>';
    return block;
  }

  function createEmbedBlock() {
    var block = document.createElement("section");
    block.className = "writer-special-block writer-embed-block";
    block.dataset.blockType = "embed";
    block.setAttribute("contenteditable", "false");
    block.innerHTML =
      '<header class="writer-special-head">' +
        '<span class="writer-special-label"><i class="ri-layout-masonry-line"></i> Web embed</span>' +
        '<div class="writer-special-actions">' + createRemoveButton() + '</div>' +
      '</header>' +
      '<div class="writer-embed-body">' +
        '<input class="writer-embed-url" type="url" inputmode="url" aria-label="임베드 URL" placeholder="https://example.com 또는 YouTube 링크" />' +
        '<div class="writer-embed-preview">URL을 입력하면 미리보기가 표시됩니다.</div>' +
      '</div>';
    return block;
  }

  function createToggleBlock() {
    var block = document.createElement("details");
    block.className = "writer-toggle";
    block.dataset.blockType = "toggle";
    block.setAttribute("contenteditable", "false");
    block.open = true;
    block.innerHTML =
      '<summary><span class="writer-toggle-title" contenteditable="true">토글 제목</span></summary>' +
      '<div class="writer-toggle-body" contenteditable="true">내용을 입력하세요.</div>';
    return block;
  }

  function createMediaBlock(item) {
    var block = document.createElement("figure");
    block.className = "writer-media-block";
    block.dataset.blockType = "media";
    block.dataset.mediaId = item.id;
    block.dataset.filename = item.filename;
    block.dataset.mime = item.type;
    block.setAttribute("contenteditable", "false");

    var isGif = item.type === "image/gif" || /\.gif$/i.test(item.filename);
    block.innerHTML =
      '<header class="writer-special-head">' +
        '<span class="writer-special-label"><i class="' + (isGif ? "ri-file-gif-line" : "ri-image-line") + '"></i> ' + escapeHtml(item.filename) + '</span>' +
        '<div class="writer-special-actions">' + createRemoveButton() + '</div>' +
      '</header>' +
      '<img src="' + item.dataUrl + '" alt="" />' +
      '<input class="writer-media-caption" type="text" aria-label="이미지 설명" placeholder="이미지 설명을 입력하세요" />';
    return block;
  }

  function insertSpecialBlock(type, replaceBlock) {
    var reference = replaceBlock || getCurrentBlock();
    var block;
    if (type === "code") block = createCodeBlock();
    if (type === "math") block = createMathBlock();
    if (type === "embed") block = createEmbedBlock();
    if (type === "toggle") block = createToggleBlock();
    if (!block) return null;

    if (replaceBlock && replaceBlock.parentElement === editor) {
      replaceBlock.replaceWith(block);
      var paragraph = createParagraph();
      block.insertAdjacentElement("afterend", paragraph);
      focusAtEnd(paragraph);
      scheduleSave();
      updateCount();
      schedulePreview();
    } else {
      placeNodeAfter(reference, block, true);
    }

    var input = block.querySelector("textarea, input, [contenteditable='true']");
    if (input) window.setTimeout(function () { input.focus(); }, 0);
    return block;
  }

  function normalizeUrl(value) {
    var raw = String(value || "").trim();
    if (!raw) return "";
    if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
    try {
      var url = new URL(raw);
      if (url.protocol !== "https:" && url.protocol !== "http:") return "";
      return url.href;
    } catch (error) {
      return "";
    }
  }

  function webUrlFromText(value) {
    var candidate = String(value || "").trim();
    if (!candidate || /\s/.test(candidate)) return "";
    var looksLikeWebUrl = /^https?:\/\/\S+$/i.test(candidate) ||
      /^(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#]\S*)?$/i.test(candidate);
    return looksLikeWebUrl ? normalizeUrl(candidate) : "";
  }

  function youtubeIdFromUrl(value) {
    var url = normalizeUrl(value);
    if (!url) return "";
    try {
      var parsed = new URL(url);
      if (parsed.hostname.indexOf("youtu.be") !== -1) return parsed.pathname.split("/").filter(Boolean)[0] || "";
      if (parsed.hostname.indexOf("youtube.com") !== -1 || parsed.hostname.indexOf("youtube-nocookie.com") !== -1) {
        if (parsed.searchParams.get("v")) return parsed.searchParams.get("v");
        var parts = parsed.pathname.split("/").filter(Boolean);
        var marker = parts.indexOf("embed");
        if (marker > -1 && parts[marker + 1]) return parts[marker + 1];
        marker = parts.indexOf("shorts");
        if (marker > -1 && parts[marker + 1]) return parts[marker + 1];
      }
    } catch (error) {}
    return "";
  }

  function renderEmbedBlock(block) {
    if (!block) return;
    var input = block.querySelector(".writer-embed-url");
    var target = block.querySelector(".writer-embed-preview");
    var url = normalizeUrl(input ? input.value : "");
    target.innerHTML = "";
    if (!url) {
      target.textContent = "URL을 입력하면 미리보기가 표시됩니다.";
      return;
    }

    var youtubeId = youtubeIdFromUrl(url);
    var frame = document.createElement("iframe");
    frame.loading = "lazy";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.title = "임베드 미리보기";
    frame.src = youtubeId ? "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(youtubeId) : url;
    frame.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
    frame.setAttribute("allowfullscreen", "");
    if (!youtubeId) {
      frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups allow-presentation");
      var parsed = new URL(url);
      var bar = document.createElement("div");
      bar.className = "writer-embed-linkbar";

      var identity = document.createElement("span");
      identity.className = "writer-embed-identity";
      identity.innerHTML = '<i class="ri-global-line" aria-hidden="true"></i><span><strong></strong><small></small></span>';
      identity.querySelector("strong").textContent = parsed.hostname.replace(/^www\./, "");
      identity.querySelector("small").textContent = parsed.pathname === "/" ? url : parsed.pathname + parsed.search;

      var openLink = document.createElement("a");
      openLink.href = url;
      openLink.target = "_blank";
      openLink.rel = "noreferrer noopener";
      openLink.setAttribute("aria-label", "새 탭에서 링크 열기");
      openLink.innerHTML = '<span>새 탭에서 열기</span><i class="ri-arrow-right-up-line" aria-hidden="true"></i>';

      bar.appendChild(identity);
      bar.appendChild(openLink);
      target.appendChild(bar);
    }
    target.appendChild(frame);
  }

  function insertEmbedFromUrl(url, replaceBlock) {
    var block = insertSpecialBlock("embed", replaceBlock);
    if (!block) return;
    var input = block.querySelector(".writer-embed-url");
    input.value = url;
    renderEmbedBlock(block);
    var nextBlock = block.nextElementSibling;
    if (nextBlock) window.setTimeout(function () { focusAtEnd(nextBlock); }, 0);
    scheduleSave();
    schedulePreview();
    showToast("웹 링크를 임베드 블록으로 만들었습니다.");
  }

  function renderMathBlock(block) {
    if (!block) return;
    var input = block.querySelector(".writer-math-input");
    var target = block.querySelector(".writer-math-preview");
    var formula = input ? input.value.trim() : "";
    target.innerHTML = "";
    if (!formula) return;
    var source = document.createElement("div");
    source.textContent = "\\[" + formula + "\\]";
    target.appendChild(source);
    if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
      window.MathJax.typesetPromise([target]).catch(function () {
        target.textContent = formula;
      });
    }
  }

  function applyInlineElement(tagName) {
    restoreSelection();
    var selection = window.getSelection();
    if (!selection.rangeCount) return;
    var range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    var element = document.createElement(tagName);

    if (range.collapsed) {
      element.textContent = tagName === "code" ? "code" : "강조 텍스트";
      range.insertNode(element);
      range.selectNodeContents(element);
    } else {
      try {
        range.surroundContents(element);
        range.selectNodeContents(element);
      } catch (error) {
        var fragment = range.extractContents();
        element.appendChild(fragment);
        range.insertNode(element);
        range.selectNodeContents(element);
      }
    }

    selection.removeAllRanges();
    selection.addRange(range);
    savedRange = range.cloneRange();
    scheduleSave();
    schedulePreview();
  }

  function applyFontSize(size) {
    if (!size) return;
    restoreSelection();
    var selection = window.getSelection();
    if (!selection.rangeCount) return;
    var range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    if (range.collapsed) {
      var block = getCurrentBlock();
      if (block && !block.classList.contains("writer-special-block")) block.style.fontSize = size;
    } else {
      var span = document.createElement("span");
      span.style.fontSize = size;
      try {
        range.surroundContents(span);
      } catch (error) {
        var fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
      }
    }
    scheduleSave();
    schedulePreview();
  }

  function executeToolbarCommand(command) {
    restoreSelection();
    editor.focus();
    if (command === "undo" || command === "redo" || command === "bold" || command === "italic") {
      document.execCommand(command, false, null);
    } else if (command === "highlight") {
      applyInlineElement("mark");
    } else if (command === "inline-code") {
      applyInlineElement("code");
    } else if (command === "link") {
      var selection = window.getSelection();
      var selectedText = selection && selection.rangeCount ? selection.toString() : "";
      var inputUrl = window.prompt("연결할 URL을 입력하세요.", "https://");
      var url = normalizeUrl(inputUrl);
      if (!url) {
        if (inputUrl !== null) showToast("올바른 웹 주소를 입력해 주세요.");
        return;
      }
      restoreSelection();
      if (selectedText) {
        document.execCommand("createLink", false, url);
      } else {
        var anchor = document.createElement("a");
        anchor.href = url;
        anchor.textContent = url;
        var range = window.getSelection().getRangeAt(0);
        range.insertNode(anchor);
        range.setStartAfter(anchor);
        range.collapse(true);
      }
    }
    scheduleSave();
    schedulePreview();
  }

  function normalizeEditorBlocks() {
    Array.prototype.slice.call(editor.children).forEach(function (block) {
      if (block.tagName !== "DIV" || block.dataset.blockType || block.closest(".writer-special-block")) return;
      var paragraph = document.createElement("p");
      paragraph.dataset.blockType = "paragraph";
      paragraph.innerHTML = block.innerHTML || "<br>";
      block.replaceWith(paragraph);
    });
    if (!editor.children.length) editor.appendChild(createParagraph());
  }

  function filterSlashCommands(query) {
    var normalized = String(query || "").trim().toLowerCase();
    if (!normalized) return slashCommands.slice();
    return slashCommands.filter(function (command) {
      return (command.label + " " + command.description + " " + command.keywords).toLowerCase().indexOf(normalized) !== -1;
    });
  }

  function renderSlashOptions(query) {
    var commands = filterSlashCommands(query);
    slashSelectionIndex = Math.min(slashSelectionIndex, Math.max(commands.length - 1, 0));
    slashOptions.innerHTML = "";
    if (!commands.length) {
      slashOptions.innerHTML = '<p class="writer-slash-empty">일치하는 블록이 없어요.</p>';
      return;
    }
    commands.forEach(function (command, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "writer-slash-option" + (index === slashSelectionIndex ? " is-selected" : "");
      button.dataset.slashCommand = command.id;
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", index === slashSelectionIndex ? "true" : "false");
      button.innerHTML =
        '<i class="' + command.icon + '"></i>' +
        '<span class="writer-slash-copy"><strong>' + escapeHtml(command.label) + '</strong><small>' + escapeHtml(command.description) + '</small></span>' +
        '<span>' + escapeHtml(command.shortcut) + '</span>';
      slashOptions.appendChild(button);
    });
  }

  function positionSlashMenu(block) {
    if (!block || window.innerWidth <= 760) return;
    var rect = block.getBoundingClientRect();
    var width = 320;
    var left = Math.min(Math.max(rect.left, 12), window.innerWidth - width - 12);
    var top = rect.bottom + 8;
    var estimatedHeight = Math.min(430, slashMenu.scrollHeight || 430);
    if (top + estimatedHeight > window.innerHeight - 12) top = Math.max(12, rect.top - estimatedHeight - 8);
    slashMenu.style.left = left + "px";
    slashMenu.style.top = top + "px";
  }

  function openSlashMenu(block, query) {
    activeSlashBlock = block;
    slashSelectionIndex = 0;
    renderSlashOptions(query);
    slashMenu.hidden = false;
    window.requestAnimationFrame(function () { positionSlashMenu(block); });
  }

  function closeSlashMenu() {
    slashMenu.hidden = true;
    activeSlashBlock = null;
    slashSelectionIndex = 0;
  }

  function executeSlashCommand(commandId) {
    var block = activeSlashBlock || getCurrentBlock();
    closeSlashMenu();
    if (!block) return;

    block.innerHTML = "<br>";

    if (commandId === "text") replaceBlockTag(block, "p");
    if (commandId === "h1") replaceBlockTag(block, "h1");
    if (commandId === "h2") replaceBlockTag(block, "h2");
    if (commandId === "h3") replaceBlockTag(block, "h3");
    if (commandId === "quote") replaceBlockTag(block, "blockquote");
    if (commandId === "bullet") {
      focusAtEnd(block);
      document.execCommand("insertUnorderedList", false, null);
      scheduleSave();
      schedulePreview();
    }
    if (commandId === "toggle" || commandId === "code" || commandId === "math" || commandId === "embed") {
      insertSpecialBlock(commandId, block);
    }
    if (commandId === "media") {
      block.textContent = "";
      pendingMediaReference = block;
      mediaInput.click();
    }
  }

  function selectedSlashButton() {
    return slashOptions.querySelectorAll(".writer-slash-option")[slashSelectionIndex] || null;
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(reader.error || new Error("File read failed")); };
      reader.readAsDataURL(file);
    });
  }

  function insertMediaItems(files, reference) {
    var imageFiles = Array.prototype.slice.call(files || []).filter(function (file) {
      return file && file.type && file.type.indexOf("image/") === 0;
    });
    if (!imageFiles.length) {
      showToast("이미지 또는 GIF 파일을 선택해 주세요.");
      return Promise.resolve();
    }
    if (imageFiles.some(function (file) { return file.size > MAX_MEDIA_BYTES; })) {
      showToast("파일 하나당 15MB 이하로 올려주세요.");
      imageFiles = imageFiles.filter(function (file) { return file.size <= MAX_MEDIA_BYTES; });
    }
    if (!imageFiles.length) return Promise.resolve();

    var currentReference = reference || getCurrentBlock();
    return imageFiles.reduce(function (chain, file) {
      return chain.then(function () {
        return readFileAsDataUrl(file).then(function (dataUrl) {
          var extension = file.type.split("/")[1] || "png";
          var item = {
            id: makeId("media"),
            filename: uniqueFilename(safeFilename(file.name, extension)),
            type: file.type,
            size: file.size,
            dataUrl: dataUrl
          };
          mediaStore.set(item.id, item);
          var block = createMediaBlock(item);
          placeNodeAfter(currentReference, block, false);
          currentReference = block;
        });
      });
    }, Promise.resolve()).then(function () {
      var paragraph = createParagraph();
      currentReference.insertAdjacentElement("afterend", paragraph);
      focusAtEnd(paragraph);
      showToast(imageFiles.length + "개의 미디어를 추가했습니다.");
      scheduleSave();
      schedulePreview();
    }).catch(function () {
      showToast("파일을 읽는 중 문제가 발생했습니다.");
    });
  }

  function rebuildMediaStore() {
    mediaStore.clear();
    editor.querySelectorAll(".writer-media-block").forEach(function (block) {
      var image = block.querySelector("img");
      var id = block.dataset.mediaId || makeId("media");
      block.dataset.mediaId = id;
      mediaStore.set(id, {
        id: id,
        filename: block.dataset.filename || "image.png",
        type: block.dataset.mime || "image/png",
        size: 0,
        dataUrl: image ? image.src : ""
      });
    });
  }

  function inlineToMarkdown(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    var tag = node.tagName.toLowerCase();
    var children = Array.prototype.map.call(node.childNodes, inlineToMarkdown).join("");
    if (tag === "br") return "\n";
    if (tag === "strong" || tag === "b") return "**" + children + "**";
    if (tag === "em" || tag === "i") return "*" + children + "*";
    if (tag === "code") return "`" + (node.textContent || "").replace(/`/g, "\\`") + "`";
    if (tag === "a") return "[" + (children || node.getAttribute("href") || "링크") + "](" + (node.getAttribute("href") || "") + ")";
    if (tag === "mark") return "<mark>" + children + "</mark>";
    if (tag === "span" && node.style.fontSize) return '<span style="font-size:' + node.style.fontSize + '">' + children + "</span>";
    return children;
  }

  function listToMarkdown(block, ordered) {
    return Array.prototype.map.call(block.children, function (item, index) {
      return (ordered ? (index + 1) + ". " : "- ") + inlineToMarkdown(item).trim();
    }).join("\n");
  }

  function blockToMarkdown(block, context) {
    var type = block.dataset.blockType || block.tagName.toLowerCase();
    if (type === "code") {
      var language = block.querySelector(".writer-code-language").value || "text";
      var code = block.querySelector(".writer-code-input").value.replace(/\s+$/, "");
      return "```" + language + "\n" + code + "\n```";
    }
    if (type === "math") {
      context.mathIndex += 1;
      var formula = block.querySelector(".writer-math-input").value.trim();
      if (!formula) return "";
      var variable = "writer_formula_" + context.mathIndex;
      return "{% capture " + variable + " %}\n" + formula + "\n{% endcapture %}\n" +
        '{% include library/latex-block.html title="수학 블록" formula=' + variable + " %}";
    }
    if (type === "embed") {
      var rawUrl = block.querySelector(".writer-embed-url").value;
      var url = normalizeUrl(rawUrl);
      if (!url) return "";
      var youtubeId = youtubeIdFromUrl(url);
      if (youtubeId) {
        return '{% include library/youtube-embed.html title="임베드 영상" video_id="' + escapeYaml(youtubeId) + '" %}';
      }
      return '{% include library/web-embed.html url="' + escapeYaml(url) + '" %}';
    }
    if (type === "media") {
      var id = block.dataset.mediaId;
      var item = mediaStore.get(id);
      if (!item || !item.dataUrl) return "";
      var captionInput = block.querySelector(".writer-media-caption");
      var caption = captionInput ? captionInput.value.trim() : "";
      var filename = item.filename;
      context.media.push({
        path: "assets/posts/" + context.slug + "/" + filename,
        dataUrl: item.dataUrl,
        type: item.type
      });
      if (!context.cover) context.cover = "/assets/posts/" + context.slug + "/" + filename;
      return "![" + caption.replace(/\]/g, "\\]") + "]({{ '/assets/posts/" + context.slug + "/" + filename + "' | relative_url }})";
    }
    if (type === "toggle" || block.tagName.toLowerCase() === "details") {
      var toggleTitle = block.querySelector(".writer-toggle-title");
      var toggleBody = block.querySelector(".writer-toggle-body");
      return "<details>\n<summary>" + escapeHtml(toggleTitle ? toggleTitle.textContent.trim() : "더 보기") + "</summary>\n\n" +
        escapeHtml(toggleBody ? toggleBody.innerText.trim() : "") + "\n\n</details>";
    }

    var tag = block.tagName.toLowerCase();
    var text = inlineToMarkdown(block).trim();
    if (!text) return "";
    if (tag === "h1") return "# " + text;
    if (tag === "h2") return "## " + text;
    if (tag === "h3") return "### " + text;
    if (tag === "blockquote") return text.split("\n").map(function (line) { return "> " + line; }).join("\n");
    if (tag === "ul") return listToMarkdown(block, false);
    if (tag === "ol") return listToMarkdown(block, true);
    if (block.style.fontSize) return '<div style="font-size:' + block.style.fontSize + '">\n\n' + text + "\n\n</div>";
    return text;
  }

  function localDateParts(date) {
    function pad(value) { return String(value).padStart(2, "0"); }
    var offset = -date.getTimezoneOffset();
    var sign = offset >= 0 ? "+" : "-";
    var offsetHours = pad(Math.floor(Math.abs(offset) / 60));
    var offsetMinutes = pad(Math.abs(offset) % 60);
    return {
      date: date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()),
      time: pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds()),
      zone: sign + offsetHours + offsetMinutes
    };
  }

  function buildPostBundle() {
    var title = titleInput.value.trim();
    var slug = slugify(title);
    var category = categoryInput.value.trim() || "Study";
    var tags = tagsInput.value.split(",").map(function (tag) { return tag.trim(); }).filter(Boolean);
    var context = { slug: slug, media: [], cover: "", mathIndex: 0 };
    var blocks = Array.prototype.map.call(editor.children, function (block) {
      return blockToMarkdown(block, context);
    }).filter(Boolean);
    var now = localDateParts(new Date());

    var frontMatter = [
      "---",
      "layout: post",
      'title: "' + escapeYaml(title || "제목 없는 학습 노트") + '"',
      "date: " + now.date + " " + now.time + " " + now.zone,
      'categories: ["' + escapeYaml(category) + '"]',
      "tags: [" + tags.map(function (tag) { return '"' + escapeYaml(tag) + '"'; }).join(", ") + "]"
    ];
    if (excerptInput.value.trim()) frontMatter.push('excerpt: "' + escapeYaml(excerptInput.value.trim()) + '"');
    if (context.cover) frontMatter.push('image: "' + context.cover + '"');
    frontMatter.push("---", "");

    return {
      title: title,
      slug: slug,
      category: category.replace(/[^a-zA-Z0-9가-힣_-]+/g, "_") || "Study",
      date: now.date,
      markdown: frontMatter.join("\n") + blocks.join("\n\n") + "\n",
      media: context.media
    };
  }

  function dataUrlPayload(dataUrl) {
    var comma = dataUrl.indexOf(",");
    if (comma < 0) return { base64: false, data: dataUrl };
    var header = dataUrl.slice(0, comma);
    var payload = dataUrl.slice(comma + 1);
    return { base64: /;base64/i.test(header), data: payload };
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function exportBundle() {
    if (!titleInput.value.trim()) {
      showToast("먼저 글 제목을 입력해 주세요.");
      titleInput.focus();
      return;
    }
    var bundle = buildPostBundle();
    exportButton.disabled = true;
    exportButton.innerHTML = '<i class="ri-loader-4-line"></i><span>묶는 중</span>';

    if (window.JSZip) {
      var zip = new window.JSZip();
      var postPath = "_posts/" + bundle.category + "/" + bundle.date + "-" + bundle.slug + ".md";
      zip.file(postPath, bundle.markdown);
      bundle.media.forEach(function (item) {
        var payload = dataUrlPayload(item.dataUrl);
        zip.file(item.path, payload.data, { base64: payload.base64 });
      });
      zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } }).then(function (blob) {
        downloadBlob(blob, bundle.date + "-" + bundle.slug + ".zip");
        showToast("게시글과 미디어를 ZIP으로 묶었습니다.");
      }).catch(function () {
        downloadBlob(new Blob([bundle.markdown], { type: "text/markdown;charset=utf-8" }), bundle.date + "-" + bundle.slug + ".md");
        showToast("ZIP 생성이 어려워 Markdown만 내려받았습니다.");
      }).finally(function () {
        exportButton.disabled = false;
        exportButton.innerHTML = '<i class="ri-download-cloud-2-line"></i><span>게시물 내보내기</span>';
      });
    } else {
      downloadBlob(new Blob([bundle.markdown], { type: "text/markdown;charset=utf-8" }), bundle.date + "-" + bundle.slug + ".md");
      showToast("Markdown 파일을 내려받았습니다.");
      exportButton.disabled = false;
      exportButton.innerHTML = '<i class="ri-download-cloud-2-line"></i><span>게시물 내보내기</span>';
    }
  }

  function publishToGitHub() {
    if (!titleInput.value.trim()) {
      showToast("먼저 글 제목을 입력해 주세요.");
      titleInput.focus();
      return;
    }
    if (!window.MinnongOwnerAuth || !window.MinnongOwnerAuth.isAuthenticated()) {
      showToast("소유자 인증이 필요합니다.");
      return;
    }

    var bundle = buildPostBundle();
    publishButton.disabled = true;
    publishButton.innerHTML = '<i class="ri-loader-4-line"></i><span>게시 중</span>';
    setSaveState("saving", "GitHub에 게시 중");

    window.MinnongOwnerAuth.publishBundle(bundle).then(function () {
      setSaveState("saved", "GitHub에 게시됨");
      showToast("게시했습니다. GitHub Pages 반영까지 잠시 기다려 주세요.");
    }).catch(function (error) {
      setSaveState("error", "게시 실패");
      if (error && error.status === 422) {
        showToast("동시에 변경된 내용이 있습니다. 잠시 후 다시 게시해 주세요.");
      } else {
        showToast((error && error.message) || "게시하지 못했습니다.");
      }
    }).finally(function () {
      publishButton.disabled = false;
      publishButton.innerHTML = '<i class="ri-git-commit-line"></i><span>GitHub에 게시</span>';
    });
  }

  function copyMarkdown() {
    var markdown = buildPostBundle().markdown;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(markdown).then(function () {
        showToast("Markdown을 클립보드에 복사했습니다.");
      }).catch(function () {
        showToast("클립보드 복사 권한을 확인해 주세요.");
      });
      return;
    }
    var textarea = document.createElement("textarea");
    textarea.value = markdown;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      showToast("Markdown을 클립보드에 복사했습니다.");
    } catch (error) {
      showToast("복사하지 못했습니다. 내보내기를 사용해 주세요.");
    }
    textarea.remove();
  }

  function createPreviewNode(block) {
    var type = block.dataset.blockType || block.tagName.toLowerCase();
    if (type === "code") {
      var pre = document.createElement("pre");
      pre.className = "writer-code-render";
      var code = document.createElement("code");
      code.textContent = block.querySelector(".writer-code-input").value;
      pre.appendChild(code);
      return pre;
    }
    if (type === "math") {
      var math = document.createElement("div");
      math.className = "writer-math-preview";
      var formula = block.querySelector(".writer-math-input").value.trim();
      if (formula) math.textContent = "\\[" + formula + "\\]";
      return math;
    }
    if (type === "embed") {
      var embed = block.querySelector(".writer-embed-preview");
      return embed ? embed.cloneNode(true) : document.createTextNode("");
    }
    if (type === "media") {
      var figure = document.createElement("figure");
      var image = block.querySelector("img").cloneNode(true);
      var captionValue = block.querySelector(".writer-media-caption").value.trim();
      image.alt = captionValue;
      figure.appendChild(image);
      if (captionValue) {
        var caption = document.createElement("figcaption");
        caption.textContent = captionValue;
        figure.appendChild(caption);
      }
      return figure;
    }
    var clone = block.cloneNode(true);
    clone.removeAttribute("contenteditable");
    clone.querySelectorAll("[contenteditable]").forEach(function (node) { node.removeAttribute("contenteditable"); });
    return clone;
  }

  function renderPreview() {
    if (previewPanel.hidden) return;
    previewContent.innerHTML = "";
    var heading = document.createElement("h1");
    heading.className = "writer-preview-title";
    heading.textContent = titleInput.value.trim() || "제목 없는 학습 노트";
    previewContent.appendChild(heading);
    if (excerptInput.value.trim()) {
      var excerpt = document.createElement("p");
      excerpt.className = "writer-preview-excerpt";
      excerpt.textContent = excerptInput.value.trim();
      previewContent.appendChild(excerpt);
    }
    Array.prototype.forEach.call(editor.children, function (block) {
      previewContent.appendChild(createPreviewNode(block));
    });
    if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
      window.MathJax.typesetPromise([previewContent]).catch(function () {});
    }
  }

  function schedulePreview() {
    if (previewPanel.hidden) return;
    clearTimeout(previewTimer);
    previewTimer = window.setTimeout(renderPreview, 180);
  }

  function setPreview(open) {
    previewPanel.hidden = !open;
    app.classList.toggle("preview-open", open);
    previewToggle.setAttribute("aria-pressed", open ? "true" : "false");
    previewToggle.innerHTML = open ? '<i class="ri-edit-line"></i><span>편집으로</span>' : '<i class="ri-eye-line"></i><span>미리보기</span>';
    if (open) {
      renderPreview();
      if (window.innerWidth <= 1180) window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function resetEditor() {
    titleInput.value = "";
    excerptInput.value = "";
    categoryInput.value = "CS";
    tagsInput.value = "";
    editor.innerHTML = "";
    editor.appendChild(createParagraph());
    mediaStore.clear();
    autoResizeTextarea(excerptInput);
    updateCount();
    setPreview(false);
    focusAtEnd(editor.firstElementChild);
  }

  toolbar.addEventListener("mousedown", function (event) {
    if (event.target.closest("button")) event.preventDefault();
  });

  toolbar.addEventListener("click", function (event) {
    var commandButton = event.target.closest("[data-command]");
    if (commandButton) executeToolbarCommand(commandButton.dataset.command);

    var insertButton = event.target.closest("[data-insert]");
    if (!insertButton) return;
    var type = insertButton.dataset.insert;
    if (type === "media") {
      pendingMediaReference = getCurrentBlock();
      mediaInput.click();
    } else {
      insertSpecialBlock(type, null);
    }
  });

  fontSizeSelect.addEventListener("change", function () {
    applyFontSize(fontSizeSelect.value);
    fontSizeSelect.value = "";
  });

  document.addEventListener("selectionchange", function () {
    var selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    var range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) savedRange = range.cloneRange();
  });

  editor.addEventListener("input", function (event) {
    normalizeEditorBlocks();
    var targetBlock = event.target.closest ? event.target.closest(".writer-math-block, .writer-embed-block") : null;
    if (targetBlock && targetBlock.classList.contains("writer-math-block")) renderMathBlock(targetBlock);
    if (targetBlock && targetBlock.classList.contains("writer-embed-block")) {
      clearTimeout(targetBlock._embedTimer);
      targetBlock._embedTimer = window.setTimeout(function () { renderEmbedBlock(targetBlock); }, 450);
    }

    var block = getCurrentBlock();
    if (block && !block.matches(".writer-special-block, .writer-media-block, .writer-toggle")) {
      var text = block.textContent || "";
      if (/^\//.test(text)) {
        openSlashMenu(block, text.slice(1));
      } else if (!slashMenu.hidden) {
        closeSlashMenu();
      }
    }
    updateCount();
    scheduleSave();
    schedulePreview();
  });

  editor.addEventListener("keydown", function (event) {
    if (!slashMenu.hidden) {
      var options = slashOptions.querySelectorAll(".writer-slash-option");
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (options.length) {
          slashSelectionIndex = (slashSelectionIndex + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
          options.forEach(function (option, index) {
            option.classList.toggle("is-selected", index === slashSelectionIndex);
            option.setAttribute("aria-selected", index === slashSelectionIndex ? "true" : "false");
          });
          selectedSlashButton().scrollIntoView({ block: "nearest" });
        }
        return;
      }
      if (event.key === "Enter" && options.length) {
        event.preventDefault();
        executeSlashCommand(selectedSlashButton().dataset.slashCommand);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeSlashMenu();
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey && !event.isComposing && !event.target.matches("textarea, input")) {
      var currentBlock = getCurrentBlock();
      var typedUrl = currentBlock && !currentBlock.matches(".writer-special-block, .writer-media-block, .writer-toggle")
        ? webUrlFromText(currentBlock.textContent)
        : "";
      if (typedUrl) {
        event.preventDefault();
        insertEmbedFromUrl(typedUrl, currentBlock);
      }
    }
  });

  editor.addEventListener("paste", function (event) {
    if (event.target.matches("textarea, input")) return;
    var files = event.clipboardData && event.clipboardData.files;
    if (files && Array.prototype.some.call(files, function (file) { return file.type.indexOf("image/") === 0; })) {
      event.preventDefault();
      insertMediaItems(files, getCurrentBlock());
      return;
    }
    var plainText = event.clipboardData && event.clipboardData.getData("text/plain");
    if (plainText) {
      var pastedUrl = plainText.indexOf("\n") === -1 ? webUrlFromText(plainText) : "";
      var currentBlock = getCurrentBlock();
      var currentBlockIsEmpty = currentBlock &&
        !currentBlock.matches(".writer-special-block, .writer-media-block, .writer-toggle") &&
        !(currentBlock.textContent || "").trim();
      if (pastedUrl && currentBlockIsEmpty) {
        event.preventDefault();
        insertEmbedFromUrl(pastedUrl, currentBlock);
        return;
      }
      event.preventDefault();
      document.execCommand("insertText", false, plainText);
    }
  });

  editor.addEventListener("keydown", function (event) {
    if (event.target.matches("textarea") && event.key === "Tab") {
      event.preventDefault();
      var start = event.target.selectionStart;
      var end = event.target.selectionEnd;
      event.target.value = event.target.value.slice(0, start) + "  " + event.target.value.slice(end);
      event.target.selectionStart = event.target.selectionEnd = start + 2;
      event.target.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  slashOptions.addEventListener("click", function (event) {
    var button = event.target.closest("[data-slash-command]");
    if (button) executeSlashCommand(button.dataset.slashCommand);
  });

  app.addEventListener("click", function (event) {
    var removeButton = event.target.closest("[data-remove-block]");
    if (!removeButton) return;
    var block = removeButton.closest(".writer-special-block, .writer-media-block");
    if (!block) return;
    if (block.dataset.mediaId) mediaStore.delete(block.dataset.mediaId);
    var next = block.nextElementSibling || block.previousElementSibling;
    block.remove();
    if (!editor.children.length) editor.appendChild(createParagraph());
    if (next && next.parentElement === editor) focusAtEnd(next);
    scheduleSave();
    schedulePreview();
    updateCount();
  });

  addBlockButton.addEventListener("click", function () {
    var paragraph = createParagraph();
    editor.appendChild(paragraph);
    focusAtEnd(paragraph);
    paragraph.textContent = "/";
    focusAtEnd(paragraph);
    openSlashMenu(paragraph, "");
    scheduleSave();
  });

  mediaInput.addEventListener("change", function () {
    insertMediaItems(mediaInput.files, pendingMediaReference).then(function () {
      mediaInput.value = "";
      pendingMediaReference = null;
    });
  });

  paper.addEventListener("dragenter", function (event) {
    if (!event.dataTransfer || !Array.prototype.some.call(event.dataTransfer.items || [], function (item) { return item.kind === "file"; })) return;
    event.preventDefault();
    dragDepth += 1;
    paper.classList.add("is-dragging");
  });

  paper.addEventListener("dragover", function (event) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  });

  paper.addEventListener("dragleave", function (event) {
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) paper.classList.remove("is-dragging");
  });

  paper.addEventListener("drop", function (event) {
    event.preventDefault();
    dragDepth = 0;
    paper.classList.remove("is-dragging");
    insertMediaItems(event.dataTransfer.files, getCurrentBlock());
  });

  [titleInput, excerptInput, categoryInput, tagsInput].forEach(function (input) {
    input.addEventListener("input", function () {
      if (input === excerptInput) autoResizeTextarea(excerptInput);
      scheduleSave();
      schedulePreview();
    });
  });

  previewToggle.addEventListener("click", function () { setPreview(previewPanel.hidden); });
  previewClose.addEventListener("click", function () { setPreview(false); });
  copyButton.addEventListener("click", copyMarkdown);
  exportButton.addEventListener("click", exportBundle);
  if (publishButton) publishButton.addEventListener("click", publishToGitHub);

  clearButton.addEventListener("click", function () {
    if (!window.confirm("현재 초안과 첨부한 미디어를 모두 비울까요?")) return;
    deleteDraft().catch(function () {}).finally(function () {
      resetEditor();
      setSaveState("saved", "새 초안");
      showToast("초안을 비웠습니다.");
    });
  });

  document.addEventListener("click", function (event) {
    if (!slashMenu.hidden && !slashMenu.contains(event.target) && !editor.contains(event.target) && event.target !== addBlockButton) {
      closeSlashMenu();
    }
  });

  window.addEventListener("resize", function () {
    if (!slashMenu.hidden && activeSlashBlock) positionSlashMenu(activeSlashBlock);
  }, { passive: true });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) saveDraftNow();
  });

  loadDraft().then(function (draft) {
    if (draft) {
      titleInput.value = draft.title || "";
      excerptInput.value = draft.excerpt || "";
      categoryInput.value = draft.category || "CS";
      tagsInput.value = draft.tags || "";
      if (draft.html) editor.innerHTML = draft.html;
      normalizeEditorBlocks();
      rebuildMediaStore();
      editor.querySelectorAll(".writer-math-block").forEach(renderMathBlock);
      editor.querySelectorAll(".writer-embed-block").forEach(renderEmbedBlock);
      setSaveState("saved", "초안을 불러옴");
    } else {
      setSaveState("saved", "새 초안");
    }
  }).catch(function () {
    setSaveState("error", "자동 저장 불가");
  }).finally(function () {
    autoResizeTextarea(excerptInput);
    updateCount();
  });
})();
