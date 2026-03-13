/* ══════════════════════════════════════════════════════
   BarcodeStudio — script.js
   ══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── State ──────────────────────────────────────────── */
  const state = {
    currentType: 'barcode',   // 'barcode' | 'qr' | 'batch'
    history: [],
    activeTab: 'barcode',
  };

  /* ── DOM ────────────────────────────────────────────── */
  const $ = id => document.getElementById(id);

  const themeToggle    = $('themeToggle');
  const tabs           = document.querySelectorAll('.tab');
  const tabContents    = document.querySelectorAll('.tab-content');

  // Barcode tab
  const barcodeInput   = $('barcodeInput');
  const formatSelect   = $('formatSelect');
  const labelName      = $('labelName');
  const labelPrice     = $('labelPrice');
  const labelDate      = $('labelDate');
  const labelNote      = $('labelNote');
  const barWidth       = $('barWidth');
  const barHeight      = $('barHeight');
  const widthVal       = $('widthVal');
  const heightVal      = $('heightVal');
  const generateBtn    = $('generateBtn');

  // QR tab
  const qrInput        = $('qrInput');
  const qrSize         = $('qrSize');
  const qrError        = $('qrError');
  const generateQrBtn  = $('generateQrBtn');

  // Batch tab
  const batchInput     = $('batchInput');
  const batchFormat    = $('batchFormat');
  const batchCols      = $('batchCols');
  const generateBatchBtn = $('generateBatchBtn');

  // Preview / right panel
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

  // Actions
  const downloadPng    = $('downloadPng');
  const downloadSvg    = $('downloadSvg');
  const printBtn       = $('printBtn');
  const clearHistory   = $('clearHistory');
  const historyList    = $('historyList');
  const printFrame     = $('printFrame');

  /* ── Theme ──────────────────────────────────────────── */
  function initTheme() {
    const saved = localStorage.getItem('bcs-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }

  themeToggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('bcs-theme', next);
  });

  /* ── Tabs ───────────────────────────────────────────── */
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      state.activeTab = tab.dataset.tab;
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  /* ── Range sliders ──────────────────────────────────── */
  barWidth.addEventListener('input', () => { widthVal.textContent = barWidth.value; });
  barHeight.addEventListener('input', () => { heightVal.textContent = barHeight.value; });

  /* ── Format detection ───────────────────────────────── */
  function detectFormat(value) {
    const v = value.replace(/\s/g, '');
    if (/^\d{13}$/.test(v)) return 'EAN13';
    if (/^\d{8}$/.test(v))  return 'EAN8';
    if (/^\d{12}$/.test(v)) return 'UPC';
    return 'CODE128';
  }

  function getFormat(value, selectEl) {
    const chosen = selectEl.value;
    return chosen === 'auto' ? detectFormat(value) : chosen;
  }

  /* ── Generate Barcode ───────────────────────────────── */
  function generateBarcode() {
    const raw = barcodeInput.value.trim();
    if (!raw) { shake(barcodeInput); barcodeInput.focus(); return; }

    try {
      // Reset QR, show barcode svg
      qrHolder.style.display    = 'none';
      barcodeHolder.style.display = 'block';

      JsBarcode(barcodeSvg, raw, {
        format:       getFormat(raw, formatSelect),
        lineColor:    '#000000',
        width:        parseFloat(barWidth.value),
        height:       parseInt(barHeight.value),
        displayValue: false,
        margin:       10,
        background:   '#ffffff',
      });

      // Custom label
      const name  = labelName.value.trim();
      const price = labelPrice.value.trim();
      const date  = labelDate.value;
      const note  = labelNote.value.trim();

      stickerName.textContent = name;
      stickerName.style.display = name ? 'block' : 'none';
      stickerCode.textContent = raw;

      metaPrice.textContent = price;
      metaDate.textContent  = date  ? '📅 ' + date  : '';
      metaNote.textContent  = note  ? note : '';

      const hasMeta = price || date || note;
      stickerMeta.style.display = hasMeta ? 'flex' : 'none';

      showSticker('barcode');
      addHistory(raw, 'barcode');
      state.currentType = 'barcode';

    } catch (err) {
      showError(err.message || 'Invalid barcode value.');
    }
  }

  /* ── Generate QR ────────────────────────────────────── */
  function generateQR() {
    const raw = qrInput.value.trim();
    if (!raw) { shake(qrInput); qrInput.focus(); return; }

    try {
      // Clear old QR
      qrHolder.innerHTML = '';
      qrHolder.style.display    = 'block';
      barcodeHolder.style.display = 'none';

      const size = parseInt(qrSize.value);
      const errLevel = qrError.value;

      new QRCode(qrHolder, {
        text: raw,
        width: size,
        height: size,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel[errLevel],
      });

      stickerName.style.display = 'none';
      stickerCode.textContent = raw.length > 40 ? raw.slice(0, 40) + '…' : raw;
      stickerMeta.style.display = 'none';

      showSticker('qr');
      addHistory(raw, 'qr');
      state.currentType = 'qr';

    } catch (err) {
      showError('Failed to generate QR: ' + (err.message || 'unknown error'));
    }
  }

  /* ── Generate Batch ─────────────────────────────────── */
  function generateBatch() {
    const lines = batchInput.value
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    if (!lines.length) { shake(batchInput); batchInput.focus(); return; }

    const cols = parseInt(batchCols.value);
    batchOutput.innerHTML = '';
    batchOutput.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    lines.forEach(code => {
      const item = document.createElement('div');
      item.className = 'batch-item';

      try {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        JsBarcode(svg, code, {
          format:       getFormat(code, batchFormat),
          lineColor:    '#000000',
          width:        1.8,
          height:       60,
          displayValue: false,
          margin:       6,
          background:   '#ffffff',
        });
        const codeEl = document.createElement('p');
        codeEl.className = 'batch-item-code';
        codeEl.textContent = code;
        item.appendChild(svg);
        item.appendChild(codeEl);
      } catch {
        const err = document.createElement('div');
        err.className = 'batch-item-error';
        err.textContent = '✕ ' + code + ' — invalid';
        item.appendChild(err);
      }

      batchOutput.appendChild(item);
    });

    // Show batch output, hide single sticker
    stickerArea.style.display  = 'none';
    batchOutput.style.display  = 'grid';
    previewEmpty.style.display = 'none';
    previewActions.style.display = 'flex';
    state.currentType = 'batch';

    addHistory(lines.length + ' codes', 'batch');
  }

  /* ── Show / hide sticker ────────────────────────────── */
  function showSticker(type) {
    batchOutput.style.display  = 'none';
    previewEmpty.style.display = 'none';
    stickerArea.style.display  = 'flex';
    previewActions.style.display = 'flex';
    // Force re-animation
    stickerArea.style.animation = 'none';
    void stickerArea.offsetWidth;
    stickerArea.style.animation = '';
  }

  /* ── Error display ──────────────────────────────────── */
  function showError(msg) {
    stickerArea.style.display  = 'none';
    batchOutput.style.display  = 'none';
    previewActions.style.display = 'none';
    previewEmpty.style.display = 'flex';
    previewEmpty.innerHTML = `
      <div class="error-msg">✕ ${msg}</div>
      <p style="font-family:var(--mono);font-size:11px;color:var(--muted);margin-top:4px;">Try a different value or format</p>
    `;
    setTimeout(() => {
      previewEmpty.innerHTML = `
        <div class="empty-bars"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
        <p>Nothing generated yet</p>
      `;
    }, 3000);
  }

  /* ── History ─────────────────────────────────────────── */
  function addHistory(code, type) {
    state.history.unshift({ code, type, ts: Date.now() });
    if (state.history.length > 30) state.history.pop();
    renderHistory();
  }

  function renderHistory() {
    if (!state.history.length) {
      historyList.innerHTML = '<p class="history-empty">Generated codes will appear here</p>';
      return;
    }
    historyList.innerHTML = state.history.map((item, i) => `
      <div class="history-item" data-index="${i}">
        <span class="history-dot dot-${item.type}"></span>
        <span class="history-code">${escapeHtml(item.code)}</span>
        <span class="history-type">${item.type.toUpperCase()}</span>
      </div>
    `).join('');

    historyList.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index);
        recallHistory(state.history[idx]);
      });
    });
  }

  function recallHistory(item) {
    // Switch to correct tab
    const tabBtn = document.querySelector(`.tab[data-tab="${item.type === 'batch' ? 'batch' : item.type === 'qr' ? 'qr' : 'barcode'}"]`);
    if (tabBtn) tabBtn.click();

    if (item.type === 'barcode') {
      barcodeInput.value = item.code;
      generateBarcode();
    } else if (item.type === 'qr') {
      qrInput.value = item.code;
      generateQR();
    }
  }

  clearHistory.addEventListener('click', () => {
    state.history = [];
    renderHistory();
  });

  /* ── Download PNG ────────────────────────────────────── */
  downloadPng.addEventListener('click', () => {
    if (state.currentType === 'qr') {
      const canvas = qrHolder.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
      return;
    }

    // Barcode or batch → render to canvas via SVG
    const svgEl = state.currentType === 'batch'
      ? batchOutput.querySelector('svg')
      : barcodeSvg;

    if (!svgEl) return;
    svgToCanvas(svgEl, canvas => {
      const link = document.createElement('a');
      link.download = 'barcode.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  });

  function svgToCanvas(svgEl, callback) {
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url     = URL.createObjectURL(svgBlob);
    const img     = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width  || 400;
      canvas.height = img.height || 200;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      callback(canvas);
    };
    img.src = url;
  }

  /* ── Download SVG ────────────────────────────────────── */
  downloadSvg.addEventListener('click', () => {
    const svgEl = state.currentType === 'batch'
      ? batchOutput.querySelector('svg')
      : (state.currentType === 'barcode' ? barcodeSvg : null);

    if (!svgEl) {
      // QR: convert canvas to SVG-wrapped PNG
      const canvas = qrHolder.querySelector('canvas');
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      const w = canvas.width, h = canvas.height;
      const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><image href="${dataUrl}" width="${w}" height="${h}"/></svg>`;
      downloadText(svgStr, 'qrcode.svg', 'image/svg+xml');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgEl);
    downloadText(svgData, 'barcode.svg', 'image/svg+xml');
  });

  function downloadText(content, filename, type) {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ── Print ───────────────────────────────────────────── */
  printBtn.addEventListener('click', () => {
    printFrame.innerHTML = '';

    if (state.currentType === 'batch') {
      // Build print batch
      const wrapper = document.createElement('div');
      wrapper.className = 'print-batch';
      wrapper.style.gridTemplateColumns = `repeat(${batchCols.value}, 1fr)`;

      batchOutput.querySelectorAll('.batch-item').forEach(item => {
        const svgEl = item.querySelector('svg');
        const code  = item.querySelector('.batch-item-code');
        if (!svgEl) return;
        const cell = document.createElement('div');
        cell.className = 'print-batch-item';
        cell.appendChild(svgEl.cloneNode(true));
        if (code) {
          const p = document.createElement('p');
          p.className = 'print-code';
          p.textContent = code.textContent;
          cell.appendChild(p);
        }
        wrapper.appendChild(cell);
      });
      printFrame.appendChild(wrapper);

    } else if (state.currentType === 'qr') {
      const canvas = qrHolder.querySelector('canvas');
      if (!canvas) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'print-sticker';
      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/png');
      img.style.maxWidth = '200px';
      const p = document.createElement('p');
      p.className = 'print-code';
      p.textContent = stickerCode.textContent;
      wrapper.appendChild(img);
      wrapper.appendChild(p);
      printFrame.appendChild(wrapper);

    } else {
      // Single barcode
      const wrapper = document.createElement('div');
      wrapper.className = 'print-sticker';

      if (stickerName.textContent) {
        const nm = document.createElement('p');
        nm.className = 'print-name';
        nm.textContent = stickerName.textContent;
        wrapper.appendChild(nm);
      }

      wrapper.appendChild(barcodeSvg.cloneNode(true));

      const p = document.createElement('p');
      p.className = 'print-code';
      p.textContent = stickerCode.textContent;
      wrapper.appendChild(p);

      const metaTexts = [metaPrice.textContent, metaDate.textContent, metaNote.textContent].filter(Boolean);
      if (metaTexts.length) {
        const meta = document.createElement('div');
        meta.className = 'print-meta';
        metaTexts.forEach(t => {
          const s = document.createElement('span');
          s.textContent = t;
          meta.appendChild(s);
        });
        wrapper.appendChild(meta);
      }

      printFrame.appendChild(wrapper);
    }

    window.print();
  });

  /* ── Keyboard shortcuts ──────────────────────────────── */
  barcodeInput.addEventListener('keydown', e => { if (e.key === 'Enter') generateBarcode(); });
  qrInput.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) generateQR(); });

  /* ── Event bindings ──────────────────────────────────── */
  generateBtn.addEventListener('click', generateBarcode);
  generateQrBtn.addEventListener('click', generateQR);
  generateBatchBtn.addEventListener('click', generateBatch);

  /* ── Helpers ─────────────────────────────────────────── */
  function shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ── Init ────────────────────────────────────────────── */
  initTheme();
  renderHistory();

})();
