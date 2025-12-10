// Roberto's Toolset - Common JavaScript

(function() {
    // Theme toggle
    const toggle = document.getElementById('theme-toggle');
    const saved = localStorage.getItem('tools-theme');

    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    if (toggle) {
        toggle.addEventListener('click', function() {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('tools-theme', next);
        });
    }
})();
