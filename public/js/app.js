/* ═══════════════════════════════════════════════════════════
   LaundryFlow — Client Application
   ═══════════════════════════════════════════════════════════ */

const API = '';  // Same origin

// ─── State ──────────────────────────────────────────────────
let garmentPrices = {};
let garmentRowCount = 0;

// ─── DOM Ready ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initOrderForm();
  initFilters();
  initMobileMenu();
  loadPrices();
  loadDashboard();
  checkHealth();
});

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════
function initNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
    });
  });
}

function switchView(viewName) {
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Update views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const activeView = document.getElementById(`view-${viewName}`);
  if (activeView) activeView.classList.add('active');

  // Load data for the view
  if (viewName === 'dashboard') loadDashboard();
  if (viewName === 'orders') loadOrders();
  if (viewName === 'prices') renderPriceList();

  // Close mobile menu
  document.getElementById('sidebar').classList.remove('open');
}

// ═══════════════════════════════════════════════════════════
// MOBILE MENU
// ═══════════════════════════════════════════════════════════
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const sidebar = document.getElementById('sidebar');

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close sidebar when clicking outside
  document.getElementById('main-content').addEventListener('click', () => {
    sidebar.classList.remove('open');
  });
}

// ═══════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════
async function checkHealth() {
  try {
    const res = await fetch(`${API}/api/health`);
    const data = await res.json();
    const label = document.getElementById('storage-label');
    label.textContent = data.status === 'ok' ? 'System Online' : 'Offline';
  } catch {
    document.getElementById('storage-label').textContent = 'Offline';
  }
}

// ═══════════════════════════════════════════════════════════
// PRICES
// ═══════════════════════════════════════════════════════════
async function loadPrices() {
  try {
    const res = await fetch(`${API}/api/prices`);
    const data = await res.json();
    garmentPrices = data.prices;
    addGarmentRow(); // Add first row after prices loaded
  } catch (err) {
    showToast('Failed to load prices', 'error');
  }
}

function renderPriceList() {
  const grid = document.getElementById('price-grid');
  grid.innerHTML = Object.entries(garmentPrices)
    .map(([name, price]) => `
      <div class="price-item">
        <span class="price-item-name">${name}</span>
        <span class="price-item-value">₹${price}</span>
      </div>
    `).join('');
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
async function loadDashboard() {
  try {
    const res = await fetch(`${API}/api/dashboard`);
    const data = await res.json();

    document.getElementById('stat-total-orders').textContent = data.totalOrders;
    document.getElementById('stat-revenue').textContent = `₹${data.totalRevenue.toLocaleString()}`;
    document.getElementById('stat-received').textContent = data.ordersByStatus?.RECEIVED || 0;
    document.getElementById('stat-processing').textContent = data.ordersByStatus?.PROCESSING || 0;
    document.getElementById('stat-ready').textContent = data.ordersByStatus?.READY || 0;
    document.getElementById('stat-delivered').textContent = data.ordersByStatus?.DELIVERED || 0;

    renderRecentOrders(data.recentOrders || []);
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('recent-orders-body');

  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No orders yet. Create your first order! 📋</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.orderId}</strong></td>
      <td>${o.customerName}</td>
      <td>${o.garments.length} type(s)</td>
      <td>₹${o.totalAmount.toLocaleString()}</td>
      <td><span class="status-badge status-${o.status}">${o.status}</span></td>
      <td>${formatDate(o.createdAt)}</td>
    </tr>
  `).join('');
}

// ═══════════════════════════════════════════════════════════
// ORDER FORM
// ═══════════════════════════════════════════════════════════
function initOrderForm() {
  document.getElementById('add-garment-btn').addEventListener('click', addGarmentRow);
  document.getElementById('order-form').addEventListener('submit', submitOrder);
  document.getElementById('modal-close-btn').addEventListener('click', () => {
    document.getElementById('order-success-modal').classList.remove('show');
  });
}

function addGarmentRow() {
  garmentRowCount++;
  const container = document.getElementById('garment-rows');
  const row = document.createElement('div');
  row.className = 'garment-row';
  row.id = `garment-row-${garmentRowCount}`;

  const garmentOptions = Object.keys(garmentPrices)
    .map(g => `<option value="${g}">${g} — ₹${garmentPrices[g]}</option>`)
    .join('');

  row.innerHTML = `
    <div class="form-group">
      <label>Garment Type</label>
      <select class="garment-type" onchange="updateRowPrice(this)">
        ${garmentOptions}
      </select>
    </div>
    <div class="form-group">
      <label>Qty</label>
      <input type="number" class="garment-qty" value="1" min="1" onchange="updateSummary()" oninput="updateSummary()">
    </div>
    <div class="form-group">
      <label>Price</label>
      <input type="number" class="garment-price" value="${Object.values(garmentPrices)[0] || 0}" readonly>
    </div>
    <button type="button" class="remove-garment" onclick="removeGarmentRow('garment-row-${garmentRowCount}')">✕</button>
  `;

  container.appendChild(row);
  updateSummary();
}

function removeGarmentRow(id) {
  const row = document.getElementById(id);
  if (row) {
    row.style.animation = 'fadeIn 0.2s ease reverse';
    setTimeout(() => {
      row.remove();
      updateSummary();
    }, 180);
  }
}

function updateRowPrice(select) {
  const row = select.closest('.garment-row');
  const priceInput = row.querySelector('.garment-price');
  priceInput.value = garmentPrices[select.value] || 0;
  updateSummary();
}

function updateSummary() {
  const rows = document.querySelectorAll('.garment-row');
  let totalItems = 0;
  let totalAmount = 0;

  rows.forEach(row => {
    const qty = parseInt(row.querySelector('.garment-qty')?.value) || 0;
    const price = parseInt(row.querySelector('.garment-price')?.value) || 0;
    totalItems += qty;
    totalAmount += qty * price;
  });

  document.getElementById('summary-items').textContent = totalItems;
  document.getElementById('summary-total').textContent = `₹${totalAmount.toLocaleString()}`;
}

async function submitOrder(e) {
  e.preventDefault();

  const customerName = document.getElementById('customer-name').value.trim();
  const phoneNumber = document.getElementById('phone-number').value.trim();
  const notes = document.getElementById('order-notes').value.trim();

  // Collect garments
  const rows = document.querySelectorAll('.garment-row');
  const garments = [];
  rows.forEach(row => {
    const type = row.querySelector('.garment-type')?.value;
    const qty = parseInt(row.querySelector('.garment-qty')?.value) || 0;
    if (type && qty > 0) {
      garments.push({ garmentType: type, quantity: qty });
    }
  });

  if (!customerName || !phoneNumber || garments.length === 0) {
    showToast('Please fill in all required fields and add at least one garment.', 'error');
    return;
  }

  const submitBtn = document.getElementById('submit-order-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...';

  try {
    const res = await fetch(`${API}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName, phoneNumber, garments, notes }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    // Show success modal
    const modal = document.getElementById('order-success-modal');
    const details = document.getElementById('modal-order-details');
    details.innerHTML = `
      <strong>Order ID:</strong> ${data.order.orderId}<br>
      <strong>Customer:</strong> ${data.order.customerName}<br>
      <strong>Phone:</strong> ${data.order.phoneNumber}<br>
      <strong>Total Amount:</strong> ₹${data.order.totalAmount.toLocaleString()}<br>
      <strong>Status:</strong> ${data.order.status}<br>
      <strong>Est. Delivery:</strong> ${formatDate(data.order.estimatedDelivery)}
    `;
    modal.classList.add('show');

    showToast(`Order ${data.order.orderId} created!`, 'success');

    // Reset form
    document.getElementById('order-form').reset();
    document.getElementById('garment-rows').innerHTML = '';
    garmentRowCount = 0;
    addGarmentRow();
    updateSummary();
  } catch (err) {
    showToast(err.message || 'Failed to create order', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Order';
  }
}

// ═══════════════════════════════════════════════════════════
// ORDERS LIST
// ═══════════════════════════════════════════════════════════
function initFilters() {
  document.getElementById('apply-filters-btn').addEventListener('click', loadOrders);
  document.getElementById('clear-filters-btn').addEventListener('click', () => {
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-customer').value = '';
    document.getElementById('filter-phone').value = '';
    document.getElementById('filter-garment').value = '';
    loadOrders();
  });

  // Enter key triggers search
  ['filter-customer', 'filter-phone', 'filter-garment'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loadOrders();
    });
  });
}

async function loadOrders() {
  try {
    const params = new URLSearchParams();
    const status = document.getElementById('filter-status').value;
    const customer = document.getElementById('filter-customer').value;
    const phone = document.getElementById('filter-phone').value;
    const garment = document.getElementById('filter-garment').value;

    if (status) params.set('status', status);
    if (customer) params.set('customer', customer);
    if (phone) params.set('phone', phone);
    if (garment) params.set('garmentType', garment);

    const res = await fetch(`${API}/api/orders?${params.toString()}`);
    const data = await res.json();

    renderOrdersTable(data.orders || []);
  } catch (err) {
    console.error('Load orders error:', err);
    showToast('Failed to load orders', 'error');
  }
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('orders-body');

  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No orders found matching your filters.</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const statusOptions = ['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED']
      .map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`)
      .join('');

    const garmentSummary = o.garments
      .map(g => `${g.quantity}× ${g.garmentType}`)
      .join(', ');

    return `
      <tr>
        <td><strong>${o.orderId}</strong></td>
        <td>${o.customerName}</td>
        <td>${o.phoneNumber}</td>
        <td title="${garmentSummary}">${garmentSummary.length > 30 ? garmentSummary.substring(0, 30) + '…' : garmentSummary}</td>
        <td>₹${o.totalAmount.toLocaleString()}</td>
        <td>
          <select class="status-select" onchange="updateStatus('${o.orderId}', this.value)">
            ${statusOptions}
          </select>
        </td>
        <td>${o.estimatedDelivery ? formatDate(o.estimatedDelivery) : '—'}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteOrder('${o.orderId}')">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateStatus(orderId, status) {
  try {
    const res = await fetch(`${API}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(`${orderId} → ${status}`, 'success');
  } catch (err) {
    showToast(err.message || 'Failed to update status', 'error');
    loadOrders(); // Reload to reset the select
  }
}

async function deleteOrder(orderId) {
  if (!confirm(`Delete order ${orderId}? This cannot be undone.`)) return;

  try {
    const res = await fetch(`${API}/api/orders/${orderId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(`Order ${orderId} deleted`, 'info');
    loadOrders();
  } catch (err) {
    showToast(err.message || 'Failed to delete order', 'error');
  }
}

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 280);
  }, 3000);
}

// Make functions globally accessible for inline event handlers
window.updateRowPrice = updateRowPrice;
window.updateSummary = updateSummary;
window.removeGarmentRow = removeGarmentRow;
window.updateStatus = updateStatus;
window.deleteOrder = deleteOrder;
