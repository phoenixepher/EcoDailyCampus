/**
 * Admin Dashboard - Insights & Analytics
 */
import ApiService from '../services/api.js';
import AuthService from '../services/auth.js';
import { formatCurrency } from '../utils/formatter.js';

class DashboardPage {
  constructor() {
    if (!AuthService.isAdmin()) {
      window.location.hash = '#home';
      return;
    }
    this.container = document.getElementById('app');
    this.stats = null;
    this.init();
  }

  async init() {
    this.container.innerHTML = '<div class="loader">Memuat data insight mahasiswa...</div>';
    
    try {
        const res = await fetch('../api/admin_actions.php?action=get_stats', { credentials: 'include' });
        const data = await res.json();
        
        if (data.success) {
            this.stats = data.stats;
            this.render();
        } else {
            this.container.innerHTML = `<div class="error-msg">Gagal: ${data.message}</div>`;
        }
    } catch (err) {
        this.container.innerHTML = '<div class="error-msg">Kesalahan koneksi insight.</div>';
    }
  }

  render() {
    const stats = this.stats || {};
    const recentOrders = stats.recent_orders || [];
    const recentReviews = stats.recent_reviews || [];
    const recentTestimonials = stats.recent_testimonials || [];

    this.container.innerHTML = `
      <section class="dashboard-page container">
        <div class="dash-welcome">
          <h1>Dashboard <span class="highlight">Insight</span></h1>
          <p>Statistik performa EcoDaily Campus secara real-time.</p>
        </div>

        <div class="stats-overview-grid">
           <div class="stat-insight-card">
              <div class="s-icon purple">💰</div>
              <div class="s-data">
                 <span class="s-label">Total Penjualan</span>
                 <h3 class="s-value">${formatCurrency(stats.total_revenue || 0)}</h3>
              </div>
           </div>
           <div class="stat-insight-card">
              <div class="s-icon green">📦</div>
              <div class="s-data">
                 <span class="s-label">Pesanan Masuk</span>
                 <h3 class="s-value">${stats.total_orders || 0}</h3>
              </div>
           </div>
           <div class="stat-insight-card">
              <div class="s-icon blue">👕</div>
              <div class="s-data">
                 <span class="s-label">Katalog Produk</span>
                 <h3 class="s-value">${stats.total_products || 0} Item</h3>
              </div>
           </div>
           <div class="stat-insight-card">
              <div class="s-icon orange">👥</div>
              <div class="s-data">
                 <span class="s-label">Aktif Student</span>
                 <h3 class="s-value">${stats.total_users || 0} User</h3>
              </div>
           </div>
        </div>

        <div class="dash-main-grid">
           <!-- Recent Orders -->
           <div class="dash-card">
              <div class="card-header">
                 <h3>Recent Orders</h3>
                 <a href="#admin-orders" class="btn-link">View All</a>
              </div>
              <div class="table-mini">
                 <table class="simple-table">
                    <thead><tr><th>ID</th><th>Customer</th><th>Total</th></tr></thead>
                    <tbody>
                       ${recentOrders.length > 0 ? recentOrders.map(o => `
                          <tr><td>#ECO-${o.id}</td><td>${o.customer_name || 'Anonymous'}</td><td>${formatCurrency(o.total_amount || 0)}</td></tr>
                       `).join('') : '<tr><td colspan="3" class="text-center py-4 text-muted">Belum ada transaksi terbaru.</td></tr>'}
                    </tbody>
                 </table>
              </div>
           </div>

           <!-- Multi-Feedback Section -->
           <div class="dash-card feedback-combined">
              <div class="card-multi-header">
                 <div class="header-tab active">Student Feedback</div>
              </div>
              
              <div class="feedback-grid">
                 <!-- Product Reviews -->
                 <div class="feedback-col">
                    <h4>Product Reviews</h4>
                    <div class="f-list">
                       ${recentReviews.length > 0 ? recentReviews.map(r => `
                          <div class="mini-feedback">
                             <div class="mf-head"><strong>${r.name || 'User'}</strong> <span>${'⭐'.repeat(r.rating || 5)}</span></div>
                             <p class="mf-prod">${r.product_name || 'Produk'}</p>
                             <p class="mf-comment">"${r.comment || ''}"</p>
                          </div>
                       `).join('') : '<div class="text-center py-4 text-muted border-dashed">Belum ada ulasan mahasiswa.</div>'}
                    </div>
                 </div>

                 <!-- Site Testimonials (Web Feedback) -->
                 <div class="feedback-col">
                    <h4>Web Feedback</h4>
                    <div class="f-list">
                       ${recentTestimonials.length > 0 ? recentTestimonials.map(t => `
                          <div class="mini-feedback site-f">
                             <div class="mf-head"><strong>${t.name || 'User'}</strong> <span>${'⭐'.repeat(t.rating || 5)}</span></div>
                             <p class="mf-prodi">${t.prodi || 'Student'}</p>
                             <p class="mf-comment">"${t.comment || ''}"</p>
                          </div>
                       `).join('') : '<div class="text-center py-4 text-muted border-dashed">Belum ada masukan situs.</div>'}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>
    `;
  }
}

export default DashboardPage;
