import Store from './services/store.js';
import Navbar from './components/navbar.js';
import HomePage from './pages/home.js';

import AuthService from './services/auth.js';

class App {
  constructor() {
    this.init();
  }

  async init() {
    console.log('EcoDaily Campus Initializing...');

    // 1. Initialize Global State
    Store.initialize();
    new Navbar();

    // 2. Simple Routing Logic (Single Page Application Approach)
    this.route();

    // 3. Global Event Listeners
    window.addEventListener('hashchange', () => this.route());
    this.addGlobalListeners();
  }

  addGlobalListeners() {
    document.addEventListener('click', async (e) => {
      const cartBtn = e.target.closest('.btn-add-cart');
      const wishlistBtn = e.target.closest('.btn-wishlist');

      if (!cartBtn && !wishlistBtn) return;

      e.preventDefault();

      // Dynamic import to avoid circular dependencies
      const AuthService = (await import('./services/auth.js')).default;
      const ApiService = (await import('./services/api.js')).default;

      if (!AuthService.isLoggedIn()) {
        this.showToast('Silakan login terlebih dahulu untuk melanjutkan! 🔑');
        setTimeout(() => {
          window.location.hash = '#login';
        }, 1500);
        return;
      }

      const user = AuthService.getCurrentUser();

      if (wishlistBtn) {
        wishlistBtn.classList.add('loading');
        try {
          const id = wishlistBtn.getAttribute('data-product-id') ||
            wishlistBtn.closest('.product-card')?.getAttribute('data-id');

          if (!id) return;

          const res = await ApiService.toggleWishlist(user.id, id);
          if (res.success) {
            wishlistBtn.classList.toggle('active');
            this.showToast(res.action === 'added' ? 'Terseimpan di Wishlist! 💚' : 'Dihapus dari Wishlist');
          }
        } finally {
          wishlistBtn.classList.remove('loading');
        }
      }

      if (cartBtn) {
        // Handle quick add from anywhere if needed (though disabled in home)
        cartBtn.classList.add('loading');
        try {
          const id = cartBtn.getAttribute('data-id');
          const res = await ApiService.addToCart(user.id, id);
          if (res.success) {
            import('./components/navbar.js').then(m => m.default.refreshCartBadge());
            this.showToast('Produk ditambahkan ke keranjang! 🛒');
          }
        } finally {
          cartBtn.classList.remove('loading');
        }
      }
    });
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 30px; right: 30px; 
      background: #10b981; color: white; padding: 12px 24px; 
      border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      z-index: 10000; transition: all 0.5s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 500);
    }, 2000);
  }

  route() {
    let hash = window.location.hash || '#home';
    const baseHash = hash.split('?')[0];
    console.log(`Navigating to: ${baseHash}`);

    const appContainer = document.getElementById('app');
    const navbarElement = document.getElementById('navbar');
    appContainer.innerHTML = ''; // Clear for fresh render

    const footerElement = document.getElementById('footer');

    // Show/Hide Navbar and Footer based on route
    const user = AuthService.getCurrentUser();
    const isAdmin = AuthService.isAdmin();

    if (baseHash === '#login' || baseHash === '#register' || (isAdmin && baseHash.startsWith('#admin')) || (isAdmin && baseHash === '#dashboard')) {
      navbarElement?.classList.add('hidden');
      footerElement?.classList.add('hidden');
      appContainer.style.paddingTop = '0';
      appContainer.style.minHeight = '100vh';
    } else {
      navbarElement?.classList.remove('hidden');
      footerElement?.classList.remove('hidden');
      appContainer.style.paddingTop = ''; // Revert to CSS default
      appContainer.style.minHeight = ''; // Revert to CSS default
    }

    if (baseHash.startsWith('#product/')) {
      const productId = baseHash.split('/')[1];
      import('./pages/product.js').then(m => new m.default(productId));
      return;
    }

    const isLoggedIn = AuthService.isLoggedIn();

    // Protective Routing / RBAC
    const adminRoutes = ['#admin', '#admin-orders', '#admin-challenges', '#dashboard'];

    if (adminRoutes.includes(baseHash) && !isAdmin) {
      window.location.hash = '#home';
      return;
    }

    // Admins can access user routes (impact, cart, etc) for testing
    
    if (hash.startsWith('#product/') && isAdmin && false) { 
      window.location.hash = '#admin';
      return;
    }

    switch (baseHash) {
      case '#home':
      case '':
        new HomePage();
        break;
      case '#login':
        import('./pages/auth.js').then(m => new m.default('login'));
        break;
      case '#register':
        import('./pages/auth.js').then(m => new m.default('register'));
        break;
      case '#dashboard':
      case '#admin':
      case '#admin-orders':
      case '#admin-challenges':
        import('./pages/admin.js').then(m => new m.default());
        break;
      case '#profile':
        import('./pages/profile.js').then(m => new m.default());
        break;
      case '#settings':
        import('./pages/settings.js').then(m => new m.default());
        break;
      case '#impact':
        import('./pages/impact.js').then(m => new m.default());
        break;
      case '#cart':
        import('./pages/cart.js').then(m => new m.default());
        break;
      case '#wishlist':
        import('./pages/wishlist.js').then(m => new m.default());
        break;
      case '#challenge':
        import('./pages/challenges.js').then(m => new m.default());
        break;
      case '#about':
        import('./pages/about.js').then(m => new m.default());
        break;
      case '#admin-challenges':
        import('./pages/admin.js').then(m => new m.default());
        break;
      case '#orders':
        import('./pages/profile.js').then(m => {
          const page = new m.default();
          page.activeTab = 'orders';
          page.init();
        });
        break;
      default:
        new HomePage();
    }
  }
}

// Instantiate the App
document.addEventListener('DOMContentLoaded', () => {
  window.ecoApp = new App();
});
