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

    // Prism.js theme syncing - automatically syncs #prism-theme-dark and #prism-theme-light
    // with the current page theme. No-op if elements aren't present.
    function syncPrismTheme() {
        const darkLink = document.getElementById('prism-theme-dark');
        const lightLink = document.getElementById('prism-theme-light');
        if (!darkLink || !lightLink) return;

        const theme = document.documentElement.getAttribute('data-theme');
        const isLight = theme === 'light';
        darkLink.disabled = isLight;
        lightLink.disabled = !isLight;
    }

    // sync on load and listen for theme changes
    syncPrismTheme();
    window.addEventListener('theme-changed', syncPrismTheme);
})();
