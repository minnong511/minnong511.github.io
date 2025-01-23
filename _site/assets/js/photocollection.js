document.addEventListener("DOMContentLoaded", async () => {
    const photoGrid = document.getElementById("photo-grid");
    const imageTxtFile = "/assets/photo.txt"; // 텍스트 파일 경로 , 정적 디렉토리에 있어야 한다. 

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

            photoItem.appendChild(img);
            photoGrid.appendChild(photoItem);
        });
    } catch (error) {
        console.error("Error loading images:", error);
    }
});
