/* ============================================================
   AUTHENTICATION JAVASCRIPT
   ============================================================ */

// Theme Management
class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.createToggleButton();
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    this.updateToggleButton();
  }

  toggle() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }

  createToggleButton() {
    const button = document.createElement('button');
    button.className = 'theme-toggle';
    button.innerHTML = '<i class="fas fa-moon"></i>';
    button.addEventListener('click', () => this.toggle());
    document.body.appendChild(button);
    this.themeToggle = button;
    this.updateToggleButton();
  }

  updateToggleButton() {
    if (!this.themeToggle) return;
    const icon = this.themeToggle.querySelector('i');
    icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
  }
}

// Authentication Manager
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.token = localStorage.getItem('authToken');
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkExistingAuth();
  }

  setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    if (togglePassword && passwordInput) {
      togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
    }
  }

  checkExistingAuth() {
    if (this.token) {
      this.validateToken();
    }
  }

  async validateToken() {
    try {
      // Simulate token validation - in real app, this would be an API call
      const response = await fetch('tables/admins');
      const admins = await response.json();
      
      if (admins.data && admins.data.length > 0) {
        this.currentUser = admins.data[0];
        this.redirectToDashboard();
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      this.logout();
    }
  }

  async handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const role = formData.get('role');

    this.showLoading(true);

    try {
      const user = await this.authenticate(email, password, role);
      if (user) {
        this.loginSuccess(user);
      } else {
        this.showError('Invalid credentials or role');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Login failed. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async authenticate(email, password, role) {
    // Simulate authentication - in real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    // For demo purposes, accept predefined credentials
    const demoUsers = {
      'superadmin@nexus.com': { password: 'admin123', role: 'SuperAdmin' },
      'business@company.com': { password: 'business123', role: 'Business' },
      'team@company.com': { password: 'team123', role: 'Team' },
      'client@business.com': { password: 'client123', role: 'Client' }
    };

    const userConfig = demoUsers[email];
    if (userConfig && userConfig.password === password) {
      // Check if the role matches the login selection
      if ((role === 'admin' && userConfig.role === 'SuperAdmin') ||
          (role === 'business' && userConfig.role === 'Business') ||
          (role === 'team' && userConfig.role === 'Team') ||
          (role === 'client' && userConfig.role === 'Client')) {
        
        return {
          id: this.generateId(),
          email: email,
          name: email.split('@')[0].replace(/[@.]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          role: userConfig.role,
          workspace_id: userConfig.role === 'SuperAdmin' ? null : 'ws-1'
        };
      }
    }
    
    return null;
  }

  loginSuccess(user) {
    this.currentUser = user;
    this.token = this.generateToken();
    
    localStorage.setItem('authToken', this.token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    this.showSuccess('Login successful!');
    setTimeout(() => this.redirectToDashboard(), 1000);
  }

  redirectToDashboard() {
    if (this.currentUser.role === 'SuperAdmin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'index.html';
    }
  }

  logout() {
    this.currentUser = null;
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  }

  togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.getElementById('togglePassword');
    const icon = toggleButton.querySelector('i');

    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      passwordInput.type = 'password';
      icon.className = 'fas fa-eye';
    }
  }

  showLoading(show) {
    const button = document.querySelector('.auth-button');
    const buttonText = button.querySelector('.button-text');
    const buttonLoader = button.querySelector('.button-loader');

    if (show) {
      button.disabled = true;
      buttonText.textContent = 'Signing in...';
      buttonLoader.classList.remove('hidden');
    } else {
      button.disabled = false;
      buttonText.textContent = 'Sign In';
      buttonLoader.classList.add('hidden');
    }
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  generateToken() {
    return 'token_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  generateId() {
    return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.token && !!this.currentUser;
  }
}

// Notification Styles
const notificationStyles = `
<style>
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  max-width: 400px;
  z-index: 10000;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  backdrop-filter: blur(10px);
}

.notification.show {
  transform: translateX(0);
}

.notification-success {
  background: rgba(16, 185, 129, 0.9);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.notification-error {
  background: rgba(239, 68, 68, 0.9);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.notification-info {
  background: rgba(59, 130, 246, 0.9);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.notification i {
  font-size: 18px;
}
</style>
`;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add notification styles
  document.head.insertAdjacentHTML('beforeend', notificationStyles);
  
  // Initialize theme manager
  window.themeManager = new ThemeManager();
  
  // Initialize auth manager
  window.authManager = new AuthManager();
  
  console.log('Authentication system initialized');
});