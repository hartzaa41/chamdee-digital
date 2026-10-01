const STORAGE_KEY = 'chamdee-store-v1';

const seedData = {
  products: [
    { id: 'water', name: 'น้ำดื่ม 600 มล.', category: 'เครื่องดื่ม', stock: 45, sold: 5, reorder: 12, price: 7 },
    { id: 'noodles', name: 'บะหมี่กึ่งสำเร็จรูป', category: 'อาหารแห้ง', stock: 2, sold: 18, reorder: 5, price: 7 },
    { id: 'snack', name: 'ขนมขบเคี้ยว', category: 'ขนม', stock: 8, sold: 12, reorder: 8, price: 15 },
    { id: 'milk', name: 'นมกล่อง', category: 'เครื่องดื่ม', stock: 22, sold: 8, reorder: 8, price: 13 },
    { id: 'soap', name: 'สบู่ก้อน', category: 'ของใช้', stock: 4, sold: 6, reorder: 6, price: 25 },
    { id: 'rice', name: 'ข้าวสารถุงเล็ก', category: 'อาหารแห้ง', stock: 16, sold: 4, reorder: 5, price: 48 },
    { id: 'egg', name: 'ไข่ไก่ 10 ฟอง', category: 'อาหารสด', stock: 26, sold: 3, reorder: 6, price: 45 },
    { id: 'tissue', name: 'กระดาษทิชชู', category: 'ของใช้', stock: 14, sold: 2, reorder: 5, price: 32 }
  ],
  sales: [
    { id: 1, productId: 'water', quantity: 2, price: 7, total: 14, date: todayISO(), timestamp: Date.now() - 1000 * 60 * 45 },
    { id: 2, productId: 'snack', quantity: 1, price: 15, total: 15, date: todayISO(), timestamp: Date.now() - 1000 * 60 * 70 },
    { id: 3, productId: 'milk', quantity: 3, price: 13, total: 39, date: todayISO(), timestamp: Date.now() - 1000 * 60 * 105 },
    { id: 4, productId: 'noodles', quantity: 2, price: 7, total: 14, date: dateOffset(-1), timestamp: Date.now() - 1000 * 60 * 60 * 25 },
    { id: 5, productId: 'water', quantity: 6, price: 7, total: 42, date: dateOffset(-1), timestamp: Date.now() - 1000 * 60 * 60 * 26 },
    { id: 6, productId: 'soap', quantity: 2, price: 25, total: 50, date: dateOffset(-2), timestamp: Date.now() - 1000 * 60 * 60 * 49 },
    { id: 7, productId: 'snack', quantity: 5, price: 15, total: 75, date: dateOffset(-3), timestamp: Date.now() - 1000 * 60 * 60 * 73 },
    { id: 8, productId: 'rice', quantity: 2, price: 48, total: 96, date: dateOffset(-4), timestamp: Date.now() - 1000 * 60 * 60 * 97 },
    { id: 9, productId: 'milk', quantity: 2, price: 13, total: 26, date: dateOffset(-5), timestamp: Date.now() - 1000 * 60 * 60 * 121 },
    { id: 10, productId: 'water', quantity: 4, price: 7, total: 28, date: dateOffset(-6), timestamp: Date.now() - 1000 * 60 * 60 * 145 }
  ]
};

let state = loadState();
let activeView = 'dashboard';

function todayISO() { return new Date().toISOString().slice(0, 10); }
function dateOffset(days) { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); }
function loadState() { try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : structuredClone(seedData); } catch { return structuredClone(seedData); } }
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function money(value) { return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value || 0); }
function moneyTwo(value) { return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0); }
function getProduct(id) { return state.products.find((product) => product.id === id); }
function statusFor(product) { if (product.stock <= Math.max(2, product.reorder / 2)) return { key: 'danger', label: 'ควรสั่งเพิ่ม' }; if (product.stock <= product.reorder) return { key: 'warning', label: 'ใกล้หมด' }; return { key: 'normal', label: 'ปกติ' }; }
function showToast(message) { const toast = document.getElementById('toast'); document.getElementById('toastMessage').textContent = message; toast.classList.add('visible'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600); }
function formatDate(dateString) { return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${dateString}T00:00:00`)); }
function formatTime(timestamp) { return new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp)); }

function render() { renderDashboard(); renderSales(); renderInventory(); populateProductSelects(); updateViewLabel(); }
function renderDashboard() {
  const today = todayISO(); const todaysSales = state.sales.filter((sale) => sale.date === today); const revenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0); const low = state.products.filter((product) => statusFor(product).key !== 'normal');
  document.getElementById('todayRevenue').textContent = money(revenue); document.getElementById('todayOrders').textContent = todaysSales.length; document.getElementById('todayOrderCount').textContent = `${todaysSales.length} รายการ`; document.getElementById('lowStockCount').textContent = low.length; document.getElementById('productCount').textContent = state.products.length;
  renderChart(); renderBestSellers(); renderAlerts(low);
}
function renderChart() { const chart = document.getElementById('salesChart'); const days = Array.from({ length: 7 }, (_, index) => dateOffset(index - 6)); const totals = days.map((date) => state.sales.filter((sale) => sale.date === date).reduce((sum, sale) => sum + sale.total, 0)); const max = Math.max(1000, ...totals); chart.innerHTML = totals.map((total, index) => `<div class="bar-col"><div class="bar ${index === 6 ? 'today' : ''}" style="height:${Math.max(3, total / max * 100)}%" title="${money(total)}"></div><label>${new Intl.DateTimeFormat('th-TH', { weekday: 'short' }).format(new Date(`${days[index]}T00:00:00`)).replace('วัน', '')}</label></div>`).join(''); }
function renderBestSellers() { const totals = state.products.map((product) => ({ ...product, soldNow: state.sales.filter((sale) => sale.productId === product.id).reduce((sum, sale) => sum + sale.quantity, 0) })).sort((a, b) => b.soldNow - a.soldNow).slice(0, 4); const max = Math.max(1, totals[0]?.soldNow || 1); document.getElementById('bestSellers').innerHTML = totals.map((product, index) => `<div class="best-row"><span class="rank">0${index + 1}</span><div><div class="best-name">${product.name}</div><div class="progress-track"><div class="progress-fill" style="width:${product.soldNow / max * 100}%"></div></div></div><span class="best-count">${product.soldNow} ชิ้น</span></div>`).join(''); }
function renderAlerts(products) { const target = document.getElementById('stockAlerts'); if (!products.length) { target.innerHTML = '<div class="empty-state">ตอนนี้สต็อกทุกอย่างอยู่ในระดับปกติ</div>'; return; } target.innerHTML = products.slice(0, 3).map((product) => `<div class="stock-alert"><div><strong>${product.name}</strong><small>${statusFor(product).label}</small></div><span class="remaining">${product.stock} ชิ้น</span></div>`).join(''); }
function renderSales() { const target = document.getElementById('recentSales'); const sales = [...state.sales].sort((a, b) => b.timestamp - a.timestamp).slice(0, 7); if (!sales.length) { target.innerHTML = '<div class="empty-state">ยังไม่มีรายการขาย ลองบันทึกรายการแรกได้เลย</div>'; return; } target.innerHTML = sales.map((sale) => { const product = getProduct(sale.productId); return `<div class="recent-sale"><div><strong>${product?.name || 'สินค้าไม่พบ'}</strong><small>${sale.quantity} ชิ้น · ${sale.date === todayISO() ? `วันนี้ ${formatTime(sale.timestamp)}` : formatDate(sale.date)}</small></div><span class="sale-amount">${money(sale.total)}</span></div>`; }).join(''); }
function renderInventory() { const keyword = document.getElementById('inventorySearch')?.value?.trim().toLowerCase() || ''; const products = state.products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(keyword)); document.getElementById('inventoryBody').innerHTML = products.map((product) => { const status = statusFor(product); return `<tr><td>${product.name}</td><td>${product.category}</td><td>${product.stock + product.sold}</td><td>${product.sold}</td><td><strong>${product.stock}</strong> ชิ้น</td><td><span class="stock-status ${status.key}">${status.label}</span></td><td><button class="table-action" data-add-stock="${product.id}">+ รับเข้า</button></td></tr>`; }).join('') || '<tr><td colspan="7"><div class="empty-state">ไม่พบสินค้าที่ค้นหา</div></td></tr>'; }
function populateProductSelects() { const select = document.getElementById('saleProduct'); const stockSelect = document.getElementById('stockProduct'); const options = state.products.map((product) => `<option value="${product.id}">${product.name} — ${money(product.price)}</option>`).join(''); if (select && select.innerHTML !== options) select.innerHTML = options; if (stockSelect && stockSelect.innerHTML !== options) stockSelect.innerHTML = options; if (select?.value) updatePriceFromProduct(); }
function updatePriceFromProduct() { const product = getProduct(document.getElementById('saleProduct').value); if (product) { document.getElementById('salePrice').value = product.price; updateSaleTotal(); } }
function updateSaleTotal() { const qty = Number(document.getElementById('saleQuantity').value) || 0; const price = Number(document.getElementById('salePrice').value) || 0; document.getElementById('saleTotal').textContent = moneyTwo(qty * price); }
function switchView(view) { activeView = view; document.querySelectorAll('.view').forEach((section) => section.classList.toggle('active', section.id === `${view}View`)); document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === view)); updateViewLabel(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function updateViewLabel() { const labels = { dashboard: 'ภาพรวมร้าน', sales: 'บันทึกยอดขาย', inventory: 'สต็อกสินค้า' }; document.getElementById('viewLabel').textContent = labels[activeView]; }
function openStockModal(productId) { document.getElementById('stockModal').hidden = false; if (productId) document.getElementById('stockProduct').value = productId; document.getElementById('stockQuantity').focus(); }
function closeStockModal() { document.getElementById('stockModal').hidden = true; }

document.addEventListener('click', (event) => { const viewButton = event.target.closest('[data-view]'); if (viewButton) switchView(viewButton.dataset.view); const addButton = event.target.closest('[data-add-stock]'); if (addButton) openStockModal(addButton.dataset.addStock); });
document.getElementById('saleProduct').addEventListener('change', updatePriceFromProduct); document.getElementById('saleQuantity').addEventListener('input', updateSaleTotal); document.getElementById('salePrice').addEventListener('input', updateSaleTotal); document.getElementById('inventorySearch').addEventListener('input', renderInventory);
document.getElementById('saleForm').addEventListener('submit', (event) => { event.preventDefault(); const product = getProduct(document.getElementById('saleProduct').value); const quantity = Number(document.getElementById('saleQuantity').value); const price = Number(document.getElementById('salePrice').value); if (!product || quantity < 1 || price < 0) return; product.stock = Math.max(0, product.stock - quantity); product.sold += quantity; state.sales.push({ id: Date.now(), productId: product.id, quantity, price, total: quantity * price, date: todayISO(), timestamp: Date.now() }); saveState(); render(); document.getElementById('saleForm').reset(); document.getElementById('saleQuantity').value = 1; updatePriceFromProduct(); showToast(`บันทึก ${product.name} แล้ว`); });
document.getElementById('openAddStock').addEventListener('click', () => openStockModal()); document.getElementById('closeStockModal').addEventListener('click', closeStockModal); document.getElementById('stockModal').addEventListener('click', (event) => { if (event.target.id === 'stockModal') closeStockModal(); });
document.getElementById('stockForm').addEventListener('submit', (event) => { event.preventDefault(); const product = getProduct(document.getElementById('stockProduct').value); const quantity = Number(document.getElementById('stockQuantity').value); if (!product || quantity < 1) return; product.stock += quantity; saveState(); render(); closeStockModal(); showToast(`${product.name} เพิ่มเข้า ${quantity} ชิ้น`); });
document.getElementById('resetData').addEventListener('click', () => { if (window.confirm('ต้องการรีเซ็ตกลับเป็นข้อมูลตัวอย่างหรือไม่?')) { state = structuredClone(seedData); saveState(); render(); showToast('รีเซ็ตข้อมูลตัวอย่างแล้ว'); } });
document.getElementById('todayLabel').textContent = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(new Date());
render();
