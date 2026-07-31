const dosas = [
  { id: 'plain', name: 'Plain dosa', price: 50 },
  { id: 'masala', name: 'Masala dosa', price: 70 },
  { id: 'mysore', name: 'Mysore masala dosa', price: 70 },
  { id: 'paneer', name: 'Paneer dosa', price: 100 },
  { id: 'cheese', name: 'Cheese dosa', price: 100 },
  { id: 'special', name: 'Special dosa', price: 150 },
];
const sides = [
  { id: 'vadapav', name: 'Special vada pav', price: 50 },
  { id: 'dahivada', name: 'Special dahi vada (2 pcs)', price: 50 },
];
const allItems = [...dosas, ...sides];

const SALES_KEY = 'dosaPointSalesByDate';
const EXPENSES_KEY = 'dosaPointExpensesByDate';

function loadJSON(key){
  try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : {}; }catch(e){ return {}; }
}
function saveJSON(key, data){
  try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){}
}
function todayKey(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function monthKey(){ return todayKey().slice(0,7); }

let salesByDate = loadJSON(SALES_KEY);
if(!salesByDate[todayKey()]) salesByDate[todayKey()] = {};

let expensesByDate = loadJSON(EXPENSES_KEY);
if(!expensesByDate[todayKey()]) expensesByDate[todayKey()] = [];

const cart = {};
let orderConfirmed = false;

function itemCard(it){
  return `
    <div class="item" data-id="${it.id}">
      <p class="item-name">${it.name}</p>
      <p class="item-price">₹${it.price}</p>
      <div class="qty-row">
        <button class="qty-btn" aria-label="Remove ${it.name}" onclick="changeQty('${it.id}', -1)">−</button>
        <span class="qty-val" id="qty-${it.id}">0</span>
        <button class="qty-btn" aria-label="Add ${it.name}" onclick="changeQty('${it.id}', 1)">+</button>
      </div>
    </div>`;
}
document.getElementById('dosa-grid').innerHTML = dosas.map(itemCard).join('');
document.getElementById('sides-grid').innerHTML = sides.map(itemCard).join('');

function changeQty(id, delta){
  if(orderConfirmed) return;
  cart[id] = Math.max(0, (cart[id] || 0) + delta);
  document.getElementById('qty-' + id).textContent = cart[id];
  renderOrder();
}

function cartTotal(){ return allItems.reduce((sum, it) => sum + (cart[it.id]||0) * it.price, 0); }

function renderOrder(){
  const active = allItems.filter(it => cart[it.id] > 0);
  document.getElementById('total').textContent = '₹' + cartTotal().toLocaleString('en-IN');
  const linesEl = document.getElementById('order-lines');
  linesEl.innerHTML = active.length === 0
    ? '<p class="empty-note">Nothing added yet — pick a dish above.</p>'
    : active.map(it => `<div class="order-line"><span>${it.name} × ${cart[it.id]}</span><span>₹${it.price * cart[it.id]}</span></div>`).join('');
  document.getElementById('btn-make').disabled = orderConfirmed || active.length === 0;
}

function setOrderButtons(){
  document.getElementById('btn-cancel').disabled = orderConfirmed;
  document.getElementById('btn-make').disabled = orderConfirmed || cartTotal() === 0;
  document.getElementById('btn-next').disabled = !orderConfirmed;
  document.getElementById('confirm-note').style.display = orderConfirmed ? 'block' : 'none';
}

function cancelOrder(){
  if(orderConfirmed) return;
  Object.keys(cart).forEach(k => cart[k] = 0);
  allItems.forEach(it => { const el = document.getElementById('qty-' + it.id); if(el) el.textContent = 0; });
  renderOrder(); setOrderButtons();
}

function makeOrder(){
  if(cartTotal() === 0 || orderConfirmed) return;
  const key = todayKey();
  if(!salesByDate[key]) salesByDate[key] = {};
  allItems.forEach(it => {
    const q = cart[it.id] || 0;
    if(q > 0) salesByDate[key][it.id] = (salesByDate[key][it.id] || 0) + q;
  });
  saveJSON(SALES_KEY, salesByDate);
  orderConfirmed = true;
  setOrderButtons(); renderSale(); renderMonth();
}

function nextOrder(){
  Object.keys(cart).forEach(k => cart[k] = 0);
  allItems.forEach(it => { const el = document.getElementById('qty-' + it.id); if(el) el.textContent = 0; });
  orderConfirmed = false; renderOrder(); setOrderButtons();
}

function showView(name){
  ['order','sale','expense','month'].forEach(v => {
    document.getElementById('view-' + v).classList.toggle('active', name === v);
    document.getElementById('tab-' + v + '-btn').classList.toggle('active', name === v);
  });
  if(name === 'sale') renderSale();
  if(name === 'expense') renderExpenses();
  if(name === 'month') renderMonth();
}

function saleRow(it){
  const key = todayKey();
  const qty = (salesByDate[key] && salesByDate[key][it.id]) || 0;
  return `<tr>
    <td>${it.name}</td><td class="num">${it.price}</td>
    <td class="center"><input type="number" min="0" class="qty-input" value="${qty}" onchange="setSaleQty('${it.id}', this.value)"></td>
    <td class="num" id="sale-line-${it.id}">₹${qty * it.price}</td>
  </tr>`;
}
function renderSale(){
  document.getElementById('today-label').textContent = '· ' + todayKey();
  document.getElementById('sheet-body').innerHTML = allItems.map(saleRow).join('');
  updateSaleTotals();
}
function setSaleQty(id, val){
  const key = todayKey();
  if(!salesByDate[key]) salesByDate[key] = {};
  salesByDate[key][id] = Math.max(0, parseInt(val) || 0);
  saveJSON(SALES_KEY, salesByDate);
  const it = allItems.find(i => i.id === id);
  document.getElementById('sale-line-' + id).textContent = '₹' + (salesByDate[key][id] * it.price);
  updateSaleTotals(); renderMonth();
}
function updateSaleTotals(){
  const day = salesByDate[todayKey()] || {};
  let qtySum = 0, totalSum = 0;
  allItems.forEach(it => { const q = day[it.id] || 0; qtySum += q; totalSum += q * it.price; });
  document.getElementById('grand-qty').textContent = qtySum;
  document.getElementById('grand-total').textContent = '₹' + totalSum.toLocaleString('en-IN');
}
function resetToday(){
  salesByDate[todayKey()] = {};
  saveJSON(SALES_KEY, salesByDate);
  renderSale(); renderMonth();
}

function addExpense(){
  const nameEl = document.getElementById('exp-name');
  const amountEl = document.getElementById('exp-amount');
  const name = nameEl.value.trim();
  const amount = parseFloat(amountEl.value);
  if(!name || !amount || amount <= 0) return;
  const key = todayKey();
  if(!expensesByDate[key]) expensesByDate[key] = [];
  expensesByDate[key].push({ id: Date.now(), name, amount });
  saveJSON(EXPENSES_KEY, expensesByDate);
  nameEl.value = ''; amountEl.value = '';
  renderExpenses(); renderMonth();
}

function deleteExpense(id){
  const key = todayKey();
  expensesByDate[key] = (expensesByDate[key] || []).filter(e => e.id !== id);
  saveJSON(EXPENSES_KEY, expensesByDate);
  renderExpenses(); renderMonth();
}

function clearTodayExpenses(){
  expensesByDate[todayKey()] = [];
  saveJSON(EXPENSES_KEY, expensesByDate);
  renderExpenses(); renderMonth();
}

function renderExpenses(){
  document.getElementById('expense-today-label').textContent = '· ' + todayKey();
  const todays = expensesByDate[todayKey()] || [];
  const body = document.getElementById('expense-body');
  body.innerHTML = todays.length
    ? todays.map(e => `<tr><td>${e.name}</td><td class="num">₹${e.amount.toLocaleString('en-IN')}</td><td class="center"><button class="del-btn" onclick="deleteExpense(${e.id})" aria-label="Remove ${e.name}">✕</button></td></tr>`).join('')
    : '<tr><td colspan="3" style="color:var(--ink-soft); font-size:13px;">No expenses logged today.</td></tr>';
  const total = todays.reduce((s,e)=>s+e.amount,0);
  document.getElementById('expense-total').textContent = '₹' + total.toLocaleString('en-IN');

  const mKey = monthKey();
  const monthBody = document.getElementById('expense-month-body');
  const dayKeys = Object.keys(expensesByDate).filter(d => d.startsWith(mKey)).sort().reverse();
  let monthTotal = 0;
  const rows = [];
  dayKeys.forEach(dateKey => {
    const dayTotal = (expensesByDate[dateKey]||[]).reduce((s,e)=>s+e.amount,0);
    if(dayTotal > 0){
      monthTotal += dayTotal;
      rows.push(`<tr class="day-row"><td>${dateKey}</td><td class="num">₹${dayTotal.toLocaleString('en-IN')}</td></tr>`);
    }
  });
  monthBody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="2" style="color:var(--ink-soft); font-size:13px;">No expenses recorded yet this month.</td></tr>';
  document.getElementById('expense-month-total').textContent = '₹' + monthTotal.toLocaleString('en-IN');
}

function renderMonth(){
  const mKey = monthKey();
  document.getElementById('month-label').textContent = '· ' + mKey;

  const itemTotals = {};
  allItems.forEach(it => itemTotals[it.id] = 0);
  const dayRows = [];

  Object.keys(salesByDate).filter(d => d.startsWith(mKey)).sort().reverse().forEach(dateKey => {
    const day = salesByDate[dateKey];
    let dayQty = 0, dayRevenue = 0;
    allItems.forEach(it => {
      const q = day[it.id] || 0;
      itemTotals[it.id] += q; dayQty += q; dayRevenue += q * it.price;
    });
    if(dayQty > 0) dayRows.push(`<tr class="day-row"><td>${dateKey}</td><td class="center">${dayQty}</td><td class="num">₹${dayRevenue.toLocaleString('en-IN')}</td></tr>`);
  });

  document.getElementById('month-item-body').innerHTML = allItems.map(it => `
    <tr><td>${it.name}</td><td class="num">${it.price}</td><td class="center">${itemTotals[it.id]}</td><td class="num">₹${(itemTotals[it.id]*it.price).toLocaleString('en-IN')}</td></tr>
  `).join('');

  const grandQty = Object.values(itemTotals).reduce((a,b)=>a+b,0);
  const grandTotal = allItems.reduce((sum,it)=> sum + itemTotals[it.id]*it.price, 0);
  document.getElementById('month-grand-qty').textContent = grandQty;
  document.getElementById('month-grand-total').textContent = '₹' + grandTotal.toLocaleString('en-IN');
  document.getElementById('month-day-body').innerHTML = dayRows.length ? dayRows.join('') : '<tr><td colspan="3" style="color:var(--ink-soft); font-size:13px;">No sales recorded yet this month.</td></tr>';

  const monthExpenseTotal = Object.keys(expensesByDate).filter(d => d.startsWith(mKey))
    .reduce((sum, d) => sum + (expensesByDate[d]||[]).reduce((s,e)=>s+e.amount,0), 0);

  const net = grandTotal - monthExpenseTotal;
  document.getElementById('profit-sales').textContent = '₹' + grandTotal.toLocaleString('en-IN');
  document.getElementById('profit-expenses').textContent = '₹' + monthExpenseTotal.toLocaleString('en-IN');
  document.getElementById('profit-net').textContent = (net < 0 ? '-₹' : '₹') + Math.abs(net).toLocaleString('en-IN');
  const netCard = document.getElementById('profit-net-card');
  netCard.classList.toggle('pos', net >= 0);
  netCard.classList.toggle('neg', net < 0);
}

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let activeMicContext = null;

if(SpeechRecognitionAPI){
  recognition = new SpeechRecognitionAPI();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    handleVoiceCommand(activeMicContext, transcript);
  };
  recognition.onerror = () => setMicState(activeMicContext, false, "Didn't catch that — try again.");
  recognition.onend = () => setMicState(activeMicContext, false);
}

function setMicState(context, listening, statusText){
  if(!context) return;
  const btn = document.getElementById('mic-' + context);
  const label = btn ? btn.querySelector('.mic-label') : null;
  const status = document.getElementById('voice-status-' + context);
  if(btn){
    btn.classList.toggle('listening', listening);
    btn.disabled = listening;
  }
  if(label) label.textContent = listening ? 'Listening… speak now' : 'Tap to speak';
  if(status) status.textContent = statusText !== undefined ? statusText : '';
}

function startVoice(context){
  if(!SpeechRecognitionAPI){
    setMicState(context, false, "Voice isn't supported in this browser — try Chrome.");
    return;
  }
  if(activeMicContext){ try{ recognition.stop(); }catch(e){} }
  activeMicContext = context;
  setMicState(context, true);
  try{ recognition.start(); }catch(e){} 
}

const NUM_WORDS = {
  zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10,
  eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17,
  eighteen:18, nineteen:19, twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70,
  eighty:80, ninety:90
};
function parseNumber(text){
  const digitMatch = text.match(/\d+(\.\d+)?/g);
  if(digitMatch) return parseFloat(digitMatch[digitMatch.length - 1]);

  const words = text.replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
  let total = 0, current = 0, found = false;
  words.forEach(w => {
    if(w === 'hundred'){ current = (current || 1) * 100; found = true; }
    else if(w === 'thousand'){ total += (current || 1) * 1000; current = 0; found = true; }
    else if(NUM_WORDS[w] !== undefined){ current += NUM_WORDS[w]; found = true; }
  });
  total += current;
  return found ? total : null;
}

function matchItem(text){
  let best = null;
  allItems.forEach(it => {
    if(text.includes(it.name.toLowerCase()) && (!best || it.name.length > best.name.length)){
      best = it;
    }
  });
  return best;
}

function handleVoiceCommand(context, transcript){
  if(context === 'order') return handleOrderVoice(transcript);
  if(context === 'sale') return handleSaleVoice(transcript);
  if(context === 'expense') return handleExpenseVoice(transcript);
}

function handleOrderVoice(text){
  if(/make order|confirm order/.test(text)){ makeOrder(); setMicState('order', false, 'Order made ✓'); return; }
  if(/cancel order/.test(text)){ cancelOrder(); setMicState('order', false, 'Order cancelled'); return; }
  if(/next order/.test(text)){ nextOrder(); setMicState('order', false, 'Ready for next order'); return; }

  const item = matchItem(text);
  if(!item){ setMicState('order', false, `Didn't recognise an item in "${text}"`); return; }

  const num = parseNumber(text);
  const isRemove = /remove|delete|less/.test(text);

  if(isRemove){
    cart[item.id] = Math.max(0, (cart[item.id]||0) - (num || 1));
  } else {
    cart[item.id] = Math.max(0, (cart[item.id]||0) + (num || 1));
  }
  const el = document.getElementById('qty-' + item.id);
  if(el) el.textContent = cart[item.id];
  renderOrder();
  setMicState('order', false, `${isRemove ? 'Removed' : 'Added'} ${item.name}${num ? ' × '+num : ''}`);
}

function handleSaleVoice(text){
  if(/new sale/.test(text)){ resetToday(); setMicState('sale', false, "Today's sale cleared"); return; }
  const item = matchItem(text);
  if(!item){ setMicState('sale', false, `Didn't recognise an item in "${text}"`); return; }
  const num = parseNumber(text);
  if(num === null){ setMicState('sale', false, `Heard "${item.name}" but no number`); return; }
  setSaleQty(item.id, num);
  const input = document.querySelector(`#sheet-body input[onchange*="${item.id}"]`);
  if(input) input.value = num;
  setMicState('sale', false, `Set ${item.name} to ${num}`);
}

function handleExpenseVoice(text){
  const cleaned = text.replace(/add expense|expense|rupees|rs\.?/g, '').trim();
  const num = parseNumber(cleaned);
  if(num === null){ setMicState('expense', false, `Didn't catch an amount in "${text}"`); return; }
  let name = cleaned.replace(/\d+(\.\d+)?/g, '');
  NUM_WORDS && Object.keys(NUM_WORDS).forEach(w => { name = name.replace(new RegExp('\\b'+w+'\\b','g'), ''); });
  name = name.replace(/hundred|thousand/g, '').replace(/\s+/g,' ').trim();
  if(!name){ setMicState('expense', false, `Didn't catch what the expense was for`); return; }
  const key = todayKey();
  if(!expensesByDate[key]) expensesByDate[key] = [];
  expensesByDate[key].push({ id: Date.now(), name: name.charAt(0).toUpperCase()+name.slice(1), amount: num });
  saveJSON(EXPENSES_KEY, expensesByDate);
  renderExpenses(); renderMonth();
  setMicState('expense', false, `Added expense: ${name} ₹${num}`);
}

renderOrder(); setOrderButtons(); renderSale(); renderExpenses(); renderMonth();
