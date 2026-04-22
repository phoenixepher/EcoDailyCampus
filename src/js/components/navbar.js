/**
 * Navbar Component - Refined Responsiveness & Scroll Logic
 */
import AuthService from '../services/auth.js';

class Navbar {
  constructor() {
    this.init();
  }

  init() {
    this.render();
    this.addEventListeners();
    this.setActiveLink();
    this.refreshCartBadge();
    this.handleScroll(); // Initial check
    
    // Global Listeners (once)
    if (!window.navbarListenersAdded) {
      window.addEventListener('hashchange', () => {
        this.render();
        this.setActiveLink();
        this.addEventListeners();
        this.refreshCartBadge();
        this.handleScroll();
      });
      
      window.addEventListener('scroll', () => this.handleScroll());
      window.navbarListenersAdded = true;
    }
  }

  handleScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  async refreshCartBadge() {
    if (AuthService.isLoggedIn()) {
      const user = AuthService.getCurrentUser();
      try {
          const res = await (await fetch(`../api/cart.php?user_id=${user.id}`)).json();
          if (res.success) {
            this.updateCartBadge(res.items.length);
          }
      } catch(e) {}
    }
  }

  setActiveLink() {
    const hash = window.location.hash || '#';
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(link => {
      if (link.getAttribute('href') === hash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  render() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    
    const user = AuthService.getCurrentUser();
    const isLoggedIn = AuthService.isLoggedIn();
    const isAdmin = AuthService.isAdmin();
    
    navbar.innerHTML = `
      <div class="nav-container">
        <div class="nav-brand">
          <a href="${isAdmin ? '#dashboard' : '#home'}" class="brand-link">
            <span class="brand-logo">🌿</span>
            <span class="brand-name">EcoDaily <span class="highlight">Campus</span></span>
            ${isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
          </a>
        </div>
        
        <nav class="nav-links">
          <a href="#home" class="nav-item">Home</a>
          <a href="#products" class="nav-item">Shop</a>
          <a href="#challenge" class="nav-item">Eco Challenge</a>
          <a href="#about" class="nav-item">About</a>
        </nav>
        
        <div class="nav-actions">
          ${!isAdmin ? `
            <a href="#wishlist" class="nav-btn btn-wishlist-nav" title="Wishlist">💚</a>
            <a href="#cart" class="nav-btn btn-cart" title="Shopping Cart">
              🛒 <span class="cart-badge">0</span>
            </a>
          ` : ''}
          
          <div class="user-control">
            ${isLoggedIn ? `
              <div class="user-dropdown">
                <button class="user-menu-btn" id="user-menu-trigger">
                  <div class="user-avatar ${isAdmin ? 'admin-v' : ''}">
                    ${user.avatar ? `<img src="${user.avatar}" alt="Avatar" class="nav-avatar-img">` : user.name.charAt(0).toUpperCase()}
                  </div>
                  <span class="user-name-text">${user.name.split(' ')[0]}</span>
                  <span class="dropdown-arrow">▼</span>
                </button>
                <div class="dropdown-menu hidden" id="user-dropdown-content">
                  <div class="dropdown-header">
                    <p class="d-name">${user.name}</p>
                    <p class="d-email">${user.email}</p>
                    <p class="d-role-tag">${user.role.toUpperCase()}</p>
                  </div>
                  <hr>
                  ${isAdmin ? `
                    <a href="#dashboard" class="dropdown-item">📊 Admin Dashboard</a>
                    <a href="#settings" class="dropdown-item">⚙️ Settings</a>
                  ` : `
                    <a href="#profile" class="dropdown-item"><span class="icon">🪪</span> View Profile</a>
                    <a href="#profile?tab=edit" class="dropdown-item"><span class="icon">👤</span> Edit Profile</a>
                    <a href="#impact" class="dropdown-item"><span class="icon">🌱</span> My Impact</a>
                    <a href="#settings" class="dropdown-item"><span class="icon">⚙️</span> Settings</a>
                  `}
                  <hr>
                  <div style="padding: 5px;">
                    <button class="logout-link-btn" id="nav-logout-btn">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Logout Session
                    </button>
                  </div>
                </div>
              </div>
            ` : `
              <a href="#login" class="btn btn-primary btn-sm login-btn-nav">Login Account</a>
            `}
          </div>
          <button class="nav-btn mobile-menu-btn" id="mobile-trigger">☰</button>
        </div>
      </div>
      
      <!-- Mobile Sidebar -->
      <div class="mobile-sidebar" id="mobile-sidebar">
        <div class="mobile-sidebar-header">
          <span class="brand-name">EcoDaily <span class="highlight">Campus</span></span>
          <button id="mobile-close">✕</button>
        </div>
        <nav class="mobile-nav-links">
           <a href="#home" class="mobile-nav-item">🏠 Home</a>
           <a href="#products" class="mobile-nav-item">🛍️ Shop</a>
           <a href="#challenge" class="mobile-nav-item">🌿 Eco Challenge</a>
           <a href="#about" class="mobile-nav-item">ℹ️ About</a>
           ${isLoggedIn ? `
             <hr>
             <a href="#profile" class="mobile-nav-item">🪪 My Profile</a>
              <a href="#profile?tab=orders" class="mobile-nav-item">📦 My Orders</a>
              <a href="#impact" class="mobile-nav-item">🌱 My Impact</a>
              <button class="mobile-nav-item logout-link-btn" id="mobile-logout-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Logout Session
              </button>
            ` : `
             <a href="#login" class="mobile-nav-item">🔑 Login / Register</a>
           `}
        </nav>
      </div>
    `;
  }

  addEventListeners() {
    const trigger = document.getElementById('user-menu-trigger');
    const dropdown = document.getElementById('user-dropdown-content');
    const logoutBtn = document.getElementById('nav-logout-btn');
    const mobileTrigger = document.getElementById('mobile-trigger');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const mobileClose = document.getElementById('mobile-close');
    const mobileLogout = document.getElementById('mobile-logout-btn');

    if (trigger && dropdown) {
      trigger.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
      };

      document.onclick = (e) => {
        if (!trigger.contains(e.target)) {
          dropdown.classList.add('hidden');
        }
      };
    }

    if (logoutBtn) {
      logoutBtn.onclick = () => {
        if (confirm('Apakah Anda yakin ingin keluar dari sesi ini? 🌿')) {
          AuthService.logout();
          window.location.hash = '#home';
          window.location.reload();
        }
      };
    }

    if (mobileLogout) {
      mobileLogout.onclick = () => {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
          AuthService.logout();
          window.location.hash = '#home';
          window.location.reload();
        }
      };
    }

    if (mobileTrigger && mobileSidebar) {
      mobileTrigger.onclick = () => mobileSidebar.classList.add('active');
      mobileClose.onclick = () => mobileSidebar.classList.remove('active');
    }
  }

  updateCartBadge(count) {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.innerText = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }
}

export default Navbar;
