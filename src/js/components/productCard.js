/**
 * ProductCard Component
 */
import { formatCurrency } from '../utils/formatter.js';

class ProductCard {
  /**
   * Render product card HTML
   * @param {Object} product 
   * @returns {string}
   */
  static create(product) {
    const { id, name, price, image, category, rating, ecoPoints, isNew } = product;
    
    // Handle category object or string
    const categoryName = typeof category === 'object' ? category.name : category;
    
    // Fallback image
    const productImage = image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=500';

    return `
      <div class="product-card" data-id="${id}">
        <div class="product-image-container">
          ${isNew ? '<span class="badge-new">New Trend</span>' : ''}
          <div class="product-image-ratio">
            <a href="#product/${id}">
              <img src="${productImage}" alt="${name}" class="product-image" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=500'">
            </a>
          </div>
          <div class="product-card-actions">
            <button type="button" class="action-btn btn-wishlist" data-product-id="${id}" title="Simpan ke Keinginan">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
          </div>
        </div>
        
        <div class="product-details">
          <div class="product-top-meta">
            <span class="product-tag">${categoryName}</span>
            <div class="product-rating">
              <span class="star-icon">★</span>
              <span class="rating-text">${rating || '4.5'}</span>
            </div>
          </div>
          
          <h3 class="product-name">
            <a href="#product/${id}">${name}</a>
          </h3>
          
          <div class="product-pricing-box">
            <div class="price-wrapper">
              <span class="current-price">${formatCurrency(price)}</span>
              <div class="eco-benefit">
                <span class="eco-ico">🌱</span>
                <span class="eco-txt">+${ecoPoints} pts</span>
              </div>
            </div>
            <a href="#product/${id}" class="action-btn-detail" title="Lihat Detail Produk">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </a>
          </div>
        </div>
      </div>
    `;
  }
}

export default ProductCard;
