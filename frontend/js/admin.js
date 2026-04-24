/* ============================================
   INDUSTRIAL QUOTATION SYSTEM — admin.js
   ============================================ */

const API_BASE = 'https://quotation-system-6fxw.onrender.com/api';

let products = [];
let deleteTargetId = null;

// ==================== AUTH ====================

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('iq_admin_token');
  if (token) {
    showAdminPanel();
    loadProducts();
  }
});

async function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  if (!username || !password) {
    errEl.textContent = 'Please enter username and password.';
    errEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Signing in…';
  errEl.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Login failed');

    localStorage.setItem('iq_admin_token', data.token);
    showAdminPanel();
    loadProducts();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In →';
  }
}

function handleLogout() {
  localStorage.removeItem('iq_admin_token');
  document.getElementById('adminLayout').classList.remove('visible');
  document.getElementById('loginPage').style.display = 'flex';
}

function showAdminPanel() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminLayout').classList.add('visible');
}

function getToken() {
  return localStorage.getItem('iq_admin_token');
}

// ==================== PRODUCTS ====================

async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    products = await res.json();
    renderTable();
    updateStats();
    buildCategoryDatalist();
  } catch (err) {
    showToast('Failed to load products: ' + err.message, 'error');
  }
}

function updateStats() {
  document.getElementById('statTotal').textContent = products.length;
  const cats = new Set(products.map(p => p.category).filter(Boolean));
  document.getElementById('statCategories').textContent = cats.size;
}

function buildCategoryDatalist() {
  const dl = document.getElementById('categoryList');
  const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
  dl.innerHTML = cats.map(c => `<option value="${escHtml(c)}">`).join('');
}

function renderTable() {
  const tbody = document.getElementById('productTableBody');

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">No products yet. Add your first product!</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td>
        ${p.image
          ? `<img class="table-img" src="${API_BASE.replace('/api','')}${p.image}" alt="" onerror="this.style.display='none'">`
          : `<div class="table-img-placeholder">📦</div>`}
      </td>
      <td>
        <div class="table-product-name">${escHtml(p.name)}</div>
        ${p.description ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${escHtml(p.description.substring(0,60))}${p.description.length > 60 ? '…' : ''}</div>` : ''}
      </td>
      <td><span class="badge">${escHtml(p.category || '—')}</span></td>
      <td style="color:var(--text-secondary);font-size:13px;">
        ${p.size ? `<div>Size: ${escHtml(p.size)}</div>` : ''}
        ${p.dimensions ? `<div>Dims: ${escHtml(p.dimensions)}</div>` : ''}
        ${!p.size && !p.dimensions ? '—' : ''}
      </td>
      <td style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--orange);">
        ₹${Number(p.price).toLocaleString('en-IN')}
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-success btn-sm" onclick="openEditModal('${p._id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="openDeleteModal('${p._id}', '${escHtml(p.name)}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ==================== MODAL: ADD / EDIT ====================

function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Add Product';
  document.getElementById('editProductId').value = '';
  document.getElementById('fieldName').value = '';
  document.getElementById('fieldCategory').value = '';
  document.getElementById('fieldPrice').value = '';
  document.getElementById('fieldSize').value = '';
  document.getElementById('fieldDimensions').value = '';
  document.getElementById('fieldDescription').value = '';
  document.getElementById('fieldImage').value = '';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('existingImageNote').style.display = 'none';
  document.getElementById('saveProductBtn').textContent = 'Save Product';
  openModal('productModal');
}

function openEditModal(id) {
  const product = products.find(p => p._id === id);
  if (!product) return;

  document.getElementById('modalTitle').textContent = 'Edit Product';
  document.getElementById('editProductId').value = id;
  document.getElementById('fieldName').value = product.name || '';
  document.getElementById('fieldCategory').value = product.category || '';
  document.getElementById('fieldPrice').value = product.price || '';
  document.getElementById('fieldSize').value = product.size || '';
  document.getElementById('fieldDimensions').value = product.dimensions || '';
  document.getElementById('fieldDescription').value = product.description || '';
  document.getElementById('fieldImage').value = '';

  const preview = document.getElementById('imagePreview');
  if (product.image) {
    preview.src = API_BASE.replace('/api','') + product.image;
    preview.style.display = 'block';
    document.getElementById('existingImageNote').style.display = 'block';
  } else {
    preview.style.display = 'none';
    document.getElementById('existingImageNote').style.display = 'none';
  }

  document.getElementById('saveProductBtn').textContent = 'Update Product';
  openModal('productModal');
}

async function saveProduct() {
  const id   = document.getElementById('editProductId').value;
  const name = document.getElementById('fieldName').value.trim();
  const cat  = document.getElementById('fieldCategory').value.trim();
  const price= document.getElementById('fieldPrice').value;
  const size = document.getElementById('fieldSize').value.trim();
  const dims = document.getElementById('fieldDimensions').value.trim();
  const desc = document.getElementById('fieldDescription').value.trim();
  const file = document.getElementById('fieldImage').files[0];

  if (!name || !cat || !price) {
    showToast('Name, category and price are required', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('category', cat);
  formData.append('price', price);
  formData.append('size', size);
  formData.append('dimensions', dims);
  formData.append('description', desc);
  if (file) formData.append('image', file);

  const btn = document.getElementById('saveProductBtn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    const url    = id ? `${API_BASE}/update-product/${id}` : `${API_BASE}/add-product`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) { handleLogout(); return; }
      throw new Error(data.message || 'Failed to save');
    }

    showToast(id ? '✅ Product updated' : '✅ Product added', 'success');
    closeModal();
    await loadProducts();
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = id ? 'Update Product' : 'Save Product';
  }
}

// ==================== MODAL: DELETE ====================

function openDeleteModal(id, name) {
  deleteTargetId = id;
  document.getElementById('deleteProductName').textContent = name;
  openModal('deleteModal');
}

async function confirmDelete() {
  if (!deleteTargetId) return;

  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true;
  btn.textContent = 'Deleting…';

  try {
    const res = await fetch(`${API_BASE}/delete-product/${deleteTargetId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) { handleLogout(); return; }
      throw new Error(data.message || 'Delete failed');
    }

    showToast('🗑 Product deleted', 'success');
    closeDeleteModal();
    await loadProducts();
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Delete';
    deleteTargetId = null;
  }
}

function closeDeleteModal() {
  closeModal('deleteModal');
}

// ==================== IMAGE PREVIEW ====================

function previewImage(input) {
  const file = input.files[0];
  const preview = document.getElementById('imagePreview');
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    preview.style.display = 'none';
  }
}

function handleDrop(event) {
  event.preventDefault();
  document.getElementById('uploadArea').classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const input = document.getElementById('fieldImage');
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    previewImage(input);
  }
}

// ==================== MODAL HELPERS ====================

function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id = 'productModal') {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
});

// ==================== TOAST ====================

function showToast(message, type = '') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
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
