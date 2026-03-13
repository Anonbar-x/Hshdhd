/* ─── Barcode Generator ─────────────────────────────── */

(function () {
  'use strict';

  // ── DOM refs ────────────────────────────────────────
  const input        = document.getElementById('barcodeInput');
  const generateBtn  = document.getElementById('generateBtn');
  const printBtn     = document.getElementById('printBtn');
  const resetBtn     = document.getElementById('resetBtn');
  const previewWrap  = document.getElementById('previewWrap');
  const previewEmpty = document.getElementById('previewEmpty');
  const stickerArea  = document.getElementById('stickerArea');
  const barcodeSvg   = document.getElementById('barcodeSvg');
  const stickerCode  = document.getElementById('stickerCode');
  const actionsRow   = document.getElementById('actionsRow');

  // ── Generate ─────────────────────────────────────────
  function generate() {
    const raw = input.value.trim();

    if (!raw) {
      shake(input);
      input.focus();
      return;
    }

    try {
      JsBarcode(barcodeSvg, raw, {
        format:      detectFormat(raw),
        lineColor:   '#1a1d23',
        width:       2,
        height:      80,
        displayValue: false,   // we show it ourselves below
        margin:      10,
        background:  '#ffffff',
      });

      stickerCode.textContent = raw;

      // Show sticker, hide empty state
      previewEmpty.style.display = 'none';
      stickerArea.style.display  = 'flex';
      previewWrap.classList.add('has-barcode');
      actionsRow.style.display   = 'flex';

    } catch (err) {
      showError(err.message || 'Invalid barcode value.');
    }
  }

  // ── Auto-detect format ────────────────────────────────
  function detectFormat(value) {
    const v = value.replace(/\s/g, '');
    if (/^\d{13}$/.test(v))        return 'EAN13';
    if (/^\d{8}$/.test(v))         return 'EAN8';
    if (/^\d{12}$/.test(v))        return 'UPC';
    if (/^\d{11,14}$/.test(v))     return 'CODE128';
    return 'CODE128';               // universal fallback
  }

  // ── Print ─────────────────────────────────────────────
  function print() {
    if (stickerArea.style.display === 'none') return;
    window.print();
  }

  // ── Reset ─────────────────────────────────────────────
  function reset() {
    input.value            = '';
    previewEmpty.style.display = 'flex';
    stickerArea.style.display  = 'none';
    actionsRow.style.display   = 'none';
    previewWrap.classList.remove('has-barcode');
    input.focus();
  }

  // ── Helpers ───────────────────────────────────────────
  function shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth; // reflow
    el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  }

  function showError(msg) {
    previewEmpty.style.display = 'flex';
    stickerArea.style.display  = 'none';
    actionsRow.style.display   = 'none';
    previewWrap.classList.remove('has-barcode');

    previewEmpty.innerHTML = `
      <div class="empty-icon" style="opacity:.5;">✕</div>
      <span style="color:#ef4444;font-size:13px;">${msg}</span>
      <span style="font-size:12px;">Try a different value or format</span>
    `;

    setTimeout(() => {
      previewEmpty.innerHTML = `
        <div class="empty-icon">⬛</div>
        <span>Your barcode will appear here</span>
      `;
    }, 3000);
  }

  // ── Events ────────────────────────────────────────────
  generateBtn.addEventListener('click', generate);
  printBtn.addEventListener('click', print);
  resetBtn.addEventListener('click', reset);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') generate();
  });

  // ── Shake animation (injected to avoid extra file) ───
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%      { transform: translateX(-6px); }
      40%      { transform: translateX(6px); }
      60%      { transform: translateX(-4px); }
      80%      { transform: translateX(4px); }
    }
    .shake { animation: shake 0.35s ease; }
  `;
  document.head.appendChild(style);

})();
