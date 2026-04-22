/**
 * Admin Product & Challenge Management - Professional Grade
 */
import ApiService from '../services/api.js';
import AuthService from '../services/auth.js';
import { formatCurrency } from '../utils/formatter.js';

class AdminPage {
  constructor() {
    if (!AuthService.isAdmin()) {
      window.location.hash = '#home';
      return;
    }
    this.container = document.getElementById('app');
    this.products = [];
    this.categories = [];
    this.orders = [];
    this.challengeSubmissions = [];
    this.stats = null;
    this.pendingImages = []; // staged File objects for upload

    // Check if we should start on specific tab based on hash only if it starts with #admin or #dashboard
    const h = window.location.hash;
    if (h === '#dashboard') this.activeTab = 'dashboard';
    else if (h === '#admin-orders') this.activeTab = 'orders';
    else if (h === '#admin-challenges') this.activeTab = 'challenges';
    else if (h === '#admin') this.activeTab = 'inventory';
    else this.activeTab = 'dashboard';

    this.isEditing = false;
    this.editingId = null;
    this.init();
  }

  async init() {
    this.container.innerHTML = '<div class="loader">Memulihkan koneksi data manajemen...</div>';

    const user = AuthService.getCurrentUser();
    const userId = user ? user.id : 0;

    try {
      // Parallel fetches with error handling for each
      const fetches = [
        ApiService.getProductsForAdmin().catch(e => { console.error("Inv Fail:", e); return []; }),
        ApiService.getOrders(userId, true).then(res => res?.orders || []).catch(e => { console.error("Orders Fail:", e); return []; }),
        ApiService.getAdminChallengeSubmissions().then(res => res?.submissions || (Array.isArray(res) ? res : [])).catch(e => { console.error("Challenges Fail:", e); return []; }),
        fetch('../api/challenges.php?action=admin_all_challenges', { credentials: 'include' }).then(r => r.json()).catch(e => []), // Fetch ALL challenges for admin
        fetch('../api/admin_actions.php?action=get_stats', { credentials: 'include' }).then(r => r.json()).then(d => d.success ? d.stats : null).catch(e => { console.error("Stats Fail:", e); return null; }),
        fetch('../api/categories.php').then(r => r.json()).then(d => d.categories || []).catch(e => [])
      ];

      const [products, orders, submissions, allChallenges, stats, categories] = await Promise.all(fetches);
      console.log("Admin Challenges Data:", allChallenges);
      
      this.products = products;
      this.orders = orders;
      this.challengeSubmissions = submissions;
      this.allChallenges = allChallenges;
      this.stats = stats;
      this.categories = categories;

      this.render();
      this.addEventListeners();
    } catch (err) {
      console.error("Admin Recovery Error:", err);
      this.container.innerHTML = '<div class="error-msg">Gagal menghubungkan ke database. Periksa koneksi API.</div>';
    }
  }

  render() {
    const user = AuthService.getCurrentUser() || {};
    this.container.innerHTML = `
      <div class="admin-layout">
        <!-- Overlay Backdrop for Mobile Sidebar -->
        <div class="admin-overlay" id="admin-sidebar-overlay"></div>
        
        <!-- Sidebar Navigation -->
        <aside class="admin-sidebar">
          <div class="sidebar-header">
            <div class="sidebar-brand">
              <span class="logo">🌿</span>
              <h3>EcoDaily <span>Admin</span></h3>
            </div>
          </div>
          
          <div class="sidebar-user">
            <div class="s-user-avatar">
              ${user.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div class="s-user-info">
              <p>${user.name || 'Admin'}</p>
              <span>System Administrator</span>
            </div>
          </div>

          <nav class="sidebar-nav">
            <button class="s-nav-item ${this.activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
              <span class="icon">📊</span> Insights Dashboard
            </button>
            <button class="s-nav-item ${this.activeTab === 'inventory' ? 'active' : ''}" data-tab="inventory">
              <span class="icon">📦</span> Product Inventory
            </button>
            <button class="s-nav-item ${this.activeTab === 'orders' ? 'active' : ''}" data-tab="orders">
              <span class="icon">🛒</span> Customer Orders
            </button>
            <button class="s-nav-item ${this.activeTab === 'challenges' ? 'active' : ''}" data-tab="challenges">
              <span class="icon">🌿</span> Eco Verifications
            </button>
            <hr style="margin: 10px 0; border: none; border-top: 1px solid #f1f5f9;">
            <a href="#home" class="s-nav-item">
              <span class="icon">🏠</span> Back to Website
            </a>
          </nav>

          <div class="sidebar-footer" style="padding: 15px;">
            <button id="btn-admin-logout-sidebar" class="logout-link-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout Session
            </button>
          </div>
        </aside>

        <!-- Main Content Area -->
        <div class="admin-main-wrap">
          <header class="admin-header">
            <div class="header-left">
              <button id="admin-sidebar-toggle" class="admin-mobile-btn">☰</button>
              <div class="header-search desktop-only">
                <span style="position:absolute; left:15px; top:50%; transform:translateY(-50%); color:#94a3b8;">🔍</span>
                <input type="text" placeholder="Search data management...">
              </div>
            </div>
            <div class="header-actions">
              <span class="date-now" style="font-weight:600; color:#64748b;">${new Date().toLocaleDateString('id-ID', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
          </header>

          <main class="admin-body">
            <div class="admin-content-header" style="margin-bottom: 30px;">
               <h2 style="font-size: 1.75rem; color: #1e293b; font-weight: 800;">
                 ${this.activeTab === 'dashboard' ? 'Insights & Analytics' :
                   this.activeTab === 'inventory' ? 'Inventory Management' :
                   this.activeTab === 'orders' ? 'Order Processing' : 'Eco Challenge Verifications'}
               </h2>
               <p style="color: #64748b; margin-top: 5px;">Manage your eco-friendly campus operations with precision.</p>
            </div>

            ${this.activeTab === 'dashboard' ? this.renderInsights() :
              this.activeTab === 'inventory' ? this.renderInventory() :
              this.activeTab === 'orders' ? this.renderOrders() :
              this.renderChallenges()}
          </main>
        </div>
      </div>

      <!-- Detail Modal -->
      <div id="detail-modal" class="modal-overlay">
        <div class="modal-card detail-card">
          <div class="modal-header">
            <h3 id="detail-modal-title">Detail Informasi</h3>
            <button class="btn-close-detail">✕</button>
          </div>
          <div id="detail-modal-body" class="detail-modal-body"></div>
        </div>
      </div>

      <!-- Challenge Modal -->
      <div class="modal-overlay" id="challenge-modal">
        <div class="modal-content large">
          <div class="modal-header">
            <h3>Buat Tantangan Baru 🌱</h3>
            <button class="btn-icon btn-close-c-modal">✕</button>
          </div>
          <form id="form-add-challenge">
            <div class="modal-body">
              <div class="form-grid">
                <div class="form-group span-2">
                  <label>Judul Tantangan</label>
                  <input type="text" name="title" placeholder="e.g. Satu Hari Tanpa Plastik" required>
                </div>
                <div class="form-group">
                  <label>Tingkat Kesulitan</label>
                  <select name="difficulty">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Reward (Eco Points)</label>
                  <input type="number" name="reward_points" value="50" required>
                </div>
                <div class="form-group span-2">
                  <label>Deskripsi & Instruksi</label>
                  <textarea name="description" rows="3" placeholder="Jelaskan apa yang harus dilakukan mahasiswa..." required></textarea>
                </div>
              </div>
            </div>
            <div class="form-footer">
              <button type="button" class="btn btn-text btn-close-c-modal">Batal</button>
              <button type="submit" class="btn btn-primary">Terbitkan Challenge</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Product Modal -->
      <div id="product-modal" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <div>
               <h3 id="modal-title">Tambah Produk Baru</h3>
               <p id="modal-subtitle">Informasi produk ramah lingkungan.</p>
            </div>
            <button class="btn-close-modal">✕</button>
          </div>
          <form id="product-form" class="pro-form">
            <input type="hidden" name="action" id="form-action" value="add_product">
            <input type="hidden" name="id" id="product-id">
            <div class="form-grid">
              <div class="form-group span-2">
                <label>Nama Produk</label>
                <input type="text" name="name" id="field-name" required>
              </div>
              <div class="form-group">
                <label>Kategori</label>
                <select name="category_id" id="field-category" required>
                  <option value="">Pilih</option>
                  ${this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Eco Points</label>
                <input type="number" name="eco_points" id="field-eco" value="50" required>
              </div>
              <div class="form-group">
                <label>Harga (IDR)</label>
                <input type="number" name="price" id="field-price" required>
              </div>
              <div class="form-group">
                <label>Stok</label>
                <input type="number" name="stock" id="field-stock" required>
              </div>
              <div class="form-group span-2">
                <label>Foto Produk <small style="color:#9ca3af;font-weight:400">(Maks 5 foto — klik atau drag &amp; drop)</small></label>
                <div class="upload-zone" id="upload-area">
                  <div class="upload-zone-placeholder" id="upload-placeholder">
                    <span style="font-size:2rem">📷</span>
                    <p>Klik untuk pilih foto atau drag &amp; drop di sini</p>
                    <p style="font-size:0.75rem;color:#6b7280">JPG, PNG, WEBP — Maks 5 foto</p>
                  </div>
                  <div class="multi-img-preview" id="multi-img-preview"></div>
                  <input type="file" name="images[]" id="img-file-input" accept="image/*" multiple class="file-hidden">
                </div>
                <div id="existing-images-wrap" style="margin-top:8px"></div>
              </div>
              <div class="form-group span-2">
                <label>Deskripsi</label>
                <textarea name="description" id="field-desc" rows="3" required></textarea>
              </div>
            </div>
            <div class="form-footer">
              <button type="button" class="btn btn-text btn-close-modal">Batal</button>
              <button type="submit" class="btn btn-primary" id="btn-submit-product">Simpan</button>
            </div>
          </form>
        </div>
      </div>
      
      <div id="toast-container"></div>
    `;
  }

  renderInsights() {
    const stats = this.stats || {};
    const recentReviews = stats.recent_reviews || [];
    const recentTestimonials = stats.recent_testimonials || [];

    return `
      <div class="insights-container">
        <div class="stats-overview-grid">
           <div class="stat-insight-card">
              <div class="s-icon purple">💰</div>
              <div class="s-data">
                <span class="s-label">Total Revenue</span>
                <h3 class="s-value">${formatCurrency(stats.total_revenue || 0)}</h3>
                <span class="s-trend ${stats.revenue_trend >= 0 ? 'up' : 'down'}">
                  ${stats.revenue_trend >= 0 ? '↑' : '↓'} ${Math.abs(stats.revenue_trend)}% vs last month
                </span>
              </div>
           </div>
           <div class="stat-insight-card">
              <div class="s-icon green">📦</div>
              <div class="s-data">
                <span class="s-label">Total Orders</span>
                <h3 class="s-value">${stats.total_orders || 0}</h3>
                <span class="s-trend ${stats.orders_trend >= 0 ? 'up' : 'down'}">
                  ${stats.orders_trend >= 0 ? '↑' : '↓'} ${Math.abs(stats.orders_trend)}% vs last month
                </span>
              </div>
           </div>
           <div class="stat-insight-card">
              <div class="s-icon orange">👥</div>
              <div class="s-data">
                <span class="s-label">Active Students</span>
                <h3 class="s-value">${stats.total_users || 0}</h3>
                <span class="s-trend up">↑ ${stats.new_users_week || 0} new this week</span>
              </div>
           </div>
           <div class="stat-insight-card">
              <div class="s-icon blue">♻️</div>
              <div class="s-data">
                <span class="s-label">Waste Saved</span>
                <h3 class="s-value">${parseFloat(stats.total_waste_saved || 0).toFixed(1)} Kg</h3>
                <span class="s-trend up">↑ Real Eco Impact</span>
              </div>
           </div>
        </div>

        <div class="dash-main-grid insights-grid">
           <div class="dash-card">
              <div class="card-header">
                <h3>Ulasan Produk Terbaru</h3>
                <div class="card-badge">
                  <span class="badge-label">Avg. Rating:</span>
                  <span class="badge-value">⭐ ${stats.avg_product_rating || 0}</span>
                  <span class="badge-count">(${stats.total_reviews || 0} ulasan)</span>
                </div>
              </div>
              <div class="f-list">
                 ${recentReviews.length > 0 ? recentReviews.map(r => `
                    <div class="mini-feedback">
                       <div class="mf-head"><strong>${r.name}</strong> <span>${'⭐'.repeat(r.rating)}</span></div>
                       <p class="mf-prod">${r.product_name}</p>
                       <p class="mf-comment">"${r.comment}"</p>
                    </div>
                 `).join('') : '<div class="text-center py-4 text-muted">Belum ada ulasan.</div>'}
              </div>
           </div>
           <div class="dash-card">
              <div class="card-header">
                <h3>Web Feedback</h3>
                <div class="card-badge">
                  <span class="badge-label">Avg. Rating:</span>
                  <span class="badge-value">⭐ ${stats.avg_site_rating || 0}</span>
                  <span class="badge-count">(${stats.total_testimonials || 0} feedback)</span>
                </div>
              </div>
              <div class="f-list">
                 ${recentTestimonials.length > 0 ? recentTestimonials.map(t => `
                    <div class="mini-feedback site-f">
                       <div class="mf-head"><strong>${t.name}</strong> <span>${'⭐'.repeat(t.rating)}</span></div>
                       <p class="mf-prodi">${t.prodi || 'Mahasiswa'} • ${t.class_code || '-'}</p>
                       <p class="mf-comment">"${t.comment}"</p>
                    </div>
                 `).join('') : '<div class="text-center py-4 text-muted">Belum ada feedback.</div>'}
              </div>
           </div>
        </div>
      </div>
    `;
  }

  renderInventory() {
    const products = this.products || [];
    return `
      <div class="inventory-card">
        <div class="card-header">
           <h3>Manajemen Inventory</h3>
           <button class="btn btn-primary" id="btn-open-modal">+ Produk</button>
        </div>
        <div class="table-responsive">
          <table class="pro-table">
            <thead>
              <tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              ${products.length > 0 ? products.map(p => {
                const imgSrc = p.image || 'https://via.placeholder.com/50x50?text=No+Img';
                const imgCount = (p.images && p.images.length > 1) ? `<span class="img-count-badge">${p.images.length} foto</span>` : '';
                return `
                <tr>
                  <td data-label="Produk"><div class="td-product">
                    <div class="td-img-wrap">
                      <img src="${imgSrc}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/50x50?text=Err'">
                      ${imgCount}
                    </div>
                    <span>${p.name}</span>
                  </div></td>
                  <td data-label="Kategori"><span class="category-badge">${p.category || 'General'}</span></td>
                  <td data-label="Harga"><strong>${formatCurrency(p.price || 0)}</strong></td>
                  <td data-label="Stok"><span class="stock-indicator ${p.stock < 10 ? 'low-stock' : ''}">${p.stock} units</span></td>
                  <td data-label="Aksi">
                    <div class="action-btns">
                      <button class="btn-icon btn-edit" data-id="${p.id}">✏️</button>
                      <button class="btn-icon btn-delete" data-id="${p.id}">🗑️</button>
                    </div>
                  </td>
                </tr>`;
              }).join('') : '<tr><td colspan="5" class="text-center py-5">Kosong.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderOrders() {
    const orders = this.orders || [];
    return `
      <div class="orders-admin-card">
        <div class="card-header">
           <h3>Riwayat Pesanan Pelanggan</h3>
        </div>
        <div class="table-responsive">
          <table class="pro-table">
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              ${orders.length > 0 ? orders.map(o => `
                <tr>
                  <td data-label="Order ID"><strong>#ECO-${o.id}</strong></td>
                  <td data-label="Customer">${o.customer_name}</td>
                  <td data-label="Total">${formatCurrency(o.total_amount)}</td>
                  <td data-label="Status"><span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span></td>
                  <td data-label="Aksi">
                    <div class="action-btns horizontal">
                      <button class="btn btn-sm btn-outline btn-view-order" data-id="${o.id}">👁️ Detail</button>
                      <select class="status-select mini" data-id="${o.id}">
                        <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processed" ${o.status === 'processed' ? 'selected' : ''}>Processed</option>
                        <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="5" class="text-center py-5">Kosong.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderChallenges() {
    const subs = this.challengeSubmissions || [];
    const all = this.allChallenges?.challenges || this.allChallenges || [];
    
    return `
      <div class="challenges-dual-view">
        <!-- Active Challenges List -->
        <div class="dash-card">
          <div class="card-header">
            <h3>Daftar Challenge Aktif</h3>
            <button class="btn btn-primary btn-sm" id="btn-add-challenge">+ Challenge</button>
          </div>
          <div class="table-responsive">
            <table class="pro-table mini">
              <thead>
                <tr><th>Cover</th><th>Judul</th><th>Periode</th><th>Reward</th><th>Status</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                ${all.length > 0 ? all.map(c => `
                  <tr>
                    <td data-label="Cover"><img src="${c.image || 'https://via.placeholder.com/400x200?text=No+Cover'}" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;"></td>
                    <td data-label="Judul"><strong>${c.title}</strong></td>
                    <td data-label="Periode"><small>${c.start_date || 'N/A'} - ${c.end_date || 'N/A'}</small></td>
                    <td data-label="Reward"><span class="pts-badge">+${c.reward_points} Pts</span></td>
                    <td data-label="Status"><span class="status-badge status-${c.status === 'active' ? 'active' : 'inactive'}">${c.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td data-label="Aksi">
                      <div class="action-btns horizontal">
                         <button class="btn-icon btn-edit-challenge" data-id="${c.id}" title="Edit Challenge">✏️</button>
                         <button class="btn-icon btn-delete-challenge" data-id="${c.id}" title="Hapus Challenge">🗑️</button>
                      </div>
                    </td>
                  </tr>
                `).join('') : '<tr><td colspan="6">Belum ada challenge.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pending Verifications -->
        <div class="dash-card">
          <div class="card-header">
            <h3>Verifikasi Submission</h3>
          </div>
          <div class="table-responsive">
            <table class="pro-table mini">
              <thead>
                <tr><th>Mahasiswa</th><th>Tantangan</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                ${subs.length > 0 ? subs.map(s => `
                  <tr>
                    <td data-label="Mahasiswa"><strong>${s.user_name}</strong></td>
                    <td data-label="Tantangan">${s.challenge_title}</td>
                    <td data-label="Aksi">
                      <div class="action-btns horizontal">
                        <button class="btn-icon btn-view-challenge-detail" data-id="${s.id}" title="Lihat Bukti">👁️</button>
                        <button class="btn-icon btn-verify text-success" data-id="${s.id}" data-status="approved" title="Setujui">✅</button>
                        <button class="btn-icon btn-verify text-danger" data-id="${s.id}" data-status="rejected" title="Tolak">❌</button>
                      </div>
                    </td>
                  </tr>
                `).join('') : '<tr><td colspan="3" class="text-center py-4">Tidak ada verifikasi tertunda.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Add/Edit Challenge Modal -->
      <div id="challenge-modal" class="modal-overlay">
        <div class="modal-card challenge-modal-card">
          <div class="modal-header">
            <div class="h-title">
               <span class="h-icon">🌿</span>
               <h3>Buat Challenge Baru</h3>
            </div>
            <button class="btn-close-c-modal">✕</button>
          </div>
          <form id="form-add-challenge" class="pro-form">
            <input type="hidden" name="action" id="c-form-action" value="admin_add_challenge">
            <input type="hidden" name="id" id="c-form-id" value="">
            
            <div class="form-group">
              <label>Judul Challenge</label>
              <input type="text" name="title" id="c-field-title" placeholder="Contoh: Bawa Botol Minum Sendiri" required>
            </div>

            <div class="form-group">
              <label>Deskripsi & Instruksi</label>
              <textarea name="description" id="c-field-desc" placeholder="Jelaskan apa yang harus dilakukan mahasiswa untuk menyelesaikan tantangan ini..." required rows="4"></textarea>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Reward (Eco Points)</label>
                <div class="input-with-icon">
                  <span class="i-addon">💎</span>
                  <input type="number" name="reward_points" id="c-field-points" value="10" required>
                </div>
              </div>
              <div class="form-group">
                <label>Penyelamatan Sampah (Kg)</label>
                <div class="input-with-icon">
                  <span class="i-addon">♻️</span>
                  <input type="number" step="0.1" name="waste_saved" id="c-field-waste" value="0" required>
                </div>
              </div>
              <div class="form-group">
                <label>Tingkat Kesulitan</label>
                <select name="difficulty" id="c-field-difficulty">
                  <option value="easy">Easy (Santai)</option>
                  <option value="medium">Medium (Menengah)</option>
                  <option value="hard">Hard (Sulit)</option>
                </select>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Tanggal Mulai</label>
                <input type="date" name="start_date" id="c-field-start" class="pro-date-input">
              </div>
              <div class="form-group">
                <label>Tanggal Berakhir</label>
                <input type="date" name="end_date" id="c-field-end" class="pro-date-input">
              </div>
            </div>

            <div class="form-grid">
               <div class="form-group">
                 <label>Status Challenge</label>
                 <select name="status" id="c-field-status">
                   <option value="active">Aktif</option>
                   <option value="inactive">Nonaktif</option>
                 </select>
               </div>
               <div class="form-group">
                  <label>Gambar Cover (Opsional)</label>
                  <div class="file-drop-area">
                    <span class="fake-btn">Pilih</span>
                    <span class="file-msg">Ubah foto</span>
                    <input class="file-input" type="file" name="image" accept="image/*">
                  </div>
               </div>
            </div>

            <div class="form-actions" style="margin-top: 30px;">
              <button type="submit" class="btn btn-primary btn-full" id="btn-c-submit">🚀 Terbitkan Challenge</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    // Mobile Sidebar Toggle
    const toggleBtn = document.getElementById('admin-sidebar-toggle');
    const sidebar = this.container.querySelector('.admin-sidebar');
    const overlay = document.getElementById('admin-sidebar-overlay');
    
    if (toggleBtn && sidebar && overlay) {
      const toggleSidebar = () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
      };
      
      toggleBtn.onclick = toggleSidebar;
      overlay.onclick = toggleSidebar;
    }

    // Sidebar Tab switching
    this.container.querySelectorAll('button.s-nav-item').forEach(btn => {
      btn.onclick = () => {
        const tab = btn.dataset.tab;
        if (tab) {
          this.activeTab = tab;
          this.init();
          // Auto close sidebar and overlay on mobile
          if (window.innerWidth <= 768 && sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
          }
        }
      };
    });

    // Close sidebar when clicking outside on mobile
    this.container.onclick = (e) => {
      if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
        if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
          sidebar.classList.remove('active');
          overlay.classList.remove('active');
        }
      }
    };

    // Logout
    const logoutBtn = document.getElementById('btn-admin-logout-sidebar');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        if (confirm('Apakah Anda yakin ingin keluar dari Admin Portal? 🌿')) {
          AuthService.logout();
          window.location.hash = '#home';
          window.location.reload();
        }
      };
    }

    // Challenge Modal
    const challengeModal = document.getElementById('challenge-modal');
    document.getElementById('btn-add-challenge')?.addEventListener('click', () => {
      document.getElementById('c-form-action').value = 'admin_add_challenge';
      document.getElementById('c-form-id').value = '';
      document.getElementById('form-add-challenge').reset();
      document.querySelector('#challenge-modal h3').textContent = 'Buat Challenge Baru';
      document.getElementById('btn-c-submit').textContent = '🚀 Terbitkan Challenge';
      challengeModal.classList.add('active');
    });

    document.querySelectorAll('.btn-edit-challenge').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const challenges = Array.isArray(this.allChallenges) ? this.allChallenges : (this.allChallenges?.challenges || []);
        const c = challenges.find(item => item.id == id);
        if (!c) return;

        document.getElementById('c-form-action').value = 'admin_edit_challenge';
        document.getElementById('c-form-id').value = c.id;
        document.getElementById('c-field-title').value = c.title;
        document.getElementById('c-field-desc').value = c.description;
        document.getElementById('c-field-points').value = c.reward_points;
        document.getElementById('c-field-waste').value = c.waste_saved || 0;
        document.getElementById('c-field-difficulty').value = c.difficulty;
        document.getElementById('c-field-start').value = c.start_date || '';
        document.getElementById('c-field-end').value = c.end_date || '';
        document.getElementById('c-field-status').value = c.status || 'active';

        document.querySelector('#challenge-modal h3').textContent = 'Edit Challenge';
        document.getElementById('btn-c-submit').textContent = '💾 Simpan Perubahan';
        challengeModal.classList.add('active');
      };
    });

    document.querySelectorAll('.btn-close-c-modal').forEach(btn => btn.onclick = () => challengeModal.classList.remove('active'));

    document.getElementById('form-add-challenge')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      const res = await fetch('../api/challenges.php', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      }).then(r => r.json());

      if (res.success) {
        this.showToast('Challenge berhasil disimpan!');
        challengeModal.classList.remove('active');
        this.init();
      } else {
        alert('Gagal: ' + res.message);
      }
    });

    // Product Modal
    const productModal = document.getElementById('product-modal');

    const resetProductModal = () => {
      document.getElementById('product-form').reset();
      document.getElementById('multi-img-preview').innerHTML = '';
      document.getElementById('upload-placeholder').style.display = 'flex';
      document.getElementById('existing-images-wrap').innerHTML = '';
      this.pendingImages = [];
    };

    document.getElementById('btn-open-modal')?.addEventListener('click', () => {
      resetProductModal();
      this.isEditing = false;
      document.getElementById('modal-title').innerText = 'Tambah Produk Baru';
      document.getElementById('form-action').value = 'add_product';
      productModal.classList.add('active');
    });

    document.querySelectorAll('.btn-close-modal').forEach(btn => btn.onclick = () => {
      productModal.classList.remove('active');
      resetProductModal();
    });

    // ── Upload Zone ──────────────────────────────────────────────
    const uploadArea   = document.getElementById('upload-area');
    const fileInput    = document.getElementById('img-file-input');
    const previewWrap  = document.getElementById('multi-img-preview');
    const placeholder  = document.getElementById('upload-placeholder');

    const renderPreviews = () => {
      previewWrap.innerHTML = '';
      placeholder.style.display = this.pendingImages.length === 0 ? 'flex' : 'none';
      this.pendingImages.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const item = document.createElement('div');
          item.className = 'img-preview-item' + (idx === 0 ? ' is-primary' : '');
          item.innerHTML = `
            <img src="${ev.target.result}" alt="preview">
            ${idx === 0 ? '<span class="primary-badge">Utama</span>' : ''}
            <button type="button" class="remove-img-btn" data-idx="${idx}">✕</button>
          `;
          previewWrap.appendChild(item);
          item.querySelector('.remove-img-btn').onclick = () => {
            this.pendingImages.splice(idx, 1);
            renderPreviews();
          };
        };
        reader.readAsDataURL(file);
      });
    };

    uploadArea?.addEventListener('click', (e) => {
      if (!e.target.classList.contains('remove-img-btn')) fileInput.click();
    });

    uploadArea?.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
    uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea?.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      const slots = 5 - this.pendingImages.length;
      this.pendingImages.push(...newFiles.slice(0, slots));
      renderPreviews();
    });

    fileInput?.addEventListener('change', () => {
      const newFiles = Array.from(fileInput.files);
      const slots = 5 - this.pendingImages.length;
      this.pendingImages.push(...newFiles.slice(0, slots));
      if (this.pendingImages.length >= 5) this.showToast('Maks 5 foto tercapai', 'info');
      fileInput.value = '';
      renderPreviews();
    });

    // ── Form Submit ──────────────────────────────────────────────
    document.getElementById('product-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      // Remove old file input (name="images[]") and attach pending files properly
      formData.delete('images[]');
      this.pendingImages.forEach(file => formData.append('images[]', file));
      try {
        const res = await fetch('../api/admin_actions.php', { method: 'POST', body: formData });
        const result = await res.json();
        if (result.success) {
          this.showToast('Produk disimpan!');
          productModal.classList.remove('active');
          resetProductModal();
          this.init();
        } else {
          alert('Gagal: ' + (result.message || 'Unknown error'));
        }
      } catch (err) {
        alert('Koneksi gagal: ' + err.message);
      }
    });

    // ── Inventory Actions ────────────────────────────────────────
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.onclick = () => {
        const p = this.products.find(item => item.id == btn.dataset.id);
        if (!p) return;
        resetProductModal();
        this.isEditing = true;
        this.editingId = p.id;
        document.getElementById('modal-title').innerText = 'Edit Produk';
        document.getElementById('form-action').value = 'edit_product';
        document.getElementById('product-id').value = p.id;
        document.getElementById('field-name').value = p.name;
        document.getElementById('field-price').value = p.price;
        document.getElementById('field-stock').value = p.stock;
        document.getElementById('field-eco').value = p.ecoPoints || p.eco_points || 0;
        document.getElementById('field-desc').value = p.description || '';
        if (document.getElementById('field-category')) {
          document.getElementById('field-category').value = p.category_id || '';
        }
        // Show existing images
        const existingWrap = document.getElementById('existing-images-wrap');
        if (p.images && p.images.length > 0) {
          const remaining = 5 - p.images.length;
          existingWrap.innerHTML = `
            <p style="font-size:0.78rem;color:#6b7280;margin-bottom:6px">Foto tersimpan (${p.images.length}/5) — Tambah maks ${remaining} foto lagi:</p>
            <div class="existing-imgs-grid">
              ${p.images.map((url, i) => `
                <div class="existing-img-item">
                  <img src="${url}" onerror="this.src='https://via.placeholder.com/80?text=Err'">
                  <button type="button" class="remove-existing-btn" data-url="${url}" data-pid="${p.id}">✕</button>
                  ${i === 0 ? '<span class="primary-badge">Utama</span>' : ''}
                </div>
              `).join('')}
            </div>
          `;
          // Handle delete existing image
          existingWrap.querySelectorAll('.remove-existing-btn').forEach(b => {
            b.onclick = async () => {
              if (!confirm('Hapus foto ini?')) return;
              const fd = new FormData();
              fd.append('action', 'delete_product_image');
              fd.append('product_id', b.dataset.pid);
              fd.append('image_url', b.dataset.url);
              const r = await fetch('../api/admin_actions.php', { method: 'POST', body: fd });
              const rs = await r.json();
              if (rs.success) { this.showToast('Foto dihapus'); this.init(); productModal.classList.remove('active'); }
              else alert('Gagal hapus foto: ' + rs.message);
            };
          });
        } else {
          existingWrap.innerHTML = '<p style="font-size:0.78rem;color:#6b7280">Belum ada foto — tambah foto baru di atas.</p>';
        }
        productModal.classList.add('active');
      };
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Hapus produk ini?')) return;
        const res = await fetch('../api/admin_actions.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_product', id: btn.dataset.id })
        });
        const result = await res.json();
        if (result.success) { this.showToast('Produk dihapus'); this.init(); }
      };
    });

    // Verification
    document.querySelectorAll('.btn-verify').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const status = btn.dataset.status;
        let note = '';
        if (status === 'rejected') {
          note = prompt('Alasan Penolakan:');
          if (note === null) return; // Cancelled
        } else {
          if (!confirm('Setujui submission ini dan berikan poin kepada user?')) return;
        }
        
        const res = await ApiService.verifyChallengeSubmission(id, status, note);
        if (res.success) { 
          this.showToast(status === 'approved' ? 'Submission disetujui!' : 'Submission ditolak'); 
          this.init(); 
          document.getElementById('detail-modal').classList.remove('active');
        } else {
          alert('Gagal: ' + res.message);
        }
      };
    });

    document.querySelectorAll('.btn-view-challenge-detail').forEach(btn => {
      btn.onclick = () => this.openSubmissionDetail(btn.dataset.id);
    });

    document.querySelectorAll('.btn-delete-challenge').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Hapus challenge ini secara permanen?')) return;
        
        const res = await fetch('../api/challenges.php', {
          method: 'POST',
          body: JSON.stringify({ action: 'admin_delete_challenge', id: btn.dataset.id }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }).then(r => r.json());

        if (res.success) {
          this.showToast('Challenge berhasil dihapus');
          this.init();
        } else {
          alert('Gagal: ' + res.message);
        }
      };
    });

    // Logout
    const logoutAction = () => {
      if (confirm('Logout dari Admin Portal?')) {
        AuthService.logout();
        window.location.hash = '#login';
        window.location.reload();
      }
    };
    

    document.getElementById('btn-admin-logout-top')?.addEventListener('click', logoutAction);

    // Order View & Status
    document.querySelectorAll('.btn-view-order').forEach(btn => {
      btn.onclick = () => this.openOrderDetailModal(btn.dataset.id);
    });

    document.querySelectorAll('.status-select').forEach(select => {
      select.onchange = async () => {
        const orderId = select.dataset.id;
        const status = select.value;
        const res = await ApiService.updateOrderStatus(orderId, status);
        if (res.success) {
          this.showToast('Status pesanan diperbarui!');
          this.init();
        } else {
          alert('Gagal update status: ' + res.message);
        }
      };
    });

    // Close detail modal
    document.querySelector('.btn-close-detail')?.addEventListener('click', () => {
      document.getElementById('detail-modal').classList.remove('active');
    });
  }

  async openOrderDetailModal(orderId) {
    const modal = document.getElementById('detail-modal');
    const body = document.getElementById('detail-modal-body');
    const title = document.getElementById('detail-modal-title');
    
    title.innerText = `Detail Pesanan #ECO-${orderId}`;
    body.innerHTML = '<div class="loader">Memuat data pesanan...</div>';
    modal.classList.add('active');

    try {
      const res = await ApiService.getOrders(null, true);
      const orders = res.orders || [];
      const orderSummary = orders.find(o => o.id == orderId);
      
      const detailRes = await fetch(`../api/orders.php?order_id=${orderId}&admin_view=1`, { credentials: 'include' });
      const detailData = await detailRes.json();
      
      if (!detailData.success) throw new Error(detailData.message);
      
      const order = detailData.order;
      
      body.innerHTML = `
        <div class="order-detail-grid">
          <div class="order-info-section">
            <h4>Informasi Pelanggan</h4>
            <p><strong>Nama:</strong> ${order.customer_name || order.shipping_name}</p>
            <p><strong>Email:</strong> ${order.customer_email || '-'}</p>
            <p><strong>Telepon:</strong> ${order.shipping_phone}</p>
            <p><strong>Alamat:</strong> ${order.shipping_address}</p>
          </div>
          <div class="order-status-section">
            <h4>Status & Waktu</h4>
            <p><strong>Status Saat Ini:</strong> <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></p>
            <p><strong>Tanggal Order:</strong> ${new Date(order.created_at).toLocaleString('id-ID')}</p>
            <div class="status-update-box">
              <label>Update Status:</label>
              <select class="status-select-modal" id="modal-status-select">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="processed" ${order.status === 'processed' ? 'selected' : ''}>Processed</option>
                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
              <button class="btn btn-primary btn-sm" id="btn-update-status-modal">Update</button>
            </div>
          </div>
          <div class="order-items-section span-2">
            <h4>Daftar Produk</h4>
            <table class="simple-table">
              <thead>
                <tr><th>Produk</th><th>Harga</th><th>Qty</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td data-label="ID">${item.name}</td>
                    <td data-label="ID">${formatCurrency(item.price_at_purchase)}</td>
                    <td data-label="ID">${item.quantity}</td>
                    <td data-label="ID">${formatCurrency(item.price_at_purchase * item.quantity)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <th colspan="3" class="text-right">Total:</th>
                  <th>${formatCurrency(order.total_amount)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `;

      // Event for status update inside modal
      document.getElementById('btn-update-status-modal').onclick = async () => {
        const newStatus = document.getElementById('modal-status-select').value;
        const updateRes = await ApiService.updateOrderStatus(orderId, newStatus);
        if (updateRes.success) {
          this.showToast('Status diperbarui!');
          this.openOrderDetailModal(orderId); // Refresh modal
          this.init(); // Refresh list behind
        } else {
          alert('Gagal: ' + updateRes.message);
        }
      };

    } catch (err) {
      body.innerHTML = `<div class="error-msg">Gagal memuat detail: ${err.message}</div>`;
    }
  }

  openSubmissionDetail(subId) {
    const s = this.challengeSubmissions.find(item => item.id == subId);
    if (!s) return;

    const modal = document.getElementById('detail-modal');
    const body = document.getElementById('detail-modal-body');
    const title = document.getElementById('detail-modal-title');
    
    title.innerText = 'Verifikasi Bukti Challenge';
    body.innerHTML = `
      <div class="submission-detail-view">
        <div class="sub-proof-img">
          <img src="${s.proof_image}" alt="Bukti" onerror="this.src='https://via.placeholder.com/400?text=Foto+Tidak+Ditemukan'">
        </div>
        <div class="sub-info">
          <h4>${s.challenge_title}</h4>
          <p><strong>Pengirim:</strong> ${s.user_name}</p>
          <p><strong>Tanggal:</strong> ${new Date(s.created_at).toLocaleString('id-ID')}</p>
          <p><strong>Reward:</strong> ${s.reward_points} Pts</p>
          
          <div class="sub-actions" style="margin-top: 20px; display: flex; gap: 10px;">
            <button class="btn btn-primary btn-verify" data-id="${s.id}" data-status="approved">Setujui ✅</button>
            <button class="btn btn-outline text-danger btn-verify" data-id="${s.id}" data-status="rejected">Tolak ❌</button>
          </div>
        </div>
      </div>
    `;
    modal.classList.add('active');

    // Re-bind verify buttons inside modal
    body.querySelectorAll('.btn-verify').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const status = btn.dataset.status;
        let note = '';
        if (status === 'rejected') {
          note = prompt('Alasan Penolakan:');
          if (note === null) return;
        }
        const res = await ApiService.verifyChallengeSubmission(id, status, note);
        if (res.success) {
          this.showToast('Berhasil diproses');
          modal.classList.remove('active');
          this.init();
        } else {
          alert('Error: ' + res.message);
        }
      };
    });
  }

  showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} show`;
    toast.innerHTML = `<span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 3000);
  }
}

export default AdminPage;
