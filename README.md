# BarForge — Professional Barcode Generator

A modern SaaS-style barcode generator that runs entirely in the browser. Zero backend required.

## Features

- **8 barcode formats**: CODE128, CODE39, EAN13, UPC, ITF14, MSI, Pharmacode, QR Code
- **Live preview** with instant updates
- **Label Designer** with 4 professional templates (Retail, Minimal, Bold, Pharmacy)
- **Bulk Generator** — CSV upload or paste values, generate 100+ barcodes at once
- **Export**: PNG, SVG, PDF, Print
- **Dark / Light mode toggle**
- **Fully mobile responsive**

## Deploy to GitHub Pages

1. Fork or clone this repository
2. Go to **Settings → Pages**
3. Set source to `main` branch, root `/`
4. Visit `https://yourusername.github.io/barcode-generator`

## Local Development

Just open `index.html` in any modern browser. No build step required.

## Project Structure

```
barcode-generator/
├── index.html          # Main application
├── style.css           # All styles (dark/light theme)
├── script.js           # App logic
└── js/
    ├── jsbarcode.min.js     # JsBarcode 3.11.5
    ├── qrcode.min.js        # QRCode.js (davidshimjs)
    └── jspdf.umd.min.js     # jsPDF 2.5.1
```

## Libraries Used

- [JsBarcode](https://github.com/lindell/JsBarcode) — Barcode generation
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) — QR Code generation
- [jsPDF](https://github.com/parallax/jsPDF) — PDF export

All libraries are bundled locally — no CDN dependencies at runtime.
