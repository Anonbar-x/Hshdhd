/* ══════════════════════════════════════════
   BarForge — script.js
   Full application logic
══════════════════════════════════════════ */

'use strict';

// ── State ──────────────────────────────────
const state = {
  format: 'CODE128',
  value: '1234567890128',
  width: 2,
  height: 100,
  margin: 10,
  fontSize: 14,
  showText: true,
  lineColor: '#000000',
  bgColor: '#ffffff',
  labelW: 120,
  labelH: 90,
  designTemplate: 'retail',
  designBg: '#ffffff',
  designText: '#111111',
  designAccent: '#e63946',
};

// ── DOM References ─────────────────────────
const $ = id => document.getElementById(id);
const barcodeOutput = $('barcodeOutput');
const qrOutput = $('qrOutput');
const labelFrame = $('labelFrame');
const previewMeta = $('previewMeta');

// ── Theme ──────────────────────────────────
const themeToggle = $('themeToggle');
let isDark = true;
themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  themeToggle.querySelector('.theme-icon').textContent = isDark ? '☀' : '☾';
});

// ── Tab Navigation ─────────────────────────
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    $(`tab-${tab.dataset.tab}`).classList.add('active');
    if (tab.dataset.tab === 'designer') renderDesigner();
  });
});

// ── Format Selection ───────────────────────
document.querySelectorAll('#formatGrid .format-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#formatGrid .format-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.format = btn.dataset.format;
    autoFillSample();
    renderBarcode();
  });
});

// ── Label Size ─────────────────────────────
document.querySelectorAll('#labelSizeGrid .size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#labelSizeGrid .size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const w = parseInt(btn.dataset.w);
    const h = parseInt(btn.dataset.h);
    if (w === 0) {
      $('customSizeInputs').style.display = 'block';
      applyCustomSize();
    } else {
      $('customSizeInputs').style.display = 'none';
      state.labelW = w;
      state.labelH = h;
      applyLabelSize();
    }
  });
});

$('customW').addEventListener('input', applyCustomSize);
$('customH').addEventListener('input', applyCustomSize);

function applyCustomSize() {
  state.labelW = parseInt($('customW').value) || 200;
  state.labelH = parseInt($('customH').value) || 120;
  applyLabelSize();
}

function applyLabelSize() {
  labelFrame.style.width = state.labelW + 'px';
  labelFrame.style.height = state.labelH + 'px';
  labelFrame.style.minWidth = state.labelW + 'px';
  labelFrame.style.minHeight = state.labelH + 'px';
}

// ── Inputs ─────────────────────────────────
function bindInput(id, key, updateFn) {
  const el = $(id);
  const badge = $(id.replace('barcode', '').toLowerCase() + 'Val') || null;
  el.addEventListener('input', () => {
    const v = el.type === 'checkbox' ? el.checked : (el.type === 'range' ? parseFloat(el.value) : el.value);
    state[key] = v;
    if (badge) badge.textContent = el.value;
    if (updateFn) updateFn();
    else renderBarcode();
  });
}

bindInput('barcodeValue', 'value', () => { renderBarcode(); });
bindInput('barcodeWidth', 'width');
bindInput('barcodeHeight', 'height');
bindInput('barcodeMargin', 'margin');
bindInput('barcodeFontSize', 'fontSize');
bindInput('showText', 'showText');
bindInput('lineColor', 'lineColor');
bindInput('bgColor', 'bgColor');

// ── Random Button ──────────────────────────
$('randomBtn').addEventListener('click', () => {
  autoFillSample(true);
  renderBarcode();
});

function autoFillSample(random = false) {
  const samples = {
    CODE128: () => Math.random().toString(36).substr(2, 10).toUpperCase(),
    CODE39: () => Math.random().toString(36).substr(2, 8).toUpperCase(),
    EAN13: () => generateEAN13(),
    UPC: () => generateUPC(),
    ITF14: () => generateRandom(14),
    MSI: () => generateRandom(8),
    pharmacode: () => String(Math.floor(Math.random() * 1000) + 100),
    QR: () => 'https://barforge.app/' + Math.random().toString(36).substr(2, 6),
  };
  const gen = samples[state.format];
  if (gen && random) {
    const val = gen();
    $('barcodeValue').value = val;
    state.value = val;
  } else if (gen && !random) {
    // only reset if current value likely won't work
    const val = $('barcodeValue').value;
    if (!val) {
      const v = gen();
      $('barcodeValue').value = v;
      state.value = v;
    }
  }
}

function generateRandom(len) {
  return Array.from({length: len}, () => Math.floor(Math.random() * 10)).join('');
}

function generateEAN13() {
  const digits = Array.from({length: 12}, () => Math.floor(Math.random() * 10));
  let sum = 0;
  digits.forEach((d, i) => { sum += i % 2 === 0 ? d : d * 3; });
  const check = (10 - (sum % 10)) % 10;
  return digits.join('') + check;
}

function generateUPC() {
  const digits = Array.from({length: 11}, () => Math.floor(Math.random() * 10));
  let odd = 0, even = 0;
  digits.forEach((d, i) => { if (i % 2 === 0) odd += d; else even += d; });
  const check = (10 - ((odd * 3 + even) % 10)) % 10;
  return digits.join('') + check;
}

// ── Render Barcode ─────────────────────────
function renderBarcode() {
  const { format, value, width, height, margin, fontSize, showText, lineColor, bgColor } = state;

  previewMeta.textContent = `${format} · ${value}`;

  // QR Code
  if (format === 'QR') {
    barcodeOutput.style.display = 'none';
    qrOutput.style.display = 'flex';
    qrOutput.innerHTML = '';
    try {
      const size = Math.min(state.labelH - 32, state.labelW - 32, 200);
      new QRCode(qrOutput, {
        text: value || ' ',
        width: Math.max(size, 80),
        height: Math.max(size, 80),
        colorDark: lineColor,
        colorLight: bgColor,
        correctLevel: QRCode.CorrectLevel.H
      });
      labelFrame.style.background = bgColor;
    } catch(e) {
      qrOutput.innerHTML = `<div style="color:#f87171;font-size:12px;padding:10px">Invalid QR value</div>`;
    }
    return;
  }

  // Regular Barcode
  barcodeOutput.style.display = '';
  qrOutput.style.display = 'none';
  qrOutput.innerHTML = '';

  try {
    JsBarcode(barcodeOutput, value, {
      format,
      width,
      height,
      margin,
      fontSize,
      displayValue: showText,
      lineColor,
      background: bgColor,
      font: 'DM Mono, Courier New, monospace',
      textMargin: 4,
      valid: () => true,
    });
    labelFrame.style.background = bgColor;
  } catch(e) {
    // Show error state
    barcodeOutput.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('width', '200'); rect.setAttribute('height', '60');
    rect.setAttribute('fill', '#1e2025'); rect.setAttribute('rx', '4');
    barcodeOutput.appendChild(rect);
    const txt = document.createElementNS(ns, 'text');
    txt.setAttribute('x', '100'); txt.setAttribute('y', '35');
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('fill', '#f87171');
    txt.setAttribute('font-size', '11');
    txt.setAttribute('font-family', 'monospace');
    txt.textContent = '⚠ Invalid value for ' + format;
    barcodeOutput.appendChild(txt);
    barcodeOutput.setAttribute('viewBox', '0 0 200 60');
    barcodeOutput.setAttribute('width', '200');
    barcodeOutput.setAttribute('height', '60');
  }
}

// ── Download PNG ───────────────────────────
$('dlPNG').addEventListener('click', () => downloadPNG('barforge-barcode.png'));
$('dlSVG').addEventListener('click', () => downloadSVG());
$('dlPDF').addEventListener('click', () => downloadPDF());
$('printBtn').addEventListener('click', () => window.print());

function getSVGData() {
  if (state.format === 'QR') {
    const canvas = qrOutput.querySelector('canvas');
    if (canvas) return { type: 'canvas', canvas };
    const img = qrOutput.querySelector('img');
    if (img) return { type: 'img', img };
    return null;
  }
  return { type: 'svg', svg: barcodeOutput };
}

function downloadPNG(filename = 'barcode.png') {
  const src = getSVGData();
  if (!src) return;

  const canvas = document.createElement('canvas');
  const scale = 3;

  if (src.type === 'canvas') {
    const c = src.canvas;
    canvas.width = c.width; canvas.height = c.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(c, 0, 0);
    triggerDownload(canvas.toDataURL('image/png'), filename);
    return;
  }

  const svg = src.svg;
  const bbox = svg.getBBox();
  const svgW = svg.getAttribute('width') || bbox.width || 200;
  const svgH = svg.getAttribute('height') || bbox.height || 100;
  canvas.width = svgW * scale;
  canvas.height = svgH * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], {type: 'image/svg+xml'});
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, svgW, svgH);
    ctx.drawImage(img, 0, 0, svgW, svgH);
    triggerDownload(canvas.toDataURL('image/png'), filename);
    URL.revokeObjectURL(url);
  };
  img.src = url;
  toast('PNG downloaded ✓', 'success');
}

function downloadSVG() {
  if (state.format === 'QR') { toast('SVG not available for QR Code', 'error'); return; }
  const svg = barcodeOutput;
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], {type: 'image/svg+xml'});
  triggerDownload(URL.createObjectURL(blob), 'barforge-barcode.svg');
  toast('SVG downloaded ✓', 'success');
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) { toast('PDF library not loaded', 'error'); return; }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [100, 60] });

  const src = getSVGData();
  if (!src) return;

  const canvas = document.createElement('canvas');
  const scale = 4;

  function finishPDF(imgData) {
    doc.addImage(imgData, 'PNG', 5, 5, 90, 50);
    doc.save('barforge-barcode.pdf');
    toast('PDF exported ✓', 'success');
  }

  if (src.type === 'canvas') {
    finishPDF(src.canvas.toDataURL('image/png'));
    return;
  }

  const svg = src.svg;
  const svgW = parseFloat(svg.getAttribute('width')) || 300;
  const svgH = parseFloat(svg.getAttribute('height')) || 100;
  canvas.width = svgW * scale;
  canvas.height = svgH * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], {type: 'image/svg+xml'});
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, svgW, svgH);
    ctx.drawImage(img, 0, 0, svgW, svgH);
    finishPDF(canvas.toDataURL('image/png'));
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
}

// ── Bulk Generator ─────────────────────────
const dropZone = $('dropZone');
const csvFile = $('csvFile');

dropZone.addEventListener('click', () => csvFile.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragging'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragging');
  const file = e.dataTransfer.files[0];
  if (file) readCSVFile(file);
});
csvFile.addEventListener('change', () => {
  if (csvFile.files[0]) readCSVFile(csvFile.files[0]);
});

function readCSVFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    $('bulkText').value = e.target.result.trim();
    toast(`Loaded: ${file.name}`, 'success');
  };
  reader.readAsText(file);
}

$('generateBulkBtn').addEventListener('click', generateBulk);

function generateBulk() {
  const text = $('bulkText').value.trim();
  if (!text) { toast('Please enter barcode values', 'error'); return; }

  const lines = text.split('\n').filter(l => l.trim()).slice(0, 100);
  const format = $('bulkFormat').value;
  const perRow = parseInt($('bulkPerRow').value);
  const grid = $('bulkGrid');
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(${perRow}, 1fr)`;

  const header = $('bulkPreviewHeader');
  header.style.display = 'flex';
  $('bulkCount').textContent = `${lines.length} barcodes generated`;

  lines.forEach((line, idx) => {
    const parts = line.split(',');
    const value = parts[0].trim();
    const label = parts[1] ? parts[1].trim() : value;

    const item = document.createElement('div');
    item.className = 'bulk-item';
    item.style.animationDelay = `${idx * 0.03}s`;

    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.id = `bulk-svg-${idx}`;

    if (format === 'QR') {
      const qrDiv = document.createElement('div');
      qrDiv.id = `bulk-qr-${idx}`;
      item.appendChild(qrDiv);
      try {
        new QRCode(qrDiv, { text: value, width: 80, height: 80, correctLevel: QRCode.CorrectLevel.M });
      } catch(e) {}
    } else {
      item.appendChild(svgEl);
      try {
        JsBarcode(svgEl, value, { format, width: 1.5, height: 50, margin: 6, fontSize: 10, displayValue: true });
      } catch(e) {
        svgEl.innerHTML = `<text y="30" x="10" font-size="10" fill="#f87171">Invalid: ${value}</text>`;
      }
    }

    const lbl = document.createElement('div');
    lbl.className = 'bulk-item-label';
    lbl.textContent = label;

    const dlBtn = document.createElement('button');
    dlBtn.className = 'bulk-item-download';
    dlBtn.textContent = '↓ PNG';
    dlBtn.addEventListener('click', () => downloadBulkItem(idx, format, value, label));

    item.appendChild(lbl);
    item.appendChild(dlBtn);
    grid.appendChild(item);
  });

  toast(`Generated ${lines.length} barcodes`, 'success');
}

function downloadBulkItem(idx, format, value, label) {
  if (format === 'QR') {
    const qrDiv = $(`bulk-qr-${idx}`);
    const canvas = qrDiv?.querySelector('canvas');
    if (canvas) triggerDownload(canvas.toDataURL('image/png'), `barcode-${label}.png`);
    return;
  }
  const svg = $(`bulk-svg-${idx}`);
  if (!svg) return;
  const canvas = document.createElement('canvas');
  const scale = 3;
  const w = parseFloat(svg.getAttribute('width')) || 200;
  const h = parseFloat(svg.getAttribute('height')) || 80;
  canvas.width = w * scale; canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], {type: 'image/svg+xml'});
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    triggerDownload(canvas.toDataURL('image/png'), `barcode-${label}.png`);
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

$('bulkDlPNG').addEventListener('click', () => {
  const items = document.querySelectorAll('.bulk-item');
  items.forEach((item, idx) => {
    const dlBtn = item.querySelector('.bulk-item-download');
    if (dlBtn) setTimeout(() => dlBtn.click(), idx * 200);
  });
  toast('Downloading all...', 'success');
});

$('bulkDlPDF').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) { toast('PDF library not loaded', 'error'); return; }
  const svgs = document.querySelectorAll('.bulk-item svg');
  if (!svgs.length) { toast('No barcodes to export', 'error'); return; }
  // Simple multi-page PDF
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let x = 10, y = 10, col = 0, maxCol = 3;
  const cellW = 60, cellH = 35;
  
  const processSVGs = Array.from(svgs);
  let processed = 0;
  
  function processNext(i) {
    if (i >= processSVGs.length) {
      doc.save('barforge-bulk.pdf');
      toast('Bulk PDF exported ✓', 'success');
      return;
    }
    const svg = processSVGs[i];
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 120;
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], {type:'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 300, 120);
      ctx.drawImage(img, 0, 0, 300, 120);
      if (processed > 0 && col === 0) {
        if (y + cellH > 280) { doc.addPage(); y = 10; }
      }
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, cellW, cellH - 5);
      col++;
      x += cellW + 5;
      if (col >= maxCol) { col = 0; x = 10; y += cellH; }
      URL.revokeObjectURL(url);
      processed++;
      processNext(i + 1);
    };
    img.src = url;
  }
  processNext(0);
});

// ── Designer Tab ───────────────────────────
['designProductName','designPrice','designBarcode','designSubtitle','designBg','designText','designAccent','designFormat'].forEach(id => {
  const el = $(id);
  if (el) el.addEventListener('input', renderDesigner);
});

document.querySelectorAll('#templateGrid .template-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#templateGrid .template-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.designTemplate = btn.dataset.tpl;
    renderDesigner();
  });
});

function renderDesigner() {
  const canvas = $('designerCanvas');
  const name = $('designProductName').value || 'Product Name';
  const price = $('designPrice').value || '$0.00';
  const barcode = $('designBarcode').value || '1234567890128';
  const sku = $('designSubtitle').value || '';
  const bg = $('designBg').value;
  const textColor = $('designText').value;
  const accent = $('designAccent').value;
  const format = $('designFormat').value;
  const tpl = state.designTemplate;

  let svgId = 'design-barcode-svg';
  let qrId = 'design-qr';

  const templates = {
    retail: `
      <div class="label-retail" style="background:${bg};color:${textColor}">
        <div class="lbl-header">
          <div class="lbl-name">${escHtml(name)}</div>
          <div class="lbl-price" style="color:${accent}">${escHtml(price)}</div>
        </div>
        <div class="lbl-sku">${escHtml(sku)}</div>
        <div class="lbl-divider" style="background:${accent}"></div>
        <div class="lbl-barcode">
          ${format === 'QR' ? `<div id="${qrId}"></div>` : `<svg id="${svgId}"></svg>`}
        </div>
      </div>`,
    minimal: `
      <div class="label-minimal" style="background:${bg};color:${textColor}">
        <div class="lbl-name">${escHtml(name)}</div>
        <div class="lbl-price" style="color:${accent}">${escHtml(price)}</div>
        <div class="lbl-barcode">
          ${format === 'QR' ? `<div id="${qrId}"></div>` : `<svg id="${svgId}"></svg>`}
        </div>
        <div class="lbl-sku">${escHtml(sku)}</div>
      </div>`,
    bold: `
      <div class="label-bold" style="background:${bg};color:${textColor}">
        <div class="lbl-top" style="background:${accent}">
          <div class="lbl-name">${escHtml(name)}</div>
          <div class="lbl-price">${escHtml(price)}</div>
        </div>
        <div class="lbl-bottom">
          ${format === 'QR' ? `<div id="${qrId}"></div>` : `<svg id="${svgId}"></svg>`}
          <div class="lbl-sku">${escHtml(sku)}</div>
        </div>
      </div>`,
    pharmacy: `
      <div class="label-pharmacy" style="background:${bg};color:${textColor}">
        <div class="lbl-header" style="background:${textColor};color:${bg}">ℝx PHARMACY LABEL</div>
        <div class="lbl-name">${escHtml(name)}</div>
        <div class="lbl-sku">${escHtml(sku)}</div>
        <div class="lbl-divider"></div>
        <div class="lbl-barcode">
          ${format === 'QR' ? `<div id="${qrId}"></div>` : `<svg id="${svgId}"></svg>`}
        </div>
        <div class="lbl-price-row">
          <span>Retail Price</span>
          <span class="lbl-price" style="color:${accent}">${escHtml(price)}</span>
        </div>
      </div>`
  };

  canvas.innerHTML = templates[tpl] || templates.retail;

  // Render barcode
  if (format === 'QR') {
    const qrEl = $(qrId);
    if (qrEl) {
      try {
        new QRCode(qrEl, { text: barcode, width: 80, height: 80, correctLevel: QRCode.CorrectLevel.M });
      } catch(e) {}
    }
  } else {
    const svgEl = $(svgId);
    if (svgEl) {
      try {
        JsBarcode(svgEl, barcode, {
          format,
          width: 1.5,
          height: 40,
          margin: 4,
          fontSize: 10,
          displayValue: true,
          lineColor: textColor,
          background: 'transparent',
          font: 'DM Mono, monospace',
        });
      } catch(e) {}
    }
  }
}

// ── Designer Exports ───────────────────────
$('designDlPNG').addEventListener('click', () => downloadDesigner('png'));
$('designDlPDF').addEventListener('click', () => downloadDesigner('pdf'));
$('designPrint').addEventListener('click', () => window.print());

function downloadDesigner(type) {
  const canvas2 = $('designerCanvas');
  const el = canvas2.firstElementChild;
  if (!el) { toast('No label to export', 'error'); return; }

  // Use html2canvas fallback or SVG-serialize approach
  const w = el.offsetWidth || 340;
  const h = el.offsetHeight || 200;

  // Build a static SVG representation using foreignObject
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);

  const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  fo.setAttribute('width', w);
  fo.setAttribute('height', h);

  const div = document.createElement('div');
  div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  div.style.cssText = `width:${w}px;height:${h}px;font-family:Inter,sans-serif`;
  div.innerHTML = el.outerHTML;
  fo.appendChild(div);
  svg.appendChild(fo);

  const canvasEl = document.createElement('canvas');
  const scale = 3;
  canvasEl.width = w * scale; canvasEl.height = h * scale;
  const ctx = canvasEl.getContext('2d');
  ctx.scale(scale, scale);

  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], {type:'image/svg+xml'});
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = $('designBg').value || '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    if (type === 'png') {
      triggerDownload(canvasEl.toDataURL('image/png'), 'barforge-label.png');
      toast('Label PNG downloaded ✓', 'success');
    } else {
      const { jsPDF } = window.jspdf;
      if (!jsPDF) { toast('PDF library not loaded', 'error'); return; }
      const pdfW = w * 0.2645;
      const pdfH = h * 0.2645;
      const doc = new jsPDF({ orientation: pdfW > pdfH ? 'landscape' : 'portrait', unit: 'mm', format: [pdfW + 10, pdfH + 10] });
      doc.addImage(canvasEl.toDataURL('image/png'), 'PNG', 5, 5, pdfW, pdfH);
      doc.save('barforge-label.pdf');
      toast('Label PDF exported ✓', 'success');
    }
    URL.revokeObjectURL(url);
  };
  img.onerror = () => {
    toast('Export failed - try PNG', 'error');
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

// ── Toast ──────────────────────────────────
function toast(msg, type = '') {
  const icons = { success: '✓', error: '✕', '': 'ℹ' };
  const container = $('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${msg}`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = '0.3s'; setTimeout(() => el.remove(), 300); }, 2500);
}

// ── Helpers ────────────────────────────────
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ───────────────────────────────────
function init() {
  applyLabelSize();
  renderBarcode();
  renderDesigner();
  toast('BarForge ready', 'success');

  // Bind range badge displays
  const ranges = [
    ['barcodeWidth','widthVal'],
    ['barcodeHeight','heightVal'],
    ['barcodeMargin','marginVal'],
    ['barcodeFontSize','fontSizeVal'],
  ];
  ranges.forEach(([id, badgeId]) => {
    const el = $(id);
    const badge = $(badgeId);
    if (el && badge) badge.textContent = el.value;
  });
}

// Wait for libraries then init
window.addEventListener('load', () => {
  setTimeout(init, 100);
});
