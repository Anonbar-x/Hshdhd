/* ══════════════════════════════════════════════
   Barcode Generator — script.js  v4
   Zebra ZD230t optimised
   Default: 101.6 × 50.8 mm (4" × 2")
   ══════════════════════════════════════════════ */
(function () {
  'use strict';

  const S = {
    type: 'barcode', ready: false, logoUrl: null,
    history: [], bcSvgEl: null, qrCanvas: null, batchItems: [],
  };

  const $ = id => document.getElementById(id);

  const themeToggle      = $('themeToggle');
  const tabs             = document.querySelectorAll('.tab');
  const tabPanes         = document.querySelectorAll('.tab-pane');
  const barcodeInput     = $('barcodeInput');
  const formatSelect     = $('formatSelect');
  const labelName        = $('labelName');
  const labelPrice       = $('labelPrice');
  const labelDate        = $('labelDate');
  const labelNote        = $('labelNote');
  const logoUpload       = $('logoUpload');
  const logoRow          = $('logoRow');
  const logoImg          = $('logoImg');
  const removeLogo       = $('removeLogo');
  const barWidth         = $('barWidth');
  const barHeight        = $('barHeight');
  const widthVal         = $('widthVal');
  const heightVal        = $('heightVal');
  const generateBtn      = $('generateBtn');
  const qrInput          = $('qrInput');
  const qrSize           = $('qrSize');
  const qrError          = $('qrError');
  const generateQrBtn    = $('generateQrBtn');
  const batchInput       = $('batchInput');
  const batchFormat      = $('batchFormat');
  const batchCols        = $('batchCols');
  const generateBatchBtn = $('generateBatchBtn');
  const actionBtns       = $('actionBtns');
  const emptyState       = $('emptyState');
  const sticker          = $('sticker');
  const stickerName      = $('stickerName');
  const stickerLogo      = $('stickerLogo');
  const bcHolder         = $('bcHolder');
  const qrHolder         = $('qrHolder');
  const stickerCode      = $('stickerCode');
  const stickerMeta      = $('stickerMeta');
  const batchGrid        = $('batchGrid');
  const sizeStrip        = $('sizeStrip');
  const pdfW             = $('pdfW');
  const pdfH             = $('pdfH');
  const pdfUnit          = $('pdfUnit');
  const pdfPerPage       = $('pdfPerPage');
  const btnPng           = $('btnPng');
  const btnPdf           = $('btnPdf');
  const histList         = $('histList');
  const clearHistBtn     = $('clearHistory');
  const toast            = $('toast');
  const toastMsg         = $('toastMsg');
  const toastSpin        = $('toastSpin');

  /* ══ ZEBRA ZD230t DEFAULT ══════════════════════
     4 inch × 2 inch = 101.6 × 50.8 mm
     (most common label for this printer)
  ════════════════════════════════════════════ */
  pdfW.value = '101.6';
  pdfH.value = '50.8';
  pdfUnit.value = 'mm';

  /* ══ THEME ══════════════════════════════════ */
  document.documentElement.setAttribute('data-theme',
    localStorage.getItem('bcs-theme') || 'light');

  themeToggle.addEventListener('click', () => {
    const n = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', n);
    localStorage.setItem('bcs-theme', n);
  });

  /* ══ TABS ═══════════════════════════════════ */
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    tabPanes.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    S.type = t.dataset.tab;
    $('tab-' + t.dataset.tab).classList.add('active');
  }));

  /* ══ SLIDERS ════════════════════════════════ */
  barWidth.addEventListener('input',  () => widthVal.textContent  = barWidth.value);
  barHeight.addEventListener('input', () => heightVal.textContent = barHeight.value);

  /* ══ UNIT SYNC ══════════════════════════════ */
  pdfUnit.addEventListener('change', () =>
    document.querySelectorAll('.unit').forEach(u => u.textContent = pdfUnit.value)
  );

  /* ══ FORMAT DETECT ══════════════════════════ */
  function detect(v) {
    v = v.replace(/\s/g, '');
    if (/^\d{13}$/.test(v)) return 'EAN13';
    if (/^\d{8}$/.test(v))  return 'EAN8';
    if (/^\d{12}$/.test(v)) return 'UPC';
    return 'CODE128';
  }
  function getFmt(v, sel) { return sel.value === 'auto' ? detect(v) : sel.value; }

  /* ══ GENERATE BARCODE ═══════════════════════ */
  function generateBarcode() {
    const raw = barcodeInput.value.trim();
    if (!raw) { shake(barcodeInput); return; }
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(svg, raw, {
        format:       getFmt(raw, formatSelect),
        lineColor:    '#000000',
        width:        parseFloat(barWidth.value),
        height:       parseInt(barHeight.value),
        displayValue: false,
        margin:       6,
        background:   '#ffffff',
      });
      S.bcSvgEl = svg; S.qrCanvas = null; S.batchItems = [];

      bcHolder.innerHTML = '';
      bcHolder.appendChild(svg.cloneNode(true));
      qrHolder.style.display = 'none';
      bcHolder.style.display = 'block';

      const name = labelName.value.trim();
      stickerName.textContent   = name;
      stickerName.style.display = name ? 'block' : 'none';
      stickerCode.textContent   = raw;

      if (S.logoUrl) { stickerLogo.src = S.logoUrl; stickerLogo.style.display = 'block'; }
      else stickerLogo.style.display = 'none';

      stickerMeta.innerHTML = [
        labelPrice.value.trim(),
        labelDate.value  ? '📅 ' + labelDate.value : '',
        labelNote.value.trim(),
      ].filter(Boolean).map(t => `<span>${esc(t)}</span>`).join('');

      showResult('barcode');
      addHist(raw, 'barcode');
      S.type = 'barcode';
    } catch (e) { showErr(e.message); }
  }

  /* ══ GENERATE QR ════════════════════════════ */
  function generateQR() {
    const raw = qrInput.value.trim();
    if (!raw) { shake(qrInput); return; }
    const tmp = document.createElement('div');
    tmp.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    document.body.appendChild(tmp);
    try {
      new QRCode(tmp, {
        text: raw,
        width:  parseInt(qrSize.value),
        height: parseInt(qrSize.value),
        colorDark:    '#000000',
        colorLight:   '#ffffff',
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
        qrHolder.style.display     = 'block';
        bcHolder.style.display     = 'none';
        stickerName.style.display  = 'none';
        stickerLogo.style.display  = 'none';
        stickerCode.textContent    = raw.length > 40 ? raw.slice(0, 40) + '…' : raw;
        stickerMeta.innerHTML      = '';
        showResult('qr');
        addHist(raw, 'qr');
        S.type = 'qr';
      }, 60);
    } catch (e) { document.body.removeChild(tmp); showErr(e.message); }
  }

  /* ══ GENERATE BATCH ═════════════════════════ */
  function generateBatch() {
    const lines = batchInput.value.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) { shake(batchInput); return; }
    S.batchItems = [];
    lines.forEach(code => {
      try {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        JsBarcode(svg, code, {
          format: getFmt(code, batchFormat),
          lineColor: '#000', width: 1.8, height: 60,
          displayValue: false, margin: 6, background: '#fff',
        });
        S.batchItems.push({ code, svgEl: svg, ok: true });
      } catch { S.batchItems.push({ code, svgEl: null, ok: false }); }
    });
    S.bcSvgEl = null; S.qrCanvas = null;
    const cols = parseInt(batchCols.value);
    batchGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    batchGrid.innerHTML = '';
    S.batchItems.forEach(item => {
      const div = document.createElement('div');
      div.className = 'batch-item';
      if (item.ok) {
        div.appendChild(item.svgEl.cloneNode(true));
        const p = document.createElement('p');
        p.className = 'batch-code'; p.textContent = item.code;
        div.appendChild(p);
      } else {
        const e = document.createElement('div');
        e.className = 'batch-err';
        e.textContent = '✕ ' + item.code + ' — invalid';
        div.appendChild(e);
      }
      batchGrid.appendChild(div);
    });
    showResult('batch');
    addHist(lines.length + ' codes', 'batch');
    S.type = 'batch';
  }

  /* ══ SHOW / ERROR ═══════════════════════════ */
  function showResult(type) {
    emptyState.style.display = 'none';
    sticker.style.display    = type === 'batch' ? 'none' : 'flex';
    batchGrid.style.display  = type === 'batch' ? 'grid' : 'none';
    actionBtns.style.display = 'flex';
    sizeStrip.style.display  = 'flex';
    S.ready = true;
  }

  function showErr(msg) {
    emptyState.style.display = 'flex';
    sticker.style.display = batchGrid.style.display = 'none';
    emptyState.innerHTML = `<div class="err-msg">✕ ${esc(msg)}</div>
      <p style="font-family:var(--mono);font-size:11px;color:var(--muted);margin-top:6px">
        Try a different value or format</p>`;
    setTimeout(() => {
      emptyState.innerHTML = `<div class="empty-bars">
        <span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span></div>
        <p>Your barcode will appear here</p>`;
    }, 3000);
  }

  /* ══ LOGO ═══════════════════════════════════ */
  logoUpload.addEventListener('change', () => {
    const f = logoUpload.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = e => {
      S.logoUrl = e.target.result;
      logoImg.src = S.logoUrl; logoRow.style.display = 'flex';
      if (S.ready && S.type === 'barcode') {
        stickerLogo.src = S.logoUrl; stickerLogo.style.display = 'block';
      }
    };
    r.readAsDataURL(f);
  });
  removeLogo.addEventListener('click', () => {
    S.logoUrl = null; logoUpload.value = '';
    logoRow.style.display = stickerLogo.style.display = 'none';
  });

  /* ══ PNG DOWNLOAD ═══════════════════════════ */
  btnPng.addEventListener('click', () => {
    if (!S.ready) return;
    if (S.type === 'qr' && S.qrCanvas) { dlLink(S.qrCanvas.toDataURL('image/png'), 'qrcode.png'); return; }
    const svg = S.type === 'barcode' ? S.bcSvgEl : (S.batchItems[0]?.svgEl || null);
    if (svg) svgToCanvas(svg, 2400, 900).then(c => dlLink(c.toDataURL('image/png'), 'barcode.png'));
  });

  /* ══ SVG DOWNLOAD ═══════════════════════════ */
  $('btnSvg').addEventListener('click', () => {
    if (!S.ready) return;
    if (S.type === 'qr' && S.qrCanvas) {
      const d = S.qrCanvas.toDataURL();
      dlText(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${S.qrCanvas.width}" height="${S.qrCanvas.height}">` +
        `<image href="${d}" width="${S.qrCanvas.width}" height="${S.qrCanvas.height}"/></svg>`,
        'qrcode.svg', 'image/svg+xml'); return;
    }
    const svg = S.type === 'barcode' ? S.bcSvgEl : (S.batchItems[0]?.svgEl || null);
    if (svg) dlText(new XMLSerializer().serializeToString(svg), 'barcode.svg', 'image/svg+xml');
  });

  /* ════════════════════════════════════════════════════════
     PDF DOWNLOAD  ★  ZEBRA ZD230t OPTIMISED
     • 203 DPI thermal printer
     • PDF page = exact label size (101.6 × 50.8 mm default)
     • Barcode fills ~80% of label width, perfectly centred
     • High-res canvas render (1600 px tall) for crisp output
  ════════════════════════════════════════════════════════ */
  btnPdf.addEventListener('click', downloadPDF);

  async function downloadPDF() {
    if (!S.ready) return;
    if (!window.jspdf) { showToast('PDF library loading…', false); return; }
    showToast('Generating PDF…', true);

    try {
      const { jsPDF } = window.jspdf;

      /* ── Paper / label size ─────────────────── */
      let W = parseFloat(pdfW.value) || 101.6;
      let H = parseFloat(pdfH.value) || 50.8;
      const unit = pdfUnit.value;
      if (unit === 'in') { W *= 25.4; H *= 25.4; }
      else if (unit === 'cm') { W *= 10; H *= 10; }

      /* ── Grid ───────────────────────────────── */
      const perPage = parseInt(pdfPerPage.value) || 1;
      const count   = S.type === 'batch' ? S.batchItems.length : perPage;
      const cols    = count === 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
      const rows    = Math.ceil(count / cols);

      /* Small margin so barcode isn't edge-to-edge */
      const MAR   = 2.5;  /* mm */
      const cellW = (W - MAR * 2) / cols;
      const cellH = (H - MAR * 2) / rows;

      const pdf = new jsPDF({
        orientation: W > H ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [W, H],
      });

      for (let i = 0; i < count; i++) {
        const col  = i % cols;
        const row  = Math.floor(i / cols);
        await drawCell(pdf,
          MAR + col * cellW,
          MAR + row * cellH,
          cellW, cellH, i);
      }

      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const wR = +(parseFloat(pdfW.value) || 101.6).toFixed(1);
      const hR = +(parseFloat(pdfH.value) || 50.8).toFixed(1);
      pdf.save(`label_${stamp}_${wR}x${hR}${unit}.pdf`);
      showToast('PDF saved ✓', false);

    } catch (e) {
      console.error(e);
      showToast('Error: ' + e.message, false);
    }
  }

  /* ──────────────────────────────────────────────────────
     drawCell
     Renders one label cell with PERFECT vertical centering.

     Strategy:
       1. Convert SVG → high-res canvas (real pixel ratio)
       2. Compute ALL element heights in mm
       3. total vertical offset = (cellH - sumH) / 2
       4. Draw top-to-bottom starting from that offset
  ────────────────────────────────────────────────────── */
  async function drawCell(pdf, x0, y0, cw, ch, idx) {
    const PAD  = 2;           /* mm inner padding */
    const USEW = cw - PAD * 2;
    const midX = x0 + cw / 2;

    const isBC    = S.type === 'barcode';
    const isQR    = S.type === 'qr';
    const isBatch = S.type === 'batch';

    const hasLogo = !!(S.logoUrl && isBC);
    const hasName = !!(isBC && labelName.value.trim());
    const metaArr = isBC
      ? [labelPrice.value.trim(), labelDate.value, labelNote.value.trim()].filter(Boolean)
      : [];

    let code = '';
    if (isBC)              code = barcodeInput.value.trim();
    else if (isQR)         code = qrInput.value.trim().slice(0, 44);
    else if (S.batchItems[idx]) code = S.batchItems[idx].code;

    /* ── Render image, measure real pixel ratio ── */
    let imgPNG = null, IMG_W = 0, IMG_H = 0;

    if (isBC && S.bcSvgEl) {
      /* Render at 1600px tall for crisp Zebra output */
      const canvas = await svgToCanvas(S.bcSvgEl, 4800, 1600);
      imgPNG = canvas.toDataURL('image/png');
      const ratio = canvas.width / canvas.height;
      IMG_W = USEW;
      IMG_H = parseFloat((IMG_W / ratio).toFixed(4));

      /* If barcode is taller than ~65% of cell, shrink */
      const cap = ch * 0.65 - (hasName ? 5 : 0) - (code ? 4 : 0) - (metaArr.length ? 3 : 0);
      if (IMG_H > cap) { IMG_H = cap; IMG_W = parseFloat((IMG_H * ratio).toFixed(4)); }

    } else if (isQR && S.qrCanvas) {
      imgPNG = S.qrCanvas.toDataURL('image/png');
      const cap = ch - PAD * 2 - (code ? 5 : 0);
      const sz  = Math.min(USEW, cap);
      IMG_W = sz; IMG_H = sz;

    } else if (isBatch && S.batchItems[idx]?.ok) {
      const canvas = await svgToCanvas(S.batchItems[idx].svgEl, 4800, 1600);
      imgPNG = canvas.toDataURL('image/png');
      const ratio = canvas.width / canvas.height;
      IMG_W = USEW;
      IMG_H = parseFloat((IMG_W / ratio).toFixed(4));
      const cap = ch * 0.65 - (code ? 4 : 0);
      if (IMG_H > cap) { IMG_H = cap; IMG_W = parseFloat((IMG_H * ratio).toFixed(4)); }
    }

    /* ── Block heights (mm) ───────────────────── */
    const LOGO_W = hasLogo ? Math.min(16, USEW * 0.35) : 0;
    const LOGO_H = hasLogo ? LOGO_W * 0.5 : 0;
    const LOGO_G = hasLogo ? 1.5 : 0;
    const NAME_H = hasName ? 4 : 0;
    const NAME_G = hasName ? 1.5 : 0;
    const IMG_G  = imgPNG  ? 1.5 : 0;
    const CODE_H = code    ? 3.5 : 0;
    const CODE_G = code    ? 1   : 0;
    const META_H = metaArr.length ? 3 : 0;

    const sumH =
      LOGO_H + LOGO_G +
      NAME_H + NAME_G +
      IMG_H  + IMG_G  +
      CODE_H + CODE_G +
      META_H;

    /* ── Vertically centred start Y ──────────── */
    let y = y0 + (ch - sumH) / 2;
    if (y < y0 + PAD) y = y0 + PAD;   /* clamp top */

    /* ── Draw: Logo ──────────────────────────── */
    if (hasLogo) {
      try {
        const ext = S.logoUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        pdf.addImage(S.logoUrl, ext, midX - LOGO_W / 2, y, LOGO_W, LOGO_H);
      } catch (_) {}
      y += LOGO_H + LOGO_G;
    }

    /* ── Draw: Product name ───────────────────── */
    if (hasName) {
      const fs = clamp(cw * 0.22, 7, 11);
      pdf.setFont('helvetica', 'bold')
         .setFontSize(fs)
         .setTextColor(0, 0, 0);
      pdf.text(labelName.value.trim(), midX, y + NAME_H * 0.78,
        { align: 'center', maxWidth: USEW });
      y += NAME_H + NAME_G;
    }

    /* ── Draw: Barcode / QR — centred ────────── */
    if (imgPNG) {
      pdf.addImage(imgPNG, 'PNG', midX - IMG_W / 2, y, IMG_W, IMG_H);
      y += IMG_H + IMG_G;
    }

    /* ── Draw: Code number ────────────────────── */
    if (code) {
      const fs = clamp(cw * 0.13, 5, 9);
      pdf.setFont('courier', 'normal')
         .setFontSize(fs)
         .setTextColor(20, 20, 20);
      pdf.text(code, midX, y + CODE_H * 0.78,
        { align: 'center', maxWidth: USEW });
      y += CODE_H + CODE_G;
    }

    /* ── Draw: Meta ───────────────────────────── */
    if (metaArr.length) {
      const fs = clamp(cw * 0.10, 4, 7);
      pdf.setFont('courier', 'normal')
         .setFontSize(fs)
         .setTextColor(70, 70, 70);
      pdf.text(metaArr.join('  ·  '), midX, y + META_H * 0.78,
        { align: 'center', maxWidth: USEW });
    }
  }

  /* ══════════════════════════════════════════════
     HISTORY — localStorage persisted
  ═══════════════════════════════════════════════ */
  function loadHist() {
    try { S.history = JSON.parse(localStorage.getItem('bcg-history') || '[]'); }
    catch { S.history = []; }
  }
  function saveHist() {
    try { localStorage.setItem('bcg-history', JSON.stringify(S.history)); } catch {}
  }
  function addHist(code, type) {
    if (S.history[0]?.code === code && S.history[0]?.type === type) return;
    S.history.unshift({ code, type, ts: Date.now() });
    if (S.history.length > 50) S.history.pop();
    saveHist();
    renderHist();
  }
  function renderHist() {
    if (!S.history.length) {
      histList.innerHTML = '<p class="hist-empty">Nothing yet</p>'; return;
    }
    histList.innerHTML = S.history.map((it, i) => `
      <div class="hist-item" data-i="${i}" title="${esc(it.code)}">
        <span class="hist-dot d-${it.type}"></span>
        <span class="hist-code">${esc(it.code)}</span>
        <span class="hist-type">${it.type.toUpperCase()}</span>
      </div>`).join('');
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
  clearHistBtn.addEventListener('click', () => {
    S.history = []; saveHist(); renderHist();
  });

  /* ══ TOAST ══════════════════════════════════ */
  let toastTimer;
  function showToast(msg, spin) {
    toastMsg.textContent = msg;
    toastSpin.style.display = spin ? 'block' : 'none';
    toast.style.display = 'flex';
    clearTimeout(toastTimer);
    if (!spin) toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 2800);
  }

  /* ══ HELPERS ════════════════════════════════ */

  /**
   * Render an SVG element to a canvas at high resolution.
   * Reads actual viewBox / width / height so the barcode
   * pixel ratio is always correct.
   */
  function svgToCanvas(svgEl, targetW, targetH) {
    return new Promise(resolve => {
      const xml = new XMLSerializer().serializeToString(svgEl);

      /* Get natural SVG dimensions */
      const vb   = svgEl.viewBox && svgEl.viewBox.baseVal;
      const natW = (vb && vb.width  > 0 ? vb.width  : null)
                || svgEl.width?.baseVal?.value || 0;
      const natH = (vb && vb.height > 0 ? vb.height : null)
                || svgEl.height?.baseVal?.value || 0;

      /* Canvas size: preserve real ratio, use targetH as ceiling */
      let cH = targetH;
      let cW = natW && natH ? Math.round(cH * natW / natH) : targetW;
      if (cW < 10) cW = targetW;

      const blob = new Blob([xml], { type: 'image/svg+xml' });
      const url  = URL.createObjectURL(blob);
      const img  = new Image();

      img.onload = () => {
        /* Use natural image size if browser reported it correctly */
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          const imgRatio = img.naturalWidth / img.naturalHeight;
          cH = targetH;
          cW = Math.round(cH * imgRatio);
        }
        const c   = document.createElement('canvas');
        c.width   = cW; c.height = cH;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cW, cH);
        ctx.drawImage(img, 0, 0, cW, cH);
        URL.revokeObjectURL(url);
        resolve(c);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        const c = document.createElement('canvas');
        c.width = targetW; c.height = targetH; resolve(c);
      };
      img.src = url;
    });
  }

  function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

  function dlLink(url, name) {
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  }
  function dlText(content, name, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    dlLink(url, name);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function shake(el) {
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ══ BINDINGS + INIT ════════════════════════ */
  barcodeInput.addEventListener('keydown', e => { if (e.key === 'Enter') generateBarcode(); });
  qrInput.addEventListener('keydown',      e => { if (e.key === 'Enter' && e.ctrlKey) generateQR(); });
  generateBtn.addEventListener('click',      generateBarcode);
  generateQrBtn.addEventListener('click',    generateQR);
  generateBatchBtn.addEventListener('click', generateBatch);

  loadHist();
  renderHist();

})();
