// Roberto's Toolset - Common JavaScript

(function() {
    // Theme toggle - shared across all tools
    const THEME_KEY = 'tools-theme';
    const toggle = document.getElementById('theme-toggle');

    // Initialize theme from localStorage
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    // Toggle theme on button click
    if (toggle) {
        toggle.addEventListener('click', function() {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem(THEME_KEY, next);

            // Dispatch custom event for tools that need additional theme handling (e.g., Prism.js)
            window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: next } }));
        });
    }
})();
