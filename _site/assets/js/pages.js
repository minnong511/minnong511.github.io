// script.js
document.addEventListener("DOMContentLoaded", () => {
    const toc = document.getElementById("toc");
    const headings = document.querySelectorAll("article h1, article h2, article h3");
    const tocList = document.createElement("ul");

    headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;

        const listItem = document.createElement("li");
        const link = document.createElement("a");
        link.href = `#${id}`;
        link.textContent = heading.textContent;

        link.addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById(id).scrollIntoView({ behavior: "smooth" });
        });

        listItem.appendChild(link);
        tocList.appendChild(listItem);
    });

    toc.appendChild(tocList);

    // Highlight active heading
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const link = toc.querySelector(`a[href="#${entry.target.id}"]`);
                if (entry.isIntersecting) {
                    link.classList.add("active");
                } else {
                    link.classList.remove("active");
                }
            });
        },
        { rootMargin: "0px 0px -70% 0px", threshold: 1.0 }
    );

    headings.forEach((heading) => observer.observe(heading));
});
