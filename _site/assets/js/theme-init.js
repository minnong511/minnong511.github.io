(function () {
  "use strict";
  document.documentElement.classList.add("js");
  try { document.documentElement.dataset.theme = localStorage.getItem("minnong-theme") || "dark"; } catch (error) {}
})();
