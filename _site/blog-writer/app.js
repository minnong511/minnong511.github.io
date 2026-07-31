(function () {
  'use strict';

  const STORAGE = {
    drafts: 'blog-writer-drafts-v1',
    settings: 'blog-writer-settings-v1'
  };

  const DEFAULT_SETTINGS = {
    defaultLayout: 'post',
    defaultAuthor: '',
    defaultCategory: '',
    defaultTags: '',
    dateFormat: 'YYYY-MM-DD HH:mm:ss',
    timezone: '+0900',
    defaultImagePath: '/assets/images/',
    editorTheme: 'paper',
    previewWidth: 'standard',
    autosaveInterval: 3000,
    frontMatterKeys: {
      layout: 'layout', title: 'title', date: 'date', author: 'author',
      categories: 'categories', tags: 'tags', image: 'image', published: 'published'
    }
  };

  const INSERTIONS = {
    heading: '## 소제목',
    bold: '**굵은 글씨**',
    italic: '*기울임 글씨*',
    quote: '> 인용문',
    ul: '- 목록 항목\n- 목록 항목',
    ol: '1. 목록 항목\n2. 목록 항목',
    link: '[링크 텍스트](https://example.com)',
    image: '![이미지 설명](/assets/images/example.png)',
    code: '```javascript\nconst message = "Hello, Jekyll!";\n```',
    table: '| 항목 | 설명 |\n| --- | --- |\n| 예시 | 내용 |',
    hr: '---'
  };

  const state = {
    drafts: readStorage(STORAGE.drafts, []),
    settings: Object.assign({}, DEFAULT_SETTINGS, readStorage(STORAGE.settings, {})),
    currentDraft: null,
    currentView: 'editor',
    mobilePanel: 'editor',
    sortAscending: false,
    slugManuallyEdited: false,
    isDirty: false,
    autosaveTimer: null,
    toastTimer: null,
    selectedImage: null
  };
  state.settings.frontMatterKeys = Object.assign({}, DEFAULT_SETTINGS.frontMatterKeys, state.settings.frontMatterKeys || {});
  state.settings.autosaveInterval = Number(state.settings.autosaveInterval) || DEFAULT_SETTINGS.autosaveInterval;
  state.drafts = Array.isArray(state.drafts) ? state.drafts.filter(Boolean).map(normalizeDraft) : [];

  const el = {};
  document.querySelectorAll('[id]').forEach(function (node) { el[node.id] = node; });

  function readStorage(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed === null ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      showToast('브라우저 저장 공간에 접근하지 못했습니다. 다운로드를 이용하세요.');
      return false;
    }
  }

  function nowParts() {
    const now = new Date();
    return {
      date: [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-'),
      time: [String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0'), String(now.getSeconds()).padStart(2, '0')].join(':'),
      timestamp: now.toISOString()
    };
  }

  function createDraft() {
    const parts = nowParts();
    return {
      id: 'draft-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      title: '', slug: '', date: parts.date, time: parts.time,
      author: state.settings.defaultAuthor || '', category: state.settings.defaultCategory || '',
      tags: state.settings.defaultTags || '', image: '',
      body: '', published: true, createdAt: parts.timestamp, updatedAt: parts.timestamp
    };
  }

  function normalizeDraft(draft) {
    const fresh = createDraft();
    return Object.assign(fresh, draft, {
      id: draft && draft.id ? String(draft.id) : fresh.id,
      title: draft && draft.title ? String(draft.title) : '',
      slug: draft && draft.slug ? String(draft.slug) : '',
      date: draft && draft.date ? String(draft.date) : fresh.date,
      time: draft && draft.time ? String(draft.time) : fresh.time,
      author: draft && draft.author ? String(draft.author) : '',
      category: draft && draft.category ? String(draft.category) : '',
      tags: draft && draft.tags ? String(draft.tags) : '',
      image: draft && draft.image ? String(draft.image) : '',
      body: draft && draft.body ? String(draft.body) : '',
      published: draft && typeof draft.published === 'boolean' ? draft.published : true,
      createdAt: draft && draft.createdAt ? draft.createdAt : fresh.createdAt,
      updatedAt: draft && draft.updatedAt ? draft.updatedAt : fresh.updatedAt
    });
  }

  function safeDrafts() {
    return Array.isArray(state.drafts) ? state.drafts.map(normalizeDraft) : [];
  }

  function slugify(value) {
    return String(value || '').normalize('NFKC').toLowerCase()
      .replace(/[’'"“”]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90);
  }

  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parts = value.split('-').map(Number);
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return !Number.isNaN(date.getTime()) && date.getUTCFullYear() === parts[0] && date.getUTCMonth() === parts[1] - 1 && date.getUTCDate() === parts[2];
  }

  function validTime(value) { return /^\d{2}:\d{2}(:\d{2})?$/.test(value); }

  function validationError(draft) {
    if (!draft.title.trim()) return '제목을 입력하면 초안을 저장할 수 있습니다.';
    if (!validDate(draft.date)) return '작성일을 올바른 날짜로 입력하세요.';
    if (!validTime(draft.time)) return '작성 시간을 올바른 형식으로 입력하세요.';
    if (!slugify(draft.slug)) return '파일명용 slug를 입력하세요.';
    return '';
  }

  function draftFilename(draft) {
    const date = validDate(draft.date) ? draft.date : 'draft';
    const slug = slugify(draft.slug) || 'post';
    return date + '-' + slug + '.md';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function safeUrl(value) {
    const candidate = String(value || '').trim();
    if (!candidate || /^(javascript|vbscript|data):/i.test(candidate)) return '#';
    if (/^(https?:|mailto:|tel:|\/|\.\/|\.\.\/|#)/i.test(candidate)) return candidate;
    return '#';
  }

  function renderInline(value) {
    let html = escapeHtml(value);
    const tokens = [];
    function token(content) { tokens.push(content); return '___BLOG_WRITER_TOKEN_' + (tokens.length - 1) + '___'; }
    html = html.replace(/`([^`\n]+)`/g, function (_, content) { return token('<code>' + content + '</code>'); });
    html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, function (_, alt, url, title) {
      const titleAttr = title ? ' title="' + escapeHtml(title) + '"' : '';
      return token('<img src="' + escapeHtml(safeUrl(url)) + '" alt="' + alt + '"' + titleAttr + '>');
    });
    html = html.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, function (_, text, url, title) {
      const titleAttr = title ? ' title="' + escapeHtml(title) + '"' : '';
      return token('<a href="' + escapeHtml(safeUrl(url)) + '" target="_blank" rel="noopener noreferrer"' + titleAttr + '>' + text + '</a>');
    });
    html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');
    return html.replace(/___BLOG_WRITER_TOKEN_(\d+)___/g, function (_, index) { return tokens[Number(index)]; });
  }

  function splitTableRow(line) {
    let value = line.trim();
    if (value.startsWith('|')) value = value.slice(1);
    if (value.endsWith('|')) value = value.slice(0, -1);
    return value.split('|').map(function (cell) { return cell.trim(); });
  }

  function isTableDivider(line) { return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line); }

  function renderMarkdown(markdown) {
    const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
    const output = [];
    let index = 0;
    while (index < lines.length) {
      const line = lines[index];
      if (/^\s*$/.test(line)) { index += 1; continue; }
      if (/^\s*```/.test(line)) {
        const language = line.replace(/^\s*```/, '').trim();
        const code = [];
        index += 1;
        while (index < lines.length && !/^\s*```/.test(lines[index])) { code.push(lines[index]); index += 1; }
        if (index < lines.length) index += 1;
        const className = language ? ' class="language-' + escapeHtml(slugify(language)) + '"' : '';
        output.push('<pre><code' + className + '>' + escapeHtml(code.join('\n')) + '</code></pre>');
        continue;
      }
      const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (heading) { const level = heading[1].length; output.push('<h' + level + '>' + renderInline(heading[2]) + '</h' + level + '>'); index += 1; continue; }
      if (/^\s*((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})$/.test(line)) { output.push('<hr>'); index += 1; continue; }
      if (line.includes('|') && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
        const headerCells = splitTableRow(line); index += 2; const rows = [];
        while (index < lines.length && lines[index].includes('|') && !/^\s*$/.test(lines[index])) { rows.push(splitTableRow(lines[index])); index += 1; }
        output.push('<table><thead><tr>' + headerCells.map(function (cell) { return '<th>' + renderInline(cell) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (row) { return '<tr>' + headerCells.map(function (_, cellIndex) { return '<td>' + renderInline(row[cellIndex] || '') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>');
        continue;
      }
      if (/^\s*>/.test(line)) {
        const quote = [];
        while (index < lines.length && /^\s*>/.test(lines[index])) { quote.push(lines[index].replace(/^\s*>\s?/, '')); index += 1; }
        output.push('<blockquote>' + quote.map(renderInline).join('<br>') + '</blockquote>'); continue;
      }
      const listMatch = line.match(/^\s*([-+*]|\d+[.)])\s+(.+)$/);
      if (listMatch) {
        const ordered = /^\d/.test(listMatch[1]); const items = [];
        while (index < lines.length) {
          const item = lines[index].match(/^\s*([-+*]|\d+[.)])\s+(.+)$/);
          if (!item || /^\d/.test(item[1]) !== ordered) break;
          items.push('<li>' + renderInline(item[2]) + '</li>'); index += 1;
        }
        output.push('<' + (ordered ? 'ol' : 'ul') + '>' + items.join('') + '</' + (ordered ? 'ol' : 'ul') + '>'); continue;
      }
      const paragraph = [line]; index += 1;
      while (index < lines.length && !/^\s*$/.test(lines[index]) && !/^\s*```/.test(lines[index]) && !/^\s*(#{1,6})\s+/.test(lines[index]) && !/^\s*>/.test(lines[index]) && !/^\s*([-+*]|\d+[.)])\s+/.test(lines[index])) { paragraph.push(lines[index]); index += 1; }
      output.push('<p>' + paragraph.map(renderInline).join('<br>') + '</p>');
    }
    return output.join('\n') || '<p class="blog-writer-empty-preview">미리보기에 표시할 내용이 없습니다.</p>';
  }

  function yamlQuote(value) { return '"' + String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ') + '"'; }
  function safeFrontMatterKey(value, fallback) { const key = String(value || '').trim().replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 40); return key || fallback; }
  function listValue(value) { return String(value || '').split(',').map(function (item) { return item.trim(); }).filter(Boolean); }

  function formattedDate(draft) {
    const date = draft.date;
    const time = draft.time || '00:00:00';
    const format = state.settings.dateFormat;
    if (format === 'YYYY-MM-DD') return date;
    const normalizedTime = time.length === 5 ? time + ':00' : time;
    const separator = format.startsWith('YYYY/MM') ? '/' : '-';
    return date.replace(/-/g, separator) + ' ' + normalizedTime + ' ' + (state.settings.timezone || '+0000');
  }

  function generateFrontMatter(draft) {
    const keys = state.settings.frontMatterKeys;
    const lines = ['---'];
    const add = function (key, value) { if (value !== '' && value !== null && value !== undefined) lines.push(keys[key] + ': ' + value); };
    add('layout', yamlQuote(state.settings.defaultLayout || 'post'));
    add('title', yamlQuote(draft.title.trim()));
    add('date', yamlQuote(formattedDate(draft)));
    add('author', draft.author.trim() ? yamlQuote(draft.author.trim()) : '');
    const categories = listValue(draft.category); if (categories.length) add('categories', '[' + categories.map(yamlQuote).join(', ') + ']');
    const tags = listValue(draft.tags); if (tags.length) add('tags', '[' + tags.map(yamlQuote).join(', ') + ']');
    add('image', draft.image.trim() ? yamlQuote(draft.image.trim()) : '');
    add('published', draft.published ? 'true' : 'false');
    lines.push('---', '');
    return lines.join('\n');
  }

  function markdownForExport() {
    const draft = state.currentDraft;
    const error = validationError(draft);
    if (error) { showFormError(error); return ''; }
    return (el.includeFrontMatter.checked ? generateFrontMatter(draft) : '') + draft.body.replace(/^\s+/, '') + '\n';
  }

  function setCurrentDraft(draft) {
    state.currentDraft = normalizeDraft(draft);
    state.slugManuallyEdited = Boolean(state.currentDraft.slug && state.currentDraft.slug !== slugify(state.currentDraft.title));
    state.isDirty = false;
    renderAll();
  }

  function saveDraft(options) {
    const settings = options || {};
    if (!state.currentDraft) state.currentDraft = createDraft();
    const error = validationError(state.currentDraft);
    if (error) { showFormError(error); if (settings.manual) showToast(error); return false; }
    state.currentDraft.slug = slugify(state.currentDraft.slug);
    state.currentDraft.updatedAt = new Date().toISOString();
    const existingIndex = state.drafts.findIndex(function (draft) { return draft.id === state.currentDraft.id; });
    if (existingIndex >= 0) state.drafts[existingIndex] = normalizeDraft(state.currentDraft); else state.drafts.unshift(normalizeDraft(state.currentDraft));
    state.drafts = safeDrafts();
    writeStorage(STORAGE.drafts, state.drafts);
    state.isDirty = false;
    renderAll();
    if (settings.manual) showToast('초안을 저장했습니다.');
    return true;
  }

  function scheduleAutosave() {
    window.clearTimeout(state.autosaveTimer);
    state.autosaveTimer = window.setTimeout(function () {
      if (state.currentDraft && !validationError(state.currentDraft)) saveDraft({ manual: false });
      else updateSaveState('제목과 slug를 입력하면 자동 저장됩니다.');
    }, state.settings.autosaveInterval);
  }

  function updateSaveState(message) { el.saveState.textContent = message; }
  function savedStateLabel() {
    const isSaved = state.currentDraft && state.drafts.some(function (draft) { return draft.id === state.currentDraft.id; });
    if (!isSaved) return '새 글을 준비했습니다';
    const savedAt = new Date(state.currentDraft.updatedAt);
    return Number.isNaN(savedAt.getTime()) ? '마지막 저장 내용' : '저장됨 · ' + savedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  function showFormError(message) { el.formError.textContent = message || ''; }
  function showToast(message) { el.toast.textContent = message; el.toast.classList.add('blog-writer-toast-visible'); window.clearTimeout(state.toastTimer); state.toastTimer = window.setTimeout(function () { el.toast.classList.remove('blog-writer-toast-visible'); }, 2600); }

  function dateLabel(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value.slice(0, 10);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }

  function renderDraftList() {
    const query = el.draftSearch.value.trim().toLowerCase();
    const category = el.categoryFilter.value;
    const field = el.sortField.value;
    const drafts = state.drafts.filter(function (draft) {
      const haystack = [draft.title, draft.tags, draft.category].join(' ').toLowerCase();
      return (!query || haystack.includes(query)) && (!category || draft.category === category);
    }).sort(function (a, b) {
      const left = field === 'title' ? a.title.toLowerCase() : (field === 'date' ? a.date : a.updatedAt);
      const right = field === 'title' ? b.title.toLowerCase() : (field === 'date' ? b.date : b.updatedAt);
      const comparison = left.localeCompare(right, 'ko');
      return state.sortAscending ? comparison : -comparison;
    });
    el.draftCount.textContent = '초안 ' + drafts.length + '개';
    el.draftList.innerHTML = drafts.map(function (draft) {
      const active = state.currentDraft && state.currentDraft.id === draft.id;
      return '<article class="blog-writer-draft-item ' + (active ? 'blog-writer-draft-item-active' : '') + '">' +
        '<button class="blog-writer-draft-load" type="button" data-draft-id="' + escapeHtml(draft.id) + '" aria-label="' + escapeHtml(draft.title || '제목 없는 초안') + ' 불러오기"></button>' +
        '<strong class="blog-writer-draft-item-title">' + escapeHtml(draft.title || '제목 없는 초안') + '</strong>' +
        '<div class="blog-writer-draft-item-meta"><span>' + escapeHtml(draft.category || '카테고리 없음') + '</span><span>' + dateLabel(draft.updatedAt) + '</span><span class="blog-writer-draft-item-status">' + (draft.published ? '공개' : '비공개') + '</span></div>' +
        '<button class="blog-writer-draft-delete" type="button" data-delete-draft-id="' + escapeHtml(draft.id) + '" aria-label="초안 삭제">×</button></article>';
    }).join('');
    el.draftEmptyState.classList.toggle('blog-writer-hidden', drafts.length > 0);
  }

  function renderCategoryFilter() {
    const current = el.categoryFilter.value;
    const categories = Array.from(new Set(state.drafts.map(function (draft) { return draft.category; }).filter(Boolean))).sort(function (a, b) { return a.localeCompare(b, 'ko'); });
    el.categoryFilter.innerHTML = '<option value="">모든 카테고리</option>' + categories.map(function (category) { return '<option value="' + escapeHtml(category) + '">' + escapeHtml(category) + '</option>'; }).join('');
    el.categoryFilter.value = categories.includes(current) ? current : '';
  }

  function renderForm() {
    const draft = state.currentDraft;
    el.postTitle.value = draft.title; el.postSlug.value = draft.slug; el.postDate.value = draft.date; el.postTime.value = draft.time;
    el.postAuthor.value = draft.author; el.postCategory.value = draft.category; el.postTags.value = draft.tags; el.postImage.value = draft.image; el.postBody.value = draft.body; el.postPublished.checked = draft.published;
    el.filenamePrefix.textContent = (validDate(draft.date) ? draft.date : 'YYYY-MM-DD') + '-';
    el.filePreview.textContent = validationError(draft) ? '제목과 slug 입력 후 파일명이 표시됩니다.' : draftFilename(draft);
    el.draftIdentifier.textContent = draft.id ? draft.id.slice(-8).toUpperCase() : 'UNSAVED';
    renderPreview(); updateCursorPosition(); updateWordCount(); showFormError('');
    el.imagePathHint.textContent = '권장 경로: ' + (state.settings.defaultImagePath || '/assets/images/');
  }

  function renderPreview() { el.postPreview.innerHTML = renderMarkdown(state.currentDraft.body); el.postPreview.classList.toggle('blog-writer-preview-width-wide', state.settings.previewWidth === 'wide'); el.postPreview.classList.toggle('blog-writer-preview-width-narrow', state.settings.previewWidth === 'narrow'); }

  function renderAll() { renderForm(); renderCategoryFilter(); renderDraftList(); document.querySelector('.blog-writer-app').classList.toggle('blog-writer-editor-theme-midnight', state.settings.editorTheme === 'midnight'); updateSaveState(state.isDirty ? '저장되지 않은 변경사항' : savedStateLabel()); }

  function collectForm() {
    const beforeSlug = state.currentDraft.slug;
    state.currentDraft.title = el.postTitle.value;
    if (!state.slugManuallyEdited || !beforeSlug) { state.currentDraft.slug = slugify(state.currentDraft.title); el.postSlug.value = state.currentDraft.slug; }
    else state.currentDraft.slug = el.postSlug.value;
    state.currentDraft.date = el.postDate.value; state.currentDraft.time = el.postTime.value; state.currentDraft.author = el.postAuthor.value; state.currentDraft.category = el.postCategory.value; state.currentDraft.tags = el.postTags.value; state.currentDraft.image = el.postImage.value; state.currentDraft.body = el.postBody.value; state.currentDraft.published = el.postPublished.checked;
    el.filenamePrefix.textContent = (validDate(state.currentDraft.date) ? state.currentDraft.date : 'YYYY-MM-DD') + '-';
    el.filePreview.textContent = validationError(state.currentDraft) ? '제목과 slug 입력 후 파일명이 표시됩니다.' : draftFilename(state.currentDraft);
  }

  function handleFormChange() { collectForm(); state.isDirty = true; updateSaveState('작성 중 · 자동 저장 대기'); renderPreview(); updateCursorPosition(); updateWordCount(); scheduleAutosave(); }
  function updateCursorPosition() { const value = el.postBody.value.slice(0, el.postBody.selectionStart || 0); const lines = value.split('\n'); el.cursorPosition.textContent = '줄 ' + lines.length + ', 열 ' + (lines[lines.length - 1].length + 1); }
  function updateWordCount() { const text = el.postBody.value.trim(); const words = text ? text.split(/\s+/).length : 0; el.wordCount.textContent = text.length + '자 · ' + words + '단어'; }

  function insertAtCursor(text) {
    const input = el.postBody; const start = input.selectionStart; const end = input.selectionEnd; const selected = input.value.slice(start, end); const replacement = text.replace(/\{selection\}/g, selected || '내용');
    input.setRangeText(replacement, start, end, 'select'); input.focus(); handleFormChange();
  }

  function handleTab(event) {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const input = el.postBody; const start = input.selectionStart; const end = input.selectionEnd;
    if (start !== end && input.value.slice(start, end).includes('\n')) {
      const lineStart = input.value.lastIndexOf('\n', start - 1) + 1; const selected = input.value.slice(lineStart, end); const indented = selected.split('\n').map(function (line) { return '  ' + line; }).join('\n');
      input.setRangeText(indented, lineStart, end, 'select');
    } else { input.setRangeText('  ', start, end, 'end'); }
    handleFormChange();
  }

  function downloadBlob(filename, content, type) {
    const blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function downloadMarkdown() { const content = markdownForExport(); if (!content) return; downloadBlob(draftFilename(state.currentDraft), content, 'text/markdown;charset=utf-8'); showToast('Markdown 파일을 다운로드했습니다.'); }
  function exportHtmlDocument() { const content = '<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + escapeHtml(state.currentDraft.title) + '</title><style>body{max-width:780px;margin:48px auto;padding:0 20px;font:16px/1.8 system-ui,sans-serif;color:#17201d}img{max-width:100%}pre{padding:16px;overflow:auto;background:#1e2b27;color:#e9f3ee;border-radius:8px}code{background:#e4f0eb;padding:2px 5px;border-radius:4px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #dfe6e1;padding:8px;text-align:left}th{background:#e4f0eb}</style></head><body>' + renderMarkdown(state.currentDraft.body) + '</body></html>'; return content; }
  function downloadHtml() { if (!validateForAction()) return; downloadBlob(draftFilename(state.currentDraft).replace(/\.md$/, '.html'), exportHtmlDocument(), 'text/html;charset=utf-8'); showToast('HTML 미리보기를 저장했습니다.'); }
  function validateForAction() { collectForm(); const error = validationError(state.currentDraft); if (error) { showFormError(error); showToast(error); return false; } return true; }

  async function saveToFolder() {
    if (!validateForAction()) return;
    if (!window.showDirectoryPicker) { downloadMarkdown(); showToast('이 브라우저는 폴더 저장을 지원하지 않아 다운로드로 처리했습니다.'); return; }
    try {
      const directory = await window.showDirectoryPicker({ mode: 'readwrite' }); const fileHandle = await directory.getFileHandle(draftFilename(state.currentDraft), { create: true }); const writable = await fileHandle.createWritable(); await writable.write(markdownForExport()); await writable.close(); showToast('선택한 폴더에 저장했습니다.');
    } catch (error) { if (error && error.name !== 'AbortError') showToast('폴더 저장에 실패했습니다. 일반 다운로드를 이용하세요.'); }
  }

  async function copyMarkdown() { const content = markdownForExport(); if (!content) return; try { await navigator.clipboard.writeText(content); showToast('Markdown 전체를 클립보드에 복사했습니다.'); } catch (error) { const helper = document.createElement('textarea'); helper.value = content; document.body.appendChild(helper); helper.select(); document.execCommand('copy'); helper.remove(); showToast('Markdown 전체를 복사했습니다.'); } }

  function openPreviewWindow() { if (!validateForAction()) return; const previewWindow = window.open('', '_blank', 'noopener,noreferrer'); if (!previewWindow) { showToast('새 창이 차단되었습니다. 브라우저 팝업을 허용하세요.'); return; } previewWindow.document.write(exportHtmlDocument()); previewWindow.document.close(); }

  function newDraft() { if (state.isDirty && !window.confirm('저장되지 않은 변경사항이 있습니다. 새 글을 시작할까요?')) return; setCurrentDraft(createDraft()); showToast('새 글을 준비했습니다.'); }
  function loadDraft(id) { if (state.currentDraft && state.currentDraft.id === id) return; if (state.isDirty && !window.confirm('저장되지 않은 변경사항이 있습니다. 다른 초안을 불러올까요?')) return; const draft = state.drafts.find(function (item) { return item.id === id; }); if (draft) { setCurrentDraft(draft); showToast('초안을 불러왔습니다.'); setMobilePanel('editor'); } }
  function deleteDraft(id) { const draft = state.drafts.find(function (item) { return item.id === id; }); if (!draft || !window.confirm('“' + (draft.title || '제목 없는 초안') + '”을 삭제할까요?')) return; state.drafts = state.drafts.filter(function (item) { return item.id !== id; }); writeStorage(STORAGE.drafts, state.drafts); if (state.currentDraft && state.currentDraft.id === id) setCurrentDraft(createDraft()); else renderAll(); showToast('초안을 삭제했습니다.'); }
  function deleteCurrentDraft() { if (state.currentDraft && state.drafts.some(function (draft) { return draft.id === state.currentDraft.id; })) deleteDraft(state.currentDraft.id); else showToast('삭제할 저장 초안이 없습니다.'); }
  function resetDraft() { if (!window.confirm('현재 글의 모든 내용을 초기화할까요?')) return; setCurrentDraft(createDraft()); showToast('현재 글을 초기화했습니다.'); }

  function openSettings() { const form = el.settingsForm; Object.keys(state.settings).forEach(function (key) { if (key === 'frontMatterKeys') return; const field = form.elements[key]; if (field) field.value = state.settings[key]; }); Object.keys(state.settings.frontMatterKeys).forEach(function (key) { if (form.elements['key' + key.charAt(0).toUpperCase() + key.slice(1)]) form.elements['key' + key.charAt(0).toUpperCase() + key.slice(1)].value = state.settings.frontMatterKeys[key]; }); el.settingsDialog.showModal(); }
  function saveSettings() { const form = el.settingsForm; ['defaultLayout', 'defaultAuthor', 'defaultCategory', 'defaultTags', 'dateFormat', 'timezone', 'defaultImagePath', 'editorTheme', 'previewWidth'].forEach(function (key) { state.settings[key] = form.elements[key].value.trim(); }); state.settings.autosaveInterval = Number(form.elements.autosaveInterval.value) || 3000; Object.keys(state.settings.frontMatterKeys).forEach(function (key) { const field = form.elements['key' + key.charAt(0).toUpperCase() + key.slice(1)]; if (field && field.value.trim()) state.settings.frontMatterKeys[key] = safeFrontMatterKey(field.value, DEFAULT_SETTINGS.frontMatterKeys[key]); }); writeStorage(STORAGE.settings, state.settings); renderAll(); showToast('설정을 저장했습니다.'); }

  function openImageHelper() { const form = el.imageForm; form.reset(); el.imagePreviewBox.innerHTML = '<span>선택한 이미지 미리보기</span>'; state.selectedImage = null; el.imageDialog.showModal(); }
  function previewSelectedImage(file) { if (!file || !file.type.startsWith('image/')) return; state.selectedImage = file; const url = URL.createObjectURL(file); el.imagePreviewBox.innerHTML = '<img src="' + escapeHtml(url) + '" alt="선택한 이미지 미리보기">'; if (!el.imageForm.elements.filename.value) el.imageForm.elements.filename.value = file.name; }
  function insertImage() { const form = el.imageForm; const alt = form.elements.alt.value.trim() || form.elements.filename.value.trim() || '이미지'; let path = form.elements.path.value.trim(); const filename = form.elements.filename.value.trim(); if (!path && filename) path = (state.settings.defaultImagePath || '/assets/images/').replace(/\/$/, '') + '/' + filename; if (!path) { showToast('이미지 경로 또는 파일명을 입력하세요.'); return; } insertAtCursor('![' + alt + '](' + path + ')'); el.imageDialog.close(); showToast('이미지 Markdown을 본문에 삽입했습니다.'); }
  function downloadImage() { if (!state.selectedImage) { showToast('먼저 이미지 파일을 선택하세요.'); return; } const filename = el.imageForm.elements.filename.value.trim() || state.selectedImage.name; downloadBlob(filename, state.selectedImage, state.selectedImage.type); showToast('이미지를 별도 다운로드했습니다.'); }

  function setView(view) { state.currentView = view; const preview = view === 'preview'; el.postBody.classList.toggle('blog-writer-hidden', preview); el.postPreview.classList.toggle('blog-writer-hidden', !preview); document.querySelectorAll('[data-view]').forEach(function (button) { const active = button.dataset.view === view; button.classList.toggle('blog-writer-view-tab-active', active); button.setAttribute('aria-selected', String(active)); }); if (preview) renderPreview(); }
  function setMobilePanel(panel) { state.mobilePanel = panel; el.draftsPanel.classList.toggle('blog-writer-mobile-panel-visible', panel === 'drafts'); el.inspectorPanel.classList.toggle('blog-writer-mobile-panel-visible', panel === 'inspector'); el.editorPanel.classList.toggle('blog-writer-mobile-panel-hidden', panel !== 'editor'); document.querySelectorAll('[data-mobile-panel]').forEach(function (button) { button.classList.toggle('blog-writer-mobile-nav-active', button.dataset.mobilePanel === panel); }); if (panel === 'inspector') el.inspectorPanel.classList.add('blog-writer-inspector-open'); }

  document.addEventListener('click', function (event) {
    const actionElement = event.target.closest('[data-action]');
    if (actionElement) {
      const action = actionElement.dataset.action;
      if (action === 'saveDraft') saveDraft({ manual: true }); else if (action === 'newDraft') newDraft(); else if (action === 'openSettings') openSettings(); else if (action === 'saveSettings') saveSettings(); else if (action === 'downloadMarkdown') downloadMarkdown(); else if (action === 'saveToFolder') saveToFolder(); else if (action === 'copyMarkdown') copyMarkdown(); else if (action === 'downloadHtml') downloadHtml(); else if (action === 'openPreviewWindow') openPreviewWindow(); else if (action === 'openImageHelper') openImageHelper(); else if (action === 'insertImage') insertImage(); else if (action === 'downloadImage') downloadImage(); else if (action === 'deleteCurrentDraft') deleteCurrentDraft(); else if (action === 'resetDraft') resetDraft(); else if (action === 'toggleDrafts') setMobilePanel('drafts'); else if (action === 'closeInspector') { el.inspectorPanel.classList.remove('blog-writer-inspector-open'); setMobilePanel('editor'); }
    }
    const draftButton = event.target.closest('[data-draft-id]'); if (draftButton) loadDraft(draftButton.dataset.draftId);
    const deleteButton = event.target.closest('[data-delete-draft-id]'); if (deleteButton) { event.stopPropagation(); deleteDraft(deleteButton.dataset.deleteDraftId); }
    const insertButton = event.target.closest('[data-insert]'); if (insertButton) insertAtCursor(INSERTIONS[insertButton.dataset.insert]);
    const viewButton = event.target.closest('[data-view]'); if (viewButton) setView(viewButton.dataset.view);
    const mobileButton = event.target.closest('[data-mobile-panel]'); if (mobileButton) setMobilePanel(mobileButton.dataset.mobilePanel);
  });

  ['postTitle', 'postSlug', 'postDate', 'postTime', 'postAuthor', 'postCategory', 'postTags', 'postImage', 'postBody', 'postPublished'].forEach(function (id) { el[id].addEventListener('input', handleFormChange); el[id].addEventListener('change', handleFormChange); });
  el.postTitle.addEventListener('input', function () { if (!state.slugManuallyEdited) { state.currentDraft.slug = slugify(el.postTitle.value); el.postSlug.value = state.currentDraft.slug; } });
  el.postSlug.addEventListener('input', function () { state.slugManuallyEdited = true; });
  el.postBody.addEventListener('keydown', handleTab); ['keyup', 'click', 'select'].forEach(function (eventName) { el.postBody.addEventListener(eventName, updateCursorPosition); });
  ['input', 'change'].forEach(function (eventName) { el.draftSearch.addEventListener(eventName, renderDraftList); el.categoryFilter.addEventListener(eventName, renderDraftList); el.sortField.addEventListener(eventName, renderDraftList); });
  el.sortOrderButton.addEventListener('click', function () { state.sortAscending = !state.sortAscending; el.sortOrderButton.textContent = state.sortAscending ? '↑' : '↓'; el.sortOrderButton.setAttribute('aria-label', state.sortAscending ? '최신 순으로 정렬' : '오래된 순으로 정렬'); renderDraftList(); });
  el.imageFile.addEventListener('change', function () { previewSelectedImage(el.imageFile.files[0]); });
  window.addEventListener('beforeunload', function (event) { if (state.isDirty) { event.preventDefault(); event.returnValue = ''; } });

  el.editorPanel = document.querySelector('.blog-writer-editor-panel');
  if (!state.drafts.length) state.currentDraft = createDraft(); else setCurrentDraft(state.drafts[0]);
  if (!state.currentDraft) state.currentDraft = createDraft();
  renderAll();
}());
