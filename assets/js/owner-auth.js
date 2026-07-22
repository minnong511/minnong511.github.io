(function () {
  "use strict";

  var gate = document.getElementById("ownerGate");
  var app = document.getElementById("writerApp");
  var form = document.getElementById("ownerLoginForm");
  var tokenInput = document.getElementById("ownerToken");
  var loginButton = document.getElementById("ownerLoginButton");
  var loginStatus = document.getElementById("ownerLoginStatus");
  var logoutButton = document.getElementById("writerLogout");

  if (!gate || !app || !form || !tokenInput || !loginButton) return;

  var config = {
    owner: (document.body.dataset.ownerLogin || "minnong511").trim(),
    repository: (document.body.dataset.ownerRepository || "minnong511.github.io").trim(),
    branch: (document.body.dataset.ownerBranch || "master").trim()
  };
  var apiRoot = "https://api.github.com";
  var secureFetch = window.fetch.bind(window);
  var accessToken = "";
  var ownerProfile = null;

  function setStatus(mode, message) {
    loginStatus.className = "owner-login-status" + (mode ? " is-" + mode : "");
    loginStatus.textContent = message || "";
  }

  function setLoading(loading) {
    loginButton.disabled = loading;
    loginButton.innerHTML = loading
      ? '<span>GitHub 확인 중</span><i class="ri-loader-4-line"></i>'
      : '<span>소유자 인증</span><i class="ri-arrow-right-line"></i>';
  }

  function githubRequest(path, options, token) {
    var requestOptions = options || {};
    var headers = Object.assign({
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer " + token,
      "X-GitHub-Api-Version": "2022-11-28"
    }, requestOptions.headers || {});

    if (requestOptions.body && typeof requestOptions.body !== "string") {
      headers["Content-Type"] = "application/json";
      requestOptions.body = JSON.stringify(requestOptions.body);
    }

    requestOptions.headers = headers;

    return secureFetch(apiRoot + path, requestOptions).then(function (response) {
      return response.text().then(function (raw) {
        var data = null;
        try { data = raw ? JSON.parse(raw) : {}; } catch (error) { data = { message: raw }; }
        if (!response.ok) {
          var requestError = new Error((data && data.message) || "GitHub 요청에 실패했습니다.");
          requestError.status = response.status;
          requestError.details = data;
          throw requestError;
        }
        return data;
      });
    });
  }

  function unlockEditor(profile) {
    ownerProfile = profile;
    gate.hidden = true;
    app.hidden = false;
    app.removeAttribute("inert");
    document.body.classList.add("owner-authenticated");
    document.querySelectorAll("[data-owner-only]").forEach(function (element) {
      element.hidden = false;
    });
    window.dispatchEvent(new CustomEvent("minnong-owner-authenticated", {
      detail: { login: profile.login, name: profile.name || profile.login }
    }));
    var title = document.getElementById("writerTitle");
    if (title) window.setTimeout(function () { title.focus(); }, 80);
  }

  function lockEditor(message) {
    accessToken = "";
    ownerProfile = null;
    document.body.classList.remove("owner-authenticated");
    document.querySelectorAll("[data-owner-only]").forEach(function (element) {
      element.hidden = true;
    });
    app.hidden = true;
    app.setAttribute("inert", "");
    gate.hidden = false;
    tokenInput.value = "";
    setStatus(message ? "info" : "", message || "");
    window.setTimeout(function () { tokenInput.focus(); }, 80);
  }

  function authenticate(candidate) {
    return githubRequest("/user", { method: "GET" }, candidate).then(function (profile) {
      if (!profile || String(profile.login || "").toLowerCase() !== config.owner.toLowerCase()) {
        throw new Error("이 편집기는 @" + config.owner + " 계정만 사용할 수 있습니다.");
      }

      return githubRequest(
        "/repos/" + encodeURIComponent(config.owner) + "/" + encodeURIComponent(config.repository),
        { method: "GET" },
        candidate
      ).then(function (repository) {
        if (!repository.permissions || repository.permissions.push !== true) {
          throw new Error("이 토큰에는 저장소 Contents 쓰기 권한이 없습니다.");
        }
        return profile;
      });
    });
  }

  function utf8ToBase64(value) {
    var bytes = new TextEncoder().encode(value);
    var binary = "";
    var chunkSize = 0x8000;
    for (var offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + chunkSize));
    }
    return window.btoa(binary);
  }

  function mediaBase64(dataUrl) {
    var comma = String(dataUrl || "").indexOf(",");
    if (comma < 0) throw new Error("이미지 데이터를 읽을 수 없습니다.");
    var header = dataUrl.slice(0, comma);
    var payload = dataUrl.slice(comma + 1);
    if (/;base64/i.test(header)) return payload.replace(/\s/g, "");
    return utf8ToBase64(decodeURIComponent(payload));
  }

  function assertPublishBundle(bundle) {
    if (!bundle || !bundle.title || !bundle.markdown) throw new Error("게시할 글 내용이 없습니다.");
    if (!/^[a-zA-Z0-9가-힣_-]+$/.test(bundle.category || "")) throw new Error("카테고리 이름을 확인해 주세요.");
    if (!/^[a-z0-9가-힣-]+$/.test(bundle.slug || "")) throw new Error("게시물 주소를 만들 수 없습니다.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bundle.date || "")) throw new Error("게시 날짜 형식이 올바르지 않습니다.");

    var estimatedBytes = new TextEncoder().encode(bundle.markdown).length;
    (bundle.media || []).forEach(function (item) {
      if (!/^assets\/posts\/[a-z0-9가-힣-]+\/[a-zA-Z0-9가-힣_.-]+$/.test(item.path || "")) {
        throw new Error("업로드 이미지 경로를 확인해 주세요.");
      }
      estimatedBytes += Math.ceil(String(item.dataUrl || "").length * 0.75);
    });
    if (estimatedBytes > 24 * 1024 * 1024) throw new Error("한 번에 게시할 수 있는 전체 용량은 24MB입니다.");
  }

  function createBlob(content, encoding) {
    return githubRequest(
      "/repos/" + encodeURIComponent(config.owner) + "/" + encodeURIComponent(config.repository) + "/git/blobs",
      {
        method: "POST",
        body: { content: content, encoding: encoding || "base64" }
      },
      accessToken
    );
  }

  function publishBundle(bundle) {
    if (!accessToken || !ownerProfile) return Promise.reject(new Error("소유자 인증이 만료되었습니다. 다시 로그인해 주세요."));
    assertPublishBundle(bundle);

    var repoPath = "/repos/" + encodeURIComponent(config.owner) + "/" + encodeURIComponent(config.repository);
    var refPath = repoPath + "/git/ref/heads/" + encodeURIComponent(config.branch);
    var postPath = "_posts/" + bundle.category + "/" + bundle.date + "-" + bundle.slug + ".md";

    return githubRequest(refPath, { method: "GET" }, accessToken).then(function (reference) {
      var parentSha = reference.object.sha;
      return githubRequest(repoPath + "/git/commits/" + parentSha, { method: "GET" }, accessToken).then(function (commit) {
        return { parentSha: parentSha, baseTreeSha: commit.tree.sha };
      });
    }).then(function (base) {
      var blobJobs = [{
        path: postPath,
        promise: createBlob(utf8ToBase64(bundle.markdown), "base64")
      }];

      (bundle.media || []).forEach(function (item) {
        blobJobs.push({ path: item.path, promise: createBlob(mediaBase64(item.dataUrl), "base64") });
      });

      return Promise.all(blobJobs.map(function (job) { return job.promise; })).then(function (blobs) {
        var treeEntries = blobs.map(function (blob, index) {
          return { path: blobJobs[index].path, mode: "100644", type: "blob", sha: blob.sha };
        });
        return githubRequest(repoPath + "/git/trees", {
          method: "POST",
          body: { base_tree: base.baseTreeSha, tree: treeEntries }
        }, accessToken).then(function (tree) {
          return { parentSha: base.parentSha, treeSha: tree.sha };
        });
      });
    }).then(function (next) {
      return githubRequest(repoPath + "/git/commits", {
        method: "POST",
        body: {
          message: "publish: " + bundle.title.slice(0, 120),
          tree: next.treeSha,
          parents: [next.parentSha]
        }
      }, accessToken);
    }).then(function (commit) {
      return githubRequest(repoPath + "/git/refs/heads/" + encodeURIComponent(config.branch), {
        method: "PATCH",
        body: { sha: commit.sha, force: false }
      }, accessToken).then(function () {
        return {
          sha: commit.sha,
          url: "https://github.com/" + config.owner + "/" + config.repository + "/commit/" + commit.sha
        };
      });
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var candidate = tokenInput.value.trim();
    if (!candidate) {
      setStatus("error", "GitHub 토큰을 입력해 주세요.");
      tokenInput.focus();
      return;
    }

    setLoading(true);
    setStatus("loading", "계정과 저장소 권한을 확인하고 있습니다.");
    authenticate(candidate).then(function (profile) {
      accessToken = candidate;
      tokenInput.value = "";
      setStatus("success", "인증되었습니다.");
      unlockEditor(profile);
    }).catch(function (error) {
      accessToken = "";
      tokenInput.value = "";
      setStatus("error", error.status === 401 ? "토큰이 올바르지 않거나 만료되었습니다." : error.message);
      tokenInput.focus();
    }).finally(function () {
      setLoading(false);
    });
  });

  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      lockEditor("로그아웃했습니다. 토큰이 현재 화면에서 제거되었습니다.");
    });
  }

  window.MinnongOwnerAuth = Object.freeze({
    publishBundle: publishBundle,
    logout: function () { lockEditor("로그아웃했습니다."); },
    isAuthenticated: function () { return Boolean(accessToken && ownerProfile); },
    getProfile: function () {
      return ownerProfile ? { login: ownerProfile.login, name: ownerProfile.name || ownerProfile.login } : null;
    }
  });
})();
