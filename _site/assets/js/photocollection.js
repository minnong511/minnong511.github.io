document.addEventListener("DOMContentLoaded", async () => {
    const photoGrid = document.getElementById("photo-grid");
    const imageTxtFile = "/assets/photo.txt"; // 텍스트 파일 경로
    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightbox-image");
    const closeButton = document.getElementById("lightbox-close");

    try {
        // 텍스트 파일 읽기
        const response = await fetch(imageTxtFile);
        if (!response.ok) throw new Error(`Failed to load file: ${response.statusText}`);

        const textData = await response.text();
        const imageLinks = textData.split("\n").map(link => link.trim()).filter(link => link.length > 0);

        // 이미지 링크로 사진 격자 생성
        imageLinks.forEach(link => {
            const photoItem = document.createElement("div");
            photoItem.classList.add("photo-item");

            const img = document.createElement("img");
            img.src = link; // 클라우드 이미지 URL
            img.alt = "Cloud Image";

            // 클릭 이벤트: Lightbox 열기
            photoItem.addEventListener("click", () => {
                lightbox.style.display = "flex";
                lightboxImage.src = link;
            });

            photoItem.appendChild(img);
            photoGrid.appendChild(photoItem);
        });

        // Lightbox 닫기
        closeButton.addEventListener("click", () => {
            lightbox.style.display = "none";
        });

        // Lightbox 외부 클릭 닫기
        lightbox.addEventListener("click", (e) => {
            if (e.target === lightbox) {
                lightbox.style.display = "none";
            }
        });
    } catch (error) {
        console.error("Error loading images:", error);
    }
});
