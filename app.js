// Retrieve jsPDF from global window object
const { jsPDF } = window.jspdf || {};

// App State
const state = {
    originalImage: null,      // Image object
    processedCanvas: null,    // Canvas for adjustments
    processedCtx: null,
    
    // Paper settings
    paperSize: 'A4',          // A4, A3, A5, Letter, Legal, Custom
    paperWidth: 210,          // mm
    paperHeight: 297,         // mm
    orientation: 'portrait',  // portrait, landscape
    margins: 10,              // mm
    
    // Grid settings
    cols: 3,
    rows: 3,
    overlapEnabled: true,
    overlapSize: 5,           // mm
    
    // Raster settings
    rasterStyle: 'dot',       // dot, hex-dot, square, wave-line, crosshatch, cmyk, dither-fs, dither-atkinson, dither-bayer
    resolution: 40,           // shapes per page width
    shapeSize: 1.0,           // multiplier
    colorMode: 'color',       // color, grayscale, monochrome, custom
    colorFg: '#000000',
    colorBg: '#ffffff',
    
    // Image Adjustments
    brightness: 100,          // 50 - 150 %
    contrast: 100,            // 50 - 150 %
    saturation: 100,          // 0 - 200 %
    rotate: 0,                // 0, 90, 180, 270 deg
    alphaThreshold: 0,        // 0 - 255 alpha value
    
    // Export Settings
    addGuideSheet: true,
    addCropMarks: true,
    addCoordinates: true,
    
    // Viewport Navigation
    scale: 1,
    panX: 0,
    panY: 0,
    viewMode: 'poster',       // poster, single
    currentPageIndex: 0,      // for single page view mode
    
    // Pre-calculated Dither Grid
    ditherGrid: null
};

// UI Elements
const els = {
    imageInput: document.getElementById('image-input'),
    uploadZone: document.getElementById('upload-zone'),
    previewContainer: document.getElementById('preview-container'),
    sourcePreview: document.getElementById('source-preview'),
    btnRemoveImage: document.getElementById('btn-remove-image'),
    adjustControls: document.getElementById('adjust-controls'),
    
    // Adjustments
    sliderBrightness: document.getElementById('slider-brightness'),
    valBrightness: document.getElementById('val-brightness'),
    sliderContrast: document.getElementById('slider-contrast'),
    valContrast: document.getElementById('val-contrast'),
    sliderSaturation: document.getElementById('slider-saturation'),
    valSaturation: document.getElementById('val-saturation'),
    sliderRotate: document.getElementById('slider-rotate'),
    valRotate: document.getElementById('val-rotate'),
    sliderAlphaThreshold: document.getElementById('slider-alpha-threshold'),
    valAlphaThreshold: document.getElementById('val-alpha-threshold'),
    
    // Layout
    selectPaperSize: document.getElementById('select-paper-size'),
    customPaperDimensions: document.getElementById('custom-paper-dimensions'),
    inputPaperWidth: document.getElementById('input-paper-width'),
    inputPaperHeight: document.getElementById('input-paper-height'),
    btnPortrait: document.getElementById('btn-orientation-portrait'),
    btnLandscape: document.getElementById('btn-orientation-landscape'),
    sliderMargins: document.getElementById('slider-margins'),
    valMargins: document.getElementById('val-margins'),
    sliderCols: document.getElementById('slider-cols'),
    valCols: document.getElementById('val-cols'),
    sliderRows: document.getElementById('slider-rows'),
    valRows: document.getElementById('val-rows'),
    btnMatchAspect: document.getElementById('btn-match-aspect'),
    checkOverlap: document.getElementById('check-overlap'),
    overlapSizeContainer: document.getElementById('overlap-size-container'),
    sliderOverlap: document.getElementById('slider-overlap'),
    valOverlap: document.getElementById('val-overlap'),
    
    // Style
    selectRasterStyle: document.getElementById('select-raster-style'),
    controlResolution: document.getElementById('control-resolution'),
    sliderResolution: document.getElementById('slider-resolution'),
    valResolution: document.getElementById('val-resolution'),
    controlShapeSize: document.getElementById('control-shape-size'),
    sliderShapeSize: document.getElementById('slider-shape-size'),
    valShapeSize: document.getElementById('val-shape-size'),
    selectColorMode: document.getElementById('select-color-mode'),
    customColorPickers: document.getElementById('custom-color-pickers'),
    colorFg: document.getElementById('color-fg'),
    colorBg: document.getElementById('color-bg'),
    
    // Export
    checkGuideSheet: document.getElementById('check-guide-sheet'),
    checkCropMarks: document.getElementById('check-crop-marks'),
    checkCoordinates: document.getElementById('check-coordinates'),
    statPages: document.getElementById('stat-pages'),
    statSize: document.getElementById('stat-size'),
    statAspect: document.getElementById('stat-aspect'),
    statInk: document.getElementById('stat-ink'),
    btnGeneratePdf: document.getElementById('btn-generate-pdf'),
    progressContainer: document.getElementById('progress-container'),
    progressBar: document.getElementById('progress-bar'),
    progressStatus: document.getElementById('progress-status'),
    downloadActions: document.getElementById('download-actions'),
    btnDownloadPdf: document.getElementById('btn-download-pdf'),
    
    // Viewport
    canvas: document.getElementById('viewport-canvas'),
    canvasContainer: document.getElementById('canvas-container'),
    emptyState: document.getElementById('empty-state'),
    btnEmptyUpload: document.getElementById('btn-empty-upload'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnZoomReset: document.getElementById('btn-zoom-reset'),
    btnViewPoster: document.getElementById('btn-view-poster'),
    btnViewSingle: document.getElementById('btn-view-single'),
    pageSelectorBar: document.getElementById('page-selector-bar'),
    pageIndicator: document.getElementById('page-indicator'),
    btnPrevPage: document.getElementById('btn-prev-page'),
    btnNextPage: document.getElementById('btn-next-page')
};

// Paper standards in mm (Width x Height in Portrait)
const PAPER_SIZES = {
    A4: { w: 210, h: 297 },
    A3: { w: 297, h: 420 },
    A5: { w: 148, h: 210 },
    Letter: { w: 215.9, h: 279.4 },
    Legal: { w: 215.9, h: 355.6 }
};

// Preset Themes Definitions
const PRESETS = {
    default: {
        rasterStyle: 'dot',
        colorMode: 'color',
        shapeSize: 1.0,
        resolution: 40,
        colorFg: '#000000',
        colorBg: '#ffffff'
    },
    blueprint: {
        rasterStyle: 'wave-line',
        colorMode: 'custom',
        shapeSize: 1.1,
        resolution: 45,
        colorFg: '#ffffff',
        colorBg: '#0f4c9c'
    },
    popart: {
        rasterStyle: 'dot',
        colorMode: 'custom',
        shapeSize: 1.4,
        resolution: 25,
        colorFg: '#00ffcc',
        colorBg: '#ff0055'
    },
    cyberpunk: {
        rasterStyle: 'cmyk',
        colorMode: 'color',
        shapeSize: 1.2,
        resolution: 35,
        colorFg: '#000000',
        colorBg: '#07020d'
    },
    comic: {
        rasterStyle: 'dot',
        colorMode: 'grayscale',
        shapeSize: 1.2,
        resolution: 30,
        colorFg: '#000000',
        colorBg: '#fffbf0'
    }
};

// Canvas variables
let ctx = els.canvas.getContext('2d');
let isPanning = false;
let startPanX = 0;
let startPanY = 0;

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    handleResize();
    window.addEventListener('resize', handleResize);
});

// Setup event handling
function initEventListeners() {
    // Tabs Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`panel-${btn.dataset.tab}`).classList.add('active');
        });
    });

    // Preset Buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyPreset(btn.dataset.preset);
        });
    });

    // Image Upload Events
    els.btnEmptyUpload.addEventListener('click', () => els.imageInput.click());
    els.uploadZone.addEventListener('click', (e) => {
        if (e.target !== els.imageInput) els.imageInput.click();
    });
    
    els.uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        els.uploadZone.classList.add('dragover');
    });
    
    els.uploadZone.addEventListener('dragleave', () => {
        els.uploadZone.classList.remove('dragover');
    });
    
    els.uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        els.uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleImageFile(e.dataTransfer.files[0]);
        }
    });
    
    els.imageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageFile(e.target.files[0]);
        }
    });

    els.btnRemoveImage.addEventListener('click', removeImage);

    // Adjustments Input Events
    setupSlider(els.sliderBrightness, els.valBrightness, '%', (v) => { state.brightness = v; triggerImageReprocess(); });
    setupSlider(els.sliderContrast, els.valContrast, '%', (v) => { state.contrast = v; triggerImageReprocess(); });
    setupSlider(els.sliderSaturation, els.valSaturation, '%', (v) => { state.saturation = v; triggerImageReprocess(); });
    setupSlider(els.sliderRotate, els.valRotate, '°', (v) => { state.rotate = parseInt(v); triggerImageReprocess(); });
    setupSlider(els.sliderAlphaThreshold, els.valAlphaThreshold, '', (v) => { state.alphaThreshold = parseInt(v); triggerImageReprocess(); });

    // Paper Size Settings
    els.selectPaperSize.addEventListener('change', (e) => {
        const size = e.target.value;
        state.paperSize = size;
        if (size === 'Custom') {
            els.customPaperDimensions.classList.remove('hidden');
            state.paperWidth = parseFloat(els.inputPaperWidth.value);
            state.paperHeight = parseFloat(els.inputPaperHeight.value);
        } else {
            els.customPaperDimensions.classList.add('hidden');
            state.paperWidth = PAPER_SIZES[size].w;
            state.paperHeight = PAPER_SIZES[size].h;
        }
        recalcPosterGrid();
    });

    els.inputPaperWidth.addEventListener('change', (e) => {
        state.paperWidth = Math.max(50, parseFloat(e.target.value) || 210);
        recalcPosterGrid();
    });

    els.inputPaperHeight.addEventListener('change', (e) => {
        state.paperHeight = Math.max(50, parseFloat(e.target.value) || 297);
        recalcPosterGrid();
    });

    els.btnPortrait.addEventListener('click', () => {
        state.orientation = 'portrait';
        els.btnPortrait.classList.add('active');
        els.btnLandscape.classList.remove('active');
        recalcPosterGrid();
    });

    els.btnLandscape.addEventListener('click', () => {
        state.orientation = 'landscape';
        els.btnLandscape.classList.add('active');
        els.btnPortrait.classList.remove('active');
        recalcPosterGrid();
    });

    setupSlider(els.sliderMargins, els.valMargins, ' mm', (v) => { state.margins = parseInt(v); triggerRender(); });
    setupSlider(els.sliderCols, els.valCols, '', (v) => { state.cols = parseInt(v); triggerRender(); recalcPosterGrid(); });
    setupSlider(els.sliderRows, els.valRows, '', (v) => { state.rows = parseInt(v); triggerRender(); recalcPosterGrid(); });
    
    els.btnMatchAspect.addEventListener('click', matchImageAspect);
    
    // Overlapping Margin toggles
    els.checkOverlap.addEventListener('change', (e) => {
        state.overlapEnabled = e.target.checked;
        if (state.overlapEnabled) {
            els.overlapSizeContainer.classList.remove('hidden');
        } else {
            els.overlapSizeContainer.classList.add('hidden');
        }
        triggerRender();
    });
    setupSlider(els.sliderOverlap, els.valOverlap, ' mm', (v) => { state.overlapSize = parseInt(v); triggerRender(); });

    // Styles Events
    els.selectRasterStyle.addEventListener('change', (e) => {
        state.rasterStyle = e.target.value;
        toggleStyleControlVisibility();
        triggerDitherAndRender();
    });

    setupSlider(els.sliderResolution, els.valResolution, '', (v) => { state.resolution = parseInt(v); triggerDitherAndRender(); });
    setupSlider(els.sliderShapeSize, els.valShapeSize, 'x', (v) => { state.shapeSize = parseFloat(v); triggerRender(); });

    els.selectColorMode.addEventListener('change', (e) => {
        state.colorMode = e.target.value;
        if (state.colorMode === 'custom') {
            els.customColorPickers.classList.remove('hidden');
        } else {
            els.customColorPickers.classList.add('hidden');
        }
        triggerRender();
    });

    els.colorFg.addEventListener('input', (e) => { state.colorFg = e.target.value; triggerRender(); });
    els.colorBg.addEventListener('input', (e) => { state.colorBg = e.target.value; triggerRender(); });

    // Export Toggles
    els.checkGuideSheet.addEventListener('change', (e) => { state.addGuideSheet = e.target.checked; });
    els.checkCropMarks.addEventListener('change', (e) => { state.addCropMarks = e.target.checked; triggerRender(); });
    els.checkCoordinates.addEventListener('change', (e) => { state.addCoordinates = e.target.checked; triggerRender(); });

    els.btnGeneratePdf.addEventListener('click', generatePosterPdf);

    // Viewport Camera Interactions
    els.canvas.addEventListener('mousedown', startPanningCanvas);
    window.addEventListener('mousemove', panCanvas);
    window.addEventListener('mouseup', stopPanningCanvas);
    els.canvas.addEventListener('wheel', wheelZoomCanvas, { passive: false });

    // Zoom Buttons
    els.btnZoomIn.addEventListener('click', () => zoomCamera(1.2));
    els.btnZoomOut.addEventListener('click', () => zoomCamera(1 / 1.2));
    els.btnZoomReset.addEventListener('click', resetCamera);

    // View Modes
    els.btnViewPoster.addEventListener('click', () => {
        state.viewMode = 'poster';
        els.btnViewPoster.classList.add('active');
        els.btnViewSingle.classList.remove('active');
        els.pageSelectorBar.classList.add('hidden');
        triggerRender();
    });
    
    els.btnViewSingle.addEventListener('click', () => {
        state.viewMode = 'single';
        els.btnViewSingle.classList.add('active');
        els.btnViewPoster.classList.remove('active');
        els.pageSelectorBar.classList.remove('hidden');
        updatePageIndicator();
        triggerRender();
    });

    els.btnPrevPage.addEventListener('click', () => {
        const total = state.cols * state.rows;
        state.currentPageIndex = (state.currentPageIndex - 1 + total) % total;
        updatePageIndicator();
        triggerRender();
    });

    els.btnNextPage.addEventListener('click', () => {
        const total = state.cols * state.rows;
        state.currentPageIndex = (state.currentPageIndex + 1) % total;
        updatePageIndicator();
        triggerRender();
    });
}

// Slider helper
function setupSlider(slider, labelEl, suffix, callback) {
    slider.addEventListener('input', (e) => {
        const val = e.target.value;
        labelEl.textContent = val + suffix;
        callback(val);
    });
}

// Fit Canvas to parent
function handleResize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = els.canvasContainer.getBoundingClientRect();
    els.canvas.width = rect.width * dpr;
    els.canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    triggerRender();
}

// Upload/Loader logic
function handleImageFile(file) {
    if (!file.type.match('image.*')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            state.originalImage = img;
            els.sourcePreview.src = e.target.result;
            
            els.previewContainer.classList.remove('hidden');
            els.uploadZone.classList.add('hidden');
            els.emptyState.classList.add('hidden');
            
            // Enable controls
            document.querySelectorAll('.disabled-until-image').forEach(el => {
                el.classList.add('active-state');
            });
            els.btnGeneratePdf.removeAttribute('disabled');
            els.btnGeneratePdf.classList.remove('disabled');

            processImage();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    state.originalImage = null;
    state.processedCanvas = null;
    state.processedCtx = null;
    state.processedPixels = null;
    state.ditherGrid = null;
    
    els.imageInput.value = '';
    els.sourcePreview.src = '';
    els.previewContainer.classList.add('hidden');
    els.uploadZone.classList.remove('hidden');
    els.emptyState.classList.remove('hidden');
    
    // Disable controls
    document.querySelectorAll('.disabled-until-image').forEach(el => {
        el.classList.remove('active-state');
    });
    els.btnGeneratePdf.setAttribute('disabled', 'true');
    els.btnGeneratePdf.classList.add('disabled');
    els.downloadActions.classList.add('hidden');
    
    resetCamera();
    clearCanvas();
}

// Image Adjustment Engine
function processImage() {
    if (!state.originalImage) return;

    const img = state.originalImage;
    let w = img.naturalWidth;
    let h = img.naturalHeight;

    // Create canvas if not exists
    if (!state.processedCanvas) {
        state.processedCanvas = document.createElement('offscreenCanvas');
        state.processedCanvas = document.createElement('canvas');
    }
    
    // Handle rotation dimensions
    const is90Rotated = state.rotate === 90 || state.rotate === 270;
    const canvasW = is90Rotated ? h : w;
    const canvasH = is90Rotated ? w : h;
    
    // Max size limit for editing speed (e.g. max width/height 1600px)
    const MAX_DIM = 1600;
    let scaleFactor = 1;
    if (canvasW > MAX_DIM || canvasH > MAX_DIM) {
        scaleFactor = MAX_DIM / Math.max(canvasW, canvasH);
    }
    
    state.processedCanvas.width = canvasW * scaleFactor;
    state.processedCanvas.height = canvasH * scaleFactor;
    
    state.processedCtx = state.processedCanvas.getContext('2d');
    state.processedCtx.clearRect(0, 0, state.processedCanvas.width, state.processedCanvas.height);
    
    state.processedCtx.save();
    // Move to center of canvas to rotate
    state.processedCtx.translate(state.processedCanvas.width / 2, state.processedCanvas.height / 2);
    state.processedCtx.rotate((state.rotate * Math.PI) / 180);
    
    // Draw scaled original image centered
    const drawW = w * scaleFactor;
    const drawH = h * scaleFactor;
    state.processedCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    state.processedCtx.restore();

    // Pixel manipulation
    const imgData = state.processedCtx.getImageData(0, 0, state.processedCanvas.width, state.processedCanvas.height);
    const data = imgData.data;

    const b = state.brightness / 100;
    const c = state.contrast / 100;
    const s = state.saturation / 100;
    const thresh = state.alphaThreshold;

    // Contrast factor
    const factor = (259 * (state.contrast + 255)) / (255 * (259 - state.contrast));

    for (let i = 0; i < data.length; i += 4) {
        // Alpha Threshold check
        if (data[i + 3] < thresh) {
            data[i + 3] = 0; // Filter transparency
            continue;
        }

        let r = data[i];
        let g = data[i + 1];
        let bPixel = data[i + 2];

        // 1. Brightness
        r = r * b;
        g = g * b;
        bPixel = bPixel * b;

        // 2. Contrast
        if (state.contrast !== 100) {
            r = factor * (r - 128) + 128;
            g = factor * (g - 128) + 128;
            bPixel = factor * (bPixel - 128) + 128;
        }

        // 3. Saturation (standard luma weights)
        if (state.saturation !== 100) {
            const gray = 0.2989 * r + 0.5870 * g + 0.1140 * bPixel;
            r = gray + (r - gray) * s;
            g = gray + (g - gray) * s;
            bPixel = gray + (bPixel - gray) * s;
        }

        // Clamp
        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, bPixel));
    }

    state.processedCtx.putImageData(imgData, 0, 0);
    state.processedPixels = imgData.data;

    // After rotation/processing, if we are in poster mode, match aspect ratios automatically on load
    if (state.originalImage && state.rotate !== this._lastRotate) {
        matchImageAspect();
        this._lastRotate = state.rotate;
    } else {
        recalcPosterGrid();
    }
}

// Timer for debouncing heavy image adjustments
let processTimeout = null;
function triggerImageReprocess() {
    if (processTimeout) clearTimeout(processTimeout);
    processTimeout = setTimeout(() => {
        processImage();
    }, 100);
}

// recalculate poster specifications
function recalcPosterGrid() {
    if (!state.originalImage) return;

    // Get current paper sizes
    const wPage = getPaperW();
    const hPage = getPaperH();
    
    // Total physical dimensions in cm
    const totalW = (state.cols * wPage) / 10;
    const totalH = (state.rows * hPage) / 10;
    els.statPages.textContent = `${state.cols * state.rows} (${state.cols} x ${state.rows})`;
    els.statSize.textContent = `${totalW.toFixed(1)} x ${totalH.toFixed(1)} cm`;
    
    // Calculate aspect ratio alignment
    const imageAspect = state.processedCanvas.width / state.processedCanvas.height;
    const posterAspect = (state.cols * wPage) / (state.rows * hPage);
    const ratioDiff = Math.abs(imageAspect - posterAspect) / imageAspect;
    
    if (ratioDiff < 0.05) {
        els.statAspect.textContent = `1:${imageAspect.toFixed(2)} (Matches)`;
        els.statAspect.style.color = 'var(--color-success)';
    } else {
        els.statAspect.textContent = `Image 1:${imageAspect.toFixed(2)} | Grid 1:${posterAspect.toFixed(2)}`;
        els.statAspect.style.color = 'var(--color-warning)';
    }

    triggerDitherAndRender();
}

function matchImageAspect() {
    if (!state.originalImage) return;
    
    const wPage = getPaperW();
    const hPage = getPaperH();
    const imageAspect = state.processedCanvas.width / state.processedCanvas.height;
    
    // Adjust rows based on columns to fit aspect ratio
    const currentCols = state.cols;
    const recommendedRows = Math.round((currentCols * wPage) / (hPage * imageAspect));
    
    state.rows = Math.min(20, Math.max(1, recommendedRows));
    
    // Update UI slider value
    els.sliderRows.value = state.rows;
    els.valRows.textContent = state.rows;
    
    recalcPosterGrid();
}

// Apply quick presets
function applyPreset(presetName) {
    const config = PRESETS[presetName];
    if (!config) return;
    
    state.rasterStyle = config.rasterStyle;
    els.selectRasterStyle.value = config.rasterStyle;
    
    state.colorMode = config.colorMode;
    els.selectColorMode.value = config.colorMode;
    
    state.shapeSize = config.shapeSize;
    els.sliderShapeSize.value = config.shapeSize;
    els.valShapeSize.textContent = config.shapeSize + 'x';
    
    state.resolution = config.resolution;
    els.sliderResolution.value = config.resolution;
    els.valResolution.textContent = config.resolution;
    
    state.colorFg = config.colorFg;
    els.colorFg.value = config.colorFg;
    state.colorBg = config.colorBg;
    els.colorBg.value = config.colorBg;
    
    // Hide/show color controls
    if (state.colorMode === 'custom') {
        els.customColorPickers.classList.remove('hidden');
    } else {
        els.customColorPickers.classList.add('hidden');
    }
    
    toggleStyleControlVisibility();
    triggerDitherAndRender();
}

function toggleStyleControlVisibility() {
    const isDither = state.rasterStyle.startsWith('dither');
    const isCmyk = state.rasterStyle === 'cmyk';
    
    if (isDither) {
        els.controlShapeSize.classList.add('hidden');
        els.selectColorMode.value = 'monochrome';
        state.colorMode = 'monochrome';
        els.selectColorMode.setAttribute('disabled', 'true');
        els.customColorPickers.classList.add('hidden');
    } else {
        els.controlShapeSize.classList.remove('hidden');
        els.selectColorMode.removeAttribute('disabled');
    }

    if (isCmyk) {
        els.selectColorMode.value = 'color';
        state.colorMode = 'color';
        els.selectColorMode.setAttribute('disabled', 'true');
        els.customColorPickers.classList.add('hidden');
    }
}

// Generate Dither Screen
function triggerDitherAndRender() {
    if (!state.originalImage) return;

    if (state.rasterStyle.startsWith('dither')) {
        // Calculate the dither resolution grid for the entire poster
        // Grid Width = columns * shapesPerPage
        const totalGridW = state.cols * state.resolution;
        const totalGridH = Math.round(totalGridW * (state.rows * getPaperH()) / (state.cols * getPaperW()));
        
        generateDitherGrid(totalGridW, totalGridH);
    } else {
        state.ditherGrid = null;
    }
    
    triggerRender();
}

function generateDitherGrid(targetW, targetH) {
    // Create tiny offscreen canvas matching the resolution cells
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetW;
    tempCanvas.height = targetH;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw cropped image onto grid coordinates
    const scale = getPosterScale(targetW, targetH);
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, targetW, targetH);
    tempCtx.drawImage(state.processedCanvas, scale.x, scale.y, scale.w, scale.h, 0, 0, targetW, targetH);
    
    const imgData = tempCtx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;
    
    // Grayscale luma mapping
    const grayBuffer = new Float32Array(targetW * targetH);
    for (let i = 0; i < data.length; i += 4) {
        const idx = i / 4;
        const alpha = data[i + 3];
        if (alpha === 0) {
            grayBuffer[idx] = 255; // White background
        } else {
            grayBuffer[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
    }
    
    // Dithering execution
    const outGrid = new Uint8Array(targetW * targetH); // 0 = Ink (Black), 1 = Paper (White)
    
    if (state.rasterStyle === 'dither-fs') {
        // Floyd-Steinberg error diffusion
        for (let y = 0; y < targetH; y++) {
            for (let x = 0; x < targetW; x++) {
                const idx = y * targetW + x;
                const oldVal = grayBuffer[idx];
                const newVal = oldVal < 128 ? 0 : 255;
                outGrid[idx] = oldVal < 128 ? 0 : 1;
                const err = oldVal - newVal;
                
                // Diffuse
                if (x + 1 < targetW) grayBuffer[idx + 1] += err * (7 / 16);
                if (y + 1 < targetH) {
                    if (x - 1 >= 0) grayBuffer[idx + targetW - 1] += err * (3 / 16);
                    grayBuffer[idx + targetW] += err * (5 / 16);
                    if (x + 1 < targetW) grayBuffer[idx + targetW + 1] += err * (1 / 16);
                }
            }
        }
    } else if (state.rasterStyle === 'dither-atkinson') {
        // Atkinson error diffusion (divides error into 8 parts and propagates to 6 neighbors)
        for (let y = 0; y < targetH; y++) {
            for (let x = 0; x < targetW; x++) {
                const idx = y * targetW + x;
                const oldVal = grayBuffer[idx];
                const newVal = oldVal < 128 ? 0 : 255;
                outGrid[idx] = oldVal < 128 ? 0 : 1;
                const err = (oldVal - newVal) / 8;
                
                if (x + 1 < targetW) grayBuffer[idx + 1] += err;
                if (x + 2 < targetW) grayBuffer[idx + 2] += err;
                if (y + 1 < targetH) {
                    if (x - 1 >= 0) grayBuffer[idx + targetW - 1] += err;
                    grayBuffer[idx + targetW] += err;
                    if (x + 1 < targetW) grayBuffer[idx + targetW + 1] += err;
                }
                if (y + 2 < targetH) {
                    grayBuffer[idx + 2 * targetW] += err;
                }
            }
        }
    } else if (state.rasterStyle === 'dither-bayer') {
        // Bayer 4x4 Threshold Ordered matrix
        const bayer4x4 = [
            [ 0,  8,  2, 10],
            [12,  4, 14,  6],
            [ 3, 11,  1,  9],
            [15,  7, 13,  5]
        ];
        for (let y = 0; y < targetH; y++) {
            for (let x = 0; x < targetW; x++) {
                const idx = y * targetW + x;
                const val = grayBuffer[idx] / 16;
                const threshold = bayer4x4[y % 4][x % 4];
                outGrid[idx] = val < threshold ? 0 : 1;
            }
        }
    }
    
    state.ditherGrid = {
        width: targetW,
        height: targetH,
        data: outGrid
    };
}

// Helpers for paper sizes
function getPaperW() { return state.orientation === 'portrait' ? state.paperWidth : state.paperHeight; }
function getPaperH() { return state.orientation === 'portrait' ? state.paperHeight : state.paperWidth; }

// Image-to-Poster scale mapping
function getPosterScale(gridW, gridH) {
    const imgW = state.processedCanvas.width;
    const imgH = state.processedCanvas.height;
    const imgAspect = imgW / imgH;
    const gridAspect = gridW / gridH;
    
    let sx = 0, sy = 0, sw = imgW, sh = imgH;
    if (imgAspect > gridAspect) {
        // Image is wider than grid, crop horizontal sides
        sw = imgH * gridAspect;
        sx = (imgW - sw) / 2;
    } else if (imgAspect < gridAspect) {
        // Image is taller than grid, crop vertical bottom/top
        sh = imgW / gridAspect;
        sy = (imgH - sh) / 2;
    }
    
    return { x: sx, y: sy, w: sw, h: sh };
}

// Ink density estimator
function estimateInkDensity() {
    if (!state.originalImage) return;

    // Simulate pixel scanning in low resolution to estimate dark coverage
    const scanCanvas = document.createElement('canvas');
    scanCanvas.width = 60;
    scanCanvas.height = Math.round(60 * (state.rows * getPaperH()) / (state.cols * getPaperW()));
    const scanCtx = scanCanvas.getContext('2d');
    
    const scale = getPosterScale(scanCanvas.width, scanCanvas.height);
    scanCtx.fillStyle = '#ffffff';
    scanCtx.fillRect(0, 0, scanCanvas.width, scanCanvas.height);
    scanCtx.drawImage(state.processedCanvas, scale.x, scale.y, scale.w, scale.h, 0, 0, scanCanvas.width, scanCanvas.height);
    
    const data = scanCtx.getImageData(0, 0, scanCanvas.width, scanCanvas.height).data;
    let darknessSum = 0;
    let validPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
        const a = data[i+3];
        if (a > 0) {
            const gray = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
            darknessSum += (255 - gray);
            validPixels++;
        }
    }
    
    const avgDarkness = validPixels > 0 ? (darknessSum / validPixels) / 255 : 0;
    els.statInk.textContent = `${(avgDarkness * 100).toFixed(0)}%`;
}

// Vector scaling calculation for rendering loop
function getLuminanceAtPosterCoord(xPos, yPos, scalePoster, sx, sy, imgW, imgH) {
    const pxX = Math.floor(sx + xPos * scalePoster);
    const pxY = Math.floor(sy + yPos * scalePoster);
    
    if (pxX < 0 || pxX >= imgW || pxY < 0 || pxY >= imgH) {
        return { r: 255, g: 255, b: 255, a: 0, luma: 255 }; // Blank boundary
    }
    
    if (!state.processedPixels) {
        return { r: 255, g: 255, b: 255, a: 0, luma: 255 };
    }
    
    const idx = (pxY * imgW + pxX) * 4;
    const r = state.processedPixels[idx];
    const g = state.processedPixels[idx + 1];
    const b = state.processedPixels[idx + 2];
    const a = state.processedPixels[idx + 3];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    
    return { r, g, b, a, luma };
}

// Camera control helpers
function startPanningCanvas(e) {
    isPanning = true;
    startPanX = e.clientX - state.panX;
    startPanY = e.clientY - state.panY;
}

function panCanvas(e) {
    if (!isPanning) return;
    state.panX = e.clientX - startPanX;
    state.panY = e.clientY - startPanY;
    renderViewport();
}

function stopPanningCanvas() {
    isPanning = false;
}

function wheelZoomCanvas(e) {
    e.preventDefault();
    const zoomFactor = 1.1;
    const oldScale = state.scale;
    
    if (e.deltaY < 0) {
        state.scale = Math.min(state.scale * zoomFactor, 25);
    } else {
        state.scale = Math.max(state.scale / zoomFactor, 0.05);
    }
    
    // Zoom relative to pointer position
    const rect = els.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mouseX = (e.clientX - rect.left) * dpr / dpr - els.canvas.width / (2 * dpr);
    const mouseY = (e.clientY - rect.top) * dpr / dpr - els.canvas.height / (2 * dpr);
    
    state.panX = mouseX - (mouseX - state.panX) * (state.scale / oldScale);
    state.panY = mouseY - (mouseY - state.panY) * (state.scale / oldScale);
    
    renderViewport();
}

function zoomCamera(factor) {
    state.scale = Math.min(25, Math.max(0.05, state.scale * factor));
    renderViewport();
}

function resetCamera() {
    state.scale = 1;
    state.panX = 0;
    state.panY = 0;
    
    // Auto-fit calculations
    if (state.originalImage) {
        const wPage = getPaperW();
        const hPage = getPaperH();
        const posterW = state.cols * wPage;
        const posterH = state.rows * hPage;
        
        const pad = 40;
        const rect = els.canvasContainer.getBoundingClientRect();
        const scaleW = (rect.width - pad) / posterW;
        const scaleH = (rect.height - pad) / posterH;
        
        state.scale = Math.min(scaleW, scaleH);
    }
    
    renderViewport();
}

function clearCanvas() {
    ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
}

// Render viewport loop
let renderRequested = false;
function triggerRender() {
    if (renderRequested) return;
    renderRequested = true;
    requestAnimationFrame(() => {
        renderViewport();
        renderRequested = false;
    });
}

function renderViewport() {
    clearCanvas();
    if (!state.originalImage) return;

    const dpr = window.devicePixelRatio || 1;
    const viewW = els.canvas.width / dpr;
    const viewH = els.canvas.height / dpr;

    ctx.save();
    // Center camera
    ctx.translate(viewW / 2 + state.panX, viewH / 2 + state.panY);
    ctx.scale(state.scale, state.scale);

    const wPage = getPaperW();
    const hPage = getPaperH();

    if (state.viewMode === 'poster') {
        // Draw the full multi-page grid poster
        for (let row = 0; row < state.rows; row++) {
            for (let col = 0; col < state.cols; col++) {
                drawPageSheet(col, row, col * wPage, row * hPage);
            }
        }
    } else {
        // Single page view mode
        const index = state.currentPageIndex;
        const col = index % state.cols;
        const row = Math.floor(index / state.cols);
        
        // Render centered single sheet page
        drawPageSheet(col, row, -wPage / 2, -hPage / 2);
    }

    ctx.restore();
    estimateInkDensity();
}

function updatePageIndicator() {
    const total = state.cols * state.rows;
    els.pageIndicator.textContent = `Page ${state.currentPageIndex + 1} of ${total}`;
}

// Render a single sheet of paper with all styling and vector elements
function drawPageSheet(col, row, xOffset, yOffset) {
    const wPage = getPaperW();
    const hPage = getPaperH();
    const m = state.margins;
    const isDither = state.rasterStyle.startsWith('dither');

    // Theme Background
    let pageBg = '#ffffff';
    let inkColor = '#000000';
    if (state.colorMode === 'custom') {
        pageBg = state.colorBg;
        inkColor = state.colorFg;
    } else if (state.rasterStyle === 'cmyk') {
        pageBg = '#ffffff'; // CMYK always white paper
    }
    
    // Draw Sheet Drop Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 10 / state.scale; // Scale shadow radius with zoom
    ctx.shadowOffsetX = 3 / state.scale;
    ctx.shadowOffsetY = 3 / state.scale;
    ctx.fillStyle = pageBg;
    ctx.fillRect(xOffset, yOffset, wPage, hPage);
    ctx.restore();

    // Draw printable bounds guide (Subtle grey dashed margin border)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.strokeStyle = '#cccccc';
    ctx.setLineDash([2 / state.scale, 2 / state.scale]);
    ctx.lineWidth = 0.5 / state.scale;
    ctx.strokeRect(xOffset + m, yOffset + m, wPage - 2 * m, hPage - 2 * m);
    ctx.setLineDash([]); // Reset dash

    // CLIP rendering context to margins to simulate printing boundary
    ctx.save();
    ctx.beginPath();
    ctx.rect(xOffset + m, yOffset + m, wPage - 2 * m, hPage - 2 * m);
    ctx.clip();

    // Rasterization calculations
    const imgW = state.processedCanvas.width;
    const imgH = state.processedCanvas.height;
    
    // Poster dimensions
    const posterW = state.cols * wPage;
    const posterH = state.rows * hPage;
    const posterScale = getPosterScale(posterW, posterH);

    // Scaling ratio: mm to pixels on source canvas
    const scalePoster = posterScale.w / posterW;
    const sx = posterScale.x;
    const sy = posterScale.y;

    // Execute selected style rendering
    if (isDither) {
        renderDitherStyle(col, row, xOffset, yOffset, inkColor);
    } else if (state.rasterStyle === 'cmyk') {
        renderCmykHalftone(col, row, xOffset, yOffset, scalePoster, sx, sy, imgW, imgH);
    } else {
        renderShapeHalftone(col, row, xOffset, yOffset, scalePoster, sx, sy, imgW, imgH, inkColor);
    }

    ctx.restore(); // Remove clipping mask

    // Overlapping guide marks overlay (Draw on top of sheets for clarity)
    if (state.overlapEnabled) {
        drawOverlapGuidelines(col, row, xOffset, yOffset);
    }

    // Crop Marks (Printed at page corners)
    if (state.addCropMarks) {
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 0.3 / state.scale;
        
        const lLen = 6; // Mark arm length in mm
        const gap = 0;  // Gap from corner
        
        // Margins coordinates
        const xL = xOffset + m;
        const xR = xOffset + wPage - m;
        const yT = yOffset + m;
        const yB = yOffset + hPage - m;
        
        // Top Left Crop
        ctx.beginPath();
        ctx.moveTo(xL - gap, yT - lLen); ctx.lineTo(xL - gap, yT);
        ctx.moveTo(xL - lLen, yT - gap); ctx.lineTo(xL, yT - gap);
        // Top Right Crop
        ctx.moveTo(xR + gap, yT - lLen); ctx.lineTo(xR + gap, yT);
        ctx.moveTo(xR + lLen, yT - gap); ctx.lineTo(xR, yT - gap);
        // Bottom Left Crop
        ctx.moveTo(xL - gap, yB + lLen); ctx.lineTo(xL - gap, yB);
        ctx.moveTo(xL - lLen, yB + gap); ctx.lineTo(xL, yB + gap);
        // Bottom Right Crop
        ctx.moveTo(xR + gap, yB + lLen); ctx.lineTo(xR + gap, yB);
        ctx.moveTo(xR + lLen, yB + gap); ctx.lineTo(xR, yB + gap);
        ctx.stroke();
    }

    // Page Coordinates Text Helper
    if (state.addCoordinates) {
        ctx.fillStyle = '#888888';
        ctx.font = `${Math.max(3.5, 4 / state.scale)}px var(--font-body)`;
        ctx.textAlign = 'center';
        
        // Print row/col markers on the bottom margin
        const marker = `Page ${col + 1}-${row + 1}  (Row ${row + 1}, Col ${col + 1})`;
        ctx.fillText(marker, xOffset + wPage / 2, yOffset + hPage - m / 2 + 1);
    }
}

// 1. Shapes Renderer (Halftone Circles, Hex dots, Squares, Wave Engraving, Crosshatch)
function renderShapeHalftone(col, row, xOffset, yOffset, scalePoster, sx, sy, imgW, imgH, inkColor) {
    const wPage = getPaperW();
    const hPage = getPaperH();
    const m = state.margins;
    const res = state.resolution;
    
    const printW = wPage - 2 * m;
    const printH = hPage - 2 * m;
    
    // Cell dimension in mm
    const cellSize = printW / res;
    const resH = Math.round(printH / cellSize);
    
    ctx.fillStyle = inkColor;
    ctx.strokeStyle = inkColor;
    
    if (state.rasterStyle === 'dot') {
        // REGULAR CIRLCE GRID
        for (let r = 0; r < resH; r++) {
            for (let c = 0; c < res; c++) {
                const cellX = m + (c + 0.5) * cellSize;
                const cellY = m + (r + 0.5) * cellSize;
                
                // Poster absolute mm coordinates
                const pX = col * wPage + cellX;
                const pY = row * hPage + cellY;
                
                const pixel = getLuminanceAtPosterCoord(pX, pY, scalePoster, sx, sy, imgW, imgH);
                if (pixel.a === 0) continue; // Transparency skip
                
                const darkness = 1.0 - (pixel.luma / 255.0);
                const radius = (cellSize / 2) * darkness * state.shapeSize;
                
                if (radius > 0.1) {
                    if (state.colorMode === 'color') ctx.fillStyle = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
                    else if (state.colorMode === 'grayscale') {
                        const gray = Math.round(pixel.luma);
                        ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
                    }
                    
                    ctx.beginPath();
                    ctx.arc(xOffset + cellX, yOffset + cellY, radius, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }
    } else if (state.rasterStyle === 'hex-dot') {
        // HEXAGONAL STAGGERED CIRCLES
        const hexCellH = cellSize * 0.866025; // cos(30)
        const hexResH = Math.round(printH / hexCellH);
        
        for (let r = 0; r < hexResH; r++) {
            const shiftX = (r % 2 === 0) ? 0 : cellSize / 2;
            for (let c = 0; c < res + 1; c++) {
                const cellX = m + shiftX + (c - 0.25) * cellSize;
                // Clip checks
                if (cellX < m || cellX > wPage - m) continue;
                
                const cellY = m + (r + 0.5) * hexCellH;
                if (cellY < m || cellY > hPage - m) continue;
                
                const pX = col * wPage + cellX;
                const pY = row * hPage + cellY;
                
                const pixel = getLuminanceAtPosterCoord(pX, pY, scalePoster, sx, sy, imgW, imgH);
                if (pixel.a === 0) continue;
                
                const darkness = 1.0 - (pixel.luma / 255.0);
                const radius = (cellSize / 2) * darkness * state.shapeSize;
                
                if (radius > 0.1) {
                    if (state.colorMode === 'color') ctx.fillStyle = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
                    else if (state.colorMode === 'grayscale') {
                        const gray = Math.round(pixel.luma);
                        ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
                    }
                    
                    ctx.beginPath();
                    ctx.arc(xOffset + cellX, yOffset + cellY, radius, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }
    } else if (state.rasterStyle === 'square') {
        // SQUARE GRID (MOSAIC)
        for (let r = 0; r < resH; r++) {
            for (let c = 0; c < res; c++) {
                const cellX = m + (c + 0.5) * cellSize;
                const cellY = m + (r + 0.5) * cellSize;
                
                const pX = col * wPage + cellX;
                const pY = row * hPage + cellY;
                
                const pixel = getLuminanceAtPosterCoord(pX, pY, scalePoster, sx, sy, imgW, imgH);
                if (pixel.a === 0) continue;
                
                const darkness = 1.0 - (pixel.luma / 255.0);
                const sqSize = cellSize * darkness * state.shapeSize;
                
                if (sqSize > 0.15) {
                    if (state.colorMode === 'color') ctx.fillStyle = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
                    else if (state.colorMode === 'grayscale') {
                        const gray = Math.round(pixel.luma);
                        ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
                    }
                    
                    ctx.fillRect(
                        xOffset + cellX - sqSize / 2, 
                        yOffset + cellY - sqSize / 2, 
                        sqSize, 
                        sqSize
                    );
                }
            }
        }
    } else if (state.rasterStyle === 'triangle') {
        // TRIANGLE GRID
        for (let r = 0; r < resH; r++) {
            for (let c = 0; c < res; c++) {
                const cellX = m + (c + 0.5) * cellSize;
                const cellY = m + (r + 0.5) * cellSize;
                
                const pX = col * wPage + cellX;
                const pY = row * hPage + cellY;
                
                const pixel = getLuminanceAtPosterCoord(pX, pY, scalePoster, sx, sy, imgW, imgH);
                if (pixel.a === 0) continue;
                
                const darkness = 1.0 - (pixel.luma / 255.0);
                const size = (cellSize / 2) * darkness * state.shapeSize;
                
                if (size > 0.1) {
                    if (state.colorMode === 'color') ctx.fillStyle = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
                    else if (state.colorMode === 'grayscale') {
                        const gray = Math.round(pixel.luma);
                        ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
                    }
                    
                    ctx.beginPath();
                    ctx.moveTo(xOffset + cellX, yOffset + cellY - size);
                    ctx.lineTo(xOffset + cellX - size * 0.866, yOffset + cellY + size * 0.5);
                    ctx.lineTo(xOffset + cellX + size * 0.866, yOffset + cellY + size * 0.5);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }
    } else if (state.rasterStyle === 'star') {
        // STAR GRID
        for (let r = 0; r < resH; r++) {
            for (let c = 0; c < res; c++) {
                const cellX = m + (c + 0.5) * cellSize;
                const cellY = m + (r + 0.5) * cellSize;
                
                const pX = col * wPage + cellX;
                const pY = row * hPage + cellY;
                
                const pixel = getLuminanceAtPosterCoord(pX, pY, scalePoster, sx, sy, imgW, imgH);
                if (pixel.a === 0) continue;
                
                const darkness = 1.0 - (pixel.luma / 255.0);
                const size = (cellSize / 2) * darkness * state.shapeSize;
                
                if (size > 0.1) {
                    if (state.colorMode === 'color') ctx.fillStyle = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
                    else if (state.colorMode === 'grayscale') {
                        const gray = Math.round(pixel.luma);
                        ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
                    }
                    
                    ctx.beginPath();
                    for (let i = 0; i < 10; i++) {
                        const angle = (i * Math.PI) / 5 - Math.PI / 2;
                        const currRad = i % 2 === 0 ? size : size * 0.4;
                        const x = xOffset + cellX + currRad * Math.cos(angle);
                        const y = yOffset + cellY + currRad * Math.sin(angle);
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }
    } else if (state.rasterStyle === 'heart') {
        // HEART GRID (Parametric Polygon)
        for (let r = 0; r < resH; r++) {
            for (let c = 0; c < res; c++) {
                const cellX = m + (c + 0.5) * cellSize;
                const cellY = m + (r + 0.5) * cellSize;
                
                const pX = col * wPage + cellX;
                const pY = row * hPage + cellY;
                
                const pixel = getLuminanceAtPosterCoord(pX, pY, scalePoster, sx, sy, imgW, imgH);
                if (pixel.a === 0) continue;
                
                const darkness = 1.0 - (pixel.luma / 255.0);
                const size = (cellSize / 2) * darkness * state.shapeSize;
                
                if (size > 0.1) {
                    if (state.colorMode === 'color') ctx.fillStyle = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
                    else if (state.colorMode === 'grayscale') {
                        const gray = Math.round(pixel.luma);
                        ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
                    }
                    
                    ctx.beginPath();
                    const steps = 24;
                    for (let i = 0; i <= steps; i++) {
                        const t = (i / steps) * 2 * Math.PI;
                        const heartX = 16 * Math.pow(Math.sin(t), 3);
                        const heartY = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
                        
                        const x = xOffset + cellX + size * (heartX / 17);
                        const y = yOffset + cellY - size * (heartY / 17);
                        
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }
    } else if (state.rasterStyle === 'lego') {
        // LEGO GRID (3D Studs)
        for (let r = 0; r < resH; r++) {
            for (let c = 0; c < res; c++) {
                const cellX = m + (c + 0.5) * cellSize;
                const cellY = m + (r + 0.5) * cellSize;
                
                const pX = col * wPage + cellX;
                const pY = row * hPage + cellY;
                
                const pixel = getLuminanceAtPosterCoord(pX, pY, scalePoster, sx, sy, imgW, imgH);
                if (pixel.a === 0) continue;
                
                const darkness = 1.0 - (pixel.luma / 255.0);
                const size = cellSize * 0.95;
                
                if (darkness > 0.02) {
                    let rColor = pixel.r;
                    let gColor = pixel.g;
                    let bColor = pixel.b;
                    
                    if (state.colorMode === 'grayscale') {
                        rColor = gColor = bColor = Math.round(pixel.luma);
                    } else if (state.colorMode === 'monochrome') {
                        rColor = gColor = bColor = 0;
                    } else if (state.colorMode === 'custom') {
                        const match = inkColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
                        if (match) {
                            rColor = parseInt(match[1], 16);
                            gColor = parseInt(match[2], 16);
                            bColor = parseInt(match[3], 16);
                        }
                    }
                    
                    ctx.fillStyle = `rgb(${rColor}, ${gColor}, ${bColor})`;
                    ctx.fillRect(xOffset + cellX - size / 2, yOffset + cellY - size / 2, size, size);
                    
                    const rStud = Math.min(255, rColor + 40);
                    const gStud = Math.min(255, gColor + 40);
                    const bStud = Math.min(255, bColor + 40);
                    
                    const studSize = size * 0.22 * darkness * state.shapeSize;
                    if (studSize > 0.1) {
                        ctx.fillStyle = `rgb(${rStud}, ${gStud}, ${bStud})`;
                        ctx.beginPath();
                        ctx.arc(xOffset + cellX, yOffset + cellY, studSize, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                }
            }
        }
    } else if (state.rasterStyle === 'wave-line') {
        // ENGRAVING HORIZONTAL WAVES
        // Space between lines
        const waveSpacing = printH / res;
        ctx.lineWidth = 0.5 / state.scale;
        
        for (let r = 0; r < res + 1; r++) {
            const cellY = m + r * waveSpacing;
            
            // Generate continuous polygon representing variable width wave
            ctx.beginPath();
            
            const steps = 60; // subdivisions across page
            const stepSz = printW / steps;
            
            // Render Top Path (Left to Right)
            for (let i = 0; i <= steps; i++) {
                const cellX = m + i * stepSz;
                const pX = col * wPage + cellX;
                const pY = row * hPage + cellY;
                
                const pixel = getLuminanceAtPosterCoord(pX, pY, scalePoster, sx, sy, imgW, imgH);
                const darkness = pixel.a === 0 ? 0 : 1.0 - (pixel.luma / 255.0);
                
                // Calculate thickness and sinusoidal engraving waves
                const thickness = waveSpacing * darkness * state.shapeSize * 0.95;
                const sinWave = 0.8 * Math.sin((cellX * 2 * Math.PI) / 8); // Sine displacement
                
                const yDraw = cellY + sinWave - thickness / 2;
                if (i === 0) ctx.moveTo(xOffset + cellX, yOffset + yDraw);
                else ctx.lineTo(xOffset + cellX, yOffset + yDraw);
            }
            
            // Render Bottom Path (Right to Left back)
            for (let i = steps; i >= 0; i--) {
                const cellX = m + i * stepSz;
                const pX = col * wPage + cellX;
                const pY = row * hPage + cellY;
                
                const pixel = getLuminanceAtPosterCoord(pX, pY, scalePoster, sx, sy, imgW, imgH);
                const darkness = pixel.a === 0 ? 0 : 1.0 - (pixel.luma / 255.0);
                
                const thickness = waveSpacing * darkness * state.shapeSize * 0.95;
                const sinWave = 0.8 * Math.sin((cellX * 2 * Math.PI) / 8);
                
                const yDraw = cellY + sinWave + thickness / 2;
                ctx.lineTo(xOffset + cellX, yOffset + yDraw);
            }
            
            ctx.closePath();
            
            // Color Mapping
            if (state.colorMode === 'color' || state.colorMode === 'grayscale') {
                // Sample color at line center
                const midX = m + printW / 2;
                const midPixel = getLuminanceAtPosterCoord(col * wPage + midX, row * hPage + cellY, scalePoster, sx, sy, imgW, imgH);
                if (state.colorMode === 'color') ctx.fillStyle = `rgb(${midPixel.r}, ${midPixel.g}, ${midPixel.b})`;
                else {
                    const gray = Math.round(midPixel.luma);
                    ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
                }
            }
            ctx.fill();
        }
    } else if (state.rasterStyle === 'crosshatch') {
        // SKETCH HATCHING
        const hatchSpacing = printW / res;
        
        // Scan diagonal spacing ranges
        const maxDiagonal = printW + printH;
        const lineCount = Math.round(maxDiagonal / hatchSpacing);
        
        ctx.lineWidth = 1.0 * state.shapeSize;
        ctx.lineCap = 'round';
        const steps = 30;
        
        // Layer 1: Diagonal hatch at 45 deg
        for (let i = 0; i < lineCount; i++) {
            const diagOffset = i * hatchSpacing;
            
            // Trace the angled line segment in intervals to change line widths dynamically
            ctx.beginPath();
            
            let drawing = false;
            
            for (let sIdx = 0; sIdx <= steps; sIdx++) {
                const t = sIdx / steps;
                // Parametric diagonal coordinates
                const cellX = diagOffset * t;
                const cellY = diagOffset * (1 - t);
                
                // Bound checks
                if (cellX >= m && cellX <= wPage - m && cellY >= m && cellY <= hPage - m) {
                    const pX = col * wPage + cellX;
                    const pY = row * hPage + cellY;
                    
                    const pixel = getLuminanceAtPosterCoord(pX, pY, scalePoster, sx, sy, imgW, imgH);
                    const darkness = pixel.a === 0 ? 0 : 1.0 - (pixel.luma / 255.0);
                    
                    if (darkness > 0.15) { // Threshold for hatching lines
                        ctx.lineWidth = Math.min(hatchSpacing * 0.4, 0.4 + darkness * 2.0 * state.shapeSize);
                        
                        if (state.colorMode === 'color') ctx.strokeStyle = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
                        else if (state.colorMode === 'grayscale') {
                            const gray = Math.round(pixel.luma);
                            ctx.strokeStyle = `rgb(${gray}, ${gray}, ${gray})`;
                        }
                        
                        const drawX = xOffset + cellX;
                        const drawY = yOffset + cellY;
                        
                        if (!drawing) {
                            ctx.beginPath();
                            ctx.moveTo(drawX, drawY);
                            drawing = true;
                        } else {
                            ctx.lineTo(drawX, drawY);
                            ctx.stroke();
                            
                            // Break path and start new weight to simulate vector stroke scaling
                            ctx.beginPath();
                            ctx.moveTo(drawX, drawY);
                        }
                    } else {
                        drawing = false;
                    }
                } else {
                    drawing = false;
                }
            }
        }
        
        // Layer 2: Perpendicular hatch only in dark shadows (luma < 120)
        for (let i = 0; i < lineCount; i++) {
            const diagOffset = i * hatchSpacing;
            ctx.beginPath();
            let drawing = false;
            
            for (let sIdx = 0; sIdx <= steps; sIdx++) {
                const t = sIdx / steps;
                // Parametric opposite diagonal coords
                const cellX = wPage - (diagOffset * t);
                const cellY = diagOffset * (1 - t);
                
                if (cellX >= m && cellX <= wPage - m && cellY >= m && cellY <= hPage - m) {
                    const pX = col * wPage + cellX;
                    const pY = row * hPage + cellY;
                    
                    const pixel = getLuminanceAtPosterCoord(pX, pY, scalePoster, sx, sy, imgW, imgH);
                    const darkness = pixel.a === 0 ? 0 : 1.0 - (pixel.luma / 255.0);
                    
                    if (darkness > 0.55) { // Crosshatch drawn in shadows
                        ctx.lineWidth = Math.min(hatchSpacing * 0.3, 0.2 + (darkness - 0.5) * 2.0 * state.shapeSize);
                        
                        if (state.colorMode === 'color') ctx.strokeStyle = `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`;
                        else if (state.colorMode === 'grayscale') {
                            const gray = Math.round(pixel.luma);
                            ctx.strokeStyle = `rgb(${gray}, ${gray}, ${gray})`;
                        }
                        
                        const drawX = xOffset + cellX;
                        const drawY = yOffset + cellY;
                        
                        if (!drawing) {
                            ctx.beginPath();
                            ctx.moveTo(drawX, drawY);
                            drawing = true;
                        } else {
                            ctx.lineTo(drawX, drawY);
                            ctx.stroke();
                            
                            ctx.beginPath();
                            ctx.moveTo(drawX, drawY);
                        }
                    } else {
                        drawing = false;
                    }
                } else {
                    drawing = false;
                }
            }
        }
    }
}

// 2. Rotated CMYK Halftone Screen overlapping vector dots
function renderCmykHalftone(col, row, xOffset, yOffset, scalePoster, sx, sy, imgW, imgH) {
    const wPage = getPaperW();
    const hPage = getPaperH();
    const m = state.margins;
    const printW = wPage - 2 * m;
    const printH = hPage - 2 * m;
    
    const cellSize = printW / state.resolution;
    
    // Total poster size
    const posterW = state.cols * wPage;
    const posterH = state.rows * hPage;
    
    // Channels & rotated screen angles (Standard CMYK screens: C=15, M=75, Y=0, K=45)
    const channels = [
        { name: 'cyan', color: '#00b4d8', angle: 15 },
        { name: 'magenta', color: '#f72585', angle: 75 },
        { name: 'yellow', color: '#ffb703', angle: 0 },
        { name: 'black', color: '#000000', angle: 45 }
    ];
    
    ctx.save();
    ctx.globalCompositeOperation = 'multiply'; // Blends colors physically like printing ink overlays
    
    // Poster global center coordinates
    const gCenterX = posterW / 2;
    const gCenterY = posterH / 2;

    channels.forEach(ch => {
        ctx.fillStyle = ch.color;
        const rad = (ch.angle * Math.PI) / 180;
        
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        // Project corners of printable area to rotated coordinates to find loop limits
        // Corners relative to poster center
        const corners = [
            { x: col * wPage + m - gCenterX, y: row * hPage + m - gCenterY },
            { x: col * wPage + wPage - m - gCenterX, y: row * hPage + m - gCenterY },
            { x: col * wPage + m - gCenterX, y: row * hPage + hPage - m - gCenterY },
            { x: col * wPage + wPage - m - gCenterX, y: row * hPage + hPage - m - gCenterY }
        ];
        
        let uMin = Infinity, uMax = -Infinity;
        let vMin = Infinity, vMax = -Infinity;
        
        corners.forEach(p => {
            const u = p.x * cos + p.y * sin;
            const v = -p.x * sin + p.y * cos;
            if (u < uMin) uMin = u;
            if (u > uMax) uMax = u;
            if (v < vMin) vMin = v;
            if (v > vMax) vMax = v;
        });
        
        // Align loop bounds to grid increments
        const startU = Math.floor(uMin / cellSize) * cellSize;
        const endU = Math.ceil(uMax / cellSize) * cellSize;
        const startV = Math.floor(vMin / cellSize) * cellSize;
        const endV = Math.ceil(vMax / cellSize) * cellSize;
        
        // Iterate rotated screen grid
        for (let u = startU; u <= endU; u += cellSize) {
            for (let v = startV; v <= endV; v += cellSize) {
                // Transform rotated coordinate back to global poster space
                const gX = u * cos - v * sin;
                const gY = u * sin + v * cos;
                
                // Global position to local page positions
                const xLocal = gX + gCenterX - col * wPage;
                const yLocal = gY + gCenterY - row * hPage;
                
                // Margin bounds check
                if (xLocal >= m && xLocal <= wPage - m && yLocal >= m && yLocal <= hPage - m) {
                    const posterX = gX + gCenterX;
                    const posterY = gY + gCenterY;
                    
                    const pixel = getLuminanceAtPosterCoord(posterX, posterY, scalePoster, sx, sy, imgW, imgH);
                    if (pixel.a === 0) continue;
                    
                    // Convert RGB to CMYK
                    const cmyk = rgbToCmyk(pixel.r, pixel.g, pixel.b);
                    let intensity = 0;
                    
                    if (ch.name === 'cyan') intensity = cmyk.c;
                    else if (ch.name === 'magenta') intensity = cmyk.m;
                    else if (ch.name === 'yellow') intensity = cmyk.y;
                    else if (ch.name === 'black') intensity = cmyk.k;
                    
                    const radius = (cellSize / 2) * intensity * state.shapeSize;
                    if (radius > 0.1) {
                        ctx.beginPath();
                        ctx.arc(xOffset + xLocal, yOffset + yLocal, radius, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                }
            }
        }
    });
    
    ctx.restore();
}

function rgbToCmyk(r, g, b) {
    const rN = r / 255;
    const gN = g / 255;
    const bN = b / 255;
    
    const k = 1 - Math.max(rN, gN, bN);
    const c = k === 1 ? 0 : (1 - rN - k) / (1 - k);
    const m = k === 1 ? 0 : (1 - gN - k) / (1 - k);
    const y = k === 1 ? 0 : (1 - bN - k) / (1 - k);
    
    return { c, m, y, k };
}

// 3. Error Diffusion / Ordered Dither Screen Renderer
function renderDitherStyle(col, row, xOffset, yOffset, inkColor) {
    if (!state.ditherGrid) return;
    
    const wPage = getPaperW();
    const hPage = getPaperH();
    const m = state.margins;
    const printW = wPage - 2 * m;
    const printH = hPage - 2 * m;
    
    // Pixel resolution dimensions of our precalculated dither screen
    const gridW = state.ditherGrid.width;
    const gridH = state.ditherGrid.height;
    
    // Tiling columns and rows limits
    const cols = state.cols;
    const rows = state.rows;
    
    // Cell size of dither pixels in mm
    const cellW = printW / state.resolution;
    
    ctx.fillStyle = inkColor;
    
    // Find dither grid index bounds that correspond to this sheet's margins
    // Global poster index range:
    const colStartIdx = col * state.resolution;
    
    const totalRowCells = Math.round(printH / cellW);
    const rowStartIdx = row * totalRowCells;
    
    for (let r = 0; r < totalRowCells; r++) {
        const gridY = rowStartIdx + r;
        if (gridY >= gridH) continue;
        
        const cellY = m + r * cellW;
        
        for (let c = 0; c < state.resolution; c++) {
            const gridX = colStartIdx + c;
            if (gridX >= gridW) continue;
            
            const cellX = m + c * cellW;
            
            const gridIdx = gridY * gridW + gridX;
            const inkStatus = state.ditherGrid.data[gridIdx]; // 0 = Ink, 1 = White
            
            if (inkStatus === 0) { // Black pixel, draw solid tile
                ctx.fillRect(
                    xOffset + cellX, 
                    yOffset + cellY, 
                    cellW + 0.05, // Overlap slightly to prevent subpixel screen rendering gaps
                    cellW + 0.05
                );
            }
        }
    }
}

// Helper to draw alignment overlaps
function drawOverlapGuidelines(col, row, xOffset, yOffset) {
    const wPage = getPaperW();
    const hPage = getPaperH();
    const m = state.margins;
    const overlap = state.overlapSize;
    
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 64, 129, 0.45)'; // Neon red overlap indicators
    ctx.lineWidth = 0.4 / state.scale;
    ctx.setLineDash([1 / state.scale, 1.5 / state.scale]);
    
    // Draw guide lines on right and bottom borders if neighboring page exists
    if (col < state.cols - 1) {
        // Draw overlap zone on right border
        const lineX = xOffset + wPage - m;
        ctx.beginPath();
        ctx.moveTo(lineX + overlap, yOffset + m);
        ctx.lineTo(lineX + overlap, yOffset + hPage - m);
        ctx.stroke();
    }
    
    if (row < state.rows - 1) {
        // Draw overlap zone on bottom border
        const lineY = yOffset + hPage - m;
        ctx.beginPath();
        ctx.moveTo(xOffset + m, lineY + overlap);
        ctx.lineTo(xOffset + wPage - m, lineY + overlap);
        ctx.stroke();
    }
    
    ctx.restore();
}

// ==========================================
// PDF GENERATION LOGIC (jsPDF Core)
// ==========================================

async function generatePosterPdf() {
    if (!state.originalImage) return;
    
    // Update progress indicator
    els.progressContainer.classList.remove('hidden');
    els.downloadActions.classList.add('hidden');
    updateProgress(5, 'Initializing layout settings...');
    
    // Let DOM update
    await delay(100);

    const wPage = getPaperW();
    const hPage = getPaperH();
    
    // Create jsPDF document instance (dimensions in mm)
    const orientationChar = state.orientation === 'portrait' ? 'p' : 'l';
    const doc = new jsPDF({
        orientation: orientationChar,
        unit: 'mm',
        format: [wPage, hPage]
    });
    
    const totalPages = state.cols * state.rows;
    let pagesProcessed = 0;
    
    // Step 1: Assembly Guide Minimap Cover Page
    if (state.addGuideSheet) {
        updateProgress(10, 'Creating Assembly Guide Map...');
        drawPdfGuideCover(doc, wPage, hPage);
        doc.addPage();
        await delay(50);
    }
    
    // Step 2: Render grid pages
    for (let row = 0; row < state.rows; row++) {
        for (let col = 0; col < state.cols; col++) {
            pagesProcessed++;
            const pct = 10 + (pagesProcessed / totalPages) * 85;
            updateProgress(pct, `Compiling poster page ${pagesProcessed} of ${totalPages}...`);
            
            // Add page if not first
            if (pagesProcessed > 1) {
                doc.addPage([wPage, hPage], orientationChar);
            }
            
            // Render rasterized page vectors directly into jsPDF PDF structure
            await drawPdfPage(doc, col, row, wPage, hPage);
            await delay(30); // Yield to keep main thread responsive
        }
    }
    
    updateProgress(98, 'Saving vector document streams...');
    await delay(100);
    
    // Output PDF Data URL
    try {
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        els.btnDownloadPdf.href = pdfUrl;
        els.btnDownloadPdf.download = `rasterprint_poster_${state.cols}x${state.rows}.pdf`;
        
        els.downloadActions.classList.remove('hidden');
        updateProgress(100, 'Poster ready for download!');
    } catch (err) {
        console.error('PDF Generation failed: ', err);
        updateProgress(0, 'Failed to compile PDF. Try reducing resolution.');
    }
}

// Drawing PDF Page vector items
async function drawPdfPage(doc, col, row, wPage, hPage) {
    const m = state.margins;
    const isDither = state.rasterStyle.startsWith('dither');
    
    // Draw background colors (For custom Dual-Tone)
    let pageBg = '#ffffff';
    let inkColor = '#000000';
    if (state.colorMode === 'custom') {
        pageBg = state.colorBg;
        inkColor = state.colorFg;
    } else if (state.rasterStyle === 'cmyk') {
        pageBg = '#ffffff';
    }
    
    if (pageBg !== '#ffffff') {
        doc.setFillColor(pageBg);
        doc.rect(0, 0, wPage, hPage, 'F');
    }
    
    // Image scale math
    const imgW = state.processedCanvas.width;
    const imgH = state.processedCanvas.height;
    const posterW = state.cols * wPage;
    const posterH = state.rows * hPage;
    const posterScale = getPosterScale(posterW, posterH);
    const scalePoster = posterScale.w / posterW;
    const sx = posterScale.x;
    const sy = posterScale.y;
    
    // IMPORTANT: For dithering patterns, vector cells are tiny and massive in quantity.
    // To prevent PDF crashing on 100k vector blocks, we render dither pages onto an high-DPI
    // raster page canvas, and append it as a crisp image!
    if (isDither) {
        await renderPdfDitherAsImage(doc, col, row, wPage, hPage, pageBg, inkColor);
        return;
    }
    
    // Vector Shapes Drawing (Native PDF Vectors!)
    const printW = wPage - 2 * m;
    const printH = hPage - 2 * m;
    const res = state.resolution;
    const cellSize = printW / res;
    const resH = Math.round(printH / cellSize);
    
    doc.setFillColor(inkColor);
    doc.setDrawColor(inkColor);
    
    // Clipping bounds mock: Since jsPDF clip requires complex paths, we can simulate clipping
    // by restricting coordinates of loops inside margins.
    
    if (state.rasterStyle === 'dot') {
        // VECTOR CIRCLES
        for (let r = 0; r < resH; r++) {
            for (let c = 0; c < res; c++) {
                const cellX = m + (c + 0.5) * cellSize;
                const cellY = m + (r + 0.5) * cellSize;
                
                const pixel = getLuminanceAtPosterCoord(col * wPage + cellX, row * hPage + cellY, scalePoster, sx, sy, imgW, imgH);
                if (pixel.a === 0) continue;
                
                const darkness = 1.0 - (pixel.luma / 255.0);
                const radius = (cellSize / 2) * darkness * state.shapeSize;
                
                if (radius > 0.05) {
                    if (state.colorMode === 'color') {
                        doc.setFillColor(pixel.r, pixel.g, pixel.b);
                    } else if (state.colorMode === 'grayscale') {
                        const gray = Math.round(pixel.luma);
                        doc.setFillColor(gray, gray, gray);
                    } else {
                        doc.setFillColor(inkColor);
                    }
                    doc.circle(cellX, cellY, radius, 'F');
                }
            }
        }
    } else if (state.rasterStyle === 'hex-dot') {
        // HEX VECTOR CIRCLES
        const hexCellH = cellSize * 0.866025;
        const hexResH = Math.round(printH / hexCellH);
        
        for (let r = 0; r < hexResH; r++) {
            const shiftX = (r % 2 === 0) ? 0 : cellSize / 2;
            for (let c = 0; c < res + 1; c++) {
                const cellX = m + shiftX + (c - 0.25) * cellSize;
                if (cellX < m || cellX > wPage - m) continue;
                
                const cellY = m + (r + 0.5) * hexCellH;
                if (cellY < m || cellY > hPage - m) continue;
                
                const pixel = getLuminanceAtPosterCoord(col * wPage + cellX, row * hPage + cellY, scalePoster, sx, sy, imgW, imgH);
                if (pixel.a === 0) continue;
                
                const darkness = 1.0 - (pixel.luma / 255.0);
                const radius = (cellSize / 2) * darkness * state.shapeSize;
                
                if (radius > 0.05) {
                    if (state.colorMode === 'color') {
                        doc.setFillColor(pixel.r, pixel.g, pixel.b);
                    } else if (state.colorMode === 'grayscale') {
                        const gray = Math.round(pixel.luma);
                        doc.setFillColor(gray, gray, gray);
                    } else {
                        doc.setFillColor(inkColor);
                    }
                    doc.circle(cellX, cellY, radius, 'F');
                }
            }
        }
    } else if (state.rasterStyle === 'square') {
        // VECTOR MOSAIC SQUARES
        for (let r = 0; r < resH; r++) {
            for (let c = 0; c < res; c++) {
                const cellX = m + (c + 0.5) * cellSize;
                const cellY = m + (r + 0.5) * cellSize;
                
                const pixel = getLuminanceAtPosterCoord(col * wPage + cellX, row * hPage + cellY, scalePoster, sx, sy, imgW, imgH);
                if (pixel.a === 0) continue;
                
                const darkness = 1.0 - (pixel.luma / 255.0);
                const sqSize = cellSize * darkness * state.shapeSize;
                
                if (sqSize > 0.08) {
                    if (state.colorMode === 'color') {
                        doc.setFillColor(pixel.r, pixel.g, pixel.b);
                    } else if (state.colorMode === 'grayscale') {
                        const gray = Math.round(pixel.luma);
                        doc.setFillColor(gray, gray, gray);
                    } else {
                        doc.setFillColor(inkColor);
                    }
                    doc.rect(cellX - sqSize / 2, cellY - sqSize / 2, sqSize, sqSize, 'F');
                }
            }
        }
    } else if (state.rasterStyle === 'triangle') {
        // VECTOR TRIANGLES
        for (let r = 0; r < resH; r++) {
            for (let c = 0; c < res; c++) {
                const cellX = m + (c + 0.5) * cellSize;
                const cellY = m + (r + 0.5) * cellSize;
                
                const pixel = getLuminanceAtPosterCoord(col * wPage + cellX, row * hPage + cellY, scalePoster, sx, sy, imgW, imgH);
                if (pixel.a === 0) continue;
                
                const darkness = 1.0 - (pixel.luma / 255.0);
                const size = (cellSize / 2) * darkness * state.shapeSize;
                
                if (size > 0.05) {
                    if (state.colorMode === 'color') {
                        doc.setFillColor(pixel.r, pixel.g, pixel.b);
                    } else if (state.colorMode === 'grayscale') {
                        const gray = Math.round(pixel.luma);
                        doc.setFillColor(gray, gray, gray);
                    } else {
                        doc.setFillColor(inkColor);
                    }
                    
                    const p = [
                        { x: cellX, y: cellY - size },
                        { x: cellX - size * 0.866, y: cellY + size * 0.5 },
                        { x: cellX + size * 0.866, y: cellY + size * 0.5 }
                    ];
                    doc.polygon(p, 'F');
                }
            }
        }
    } else if (state.rasterStyle === 'star') {
        // VECTOR STARS
        for (let r = 0; r < resH; r++) {
            for (let c = 0; c < res; c++) {
                const cellX = m + (c + 0.5) * cellSize;
                const cellY = m + (r + 0.5) * cellSize;
                
                const pixel = getLuminanceAtPosterCoord(col * wPage + cellX, row * hPage + cellY, scalePoster, sx, sy, imgW, imgH);
                if (pixel.a === 0) continue;
                
                const darkness = 1.0 - (pixel.luma / 255.0);
                const size = (cellSize / 2) * darkness * state.shapeSize;
                
                if (size > 0.05) {
                    if (state.colorMode === 'color') {
                        doc.setFillColor(pixel.r, pixel.g, pixel.b);
                    } else if (state.colorMode === 'grayscale') {
                        const gray = Math.round(pixel.luma);
                        doc.setFillColor(gray, gray, gray);
                    } else {
                        doc.setFillColor(inkColor);
                    }
                    
                    const pts = [];
                    for (let i = 0; i < 10; i++) {
                        const angle = (i * Math.PI) / 5 - Math.PI / 2;
                        const currRad = i % 2 === 0 ? size : size * 0.4;
                        pts.push({
                            x: cellX + currRad * Math.cos(angle),
                            y: cellY + currRad * Math.sin(angle)
                        });
                    }
                    doc.polygon(pts, 'F');
                }
            }
        }
    } else if (state.rasterStyle === 'heart') {
        // VECTOR HEARTS
        for (let r = 0; r < resH; r++) {
            for (let c = 0; c < res; c++) {
                const cellX = m + (c + 0.5) * cellSize;
                const cellY = m + (r + 0.5) * cellSize;
                
                const pixel = getLuminanceAtPosterCoord(col * wPage + cellX, row * hPage + cellY, scalePoster, sx, sy, imgW, imgH);
                if (pixel.a === 0) continue;
                
                const darkness = 1.0 - (pixel.luma / 255.0);
                const size = (cellSize / 2) * darkness * state.shapeSize;
                
                if (size > 0.05) {
                    if (state.colorMode === 'color') {
                        doc.setFillColor(pixel.r, pixel.g, pixel.b);
                    } else if (state.colorMode === 'grayscale') {
                        const gray = Math.round(pixel.luma);
                        doc.setFillColor(gray, gray, gray);
                    } else {
                        doc.setFillColor(inkColor);
                    }
                    
                    const pts = [];
                    const steps = 24;
                    for (let i = 0; i <= steps; i++) {
                        const t = (i / steps) * 2 * Math.PI;
                        const heartX = 16 * Math.pow(Math.sin(t), 3);
                        const heartY = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
                        
                        pts.push({
                            x: cellX + size * (heartX / 17),
                            y: cellY - size * (heartY / 17)
                        });
                    }
                    doc.polygon(pts, 'F');
                }
            }
        }
    } else if (state.rasterStyle === 'lego') {
        // VECTOR LEGO BRICKS
        for (let r = 0; r < resH; r++) {
            for (let c = 0; c < res; c++) {
                const cellX = m + (c + 0.5) * cellSize;
                const cellY = m + (r + 0.5) * cellSize;
                
                const pixel = getLuminanceAtPosterCoord(col * wPage + cellX, row * hPage + cellY, scalePoster, sx, sy, imgW, imgH);
                if (pixel.a === 0) continue;
                
                const darkness = 1.0 - (pixel.luma / 255.0);
                const size = cellSize * 0.95;
                
                if (darkness > 0.02) {
                    let rColor = pixel.r;
                    let gColor = pixel.g;
                    let bColor = pixel.b;
                    
                    if (state.colorMode === 'grayscale') {
                        rColor = gColor = bColor = Math.round(pixel.luma);
                    } else if (state.colorMode === 'monochrome') {
                        rColor = gColor = bColor = 0;
                    } else if (state.colorMode === 'custom') {
                        const match = inkColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
                        if (match) {
                            rColor = parseInt(match[1], 16);
                            gColor = parseInt(match[2], 16);
                            bColor = parseInt(match[3], 16);
                        }
                    }
                    
                    // Draw base brick rect
                    doc.setFillColor(rColor, gColor, bColor);
                    doc.rect(cellX - size / 2, cellY - size / 2, size, size, 'F');
                    
                    // Draw raised brick stud
                    const rStud = Math.min(255, rColor + 40);
                    const gStud = Math.min(255, gColor + 40);
                    const bStud = Math.min(255, bColor + 40);
                    
                    const studSize = size * 0.22 * darkness * state.shapeSize;
                    if (studSize > 0.05) {
                        doc.setFillColor(rStud, gStud, bStud);
                        doc.circle(cellX, cellY, studSize, 'F');
                    }
                }
            }
        }
    } else if (state.rasterStyle === 'wave-line') {
        // VECTOR WAVE ENGRAVINGS (Drawn as solid poly paths to support variable thickness)
        const waveSpacing = printH / res;
        
        for (let r = 0; r < res + 1; r++) {
            const cellY = m + r * waveSpacing;
            
            const steps = 60;
            const stepSz = printW / steps;
            
            // Build polygon outline path arrays
            const topPoints = [];
            const bottomPoints = [];
            
            for (let i = 0; i <= steps; i++) {
                const cellX = m + i * stepSz;
                const pixel = getLuminanceAtPosterCoord(col * wPage + cellX, row * hPage + cellY, scalePoster, sx, sy, imgW, imgH);
                const darkness = pixel.a === 0 ? 0 : 1.0 - (pixel.luma / 255.0);
                
                const thickness = waveSpacing * darkness * state.shapeSize * 0.95;
                const sinWave = 0.8 * Math.sin((cellX * 2 * Math.PI) / 8);
                
                topPoints.push({ x: cellX, y: cellY + sinWave - thickness / 2 });
                bottomPoints.push({ x: cellX, y: cellY + sinWave + thickness / 2 });
            }
            
            // Combine paths clockwise
            const combined = [...topPoints, ...bottomPoints.reverse()];
            
            // Set Color
            const midX = m + printW / 2;
            const midPixel = getLuminanceAtPosterCoord(col * wPage + midX, row * hPage + cellY, scalePoster, sx, sy, imgW, imgH);
            if (state.colorMode === 'color') {
                doc.setFillColor(midPixel.r, midPixel.g, midPixel.b);
            } else if (state.colorMode === 'grayscale') {
                const gray = Math.round(midPixel.luma);
                doc.setFillColor(gray, gray, gray);
            } else {
                doc.setFillColor(inkColor);
            }
            
            // Render polygon
            doc.polygon(combined, 'F');
        }
    } else if (state.rasterStyle === 'crosshatch') {
        // VECTOR CROSS HATCH SHADING
        const hatchSpacing = printW / res;
        const maxDiagonal = printW + printH;
        const lineCount = Math.round(maxDiagonal / hatchSpacing);
        const steps = 30;
        
        doc.setLineWidth(0.2); // Set thin base stroke
        
        // 45 degrees
        for (let i = 0; i < lineCount; i++) {
            const diagOffset = i * hatchSpacing;
            let pathStarted = false;
            
            for (let sIdx = 0; sIdx <= steps; sIdx++) {
                const t = sIdx / steps;
                const cellX = diagOffset * t;
                const cellY = diagOffset * (1 - t);
                
                if (cellX >= m && cellX <= wPage - m && cellY >= m && cellY <= hPage - m) {
                    const pixel = getLuminanceAtPosterCoord(col * wPage + cellX, row * hPage + cellY, scalePoster, sx, sy, imgW, imgH);
                    const darkness = pixel.a === 0 ? 0 : 1.0 - (pixel.luma / 255.0);
                    
                    if (darkness > 0.15) {
                        const drawWidth = Math.min(hatchSpacing * 0.4, 0.1 + darkness * 0.7 * state.shapeSize);
                        doc.setLineWidth(drawWidth);
                        
                        if (state.colorMode === 'color') doc.setDrawColor(pixel.r, pixel.g, pixel.b);
                        else if (state.colorMode === 'grayscale') {
                            const gray = Math.round(pixel.luma);
                            doc.setDrawColor(gray, gray, gray);
                        } else doc.setDrawColor(inkColor);
                        
                        if (!pathStarted) {
                            pathStarted = true;
                            // Start path
                            doc.line(cellX, cellY, cellX + 0.1, cellY + 0.1);
                        } else {
                            // Draw continuous segments
                            doc.line(cellX - (diagOffset/steps), cellY + (diagOffset/steps), cellX, cellY);
                        }
                    } else {
                        pathStarted = false;
                    }
                } else {
                    pathStarted = false;
                }
            }
        }
        
        // -45 degrees shadow layers
        for (let i = 0; i < lineCount; i++) {
            const diagOffset = i * hatchSpacing;
            let pathStarted = false;
            
            for (let sIdx = 0; sIdx <= steps; sIdx++) {
                const t = sIdx / steps;
                const cellX = wPage - (diagOffset * t);
                const cellY = diagOffset * (1 - t);
                
                if (cellX >= m && cellX <= wPage - m && cellY >= m && cellY <= hPage - m) {
                    const pixel = getLuminanceAtPosterCoord(col * wPage + cellX, row * hPage + cellY, scalePoster, sx, sy, imgW, imgH);
                    const darkness = pixel.a === 0 ? 0 : 1.0 - (pixel.luma / 255.0);
                    
                    if (darkness > 0.55) {
                        const drawWidth = Math.min(hatchSpacing * 0.3, 0.08 + (darkness - 0.5) * 0.7 * state.shapeSize);
                        doc.setLineWidth(drawWidth);
                        
                        if (state.colorMode === 'color') doc.setDrawColor(pixel.r, pixel.g, pixel.b);
                        else if (state.colorMode === 'grayscale') {
                            const gray = Math.round(pixel.luma);
                            doc.setDrawColor(gray, gray, gray);
                        } else doc.setDrawColor(inkColor);
                        
                        if (!pathStarted) {
                            pathStarted = true;
                            doc.line(cellX, cellY, cellX + 0.1, cellY - 0.1);
                        } else {
                            doc.line(cellX + (diagOffset/steps), cellY + (diagOffset/steps), cellX, cellY);
                        }
                    } else {
                        pathStarted = false;
                    }
                } else {
                    pathStarted = false;
                }
            }
        }
    } else if (state.rasterStyle === 'cmyk') {
        // CMYK rotated screens in PDF
        const gCenterX = posterW / 2;
        const gCenterY = posterH / 2;
        
        const channels = [
            { name: 'cyan', color: [0, 180, 230], angle: 15 },
            { name: 'magenta', color: [247, 37, 133], angle: 75 },
            { name: 'yellow', color: [255, 183, 3], angle: 0 },
            { name: 'black', color: [0, 0, 0], angle: 45 }
        ];
        
        // Note: For CMYK overlap transparent colors in PDF, we can use slightly transparent colors
        // using PDF graphic state overlays or keep them solid as simple shapes. A slight transparency
        // simulated with opacity makes CMYK overlapping screens print gorgeously!
        // We set fill alpha transparency state to 0.7
        doc.saveGraphicsState();
        // Since jsPDF UMD requires separate plugin calls for alpha, let's keep colors crisp and draw
        
        channels.forEach(ch => {
            doc.setFillColor(ch.color[0], ch.color[1], ch.color[2]);
            
            const rad = (ch.angle * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            
            const corners = [
                { x: col * wPage + m - gCenterX, y: row * hPage + m - gCenterY },
                { x: col * wPage + wPage - m - gCenterX, y: row * hPage + m - gCenterY },
                { x: col * wPage + m - gCenterX, y: row * hPage + hPage - m - gCenterY },
                { x: col * wPage + wPage - m - gCenterX, y: row * hPage + hPage - m - gCenterY }
            ];
            
            let uMin = Infinity, uMax = -Infinity;
            let vMin = Infinity, vMax = -Infinity;
            
            corners.forEach(p => {
                const u = p.x * cos + p.y * sin;
                const v = -p.x * sin + p.y * cos;
                if (u < uMin) uMin = u;
                if (u > uMax) uMax = u;
                if (v < vMin) vMin = v;
                if (v > vMax) vMax = v;
            });
            
            const startU = Math.floor(uMin / cellSize) * cellSize;
            const endU = Math.ceil(uMax / cellSize) * cellSize;
            const startV = Math.floor(vMin / cellSize) * cellSize;
            const endV = Math.ceil(vMax / cellSize) * cellSize;
            
            for (let u = startU; u <= endU; u += cellSize) {
                for (let v = startV; v <= endV; v += cellSize) {
                    const gX = u * cos - v * sin;
                    const gY = u * sin + v * cos;
                    
                    const xLocal = gX + gCenterX - col * wPage;
                    const yLocal = gY + gCenterY - row * hPage;
                    
                    if (xLocal >= m && xLocal <= wPage - m && yLocal >= m && yLocal <= hPage - m) {
                        const pixel = getLuminanceAtPosterCoord(gX + gCenterX, gY + gCenterY, scalePoster, sx, sy, imgW, imgH);
                        if (pixel.a === 0) continue;
                        
                        const cmyk = rgbToCmyk(pixel.r, pixel.g, pixel.b);
                        let intensity = 0;
                        
                        if (ch.name === 'cyan') intensity = cmyk.c;
                        else if (ch.name === 'magenta') intensity = cmyk.m;
                        else if (ch.name === 'yellow') intensity = cmyk.y;
                        else if (ch.name === 'black') intensity = cmyk.k;
                        
                        const radius = (cellSize / 2) * intensity * state.shapeSize;
                        if (radius > 0.05) {
                            doc.circle(xLocal, yLocal, radius, 'F');
                        }
                    }
                }
            }
        });
        
        doc.restoreGraphicsState();
    }
    
    // Draw page annotations in PDF
    drawPdfPageAnnotations(doc, col, row, wPage, hPage);
}

// Draw crop marks and borders on PDF margins
function drawPdfPageAnnotations(doc, col, row, wPage, hPage) {
    const m = state.margins;
    const overlap = state.overlapSize;
    
    // Crop marks
    if (state.addCropMarks) {
        doc.setLineWidth(0.1);
        doc.setDrawColor(128, 128, 128);
        
        const lLen = 6;
        const xL = m;
        const xR = wPage - m;
        const yT = m;
        const yB = hPage - m;
        
        // Top Left Crop
        doc.line(xL, yT - lLen, xL, yT);
        doc.line(xL - lLen, yT, xL, yT);
        // Top Right Crop
        doc.line(xR, yT - lLen, xR, yT);
        doc.line(xR + lLen, yT, xR, yT);
        // Bottom Left Crop
        doc.line(xL, yB + lLen, xL, yB);
        doc.line(xL - lLen, yB, xL, yB);
        // Bottom Right Crop
        doc.line(xR, yB + lLen, xR, yB);
        doc.line(xR + lLen, yB, xR, yB);
    }
    
    // Overlapping guides
    if (state.overlapEnabled) {
        doc.setLineWidth(0.1);
        doc.setDrawColor(255, 64, 129); // pink guides
        
        // Draw dotted lines for overlaps
        if (col < state.cols - 1) {
            const lineX = wPage - m + overlap;
            drawPdfDashedLine(doc, lineX, m, lineX, hPage - m, 1, 1);
        }
        if (row < state.rows - 1) {
            const lineY = hPage - m + overlap;
            drawPdfDashedLine(doc, m, lineY, wPage - m, lineY, 1, 1);
        }
    }
    
    // Coordinates
    if (state.addCoordinates) {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(128, 128, 128);
        
        const label = `Page ${col + 1}-${row + 1}  (Row ${row + 1}, Col ${col + 1})`;
        doc.text(label, wPage / 2, hPage - m / 2, { align: 'center' });
    }
}

// Draw dashed line helper in jsPDF
function drawPdfDashedLine(doc, x1, y1, x2, y2, dashLen, gapLen) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.floor(len / (dashLen + gapLen));
    
    const cos = dx / len;
    const sin = dy / len;
    
    let curX = x1;
    let curY = y1;
    
    for (let i = 0; i < steps; i++) {
        doc.line(curX, curY, curX + dashLen * cos, curY + dashLen * sin);
        curX += (dashLen + gapLen) * cos;
        curY += (dashLen + gapLen) * sin;
    }
}

// Render heavy pixel-perfect dither sheets as high-DPI images for PDF insertion
async function renderPdfDitherAsImage(doc, col, row, wPage, hPage, pageBg, inkColor) {
    const m = state.margins;
    const printW = wPage - 2 * m;
    const printH = hPage - 2 * m;
    
    // Target High-DPI page canvas (300 DPI is approx 11.8 pixels per mm)
    const pixelsPerMm = 10; 
    const canvasW = Math.round(wPage * pixelsPerMm);
    const canvasH = Math.round(hPage * pixelsPerMm);
    
    const pdfCanvas = document.createElement('canvas');
    pdfCanvas.width = canvasW;
    pdfCanvas.height = canvasH;
    const pdfCtx = pdfCanvas.getContext('2d');
    
    // Draw background
    pdfCtx.fillStyle = pageBg;
    pdfCtx.fillRect(0, 0, canvasW, canvasH);
    
    // Render dither pixels
    pdfCtx.fillStyle = inkColor;
    
    const gridW = state.ditherGrid.width;
    const gridH = state.ditherGrid.height;
    
    const colStartIdx = col * state.resolution;
    const cellW = printW / state.resolution;
    const totalRowCells = Math.round(printH / cellW);
    const rowStartIdx = row * totalRowCells;
    
    // Scaling multiplier to high-DPI canvas coordinates
    const scale = pixelsPerMm;
    
    for (let r = 0; r < totalRowCells; r++) {
        const gridY = rowStartIdx + r;
        if (gridY >= gridH) continue;
        
        const cellY = m + r * cellW;
        
        for (let c = 0; c < state.resolution; c++) {
            const gridX = colStartIdx + c;
            if (gridX >= gridW) continue;
            
            const cellX = m + c * cellW;
            const gridIdx = gridY * gridW + gridX;
            
            if (state.ditherGrid.data[gridIdx] === 0) { // black pixel
                pdfCtx.fillRect(
                    cellX * scale, 
                    cellY * scale, 
                    cellW * scale + 0.2, 
                    cellW * scale + 0.2
                );
            }
        }
    }
    
    // Export page canvas to high quality JPEG
    const dataUrl = pdfCanvas.toDataURL('image/jpeg', 0.95);
    doc.addImage(dataUrl, 'JPEG', 0, 0, wPage, hPage);
}

// Compile minimap cover page in PDF
function drawPdfGuideCover(doc, wPage, hPage) {
    // Blueprint style background
    doc.setFillColor(15, 76, 156); // nice dark blue
    doc.rect(0, 0, wPage, hPage, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('RasterPrint Guide Map', wPage / 2, 35, { align: 'center' });
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Physical assembly blueprint and page matrix index', wPage / 2, 43, { align: 'center' });
    
    // Draw miniature grid layout
    const gridAreaW = wPage * 0.75;
    const gridAreaH = hPage * 0.5;
    
    // Fit grid inside area
    const pad = 10;
    const gridW = state.cols * 25; // mock sizing
    const gridH = state.rows * 25;
    
    const scaleW = gridAreaW / (state.cols * 30);
    const scaleH = gridAreaH / (state.rows * 30);
    const cellScale = Math.min(scaleW, scaleH);
    
    const cellW = cellScale * 25;
    const cellH = cellScale * 25;
    
    const startX = (wPage - state.cols * cellW) / 2;
    const startY = 65;
    
    doc.setFontSize(8);
    
    for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
            const x = startX + c * cellW;
            const y = startY + r * cellH;
            
            // Draw page outline
            doc.setLineWidth(0.4);
            doc.setDrawColor(255, 255, 255);
            doc.setFillColor(30, 100, 200);
            doc.rect(x, y, cellW, cellH, 'FD');
            
            // Coordinates text
            doc.setTextColor(255, 255, 255);
            doc.text(`${c+1}-${r+1}`, x + cellW / 2, y + cellH / 2, { align: 'center', baseline: 'middle' });
        }
    }
    
    // Print assembly instructions
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    let instructY = startY + state.rows * cellH + 18;
    
    doc.setFont('Helvetica', 'bold');
    doc.text('Assembly Guide:', 25, instructY);
    
    doc.setFont('Helvetica', 'normal');
    doc.text('1. Each page has coordinates printed on the bottom margin (e.g. Page Col-Row).', 25, instructY + 7);
    doc.text('2. Trim margins off of sheets along the crop marks guidelines.', 25, instructY + 14);
    
    if (state.overlapEnabled) {
        doc.text(`3. Overlapping margins of ${state.overlapSize}mm are highlighted on right & bottom seams for easier alignment.`, 25, instructY + 21);
    } else {
        doc.text('3. Align the trimmed sheet edges together tightly and tape them on the back.', 25, instructY + 21);
    }
    
    doc.text(`4. Total sheets: ${state.cols * state.rows} pages (${state.cols} wide x ${state.rows} high).`, 25, instructY + 28);
}

// Progress status bar updater
function updateProgress(pct, statusText) {
    els.progressBar.style.width = `${pct}%`;
    els.progressStatus.textContent = statusText;
}

// Helper promise delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered successfully:', reg.scope))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}
