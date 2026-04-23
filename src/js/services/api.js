/**
 * API Service for EcoDaily Campus (MySQL Backend Connection)
 * Handles data fetching from real PHP/MySQL endpoints.
 */

const isPublicFolder = window.location.pathname.includes('/public/');
const API_BASE = isPublicFolder ? '../api/' : 'api/';

class ApiService {
  /**
   * Fetch User Impact Data (Stats and Activity)
   */
  static async getUserImpact() {
    try {
      const response = await fetch(`${API_BASE}challenges.php?action=user_impact`, { credentials: 'include' });
      return await response.json();
    } catch (error) {
      console.error('ApiService User Impact Error:', error);
      return { success: false, message: 'Gagal memuat data dampak lingkungan.' };
    }
  }

  /**
   * Address Management
   */
  static async getAddresses() {
    try {
      const response = await fetch(`${API_BASE}addresses.php`, { credentials: 'include' });
      return await response.json();
    } catch (error) {
      console.error('ApiService Get Addresses Error:', error);
      return { success: false, message: 'Gagal memuat daftar alamat.' };
    }
  }

  static async addAddress(addressData) {
    try {
      const response = await fetch(`${API_BASE}addresses.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...addressData, action: 'add' })
      });
      return await response.json();
    } catch (error) {
      console.error('ApiService Add Address Error:', error);
      return { success: false, message: 'Gagal menambah alamat.' };
    }
  }

  static async setDefaultAddress(id) {
    try {
      const response = await fetch(`${API_BASE}addresses.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, action: 'set_default' })
      });
      return await response.json();
    } catch (error) {
      console.error('ApiService Set Default Address Error:', error);
      return { success: false, message: 'Gagal mengatur alamat utama.' };
    }
  }

  static async deleteAddress(id) {
    try {
      const response = await fetch(`${API_BASE}addresses.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, action: 'delete' })
      });
      return await response.json();
    } catch (error) {
      console.error('ApiService Delete Address Error:', error);
      return { success: false, message: 'Gagal menghapus alamat.' };
    }
  }

  /**
   * Fetch all products or filter by category
   */
  static async getProducts(category = 'All') {
    try {
      const response = await fetch(`${API_BASE}products.php?category=${encodeURIComponent(category)}`, {
        credentials: 'include'
      });
      if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || 'Gagal mengambil data produk dari database.');
      }

      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('ApiService DB Error:', error);
      return [];
    }
  }

  /**
   * Get all categories from database
   */
  static async getCategories() {
    try {
      const response = await fetch(`${API_BASE}categories.php`, { credentials: 'include' });
      const data = await response.json();
      return data.categories || ['All'];
    } catch (error) {
      console.error('ApiService DB Error:', error);
      return ['All'];
    }
  }

  static async getProductById(id) {
    const products = await this.getProducts();
    return products.find(p => p.id == id) || null;
  }

  static async getReviews(productId) {
    try {
      const response = await fetch(`${API_BASE}reviews.php?product_id=${productId}`, { credentials: 'include' });
      const data = await response.json();
      return data.reviews || [];
    } catch (error) {
      console.error('ApiService Reviews Error:', error);
      return [];
    }
  }

  static async submitReview(reviewData) {
    try {
      const response = await fetch(`${API_BASE}reviews.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(reviewData)
      });
      return await response.json();
    } catch (error) {
      console.error('ApiService Submit Review Error:', error);
      return { success: false, message: 'Gagal mengirim ulasan.' };
    }
  }

  static async getTestimonials() {
    try {
      const response = await fetch(`${API_BASE}testimonials.php`, { credentials: 'include' });
      const data = await response.json();
      return data.testimonials || [];
    } catch (error) {
      console.error('ApiService Testimonials Error:', error);
      return [];
    }
  }

  static async submitTestimonial(testimonialData) {
    try {
      const response = await fetch(`${API_BASE}testimonials.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(testimonialData)
      });
      return await response.json();
    } catch (error) {
      console.error('ApiService Submit Testimonial Error:', error);
      return { success: false, message: 'Gagal mengirim testimoni.' };
    }
  }

  static async getCart(userId) {
    const res = await fetch(`${API_BASE}cart.php?user_id=${userId}`, { credentials: 'include' });
    return await res.json();
  }

  static async addToCart(userId, productId, quantity = 1) {
    const res = await fetch(`${API_BASE}cart.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'add', user_id: userId, product_id: productId, quantity })
    });
    return await res.json();
  }

  static async updateCart(userId, productId, quantity) {
    const res = await fetch(`${API_BASE}cart.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'update', user_id: userId, product_id: productId, quantity })
    });
    return await res.json();
  }

  static async removeFromCart(userId, productId) {
    const res = await fetch(`${API_BASE}cart.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'remove', user_id: userId, product_id: productId })
    });
    return await res.json();
  }

  static async getWishlist(userId) {
    const res = await fetch(`${API_BASE}wishlist.php?user_id=${userId}`, { credentials: 'include' });
    return await res.json();
  }

  static async toggleWishlist(userId, productId) {
    const res = await fetch(`${API_BASE}wishlist.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'toggle', user_id: userId, product_id: productId })
    });
    return await res.json();
  }

  static async moveToCart(userId, productId) {
    const res = await fetch(`${API_BASE}wishlist.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'move_to_cart', user_id: userId, product_id: productId })
    });
    return await res.json();
  }

  static async getOrders(userId, adminView = false) {
    const url = adminView ? `${API_BASE}orders.php?admin_view=1` : `${API_BASE}orders.php?user_id=${userId}`;
    const res = await fetch(url, { credentials: 'include' });
    return await res.json();
  }

  static async checkout(orderData) {
    const res = await fetch(`${API_BASE}orders.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'checkout', ...orderData })
    });
    return await res.json();
  }

  static async updateOrderStatus(orderId, status) {
    const res = await fetch(`${API_BASE}orders.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'update_status', order_id: orderId, status })
    });
    return await res.json();
  }

  static async getChallenges() {
    try {
      const response = await fetch(`${API_BASE}challenges.php?action=list`, { credentials: 'include' });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('ApiService Challenges Error:', error);
      return [];
    }
  }

  static async submitChallengeProof(formData) {
    try {
      const response = await fetch(`${API_BASE}challenges.php`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      return await response.json();
    } catch (error) {
      console.error('ApiService Submit Proof Error:', error);
      return { success: false, message: 'Gagal mengirim bukti tantangan.' };
    }
  }

  static async getMyChallengeSubmissions() {
    try {
      const response = await fetch(`${API_BASE}challenges.php?action=my_submissions`, { credentials: 'include' });
      return await response.json();
    } catch (error) {
      console.error('ApiService My Submissions Error:', error);
      return [];
    }
  }

  static async getAdminChallengeSubmissions() {
    try {
      const response = await fetch(`${API_BASE}admin_challenges.php`, { credentials: 'include' });
      const data = await response.json();
      return data.submissions || [];
    } catch (error) {
      console.error('ApiService Admin Challenges Error:', error);
      return [];
    }
  }

  static async getProductsForAdmin() {
    try {
      const response = await fetch(`${API_BASE}product_inventory.php`, { credentials: 'include' });
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('ApiService Inventory Error:', error);
      return [];
    }
  }

  static async verifyChallengeSubmission(submissionId, status, note = '') {
    try {
      const response = await fetch(`${API_BASE}challenges.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'admin_verify', submission_id: submissionId, status, note })
      });
      return await response.json();
    } catch (error) {
      console.error('ApiService Verify Challenge Error:', error);
      return { success: false, message: 'Gagal memverifikasi tantangan.' };
    }
  }

  static async adminAddChallenge(challengeData) {
    try {
      const response = await fetch(`${API_BASE}challenges.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'admin_add_challenge', ...challengeData })
      });
      return await response.json();
    } catch (error) {
      console.error('ApiService Admin Add Challenge Error:', error);
      return { success: false, message: 'Gagal menambah tantangan baru.' };
    }
  }

  static async updateProfile(formData) {
    try {
      const response = await fetch(`${API_BASE}auth.php`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      return await response.json();
    } catch (error) {
      console.error('ApiService Update Profile Error:', error);
      return { success: false, message: 'Gagal memperbarui profil.' };
    }
  }
}

export default ApiService;
