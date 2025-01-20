// ScrollTrigger 플러그인 활성화
gsap.registerPlugin(ScrollTrigger);

// 애니메이션 설정
gsap.to(".box", {
    scrollTrigger: {
        trigger: ".box",  // 애니메이션 트리거 요소
        start: "top 90%", // 트리거 시작 위치
        end: "top 10%",   // 트리거 끝 위치
        scrub: 1          // 스크롤과 애니메이션 동기화
    },
    opacity: 1,            // 불투명도 변화
    x: 200,                // x축 이동
    duration: 10            // 애니메이션 지속 시간
});