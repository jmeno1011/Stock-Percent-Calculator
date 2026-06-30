// ── State ──
const DEFAULT_FEE = '0.025';
const STORAGE_KEYS = ['buyPrice', 'quantity', 'pct', 'target', 'sign', 'lastEdited', 'fee'];
let sign = 1;
let lastEdited = null; // 'pct' | 'target'

// ── DOM ──
const buyEl       = document.getElementById('buyPrice');
const quantityEl  = document.getElementById('quantityInput');
const pctEl       = document.getElementById('pctInput');
const targetEl    = document.getElementById('targetPrice');
const resetBtn    = document.getElementById('resetBtn');
const signPlusBtn = document.getElementById('signPlusBtn');
const signMinusBtn= document.getElementById('signMinusBtn');
const feeInput    = document.getElementById('feeInput');
const resCard     = document.getElementById('resultCard');
const resPct      = document.getElementById('resPct');
const netProfit   = document.getElementById('netProfit');
const toggleMulti = document.getElementById('toggleMulti');
const multiTable  = document.getElementById('multiTable');
const multiBody   = document.getElementById('multiBody');

// ── Formatting ──
function fmtUSD(n) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtSigned(n) {
  return (n >= 0 ? '+' : '−') + fmtUSD(n);
}
function fmtPct(n) {
  return (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(2) + '%';
}

// ── Fee ──
function getFee() {
  const v = parseFloat(feeInput.value);
  return isNaN(v) || v < 0 ? 0 : v;
}

function getQuantity() {
  const v = parseFloat(quantityEl.value);
  return isNaN(v) || v <= 0 ? 1 : v;
}

function getFeeAdjustedPct(effectivePct, fee) {
  if (effectivePct === 0) return 0;
  return effectivePct + (effectivePct > 0 ? fee : -fee);
}

function getReturnPctFromTarget(buy, target, fee) {
  const grossPct = (target - buy) / buy * 100;
  if (grossPct === 0) return 0;
  return grossPct - (grossPct > 0 ? fee : -fee);
}

function getNetProfit(diff, feeAmount) {
  if (diff === 0) return 0;
  return diff - (diff > 0 ? feeAmount : -feeAmount);
}

// ── Calculation ──
function compute() {
  const buy = parseFloat(buyEl.value);
  if (!buy || isNaN(buy) || buy <= 0) { clearResult(); return; }

  let tgt, effectivePct;
  const fee = getFee();

  if (lastEdited === 'pct') {
    const pct = parseFloat(pctEl.value);
    if (isNaN(pct) || pctEl.value === '') { clearResult(); return; }
    effectivePct = sign * Math.abs(pct);
    tgt = buy * (1 + getFeeAdjustedPct(effectivePct, fee) / 100);
    targetEl.value = tgt.toFixed(2);

  } else if (lastEdited === 'target') {
    tgt = parseFloat(targetEl.value);
    if (isNaN(tgt) || tgt <= 0) { clearResult(); return; }
    effectivePct = getReturnPctFromTarget(buy, tgt, fee);
    sign = effectivePct >= 0 ? 1 : -1;
    updateSignBtns();
    pctEl.value = Math.abs(effectivePct).toFixed(2);

  } else { clearResult(); return; }

  const diff    = tgt - buy;
  const feeIncluded = buy * fee / 100;
  const net     = getNetProfit(diff, feeIncluded) * getQuantity();

  const isUp = effectivePct >= 0;
  resCard.className = 'result-card ' + (isUp ? 'up' : 'down');
  resPct.textContent  = fmtPct(effectivePct);

  // Color-code net profit.
  netProfit.textContent  = fmtSigned(net);
  netProfit.style.color  = net >= 0 ? 'var(--up)' : 'var(--down)';

  if (multiTable.style.display !== 'none') updateMultiTable(buy);
}

function clearResult() {
  resCard.className = 'result-card';
  resPct.textContent = netProfit.textContent = '—';
  netProfit.style.color = '';
}

// ── Save and restore ──
function saveAll() {
  if (typeof chrome === 'undefined' || !chrome.storage) return;
  chrome.storage.local.set({
    buyPrice:   buyEl.value,
    quantity:   quantityEl.value,
    pct:        pctEl.value,
    target:     targetEl.value,
    sign:       sign,
    lastEdited: lastEdited,
    fee:        feeInput.value,
  });
}

function clearSaved() {
  if (typeof chrome === 'undefined' || !chrome.storage) return;
  if (chrome.storage.local.remove) {
    chrome.storage.local.remove(STORAGE_KEYS);
    return;
  }
  chrome.storage.local.set({
    buyPrice: '',
    quantity: '',
    pct: '',
    target: '',
    sign: 1,
    lastEdited: null,
    fee: DEFAULT_FEE,
  });
}

function computeAndSave() {
  compute();
  saveAll();
}

// ── Sign buttons ──
function updateSignBtns() {
  signPlusBtn.className = 'sign-btn positive' + (sign > 0 ? ' active' : '');
  signMinusBtn.className = 'sign-btn negative' + (sign < 0 ? ' active' : '');
  signPlusBtn.setAttribute('aria-pressed', sign > 0 ? 'true' : 'false');
  signMinusBtn.setAttribute('aria-pressed', sign < 0 ? 'true' : 'false');
}

function setSign(nextSign) {
  sign = nextSign;
  updateSignBtns();
  lastEdited = 'pct';
  computeAndSave();
}

signPlusBtn.addEventListener('click', () => setSign(1));
signMinusBtn.addEventListener('click', () => setSign(-1));

resetBtn.addEventListener('click', () => {
  buyEl.value = '';
  quantityEl.value = '';
  pctEl.value = '';
  targetEl.value = '';
  feeInput.value = DEFAULT_FEE;
  sign = 1;
  lastEdited = null;
  updateSignBtns();
  document.querySelectorAll('.qi').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.fee-preset').forEach(b => {
    b.classList.toggle('active', parseFloat(b.dataset.fee) === parseFloat(DEFAULT_FEE));
  });
  clearResult();
  if (multiTable.style.display !== 'none') multiBody.innerHTML = '';
  clearSaved();
});

// ── Input events ──
buyEl.addEventListener('input', computeAndSave);
quantityEl.addEventListener('input', computeAndSave);
pctEl.addEventListener('input', () => {
  lastEdited = 'pct';
  document.querySelectorAll('.qi').forEach(b => b.classList.remove('active'));
  computeAndSave();
});
targetEl.addEventListener('input', () => {
  lastEdited = 'target';
  document.querySelectorAll('.qi').forEach(b => b.classList.remove('active'));
  computeAndSave();
});
feeInput.addEventListener('input', () => {
  // Sync preset buttons when the fee changes.
  const v = parseFloat(feeInput.value);
  document.querySelectorAll('.fee-preset').forEach(b => {
    b.classList.toggle('active', parseFloat(b.dataset.fee) === v);
  });
  computeAndSave();
});

// ── Quick picks ──
document.querySelectorAll('.qi').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = parseFloat(btn.dataset.val);
    sign = val >= 0 ? 1 : -1;
    pctEl.value = Math.abs(val);
    updateSignBtns();
    lastEdited = 'pct';
    document.querySelectorAll('.qi').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    computeAndSave();
  });
});

// ── Fee presets ──
document.querySelectorAll('.fee-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = parseFloat(btn.dataset.fee);
    feeInput.value = val;
    document.querySelectorAll('.fee-preset').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    computeAndSave();
  });
});

// ── Key levels table ──
function updateMultiTable(buy) {
  const pcts = [-15, -10, -7, -5, -3, -1, 1, 3, 5, 7, 10, 15];
  const fee  = getFee();
  const quantity = getQuantity();
  const currentPct = lastEdited ? parseFloat(pctEl.value) * sign : null;
  multiBody.innerHTML = '';
  pcts.forEach(p => {
    const tgt     = buy * (1 + getFeeAdjustedPct(p, fee) / 100);
    const diff    = tgt - buy;
    const feeIncluded = buy * fee / 100;
    const net     = getNetProfit(diff, feeIncluded) * quantity;
    const isUp    = p > 0;
    const isCur   = currentPct !== null && Math.abs(currentPct - p) < 0.01;
    const tr = document.createElement('tr');
    if (isCur) tr.className = 'highlight';
    tr.innerHTML = `
      <td class="${isUp ? 'up' : 'down'}">${p > 0 ? '+' : ''}${p}%</td>
      <td class="${isUp ? 'up' : 'down'}">${fmtUSD(tgt)}</td>
      <td class="${isUp ? 'up' : 'down'}">${fmtSigned(diff)}</td>
      <td class="fee-net" style="color:${net >= 0 ? 'var(--up)' : 'var(--down)'}">${fmtSigned(net)}</td>
    `;
    multiBody.appendChild(tr);
  });
}

toggleMulti.addEventListener('click', () => {
  const isOpen = multiTable.style.display !== 'none';
  multiTable.style.display = isOpen ? 'none' : 'block';
  toggleMulti.classList.toggle('open', !isOpen);
  if (!isOpen) { const buy = parseFloat(buyEl.value); if (buy) updateMultiTable(buy); }
});

if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get(STORAGE_KEYS, (res) => {
    if (res.buyPrice)        buyEl.value    = res.buyPrice;
    if (res.quantity)        quantityEl.value = res.quantity;
    if (res.pct)             pctEl.value    = res.pct;
    if (res.target)          targetEl.value = res.target;
    if (res.sign !== undefined) { sign = res.sign; updateSignBtns(); }
    if (res.lastEdited)      lastEdited = res.lastEdited;
    if (res.fee !== undefined) {
      feeInput.value = res.fee;
      document.querySelectorAll('.fee-preset').forEach(b => {
        b.classList.toggle('active', parseFloat(b.dataset.fee) === parseFloat(res.fee));
      });
    }
    if (res.buyPrice && res.lastEdited) compute();
  });
}

buyEl.addEventListener('change', saveAll);
quantityEl.addEventListener('change', saveAll);
pctEl.addEventListener('change', saveAll);
targetEl.addEventListener('change', saveAll);
feeInput.addEventListener('change', saveAll);

updateSignBtns();
