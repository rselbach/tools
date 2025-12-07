// Image to PNG - Application Logic

(function() {
    'use strict';

    // DOM elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const resultsContainer = document.getElementById('results');
    const themeToggle = document.getElementById('theme-toggle');

    // Initialize
    function init() {
        setupTheme();
        setupEventListeners();
    }

    // Theme handling
    function setupTheme() {
        const savedTheme = localStorage.getItem('img2png-theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('img2png-theme', newTheme);
    }

    // Event listeners
    function setupEventListeners() {
        // Theme toggle
        themeToggle.addEventListener('click', toggleTheme);

        // Drop zone click
        dropZone.addEventListener('click', () => fileInput.click());

        // File input change
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
            fileInput.value = ''; // Reset to allow same file selection
        });

        // Drag and drop events
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            handleFiles(e.dataTransfer.files);
        });
    }

    // Handle file(s)
    function handleFiles(files) {
        const validFiles = Array.from(files).filter(file => {
            return file.type === 'image/jpeg' || file.type === 'image/webp';
        });

        if (validFiles.length === 0) {
            return;
        }

        resultsContainer.classList.remove('hidden');

        validFiles.forEach(file => convertToPng(file));
    }

    // Convert image to PNG
    function convertToPng(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;

                const ctx = canvas.getContext('2d');

                // Draw image (PNG supports transparency, no background fill needed)
                ctx.drawImage(img, 0, 0);

                // Convert to PNG blob
                canvas.toBlob((blob) => {
                    displayResult(file, blob, img.naturalWidth, img.naturalHeight);
                }, 'image/png');
            };

            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    }

    // Display conversion result
    function displayResult(originalFile, pngBlob, width, height) {
        const originalSize = originalFile.size;
        const newSize = pngBlob.size;
        const diff = newSize - originalSize;
        const diffPercent = ((Math.abs(diff) / originalSize) * 100).toFixed(1);

        const pngUrl = URL.createObjectURL(pngBlob);
        const newFilename = originalFile.name.replace(/\.(jpe?g|webp)$/i, '.png');

        const card = document.createElement('div');
        card.className = 'result-card';

        const diffClass = diff > 0 ? 'result-increase' : 'result-savings';
        const diffText = diff > 0
            ? `${diffPercent}% larger`
            : `${diffPercent}% smaller`;

        const originalFormat = originalFile.type === 'image/jpeg' ? 'JPEG' : 'WebP';

        card.innerHTML = `
            <div class="result-header">
                <svg class="result-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span class="result-filename">${escapeHtml(newFilename)}</span>
            </div>
            <div class="result-body">
                <div class="result-preview">
                    <img src="${pngUrl}" alt="Converted image">
                </div>
                <div class="result-info">
                    <div class="result-stat">Dimensions: <span>${width} x ${height}</span></div>
                    <div class="result-stat">Original: <span>${formatBytes(originalSize)}</span> (${originalFormat})</div>
                    <div class="result-stat">Converted: <span>${formatBytes(newSize)}</span> (PNG)</div>
                    <div class="result-stat ${diffClass}">${diffText}</div>
                    <button class="download-btn" data-url="${pngUrl}" data-filename="${escapeHtml(newFilename)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Download
                    </button>
                </div>
            </div>
        `;

        // Add download handler
        const downloadBtn = card.querySelector('.download-btn');
        downloadBtn.addEventListener('click', () => {
            const a = document.createElement('a');
            a.href = downloadBtn.dataset.url;
            a.download = downloadBtn.dataset.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });

        // Insert at top of results
        resultsContainer.insertBefore(card, resultsContainer.firstChild);
    }

    // Utility: Format bytes
    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Utility: Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Run
    init();
})();
