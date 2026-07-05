# RasterPrint 🎨🖨️

[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen.svg)](https://albatrosssky.github.io/rasterprint/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**RasterPrint** is a modernized, feature-rich, open-source web application designed as a successor to classic poster-rasterizer tools like *Rasterbator*. It allows users to convert any image into large, multi-page vector-based posters using creative halftone, shading, and dithering algorithms.

Built completely in client-side Vanilla JS, HTML5, and CSS3, RasterPrint runs entirely inside the browser and features full Progressive Web App (PWA) offline capabilities.

**👉 Try it Live:** [https://albatrosssky.github.io/rasterprint/](https://albatrosssky.github.io/rasterprint/)

---

## ✨ Features

### 1. 🎭 11 Creative Shading & Rasterizer Styles
*   **Classic Halftones**:
    *   **Circle Halftone**: Standard grid alignment of variable-sized dots.
    *   **Hexagonal Halftone**: Staggered hexagonal dot placement for smoother tones.
*   **Geometric Vectors**:
    *   **Squares**: Rectangular mosaic grids.
    *   **Triangles**: Equilateral triangle vectors scaling with image darkness.
    *   **Stars**: Five-pointed vector stars.
    *   **Hearts**: Smooth parametric heart curves.
    *   **Lego Bricks**: Solid square tiles with raised 3D highlighted studs, mimicking physical plastic bricks.
*   **Artistic Linework & Engravings**:
    *   **Wave Lines**: Sinusoidal horizontal or vertical lines of variable thickness mimicking currency/banknote engravings.
    *   **Sketch Crosshatch**: Angled intersecting lines crossing at a clean $90^\circ$ inside shadows for a hand-drawn look.
*   **Rotated CMYK Separation**:
    *   Splits the image into Cyan ($15^\circ$), Magenta ($75^\circ$), Yellow ($0^\circ$), and Black ($45^\circ$) channels, blending them together using canvas `multiply` blend modes to simulate real printed ink alignment.
*   **Dither Rasterization**:
    *   High-performance error-diffusion algorithms including **Floyd-Steinberg**, **Atkinson**, and **Bayer Ordered Dithering**.

### 2. 🎛️ Image Adjustments & Color Engines
*   **Sliders**: Real-time control over Brightness, Contrast, Saturation, and Alpha transparency thresholding.
*   **Color Modes**: Render posters in full Color, Grayscale, Monochrome (pure black & white), or a Custom Dual-Tone layout (with separate background/ink color pickers).
*   **Curated Presets**: Quick applying themes like **Andy Warhol Pop Art**, **Blueprint**, **Cyberpunk**, and **Comic Book**.

### 3. 📐 Physical Layout & Printing Helpers
*   **Flexible Paper Sizing**: Choose from standard sizes (A4, A3, Letter, Legal) or enter custom width/height dimensions in millimeters, along with orientation toggles.
*   **Smart Seam Overlaps**: Add a configurable page overlap (e.g. `5mm` margin helpers) showing pink dashed lines to let you trim and assemble adjacent sheets seamlessly.
*   **Assembly Minimap Cover Page**: Page 1 of the generated PDF contains an auto-generated grid blueprint map mapping coordinates (e.g., `Row 1, Col 2`) and assembly steps.
*   **Ink Density Estimator**: Scans the image to calculate average ink coverage percentage (e.g. `14%`) to help you gauge home printing costs.

### 4. ⚡ High-Performance Architecture
*   **Memory Pixel Caching**: Caches the flat image pixel array in memory, replacing slow canvas `getImageData` roundtrips. Slider changes render instantly at a buttery 60 FPS.
*   **Hybrid PDF Generation**: Generates high-quality vector PDFs (infinitely resizable without pixelation) for shapes/CMYK, and automatically uses high-DPI raster compilation for complex dither patterns to prevent browser memory exhaustion.

---

## 🛠️ Tech Stack
*   **Frontend**: Vanilla HTML5, Vanilla CSS3 (modern glassmorphism UI, custom variables).
*   **Core Logic**: Vanilla JavaScript (ES6+).
*   **PDF Compiler**: [jsPDF](https://github.com/parallax/jsPDF) (Client-side PDF compiler).
*   **Offline Support**: Service Worker & Web App Manifest configured for PWA installation.

---

## 🚀 Running Locally

Since the application uses standard Web APIs (such as Service Workers and Canvas image uploads), it runs best served over a local server:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/albatrossSKY/rasterprint.git
    cd rasterprint
    ```
2.  **Serve the files**:
    *   Using Python:
        ```bash
        python -m http.server 8000
        ```
    *   Using Node.js (`http-server`):
        ```bash
        npx http-server -p 8000
        ```
3.  Open your browser to `http://localhost:8000`.

---

## 📜 License
Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
