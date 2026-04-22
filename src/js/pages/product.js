/**
 * Product Detail Page Logic with Review System
 */
import ApiService from '../services/api.js';
import AuthService from '../services/auth.js';
import { formatCurrency } from '../utils/formatter.js';

class ProductPage {
  constructor(productId) {
    this.productId = productId;
    this.container = document.getElementById('app');
    this.init();
  }

  async init() {
    this.container.innerHTML = '<div class="loader">Loading product details...</div>';
    
    this.product = await ApiService.getProductById(this.productId);
    if (!this.product) {
      this.container.innerHTML = '<div class="error-msg">Product not found.</div>';
      return;
    }

    this.reviews = await ApiService.getReviews(this.productId);
    this.render();
    this.addReviewListeners();
  }

  render() {
    const rawUser = localStorage.getItem('eco_current_user');
    const user = rawUser ? JSON.parse(rawUser) : {};
    const isLoggedIn = !!rawUser;

    this.container.innerHTML = `
      <div class="product-detail-page container">
        <div class="product-breadcrumb">
          <a href="#home">Home</a> / <a href="#home">${this.product.category}</a> / ${this.product.name}
        </div>

        <div class="product-detail-grid">
          <div class="product-media">
             <img src="${this.product.image}" alt="${this.product.name}" class="main-image">
          </div>

          <div class="product-info">
            <span class="p-category">${this.product.category}</span>
            <h1 class="p-title">${this.product.name}</h1>
            
            <div class="p-rating-summary">
              <span class="stars">★★★★★</span>
              <span class="count">(${this.reviews.length} Reviews)</span>
            </div>

            <div class="p-price">${formatCurrency(this.product.price)}</div>
            
            <p class="p-description">${this.product.description}</p>

            <div class="p-meta">
               <div class="p-eco-badge">
                 <span class="icon">🌱</span>
                 <span>Earn <strong>${this.product.ecoPoints}</strong> Eco Points</span>
               </div>
               <div class="p-stock">Availability: <span>In Stock (${this.product.stock})</span></div>
            </div>

            <div class="p-actions">
               <div class="qty-selector">
                 <button class="qty-btn" id="qty-minus">-</button>
                 <input type="number" value="1" min="1" id="qty-input">
                 <button class="qty-btn" id="qty-plus">+</button>
               </div>
               <div class="btn-group">
                 <button class="btn btn-primary btn-lg" id="add-to-cart-btn">Add to Cart</button>
                 <button class="btn btn-outline btn-lg btn-wishlist-detail" id="wishlist-btn">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                 </button>
               </div>
            </div>
          </div>
        </div>

        <!-- Reviews Section -->
        <section class="reviews-section">
          <div class="section-header">
            <h2>Student Reviews & Ratings</h2>
            <button class="btn btn-outline" id="show-review-form">Write a Review</button>
          </div>

          <div id="review-form-container" class="review-form-card hidden">
            <form id="review-form">
               <h3>Share Your Experience</h3>
               <div class="form-grid">
                 <div class="form-group">
                   <label for="rev-name">Full Name</label>
                   <input type="text" id="rev-name" name="name" placeholder="Enter your name" value="${user.name || ''}" ${isLoggedIn ? 'readonly' : ''} required>
                 </div>
                 <div class="form-group">
                   <label for="rev-prodi">Study Program (Prodi)</label>
                   <input type="text" id="rev-prodi" name="prodi" placeholder="e.g. Teknik Informatika" value="${user.prodi || ''}" ${isLoggedIn && user.prodi ? 'readonly' : ''} required>
                 </div>
                 <div class="form-group">
                   <label for="rev-class">Class Code</label>
                   <input type="text" id="rev-class" name="class_code" placeholder="e.g. 08TPLE007" value="${user.classCode || user.class_code || ''}" ${isLoggedIn && (user.classCode || user.class_code) ? 'readonly' : ''} required>
                 </div>
                 <div class="form-group">
                   <label for="rev-rating">Rating (1-5)</label>
                   <select id="rev-rating" name="rating" required>
                     <option value="5">5 - Excellent</option>
                     <option value="4">4 - Good</option>
                     <option value="3">3 - Average</option>
                     <option value="2">2 - Poor</option>
                     <option value="1">1 - Terrible</option>
                   </select>
                 </div>
               </div>
               <div class="form-group">
                 <label for="rev-comment">Your Comment</label>
                 <textarea id="rev-comment" name="comment" rows="4" placeholder="What do you think about this product?" required></textarea>
               </div>
               <div class="form-actions">
                 <button type="button" class="btn btn-text" id="cancel-review">Cancel</button>
                 <button type="submit" class="btn btn-primary">Submit Review</button>
               </div>
            </form>
          </div>

          <div id="reviews-list" class="reviews-list">
            ${this.renderReviews()}
          </div>
        </section>
      </div>
    `;
  }

  renderReviews() {
    if (this.reviews.length === 0) {
      return '<p class="empty-reviews">No reviews yet. Be the first to review!</p>';
    }

    return this.reviews.map(rev => `
      <div class="review-item">
        <div class="review-header">
          <div class="user-avatar">
            ${rev.name.charAt(0).toUpperCase()}
          </div>
          <div class="user-info">
            <div class="user-name">${rev.name}</div>
            <div class="user-campus">${rev.prodi} • ${rev.class_code}</div>
          </div>
          <div class="review-rating">
            ${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}
          </div>
        </div>
        <div class="review-body">
          <p>${rev.comment}</p>
          <span class="review-date">${new Date(rev.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    `).join('');
  }

  addReviewListeners() {
    const showFormBtn = document.getElementById('show-review-form');
    const cancelFormBtn = document.getElementById('cancel-review');
    const formContainer = document.getElementById('review-form-container');
    const reviewForm = document.getElementById('review-form');
    const qtyInput = document.getElementById('qty-input');
    const qtyPlus = document.getElementById('qty-plus');
    const qtyMinus = document.getElementById('qty-minus');

    if (qtyPlus) {
      qtyPlus.addEventListener('click', () => {
        qtyInput.value = parseInt(qtyInput.value) + 1;
      });
    }

    if (qtyMinus) {
      qtyMinus.addEventListener('click', () => {
        if (parseInt(qtyInput.value) > 1) {
          qtyInput.value = parseInt(qtyInput.value) - 1;
        }
      });
    }

    if (showFormBtn) {
      showFormBtn.addEventListener('click', () => {
        formContainer.classList.remove('hidden');
        showFormBtn.classList.add('hidden');
      });
    }

    if (cancelFormBtn) {
      cancelFormBtn.addEventListener('click', () => {
        formContainer.classList.add('hidden');
        showFormBtn.classList.remove('hidden');
      });
    }

    if (reviewForm) {
      reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = reviewForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Submitting...';

        const formData = new FormData(reviewForm);
        const reviewData = {
          product_id: this.productId,
          name: formData.get('name'),
          prodi: formData.get('prodi'),
          class_code: formData.get('class_code'),
          rating: formData.get('rating'),
          comment: formData.get('comment')
        };

        const result = await ApiService.submitReview(reviewData);

        if (result.success) {
          // Add new review to list
          this.reviews.unshift(result.review);
          document.getElementById('reviews-list').innerHTML = this.renderReviews();
          
          // Reset and hide form
          reviewForm.reset();
          formContainer.classList.add('hidden');
          showFormBtn.classList.remove('hidden');
          
          // Show success message
          alert('Thank you for your review!');
        } else {
          alert('Error: ' + result.message);
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Review';
      });
    }

    // Add To Cart Listener
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
      addToCartBtn.onclick = async () => {
        if (!AuthService.isLoggedIn()) {
          window.location.hash = '#login';
          return;
        }

        addToCartBtn.classList.add('loading');
        addToCartBtn.disabled = true;

        try {
          const qtyValue = document.getElementById('qty-input').value;
          const qty = parseInt(qtyValue) || 1;
          const user = AuthService.getCurrentUser();
          
          const res = await ApiService.addToCart(user.id, this.productId, qty);
          if (res.success) {
            import('../components/navbar.js').then(m => m.default.refreshCartBadge());
            alert('Produk ditambahkan ke keranjang! 🛒');
          } else {
            alert('Gagal: ' + res.message);
          }
        } finally {
          addToCartBtn.classList.remove('loading');
          addToCartBtn.disabled = false;
        }
      };
    }

    // Wishlist Listener
    const wishlistBtn = document.getElementById('wishlist-btn');
    if (wishlistBtn) {
      wishlistBtn.onclick = async () => {
        if (!AuthService.isLoggedIn()) {
          window.location.hash = '#login';
          return;
        }

        wishlistBtn.classList.add('loading');
        try {
          const user = AuthService.getCurrentUser();
          const res = await ApiService.toggleWishlist(user.id, this.productId);
          if (res.success) {
             wishlistBtn.classList.toggle('active');
             alert(res.action === 'added' ? 'Ditambahkan ke wishlist! 💚' : 'Dihapus dari wishlist.');
          }
        } finally {
          wishlistBtn.classList.remove('loading');
        }
      };
    }
  }
}

export default ProductPage;
