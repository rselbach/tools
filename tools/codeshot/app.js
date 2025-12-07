/**
 * Codeshot - Beautiful code screenshots
 */

(function() {
    'use strict';

    // DOM elements
    const elements = {
        codeInput: document.getElementById('code-input'),
        codeOutput: document.getElementById('code-output'),
        codeHighlighted: document.getElementById('code-highlighted'),
        language: document.getElementById('language'),
        theme: document.getElementById('theme'),
        lineNumbers: document.getElementById('line-numbers'),
        backgroundType: document.getElementById('background-type'),
        backgroundColor: document.getElementById('background-color'),
        gradientPreset: document.getElementById('gradient-preset'),
        colorPickerGroup: document.getElementById('color-picker-group'),
        gradientPickerGroup: document.getElementById('gradient-picker-group'),
        padding: document.getElementById('padding'),
        paddingValue: document.getElementById('padding-value'),
        previewBackground: document.getElementById('preview-background'),
        window: document.getElementById('window'),
        downloadBtn: document.getElementById('download-btn'),
        copyBtn: document.getElementById('copy-btn'),
        prismThemeDark: document.getElementById('prism-theme-dark'),
        prismThemeLight: document.getElementById('prism-theme-light'),
    };

    // default settings
    const defaultSettings = {
        language: 'javascript',
        theme: 'dark',
        lineNumbers: false,
        backgroundType: 'gradient',
        backgroundColor: '#667eea',
        gradientPreset: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 32,
        windowWidth: 600,
        windowHeight: null, // auto
    };

    // current settings
    let settings = { ...defaultSettings };

    /**
     * Load settings from localStorage
     */
    function loadSettings() {
        try {
            const saved = localStorage.getItem('codeshot-settings');
            if (saved) {
                settings = { ...defaultSettings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
    }

    /**
     * Save settings to localStorage
     */
    function saveSettings() {
        try {
            localStorage.setItem('codeshot-settings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    /**
     * Apply settings to UI
     */
    function applySettings() {
        elements.language.value = settings.language;
        elements.theme.value = settings.theme;
        elements.lineNumbers.checked = settings.lineNumbers;
        elements.backgroundType.value = settings.backgroundType;
        elements.backgroundColor.value = settings.backgroundColor;
        elements.gradientPreset.value = settings.gradientPreset;
        elements.padding.value = settings.padding;
        elements.paddingValue.textContent = settings.padding;

        if (settings.windowWidth) {
            elements.window.style.width = settings.windowWidth + 'px';
        }

        updateTheme();
        updateBackground();
        updateLineNumbers();
        highlightCode();
    }

    /**
     * Update code highlighting
     */
    function highlightCode() {
        const code = elements.codeInput.value;
        const language = settings.language;

        // update the pre element's class for prism
        elements.codeOutput.className = `language-${language}`;
        if (settings.lineNumbers) {
            elements.codeOutput.classList.add('line-numbers');
        }

        // escape HTML and set content
        elements.codeHighlighted.textContent = code;
        elements.codeHighlighted.className = `language-${language}`;

        // trigger prism highlighting
        Prism.highlightElement(elements.codeHighlighted);

        // sync textarea height with pre
        syncEditorHeight();
    }

    /**
     * Sync textarea height with highlighted code
     */
    function syncEditorHeight() {
        // reset height to auto to measure content
        elements.codeOutput.style.height = 'auto';
        const height = elements.codeOutput.scrollHeight;
        elements.codeOutput.style.height = height + 'px';
        elements.codeInput.style.height = height + 'px';
    }

    /**
     * Update theme (dark/light)
     */
    function updateTheme() {
        const isDark = settings.theme === 'dark';

        elements.window.classList.toggle('light', !isDark);
        elements.prismThemeDark.disabled = !isDark;
        elements.prismThemeLight.disabled = isDark;

        // re-highlight after theme change
        highlightCode();
    }

    /**
     * Update background
     */
    function updateBackground() {
        const bg = elements.previewBackground;

        bg.classList.remove('transparent');

        switch (settings.backgroundType) {
            case 'solid':
                bg.style.background = settings.backgroundColor;
                elements.colorPickerGroup.classList.remove('hidden');
                elements.gradientPickerGroup.classList.add('hidden');
                break;
            case 'gradient':
                bg.style.background = settings.gradientPreset;
                elements.colorPickerGroup.classList.add('hidden');
                elements.gradientPickerGroup.classList.remove('hidden');
                break;
            case 'transparent':
                bg.classList.add('transparent');
                elements.colorPickerGroup.classList.add('hidden');
                elements.gradientPickerGroup.classList.add('hidden');
                break;
        }

        bg.style.padding = settings.padding + 'px';
    }

    /**
     * Update line numbers
     */
    function updateLineNumbers() {
        const wrapper = elements.codeOutput.parentElement;
        wrapper.classList.toggle('line-numbers', settings.lineNumbers);
        highlightCode();
    }

    /**
     * Export as PNG
     */
    async function exportPNG() {
        const btn = elements.downloadBtn;
        btn.disabled = true;
        btn.textContent = 'Exporting...';

        try {
            const canvas = await html2canvas(elements.previewBackground, {
                backgroundColor: settings.backgroundType === 'transparent' ? null : undefined,
                scale: 2, // higher resolution
            });

            const link = document.createElement('a');
            link.download = 'codeshot.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) {
            console.error('Export failed:', e);
            alert('Failed to export image. Please try again.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PNG
            `;
        }
    }

    /**
     * Copy to clipboard
     * 
     * The trick here is to pass a Promise<Blob> directly to ClipboardItem,
     * doing the entire html2canvas render inside that promise. This keeps
     * the user gesture context intact.
     */
    async function copyToClipboard() {
        const btn = elements.copyBtn;
        btn.disabled = true;
        btn.textContent = 'Copying...';

        try {
            // wrap everything in a single promise passed to ClipboardItem
            const blobPromise = html2canvas(elements.previewBackground, {
                backgroundColor: settings.backgroundType === 'transparent' ? null : undefined,
                scale: 2,
            }).then(canvas => {
                return new Promise((resolve) => {
                    canvas.toBlob(resolve, 'image/png');
                });
            });

            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blobPromise })
            ]);

            btn.textContent = 'Copied!';
            setTimeout(() => resetCopyBtn(), 2000);
        } catch (e) {
            console.error('Clipboard write failed:', e);
            
            // fallback for browsers that don't support async clipboard
            // or when on insecure context (http)
            alert('Copy to clipboard requires HTTPS. Use "Download PNG" instead, or deploy to your server.');
            resetCopyBtn();
        }
    }

    function resetCopyBtn() {
        elements.copyBtn.disabled = false;
        elements.copyBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy to Clipboard
        `;
    }

    /**
     * Track window resize
     */
    function trackWindowResize() {
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                settings.windowWidth = Math.round(entry.contentRect.width);
                saveSettings();
            }
        });
        resizeObserver.observe(elements.window);
    }

    /**
     * Initialize event listeners
     */
    function initEventListeners() {
        // code input
        elements.codeInput.addEventListener('input', () => {
            highlightCode();
        });

        // sync scroll between textarea and pre
        elements.codeInput.addEventListener('scroll', () => {
            elements.codeOutput.scrollTop = elements.codeInput.scrollTop;
            elements.codeOutput.scrollLeft = elements.codeInput.scrollLeft;
        });

        // language change
        elements.language.addEventListener('change', (e) => {
            settings.language = e.target.value;
            saveSettings();
            highlightCode();
        });

        // theme change
        elements.theme.addEventListener('change', (e) => {
            settings.theme = e.target.value;
            saveSettings();
            updateTheme();
        });

        // line numbers toggle
        elements.lineNumbers.addEventListener('change', (e) => {
            settings.lineNumbers = e.target.checked;
            saveSettings();
            updateLineNumbers();
        });

        // background type change
        elements.backgroundType.addEventListener('change', (e) => {
            settings.backgroundType = e.target.value;
            saveSettings();
            updateBackground();
        });

        // background color change
        elements.backgroundColor.addEventListener('input', (e) => {
            settings.backgroundColor = e.target.value;
            saveSettings();
            updateBackground();
        });

        // gradient preset change
        elements.gradientPreset.addEventListener('change', (e) => {
            settings.gradientPreset = e.target.value;
            saveSettings();
            updateBackground();
        });

        // padding change
        elements.padding.addEventListener('input', (e) => {
            settings.padding = parseInt(e.target.value, 10);
            elements.paddingValue.textContent = settings.padding;
            saveSettings();
            updateBackground();
        });

        // export buttons
        elements.downloadBtn.addEventListener('click', exportPNG);
        elements.copyBtn.addEventListener('click', copyToClipboard);

        // handle tab key in textarea
        elements.codeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = elements.codeInput.selectionStart;
                const end = elements.codeInput.selectionEnd;
                const value = elements.codeInput.value;

                elements.codeInput.value = value.substring(0, start) + '    ' + value.substring(end);
                elements.codeInput.selectionStart = elements.codeInput.selectionEnd = start + 4;

                highlightCode();
            }
        });
    }

    /**
     * Initialize the app
     */
    function init() {
        loadSettings();
        applySettings();
        initEventListeners();
        trackWindowResize();

        // initial highlight
        highlightCode();
    }

    // wait for DOM and Prism to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
