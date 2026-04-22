import ApiService from '../services/api.js';
import AuthService from '../services/auth.js';

class ImpactPage {
  constructor() {
    this.container = document.getElementById('app');
    this.data = null;
    this.init();
  }

  async init() {
    if (!AuthService.isLoggedIn()) {
      window.location.hash = '#login';
      return;
    }

    this.renderLoading();
    const res = await ApiService.getUserImpact();
    if (res.success) {
      this.data = res;
      this.render();
    } else {
      this.renderError();
    }
  }

  renderLoading() {
    this.container.innerHTML = `
      <div class="impact-page container section">
        <div class="loader-centered">Memuat Impact Dashboard Anda...</div>
      </div>
    `;
  }

  renderError() {
    this.container.innerHTML = `
      <div class="impact-page container section">
        <div class="error-msg">Gagal memuat data pencapaian. Silakan coba lagi.</div>
      </div>
    `;
  }

  render() {
    const { stats, recent_activities } = this.data;
    const user = AuthService.getCurrentUser();

    this.container.innerHTML = `
      <div class="impact-page container section">
        <div class="page-header">
           <h1 class="section-title">My <span class="highlight">Impact</span> Dashboard</h1>
           <p class="section-subtitle">Pantau kontribusi nyata Anda untuk kampus yang lebih hijau.</p>
        </div>

        <div class="impact-stats-grid">
           <div class="stat-impact-card">
              <div class="si-icon points">🌿</div>
              <div class="si-data">
                <span class="si-val">${stats.eco_points}</span>
                <span class="si-label">Eco Points</span>
              </div>
           </div>
           <div class="stat-impact-card">
              <div class="si-icon waste">♻️</div>
              <div class="si-data">
                <span class="si-val">${stats.waste_saved.toFixed(1)} kg</span>
                <span class="si-label">Waste Saved</span>
              </div>
           </div>
           <div class="stat-impact-card">
              <div class="si-icon challenges">🏆</div>
              <div class="si-data">
                <span class="si-val">${stats.challenges_completed}</span>
                <span class="si-label">Challenges</span>
              </div>
           </div>
        </div>

        <div class="impact-main-content">
           <!-- Activity Feed -->
           <div class="impact-main-card">
              <h3>Aktivitas Terbaru</h3>
              <div class="activity-feed">
                 ${recent_activities && recent_activities.length > 0 ? recent_activities.map(act => `
                    <div class="activity-item">
                       <div class="act-icon ${act.status}">
                          ${act.type === 'challenge' ? '🌿' : '🛒'}
                       </div>
                       <div class="act-details">
                          <p class="act-text">
                            <strong>${act.name}</strong> 
                            ${this.getActivityVerb(act)}
                          </p>
                          <span class="act-date">${new Date(act.created_at).toLocaleString()}</span>
                       </div>
                       <div class="act-status">
                          <span class="status-badge ${act.status}">${act.status}</span>
                       </div>
                    </div>
                 `).join('') : '<p class="empty-state">Belum ada aktivitas terbaru.</p>'}
              </div>
           </div>

           <!-- Badges Info -->
           <div class="impact-sidebar-card">
              <h3>Level Keberlanjutan</h3>
              <div class="badge-progress-box">
                  ${this.renderBadgeProgress(stats.eco_points)}
              </div>
           </div>
        </div>
      </div>
    `;
  }

  renderBadgeProgress(points) {
    let nextLevel = "";
    let target = 0;
    let currentBadge = "Beginner";
    let progress = 0;

    if (points <= 500) {
      nextLevel = "Intermediate";
      target = 501;
      progress = (points / 500) * 100;
    } else if (points <= 1000) {
      currentBadge = "Intermediate";
      nextLevel = "Eco Warrior";
      target = 1001;
      progress = ((points - 500) / 500) * 100;
    } else {
      currentBadge = "Eco Warrior";
      return `
        <div class="progress-circle warrior">
            <span class="pc-val">MAX</span>
        </div>
        <p class="badge-target">Selamat! Anda adalah <strong>${currentBadge}</strong> yang luar biasa! 🌳</p>
        <div class="badges-info-list">
           <div class="info-item active warrior">
               <span class="ii-icon">🌳</span>
               <span>${currentBadge}</span>
           </div>
        </div>
      `;
    }

    return `
      <div class="progress-circle">
          <span class="pc-val">${Math.min(100, progress).toFixed(0)}%</span>
      </div>
      <p class="badge-target">Butuh <strong>${target - points}</strong> poin lagi untuk level <strong>${nextLevel}</strong>!</p>
      <div class="badges-info-list">
          <div class="info-item active">
              <span class="ii-icon">${currentBadge === 'Beginner' ? '🌱' : '🌿'}</span>
              <span>${currentBadge}</span>
          </div>
      </div>
    `;
  }

  getActivityVerb(act) {
    if (act.type === 'challenge') {
       if (act.status === 'approved') return 'telah dikirim & disetujui';
       if (act.status === 'pending') return 'menunggu verifikasi';
       if (act.status === 'rejected') return 'tidak disetujui';
    }
    return '';
  }
}

export default ImpactPage;
