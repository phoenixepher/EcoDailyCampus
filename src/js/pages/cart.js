import ApiService from '../services/api.js';
import AuthService from '../services/auth.js';
import { formatCurrency } from '../utils/formatter.js';

class CartPage {
  constructor() {
    if (!AuthService.isLoggedIn()) {
      window.location.hash = '#login';
      return;
    }
    this.container = document.getElementById('app');
    this.user = AuthService.getCurrentUser();
    this.items = [];
    this.isCheckoutMode = false;
    this.addresses = [];
    this.init();
  }

  async init() {
    const res = await ApiService.getCart(this.user.id);
    this.items = res.items || [];
    
    // Pre-fetch addresses if user is logged in
    const addrRes = await ApiService.getAddresses();
    if (addrRes.success) {
      this.addresses = addrRes.addresses;
    }

    this.render();
    this.addEventListeners();
  }

  calculateTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  render() {
    const total = this.calculateTotal();
    
    if (this.isCheckoutMode) {
      this.renderCheckout(total);
      return;
    }

    this.container.innerHTML = `
      <section class="cart-page container">
        <div class="cart-header">
          <h1>Shopping <span class="highlight">Cart</span></h1>
          <p>Anda memiliki ${this.items.length} item ramah lingkungan di keranjang.</p>
        </div>

        <div class="cart-grid">
          <div class="cart-items-list">
            ${this.items.length > 0 ? this.items.map(item => `
              <div class="cart-item-card" data-id="${item.product_id}">
                <div class="ci-image">
                  <img src="${item.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=200'}" alt="${item.name}">
                </div>
                <div class="ci-info">
                  <h3>${item.name}</h3>
                  <p class="ci-price">${formatCurrency(item.price)}</p>
                </div>
                <div class="ci-controls">
                  <div class="qty-control">
                    <button class="btn-qty btn-minus" data-id="${item.product_id}">−</button>
                    <span>${item.quantity}</span>
                    <button class="btn-qty btn-plus" data-id="${item.product_id}">+</button>
                  </div>
                  <button class="btn-remove-item" data-id="${item.product_id}">🗑️</button>
                </div>
                <div class="ci-subtotal">
                  <span>Subtotal</span>
                  <strong>${formatCurrency(item.price * item.quantity)}</strong>
                </div>
              </div>
            `).join('') : `
              <div class="empty-cart-msg">
                <div class="empty-icon">🛒</div>
                <h2>Keranjang Anda Kosong</h2>
                <p>Mulai belanja produk ramah lingkungan sekarang!</p>
                <a href="#products" class="btn btn-primary">Lihat Produk</a>
              </div>
            `}
          </div>

          ${this.items.length > 0 ? `
            <div class="cart-summary-card">
              <h3>Ringkasan Pesanan</h3>
              <div class="summary-line">
                <span>Subtotal Produk</span>
                <span>${formatCurrency(total)}</span>
              </div>
              <div class="summary-line">
                <span>Estimasi Pengiriman</span>
                <span class="free-badge">FREE</span>
              </div>
              <hr>
              <div class="summary-line total">
                <span>Total Bayar</span>
                <strong>${formatCurrency(total)}</strong>
              </div>
              <button class="btn btn-primary btn-full" id="btn-go-checkout">Lanjut ke Pembayaran</button>
              <a href="#products" class="btn btn-text btn-full">Lanjut Belanja</a>
            </div>
          ` : ''}
        </div>
      </section>
    `;
  }

  renderCheckout(total) {
    const defaultAddr = this.addresses.find(a => a.is_default) || this.addresses[0];

    this.container.innerHTML = `
      <section class="checkout-page container">
        <!-- Checkout Stepper -->
        <div class="checkout-stepper">
           <div class="step">
              <span class="step-num">1</span>
              <span>Keranjang</span>
           </div>
           <div class="step-line"></div>
           <div class="step active">
              <span class="step-num">2</span>
              <span>Pengiriman</span>
           </div>
           <div class="step-line"></div>
           <div class="step">
              <span class="step-num">3</span>
              <span>Selesai</span>
           </div>
        </div>

        <div class="checkout-header">
           <button class="btn-back-cart" id="btn-back-to-cart">← Kembali ke Keranjang</button>
           <h1>Detail <span class="highlight">Pengiriman</span></h1>
        </div>

        <div class="checkout-grid">
           <div class="checkout-left">
              ${this.addresses.length > 0 ? `
                <div class="address-picker-section mb-4">
                  <label class="section-label">📍 Pilih dari Alamat Tersimpan</label>
                  <div class="address-select-grid">
                    ${this.addresses.map(addr => `
                      <div class="address-option-card ${addr.id === defaultAddr?.id ? 'active' : ''}" data-id="${addr.id}">
                        <div class="ao-header">
                           <strong>${addr.name}</strong>
                           ${addr.is_default ? '<span class="badge">Utama</span>' : ''}
                        </div>
                        <p>${addr.phone}</p>
                        <p class="ao-text">${addr.address}</p>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <form id="checkout-form" class="checkout-form-card">
                 <h4 class="form-subtitle">Formulir Pengiriman</h4>
                 <div class="form-group">
                   <label>Nama Penerima</label>
                   <input type="text" name="name" id="ship-name" value="${defaultAddr?.name || this.user.name}" required>
                 </div>
                 <div class="form-group">
                   <label>Nomor WhatsApp</label>
                   <input type="tel" name="phone" id="ship-phone" value="${defaultAddr?.phone || ''}" placeholder="08xxxx" required>
                 </div>
                 <div class="form-group">
                   <label>Alamat Lengkap (Kampus/Kamar)</label>
                   <textarea name="address" id="ship-address" rows="3" placeholder="Gedung, Lantai, No Kamar..." required>${defaultAddr?.address || ''}</textarea>
                 </div>
                 
                 <div class="payment-selection-section">
                    <p>💳 Metode Pembayaran: <strong>Cash on Delivery (COD)</strong></p>
                    <small>Demi kemudahan, pembayaran dilakukan saat barang diterima.</small>
                 </div>

                 <button type="submit" class="btn btn-primary btn-full mt-4" id="btn-place-order">Konfirmasi Pesanan</button>
              </form>
           </div>

           <div class="order-preview-card">
              <h3>Ringkasan Pesanan</h3>
              <div class="preview-items">
                 ${this.items.map(item => `
                   <div class="preview-item">
                      <div class="pi-main">
                        <img src="${item.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=60'}" alt="${item.name}">
                        <div class="pi-info">
                            <span class="pi-name">${item.name}</span>
                            <span class="pi-qty">Jumlah: ${item.quantity}</span>
                        </div>
                      </div>
                      <span class="pi-price">${formatCurrency(item.price * item.quantity)}</span>
                   </div>
                 `).join('')}
              </div>
              <div class="preview-total">
                 <span>Total Akhir</span>
                 <strong>${formatCurrency(total)}</strong>
              </div>
           </div>
        </div>
      </section>
    `;
    this.addCheckoutListeners();
  }

  addEventListeners() {
    document.querySelectorAll('.btn-plus').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const item = this.items.find(i => i.product_id == id);
        await ApiService.updateCart(this.user.id, id, item.quantity + 1);
        this.init();
      };
    });

    document.querySelectorAll('.btn-minus').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const item = this.items.find(i => i.product_id == id);
        if (item.quantity > 1) {
          await ApiService.updateCart(this.user.id, id, item.quantity - 1);
          this.init();
        }
      };
    });

    document.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (confirm('Hapus item ini?')) {
          await ApiService.removeFromCart(this.user.id, id);
          this.init();
        }
      };
    });

    document.getElementById('btn-go-checkout')?.addEventListener('click', () => {
      this.isCheckoutMode = true;
      this.render();
    });
  }

  addCheckoutListeners() {
    // Address Picker logic
    document.querySelectorAll('.address-option-card').forEach(card => {
      card.onclick = () => {
        // UI feedback
        document.querySelectorAll('.address-option-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        // Fill form
        const addrId = card.dataset.id;
        const addr = this.addresses.find(a => a.id == addrId);
        if (addr) {
          document.getElementById('ship-name').value = addr.name;
          document.getElementById('ship-phone').value = addr.phone;
          document.getElementById('ship-address').value = addr.address;
        }
      };
    });

    document.getElementById('btn-back-to-cart')?.addEventListener('click', () => {
      this.isCheckoutMode = false;
      this.render();
      this.addEventListeners();
    });

    document.getElementById('checkout-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);
      const submitBtn = document.getElementById('btn-place-order');
      
      submitBtn.disabled = true;
      submitBtn.innerText = 'Memproses...';

      const orderData = {
        user_id: this.user.id,
        name: formData.get('name'),
        phone: formData.get('phone'),
        address: formData.get('address')
      };

      try {
        const res = await ApiService.checkout(orderData);
        if (res.success) {
          alert('Pesanan berhasil dibuat! Anda akan dialihkan ke halaman tracking.');
          window.location.hash = '#profile';
        } else {
          alert('Gagal: ' + res.message);
          submitBtn.disabled = false;
          submitBtn.innerText = 'Konfirmasi Pesanan';
        }
      } catch (err) {
        alert('Koneksi gagal!');
        submitBtn.disabled = false;
      }
    });
  }
}

export default CartPage;
