import ApiService from '../services/api.js';
import AuthService from '../services/auth.js';
import { formatCurrency } from '../utils/formatter.js';

class WishlistPage {
  constructor() {
    if (!AuthService.isLoggedIn()) {
      window.location.hash = '#login';
      return;
    }
    this.container = document.getElementById('app');
    this.user = AuthService.getCurrentUser();
    this.items = [];
    this.init();
  }

  async init() {
    const res = await ApiService.getWishlist(this.user.id);
    this.items = res.items || [];
    this.render();
    this.addEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <section class="wishlist-page container">
        <div class="wishlist-header">
          <h1>My <span class="highlight">Wishlist</span></h1>
          <p>Daftar produk ramah lingkungan pilihan Anda.</p>
        </div>

        <div class="wishlist-grid">
          ${this.items.length > 0 ? this.items.map(item => `
            <div class="wishlist-card" data-id="${item.product_id}">
              <div class="w-image">
                <img src="${item.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=200'}" alt="${item.name}">
                <button type="button" class="btn-remove-wishlist" data-id="${item.product_id}">✕</button>
              </div>
              <div class="w-info">
                <h3>${item.name}</h3>
                <p class="w-price">${formatCurrency(item.price)}</p>
                <div class="w-stock ${item.stock > 0 ? 'in-stock' : 'out-stock'}">
                   ${item.stock > 0 ? 'Tersedia' : 'Habis'}
                </div>
                <button type="button" class="btn btn-primary btn-sm btn-move-cart" data-id="${item.product_id}" ${item.stock <= 0 ? 'disabled' : ''}>
                   Pindah ke Keranjang
                </button>
              </div>
            </div>
          `).join('') : `
            <div class="empty-wishlist-msg">
              <div class="empty-icon">💚</div>
              <h2>Wishlist Kosong</h2>
              <p>Belum ada produk favorit? Jelajahi koleksi kami!</p>
              <br>
              <a href="#products" class="btn btn-primary">Mulai Belanja</a>
            </div>
          `}
        </div>
      </section>
    `;
  }

  addEventListeners() {
    document.querySelectorAll('.btn-remove-wishlist').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        await ApiService.toggleWishlist(this.user.id, id);
        this.init();
      };
    });

    document.querySelectorAll('.btn-move-cart').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const res = await ApiService.moveToCart(this.user.id, id);
        if (res.success) {
          alert('Berhasil dipindah ke keranjang!');
          this.init();
        }
      };
    });
  }
}

export default WishlistPage;
