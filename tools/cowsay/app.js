// Thought Bubble - Main JavaScript

(function () {
    'use strict';

    // DOM elements
    const textInput = document.getElementById('text-input');
    const maxWidthInput = document.getElementById('max-width');
    const outputSection = document.getElementById('output-section');
    const output = document.getElementById('output');
    const copyBtn = document.getElementById('copy-btn');
    const themeToggle = document.getElementById('theme-toggle');

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
                // handle words longer than maxWidth
                if (word.length > maxWidth) {
                    if (currentLine) {
                        lines.push(currentLine);
                        currentLine = '';
                    }
                    // break long word into chunks
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

    // generate thought bubble
    function generateBubble(text, maxWidth) {
        if (!text.trim()) {
            return '';
        }

        const lines = wrapText(text, maxWidth);
        const width = Math.max(...lines.map(l => l.length));
        const result = [];

        // top border with rounded corners
        result.push(' ' + '_'.repeat(width + 2) + ' ');

        // content lines with ( )
        for (const line of lines) {
            result.push('( ' + line.padEnd(width) + ' )');
        }

        // bottom border with rounded corners
        result.push(' ' + '-'.repeat(width + 2) + ' ');

        // thought bubble tail on the left
        result.push(' o');
        result.push('o');
        result.push('O');

        return result.join('\n');
    }

    // update output
    function updateOutput() {
        const text = textInput.value;
        const maxWidth = parseInt(maxWidthInput.value, 10) || 40;

        if (!text.trim()) {
            outputSection.classList.add('hidden');
            return;
        }

        const balloon = generateBubble(text, maxWidth);
        output.textContent = balloon;
        outputSection.classList.remove('hidden');
    }

    // copy to clipboard
    async function copyToClipboard() {
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

    // initialize
    function init() {
        initTheme();

        // event listeners
        textInput.addEventListener('input', updateOutput);
        maxWidthInput.addEventListener('input', updateOutput);
        copyBtn.addEventListener('click', copyToClipboard);
        themeToggle.addEventListener('click', toggleTheme);

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
