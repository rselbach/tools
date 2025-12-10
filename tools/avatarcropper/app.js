// Avatar Cropper - Application Logic

(function() {
    'use strict';

    const AVATAR_SIZE = 256;

    // DOM elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    const editor = document.getElementById('editor');
    const editorCanvas = document.getElementById('editor-canvas');
    const cropOverlay = document.getElementById('crop-overlay');
    const cancelBtn = document.getElementById('cancel-btn');
    const cropBtn = document.getElementById('crop-btn');
    const result = document.getElementById('result');
    const resultImage = document.getElementById('result-image');
    const downloadBtn = document.getElementById('download-btn');
    const newBtn = document.getElementById('new-btn');
    const previewCanvas = document.getElementById('preview-canvas');

    // State
    let sourceImage = null;
    let canvasRect = null;
    let scale = 1;
    let crop = { x: 0, y: 0, size: 100 };
    let isDragging = false;
    let isResizing = false;
    let dragStart = { x: 0, y: 0 };
    let cropStart = { x: 0, y: 0, size: 0 };
    let resultBlob = null;

    // Initialize
    function init() {
        setupEventListeners();
    }

    // Event listeners
    function setupEventListeners() {

        // Drop zone
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                loadImage(e.target.files[0]);
            }
        });

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
            if (e.dataTransfer.files[0]) {
                loadImage(e.dataTransfer.files[0]);
            }
        });

        // Crop overlay interactions
        cropOverlay.addEventListener('mousedown', onCropMouseDown);
        cropOverlay.addEventListener('touchstart', onCropTouchStart, { passive: false });
        document.addEventListener('mousemove', onCropMouseMove);
        document.addEventListener('touchmove', onCropTouchMove, { passive: false });
        document.addEventListener('mouseup', onCropEnd);
        document.addEventListener('touchend', onCropEnd);

        // Buttons
        cancelBtn.addEventListener('click', resetToDropZone);
        cropBtn.addEventListener('click', cropAndDownload);
        downloadBtn.addEventListener('click', downloadResult);
        newBtn.addEventListener('click', resetToDropZone);

        // Window resize
        window.addEventListener('resize', updateCropOverlayPosition);
    }

    // Load image
    function loadImage(file) {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                sourceImage = img;
                showEditor();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Show editor
    function showEditor() {
        dropZone.classList.add('hidden');
        result.classList.add('hidden');
        editor.classList.remove('hidden');

        // Draw image on canvas
        const ctx = editorCanvas.getContext('2d');
        const container = editorCanvas.parentElement;
        const maxWidth = container.clientWidth;
        const maxHeight = 500;

        // Calculate scale to fit
        scale = Math.min(maxWidth / sourceImage.naturalWidth, maxHeight / sourceImage.naturalHeight, 1);
        
        editorCanvas.width = sourceImage.naturalWidth * scale;
        editorCanvas.height = sourceImage.naturalHeight * scale;

        ctx.drawImage(sourceImage, 0, 0, editorCanvas.width, editorCanvas.height);

        // Initialize crop area (centered square, as large as possible)
        const minDim = Math.min(editorCanvas.width, editorCanvas.height);
        crop.size = minDim * 0.8;
        crop.x = (editorCanvas.width - crop.size) / 2;
        crop.y = (editorCanvas.height - crop.size) / 2;

        updateCropOverlayPosition();
    }

    // Update crop overlay position
    function updateCropOverlayPosition() {
        if (!sourceImage) return;

        canvasRect = editorCanvas.getBoundingClientRect();

        cropOverlay.style.left = (canvasRect.left - editorCanvas.parentElement.getBoundingClientRect().left + crop.x) + 'px';
        cropOverlay.style.top = (canvasRect.top - editorCanvas.parentElement.getBoundingClientRect().top + crop.y) + 'px';
        cropOverlay.style.width = crop.size + 'px';
        cropOverlay.style.height = crop.size + 'px';

        updatePreview();
    }

    // Update live preview
    function updatePreview() {
        if (!sourceImage) return;

        const actualX = crop.x / scale;
        const actualY = crop.y / scale;
        const actualSize = crop.size / scale;

        const ctx = previewCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.clearRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
        ctx.drawImage(
            sourceImage,
            actualX, actualY, actualSize, actualSize,
            0, 0, AVATAR_SIZE, AVATAR_SIZE
        );
    }

    // Crop mouse/touch handlers
    function onCropMouseDown(e) {
        e.preventDefault();
        const rect = cropOverlay.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking on resize handle (bottom-right corner)
        if (x > rect.width - 20 && y > rect.height - 20) {
            isResizing = true;
        } else {
            isDragging = true;
        }

        dragStart = { x: e.clientX, y: e.clientY };
        cropStart = { ...crop };
    }

    function onCropTouchStart(e) {
        if (e.touches.length !== 1) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const rect = cropOverlay.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if (x > rect.width - 30 && y > rect.height - 30) {
            isResizing = true;
        } else {
            isDragging = true;
        }

        dragStart = { x: touch.clientX, y: touch.clientY };
        cropStart = { ...crop };
    }

    function onCropMouseMove(e) {
        if (!isDragging && !isResizing) return;
        handleCropMove(e.clientX, e.clientY);
    }

    function onCropTouchMove(e) {
        if (!isDragging && !isResizing) return;
        if (e.touches.length !== 1) return;
        e.preventDefault();
        handleCropMove(e.touches[0].clientX, e.touches[0].clientY);
    }

    function handleCropMove(clientX, clientY) {
        const dx = clientX - dragStart.x;
        const dy = clientY - dragStart.y;

        if (isResizing) {
            // Resize (keep square)
            const delta = Math.max(dx, dy);
            let newSize = cropStart.size + delta;
            
            // Constrain size
            const minSize = 50;
            const maxSize = Math.min(
                editorCanvas.width - cropStart.x,
                editorCanvas.height - cropStart.y
            );
            newSize = Math.max(minSize, Math.min(maxSize, newSize));
            
            crop.size = newSize;
        } else if (isDragging) {
            // Move
            let newX = cropStart.x + dx;
            let newY = cropStart.y + dy;

            // Constrain position
            newX = Math.max(0, Math.min(editorCanvas.width - crop.size, newX));
            newY = Math.max(0, Math.min(editorCanvas.height - crop.size, newY));

            crop.x = newX;
            crop.y = newY;
        }

        updateCropOverlayPosition();
    }

    function onCropEnd() {
        isDragging = false;
        isResizing = false;
    }

    // Crop and generate avatar
    function cropAndDownload() {
        // Calculate actual crop coordinates (in original image space)
        const actualX = crop.x / scale;
        const actualY = crop.y / scale;
        const actualSize = crop.size / scale;

        // Create output canvas
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = AVATAR_SIZE;
        outputCanvas.height = AVATAR_SIZE;

        const ctx = outputCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw cropped and resized image
        ctx.drawImage(
            sourceImage,
            actualX, actualY, actualSize, actualSize,
            0, 0, AVATAR_SIZE, AVATAR_SIZE
        );

        // Convert to blob and show result
        outputCanvas.toBlob((blob) => {
            resultBlob = blob;
            const url = URL.createObjectURL(blob);
            resultImage.src = url;

            editor.classList.add('hidden');
            result.classList.remove('hidden');
        }, 'image/png');
    }

    // Download result
    function downloadResult() {
        if (!resultBlob) return;

        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'avatar.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Reset to drop zone
    function resetToDropZone() {
        sourceImage = null;
        resultBlob = null;
        fileInput.value = '';

        editor.classList.add('hidden');
        result.classList.add('hidden');
        dropZone.classList.remove('hidden');
    }

    // Run
    init();
})();
