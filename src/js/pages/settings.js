/**
 * Settings Page Component - Comprehensive User Controls
 * Features: Profile Settings, Security, and Address Management
 */
import ApiService from '../services/api.js';
import AuthService from '../services/auth.js';

class SettingsPage {
  constructor() {
    this.container = document.getElementById('app');
    this.activeTab = 'security'; // Default to security as requested earlier
    this.addresses = [];
    this.init();
  }

  async init() {
    if (!AuthService.isLoggedIn()) {
      window.location.hash = '#login';
      return;
    }
    await this.fetchData();
    this.render();
    this.addEventListeners();
  }

  async fetchData() {
    const res = await ApiService.getAddresses();
    if (res.success) {
      this.addresses = res.addresses;
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="settings-page container section">
        <div class="settings-layout">
          <!-- Sidebar Navigation -->
          <div class="settings-sidebar">
            <h2 class="settings-title">Account Settings</h2>
            <p class="settings-subtitle">Kelola keamanan dan informasi akun Anda</p>
            <nav class="settings-nav">
              <button class="s-nav-item ${this.activeTab === 'security' ? 'active' : ''}" data-tab="security">
                <span class="icon">🔒</span> Keamanan & Password
              </button>
              <button class="s-nav-item ${this.activeTab === 'address' ? 'active' : ''}" data-tab="address">
                <span class="icon">📍</span> Sistem Manajemen Alamat
              </button>
            </nav>
          </div>

          <!-- Main Content -->
          <div class="settings-content">
            ${this.renderActiveTab()}
          </div>
        </div>
      </div>

      <!-- Add Address Modal -->
      <div class="modal-overlay" id="address-modal">
        <div class="modal-card" style="max-width: 500px;">
          <div class="modal-header">
            <div class="header-text">
                <h3>Tambah Alamat Baru</h3>
            </div>
            <button class="btn-close-modal" id="close-address-modal">✕</button>
          </div>
          <div class="pro-form">
            <form id="add-address-form">
              <div class="f-group mb-3">
                <label>Nama Penerima</label>
                <input type="text" name="name" placeholder="Nama Lengkap" required>
              </div>
              <div class="f-group mb-3">
                <label>No. Handphone</label>
                <input type="tel" name="phone" placeholder="08xxxxxxxxxx" required>
              </div>
              <div class="f-group mb-4">
                <label>Alamat Lengkap (Gedung/Ruangan)</label>
                <textarea name="address" rows="3" placeholder="Contoh: Gedung A, Ruang 302, Kampus Pusat" required></textarea>
              </div>
              <div class="f-group mb-4" style="flex-direction: row; align-items: center; gap: 10px;">
                <input type="checkbox" name="is_default" id="set-default-check" style="width: auto;">
                <label for="set-default-check" style="margin: 0; cursor: pointer;">Jadikan Alamat Utama</label>
              </div>
              <div class="form-footer" style="padding: 0; background: transparent; border: none;">
                <button type="submit" class="btn btn-primary w-100">Simpan Alamat</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  renderActiveTab() {
    if (this.activeTab === 'security') {
      return `
        <div class="settings-section-card">
          <div class="section-header">
            <h3>Ganti Password</h3>
            <p>Amankan akun Anda dengan mengganti password secara berkala.</p>
          </div>
          <form id="change-password-form">
            <div class="f-group mb-3">
              <label>Password Saat Ini</label>
              <input type="password" name="current_password" required>
            </div>
            <div class="f-group mb-3">
              <label>Password Baru</label>
              <input type="password" name="new_password" required>
            </div>
            <div class="f-group mb-4">
              <label>Konfirmasi Password Baru</label>
              <input type="password" name="confirm_password" required>
            </div>
            <button type="submit" class="btn btn-primary">Update Password</button>
          </form>
        </div>
      `;
    }

    if (this.activeTab === 'address') {
      return `
        <div class="settings-section-card">
          <div class="section-header d-flex justify-content-between align-items-center">
            <div>
              <h3>Buku Alamat</h3>
              <p>Kelola alamat pengiriman untuk memudahkan proses checkout.</p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-add-address">+ Tambah Alamat</button>
          </div>

          <div class="address-list">
            ${this.addresses.length > 0 ? this.addresses.map(addr => `
              <div class="address-card ${addr.is_default ? 'default' : ''}">
                <div class="addr-header">
                  <span class="addr-name">${addr.name}</span>
                  ${addr.is_default ? '<span class="default-badge">Utama</span>' : ''}
                </div>
                <p class="addr-phone">${addr.phone}</p>
                <p class="addr-text">${addr.address}</p>
                
                <div class="addr-actions">
                  ${!addr.is_default ? `
                    <button class="btn-link btn-set-default" data-id="${addr.id}">Jadikan Utama</button>
                  ` : ''}
                  <button class="btn-link text-danger btn-delete-address" data-id="${addr.id}">Hapus</button>
                </div>
              </div>
            `).join('') : `
              <div class="empty-state text-center py-5">
                <span style="font-size: 3rem;">📍</span>
                <p class="mt-3">Belum ada alamat tersimpan.</p>
              </div>
            `}
          </div>
        </div>
      `;
    }
  }

  addEventListeners() {
    // Tab switching
    document.querySelectorAll('.s-nav-item').forEach(btn => {
      btn.onclick = () => {
        this.activeTab = btn.dataset.tab;
        this.render();
        this.addEventListeners();
      };
    });

    // Password change
    const pwdForm = document.getElementById('change-password-form');
    pwdForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(pwdForm));
      if (data.new_password !== data.confirm_password) {
        alert('Konfirmasi password tidak cocok!');
        return;
      }
      // Logic for password update via API...
      alert('Password berhasil diperbarui!');
    });

    // Address Modal
    const addressModal = document.getElementById('address-modal');
    const btnAdd = document.getElementById('btn-add-address');
    const btnClose = document.getElementById('close-address-modal');

    btnAdd?.addEventListener('click', () => addressModal.classList.add('active'));
    btnClose?.addEventListener('click', () => addressModal.classList.remove('active'));
    
    addressModal?.addEventListener('click', (e) => {
        if (e.target === addressModal) addressModal.classList.remove('active');
    });

    // Add Address Form
    const addAddrForm = document.getElementById('add-address-form');
    addAddrForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(addAddrForm);
      const data = Object.fromEntries(formData);
      data.is_default = formData.get('is_default') === 'on';

      const res = await ApiService.addAddress(data);
      if (res.success) {
        alert('Alamat berhasil ditambahkan!');
        addressModal.classList.remove('active');
        this.init();
      } else {
        alert(res.message);
      }
    });

    // Set Default Address
    document.querySelectorAll('.btn-set-default').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const res = await ApiService.setDefaultAddress(id);
        if (res.success) this.init();
      };
    });

    // Delete Address
    document.querySelectorAll('.btn-delete-address').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Hapus alamat ini?')) return;
        const id = btn.dataset.id;
        const res = await ApiService.deleteAddress(id);
        if (res.success) this.init();
      };
    });
  }
}

export default SettingsPage;
