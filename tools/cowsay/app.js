// Thought Bubble - Main JavaScript

(function () {
    'use strict';

    // available comic fonts with their sizing adjustments
    const FONTS = {
        bangers: {
            name: 'Bangers',
            family: '"Bangers", cursive',
            size: 22,
            lineHeight: 1.3,
        },
        comicNeue: {
            name: 'Comic Neue',
            family: '"Comic Neue", cursive',
            size: 20,
            lineHeight: 1.4,
        },
        luckiestGuy: {
            name: 'Luckiest Guy',
            family: '"Luckiest Guy", cursive',
            size: 20,
            lineHeight: 1.35,
        },
        permanentMarker: {
            name: 'Permanent Marker',
            family: '"Permanent Marker", cursive',
            size: 20,
            lineHeight: 1.4,
        },
        archivoBlack: {
            name: 'Archivo Black',
            family: '"Archivo Black", sans-serif',
            size: 18,
            lineHeight: 1.45,
        },
    };

    // DOM elements
    const textInput = document.getElementById('text-input');
    const maxWidthInput = document.getElementById('max-width');
    const outputSection = document.getElementById('output-section');
    const output = document.getElementById('output');
    const outputPng = document.getElementById('output-png');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const copyBtn = document.getElementById('copy-btn');
    const exportSplit = document.getElementById('export-split');
    const exportBtn = document.getElementById('export-btn');
    const exportToggle = document.getElementById('export-toggle');
    const exportDropdown = document.getElementById('export-dropdown');
    const themeToggle = document.getElementById('theme-toggle');
    const formatBtns = document.querySelectorAll('.format-btn');
    const fontGroup = document.getElementById('font-group');
    const fontPicker = document.getElementById('font-picker');
    const fontPickerBtn = document.getElementById('font-picker-btn');
    const fontPickerLabel = document.getElementById('font-picker-label');
    const fontPickerDropdown = document.getElementById('font-picker-dropdown');
    const tailGroup = document.getElementById('tail-group');
    const tailPicker = document.getElementById('tail-picker');
    const tailCorners = document.querySelectorAll('.tail-corner');

    // default settings
    const defaultSettings = {
        format: 'ascii',
        maxWidth: 40,
        exportAction: 'download',
        font: 'bangers',
        tailPosition: 'bottomLeft', // bottomLeft, bottomRight, topLeft, topRight
    };

    // current settings
    let settings = { ...defaultSettings };

    // load settings from localStorage
    function loadSettings() {
        try {
            const saved = localStorage.getItem('thoughtbubble-settings');
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
            localStorage.setItem('thoughtbubble-settings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    // apply settings to UI
    function applySettings() {
        maxWidthInput.value = settings.maxWidth;
        updateFontPicker(settings.font);
        updateTailPicker(settings.tailPosition);
        setFormat(settings.format, false); // don't save again
        updateExportDropdown(settings.exportAction);
    }

    // update tail picker selection
    function updateTailPicker(position) {
        tailCorners.forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.position === position);
        });
    }

    // update font picker display
    function updateFontPicker(fontKey) {
        const fontConfig = FONTS[fontKey];
        if (!fontConfig) return;
        fontPickerLabel.textContent = fontConfig.name;
        fontPickerLabel.style.fontFamily = fontConfig.family;
        // update selected state in dropdown
        fontPickerDropdown.querySelectorAll('.font-picker-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.font === fontKey);
        });
    }

    // build font picker dropdown
    function buildFontPicker() {
        fontPickerDropdown.innerHTML = '';
        for (const [key, config] of Object.entries(FONTS)) {
            const option = document.createElement('div');
            option.className = 'font-picker-option';
            option.dataset.font = key;
            option.textContent = config.name;
            option.style.fontFamily = config.family;
            if (key === settings.font) {
                option.classList.add('selected');
            }
            fontPickerDropdown.appendChild(option);
        }
    }

    // wrap text to specified width
    function wrapText(text, maxWidth) {
        const lines = [];
        const paragraphs = text.split('\n');

        for (const paragraph of paragraphs) {
            if (paragraph.length === 0) {
                lines.push('');
                continue;
            }

            const words = paragraph.split(/\s+/);
            let currentLine = '';

            for (const word of words) {
                if (word.length > maxWidth) {
                    if (currentLine) {
                        lines.push(currentLine);
                        currentLine = '';
                    }
                    for (let i = 0; i < word.length; i += maxWidth) {
                        lines.push(word.slice(i, i + maxWidth));
                    }
                    continue;
                }

                if (currentLine.length + word.length + 1 <= maxWidth) {
                    currentLine += (currentLine ? ' ' : '') + word;
                } else {
                    if (currentLine) {
                        lines.push(currentLine);
                    }
                    currentLine = word;
                }
            }

            if (currentLine) {
                lines.push(currentLine);
            }
        }

        return lines;
    }

    // generate ASCII thought bubble
    function generateAsciiBubble(text, maxWidth) {
        if (!text.trim()) {
            return '';
        }

        const lines = wrapText(text, maxWidth);
        const width = Math.max(...lines.map(l => l.length));
        const result = [];

        result.push(' ' + '_'.repeat(width + 2) + ' ');

        for (const line of lines) {
            result.push('( ' + line.padEnd(width) + ' )');
        }

        result.push(' ' + '-'.repeat(width + 2) + ' ');

        result.push(' o');
        result.push('o');
        result.push('O');

        return result.join('\n');
    }

    // wrap text for canvas (returns array of lines)
    function wrapTextForCanvas(ctx, text, maxWidth) {
        const lines = [];
        const paragraphs = text.split('\n');

        for (const paragraph of paragraphs) {
            if (paragraph.length === 0) {
                lines.push('');
                continue;
            }

            const words = paragraph.split(/\s+/);
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine ? currentLine + ' ' + word : word;
                const metrics = ctx.measureText(testLine);

                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }

            if (currentLine) {
                lines.push(currentLine);
            }
        }

        return lines;
    }

    // draw thought bubble on canvas
    function drawThoughtBubble(text) {
        if (!text.trim()) {
            return;
        }

        const padding = 36;
        const fontConfig = FONTS[settings.font] || FONTS.bangers;
        const fontSize = fontConfig.size;
        const lineHeight = fontSize * fontConfig.lineHeight;
        const font = `${fontSize}px ${fontConfig.family}`;
        const strokeWidth = 2;
        const tailPosition = settings.tailPosition || 'bottomLeft';

        // measure text
        ctx.font = font;
        const maxTextWidth = 400;
        const lines = wrapTextForCanvas(ctx, text, maxTextWidth);

        // calculate dimensions
        let textWidth = 0;
        for (const line of lines) {
            const w = ctx.measureText(line).width;
            if (w > textWidth) textWidth = w;
        }

        const textHeight = lines.length * lineHeight;
        const innerWidth = textWidth + padding * 2;
        const innerHeight = textHeight + padding * 2;

        // cloud bulge size - proportional to bubble size
        const bulgeSize = Math.min(innerWidth, innerHeight) * 0.2;

        // total bubble dimensions including bulges
        const bubbleWidth = innerWidth + bulgeSize * 0.5;
        const bubbleHeight = innerHeight + bulgeSize * 0.5;

        // tail configuration based on position
        const isLeft = tailPosition.includes('Left');
        const isTop = tailPosition.includes('top');

        // tail circles (largest to smallest, moving away from bubble)
        const tailCircles = [
            { r: 12 },
            { r: 8 },
            { r: 5 },
        ];

        // calculate tail positions relative to bubble
        // start point is on the bubble edge at the chosen corner
        const tailStartX = isLeft ? bulgeSize * 1.2 : bubbleWidth - bulgeSize * 1.2;
        const tailStartY = isTop ? bulgeSize * 0.3 + 5 : bubbleHeight - bulgeSize * 0.3 - 5;

        const tailPositions = [];
        let tx = tailStartX;
        let ty = tailStartY;
        const xDir = isLeft ? -1 : 1;
        const yDir = isTop ? -1 : 1;

        for (let i = 0; i < tailCircles.length; i++) {
            const tc = tailCircles[i];
            tx += xDir * (tc.r * 2 + 8);
            ty += yDir * 6; // slight angle away from bubble
            tailPositions.push({ x: tx, y: ty, r: tc.r });
        }

        // find bounding box including tail
        const lastTail = tailPositions[tailPositions.length - 1];
        const tailExtentX = isLeft
            ? lastTail.x - lastTail.r - strokeWidth
            : lastTail.x + lastTail.r + strokeWidth;
        const tailExtentY = isTop
            ? lastTail.y - lastTail.r - strokeWidth
            : lastTail.y + lastTail.r + strokeWidth;

        // canvas size - with safe margin for bulges
        const margin = bulgeSize * 0.6 + strokeWidth;

        // calculate offsets to fit everything
        let offsetX, offsetY;
        let canvasWidth, canvasHeight;

        if (isLeft) {
            offsetX = Math.max(margin, margin - tailExtentX);
            canvasWidth = bubbleWidth + offsetX + margin;
        } else {
            offsetX = margin;
            canvasWidth = Math.max(bubbleWidth + margin * 2, tailExtentX + margin);
        }

        if (isTop) {
            offsetY = Math.max(margin, margin - tailExtentY);
            canvasHeight = bubbleHeight + offsetY + margin;
        } else {
            offsetY = margin;
            canvasHeight = Math.max(bubbleHeight + margin * 2, tailExtentY + margin);
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // clear
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // bubble position
        const bx = offsetX;
        const by = offsetY;

        // draw cloud shape - a series of connected arcs
        ctx.beginPath();

        // define control points around the perimeter for the cloud bumps
        // we'll go clockwise starting from bottom-left
        const points = [];

        // number of bumps on each side
        const topBumps = 3;
        const bottomBumps = 2;
        const leftBumps = 2;
        const rightBumps = 2;

        // bottom edge (left to right) - flatter, fewer bumps
        for (let i = 0; i <= bottomBumps; i++) {
            const t = i / bottomBumps;
            const x = bx + bulgeSize * 0.8 + t * (bubbleWidth - bulgeSize * 1.6);
            const y = by + bubbleHeight - bulgeSize * 0.3;
            const bulge = Math.sin(t * Math.PI) * bulgeSize * 0.3;
            points.push({ x, y: y + bulge });
        }

        // right edge (bottom to top)
        for (let i = 1; i <= rightBumps; i++) {
            const t = i / (rightBumps + 1);
            const x = bx + bubbleWidth - bulgeSize * 0.3;
            const y = by + bubbleHeight - bulgeSize - t * (bubbleHeight - bulgeSize * 2);
            const bulge = Math.sin(t * Math.PI) * bulgeSize * 0.6;
            points.push({ x: x + bulge, y });
        }

        // top edge (right to left) - more pronounced bumps
        for (let i = 0; i <= topBumps; i++) {
            const t = 1 - i / topBumps;
            const x = bx + bulgeSize * 0.8 + t * (bubbleWidth - bulgeSize * 1.6);
            const y = by + bulgeSize * 0.6;
            // vary the bulge for organic look
            const bulge = -bulgeSize * (0.5 + 0.4 * Math.sin((i + 0.5) * Math.PI / topBumps));
            points.push({ x, y: y + bulge });
        }

        // left edge (top to bottom)
        for (let i = 1; i <= leftBumps; i++) {
            const t = i / (leftBumps + 1);
            const x = bx + bulgeSize * 0.3;
            const y = by + bulgeSize + t * (bubbleHeight - bulgeSize * 2);
            const bulge = -Math.sin(t * Math.PI) * bulgeSize * 0.5;
            points.push({ x: x + bulge, y });
        }

        // draw smooth curve through points using quadratic curves
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 0; i < points.length; i++) {
            const p0 = points[i];
            const p1 = points[(i + 1) % points.length];

            // midpoint
            const mx = (p0.x + p1.x) / 2;
            const my = (p0.y + p1.y) / 2;

            // use current point as control point, midpoint as end
            ctx.quadraticCurveTo(p0.x, p0.y, mx, my);
        }

        ctx.closePath();

        // fill white
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // stroke
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = strokeWidth;
        ctx.stroke();

        // draw tail circles (ellipses for more organic look)
        for (const tc of tailPositions) {
            ctx.beginPath();
            ctx.ellipse(tc.x + offsetX, tc.y + offsetY, tc.r * 1.2, tc.r, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = strokeWidth;
            ctx.stroke();
        }

        // draw text
        ctx.font = font;
        ctx.fillStyle = '#333333';
        ctx.textBaseline = 'top';

        const textX = bx + (bubbleWidth - textWidth) / 2;
        const textY = by + (bubbleHeight - textHeight) / 2;

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], textX, textY + i * lineHeight);
        }
    }

    // update output based on current format
    function updateOutput() {
        const text = textInput.value;
        const maxWidth = parseInt(maxWidthInput.value, 10) || 40;

        if (!text.trim()) {
            outputSection.classList.add('hidden');
            return;
        }

        outputSection.classList.remove('hidden');

        if (settings.format === 'ascii') {
            output.classList.remove('hidden');
            outputPng.classList.add('hidden');
            copyBtn.classList.remove('hidden');
            exportSplit.classList.add('hidden');

            const bubble = generateAsciiBubble(text, maxWidth);
            output.textContent = bubble;
        } else {
            output.classList.add('hidden');
            outputPng.classList.remove('hidden');
            copyBtn.classList.add('hidden');
            exportSplit.classList.remove('hidden');

            drawThoughtBubble(text);
        }
    }

    // copy ASCII to clipboard
    async function copyAsciiToClipboard() {
        const text = output.textContent;
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

    // execute current export action
    function doExport() {
        if (settings.exportAction === 'clipboard') {
            copyPngToClipboard();
        } else {
            downloadPng();
        }
    }

    // download PNG
    function downloadPng() {
        const link = document.createElement('a');
        link.download = 'thought-bubble.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    // copy PNG to clipboard
    async function copyPngToClipboard() {
        const originalText = exportBtn.textContent;
        exportBtn.disabled = true;
        exportBtn.textContent = 'Copying...';

        try {
            const blobPromise = new Promise((resolve) => {
                canvas.toBlob(resolve, 'image/png');
            });

            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blobPromise })
            ]);

            exportBtn.textContent = 'Copied!';
            setTimeout(() => {
                exportBtn.disabled = false;
                exportBtn.textContent = originalText;
            }, 2000);
        } catch (e) {
            console.error('Clipboard write failed:', e);
            alert('Copy to clipboard requires HTTPS. Use "Download PNG" instead.');
            exportBtn.disabled = false;
            exportBtn.textContent = originalText;
        }
    }

    // update export dropdown selection
    function updateExportDropdown(action) {
        const options = exportDropdown.querySelectorAll('.split-button-option');
        options.forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.action === action);
        });
    }

    // handle format toggle
    function setFormat(format, save = true) {
        settings.format = format;
        formatBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.format === format);
        });
        // show font and tail pickers only for PNG mode
        const isPng = format === 'png';
        fontGroup.classList.toggle('hidden', !isPng);
        tailGroup.classList.toggle('hidden', !isPng);
        if (save) saveSettings();
        updateOutput();
    }

    // theme handling
    function initTheme() {
        const saved = localStorage.getItem('thoughtbubble-theme');
        if (saved === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('thoughtbubble-theme', newTheme);
    }

    // close dropdowns when clicking outside
    function closeDropdown() {
        exportSplit.classList.remove('open');
        fontPicker.classList.remove('open');
    }

    // initialize
    async function init() {
        initTheme();
        loadSettings();

        // preload all comic fonts for canvas rendering
        try {
            await Promise.all(Object.values(FONTS).map(f =>
                document.fonts.load(`${f.size}px ${f.family}`)
            ));
        } catch (e) {
            console.warn('Failed to preload fonts:', e);
        }

        applySettings();

        // event listeners
        textInput.addEventListener('input', updateOutput);
        maxWidthInput.addEventListener('input', () => {
            settings.maxWidth = parseInt(maxWidthInput.value, 10) || 40;
            saveSettings();
            updateOutput();
        });
        copyBtn.addEventListener('click', copyAsciiToClipboard);
        themeToggle.addEventListener('click', toggleTheme);

        formatBtns.forEach(btn => {
            btn.addEventListener('click', () => setFormat(btn.dataset.format));
        });

        // font picker
        buildFontPicker();
        fontPickerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fontPicker.classList.toggle('open');
            exportSplit.classList.remove('open');
        });
        fontPickerDropdown.addEventListener('click', (e) => {
            const option = e.target.closest('.font-picker-option');
            if (option) {
                settings.font = option.dataset.font;
                updateFontPicker(settings.font);
                fontPicker.classList.remove('open');
                saveSettings();
                updateOutput();
            }
        });

        // tail position picker
        tailCorners.forEach(btn => {
            btn.addEventListener('click', () => {
                settings.tailPosition = btn.dataset.position;
                updateTailPicker(settings.tailPosition);
                saveSettings();
                updateOutput();
            });
        });

        // export split button
        exportBtn.addEventListener('click', doExport);

        exportToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            exportSplit.classList.toggle('open');
        });

        exportDropdown.addEventListener('click', (e) => {
            const option = e.target.closest('.split-button-option');
            if (option) {
                settings.exportAction = option.dataset.action;
                updateExportDropdown(settings.exportAction);
                exportSplit.classList.remove('open');
                saveSettings();
                doExport();
            }
        });

        // close dropdown on outside click
        document.addEventListener('click', closeDropdown);

        // focus input on load
        textInput.focus();
    }

    // run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
