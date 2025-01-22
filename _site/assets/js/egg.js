document.addEventListener("keydown", function (event) {
    // 특정 키 조합으로 이스터에그 활성화 (Ctrl + Shift + F)
    if (event.shiftKey && event.key === "F") {
      activateEasterEgg();
    }
  });
  
  function activateEasterEgg() {
    const face = document.getElementById("bouncing-face");
    face.style.display = "block"; // 얼굴 보이기
    moveFaceRandomly(face);
  
    // 10초 후 이스터에그 종료
    setTimeout(() => {
      face.style.display = "none";
    }, 10000);
  }
  
  function moveFaceRandomly(face) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
  
    let interval = setInterval(() => {
      // 무작위 위치 계산
      const randomX = Math.random() * (viewportWidth - 100); // 100px은 이미지 크기
      const randomY = Math.random() * (viewportHeight - 100);
  
      // 이미지 이동 및 애니메이션 추가
      face.style.left = `${randomX}px`;
      face.style.top = `${randomY}px`;
      face.style.position = "fixed";
      face.style.animation = "bounce 0.5s ease infinite";
    }, 1000);
  
    // 5초 후에 애니메이션 종료
    setTimeout(() => {
      clearInterval(interval);
    }, 5000);
  }

  const bounceSound = new Audio("/assets/sounds/bounce.mp3");
bounceSound.play();
  
document.getElementById("bouncing-face").addEventListener("click", function () {
    alert("You found the Easter Egg!");
  });