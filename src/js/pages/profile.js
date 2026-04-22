import AuthService from '../services/auth.js';
import ApiService from '../services/api.js';
import { formatCurrency } from '../utils/formatter.js';

class ProfilePage {
  constructor() {
    this.container = document.getElementById('app');
    this.user = AuthService.getCurrentUser();
    this.activeTab = 'summary';
    this.orders = [];
    this.impactData = null;
    this.init();
  }

  async init() {
    if (!AuthService.isLoggedIn()) {
      window.location.hash = '#login';
      return;
    }
    
    const urlParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
    const tabParam = urlParams.get('tab');

    if (tabParam) {
        this.activeTab = tabParam;
    } else {
        this.activeTab = 'summary';
    }
    
     if (this.activeTab === 'orders') {
        const res = await ApiService.getOrders(this.user.id);
        this.orders = res.orders || [];
     } else if (this.activeTab === 'challenges') {
        const res = await ApiService.getMyChallengeSubmissions();
        this.challenges = res.submissions || [];
     }
     
     // Fetch fresh impact data for stats
     this.impactData = await ApiService.getUserImpact();

     this.render();
     this.addTabListeners();
  }

  render() {
    this.container.innerHTML = `
      <section class="profile-section container">
        <div class="profile-layout">
          <aside class="profile-sidebar">
            <div class="sidebar-user-card">
              <div class="user-large-avatar" id="profile-avatar-display">
                ${this.user.avatar ? `<img src="${this.user.avatar}" alt="Avatar" class="avatar-img-circle">` : this.user.name.charAt(0).toUpperCase()}
              </div>
              <h2 class="u-name">${this.user.name}</h2>
              <p class="u-role-tag">${this.user.role.toUpperCase()}</p>
            </div>
            
            <nav class="profile-nav">
              <button class="p-nav-item ${this.activeTab === 'summary' ? 'active' : ''}" data-tab="summary">
                <span class="p-icon">🪪</span> <span class="p-text">Profile Card</span>
              </button>
              <button class="p-nav-item ${this.activeTab === 'edit' ? 'active' : ''}" data-tab="edit">
                <span class="p-icon">👤</span> <span class="p-text">Edit Profile</span>
              </button>
              <button class="p-nav-item ${this.activeTab === 'orders' ? 'active' : ''}" data-tab="orders">
                <span class="p-icon">📦</span> <span class="p-text">My Orders</span>
              </button>
              <button class="p-nav-item ${this.activeTab === 'challenges' ? 'active' : ''}" data-tab="challenges">
                <span class="p-icon">🌿</span> <span class="p-text">Eco Challenges</span>
              </button>
              <button class="p-nav-item" data-tab="settings">
                <span class="p-icon">⚙️</span> <span class="p-text">Settings</span>
              </button>
            </nav>
          </aside>

          <div class="profile-main">
            ${this.activeTab === 'summary' ? this.renderSummary() : 
              this.activeTab === 'edit' ? this.renderEdit() :
              this.activeTab === 'orders' ? this.renderOrders() : 
              this.renderChallenges()}
          </div>
        </div>
      </section>
    `;
  }

  renderSummary() {
    const stats = this.impactData?.stats || { eco_points: 0, total_orders: 0, challenges_completed: 0 };
    const level = this.getEcoLevel(stats.eco_points);

    return `
      <div class="profile-card-modern">
        <div class="card-cover">
           <div class="cover-overlay"></div>
        </div>
        <div class="card-content-wrap">
          <div class="card-avatar-overlap">
            ${this.user.avatar ? `<img src="${this.user.avatar}" alt="Avatar">` : `<span>${this.user.name.charAt(0).toUpperCase()}</span>`}
          </div>
          <div class="card-user-info">
            <h3>${this.user.name}</h3>
            <p class="c-email">${this.user.email}</p>
            <div class="c-badges">
              <span class="level-badge ${level.id}">${level.icon} ${level.label}</span>
              <span class="univ-badge">🏫 ${this.user.prodi || this.user.fakultas || 'Mahasiswa Eco'}</span>
            </div>
            <p class="c-bio">${this.user.bio || 'Pejuang lingkungan di kampus.'}</p>
          </div>
          
          <div class="card-stats-grid">
            <div class="c-stat-item">
              <span class="cs-val">${stats.eco_points}</span>
              <span class="cs-lbl">ECO POINTS</span>
            </div>
            <div class="c-stat-item">
              <span class="cs-val">${stats.total_orders}</span>
              <span class="cs-lbl">ORDERS</span>
            </div>
            <div class="c-stat-item">
              <span class="cs-val">${stats.challenges_completed}</span>
              <span class="cs-lbl">CHALLENGES</span>
            </div>
          </div>
          
          <div class="card-actions">
            <button class="btn btn-primary" onclick="window.location.hash='#profile?tab=edit'">Edit Profile</button>
            <button class="btn btn-outline" onclick="window.location.hash='#impact'">See Impact Details</button>
          </div>
        </div>
      </div>
    `;
  }

  renderEdit() {
    const stats = this.impactData?.stats || { eco_points: 0 };
    const level = this.getEcoLevel(stats.eco_points);

    return `
      <div class="edit-profile-container-modern">
        <div class="section-header-modern">
           <h3>Edit Personal Information</h3>
           <p>Perbarui profil dan foto Anda agar lebih personal.</p>
        </div>

        <form id="edit-profile-form" class="modern-form-body">
          <div class="avatar-edit-section">
             <div class="avatar-preview-big" id="avatar-preview">
                ${this.user.avatar ? `<img src="${this.user.avatar}" alt="Avatar">` : `<span>${this.user.name.charAt(0).toUpperCase()}</span>`}
             </div>
             <div class="avatar-actions-v2">
                <label for="avatar-input" class="btn btn-secondary btn-sm">📸 Change Photo</label>
                <input type="file" id="avatar-input" name="avatar" accept="image/*" hidden>
                <p class="hint">JPG/PNG, Max 2MB</p>
             </div>
          </div>

          <div class="form-grid-v2">
            <div class="f-group">
              <label>Nama Lengkap</label>
              <input type="text" name="name" value="${this.user.name}" placeholder="Masukkan nama" required>
            </div>
            <div class="f-group readonly">
              <label>Email (Read Only)</label>
              <input type="email" name="email" value="${this.user.email}" readonly>
            </div>
            <div class="f-group">
              <label>Fakultas</label>
              <input type="text" name="fakultas" value="${this.user.fakultas || ''}" placeholder="Contoh: Teknik">
            </div>
            <div class="f-group">
              <label>Program Studi</label>
              <input type="text" name="prodi" value="${this.user.prodi || ''}" placeholder="Contoh: Teknik Informatika">
            </div>
            <div class="f-group">
              <label>Kode Kelas</label>
              <input type="text" name="class_code" value="${this.user.classCode || ''}" placeholder="Contoh: 08TPLE007">
            </div>
            <div class="f-group">
              <label>Bio Singkat</label>
              <textarea name="bio" rows="2" placeholder="Tulis sedikit tentang Anda...">${this.user.bio || ''}</textarea>
            </div>
            <div class="f-group readonly">
              <label>Eco Points (Read Only)</label>
              <input type="text" value="${stats.eco_points} Poin" readonly>
            </div>
            <div class="f-group readonly">
              <label>Eco Level (Read Only)</label>
              <input type="text" value="${level.label}" readonly>
            </div>
          </div>

          <div class="form-footer-v2">
            <button type="button" class="btn btn-ghost btn-cancel-edit">Batal</button>
            <button type="submit" class="btn btn-primary btn-save-v2">Simpan Perubahan</button>
          </div>
        </form>
      </div>
    `;
  }

  getEcoLevel(points) {
    if (points > 1000) return { id: 'warrior', label: 'Eco Warrior', icon: '🌳' };
    if (points > 500) return { id: 'intermediate', label: 'Intermediate', icon: '🌿' };
    return { id: 'beginner', label: 'Beginner', icon: '🌱' };
  }

  renderOrders() {
    return `
      <div class="orders-section">
        <div class="card-header">
           <h3>Riwayat Pesanan</h3>
           <p>Lacak status produk ramah lingkungan Anda.</p>
        </div>
        
        <div class="orders-list">
           ${this.orders.length > 0 ? this.orders.map(order => `
             <div class="order-item-card">
                <div class="o-header">
                   <div class="o-id">ID Pesanan: #ECO-${order.id}</div>
                   <div class="o-date">${new Date(order.created_at).toLocaleDateString()}</div>
                </div>
                <div class="o-body">
                   <div class="o-info">
                      <p>Total Bayar: <strong>${formatCurrency(order.total_amount)}</strong></p>
                      <p>Status: <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></p>
                   </div>
                   <div class="o-actions">
                      <button class="btn btn-outline btn-sm btn-user-view-order" data-id="${order.id}">👁️ Lihat Detail</button>
                   </div>
                </div>
             </div>
           `).join('') : '<p class="empty">Belum ada pesanan.</p>'}
        </div>
      </div>
      
      <!-- User Order Detail Modal -->
      <div id="user-order-modal" class="modal-overlay">
        <div class="modal-card">
           <div class="modal-header">
              <h3 id="u-modal-title">Detail Pesanan</h3>
              <button class="btn-close-u-modal">✕</button>
           </div>
           <div id="u-modal-body" class="modal-body-content"></div>
        </div>
      </div>
    `;
  }

  renderChallenges() {
    return `
      <div class="challenges-section">
        <div class="card-header">
           <h3>Partisipasi Challenge</h3>
           <p>Lihat status verifikasi aksi hijau yang telah Anda unggah.</p>
        </div>
        
        <div class="submissions-list">
           ${this.challenges && this.challenges.length > 0 ? this.challenges.map(s => `
             <div class="submission-item-card">
                <div class="s-img-wrap">
                    <img src="${s.proof_image}" alt="Proof">
                </div>
                <div class="s-details">
                    <div class="s-title-row">
                        <h4>${s.challenge_title}</h4>
                        <span class="status-badge ${s.status}">${s.status}</span>
                    </div>
                    <div class="s-meta">
                        <span class="s-date">📅 ${new Date(s.created_at).toLocaleDateString()}</span>
                        <span class="s-points">🌿 Poin: ${s.status === 'approved' ? '+' + s.reward_points : '-'}</span>
                    </div>
                    ${s.admin_note ? `<p class="s-note"><strong>Note Admin:</strong> ${s.admin_note}</p>` : ''}
                </div>
             </div>
           `).join('') : '<p class="empty text-center">Belum mengikuti challenge apapun. <br><a href="#challenge" class="link">Mulai sekarang!</a></p>'}
        </div>
      </div>
    `;
  }

  addTabListeners() {
    document.querySelectorAll('.p-nav-item').forEach(btn => {
      btn.onclick = () => {
        const tab = btn.dataset.tab;
        if (tab === 'summary' || tab === 'edit' || tab === 'orders' || tab === 'challenges') {
            window.location.hash = `#profile?tab=${tab}`;
        } else if (tab === 'settings') {
            window.location.hash = '#settings';
        }
      };
    });

    if (this.activeTab === 'edit') {
        this.addEditListeners();
    }

    // Order detail listeners
    document.querySelectorAll('.btn-user-view-order').forEach(btn => {
      btn.onclick = () => this.showOrderDetail(btn.dataset.id);
    });

    const closeBtn = document.querySelector('.btn-close-u-modal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            document.getElementById('user-order-modal').classList.remove('active');
        };
    }
  }

  addEditListeners() {
    const editForm = document.getElementById('edit-profile-form');
    const avatarInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('avatar-preview');

    avatarInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
            alert('File terlalu besar! Maksimal 2MB.');
            e.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          avatarPreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
      }
    });

    document.querySelector('.btn-cancel-edit')?.addEventListener('click', () => {
        window.location.hash = '#profile?tab=summary';
    });

    editForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = editForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerText = 'Menyimpan...';

      const formData = new FormData(editForm);
      formData.append('action', 'update_profile');

      try {
        const res = await ApiService.updateProfile(formData);
        if (res.success) {
          AuthService.updateUser(res.user);
          alert('Profil berhasil diperbarui!');
          window.location.hash = '#profile?tab=summary';
          window.location.reload(); 
        } else {
          alert(res.message || 'Gagal memperbarui profil.');
        }
      } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan koneksi.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Simpan Perubahan';
      }
    });
  }

  async showOrderDetail(orderId) {
    const modal = document.getElementById('user-order-modal');
    const body = document.getElementById('u-modal-body');
    const title = document.getElementById('u-modal-title');

    title.innerText = `Detail Pesanan #ECO-${orderId}`;
    body.innerHTML = '<div class="loader">Memuat detail...</div>';
    modal.classList.add('active');

    try {
      const res = await fetch(`../api/orders.php?order_id=${orderId}`, { credentials: 'include' });
      const data = await res.json();
      
      if (!data.success) throw new Error(data.message);
      
      const order = data.order;
      
      const statusSteps = ['pending', 'processed', 'shipped', 'completed'];
      const currentStepIdx = statusSteps.indexOf(order.status.toLowerCase());

      body.innerHTML = `
        <div class="user-order-detail">
          <div class="u-detail-status-bar">
            <div class="status-main">
                <span class="status-badge status-${order.status.toLowerCase()}">${order.status.toUpperCase()}</span>
                <span class="o-date">${new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</span>
            </div>
            <div class="order-id-tag">#ECO-${orderId}</div>
          </div>

          <!-- Tracking Timeline -->
          <div class="o-tracking-container">
             <div class="o-tracking-line">
                <div class="line-step ${currentStepIdx >= 0 ? 'active' : ''}">
                    <span class="step-label">Pending</span>
                </div>
                <div class="line-step ${currentStepIdx >= 1 ? 'active' : ''}">
                    <span class="step-label">Diproses</span>
                </div>
                <div class="line-step ${currentStepIdx >= 2 ? 'active' : ''}">
                    <span class="step-label">Dikirim</span>
                </div>
                <div class="line-step ${currentStepIdx >= 3 ? 'active' : ''}">
                    <span class="step-label">Selesai</span>
                </div>
             </div>
          </div>

          <div class="u-detail-section">
            <h4 class="section-title"><span class="icon">📍</span> Alamat Pengiriman</h4>
            <div class="shipping-info-card">
              <p class="s-name">${order.shipping_name}</p>
              <p class="s-phone">${order.shipping_phone}</p>
              <p class="s-address">${order.shipping_address}</p>
            </div>
          </div>

          <div class="u-detail-section">
            <h4 class="section-title"><span class="icon">📦</span> Produk Dipesan</h4>
            <div class="item-list-modern">
              ${order.items.map(item => `
                <div class="modern-item-row">
                  <div class="item-img-mini">
                    <img src="${item.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=80'}" alt="${item.name}">
                  </div>
                  <div class="item-meta-mini">
                    <p class="im-name">${item.name}</p>
                    <p class="im-qty-price">${item.quantity} x ${formatCurrency(item.price_at_purchase)}</p>
                  </div>
                  <div class="item-subtotal">
                    ${formatCurrency(item.price_at_purchase * item.quantity)}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="u-detail-footer">
            <div class="payment-method-tag">
               <span>Metode Pembayaran:</span>
               <strong>Cash on Delivery (COD)</strong>
            </div>
            <div class="total-row">
               <span class="t-label">Total Pembayaran</span>
               <span class="t-value">${formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      body.innerHTML = `<p class="error">Gagal memuat: ${err.message}</p>`;
    }
  }
}

export default ProfilePage;
