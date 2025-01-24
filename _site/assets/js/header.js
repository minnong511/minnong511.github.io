// script.js
document.addEventListener("DOMContentLoaded", () => {
    const tickerText = document.getElementById("ticker-text");

    // 오늘의 날짜 가져오기
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // 순환할 텍스트 설정
    const messages = [
        `Today's Date: ${dateStr}`,
        "Welcome to minnong's Blog!"
    ];

    // 텍스트를 순환 문자열로 설정
    tickerText.textContent = messages.join("  —  ");
});