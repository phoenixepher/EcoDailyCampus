/**
 * Auth Page Logic - Login & Registration Upgrade
 * Focused on Security, UX, and @gmail.com validation
 */
import AuthService from '../services/auth.js';

class AuthPage {
  constructor(mode = 'login') {
    this.container = document.getElementById('app');
    this.mode = mode; // 'login' or 'register'
    this.init();
  }

  init() {
    this.render();
    this.addEventListeners();
    this.addRealTimeValidation();
  }

  render() {
    this.container.innerHTML = `
      <section class="auth-page-container">
        <div class="auth-visual">
          <div class="visual-content">
            <div class="visual-logo">🌿</div>
            <h1>EcoDaily <span class="highlight">Campus</span></h1>
            <p>Join the green revolution on campus. Shop sustainable, earn points, and make a real impact on our environment.</p>
            <div class="visual-stats">
              <div class="stat-item">
                <span class="stat-value">5k+</span>
                <span class="stat-label">Students</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">12k</span>
                <span class="stat-label">Trees Saved</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="auth-form-side">
          <div class="auth-card">
            <div class="auth-header">
              <h2>${this.mode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}</h2>
              <p>${this.mode === 'login' ? 'Masuk untuk melanjutkan aksi hijau kamu.' : 'Mulai perjalanan berkelanjutan kamu hari ini.'}</p>
            </div>
            
            <form id="auth-form" class="auth-form">
              ${this.mode === 'register' ? `
                <div class="form-group">
                  <label for="reg-name">Nama Lengkap</label>
                  <div class="input-group">
                    <span class="input-icon"></span>
                    <input type="text" id="reg-name" name="name" placeholder="Masukkan nama lengkap" required>
                  </div>
                </div>
              ` : ''}
              
              <div class="form-group">
                <label for="auth-email">Email Kampus</label>
                <div class="input-group">
                  <span class="input-icon"></span>
                  <input type="email" id="auth-email" name="email" placeholder="contoh@gmail.com" required>
                </div>
                <div id="email-error" class="error-msg hidden">Mohon gunakan alamat @gmail.com yang valid.</div>
              </div>
              
              <div class="form-group">
                <label for="auth-password">Kata Sandi</label>
                <div class="input-group">
                  <span class="input-icon"></span>
                  <input type="password" id="auth-password" name="password" placeholder="••••••••" required>
                  <button type="button" class="password-toggle" id="toggle-password" aria-label="Lihat kata sandi">👁️</button>
                </div>
              </div>
              
              <button type="submit" class="btn-auth-submit" id="btn-submit">
                <span class="btn-text">${this.mode === 'login' ? 'Masuk Sekarang' : 'Daftar Sekarang'}</span>
                <div class="btn-loader hidden"></div>
              </button>
            </form>
            
            <div class="auth-switch">
              ${this.mode === 'login' ?
        `Belum punya akun? <a href="#register">Daftar sekarang</a>` :
        `Sudah punya akun? <a href="#login">Masuk di sini</a>`
      }
            </div>
          </div>
        </div>
      </section>
    `;
  }

  addEventListeners() {
    const form = document.getElementById('auth-form');
    const togglePassBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('auth-password');

    // Toggle Password Visibility
    if (togglePassBtn && passwordInput) {
      togglePassBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassBtn.textContent = type === 'password' ? '👁️' : '🙈';
      });
    }

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('auth-email').value;
      if (!email.endsWith('@gmail.com')) {
        this.showError('email', 'Only @gmail.com accounts are allowed!');
        return;
      }

      this.setLoading(true);
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      try {
        if (this.mode === 'login') {
          const result = await AuthService.login(data.email, data.password);
          if (result.success) {
            window.location.hash = AuthService.isAdmin() ? '#admin' : '#dashboard';
            window.location.reload();
          } else {
            this.showGlobalError(result.message);
          }
        } else {
          const result = await AuthService.register(data);
          if (result.success) {
            window.location.hash = '#dashboard';
            window.location.reload();
          } else {
            this.showGlobalError(result.message);
          }
        }
      } catch (err) {
        this.showGlobalError('Service temporarily unavailable.');
      } finally {
        this.setLoading(false);
      }
    });
  }

  addRealTimeValidation() {
    const emailInput = document.getElementById('auth-email');
    emailInput?.addEventListener('input', (e) => {
      const email = e.target.value;
      const errorEl = document.getElementById('email-error');

      if (email && !email.endsWith('@gmail.com')) {
        errorEl.classList.remove('hidden');
        emailInput.classList.add('input-error');
      } else {
        errorEl.classList.add('hidden');
        emailInput.classList.remove('input-error');
      }
    });
  }

  showError(field, msg) {
    const errorEl = document.getElementById(`${field}-error`);
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
    }
  }

  showGlobalError(msg) {
    alert(msg); // Enhanced UI can use a toast or overlay later
  }

  setLoading(isLoading) {
    const btn = document.getElementById('btn-submit');
    const loader = btn?.querySelector('.btn-loader');
    const text = btn?.querySelector('span');

    if (isLoading) {
      btn.disabled = true;
      loader?.classList.remove('hidden');
      text?.classList.add('hidden');
    } else {
      btn.disabled = false;
      loader?.classList.add('hidden');
      text?.classList.remove('hidden');
    }
  }
}

export default AuthPage;
