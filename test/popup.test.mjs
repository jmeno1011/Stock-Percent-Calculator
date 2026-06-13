import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function makeElement(id, value = '') {
  return {
    id,
    value,
    textContent: '',
    className: '',
    innerHTML: '',
    style: {},
    dataset: {},
    listeners: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
    },
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
    setAttribute(name, val) {
      this[name] = val;
    },
    appendChild(child) {
      this.children = this.children || [];
      this.children.push(child);
    },
  };
}

function loadPopup({ chrome } = {}) {
  const ids = [
    'buyPrice',
    'pctInput',
    'targetPrice',
    'resetBtn',
    'signPlusBtn',
    'signMinusBtn',
    'feeInput',
    'resultCard',
    'resPct',
    'netProfit',
    'toggleMulti',
    'multiTable',
    'multiBody',
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, makeElement(id)]));
  elements.feeInput.value = '0.025';
  elements.multiTable.style.display = 'none';

  const context = {
    chrome,
    document: {
      getElementById: (id) => elements[id],
      querySelectorAll: () => [],
      createElement: (tag) => makeElement(tag),
    },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('popup.js', 'utf8'), context);
  return { context, elements };
}

{
  const html = fs.readFileSync('popup.html', 'utf8');

  assert.match(html, /Return/);
  assert.match(html, /Net Profit/);
  assert.doesNotMatch(html, /id="resDiff"/);
  assert.doesNotMatch(html, /id="resDir"/);
  assert.doesNotMatch(html, /id="feeCostOne"/);
  assert.doesNotMatch(html, /id="feeCostRound"/);
  assert.doesNotMatch(html, /Direction/);
  assert.doesNotMatch(html, /Included Fee/);
  assert.doesNotMatch(html, /Gross Change/);
}

{
  const html = fs.readFileSync('popup.html', 'utf8');

  assert.match(html, /id="resetBtn"/);
  assert.match(html, /Clear inputs/);
}

{
  const { elements } = loadPopup();

  assert.ok(elements.signPlusBtn.listeners.click);
  assert.ok(elements.signMinusBtn.listeners.click);
}

{
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  assert.deepEqual(manifest.permissions, ['storage']);
}

{
  const { elements } = loadPopup();

  elements.buyPrice.value = '100';
  elements.pctInput.value = '1';
  elements.pctInput.listeners.input();

  assert.equal(elements.targetPrice.value, '101.03');
  assert.equal(elements.resPct.textContent, '+1.00%');
  assert.equal(elements.netProfit.textContent, '+$1.00');
}

{
  let saved = null;
  const { elements } = loadPopup({
    chrome: {
      storage: {
        local: {
          get(_keys, callback) {
            callback({});
          },
          set(value) {
            saved = value;
          },
        },
      },
    },
  });

  elements.buyPrice.value = '100';
  elements.pctInput.value = '5';
  elements.signMinusBtn.listeners.click();

  assert.equal(elements.resPct.textContent, '−5.00%');
  assert.equal(elements.targetPrice.value, '94.97');
  assert.equal(saved.sign, -1);
  assert.equal(saved.lastEdited, 'pct');
}

{
  const { elements } = loadPopup();

  elements.buyPrice.value = '100';
  elements.targetPrice.value = '101.03';
  elements.targetPrice.listeners.input();

  assert.equal(elements.pctInput.value, '1.01');
  assert.equal(elements.resPct.textContent, '+1.01%');
}

{
  let saved = null;
  const { elements } = loadPopup({
    chrome: {
      storage: {
        local: {
          get(_keys, callback) {
            callback({});
          },
          set(value) {
            saved = value;
          },
        },
      },
    },
  });

  elements.buyPrice.value = '10.92';
  elements.buyPrice.listeners.input();
  elements.pctInput.value = '5';
  elements.pctInput.listeners.input();

  assert.equal(saved.buyPrice, '10.92');
  assert.equal(saved.pct, '5');
  assert.equal(saved.target, '11.47');
  assert.equal(saved.lastEdited, 'pct');
}

{
  const { elements } = loadPopup({
    chrome: {
      storage: {
        local: {
          get(_keys, callback) {
            callback({
              buyPrice: '10.92',
              pct: '5',
              target: '10.37',
              sign: -1,
              lastEdited: 'pct',
              fee: '0.025',
            });
          },
          set() {},
        },
      },
    },
  });

  assert.equal(elements.buyPrice.value, '10.92');
  assert.equal(elements.pctInput.value, '5');
  assert.equal(elements.targetPrice.value, '10.37');
  assert.equal(elements.feeInput.value, '0.025');
  assert.equal(elements.resPct.textContent, '−5.00%');
}

{
  let removed = null;
  const { elements } = loadPopup({
    chrome: {
      storage: {
        local: {
          get(_keys, callback) {
            callback({});
          },
          set() {},
          remove(keys) {
            removed = keys;
          },
        },
      },
    },
  });

  elements.buyPrice.value = '223.46';
  elements.pctInput.value = '2';
  elements.targetPrice.value = '228.38';
  elements.feeInput.value = '0.2';
  elements.signMinusBtn.listeners.click();
  elements.resetBtn.listeners.click();

  assert.equal(elements.buyPrice.value, '');
  assert.equal(elements.pctInput.value, '');
  assert.equal(elements.targetPrice.value, '');
  assert.equal(elements.feeInput.value, '0.025');
  assert.equal(elements.resPct.textContent, '—');
  assert.equal(elements.netProfit.textContent, '—');
  assert.equal(elements.signPlusBtn['aria-pressed'], 'true');
  assert.deepEqual(Array.from(removed), ['buyPrice', 'pct', 'target', 'sign', 'lastEdited', 'fee']);
}
