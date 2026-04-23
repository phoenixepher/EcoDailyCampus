/**
 * Auth Service - MySQL Backend Authentication (Smart Routing)
 */

// Deteksi lokasi akses (Root atau Public) agar koneksi tidak putus
const isPublicFolder = window.location.pathname.includes('/public/');
const AUTH_ENDPOINT = isPublicFolder ? '../api/auth.php' : 'api/auth.php';

class AuthService {
  constructor() {
    try {
      const storedUser = localStorage.getItem('eco_current_user');
      this.currentUser = storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error('AuthService: Failed to parse current user', e);
      this.currentUser = null;
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(AUTH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'login', email, password })
      });

      if (!response.ok) {
         const err = await response.json().catch(() => ({}));
         throw new Error(err.message || 'Koneksi ke server gagal.');
      }

      const result = await response.json();

      if (result.success) {
        this.currentUser = result.user;
        localStorage.setItem('eco_current_user', JSON.stringify(result.user));
        return { success: true, user: result.user };
      }
      return { success: false, message: result.message };

    } catch (error) {
      console.error('AuthService Error:', error);
      return { success: false, message: error.message || 'Gagal terhubung ke sistem backend.' };
    }
  }

  async register(userData) {
    try {
      const response = await fetch(AUTH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...userData })
      });

      const result = await response.json();

      if (result.success) {
        return this.login(userData.email, userData.password);
      }
      return { success: false, message: result.message };

    } catch (error) {
      console.error('AuthService Error:', error);
      return { success: false, message: 'Pendaftaran gagal. Periksa koneksi Anda.' };
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('eco_current_user');
    window.location.hash = '#home';
  }

  isLoggedIn() { return !!this.currentUser; }
  isAdmin() { return this.currentUser?.role === 'admin'; }
  updateUser(userData) {
    this.currentUser = { ...this.currentUser, ...userData };
    localStorage.setItem('eco_current_user', JSON.stringify(this.currentUser));
  }

  getCurrentUser() { return this.currentUser; }
}

export default new AuthService();
