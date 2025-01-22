function toggleMenu() {
    const menu = document.getElementById('menu');
    const overlay = document.getElementById('overlay');
    menu.classList.toggle('open');
    overlay.classList.toggle('active');
}

function toggleSubmenu(event) {
    event.preventDefault();
    const submenu = event.target.nextElementSibling;
    if (submenu && submenu.classList.contains('submenu')) {
        submenu.classList.toggle('open');
    }
}

document.addEventListener('click', function(event) {
    const menu = document.getElementById('menu');
    const overlay = document.getElementById('overlay');
    const menuToggle = document.querySelector('.menu-toggle');
    const menuContent = document.querySelector('.menu-content');

    if (!menuContent.contains(event.target) && !menuToggle.contains(event.target)) {
        menu.classList.remove('open');
        overlay.classList.remove('active');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const recentPosts = [
        { title: "Post 1", url: "#" },
        { title: "Post 2", url: "#" },
        { title: "Post 3", url: "#" }
    ];

    const recentPostsList = document.getElementById('recent-posts-list');
    recentPosts.forEach(post => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = post.url;
        link.textContent = post.title;
        listItem.appendChild(link);
        recentPostsList.appendChild(listItem);
    });
});


