/**
 * Auth Service - MySQL Backend Authentication
 */

const AUTH_ENDPOINT = '../api/auth.php';

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

  /**
   * Real Login verification via PHP Backend
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>}
   */
  async login(email, password) {
    try {
      const response = await fetch(AUTH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'login', email, password })
      });

      const result = await response.json();

      if (result.success) {
        this.currentUser = result.user;
        localStorage.setItem('eco_current_user', JSON.stringify(result.user));
        return { success: true, user: result.user };
      }
      return { success: false, message: result.message };

    } catch (error) {
      console.error('AuthService Error:', error);
      return { success: false, message: 'Database connection failed!' };
    }
  }

  /**
   * User Registration with Backend Storage and Password Hashing
   * @param {Object} userData 
   * @returns {Promise<Object>}
   */
  async register(userData) {
    try {
      const response = await fetch(AUTH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...userData })
      });

      const result = await response.json();

      if (result.success) {
        // Automatically login after registration
        return this.login(userData.email, userData.password);
      }
      return { success: false, message: result.message };

    } catch (error) {
      console.error('AuthService Error:', error);
      return { success: false, message: 'Registration failed at backend!' };
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
