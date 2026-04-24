/* ============================================
   INDUSTRIAL QUOTATION SYSTEM — app.js
   ============================================ */

const API_BASE = 'https://quotation-system-6fxw.onrender.com/api';

let allProducts = [];
let cart = [];
let activeFilter = 'all';

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  fetchProducts();
  renderCart();

  // Enable/disable send button on email input
  document.getElementById('quotationEmail').addEventListener('input', updateSendBtn);
});

// ==================== PRODUCTS ====================

async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Failed to fetch');
    allProducts = await res.json();
    buildFilterTabs();
    renderProducts();
  } catch (err) {
    document.getElementById('productGrid').innerHTML = `
      <div class="empty-state">
        <p>⚠ Could not load products</p>
        <p style="font-size:13px;margin-top:8px;color:var(--text-muted);font-family:var(--font-body);text-transform:none;letter-spacing:0;">${err.message}</p>
      </div>`;
  }
}

function buildFilterTabs() {
  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
  const bar = document.getElementById('filterBar');

  // Remove old dynamic buttons
  bar.querySelectorAll('[data-category]:not([data-category="all"])').forEach(b => b.remove());

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.category = cat;
    btn.textContent = cat;
    btn.onclick = () => setFilter(cat, btn);
    bar.appendChild(btn);
  });
}

function setFilter(category, btn) {
  activeFilter = category;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProducts();
}

function renderProducts() {
  const filtered = activeFilter === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === activeFilter);

  const grid = document.getElementById('productGrid');

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state"><p>No products found</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(product => {
    const inCart = cart.some(c => c._id === product._id);
    const imgEl = product.image
      ? `<img class="card-image" src="${API_BASE.replace('/api','')}${product.image}" alt="${escHtml(product.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        + `<div class="card-image-placeholder" style="display:none;">📦</div>`
      : `<div class="card-image-placeholder">📦</div>`;

    return `
      <div class="product-card" data-id="${product._id}">
        ${imgEl}
        <div class="card-body">
          <div class="card-category">${escHtml(product.category || '')}</div>
          <div class="card-name">${escHtml(product.name)}</div>
          ${product.size ? `<div class="card-meta">Size: ${escHtml(product.size)}</div>` : ''}
          ${product.dimensions ? `<div class="card-meta">Dims: ${escHtml(product.dimensions)}</div>` : ''}
          ${product.description ? `<div class="card-description">${escHtml(product.description)}</div>` : ''}
        </div>
        <div class="card-footer">
          <div class="card-price">₹${Number(product.price).toLocaleString('en-IN')}<span>/unit</span></div>
          <button
            class="add-to-cart-btn ${inCart ? 'in-cart' : ''}"
            onclick="toggleCartItem('${product._id}')"
            id="addBtn-${product._id}"
          >${inCart ? '✓ Added' : '+ Cart'}</button>
        </div>
      </div>`;
  }).join('');
}

// ==================== CART ====================

function loadCart() {
  try {
    cart = JSON.parse(localStorage.getItem('iq_cart') || '[]');
  } catch { cart = []; }
}

function saveCart() {
  localStorage.setItem('iq_cart', JSON.stringify(cart));
}

function toggleCartItem(productId) {
  const existing = cart.find(c => c._id === productId);
  if (existing) {
    cart = cart.filter(c => c._id !== productId);
    showToast('Item removed from cart');
  } else {
    const product = allProducts.find(p => p._id === productId);
    if (product) {
      cart.push({ ...product, qty: 1 });
      showToast('Item added to cart');
    }
  }
  saveCart();
  updateCartBadge();
  renderCart();
  renderProducts(); // refresh button states
}

function updateQty(productId, delta) {
  const item = cart.find(c => c._id === productId);
  if (!item) return;
  item.qty = Math.max(1, (item.qty || 1) + delta);
  saveCart();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(c => c._id !== productId);
  saveCart();
  updateCartBadge();
  renderCart();
  renderProducts();
}

function updateCartBadge() {
  const total = cart.reduce((s, i) => s + (i.qty || 1), 0);
  document.getElementById('cartBadge').textContent = total;
}

function renderCart() {
  updateCartBadge();
  updateSendBtn();

  const container = document.getElementById('cartItems');
  const emptyMsg  = document.getElementById('cartEmptyMsg');
  const totalEl   = document.getElementById('cartTotal');

  if (cart.length === 0) {
    emptyMsg.style.display = 'flex';
    container.querySelectorAll('.cart-item').forEach(el => el.remove());
    totalEl.textContent = '₹0';
    return;
  }

  emptyMsg.style.display = 'none';

  // Diff: remove items not in cart
  container.querySelectorAll('.cart-item').forEach(el => {
    if (!cart.find(c => c._id === el.dataset.id)) el.remove();
  });

  // Add/update items
  cart.forEach(item => {
    let el = container.querySelector(`.cart-item[data-id="${item._id}"]`);
    const imgHtml = item.image
      ? `<img class="cart-item-img" src="${API_BASE.replace('/api','')}${item.image}" alt="" onerror="this.style.display='none'">`
      : `<div class="cart-item-img-placeholder">📦</div>`;

    const html = `
      ${imgHtml}
      <div class="cart-item-info">
        <div class="cart-item-name">${escHtml(item.name)}</div>
        <div class="cart-item-price">₹${(Number(item.price) * (item.qty || 1)).toLocaleString('en-IN')}</div>
      </div>
      <div class="cart-qty-controls">
        <button class="qty-btn" onclick="updateQty('${item._id}',-1)">−</button>
        <span class="qty-display">${item.qty || 1}</span>
        <button class="qty-btn" onclick="updateQty('${item._id}',1)">+</button>
      </div>
      <button class="cart-remove-btn" onclick="removeFromCart('${item._id}')" title="Remove">✕</button>`;

    if (el) {
      el.innerHTML = html;
    } else {
      el = document.createElement('div');
      el.className = 'cart-item';
      el.dataset.id = item._id;
      el.innerHTML = html;
      container.appendChild(el);
    }
  });

  const total = cart.reduce((s, i) => s + Number(i.price) * (i.qty || 1), 0);
  totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
}

function toggleCart() {
  const overlay = document.getElementById('cartOverlay');
  const sidebar = document.getElementById('cartSidebar');
  const isOpen = sidebar.classList.contains('open');
  overlay.classList.toggle('open', !isOpen);
  sidebar.classList.toggle('open', !isOpen);
}

function updateSendBtn() {
  const email = document.getElementById('quotationEmail').value.trim();
  const btn = document.getElementById('sendQuotationBtn');
  btn.disabled = !(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && cart.length > 0);
}

// ==================== QUOTATION ====================

async function sendQuotation() {
  const email = document.getElementById('quotationEmail').value.trim();
  if (!email || cart.length === 0) return;

  const btn = document.getElementById('sendQuotationBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Sending…';

  try {
    const res = await fetch(`${API_BASE}/send-quotation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, cart })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Failed to send');

    showToast('✅ Quotation sent successfully!', 'success');
    cart = [];
    saveCart();
    renderCart();
    document.getElementById('quotationEmail').value = '';
    toggleCart();
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  } finally {
    btn.textContent = '📧 Send Quotation';
    updateSendBtn();
  }
}

// ==================== TOAST ====================

function showToast(message, type = '') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ==================== UTILS ====================

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
