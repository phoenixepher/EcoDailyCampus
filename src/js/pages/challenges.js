import ApiService from '../services/api.js';
import AuthService from '../services/auth.js';

class ChallengesPage {
  constructor() {
    this.container = document.getElementById('app');
    this.init();
  }

  async init() {
    this.renderLayout();
    await this.loadChallenges();
    await this.loadMySubmissions();
    this.addEventListeners();
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="challenges-page container section">
        <div class="page-header">
          <h1 class="section-title">Eco <span class="highlight">Challenges</span></h1>
          <p class="section-desc">Selesaikan tantangan ramah lingkungan, unggah bukti, dan kumpulkan Eco Points untuk ditukar dengan reward!</p>
        </div>

        <div class="challenges-tabs">
          <button class="tab-btn active" data-tab="available">Tantangan Tersedia</button>
          <button class="tab-btn" data-tab="my-submissions">Riwayat Partisipasi</button>
        </div>

        <div id="challenges-content">
          <div id="available-challenges" class="challenge-grid">
             <div class="loading-state">Memuat tantangan...</div>
          </div>
          
          <div id="my-submissions" class="submission-list hidden">
             <div class="loading-state">Memuat riwayat...</div>
          </div>
        </div>
      </div>

      <!-- Upload Modal -->
      <div id="upload-modal" class="modal hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Unggah Bukti Selesai</h3>
            <p id="selected-challenge-title" style="font-weight: 600; color: #10b981; margin-top: 5px;"></p>
            <button class="close-modal">&times;</button>
          </div>
          <form id="challenge-upload-form" class="modal-form">
            <input type="hidden" id="challenge-id-input" name="challenge_id">
            <input type="hidden" name="action" value="submit">
            
            <div class="form-group">
                <label>Foto Bukti (Gambar)</label>
                <div class="file-upload-wrapper">
                    <input type="file" id="proof-image" name="proof_image" accept="image/*" required>
                    <div class="file-preview" id="image-preview">
                        <span>Klik untuk pilih foto bukti</span>
                    </div>
                </div>
            </div>

            <p class="form-note">*Admin akan melakukan verifikasi sebelum poin diberikan.</p>
            
            <button type="submit" class="btn btn-primary btn-full">Kirim Bukti</button>
          </form>
        </div>
      </div>
    `;
  }

  async loadChallenges() {
    const listEl = document.getElementById('available-challenges');
    const res = await ApiService.getChallenges();
    const challenges = Array.isArray(res) ? res : (res.challenges || []);

    if (!challenges.length) {
      listEl.innerHTML = '<p class="empty-state">Belum ada tantangan aktif saat ini.</p>';
      return;
    }

    listEl.innerHTML = challenges.map(c => {
      const isExpired = c.end_date && new Date(c.end_date) < new Date();
      const isComingSoon = c.start_date && new Date(c.start_date) > new Date();
      const statusClass = c.is_submitted ? `status-${c.my_status}` : '';
      
      return `
        <div class="challenge-card" data-difficulty="${c.difficulty}">
          <div class="challenge-img">
            <img src="${c.image ? c.image : 'https://via.placeholder.com/300x150?text=Eco+Challenge'}" alt="${c.title}">
            <div class="challenge-badge">${c.difficulty.toUpperCase()}</div>
          </div>
          <div class="challenge-body">
            <h3>${c.title}</h3>
            <p>${c.description}</p>
            <div class="challenge-meta">
               <span>📅 ${c.start_date || 'Start'} - ${c.end_date || 'End'}</span>
            </div>
            <div class="challenge-footer">
              <div class="reward">
                  <span class="icon">🌿</span>
                  <span class="val">+${c.reward_points} Pts</span>
              </div>
              ${c.is_approved ? 
                `<button class="btn btn-success btn-sm" disabled>✅ Selesai</button>` : 
                (c.my_status === 'pending' ? 
                  `<button class="btn btn-outline btn-sm" disabled>⏳ Verifikasi</button>` : 
                  `<button class="btn btn-primary btn-sm btn-participate" data-id="${c.id}" ${isExpired || isComingSoon ? 'disabled' : ''}>
                    ${isExpired ? 'Expired' : (isComingSoon ? 'Soon' : 'Ikuti')}
                  </button>`)
              }
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  async loadMySubmissions() {
    const listEl = document.getElementById('my-submissions');
    const res = await ApiService.getMyChallengeSubmissions();
    const submissions = res.submissions || [];

    if (!submissions.length) {
      listEl.innerHTML = '<p class="empty-state">Kamu belum mengikuti tantangan apapun.</p>';
      return;
    }

    listEl.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tantangan</th>
              <th>Bukti</th>
              <th>Status</th>
              <th>Poin</th>
              <th>Catatan Admin</th>
            </tr>
          </thead>
          <tbody>
            ${submissions.map(s => `
              <tr>
                <td><strong>${s.challenge_title}</strong></td>
                <td><a href="${s.proof_image}" target="_blank" class="link-preview">Lihat Foto</a></td>
                <td><span class="status-badge status-${s.status}">${s.status}</span></td>
                <td><span style="font-weight:700; color:#10b981;">+${s.reward_points}</span></td>
                <td><small>${s.admin_note || '-'}</small></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  addEventListeners() {
    const tabs = document.querySelectorAll('.tab-btn');
    const availableView = document.getElementById('available-challenges');
    const myView = document.getElementById('my-submissions');
    const modal = document.getElementById('upload-modal');
    const closeBtn = document.querySelector('.close-modal');
    const form = document.getElementById('challenge-upload-form');
    const imageInput = document.getElementById('proof-image');
    const imagePreview = document.getElementById('image-preview');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        if (tab.dataset.tab === 'available') {
          availableView.classList.remove('hidden');
          myView.classList.add('hidden');
        } else {
          availableView.classList.add('hidden');
          myView.classList.remove('hidden');
        }
      });
    });

    // Open Modal
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-participate')) {
        if (!AuthService.isLoggedIn()) {
            window.location.hash = '#login';
            return;
        }
        const id = e.target.dataset.id;
        const card = e.target.closest('.challenge-card');
        const title = card.querySelector('h3').innerText;
        
        document.getElementById('challenge-id-input').value = id;
        const titleEl = document.getElementById('selected-challenge-title');
        if(titleEl) titleEl.innerText = title;
        
        modal.classList.remove('hidden');
      }
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      form.reset();
      imagePreview.innerHTML = '<span>Klik untuk pilih foto bukti</span>';
    });

    // Image Preview
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          imagePreview.innerHTML = `<img src="${re.target.result}" style="max-height: 150px; border-radius: 8px;">`;
        };
        reader.readAsDataURL(file);
      }
    });

    // Handle Submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Mengirim...';

      const formData = new FormData(form);
      const res = await ApiService.submitChallengeProof(formData);

      if (res.success) {
        alert(res.message);
        modal.classList.add('hidden');
        form.reset();
        await this.loadMySubmissions();
        // Switch to history tab
        document.querySelector('[data-tab="my-submissions"]').click();
      } else {
        alert(res.message);
      }
      
      btn.disabled = false;
      btn.textContent = 'Kirim Bukti';
    });
  }
}

export default ChallengesPage;
