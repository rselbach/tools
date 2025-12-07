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
        // language dropdown
        languageSelect: document.getElementById('language-select'),
        languageTrigger: document.getElementById('language-trigger'),
        languageOptions: document.getElementById('language-options'),
        // theme toggle
        themeCheckbox: document.getElementById('theme-checkbox'),
        // background dropdown
        backgroundSelect: document.getElementById('background-select'),
        backgroundTrigger: document.getElementById('background-trigger'),
        backgroundOptions: document.getElementById('background-options'),
        backgroundColor: document.getElementById('background-color'),
        // other controls
        lineNumbers: document.getElementById('line-numbers'),
        padding: document.getElementById('padding'),
        paddingValue: document.getElementById('padding-value'),
        previewContainer: document.getElementById('preview-container'),
        previewBackground: document.getElementById('preview-background'),
        window: document.getElementById('window'),
        resizeLeft: document.getElementById('resize-left'),
        resizeRight: document.getElementById('resize-right'),
        exportSplit: document.getElementById('export-split'),
        exportBtn: document.getElementById('export-btn'),
        exportToggle: document.getElementById('export-toggle'),
        exportDropdown: document.getElementById('export-dropdown'),
        prismThemeDark: document.getElementById('prism-theme-dark'),
        prismThemeLight: document.getElementById('prism-theme-light'),
    };

    // default settings
    const defaultSettings = {
        language: 'javascript',
        theme: 'dark',
        lineNumbers: false,
        // background stored as "type:value" e.g. "gradient:linear-gradient(...)" or "solid:#fff" or "transparent"
        background: 'gradient:linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 32,
        windowWidth: 600,
        windowHeight: null, // auto
        exportAction: 'download', // 'download' or 'clipboard'
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
        updateLanguageSelect(settings.language);
        elements.themeCheckbox.checked = settings.theme === 'dark';
        updateBackgroundSelect(settings.background);
        elements.lineNumbers.checked = settings.lineNumbers;
        elements.padding.value = settings.padding;
        elements.paddingValue.textContent = settings.padding;

        if (settings.windowWidth) {
            elements.window.style.width = settings.windowWidth + 'px';
        }

        updateTheme();
        updateBackground();
        updateLineNumbers();
        updateExportDropdown(settings.exportAction);
        highlightCode();
    }

    /**
     * Update custom language select display
     */
    function updateLanguageSelect(value) {
        updateCustomSelect(elements.languageOptions, elements.languageTrigger, value, 'i');
    }

    /**
     * Update custom background select display
     */
    function updateBackgroundSelect(value) {
        // update selected state in options
        const options = elements.backgroundOptions.querySelectorAll('.custom-select-option');
        options.forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.value === value);
        });

        // update trigger display
        let selectedOption = elements.backgroundOptions.querySelector(`[data-value="${value}"]`);
        
        // handle custom solid colors
        if (!selectedOption && value.startsWith('solid:')) {
            selectedOption = elements.backgroundOptions.querySelector('[data-value="solid:custom"]');
        }

        if (selectedOption) {
            const swatch = selectedOption.querySelector('.color-swatch').cloneNode(true);
            const text = selectedOption.dataset.label || selectedOption.querySelector('span').textContent;
            
            // for custom colors, update the swatch color
            if (value.startsWith('solid:') && value !== 'solid:custom') {
                const color = value.replace('solid:', '');
                swatch.style.background = color;
            }
            
            elements.backgroundTrigger.querySelector('.color-swatch').replaceWith(swatch);
            elements.backgroundTrigger.querySelector('.trigger-text').textContent = text;
        }
    }

    /**
     * Generic custom select updater
     */
    function updateCustomSelect(optionsEl, triggerEl, value, iconSelector) {
        // update selected state in options
        const options = optionsEl.querySelectorAll('.custom-select-option');
        options.forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.value === value);
        });

        // update trigger display
        const selectedOption = optionsEl.querySelector(`[data-value="${value}"]`);
        if (selectedOption) {
            const icon = selectedOption.querySelector(iconSelector).cloneNode(true);
            const text = selectedOption.querySelector('span').textContent;
            triggerEl.querySelector(iconSelector).replaceWith(icon);
            triggerEl.querySelector('.trigger-text').textContent = text;
        }
    }

    /**
     * Update code highlighting
     * @param {boolean} autoFit - if true, auto-fit width after highlighting
     */
    function highlightCode(autoFit) {
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

        // trigger prism highlighting with async callback for autoloaded languages
        Prism.highlightElement(elements.codeHighlighted, false, function() {
            syncEditorHeight();
            if (autoFit) {
                autoFitWidth();
            }
        });

        // also sync immediately for already-loaded languages
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
     * Remove common leading indentation from code
     */
    function dedentCode() {
        const code = elements.codeInput.value;
        if (!code) return;

        const lines = code.split('\n');
        
        // find minimum indentation (ignoring empty lines)
        let minIndent = Infinity;
        for (const line of lines) {
            if (line.trim().length === 0) continue; // skip empty lines
            const match = line.match(/^(\s*)/);
            if (match) {
                minIndent = Math.min(minIndent, match[1].length);
            }
        }

        // if no common indentation found, do nothing
        if (minIndent === 0 || minIndent === Infinity) return;

        // remove the common indentation from all lines
        const dedentedLines = lines.map(line => {
            if (line.trim().length === 0) return line; // preserve empty lines
            return line.slice(minIndent);
        });

        elements.codeInput.value = dedentedLines.join('\n');
    }

    /**
     * Auto-fit window width to content
     */
    function autoFitWidth() {
        const code = elements.codeInput.value;
        if (!code) return;

        // temporarily expand window to measure natural content width
        const originalWidth = elements.window.style.width;
        elements.window.style.width = '2000px';

        // force reflow so measurements are accurate
        void elements.codeOutput.offsetWidth;

        // measure the actual scrollWidth of the pre element (includes padding)
        const preScrollWidth = elements.codeOutput.scrollWidth;

        // pre element scrollWidth should include its own padding
        // add buffer to account for scrollbar cascade (horizontal scrollbar triggers vertical)
        const minWidth = 300;
        const maxWidth = 900;
        const buffer = 32;
        const newWidth = Math.min(maxWidth, Math.max(minWidth, preScrollWidth + buffer));

        elements.window.style.width = newWidth + 'px';
        settings.windowWidth = newWidth;
        saveSettings();
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

        if (settings.background === 'transparent') {
            bg.classList.add('transparent');
            bg.style.background = '';
        } else if (settings.background.startsWith('gradient:')) {
            bg.style.background = settings.background.replace('gradient:', '');
        } else if (settings.background.startsWith('solid:')) {
            const color = settings.background.replace('solid:', '');
            bg.style.background = color;
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
     * Execute the current export action
     */
    function doExport() {
        if (settings.exportAction === 'clipboard') {
            copyToClipboard();
        } else {
            downloadPNG();
        }
    }

    /**
     * Download as PNG
     */
    async function downloadPNG() {
        const btn = elements.exportBtn;
        const originalText = btn.textContent;
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
            btn.textContent = originalText;
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
        const btn = elements.exportBtn;
        const originalText = btn.textContent;
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
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = originalText;
            }, 2000);
        } catch (e) {
            console.error('Clipboard write failed:', e);
            
            // fallback for browsers that don't support async clipboard
            // or when on insecure context (http)
            alert('Copy to clipboard requires HTTPS. Use "Download PNG" instead, or deploy to your server.');
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    /**
     * Update export dropdown selection
     */
    function updateExportDropdown(action) {
        const options = elements.exportDropdown.querySelectorAll('.split-button-option');
        options.forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.action === action);
        });
    }

    /**
     * Initialize symmetric resize handles
     * Dragging either side resizes from center
     */
    function initResizeHandles() {
        let isDragging = false;
        let startX = 0;
        let startWidth = 0;

        function onMouseDown(e) {
            isDragging = true;
            startX = e.clientX;
            startWidth = elements.window.offsetWidth;
            elements.previewContainer.classList.add('resizing');
            document.body.classList.add('resizing');
            e.target.classList.add('dragging');
            e.preventDefault();
        }

        function onMouseMove(e) {
            if (!isDragging) return;

            // calculate delta from start position
            const delta = e.clientX - startX;
            
            // determine if dragging left or right handle
            const isLeftHandle = e.target === elements.resizeLeft || 
                                 elements.resizeLeft.classList.contains('dragging');
            
            // for symmetric resize: left handle inverts delta
            const widthChange = isLeftHandle ? -delta * 2 : delta * 2;
            
            const newWidth = Math.max(300, startWidth + widthChange);
            elements.window.style.width = newWidth + 'px';
            settings.windowWidth = newWidth;
        }

        function onMouseUp() {
            if (!isDragging) return;
            isDragging = false;
            elements.previewContainer.classList.remove('resizing');
            document.body.classList.remove('resizing');
            elements.resizeLeft.classList.remove('dragging');
            elements.resizeRight.classList.remove('dragging');
            saveSettings();
        }

        elements.resizeLeft.addEventListener('mousedown', onMouseDown);
        elements.resizeRight.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    /**
     * Close all custom dropdowns
     */
    function closeAllDropdowns() {
        elements.languageSelect.classList.remove('open');
        elements.backgroundSelect.classList.remove('open');
        elements.exportSplit.classList.remove('open');
    }

    /**
     * Initialize event listeners
     */
    function initEventListeners() {
        // code input
        elements.codeInput.addEventListener('input', () => {
            highlightCode();
        });

        // auto-dedent and auto-fit width on paste
        elements.codeInput.addEventListener('paste', (e) => {
            // prevent default paste, handle manually
            e.preventDefault();
            
            const pastedText = e.clipboardData.getData('text');
            const textarea = elements.codeInput;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const before = textarea.value.substring(0, start);
            const after = textarea.value.substring(end);
            
            // insert pasted text
            textarea.value = before + pastedText + after;
            textarea.selectionStart = textarea.selectionEnd = start + pastedText.length;
            
            // dedent and highlight (autoFitWidth called after highlight completes)
            dedentCode();
            highlightCode(true); // pass flag to auto-fit after
        });

        // sync scroll between textarea and pre
        elements.codeInput.addEventListener('scroll', () => {
            elements.codeOutput.scrollTop = elements.codeInput.scrollTop;
            elements.codeOutput.scrollLeft = elements.codeInput.scrollLeft;
        });

        // custom language dropdown
        elements.languageTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            elements.languageSelect.classList.toggle('open');
        });

        elements.languageOptions.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-select-option');
            if (option) {
                settings.language = option.dataset.value;
                updateLanguageSelect(settings.language);
                elements.languageSelect.classList.remove('open');
                saveSettings();
                highlightCode();
            }
        });

        // theme toggle
        elements.themeCheckbox.addEventListener('change', (e) => {
            settings.theme = e.target.checked ? 'dark' : 'light';
            saveSettings();
            updateTheme();
        });

        // custom background dropdown
        elements.backgroundTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            elements.backgroundSelect.classList.toggle('open');
        });

        elements.backgroundOptions.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-select-option');
            if (option) {
                const value = option.dataset.value;
                
                // handle custom color picker
                if (value === 'solid:custom') {
                    elements.backgroundColor.click();
                    elements.backgroundSelect.classList.remove('open');
                    return;
                }

                settings.background = value;
                updateBackgroundSelect(settings.background);
                elements.backgroundSelect.classList.remove('open');
                saveSettings();
                updateBackground();
            }
        });

        // custom color picker (for custom solid color)
        elements.backgroundColor.addEventListener('input', (e) => {
            settings.background = 'solid:' + e.target.value;
            updateBackgroundSelect(settings.background);
            saveSettings();
            updateBackground();
        });

        // close all dropdowns when clicking outside
        document.addEventListener('click', () => {
            closeAllDropdowns();
        });

        // line numbers toggle
        elements.lineNumbers.addEventListener('change', (e) => {
            settings.lineNumbers = e.target.checked;
            saveSettings();
            updateLineNumbers();
        });

        // padding change
        elements.padding.addEventListener('input', (e) => {
            settings.padding = parseInt(e.target.value, 10);
            elements.paddingValue.textContent = settings.padding;
            saveSettings();
            updateBackground();
        });

        // export split button
        elements.exportBtn.addEventListener('click', doExport);
        
        elements.exportToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllDropdowns();
            elements.exportSplit.classList.toggle('open');
        });

        elements.exportDropdown.addEventListener('click', (e) => {
            const option = e.target.closest('.split-button-option');
            if (option) {
                settings.exportAction = option.dataset.action;
                updateExportDropdown(settings.exportAction);
                elements.exportSplit.classList.remove('open');
                saveSettings();
                // execute the action immediately after selecting
                doExport();
            }
        });

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
        initResizeHandles();

        // initial highlight
        highlightCode();

        // focus the code input
        elements.codeInput.focus();
    }

    // wait for DOM and Prism to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
