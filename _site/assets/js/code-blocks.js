(function () {
  "use strict";

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var input = document.createElement("textarea");
      input.value = text;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      try {
        if (!document.execCommand("copy")) throw new Error("copy failed");
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        input.remove();
      }
    });
  }

  function updateScrollHint(wrapper, pre) {
    wrapper.dataset.scrollHint = pre.scrollWidth > pre.clientWidth + 2 ? "true" : "false";
  }

  function enhanceCodeBlocks() {
    var content = document.getElementById("postContent");
    if (!content) return;

    content.querySelectorAll("pre").forEach(function (pre) {
      if (pre.parentElement && pre.parentElement.classList.contains("ide-code-wrap")) return;
      var code = pre.querySelector("code");
      var wrapper = document.createElement("div");
      wrapper.className = "ide-code-wrap";
      var isDiagram = code && /language-text|language-plaintext/.test(code.className) && /[↓↑↕⇄⇅→←┌┐└┘├┤┬┴│─]/.test(code.textContent);
      if (isDiagram) wrapper.classList.add("ide-diagram-card");

      var toolbar = document.createElement("div");
      toolbar.className = "ide-code-toolbar";
      var label = document.createElement("span");
      label.className = "ide-code-language";
      label.textContent = isDiagram ? "DIAGRAM" : (code && code.className.match(/language-([\w-]+)/) || ["", "CODE"])[1].toUpperCase();
      var copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "ide-copy-code";
      copyButton.setAttribute("aria-label", "코드 복사");
      copyButton.innerHTML = '<i class="ri-file-copy-line" aria-hidden="true"></i><span>복사</span>';
      copyButton.addEventListener("click", function () {
        copyText(code ? code.textContent : pre.textContent).then(function () {
          copyButton.classList.add("is-copied");
          copyButton.setAttribute("aria-label", "코드가 복사되었습니다");
          copyButton.innerHTML = '<i class="ri-check-line" aria-hidden="true"></i><span>복사됨</span>';
          window.setTimeout(function () {
            copyButton.classList.remove("is-copied");
            copyButton.setAttribute("aria-label", "코드 복사");
            copyButton.innerHTML = '<i class="ri-file-copy-line" aria-hidden="true"></i><span>복사</span>';
          }, 1600);
        }).catch(function () {
          copyButton.setAttribute("aria-label", "코드를 복사하지 못했습니다");
          copyButton.innerHTML = '<i class="ri-error-warning-line" aria-hidden="true"></i><span>실패</span>';
        });
      });

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(toolbar);
      toolbar.appendChild(label);
      toolbar.appendChild(copyButton);
      wrapper.appendChild(pre);
      window.requestAnimationFrame(function () { updateScrollHint(wrapper, pre); });
    });
  }

  document.addEventListener("ide:document-change", enhanceCodeBlocks);
  window.addEventListener("resize", function () {
    document.querySelectorAll(".ide-code-wrap").forEach(function (wrapper) {
      var pre = wrapper.querySelector("pre");
      if (pre) updateScrollHint(wrapper, pre);
    });
  }, { passive: true });
  enhanceCodeBlocks();
})();
