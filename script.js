/* ══════════════════════════════════════════════════════
   BarcodeStudio Pro — script.js
   ══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── State ──────────────────────────────────────────── */
  const S = {
    type: 'barcode',        // barcode | qr | batch
    history: [],
    logoDataUrl: null,      // uploaded logo
    // print settings
    print: {
      w: 50, h: 25, unit: 'mm',
      orient: 'portrait',
      perPage: 1,
      printer: 'thermal',
      dpi: 300,
      margin: 3,
      border: 'none',
      cropMarks: false,
      nameFontSize: 10,
      codeFontSize: 8,
    },
  };

  /* ── DOM shortcuts ──────────────────────────────────── */
  const $ = id => document.getElementById(id);

  // Topbar
  const themeToggle = $('themeToggle');

  // Tabs
  const tabs        = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  // Barcode tab
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

  // QR tab
  const qrInput        = $('qrInput');
  const qrSize         = $('qrSize');
  const qrError        = $('qrError');
  const generateQrBtn  = $('generateQrBtn');

  // Batch tab
  const batchInput       = $('batchInput');
  const batchFormat      = $('batchFormat');
  const batchCols        = $('batchCols');
  const generateBatchBtn = $('generateBatchBtn');

  // Preview
  const previewActions = $('previewActions');
  const previewEmpty   = $('previewEmpty');
  const stickerArea    = $('stickerArea');
  const barcodeSvg     = $('barcodeSvg');
  const barcodeHolder  = $('barcodeHolder');
  const qrHolder       = $('qrHolder');
  const stickerName    = $('stickerName');
  const stickerCode    = $('stickerCode');
  const stickerMeta    = $('stickerMeta');
  const metaPrice      = $('metaPrice');
  const metaDate       = $('metaDate');
  const metaNote       = $('metaNote');
  const batchOutput    = $('batchOutput');

  // Buttons
  const downloadPng  = $('downloadPng');
  const downloadSvg  = $('downloadSvg');
  const printBtn     = $('printBtn');
  const clearHistory = $('clearHistory');
  const historyList  = $('historyList');
  const printFrame   = $('printFrame');

  // Modal
  const printModal   = $('printModal');
  const closeModal   = $('closeModal');
  const cancelPrint  = $('cancelPrint');
  const confirmPrint = $('confirmPrint');

  // Modal settings
  const presetBtns    = document.querySelectorAll('.preset-btn');
  const stickerW      = $('stickerW');
  const stickerH      = $('stickerH');
  const stickerUnit   = $('stickerUnit');
  const segBtns       = document.querySelectorAll('.seg');
  const stickersPerPage = $('stickersPerPage');
  const printerBtns   = document.querySelectorAll('.printer-btn');
  const dpiSelect     = $('dpiSelect');
  const marginSize    = $('marginSize');
  const borderStyle   = $('borderStyle');
  const showCropMarks = $('showCropMarks');
  const nameFontSize  = $('nameFontSize');
  const codeFontSize  = $('codeFontSize');
  const logoUpload    = $('logoUpload');
  const logoPreviewWrap = $('logoPreviewWrap');
  const logoPreviewImg  = $('logoPreviewImg');
  const removeLogo    = $('removeLogo');
  const logoSizeField = $('logoSizeField');
  const logoWidth     = $('logoWidth');
  const printPreviewSheet = $('printPreviewSheet');
  const previewNote   = $('previewNote');

  /* ════════════════════════════════════════════════════
     THEME
  ════════════════════════════════════════════════════ */
  function initTheme() {
    const t = localStorage.getItem('bcs-theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
  }
  themeToggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const nxt = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nxt);
    localStorage.setItem('bcs-theme', nxt);
  });

  /* ════════════════════════════════════════════════════
     TABS
  ════════════════════════════════════════════════════ */
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    S.type = tab.dataset.tab;
    $('tab-' + tab.dataset.tab).classList.add('active');
  }));

  /* ════════════════════════════════════════════════════
     SLIDERS
  ════════════════════════════════════════════════════ */
  barWidth.addEventListener('input',  () => widthVal.textContent  = barWidth.value);
  barHeight.addEventListener('input', () => heightVal.textContent = barHeight.value);

  /* ════════════════════════════════════════════════════
     FORMAT DETECTION
  ════════════════════════════════════════════════════ */
  function detectFormat(v) {
    v = v.replace(/\s/g, '');
    if (/^\d{13}$/.test(v)) return 'EAN13';
    if (/^\d{8}$/.test(v))  return 'EAN8';
    if (/^\d{12}$/.test(v)) return 'UPC';
    return 'CODE128';
  }
  function fmt(v, sel) {
    return sel.value === 'auto' ? detectFormat(v) : sel.value;
  }

  /* ════════════════════════════════════════════════════
     GENERATE — BARCODE
  ════════════════════════════════════════════════════ */
  function generateBarcode() {
    const raw = barcodeInput.value.trim();
    if (!raw) { shake(barcodeInput); return; }
    try {
      qrHolder.style.display    = 'none';
      barcodeHolder.style.display = 'block';
      JsBarcode(barcodeSvg, raw, {
        format:       fmt(raw, formatSelect),
        lineColor:    '#000000',
        width:        parseFloat(barWidth.value),
        height:       parseInt(barHeight.value),
        displayValue: false,
        margin:       10,
        background:   '#ffffff',
      });
      const name  = labelName.value.trim();
      const price = labelPrice.value.trim();
      const date  = labelDate.value;
      const note  = labelNote.value.trim();
      stickerName.textContent   = name;
      stickerName.style.display = name ? 'block' : 'none';
      stickerCode.textContent   = raw;
      metaPrice.textContent     = price;
      metaDate.textContent      = date ? '📅 ' + date : '';
      metaNote.textContent      = note;
      stickerMeta.style.display = (price || date || note) ? 'flex' : 'none';
      showSticker(); addHistory(raw, 'barcode'); S.type = 'barcode';
    } catch (e) { showError(e.message || 'Invalid barcode value'); }
  }

  /* ════════════════════════════════════════════════════
     GENERATE — QR
  ════════════════════════════════════════════════════ */
  function generateQR() {
    const raw = qrInput.value.trim();
    if (!raw) { shake(qrInput); return; }
    try {
      qrHolder.innerHTML = '';
      qrHolder.style.display    = 'block';
      barcodeHolder.style.display = 'none';
      new QRCode(qrHolder, {
        text: raw,
        width:  parseInt(qrSize.value),
        height: parseInt(qrSize.value),
        colorDark:  '#000000', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel[qrError.value],
      });
      stickerName.style.display = 'none';
      stickerCode.textContent   = raw.length > 40 ? raw.slice(0,40) + '…' : raw;
      stickerMeta.style.display = 'none';
      showSticker(); addHistory(raw, 'qr'); S.type = 'qr';
    } catch (e) { showError('QR failed: ' + e.message); }
  }

  /* ════════════════════════════════════════════════════
     GENERATE — BATCH
  ════════════════════════════════════════════════════ */
  function generateBatch() {
    const lines = batchInput.value.split('\n').map(l=>l.trim()).filter(Boolean);
    if (!lines.length) { shake(batchInput); return; }
    const cols = parseInt(batchCols.value);
    batchOutput.innerHTML = '';
    batchOutput.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    lines.forEach(code => {
      const item = document.createElement('div');
      item.className = 'batch-item';
      try {
        const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        JsBarcode(svg, code, { format: fmt(code, batchFormat), lineColor:'#000', width:1.8, height:60, displayValue:false, margin:6, background:'#fff' });
        const p = document.createElement('p');
        p.className = 'batch-item-code'; p.textContent = code;
        item.appendChild(svg); item.appendChild(p);
      } catch {
        const e = document.createElement('div');
        e.className = 'batch-item-error'; e.textContent = '✕ ' + code + ' — invalid';
        item.appendChild(e);
      }
      batchOutput.appendChild(item);
    });
    stickerArea.style.display  = 'none';
    batchOutput.style.display  = 'grid';
    previewEmpty.style.display = 'none';
    previewActions.style.display = 'flex';
    S.type = 'batch';
    addHistory(lines.length + ' codes', 'batch');
  }

  /* ════════════════════════════════════════════════════
     SHOW / ERROR helpers
  ════════════════════════════════════════════════════ */
  function showSticker() {
    batchOutput.style.display  = 'none';
    previewEmpty.style.display = 'none';
    stickerArea.style.display  = 'flex';
    previewActions.style.display = 'flex';
    stickerArea.style.animation = 'none'; void stickerArea.offsetWidth; stickerArea.style.animation = '';
  }
  function showError(msg) {
    stickerArea.style.display = batchOutput.style.display = 'none';
    previewActions.style.display = 'none';
    previewEmpty.style.display = 'flex';
    previewEmpty.innerHTML = `<div class="error-msg">✕ ${esc(msg)}</div><p style="font-family:var(--mono);font-size:11px;color:var(--muted);margin-top:4px;">Try a different value or format</p>`;
    setTimeout(resetEmpty, 3000);
  }
  function resetEmpty() {
    previewEmpty.innerHTML = `<div class="empty-bars" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div><p>Nothing generated yet</p>`;
  }

  /* ════════════════════════════════════════════════════
     HISTORY
  ════════════════════════════════════════════════════ */
  function addHistory(code, type) {
    S.history.unshift({code, type});
    if (S.history.length > 30) S.history.pop();
    renderHistory();
  }
  function renderHistory() {
    if (!S.history.length) {
      historyList.innerHTML = '<p class="history-empty">Generated codes will appear here</p>'; return;
    }
    historyList.innerHTML = S.history.map((item, i) => `
      <div class="history-item" data-index="${i}">
        <span class="history-dot dot-${item.type}"></span>
        <span class="history-code">${esc(item.code)}</span>
        <span class="history-type">${item.type.toUpperCase()}</span>
      </div>`).join('');
    historyList.querySelectorAll('.history-item').forEach(el =>
      el.addEventListener('click', () => {
        const it = S.history[+el.dataset.index];
        if (it.type === 'barcode') { barcodeInput.value = it.code; document.querySelector('.tab[data-tab="barcode"]').click(); setTimeout(generateBarcode,50); }
        else if (it.type === 'qr') { qrInput.value = it.code; document.querySelector('.tab[data-tab="qr"]').click(); setTimeout(generateQR,50); }
      })
    );
  }
  clearHistory.addEventListener('click', () => { S.history = []; renderHistory(); });

  /* ════════════════════════════════════════════════════
     DOWNLOAD PNG
  ════════════════════════════════════════════════════ */
  downloadPng.addEventListener('click', () => {
    if (S.type === 'qr') {
      const c = qrHolder.querySelector('canvas');
      if (c) dlLink(c.toDataURL('image/png'), 'qrcode.png'); return;
    }
    const svg = S.type === 'batch' ? batchOutput.querySelector('svg') : barcodeSvg;
    if (!svg) return;
    svgToPng(svg, url => dlLink(url, 'barcode.png'));
  });

  function svgToPng(svgEl, cb) {
    const data = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([data], {type:'image/svg+xml'});
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 400; canvas.height = img.height || 200;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0); URL.revokeObjectURL(url);
      cb(canvas.toDataURL('image/png'));
    };
    img.src = url;
  }

  /* ════════════════════════════════════════════════════
     DOWNLOAD SVG
  ════════════════════════════════════════════════════ */
  downloadSvg.addEventListener('click', () => {
    if (S.type === 'qr') {
      const c = qrHolder.querySelector('canvas');
      if (!c) return;
      const w = c.width, h = c.height;
      const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><image href="${c.toDataURL()}" width="${w}" height="${h}"/></svg>`;
      dlText(s, 'qrcode.svg', 'image/svg+xml'); return;
    }
    const svg = S.type === 'batch' ? batchOutput.querySelector('svg') : barcodeSvg;
    if (!svg) return;
    dlText(new XMLSerializer().serializeToString(svg), 'barcode.svg', 'image/svg+xml');
  });

  function dlText(content, name, type) {
    const blob = new Blob([content],{type});
    const url  = URL.createObjectURL(blob);
    dlLink(url, name); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function dlLink(url, name) {
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  }

  /* ════════════════════════════════════════════════════
     LOGO UPLOAD
  ════════════════════════════════════════════════════ */
  logoUpload.addEventListener('change', () => {
    const file = logoUpload.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      S.logoDataUrl = e.target.result;
      logoPreviewImg.src = S.logoDataUrl;
      logoPreviewWrap.style.display = 'flex';
      logoSizeField.style.display   = 'block';
      updateModalPreview();
    };
    reader.readAsDataURL(file);
  });
  removeLogo.addEventListener('click', () => {
    S.logoDataUrl = null; logoUpload.value = '';
    logoPreviewWrap.style.display = logoSizeField.style.display = 'none';
    updateModalPreview();
  });

  /* ════════════════════════════════════════════════════
     PRINT MODAL — OPEN / CLOSE
  ════════════════════════════════════════════════════ */
  printBtn.addEventListener('click', () => {
    if (previewActions.style.display === 'none') return;
    syncModalFromState(); buildModalPreview(); printModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  });
  function closeModalFn() {
    printModal.style.display = 'none'; document.body.style.overflow = '';
  }
  closeModal.addEventListener('click', closeModalFn);
  cancelPrint.addEventListener('click', closeModalFn);
  printModal.addEventListener('click', e => { if (e.target === printModal) closeModalFn(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && printModal.style.display !== 'none') closeModalFn(); });

  /* ── Sync modal inputs → S.print ─────────────────────── */
  function syncModalFromState() {
    stickerW.value     = S.print.w;
    stickerH.value     = S.print.h;
    stickerUnit.value  = S.print.unit;
    marginSize.value   = S.print.margin;
    borderStyle.value  = S.print.border;
    showCropMarks.checked = S.print.cropMarks;
    dpiSelect.value    = S.print.dpi;
    nameFontSize.value = S.print.nameFontSize;
    codeFontSize.value = S.print.codeFontSize;
    stickersPerPage.value = S.print.perPage;
  }

  function readModal() {
    S.print.w           = parseFloat(stickerW.value) || 50;
    S.print.h           = parseFloat(stickerH.value) || 25;
    S.print.unit        = stickerUnit.value;
    S.print.margin      = parseFloat(marginSize.value) || 0;
    S.print.border      = borderStyle.value;
    S.print.cropMarks   = showCropMarks.checked;
    S.print.dpi         = parseInt(dpiSelect.value);
    S.print.nameFontSize = parseInt(nameFontSize.value);
    S.print.codeFontSize = parseInt(codeFontSize.value);
    S.print.perPage     = stickersPerPage.value;
  }

  /* ── Preset size buttons ─────────────────────────────── */
  presetBtns.forEach(btn => btn.addEventListener('click', () => {
    presetBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    stickerW.value = btn.dataset.w; stickerH.value = btn.dataset.h;
    stickerUnit.value = 'mm';
    readModal(); updateModalPreview();
  }));

  /* ── Orientation ─────────────────────────────────────── */
  segBtns.forEach(btn => btn.addEventListener('click', () => {
    segBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    S.print.orient = btn.dataset.orient;
    updateModalPreview();
  }));

  /* ── Printer type ────────────────────────────────────── */
  printerBtns.forEach(btn => btn.addEventListener('click', () => {
    printerBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    S.print.printer = btn.dataset.printer;
    // Auto-set DPI suggestion
    if (S.print.printer === 'thermal') dpiSelect.value = 203;
    else if (S.print.printer === 'a4')  dpiSelect.value = 600;
    else                                 dpiSelect.value = 300;
    readModal(); updateModalPreview();
  }));

  /* ── All other inputs → live preview ─────────────────── */
  [stickerW, stickerH, stickerUnit, marginSize, borderStyle,
   showCropMarks, dpiSelect, nameFontSize, codeFontSize,
   stickersPerPage, logoWidth].forEach(el => {
    el.addEventListener('change', () => { readModal(); updateModalPreview(); });
    el.addEventListener('input',  () => { readModal(); updateModalPreview(); });
  });

  /* ════════════════════════════════════════════════════
     MODAL PREVIEW BUILDER
  ════════════════════════════════════════════════════ */
  function buildModalPreview() { readModal(); updateModalPreview(); }

  function updateModalPreview() {
    const p  = S.print;
    const MM = 3.7795275591; // 1mm in px at 96dpi (screen)

    // Convert unit
    let wMM = p.w, hMM = p.h;
    if (p.unit === 'in') { wMM = p.w * 25.4; hMM = p.h * 25.4; }

    // Orientation swap
    let shW = wMM, shH = hMM;
    if (p.orient === 'landscape') { shW = hMM; shH = wMM; }

    // Scale to fit stage (max ~360×280 px)
    const maxW = 340, maxH = 260;
    const scaleW = maxW / (shW * MM), scaleH = maxH / (shH * MM);
    const scale  = Math.min(scaleW, scaleH, 1);

    const shPxW = shW * MM * scale;
    const shPxH = shH * MM * scale;
    const margPx = p.margin * MM * scale;

    printPreviewSheet.style.cssText = `
      width:${shPxW}px; height:${shPxH}px;
      background:#fff;
      box-shadow: 0 2px 16px rgba(0,0,0,.2);
    `;

    // How many stickers to show?
    let count = parseInt(p.perPage) || 1;
    if (p.perPage === 'batch') count = S.type === 'batch' ? Math.min(batchOutput.querySelectorAll('.batch-item').length, 24) : 1;

    const cols = count === 1 ? 1 : count <= 4 ? 2 : count <= 10 ? 2 : count <= 20 ? 4 : 4;
    const rows = Math.ceil(count / cols);

    printPreviewSheet.innerHTML = '';

    if (count === 1) {
      // Single sticker centered
      const cell = buildStickerCell(p, shPxW - margPx*2, shPxH - margPx*2, scale, 0);
      cell.style.cssText = `position:absolute;top:${margPx}px;left:${margPx}px;width:${shPxW - margPx*2}px;height:${shPxH - margPx*2}px;overflow:hidden;`;
      if (p.border !== 'none') { cell.style.outline = `1px ${p.border} #aaa`; }
      if (p.cropMarks) addCropMarks(cell);
      printPreviewSheet.style.position = 'relative';
      printPreviewSheet.appendChild(cell);
    } else {
      // Grid
      const grid = document.createElement('div');
      const cellW = (shPxW - margPx*2) / cols;
      const cellH = (shPxH - margPx*2) / rows;
      grid.style.cssText = `display:grid;grid-template-columns:repeat(${cols},${cellW}px);grid-template-rows:repeat(${rows},${cellH}px);margin:${margPx}px;`;
      for (let i = 0; i < count; i++) {
        const cell = buildStickerCell(p, cellW, cellH, scale, i);
        cell.style.cssText = `width:${cellW}px;height:${cellH}px;overflow:hidden;box-sizing:border-box;` + (p.border !== 'none' ? `border:1px ${p.border} #ccc;` : '');
        if (p.cropMarks) addCropMarks(cell);
        grid.appendChild(cell);
      }
      printPreviewSheet.appendChild(grid);
    }

    // Note
    const unitLabel = p.unit === 'in' ? '"' : 'mm';
    previewNote.textContent = `${p.w}×${p.h}${unitLabel} · ${p.orient.charAt(0).toUpperCase()+p.orient.slice(1)} · ${p.printer.charAt(0).toUpperCase()+p.printer.slice(1)} · ${count} sticker(s)`;
  }

  function buildStickerCell(p, cellW, cellH, scale, idx) {
    const cell = document.createElement('div');
    cell.className = 'preview-sticker-cell';
    cell.style.cssText = `display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:#fff;width:100%;height:100%;`;

    // Logo
    if (S.logoDataUrl) {
      const img = document.createElement('img');
      const lw = Math.min((logoWidth.value || 20) * 3.78 * scale, cellW * 0.5);
      img.src = S.logoDataUrl;
      img.style.cssText = `max-width:${lw}px;height:auto;display:block;margin-bottom:1px;`;
      cell.appendChild(img);
    }

    // Name
    const nameText = labelName.value.trim();
    if (nameText && S.type === 'barcode') {
      const nameEl = document.createElement('p');
      nameEl.className = 'ps-name';
      nameEl.textContent = nameText;
      nameEl.style.fontSize = (p.nameFontSize * scale * 0.75) + 'px';
      nameEl.style.fontWeight = '700';
      nameEl.style.fontFamily = 'Arial,sans-serif';
      nameEl.style.color = '#000';
      nameEl.style.textAlign = 'center';
      cell.appendChild(nameEl);
    }

    // Barcode / QR
    if (S.type === 'barcode') {
      const svgEl = barcodeSvg.cloneNode(true);
      const svgW = Math.min(cellW * 0.9, 200);
      svgEl.style.cssText = `width:${svgW}px;height:auto;display:block;`;
      cell.appendChild(svgEl);
    } else if (S.type === 'qr') {
      const canvas = qrHolder.querySelector('canvas');
      if (canvas) {
        const img = document.createElement('img');
        img.src = canvas.toDataURL();
        const sz = Math.min(cellW * 0.75, cellH * 0.75);
        img.style.cssText = `width:${sz}px;height:${sz}px;`;
        cell.appendChild(img);
      }
    } else if (S.type === 'batch') {
      // Show one of the batch items
      const items = batchOutput.querySelectorAll('.batch-item svg');
      if (items[idx]) {
        const svgEl = items[idx].cloneNode(true);
        svgEl.style.cssText = `width:${cellW*0.85}px;height:auto;display:block;`;
        cell.appendChild(svgEl);
      }
    }

    // Code
    const codeEl = document.createElement('p');
    codeEl.className = 'ps-code';
    codeEl.textContent = S.type === 'barcode' ? barcodeInput.value.trim() : S.type === 'qr' ? (qrInput.value.trim().slice(0,30)) : '';
    codeEl.style.cssText = `font-family:'Courier New',monospace;font-size:${p.codeFontSize * scale * 0.75}px;color:#333;letter-spacing:1px;text-align:center;`;
    cell.appendChild(codeEl);

    // Meta
    if (S.type === 'barcode') {
      const metaTexts = [labelPrice.value.trim(), labelDate.value, labelNote.value.trim()].filter(Boolean);
      if (metaTexts.length) {
        const metaEl = document.createElement('div');
        metaEl.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;justify-content:center;';
        metaTexts.forEach(t => {
          const s = document.createElement('span');
          s.textContent = t;
          s.style.cssText = `font-family:'Courier New',monospace;font-size:${p.codeFontSize * scale * 0.65}px;color:#555;background:#f4f4f0;padding:1px 4px;border-radius:2px;`;
          metaEl.appendChild(s);
        });
        cell.appendChild(metaEl);
      }
    }

    return cell;
  }

  function addCropMarks(cell) {
    const marks = ['tl','tr','bl','br'];
    marks.forEach(pos => {
      const m = document.createElement('span');
      m.style.cssText = `position:absolute;width:6px;height:6px;pointer-events:none;`;
      if (pos === 'tl') { m.style.cssText += 'top:-1px;left:-1px;border-top:1px solid #999;border-left:1px solid #999;'; }
      if (pos === 'tr') { m.style.cssText += 'top:-1px;right:-1px;border-top:1px solid #999;border-right:1px solid #999;'; }
      if (pos === 'bl') { m.style.cssText += 'bottom:-1px;left:-1px;border-bottom:1px solid #999;border-left:1px solid #999;'; }
      if (pos === 'br') { m.style.cssText += 'bottom:-1px;right:-1px;border-bottom:1px solid #999;border-right:1px solid #999;'; }
      cell.style.position = 'relative';
      cell.appendChild(m);
    });
  }

  /* ════════════════════════════════════════════════════
     CONFIRM PRINT — build printFrame → window.print()
  ════════════════════════════════════════════════════ */
  confirmPrint.addEventListener('click', () => {
    readModal(); buildPrintFrame(); closeModalFn();
    setTimeout(() => window.print(), 120);
  });

  function buildPrintFrame() {
    const p  = S.print;
    const MM = 3.7795275591;

    let wMM = p.w, hMM = p.h;
    if (p.unit === 'in') { wMM = p.w * 25.4; hMM = p.h * 25.4; }
    if (p.orient === 'landscape') { [wMM, hMM] = [hMM, wMM]; }

    const margMM = p.margin;
    let count = parseInt(p.perPage) || 1;
    if (p.perPage === 'batch') count = S.type === 'batch' ? batchOutput.querySelectorAll('.batch-item').length : 1;

    const cols = count === 1 ? 1 : count <= 4 ? 2 : 4;
    const rows = Math.ceil(count / cols);

    const cellW = (wMM - margMM*2) / cols;
    const cellH = (hMM - margMM*2) / rows;

    // Inline style: exact mm dimensions for printer
    const sheetStyle = [
      `width:${wMM}mm`,
      `height:${hMM}mm`,
      `background:#fff`,
      `display:flex`,
      `align-items:center`,
      `justify-content:center`,
      `position:relative`,
    ].join(';');

    const gridStyle = [
      `display:grid`,
      `grid-template-columns:repeat(${cols},${cellW}mm)`,
      `grid-template-rows:repeat(${rows},${cellH}mm)`,
      `margin:${margMM}mm`,
    ].join(';');

    const cells = [];
    for (let i = 0; i < count; i++) {
      cells.push(buildPrintCell(p, cellW, cellH, i));
    }

    const borderAttr = p.border !== 'none' ? `border:0.3mm ${p.border} #bbb;` : '';
    const cellWrapper = count === 1
      ? `<div style="width:${cellW}mm;height:${cellH}mm;overflow:hidden;${borderAttr}">${cells[0]}</div>`
      : `<div style="${gridStyle}">${cells.map(c => `<div style="overflow:hidden;${borderAttr}">${c}</div>`).join('')}</div>`;

    printFrame.innerHTML = `
      <div style="${sheetStyle}">
        ${cellWrapper}
      </div>
    `;
  }

  function buildPrintCell(p, cellWmm, cellHmm, idx) {
    const fs_name = p.nameFontSize;
    const fs_code = p.codeFontSize;
    const lw = logoWidth.value || 20;

    let innerHtml = '';

    // Logo
    if (S.logoDataUrl) {
      innerHtml += `<img src="${S.logoDataUrl}" style="max-width:${Math.min(lw, cellWmm*0.5)}mm;height:auto;display:block;margin:0 auto 1mm;"/>`;
    }

    // Name
    if (S.type === 'barcode' && labelName.value.trim()) {
      innerHtml += `<p style="font-family:Arial,sans-serif;font-size:${fs_name}pt;font-weight:bold;color:#000;text-align:center;margin:0 0 1mm;word-break:break-word;">${esc(labelName.value.trim())}</p>`;
    }

    // Barcode / QR image
    if (S.type === 'barcode') {
      const svgData = new XMLSerializer().serializeToString(barcodeSvg);
      const svgUrl  = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      innerHtml += `<img src="${svgUrl}" style="max-width:${cellWmm * 0.9}mm;height:auto;display:block;margin:0 auto;"/>`;
    } else if (S.type === 'qr') {
      const canvas = qrHolder.querySelector('canvas');
      if (canvas) {
        const sz = Math.min(cellWmm * 0.8, cellHmm * 0.7);
        innerHtml += `<img src="${canvas.toDataURL()}" style="width:${sz}mm;height:${sz}mm;display:block;margin:0 auto;"/>`;
      }
    } else if (S.type === 'batch') {
      const svgEls = batchOutput.querySelectorAll('.batch-item svg');
      if (svgEls[idx]) {
        const svgData = new XMLSerializer().serializeToString(svgEls[idx]);
        const svgUrl  = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        innerHtml += `<img src="${svgUrl}" style="max-width:${cellWmm*0.88}mm;height:auto;display:block;margin:0 auto;"/>`;
      }
    }

    // Code text
    const codeText = S.type === 'barcode' ? barcodeInput.value.trim()
                   : S.type === 'qr'      ? qrInput.value.trim().slice(0,40)
                   : (batchOutput.querySelectorAll('.batch-item-code')[idx]?.textContent || '');
    if (codeText) {
      innerHtml += `<p style="font-family:'Courier New',monospace;font-size:${fs_code}pt;color:#000;text-align:center;letter-spacing:1pt;margin:0.5mm 0 0;">${esc(codeText)}</p>`;
    }

    // Meta
    if (S.type === 'barcode') {
      const metas = [labelPrice.value.trim(), labelDate.value, labelNote.value.trim()].filter(Boolean);
      if (metas.length) {
        innerHtml += `<p style="font-family:'Courier New',monospace;font-size:${fs_code-1}pt;color:#333;text-align:center;margin:0.5mm 0 0;">${metas.map(esc).join('  ·  ')}</p>`;
      }
    }

    // Crop marks (inline absolute)
    const crops = p.cropMarks ? `
      <span style="position:absolute;top:-0.5mm;left:-0.5mm;width:2mm;height:2mm;border-top:0.2mm solid #888;border-left:0.2mm solid #888;"></span>
      <span style="position:absolute;top:-0.5mm;right:-0.5mm;width:2mm;height:2mm;border-top:0.2mm solid #888;border-right:0.2mm solid #888;"></span>
      <span style="position:absolute;bottom:-0.5mm;left:-0.5mm;width:2mm;height:2mm;border-bottom:0.2mm solid #888;border-left:0.2mm solid #888;"></span>
      <span style="position:absolute;bottom:-0.5mm;right:-0.5mm;width:2mm;height:2mm;border-bottom:0.2mm solid #888;border-right:0.2mm solid #888;"></span>` : '';

    const bgColor = p.printer === 'thermal' ? '#ffffff' : '#ffffff';

    return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${bgColor};padding:1mm;position:relative;box-sizing:border-box;">${crops}${innerHtml}</div>`;
  }

  /* ════════════════════════════════════════════════════
     KEYBOARD SHORTCUTS
  ════════════════════════════════════════════════════ */
  barcodeInput.addEventListener('keydown', e => { if (e.key === 'Enter') generateBarcode(); });
  qrInput.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) generateQR(); });

  /* ════════════════════════════════════════════════════
     EVENT BINDINGS
  ════════════════════════════════════════════════════ */
  generateBtn.addEventListener('click', generateBarcode);
  generateQrBtn.addEventListener('click', generateQR);
  generateBatchBtn.addEventListener('click', generateBatch);
  downloadPng.addEventListener('click', () => {});  // already bound above
  // (downloadPng / downloadSvg are bound in their own blocks)

  /* ════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════ */
  function shake(el) {
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), {once:true});
  }
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════ */
  initTheme();
  renderHistory();

})();
