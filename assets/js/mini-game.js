(function () {
  "use strict";

  var game = document.getElementById("explorerMiniGame");
  var toggle = document.getElementById("miniGameToggle");
  var body = document.getElementById("miniGameBody");
  var arena = document.getElementById("miniGameArena");
  var target = document.getElementById("miniGameTarget");
  var startButton = document.getElementById("miniGameStart");
  var scoreOutput = document.getElementById("miniGameScore");
  var bestOutput = document.getElementById("miniGameBest");
  var timeOutput = document.getElementById("miniGameTime");
  var message = document.getElementById("miniGameMessage");
  var bestKey = "minnong-bug-hunt-best";
  var collapsedKey = "minnong-bug-hunt-collapsed";
  var duration = 15000;
  var running = false;
  var score = 0;
  var best = 0;
  var previousCell = -1;
  var startedAt = 0;
  var moveTimer = 0;
  var frame = 0;

  if (!game || !toggle || !body || !arena || !target || !startButton || !scoreOutput || !bestOutput || !timeOutput || !message) return;

  function readNumber(key) {
    try { return Math.max(0, Number(localStorage.getItem(key)) || 0); } catch (error) { return 0; }
  }

  function readCollapsed() {
    try { return localStorage.getItem(collapsedKey) === "true"; } catch (error) { return false; }
  }

  function writeValue(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (error) {}
  }

  function setCollapsed(collapsed) {
    game.classList.toggle("is-collapsed", collapsed);
    body.hidden = collapsed;
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.setAttribute("aria-label", collapsed ? "미니게임 펼치기" : "미니게임 접기");
    toggle.title = collapsed ? "미니게임 펼치기" : "미니게임 접기";
    writeValue(collapsedKey, collapsed);
  }

  function placeTarget() {
    var cell = previousCell;
    while (cell === previousCell) cell = Math.floor(Math.random() * 12);
    previousCell = cell;
    target.style.gridColumn = String((cell % 4) + 1);
    target.style.gridRow = String(Math.floor(cell / 4) + 1);
  }

  function scheduleMove() {
    window.clearTimeout(moveTimer);
    if (!running) return;
    moveTimer = window.setTimeout(function () {
      placeTarget();
      scheduleMove();
    }, Math.max(360, 850 - score * 22));
  }

  function finishGame() {
    if (!running) return;
    running = false;
    window.clearTimeout(moveTimer);
    window.cancelAnimationFrame(frame);
    target.disabled = true;
    timeOutput.textContent = "0.0";
    if (score > best) {
      best = score;
      bestOutput.textContent = String(best);
      writeValue(bestKey, best);
      message.textContent = "NEW BEST! 다시 도전해보세요.";
    } else {
      message.textContent = "TIME UP! 다시 도전해보세요.";
    }
    startButton.textContent = "RETRY";
  }

  function updateClock(now) {
    if (!running) return;
    var remaining = Math.max(0, duration - (now - startedAt));
    timeOutput.textContent = (remaining / 1000).toFixed(1);
    if (remaining <= 0) {
      finishGame();
      return;
    }
    frame = window.requestAnimationFrame(updateClock);
  }

  function startGame() {
    window.clearTimeout(moveTimer);
    window.cancelAnimationFrame(frame);
    setCollapsed(false);
    running = true;
    score = 0;
    previousCell = -1;
    startedAt = performance.now();
    scoreOutput.textContent = "0";
    timeOutput.textContent = "15.0";
    message.textContent = "움직이는 버그를 클릭하세요!";
    startButton.textContent = "RUNNING";
    target.disabled = false;
    placeTarget();
    scheduleMove();
    frame = window.requestAnimationFrame(updateClock);
    target.focus({ preventScroll: true });
  }

  target.addEventListener("click", function () {
    if (!running) return;
    score += 1;
    scoreOutput.textContent = String(score);
    placeTarget();
    scheduleMove();
  });

  startButton.addEventListener("click", startGame);
  toggle.addEventListener("click", function () {
    setCollapsed(!game.classList.contains("is-collapsed"));
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && running) finishGame();
  });

  best = readNumber(bestKey);
  bestOutput.textContent = String(best);
  setCollapsed(readCollapsed());
})();
