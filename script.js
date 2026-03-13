/* ══════════════════════════════════════════════
   Barcode Generator — script.js
   ══════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── State ───────────────────────────────────── */
  const S = {
    type:    'barcode',
    ready:   false,
    logoUrl: null,
    history: [],
    bcSvgEl: null,   // generated barcode SVG element
    qrCanvas:null,   // generated QR canvas
    batchItems:[],   // [{code, svgEl, ok}]
  };

  /* ── DOM ─────────────────────────────────────── */
  const $  = id => document.getElementById(id);

  const themeToggle   = $('themeToggle');
  const tabs          = document.querySelectorAll('.tab');
  const tabPanes      = document.querySelectorAll('.tab-pane');

  // Barcode inputs
  const barcodeInput  = $('barcodeInput');
  const formatSelect  = $('formatSelect');
  const labelName     = $('labelName');
  const labelPrice    = $('labelPrice');
  const labelDate     = $('labelDate');
  const labelNote     = $('labelNote');
  const logoUpload    = $('logoUpload');
  const logoRow       = $('logoRow');
  const logoImg       = $('logoImg');
  const removeLogo    = $('removeLogo');
  const barWidth      = $('barWidth');
  const barHeight     = $('barHeight');
  const widthVal      = $('widthVal');
  const heightVal     = $('heightVal');
  const generateBtn   = $('generateBtn');

  // QR inputs
  const qrInput       = $('qrInput');
  const qrSize        = $('qrSize');
  const qrError       = $('qrError');
  const generateQrBtn = $('generateQrBtn');

  // Batch inputs
  const batchInput    = $('batchInput');
  const batchFormat   = $('batchFormat');
  const batchCols     = $('batchCols');
  const generateBatchBtn = $('generateBatchBtn');

  // Preview / output
  const actionBtns    = $('actionBtns');
  const emptyState    = $('emptyState');
  const sticker       = $('sticker');
  const stickerName   = $('stickerName');
  const stickerLogo   = $('stickerLogo');
  const bcHolder      = $('bcHolder');
  const bcSvg         = $('bcSvg');
  const qrHolder      = $('qrHolder');
  const stickerCode   = $('stickerCode');
  const stickerMeta   = $('stickerMeta');
  const batchGrid     = $('batchGrid');
  const sizeStrip     = $('sizeStrip');

  // PDF size inputs
  const pdfW          = $('pdfW');
  const pdfH          = $('pdfH');
  const pdfUnit       = $('pdfUnit');
  const pdfPerPage    = $('pdfPerPage');
  const unitLabel     = $('unitLabel');

  // Buttons
  const btnPng        = $('btnPng');
  const btnSvg        = $('btnSvgBtn') || $('btnSvg');
  const btnPdf        = $('btnPdf');

  // History
  const histList      = $('histList');
  const clearHistory  = $('clearHistory');

  // Toast
  const toast         = $('toast');
  const toastMsg      = $('toastMsg');
  const toastSpin     = $('toastSpin');

  /* ── Theme ───────────────────────────────────── */
  (function(){
    document.documentElement.setAttribute('data-theme', localStorage.getItem('bcs-theme') || 'light');
  })();
  themeToggle.addEventListener('click', () => {
    const n = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', n);
    localStorage.setItem('bcs-theme', n);
  });

  /* ── Tabs ────────────────────────────────────── */
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    tabPanes.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    S.type = t.dataset.tab;
    $('tab-' + t.dataset.tab).classList.add('active');
  }));

  /* ── Sliders ─────────────────────────────────── */
  barWidth.addEventListener('input',  () => widthVal.textContent  = barWidth.value);
  barHeight.addEventListener('input', () => heightVal.textContent = barHeight.value);

  /* ── PDF unit label sync ─────────────────────── */
  pdfUnit.addEventListener('change', () => {
    document.querySelectorAll('.unit').forEach(u => u.textContent = pdfUnit.value);
    unitLabel && (unitLabel.textContent = pdfUnit.value);
  });

  /* ── Format detection ────────────────────────── */
  function detect(v) {
    v = v.replace(/\s/g,'');
    if (/^\d{13}$/.test(v)) return 'EAN13';
    if (/^\d{8}$/.test(v))  return 'EAN8';
    if (/^\d{12}$/.test(v)) return 'UPC';
    return 'CODE128';
  }
  function fmt(v, sel) { return sel.value === 'auto' ? detect(v) : sel.value; }

  /* ════════════════════════════════════════════
     GENERATE — BARCODE
  ════════════════════════════════════════════ */
  function generateBarcode() {
    const raw = barcodeInput.value.trim();
    if (!raw) { shake(barcodeInput); return; }
    try {
      // Build SVG
      const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      JsBarcode(svg, raw, {
        format: fmt(raw, formatSelect),
        lineColor:'#000000', width: parseFloat(barWidth.value),
        height: parseInt(barHeight.value), displayValue:false,
        margin:10, background:'#ffffff',
      });
      S.bcSvgEl = svg; S.qrCanvas = null; S.batchItems = [];

      // Populate visible sticker
      bcHolder.innerHTML = ''; bcHolder.appendChild(svg.cloneNode(true));
      qrHolder.style.display = 'none'; bcHolder.style.display = 'block';

      const name = labelName.value.trim();
      stickerName.textContent = name; stickerName.style.display = name ? 'block' : 'none';
      stickerCode.textContent = raw;

      // Logo
      if (S.logoUrl) {
        stickerLogo.src = S.logoUrl; stickerLogo.style.display = 'block';
      } else { stickerLogo.style.display = 'none'; }

      // Meta
      const price = labelPrice.value.trim(), date = labelDate.value, note = labelNote.value.trim();
      stickerMeta.innerHTML = [price, date ? '📅 '+date : '', note]
        .filter(Boolean).map(t=>`<span>${esc(t)}</span>`).join('');

      showResult('barcode'); addHist(raw, 'barcode');
      S.type = 'barcode';
    } catch(e) { showErr(e.message); }
  }

  /* ════════════════════════════════════════════
     GENERATE — QR
  ════════════════════════════════════════════ */
  function generateQR() {
    const raw = qrInput.value.trim();
    if (!raw) { shake(qrInput); return; }
    const tmp = document.createElement('div');
    tmp.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    document.body.appendChild(tmp);
    try {
      new QRCode(tmp, {
        text: raw, width: parseInt(qrSize.value), height: parseInt(qrSize.value),
        colorDark:'#000000', colorLight:'#ffffff',
        correctLevel: QRCode.CorrectLevel[qrError.value],
      });
      setTimeout(() => {
        const c = tmp.querySelector('canvas');
        if (c) {
          const copy = document.createElement('canvas');
          copy.width = c.width; copy.height = c.height;
          copy.getContext('2d').drawImage(c, 0, 0);
          S.qrCanvas = copy;
        }
        document.body.removeChild(tmp);
        S.bcSvgEl = null; S.batchItems = [];

        qrHolder.innerHTML = '';
        if (S.qrCanvas) qrHolder.appendChild(S.qrCanvas.cloneNode(true));
        qrHolder.style.display = 'block'; bcHolder.style.display = 'none';
        stickerName.style.display = 'none'; stickerLogo.style.display = 'none';
        stickerCode.textContent = raw.length > 40 ? raw.slice(0,40)+'…' : raw;
        stickerMeta.innerHTML = '';

        showResult('qr'); addHist(raw, 'qr');
        S.type = 'qr';
      }, 60);
    } catch(e) { document.body.removeChild(tmp); showErr(e.message); }
  }

  /* ════════════════════════════════════════════
     GENERATE — BATCH
  ════════════════════════════════════════════ */
  function generateBatch() {
    const lines = batchInput.value.split('\n').map(l=>l.trim()).filter(Boolean);
    if (!lines.length) { shake(batchInput); return; }

    S.batchItems = [];
    lines.forEach(code => {
      try {
        const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        JsBarcode(svg, code, { format: fmt(code, batchFormat), lineColor:'#000', width:1.8, height:60, displayValue:false, margin:6, background:'#fff' });
        S.batchItems.push({ code, svgEl: svg, ok: true });
      } catch { S.batchItems.push({ code, svgEl: null, ok: false }); }
    });

    S.bcSvgEl = null; S.qrCanvas = null;

    const cols = parseInt(batchCols.value);
    batchGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    batchGrid.innerHTML = '';
    S.batchItems.forEach(item => {
      const div = document.createElement('div'); div.className = 'batch-item';
      if (item.ok) {
        div.appendChild(item.svgEl.cloneNode(true));
        const p = document.createElement('p'); p.className = 'batch-code'; p.textContent = item.code;
        div.appendChild(p);
      } else {
        const e = document.createElement('div'); e.className = 'batch-err'; e.textContent = '✕ '+item.code+' — invalid';
        div.appendChild(e);
      }
      batchGrid.appendChild(div);
    });

    showResult('batch'); addHist(lines.length+' codes', 'batch');
    S.type = 'batch';
  }

  /* ── Show/hide result ────────────────────────── */
  function showResult(type) {
    emptyState.style.display = 'none';
    sticker.style.display    = type === 'batch' ? 'none' : 'flex';
    batchGrid.style.display  = type === 'batch' ? 'grid' : 'none';
    actionBtns.style.display = 'flex';
    sizeStrip.style.display  = 'flex';
    S.ready = true;
  }

  /* ── Error ───────────────────────────────────── */
  function showErr(msg) {
    emptyState.style.display = 'flex';
    sticker.style.display = batchGrid.style.display = 'none';
    emptyState.innerHTML = `<div class="err-msg">✕ ${esc(msg)}</div><p style="font-family:var(--mono);font-size:11px;color:var(--muted);margin-top:6px">Try a different value or format</p>`;
    setTimeout(() => {
      emptyState.innerHTML = `<div class="empty-bars"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div><p>Your barcode will appear here</p>`;
    }, 3000);
  }

  /* ════════════════════════════════════════════
     LOGO
  ════════════════════════════════════════════ */
  logoUpload.addEventListener('change', () => {
    const f = logoUpload.files[0]; if (!f) return;
    new FileReader().onload = e => {
      S.logoUrl = e.target.result;
      logoImg.src = S.logoUrl; logoRow.style.display = 'flex';
      if (S.ready && S.type === 'barcode') {
        stickerLogo.src = S.logoUrl; stickerLogo.style.display = 'block';
      }
    };
    const r = new FileReader(); r.onload = e => {
      S.logoUrl = e.target.result;
      logoImg.src = S.logoUrl; logoRow.style.display = 'flex';
      if (S.ready && S.type === 'barcode') { stickerLogo.src = S.logoUrl; stickerLogo.style.display = 'block'; }
    }; r.readAsDataURL(f);
  });
  removeLogo.addEventListener('click', () => {
    S.logoUrl = null; logoUpload.value = ''; logoRow.style.display = 'none';
    stickerLogo.style.display = 'none';
  });

  /* ════════════════════════════════════════════
     DOWNLOAD PNG
  ════════════════════════════════════════════ */
  btnPng.addEventListener('click', () => {
    if (!S.ready) return;
    if (S.type === 'qr' && S.qrCanvas) { dlLink(S.qrCanvas.toDataURL('image/png'), 'qrcode.png'); return; }
    const svg = S.type === 'barcode' ? S.bcSvgEl : (S.batchItems[0]?.svgEl || null);
    if (svg) svgToPng(svg, url => dlLink(url, 'barcode.png'));
  });

  /* ════════════════════════════════════════════
     DOWNLOAD SVG
  ════════════════════════════════════════════ */
  $('btnSvg').addEventListener('click', () => {
    if (!S.ready) return;
    if (S.type === 'qr' && S.qrCanvas) {
      const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${S.qrCanvas.width}" height="${S.qrCanvas.height}"><image href="${S.qrCanvas.toDataURL()}" width="${S.qrCanvas.width}" height="${S.qrCanvas.height}"/></svg>`;
      dlText(s, 'qrcode.svg', 'image/svg+xml'); return;
    }
    const svg = S.type === 'barcode' ? S.bcSvgEl : (S.batchItems[0]?.svgEl || null);
    if (svg) dlText(new XMLSerializer().serializeToString(svg), 'barcode.svg', 'image/svg+xml');
  });

  /* ════════════════════════════════════════════
     DOWNLOAD PDF  ★ Core Feature ★
  ════════════════════════════════════════════ */
  btnPdf.addEventListener('click', downloadPDF);

  async function downloadPDF() {
    if (!S.ready) return;
    if (!window.jspdf) { showToast('PDF library loading, please try again…', false); return; }

    showToast('Generating PDF…', true);

    try {
      const { jsPDF } = window.jspdf;

      // Read size inputs — convert everything to mm
      let w = parseFloat(pdfW.value) || 80;
      let h = parseFloat(pdfH.value) || 50;
      const unit = pdfUnit.value;
      if (unit === 'in') { w *= 25.4; h *= 25.4; }
      else if (unit === 'cm') { w *= 10; h *= 10; }

      const perPage = parseInt(pdfPerPage.value) || 1;
      const count   = S.type === 'batch' ? S.batchItems.length : perPage;
      const cols    = count === 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
      const rows    = Math.ceil(count / cols);
      const margin  = 3; // mm
      const cellW   = (w - margin * 2) / cols;
      const cellH   = (h - margin * 2) / rows;

      const pdf = new jsPDF({
        orientation: w >= h ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [w, h],
      });

      for (let i = 0; i < count; i++) {
        const col  = i % cols;
        const row  = Math.floor(i / cols);
        const xOff = margin + col * cellW;
        const yOff = margin + row * cellH;
        await addCellToPDF(pdf, xOff, yOff, cellW, cellH, i);
      }

      const stamp = new Date().toISOString().slice(0,10).replace(/-/g,'');
      const wRnd  = Math.round(parseFloat(pdfW.value) || 80);
      const hRnd  = Math.round(parseFloat(pdfH.value) || 50);
      pdf.save(`barcode_${stamp}_${wRnd}x${hRnd}${unit}.pdf`);
      showToast('PDF saved ✓', false);

    } catch(e) {
      console.error(e);
      showToast('Error: ' + e.message, false);
    }
  }

  async function addCellToPDF(pdf, x, y, cw, ch, idx) {
    let curY = y + 2;
    const cx = x + cw / 2;

    // Logo
    if (S.logoUrl && S.type === 'barcode') {
      const lw = Math.min(18, cw * 0.45);
      try {
        const ext = S.logoUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        pdf.addImage(S.logoUrl, ext, cx - lw/2, curY, lw, lw * 0.5);
        curY += lw * 0.5 + 1;
      } catch(_) {}
    }

    // Product name
    if (S.type === 'barcode' && labelName.value.trim()) {
      pdf.setFont('helvetica','bold').setFontSize(8).setTextColor(0,0,0);
      pdf.text(labelName.value.trim(), cx, curY + 3, { align:'center', maxWidth: cw - 2 });
      curY += 5;
    }

    // Image (barcode SVG → PNG, QR canvas, batch SVG)
    let imgData = null, iw = 0, ih = 0;

    if (S.type === 'barcode' && S.bcSvgEl) {
      imgData = await svgToDataUrl(S.bcSvgEl);
      iw = Math.min(cw * 0.92, cw - 2); ih = iw * 0.42;
    } else if (S.type === 'qr' && S.qrCanvas) {
      imgData = S.qrCanvas.toDataURL('image/png');
      const sz = Math.min(cw * 0.78, ch * 0.65); iw = sz; ih = sz;
    } else if (S.type === 'batch' && S.batchItems[idx]?.ok) {
      imgData = await svgToDataUrl(S.batchItems[idx].svgEl);
      iw = Math.min(cw * 0.9, cw - 2); ih = iw * 0.42;
    }

    if (imgData) {
      pdf.addImage(imgData, 'PNG', cx - iw/2, curY, iw, ih);
      curY += ih + 1;
    }

    // Code text
    let code = '';
    if (S.type === 'barcode')     code = barcodeInput.value.trim();
    else if (S.type === 'qr')     code = qrInput.value.trim().slice(0, 42);
    else if (S.batchItems[idx])   code = S.batchItems[idx].code;

    if (code) {
      pdf.setFont('courier','normal').setFontSize(7).setTextColor(40,40,40);
      pdf.text(code, cx, curY + 2.5, { align:'center', maxWidth: cw - 2 });
      curY += 4.5;
    }

    // Meta (barcode only)
    if (S.type === 'barcode') {
      const meta = [labelPrice.value.trim(), labelDate.value, labelNote.value.trim()].filter(Boolean);
      if (meta.length) {
        pdf.setFont('courier','normal').setFontSize(6).setTextColor(90,90,90);
        pdf.text(meta.join('  ·  '), cx, curY + 1.5, { align:'center', maxWidth: cw - 2 });
      }
    }
  }

  /* ════════════════════════════════════════════
     HISTORY
  ════════════════════════════════════════════ */
  function addHist(code, type) {
    S.history.unshift({code, type});
    if (S.history.length > 30) S.history.pop();
    renderHist();
  }
  function renderHist() {
    if (!S.history.length) { histList.innerHTML = '<p class="hist-empty">Nothing yet</p>'; return; }
    histList.innerHTML = S.history.map((it, i) =>
      `<div class="hist-item" data-i="${i}">
        <span class="hist-dot d-${it.type}"></span>
        <span class="hist-code">${esc(it.code)}</span>
        <span class="hist-type">${it.type.toUpperCase()}</span>
      </div>`
    ).join('');
    histList.querySelectorAll('.hist-item').forEach(el =>
      el.addEventListener('click', () => {
        const it = S.history[+el.dataset.i];
        if (it.type === 'barcode') {
          barcodeInput.value = it.code;
          document.querySelector('.tab[data-tab="barcode"]').click();
          setTimeout(generateBarcode, 40);
        } else if (it.type === 'qr') {
          qrInput.value = it.code;
          document.querySelector('.tab[data-tab="qr"]').click();
          setTimeout(generateQR, 40);
        }
      })
    );
  }
  clearHistory.addEventListener('click', () => { S.history = []; renderHist(); });

  /* ════════════════════════════════════════════
     TOAST
  ════════════════════════════════════════════ */
  let toastTimer;
  function showToast(msg, spin) {
    toastMsg.textContent = msg;
    toastSpin.style.display = spin ? 'block' : 'none';
    toast.style.display = 'flex';
    clearTimeout(toastTimer);
    if (!spin) toastTimer = setTimeout(() => toast.style.display = 'none', 2600);
  }

  /* ════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════ */
  function svgToDataUrl(svgEl) {
    return new Promise(resolve => {
      const xml  = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([xml], {type:'image/svg+xml'});
      const url  = URL.createObjectURL(blob);
      const img  = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width || 400; c.height = img.height || 200;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0,0,c.width,c.height);
        ctx.drawImage(img,0,0); URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/png'));
      };
      img.src = url;
    });
  }
  function svgToPng(svgEl, cb) {
    svgToDataUrl(svgEl).then(cb);
  }
  function dlLink(url, name) { const a = document.createElement('a'); a.href=url; a.download=name; a.click(); }
  function dlText(c, name, type) {
    const url = URL.createObjectURL(new Blob([c],{type}));
    dlLink(url, name); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); el.addEventListener('animationend', () => el.classList.remove('shake'), {once:true}); }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ════════════════════════════════════════════
     KEY BINDINGS + INIT
  ════════════════════════════════════════════ */
  barcodeInput.addEventListener('keydown', e => { if (e.key==='Enter') generateBarcode(); });
  qrInput.addEventListener('keydown', e => { if (e.key==='Enter' && e.ctrlKey) generateQR(); });
  generateBtn.addEventListener('click', generateBarcode);
  generateQrBtn.addEventListener('click', generateQR);
  generateBatchBtn.addEventListener('click', generateBatch);

  renderHist();

})();
