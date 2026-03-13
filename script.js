/* ══════════════════════════════════════════════════════
   BarcodeStudio Pro — script.js
   PDF Download Edition
   ══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════
     PRINTER PRESETS — all real-world sizes
  ══════════════════════════════════════════════════ */
  const PRESETS = {
    thermal_58:  { name:'Thermal 58mm',  wMM:58,  hMM:40  },
    thermal_80:  { name:'Thermal 80mm',  wMM:80,  hMM:50  },
    label_50x25: { name:'Label 50×25',   wMM:50,  hMM:25  },
    label_100x50:{ name:'Label 100×50',  wMM:100, hMM:50  },
    a4:          { name:'A4',            wMM:210, hMM:297 },
    a5:          { name:'A5',            wMM:148, hMM:210 },
    letter:      { name:'US Letter',     wMM:215.9,hMM:279.4},
    custom:      { name:'Custom',        wMM:50,  hMM:30  },
  };

  /* ══════════════════════════════════════════════════
     STATE
  ══════════════════════════════════════════════════ */
  const S = {
    type:     'barcode',  // barcode | qr | batch
    history:  [],
    logoUrl:  null,
    ready:    false,      // barcode generated?
    paper: {
      presetId:   'thermal_58',
      wMM:        58,
      hMM:        40,
      orient:     'portrait',
      perPage:    1,
      marginMM:   3,
    },
  };

  /* ══════════════════════════════════════════════════
     DOM
  ══════════════════════════════════════════════════ */
  const $  = id => document.getElementById(id);
  const qs = s  => document.querySelector(s);

  const themeToggle   = $('themeToggle');
  const tabs          = document.querySelectorAll('.tab');
  const tabContents   = document.querySelectorAll('.tab-content');

  // Step 1 — size
  const ppBtns        = document.querySelectorAll('.pp-btn');
  const customSizeBox = $('customSizeBox');
  const customW       = $('customW');
  const customH       = $('customH');
  const customUnit    = $('customUnit');
  const segBtns       = document.querySelectorAll('.seg');
  const stickersPerPage = $('stickersPerPage');
  const marginSize    = $('marginSize');
  const sizeIndicator = $('sizeIndicatorText');

  // Step 2 — barcode
  const barcodeInput  = $('barcodeInput');
  const formatSelect  = $('formatSelect');
  const labelName     = $('labelName');
  const labelPrice    = $('labelPrice');
  const labelDate     = $('labelDate');
  const labelNote     = $('labelNote');
  const barWidth      = $('barWidth');
  const barHeight     = $('barHeight');
  const widthVal      = $('widthVal');
  const heightVal     = $('heightVal');
  const generateBtn   = $('generateBtn');
  const logoUpload    = $('logoUpload');
  const logoRow       = $('logoRow');
  const logoImg       = $('logoImg');
  const removeLogo    = $('removeLogo');
  const qrInput       = $('qrInput');
  const qrSize        = $('qrSize');
  const qrError       = $('qrError');
  const generateQrBtn = $('generateQrBtn');
  const batchInput    = $('batchInput');
  const batchFormat   = $('batchFormat');
  const batchCols     = $('batchCols');
  const generateBatchBtn = $('generateBatchBtn');

  // Preview
  const previewBtns   = $('previewBtns');
  const paperEmpty    = $('paperEmpty');
  const paperSheet    = $('paperSheet');
  const pdfInfoStrip  = $('pdfInfoStrip');
  const pdfInfoText   = $('pdfInfoText');
  const downloadPng   = $('downloadPng');
  const downloadSvgBtn= $('downloadSvgBtn');
  const downloadPdfBtn= $('downloadPdfBtn');
  const historyList   = $('historyList');
  const clearHistory  = $('clearHistory');
  const pdfToast      = $('pdfToast');
  const toastMsg      = $('toastMsg');

  // Hidden SVG elements for generation
  let barcodeSvg = null;
  let qrCanvas   = null;
  // Batch SVGs
  let batchSVGs  = [];

  /* ══════════════════════════════════════════════════
     THEME
  ══════════════════════════════════════════════════ */
  (function initTheme() {
    const t = localStorage.getItem('bcs-theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
  })();
  themeToggle.addEventListener('click', () => {
    const nxt = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nxt);
    localStorage.setItem('bcs-theme', nxt);
  });

  /* ══════════════════════════════════════════════════
     TABS
  ══════════════════════════════════════════════════ */
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    tabContents.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    S.type = t.dataset.tab;
    $('tab-' + t.dataset.tab).classList.add('active');
  }));

  /* ══════════════════════════════════════════════════
     SLIDERS
  ══════════════════════════════════════════════════ */
  barWidth.addEventListener('input',  () => widthVal.textContent  = barWidth.value);
  barHeight.addEventListener('input', () => heightVal.textContent = barHeight.value);

  /* ══════════════════════════════════════════════════
     STEP 1 — PAPER SIZE
  ══════════════════════════════════════════════════ */
  ppBtns.forEach(btn => btn.addEventListener('click', () => {
    ppBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.id;
    S.paper.presetId = id;
    customSizeBox.style.display = id === 'custom' ? 'block' : 'none';
    if (id !== 'custom') {
      S.paper.wMM = PRESETS[id].wMM;
      S.paper.hMM = PRESETS[id].hMM;
    } else {
      readCustomSize();
    }
    refreshSizeIndicator();
    if (S.ready) renderPreview();
  }));

  // Custom size inputs
  [customW, customH, customUnit].forEach(el =>
    el.addEventListener('input', () => { readCustomSize(); refreshSizeIndicator(); if (S.ready) renderPreview(); })
  );

  function readCustomSize() {
    let w = parseFloat(customW.value) || 50;
    let h = parseFloat(customH.value) || 30;
    const u = customUnit.value;
    if (u === 'in') { w *= 25.4; h *= 25.4; }
    else if (u === 'cm') { w *= 10; h *= 10; }
    else if (u === 'px') { w = w / 3.7795; h = h / 3.7795; }
    S.paper.wMM = w; S.paper.hMM = h;
  }

  // Orientation
  segBtns.forEach(btn => btn.addEventListener('click', () => {
    segBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    S.paper.orient = btn.dataset.orient;
    refreshSizeIndicator();
    if (S.ready) renderPreview();
  }));

  // Per page & margin
  stickersPerPage.addEventListener('change', () => {
    S.paper.perPage = parseInt(stickersPerPage.value);
    refreshSizeIndicator();
    if (S.ready) renderPreview();
  });
  marginSize.addEventListener('input', () => {
    S.paper.marginMM = parseFloat(marginSize.value) || 0;
    if (S.ready) renderPreview();
  });

  function refreshSizeIndicator() {
    let { wMM, hMM, orient } = S.paper;
    if (orient === 'landscape') [wMM, hMM] = [hMM, wMM];
    const presetName = S.paper.presetId === 'custom' ? 'Custom' : PRESETS[S.paper.presetId].name;
    sizeIndicator.textContent =
      `${presetName}  ·  ${Math.round(wMM)} × ${Math.round(hMM)} mm  ·  ${orient.charAt(0).toUpperCase()+orient.slice(1)}  ·  ${S.paper.perPage} sticker${S.paper.perPage > 1 ? 's' : ''}/page`;
  }
  refreshSizeIndicator();

  /* ══════════════════════════════════════════════════
     FORMAT DETECTION
  ══════════════════════════════════════════════════ */
  function detectFmt(v) {
    v = v.replace(/\s/g,'');
    if (/^\d{13}$/.test(v)) return 'EAN13';
    if (/^\d{8}$/.test(v))  return 'EAN8';
    if (/^\d{12}$/.test(v)) return 'UPC';
    return 'CODE128';
  }
  function getFmt(v, sel) { return sel.value === 'auto' ? detectFmt(v) : sel.value; }

  /* ══════════════════════════════════════════════════
     GENERATE — BARCODE
  ══════════════════════════════════════════════════ */
  function generateBarcode() {
    const raw = barcodeInput.value.trim();
    if (!raw) { shake(barcodeInput); return; }
    try {
      // Create hidden SVG
      barcodeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(barcodeSvg, raw, {
        format: getFmt(raw, formatSelect),
        lineColor: '#000000', width: parseFloat(barWidth.value),
        height: parseInt(barHeight.value), displayValue: false,
        margin: 10, background: '#ffffff',
      });
      batchSVGs = []; qrCanvas = null;
      S.type = 'barcode'; S.ready = true;
      renderPreview();
      addHistory(raw, 'barcode');
      showActionBar();
      updatePdfInfo(raw);
    } catch(e) { showErr(e.message); }
  }

  /* ══════════════════════════════════════════════════
     GENERATE — QR
  ══════════════════════════════════════════════════ */
  function generateQR() {
    const raw = qrInput.value.trim();
    if (!raw) { shake(qrInput); return; }
    try {
      const holder = document.createElement('div');
      holder.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
      document.body.appendChild(holder);
      new QRCode(holder, {
        text: raw, width: parseInt(qrSize.value), height: parseInt(qrSize.value),
        colorDark:'#000000', colorLight:'#ffffff',
        correctLevel: QRCode.CorrectLevel[qrError.value],
      });
      setTimeout(() => {
        qrCanvas = holder.querySelector('canvas');
        if (qrCanvas) {
          const tmpCanvas = document.createElement('canvas');
          tmpCanvas.width = qrCanvas.width; tmpCanvas.height = qrCanvas.height;
          tmpCanvas.getContext('2d').drawImage(qrCanvas, 0, 0);
          qrCanvas = tmpCanvas;
        }
        document.body.removeChild(holder);
        barcodeSvg = null; batchSVGs = [];
        S.type = 'qr'; S.ready = true;
        renderPreview();
        addHistory(raw, 'qr');
        showActionBar();
        updatePdfInfo(raw);
      }, 50);
    } catch(e) { showErr(e.message); }
  }

  /* ══════════════════════════════════════════════════
     GENERATE — BATCH
  ══════════════════════════════════════════════════ */
  function generateBatch() {
    const lines = batchInput.value.split('\n').map(l=>l.trim()).filter(Boolean);
    if (!lines.length) { shake(batchInput); return; }
    batchSVGs = [];
    lines.forEach(code => {
      try {
        const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        JsBarcode(svg, code, { format: getFmt(code, batchFormat), lineColor:'#000', width:1.8, height:60, displayValue:false, margin:6, background:'#fff' });
        batchSVGs.push({ code, svg, ok: true });
      } catch { batchSVGs.push({ code, svg:null, ok:false }); }
    });
    barcodeSvg = null; qrCanvas = null;
    S.type = 'batch'; S.ready = true;
    renderPreview();
    addHistory(lines.length + ' codes', 'batch');
    showActionBar();
    updatePdfInfo(lines.length + ' barcodes');
  }

  /* ══════════════════════════════════════════════════
     RENDER PREVIEW — paper sheet in stage
  ══════════════════════════════════════════════════ */
  const PX_PER_MM = 3.7795275591;

  function renderPreview() {
    paperEmpty.style.display = 'none';
    paperSheet.style.display = 'flex';
    paperSheet.innerHTML = '';

    let { wMM, hMM, orient, perPage, marginMM } = S.paper;
    if (orient === 'landscape') [wMM, hMM] = [hMM, wMM];

    // Scale to fit stage (max ~380 × 320 preview area)
    const maxW = 360, maxH = 300;
    const rawW = wMM * PX_PER_MM, rawH = hMM * PX_PER_MM;
    const scale = Math.min(maxW / rawW, maxH / rawH, 1);

    const shW = rawW * scale, shH = rawH * scale;
    const margPx = marginMM * PX_PER_MM * scale;

    paperSheet.style.cssText = `width:${shW}px;height:${shH}px;background:#fff;box-shadow:0 3px 20px rgba(0,0,0,.22),0 1px 4px rgba(0,0,0,.1);position:relative;display:block;animation:popIn .2s ease;`;

    const count = S.type === 'batch' ? Math.min(batchSVGs.length, Math.max(perPage, 1)) : perPage;
    const cols = count === 1 ? 1 : count <= 4 ? 2 : count <= 12 ? 3 : 4;
    const rows = Math.ceil(count / cols);

    const cellW = (shW - margPx * 2) / cols;
    const cellH = (shH - margPx * 2) / rows;

    const grid = document.createElement('div');
    grid.style.cssText = `position:absolute;top:${margPx}px;left:${margPx}px;width:${shW - margPx*2}px;height:${shH - margPx*2}px;display:grid;grid-template-columns:repeat(${cols},${cellW}px);grid-template-rows:repeat(${rows},${cellH}px);`;

    for (let i = 0; i < count; i++) {
      const cell = buildPreviewCell(cellW, cellH, scale, i);
      grid.appendChild(cell);
    }
    paperSheet.appendChild(grid);
  }

  function buildPreviewCell(cellW, cellH, scale, idx) {
    const cell = document.createElement('div');
    cell.className = 'sticker-cell';
    cell.style.cssText = `width:${cellW}px;height:${cellH}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;overflow:hidden;padding:${Math.max(2, 4*scale)}px;box-sizing:border-box;`;

    // Logo
    if (S.logoUrl) {
      const img = document.createElement('img');
      img.src = S.logoUrl; img.className = 'sc-logo';
      img.style.cssText = `max-width:${Math.min(30*scale, cellW*0.5)}px;max-height:${cellH*0.25}px;height:auto;`;
      cell.appendChild(img);
    }

    // Name (barcode only)
    const nameText = (S.type === 'barcode') ? labelName.value.trim() : '';
    if (nameText) {
      const el = document.createElement('p'); el.className = 'sc-name';
      el.textContent = nameText;
      el.style.fontSize = Math.max(7, 10*scale) + 'px';
      cell.appendChild(el);
    }

    // Barcode / QR / Batch
    if (S.type === 'barcode' && barcodeSvg) {
      const clone = barcodeSvg.cloneNode(true);
      clone.style.cssText = `width:${cellW * 0.9}px;height:auto;max-height:${cellH * 0.6}px;`;
      cell.appendChild(clone);
    } else if (S.type === 'qr' && qrCanvas) {
      const img = document.createElement('img');
      img.src = qrCanvas.toDataURL();
      const sz = Math.min(cellW * 0.75, cellH * 0.65);
      img.style.cssText = `width:${sz}px;height:${sz}px;display:block;`;
      cell.appendChild(img);
    } else if (S.type === 'batch' && batchSVGs[idx]) {
      const item = batchSVGs[idx];
      if (item.ok) {
        const clone = item.svg.cloneNode(true);
        clone.style.cssText = `width:${cellW * 0.88}px;height:auto;max-height:${cellH * 0.65}px;`;
        cell.appendChild(clone);
      } else {
        const err = document.createElement('div');
        err.style.cssText = 'font-family:monospace;font-size:9px;color:#c0392b;text-align:center;';
        err.textContent = '✕ ' + item.code; cell.appendChild(err);
      }
    }

    // Code text
    let codeText = '';
    if (S.type === 'barcode') codeText = barcodeInput.value.trim();
    else if (S.type === 'qr')  codeText = qrInput.value.trim().slice(0, 32);
    else if (S.type === 'batch' && batchSVGs[idx]) codeText = batchSVGs[idx].code;

    if (codeText) {
      const el = document.createElement('p'); el.className = 'sc-code';
      el.textContent = codeText; el.style.fontSize = Math.max(6, 8*scale) + 'px';
      cell.appendChild(el);
    }

    // Meta tags (barcode only)
    if (S.type === 'barcode') {
      const metas = [labelPrice.value.trim(), labelDate.value, labelNote.value.trim()].filter(Boolean);
      if (metas.length) {
        const metaEl = document.createElement('div'); metaEl.className = 'sc-meta';
        metas.forEach(m => { const s = document.createElement('span'); s.textContent = m; s.style.fontSize = Math.max(5,7*scale)+'px'; metaEl.appendChild(s); });
        cell.appendChild(metaEl);
      }
    }
    return cell;
  }

  function showActionBar() {
    previewBtns.style.display = 'flex';
    pdfInfoStrip.style.display = 'flex';
  }
  function updatePdfInfo(label) {
    let { wMM, hMM, orient } = S.paper;
    if (orient === 'landscape') [wMM, hMM] = [hMM, wMM];
    pdfInfoText.textContent = `PDF ready — "${label}"  ·  ${Math.round(wMM)}×${Math.round(hMM)} mm`;
  }

  /* ══════════════════════════════════════════════════
     DOWNLOAD — PNG
  ══════════════════════════════════════════════════ */
  downloadPng.addEventListener('click', () => {
    if (!S.ready) return;
    if (S.type === 'qr' && qrCanvas) {
      dlLink(qrCanvas.toDataURL('image/png'), 'qrcode.png'); return;
    }
    const svg = S.type === 'barcode' ? barcodeSvg : (batchSVGs[0]?.svg || null);
    if (svg) svgToPng(svg, url => dlLink(url, 'barcode.png'));
  });

  /* ══════════════════════════════════════════════════
     DOWNLOAD — SVG
  ══════════════════════════════════════════════════ */
  downloadSvgBtn.addEventListener('click', () => {
    if (!S.ready) return;
    if (S.type === 'qr' && qrCanvas) {
      const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${qrCanvas.width}" height="${qrCanvas.height}"><image href="${qrCanvas.toDataURL()}" width="${qrCanvas.width}" height="${qrCanvas.height}"/></svg>`;
      dlText(s, 'qrcode.svg', 'image/svg+xml'); return;
    }
    const svg = S.type === 'barcode' ? barcodeSvg : (batchSVGs[0]?.svg || null);
    if (svg) dlText(new XMLSerializer().serializeToString(svg), 'barcode.svg', 'image/svg+xml');
  });

  /* ══════════════════════════════════════════════════
     DOWNLOAD — PDF  ★ Main Feature ★
  ══════════════════════════════════════════════════ */
  downloadPdfBtn.addEventListener('click', generatePDF);

  async function generatePDF() {
    if (!S.ready || !window.jspdf) { showToast('jsPDF not loaded yet, please wait…', false); return; }

    showToast('Generating PDF…', true);

    try {
      const { jsPDF } = window.jspdf;

      let { wMM, hMM, orient, perPage, marginMM } = S.paper;
      if (orient === 'landscape') [wMM, hMM] = [hMM, wMM];

      // Determine count
      let totalItems = 1;
      if (S.type === 'batch') totalItems = batchSVGs.length;
      else totalItems = Math.max(1, perPage);

      const count = S.type === 'batch' ? totalItems : perPage;
      const cols  = count === 1 ? 1 : count <= 4 ? 2 : count <= 12 ? 3 : 4;
      const rows  = Math.ceil(count / cols);

      const cellW = (wMM - marginMM * 2) / cols;
      const cellH = (hMM - marginMM * 2) / rows;

      const pdf = new jsPDF({
        orientation: orient === 'landscape' ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [wMM, hMM],
      });

      // Render each cell to PDF
      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const xBase = marginMM + col * cellW;
        const yBase = marginMM + row * cellH;

        await renderCellToPDF(pdf, xBase, yBase, cellW, cellH, i);
      }

      // File name
      const now = new Date();
      const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
      const fname = `barcode_${stamp}_${Math.round(wMM)}x${Math.round(hMM)}mm.pdf`;

      pdf.save(fname);
      showToast('PDF downloaded! ✓', false);

    } catch (e) {
      console.error(e);
      showToast('PDF error: ' + e.message, false);
    }
  }

  async function renderCellToPDF(pdf, x, y, cellW, cellH, idx) {
    const logoPad = 1;
    let curY = y + 2;

    // Logo
    if (S.logoUrl) {
      const lw = Math.min(20, cellW * 0.5);
      const lh = lw * 0.5; // rough estimate
      try {
        const ext = S.logoUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        pdf.addImage(S.logoUrl, ext, x + (cellW - lw)/2, curY, lw, lh);
        curY += lh + logoPad;
      } catch(_){}
    }

    // Product name
    if (S.type === 'barcode' && labelName.value.trim()) {
      pdf.setFont('helvetica','bold');
      pdf.setFontSize(9); pdf.setTextColor(0,0,0);
      pdf.text(labelName.value.trim(), x + cellW/2, curY + 3, { align:'center', maxWidth: cellW - 2 });
      curY += 5;
    }

    // Barcode / QR image
    let imgData = null, imgW = 0, imgH = 0;

    if (S.type === 'barcode' && barcodeSvg) {
      await new Promise(resolve => {
        svgToPng(barcodeSvg, url => { imgData = url; resolve(); });
      });
      imgW = Math.min(cellW * 0.9, cellW - 2);
      imgH = imgW * 0.4;
    } else if (S.type === 'qr' && qrCanvas) {
      imgData = qrCanvas.toDataURL('image/png');
      const sz = Math.min(cellW * 0.8, cellH * 0.65);
      imgW = sz; imgH = sz;
    } else if (S.type === 'batch' && batchSVGs[idx]?.ok) {
      await new Promise(resolve => {
        svgToPng(batchSVGs[idx].svg, url => { imgData = url; resolve(); });
      });
      imgW = Math.min(cellW * 0.88, cellW - 2);
      imgH = imgW * 0.4;
    }

    if (imgData) {
      pdf.addImage(imgData, 'PNG', x + (cellW - imgW)/2, curY, imgW, imgH);
      curY += imgH + 1;
    }

    // Code number
    let codeText = '';
    if (S.type === 'barcode') codeText = barcodeInput.value.trim();
    else if (S.type === 'qr') codeText = qrInput.value.trim().slice(0, 40);
    else if (S.type === 'batch' && batchSVGs[idx]) codeText = batchSVGs[idx].code;

    if (codeText) {
      pdf.setFont('courier','normal');
      pdf.setFontSize(7); pdf.setTextColor(50,50,50);
      pdf.text(codeText, x + cellW/2, curY + 2.5, { align:'center', maxWidth: cellW - 2 });
      curY += 4;
    }

    // Meta
    if (S.type === 'barcode') {
      const metas = [labelPrice.value.trim(), labelDate.value, labelNote.value.trim()].filter(Boolean);
      if (metas.length) {
        pdf.setFont('courier','normal');
        pdf.setFontSize(6); pdf.setTextColor(80,80,80);
        pdf.text(metas.join('  ·  '), x + cellW/2, curY + 2, { align:'center', maxWidth: cellW - 2 });
      }
    }
  }

  /* ══════════════════════════════════════════════════
     LOGO
  ══════════════════════════════════════════════════ */
  logoUpload.addEventListener('change', () => {
    const f = logoUpload.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = e => {
      S.logoUrl = e.target.result;
      logoImg.src = S.logoUrl;
      logoRow.style.display = 'flex';
      if (S.ready) renderPreview();
    };
    r.readAsDataURL(f);
  });
  removeLogo.addEventListener('click', () => {
    S.logoUrl = null; logoUpload.value = '';
    logoRow.style.display = 'none';
    if (S.ready) renderPreview();
  });

  /* ══════════════════════════════════════════════════
     HISTORY
  ══════════════════════════════════════════════════ */
  function addHistory(code, type) {
    S.history.unshift({code, type});
    if (S.history.length > 30) S.history.pop();
    renderHistory();
  }
  function renderHistory() {
    if (!S.history.length) { historyList.innerHTML = '<p class="history-empty">Generated codes will appear here</p>'; return; }
    historyList.innerHTML = S.history.map((it, i) => `
      <div class="history-item" data-i="${i}">
        <span class="history-dot dot-${it.type}"></span>
        <span class="history-code">${esc(it.code)}</span>
        <span class="history-type">${it.type.toUpperCase()}</span>
      </div>`).join('');
    historyList.querySelectorAll('.history-item').forEach(el =>
      el.addEventListener('click', () => {
        const it = S.history[+el.dataset.i];
        if (it.type === 'barcode') { barcodeInput.value = it.code; document.querySelector('.tab[data-tab="barcode"]').click(); setTimeout(generateBarcode, 50); }
        else if (it.type === 'qr') { qrInput.value = it.code; document.querySelector('.tab[data-tab="qr"]').click(); setTimeout(generateQR, 50); }
      })
    );
  }
  clearHistory.addEventListener('click', () => { S.history = []; renderHistory(); });

  /* ══════════════════════════════════════════════════
     TOAST
  ══════════════════════════════════════════════════ */
  let toastTimer = null;
  function showToast(msg, spinner) {
    toastMsg.textContent = msg;
    pdfToast.querySelector('.toast-spinner').style.display = spinner ? 'block' : 'none';
    pdfToast.style.display = 'flex';
    clearTimeout(toastTimer);
    if (!spinner) toastTimer = setTimeout(() => { pdfToast.style.display = 'none'; }, 2800);
  }

  /* ══════════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════════ */
  function svgToPng(svgEl, cb) {
    const data = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([data], {type:'image/svg+xml'});
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width || 400; c.height = img.height || 200;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,c.width,c.height);
      ctx.drawImage(img,0,0); URL.revokeObjectURL(url);
      cb(c.toDataURL('image/png'));
    };
    img.src = url;
  }
  function dlLink(url, name) { const a = document.createElement('a'); a.href=url; a.download=name; a.click(); }
  function dlText(content, name, type) {
    const url = URL.createObjectURL(new Blob([content],{type}));
    dlLink(url, name); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); el.addEventListener('animationend', () => el.classList.remove('shake'), {once:true}); }
  function showErr(msg) { showToast('✕ ' + msg, false); }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ══════════════════════════════════════════════════
     KEY BINDINGS
  ══════════════════════════════════════════════════ */
  barcodeInput.addEventListener('keydown', e => { if (e.key === 'Enter') generateBarcode(); });
  qrInput.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) generateQR(); });
  generateBtn.addEventListener('click', generateBarcode);
  generateQrBtn.addEventListener('click', generateQR);
  generateBatchBtn.addEventListener('click', generateBatch);

  /* ══════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════ */
  renderHistory();

})();
