// SQL Formatter - Main JavaScript

(function () {
    'use strict';

    // DOM elements
    const sqlInput = document.getElementById('sql-input');
    const dialectSelect = document.getElementById('dialect');
    const keywordCaseSelect = document.getElementById('keyword-case');
    const errorMessage = document.getElementById('error-message');
    const outputSection = document.getElementById('output-section');
    const sqlOutput = document.getElementById('sql-output');
    const copyBtn = document.getElementById('copy-btn');
    const themeToggle = document.getElementById('theme-toggle');

    // default settings
    const defaultSettings = {
        dialect: 'sql',
        keywordCase: 'upper',
    };

    // current settings
    let settings = { ...defaultSettings };

    // debounce timer
    let debounceTimer = null;

    // load settings from localStorage
    function loadSettings() {
        try {
            const saved = localStorage.getItem('sqlfmt-settings');
            if (saved) {
                settings = { ...defaultSettings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
    }

    // save settings to localStorage
    function saveSettings() {
        try {
            localStorage.setItem('sqlfmt-settings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    // apply settings to UI
    function applySettings() {
        dialectSelect.value = settings.dialect;
        keywordCaseSelect.value = settings.keywordCase;
    }

    // format SQL
    function formatSQL() {
        const sql = sqlInput.value;

        if (!sql.trim()) {
            outputSection.classList.add('hidden');
            errorMessage.classList.add('hidden');
            return;
        }

        try {
            const formatted = sqlFormatter.format(sql, {
                language: settings.dialect,
                keywordCase: settings.keywordCase,
                functionCase: settings.keywordCase, // match function case to keyword case
                tabWidth: 2,
            });

            sqlOutput.textContent = formatted;
            Prism.highlightElement(sqlOutput);

            outputSection.classList.remove('hidden');
            errorMessage.classList.add('hidden');
        } catch (e) {
            showError(e.message);
        }
    }

    // debounced format
    function debouncedFormat() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(formatSQL, 300);
    }

    // show error
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        outputSection.classList.add('hidden');
    }

    // copy to clipboard
    async function copyToClipboard() {
        const text = sqlOutput.textContent;
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            copyBtn.querySelector('span').textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.querySelector('span').textContent = 'Copy';
            }, 2000);
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    }

    // theme handling
    function initTheme() {
        const saved = localStorage.getItem('sqlfmt-theme');
        if (saved === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            document.getElementById('prism-theme-dark').disabled = true;
            document.getElementById('prism-theme-light').disabled = false;
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('sqlfmt-theme', newTheme);

        // toggle prism themes
        document.getElementById('prism-theme-dark').disabled = newTheme === 'light';
        document.getElementById('prism-theme-light').disabled = newTheme === 'dark';

        // re-highlight if there's content
        if (!outputSection.classList.contains('hidden')) {
            Prism.highlightElement(sqlOutput);
        }
    }

    // initialize
    function init() {
        initTheme();
        loadSettings();
        applySettings();

        // event listeners
        sqlInput.addEventListener('input', debouncedFormat);

        dialectSelect.addEventListener('change', () => {
            settings.dialect = dialectSelect.value;
            saveSettings();
            formatSQL();
        });

        keywordCaseSelect.addEventListener('change', () => {
            settings.keywordCase = keywordCaseSelect.value;
            saveSettings();
            formatSQL();
        });

        copyBtn.addEventListener('click', copyToClipboard);
        themeToggle.addEventListener('click', toggleTheme);

        // focus input on load
        sqlInput.focus();
    }

    // run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
