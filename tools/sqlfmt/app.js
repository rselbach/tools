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

    // Prism theme handling - sync with page theme
    function syncPrismTheme() {
        const theme = document.documentElement.getAttribute('data-theme');
        const isLight = theme === 'light';
        document.getElementById('prism-theme-dark').disabled = isLight;
        document.getElementById('prism-theme-light').disabled = !isLight;

        // re-highlight if there's content
        if (!outputSection.classList.contains('hidden')) {
            Prism.highlightElement(sqlOutput);
        }
    }

    // initialize
    function init() {
        // Sync Prism theme on load and when theme changes
        syncPrismTheme();
        window.addEventListener('theme-changed', syncPrismTheme);

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
