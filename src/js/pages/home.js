/**
 * Home Page Logic
 */
import ApiService from '../services/api.js';
import AuthService from '../services/auth.js';
import ProductCard from '../components/productCard.js';

class HomePage {
  constructor() {
    this.container = document.getElementById('app');
    this.init();
  }

  async init() {
    this.render();
    await this.loadProducts();
    await this.loadTestimonials();
    this.addTestimonialListeners();
    this.addEventListeners();
  }

  render() {
    const rawUser = localStorage.getItem('eco_current_user');
    const user = rawUser ? JSON.parse(rawUser) : {};
    const isLoggedIn = !!rawUser;

    this.container.innerHTML = `
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content container">
          <div class="hero-text-container">
            <span class="hero-badge">Welcome to EcoDaily Campus 🌱</span>
            <h1 class="hero-title">Shop Sustainable, <br>Save the <span class="highlight">Future</span></h1>
            <p class="hero-subtitle">Discover premium eco-friendly products curated for the modern campus lifestyle. Earn points for every sustainable choice you make.</p>
            <div class="hero-actions">
              <a href="#products" class="btn btn-primary">Shop Now</a>
              <a href="#challenge" class="btn btn-outline">Eco Challenge</a>
            </div>
            
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-value">5k+</span>
                <span class="stat-label">Eco Points Given</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-value">200+</span>
                <span class="stat-label">Sustainable Products</span>
              </div>
            </div>
          </div>
          
          <div class="hero-image-container">
            <div class="hero-image-bg"></div>
            <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1000" alt="Sustainable Living" class="hero-image">
            <div class="hero-floating-card">
              <div class="floating-icon">🌱</div>
              <div class="floating-text">
                <p class="f-title">Impact Leader</p>
                <p class="f-desc">User #42 saved 12kg CO2 this month!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Products Section -->
      <section id="products" class="section products-section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">New Sustainable <span class="highlight">Arrivals</span></h2>
            <div class="category-filters">
              <!-- Dynamically rendered categories -->
            </div>
          </div>
          
          <div id="product-grid" class="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-4 gap-lg">
            <!-- Dynamically rendered product cards -->
            <div class="loader">Loading products...</div>
          </div>
          
          <div class="view-more">
            <button class="btn btn-outline-wide">Explore All Products</button>
          </div>
        </div>
      </section>
      
      <!-- Eco Challenge CTA -->
      <section id="challenge-section" class="section challenge-cta">
        <div class="container">
          <div class="cta-card">
             <div class="cta-content">
                <h3>Join the Monthly <span class="highlight">Eco Challenge</span></h3>
                <p>Complete daily sustainable tasks, earn exclusive rewards, and climb the campus leaderboard.</p>
                <a href="#challenge" class="btn btn-secondary">Get Started</a>
             </div>
             <div class="cta-illustration">
                <!-- Illustration here -->
                <div class="leaf-anim">🍃</div>
             </div>
          </div>
        </div>
      </section>

      <!-- Site Testimonials Section -->
      <section id="testimonials" class="section testimonials-section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">What Our <span class="highlight">Campus Community</span> Says</h2>
            <button class="btn btn-outline" id="btn-show-testi">Give Testimonial</button>
          </div>

          <!-- Testimonial Form (Hidden by default) -->
          <div id="testi-form-container" class="testi-form-card hidden">
            <form id="testi-form">
               <h3>Your Voice Matters</h3>
               <div class="form-grid">
                 <div class="form-group">
                   <label for="testi-name">Name</label>
                   <input type="text" id="testi-name" name="name" placeholder="Full Name" value="${user.name || ''}" ${isLoggedIn ? 'readonly' : ''} required>
                 </div>
                 <div class="form-group">
                   <label for="testi-prodi">Prodi</label>
                   <input type="text" id="testi-prodi" name="prodi" placeholder="Your Study Program" value="${user.prodi || ''}" ${isLoggedIn && user.prodi ? 'readonly' : ''} required>
                 </div>
                 <div class="form-group">
                   <label for="testi-class">Class Code</label>
                   <input type="text" id="testi-class" name="class_code" placeholder="e.g. 08TPLE007" value="${user.classCode || user.class_code || ''}" ${isLoggedIn && (user.classCode || user.class_code) ? 'readonly' : ''} required>
                 </div>
                 <div class="form-group">
                   <label for="testi-rating">Rating</label>
                   <select id="testi-rating" name="rating" required>
                     <option value="5">5 - Excellent</option>
                     <option value="4">4 - Good</option>
                     <option value="3">3 - Average</option>
                     <option value="2">2 - Poor</option>
                     <option value="1">1 - Terrible</option>
                   </select>
                 </div>
               </div>
               <div class="form-group">
                 <label for="testi-comment">Your Thoughts</label>
                 <textarea id="testi-comment" name="comment" rows="3" placeholder="Share your experience with EcoDaily Campus" required></textarea>
               </div>
               <div class="form-actions">
                 <button type="button" class="btn btn-text" id="btn-cancel-testi">Cancel</button>
                 <button type="submit" class="btn btn-primary">Submit Testimonial</button>
               </div>
            </form>
          </div>

          <div id="testimonials-grid" class="testimonials-grid">
            <!-- Dynamically rendered testimonials -->
            <div class="loader">Loading testimonials...</div>
          </div>
        </div>
      </section>
    `;
  }

  async loadProducts(category = 'All') {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    try {
      const products = await ApiService.getProducts(category);
      const categories = await ApiService.getCategories();
      
      this.renderCategories(categories, category);
      
      if (products.length === 0) {
        grid.innerHTML = '<p class="empty-msg">No products found for this category.</p>';
        return;
      }
      
      grid.innerHTML = products.map(p => ProductCard.create(p)).join('');
    } catch (error) {
      grid.innerHTML = '<p class="error-msg">Error loading products. Please try again later.</p>';
    }
  }

  async loadTestimonials() {
    const grid = document.getElementById('testimonials-grid');
    if (!grid) return;

    try {
      this.testimonials = await ApiService.getTestimonials();
      this.renderTestimonials();
    } catch (error) {
      grid.innerHTML = '<p class="error-msg">Error loading testimonials.</p>';
    }
  }

  renderTestimonials() {
    const grid = document.getElementById('testimonials-grid');
    if (!grid || !this.testimonials) return;

    if (this.testimonials.length === 0) {
      grid.innerHTML = '<p class="empty-msg">No testimonials yet. Be the first to share your experience!</p>';
      return;
    }

    grid.innerHTML = this.testimonials.map(t => `
      <div class="testi-card">
        <div class="testi-rating">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>
        <p class="testi-comment">"${t.comment}"</p>
        <div class="testi-footer">
          <div class="testi-avatar">${t.name.charAt(0).toUpperCase()}</div>
          <div class="testi-meta">
            <span class="testi-name">${t.name}</span>
            <span class="testi-campus">${t.prodi} • ${t.class_code}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  addTestimonialListeners() {
    const showBtn = document.getElementById('btn-show-testi');
    const cancelBtn = document.getElementById('btn-cancel-testi');
    const formContainer = document.getElementById('testi-form-container');
    const form = document.getElementById('testi-form');

    if (showBtn) {
      showBtn.addEventListener('click', () => {
        formContainer.classList.remove('hidden');
        showBtn.classList.add('hidden');
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        formContainer.classList.add('hidden');
        showBtn.classList.remove('hidden');
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Submitting...';

        const formData = new FormData(form);
        const data = {
          name: formData.get('name'),
          prodi: formData.get('prodi'),
          class_code: formData.get('class_code'),
          rating: formData.get('rating'),
          comment: formData.get('comment')
        };

        const result = await ApiService.submitTestimonial(data);

        if (result.success) {
          this.testimonials.unshift(result.testimonial);
          this.renderTestimonials();
          form.reset();
          formContainer.classList.add('hidden');
          showBtn.classList.remove('hidden');
          alert('Thank you for your testimonial!');
        } else {
          alert('Error: ' + result.message);
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Testimonial';
      });
    }
  }

  renderCategories(categories, activeCategory) {
    const filterContainer = document.querySelector('.category-filters');
    if (!filterContainer) return;
    
    // Ensure 'All' is at the beginning
    let categoryList = [...categories];
    const hasAll = categoryList.some(cat => 
      (typeof cat === 'string' && cat === 'All') || 
      (typeof cat === 'object' && cat.name === 'All')
    );
    
    if (!hasAll) {
      categoryList.unshift('All');
    }
    
    filterContainer.innerHTML = categoryList.map(cat => {
      const catName = typeof cat === 'object' ? cat.name : cat;
      const isActive = activeCategory === catName;
      
      return `
        <button class="filter-btn ${isActive ? 'active' : ''}" data-category="${catName}">
          ${catName}
        </button>
      `;
    }).join('');
    
    // Add events to new buttons
    filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        this.loadProducts(cat);
      });
    });
  }

  addEventListeners() {
    this.container.addEventListener('click', async (e) => {
      const cartBtn = e.target.closest('.btn-add-cart');
      const wishlistBtn = e.target.closest('.btn-wishlist');
      
      if (!AuthService.isLoggedIn()) {
        if (cartBtn || wishlistBtn) window.location.hash = '#login';
        return;
      }

      const user = AuthService.getCurrentUser();

      if (cartBtn) {
        cartBtn.classList.add('loading');
        try {
          const id = cartBtn.getAttribute('data-id');
          const res = await ApiService.addToCart(user.id, id);
          if (res.success) {
             import('../components/navbar.js').then(m => m.default.refreshCartBadge());
             alert('Produk ditambahkan ke keranjang! 🛒');
          } else {
             alert('Gagal: ' + res.message);
          }
        } finally {
          cartBtn.classList.remove('loading');
        }
      }

      if (wishlistBtn) {
        e.preventDefault();
        e.stopPropagation();
        
        wishlistBtn.classList.add('loading');
        try {
          const id = wishlistBtn.getAttribute('data-product-id');
          console.log('Wishlist Toggle attempt for Product:', id);
          
          if (!id) throw new Error('Product ID not found on button');
          
          const res = await ApiService.toggleWishlist(user.id, id);
          console.log('API Response:', res);
          
          if (res.success) {
             wishlistBtn.classList.toggle('active');
             
             // Dynamic Toast
             const toast = document.createElement('div');
             toast.style.cssText = `
                position: fixed; bottom: 30px; right: 30px; 
                background: #10b981; color: white; padding: 12px 24px; 
                border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                z-index: 10000; animation: ecoSlideIn 0.4s ease forwards;
             `;
             toast.innerHTML = `<span style="font-size:1.2rem;margin-right:8px;">${res.action === 'added' ? '✅' : '🗑️'}</span> ${res.action === 'added' ? 'Saved to Favorites' : 'Removed from Favorites'}`;
             document.body.appendChild(toast);
             setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 500);
             }, 2000);
          } else {
             console.error('API Fail:', res.message);
             alert('Ups! Gagal: ' + res.message);
          }
        } catch (err) {
          console.error('Wishlist Action Catch:', err);
          alert('Error kritis saat menyimpan wishlist.');
        } finally {
          wishlistBtn.classList.remove('loading');
        }
      }
    });
  }
}

export default HomePage;
