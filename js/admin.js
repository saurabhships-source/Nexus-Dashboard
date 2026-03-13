/* ============================================================
   ADMIN PANEL JAVASCRIPT
   ============================================================ */

// Admin State
const ADMIN_STATE = {
  currentView: 'overview',
  businesses: [],
  users: [],
  analytics: {},
  currentBusiness: null,
  charts: {}
};

// Admin API
const AdminAPI = {
  async getBusinesses() {
    try {
      const response = await fetch('tables/businesses');
      return await response.json();
    } catch (error) {
      console.error('Error fetching businesses:', error);
      return { data: [] };
    }
  },

  async getUsers() {
    try {
      const response = await fetch('tables/team_members');
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      return { data: [] };
    }
  },

  async createBusiness(businessData) {
    try {
      const response = await fetch('tables/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessData)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating business:', error);
      return null;
    }
  },

  async updateBusiness(id, businessData) {
    try {
      const response = await fetch(`tables/businesses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessData)
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating business:', error);
      return null;
    }
  },

  async deleteBusiness(id) {
    try {
      await fetch(`tables/businesses/${id}`, { method: 'DELETE' });
      return true;
    } catch (error) {
      console.error('Error deleting business:', error);
      return false;
    }
  }
};

// Admin UI Controller
class AdminUI {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadDashboardData();
    this.initializeCharts();
  }

  setupEventListeners() {
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        this.switchView(view);
      });
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Business management
    const addBusinessBtn = document.getElementById('addBusinessBtn');
    if (addBusinessBtn) {
      addBusinessBtn.addEventListener('click', () => this.openBusinessModal());
    }

    const businessForm = document.getElementById('businessForm');
    if (businessForm) {
      businessForm.addEventListener('submit', (e) => this.handleBusinessFormSubmit(e));
    }

    const closeBusinessModal = document.getElementById('closeBusinessModal');
    if (closeBusinessModal) {
      closeBusinessModal.addEventListener('click', () => this.closeBusinessModal());
    }

    const cancelBusinessBtn = document.getElementById('cancelBusinessBtn');
    if (cancelBusinessBtn) {
      cancelBusinessBtn.addEventListener('click', () => this.closeBusinessModal());
    }

    // Filters
    const businessSearch = document.getElementById('businessSearch');
    if (businessSearch) {
      businessSearch.addEventListener('input', () => this.filterBusinesses());
    }

    const businessStatusFilter = document.getElementById('businessStatusFilter');
    if (businessStatusFilter) {
      businessStatusFilter.addEventListener('change', () => this.filterBusinesses());
    }

    const businessPlanFilter = document.getElementById('businessPlanFilter');
    if (businessPlanFilter) {
      businessPlanFilter.addEventListener('change', () => this.filterBusinesses());
    }
  }

  async loadDashboardData() {
    try {
      // Load businesses
      const businessesResponse = await AdminAPI.getBusinesses();
      ADMIN_STATE.businesses = businessesResponse.data || [];

      // Load users
      const usersResponse = await AdminAPI.getUsers();
      ADMIN_STATE.users = usersResponse.data || [];

      // Update metrics
      this.updateMetrics();
      this.renderBusinessesTable();
      this.renderUsersTable();
      this.updateCharts();

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.showNotification('Error loading dashboard data', 'error');
    }
  }

  updateMetrics() {
    const totalBusinesses = ADMIN_STATE.businesses.length;
    const totalUsers = ADMIN_STATE.users.length;
    const approvedBusinesses = ADMIN_STATE.businesses.filter(b => b.status === 'approved').length;
    const growthRate = totalBusinesses > 0 ? Math.round((approvedBusinesses / totalBusinesses) * 100) : 0;

    // Calculate estimated revenue (demo calculation)
    const planPrices = { free: 0, starter: 29, professional: 99, enterprise: 299 };
    const totalRevenue = ADMIN_STATE.businesses.reduce((sum, business) => {
      const plan = business.subscription_plan || 'free';
      return sum + (planPrices[plan] || 0);
    }, 0);

    document.getElementById('totalBusinesses').textContent = totalBusinesses;
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toLocaleString()}`;
    document.getElementById('growthRate').textContent = `${growthRate}%`;
  }

  renderBusinessesTable() {
    const tbody = document.getElementById('businessesTableBody');
    if (!tbody) return;

    tbody.innerHTML = ADMIN_STATE.businesses.map(business => `
      <tr>
        <td>
          <div class="business-info">
            <strong>${business.business_name}</strong>
          </div>
        </td>
        <td>${business.owner_name}</td>
        <td>${business.email}</td>
        <td>
          <span class="status-badge status-${business.subscription_plan}">
            ${business.subscription_plan || 'free'}
          </span>
        </td>
        <td>
          <span class="status-badge status-${business.status}">
            ${business.status}
          </span>
        </td>
        <td>${this.formatDate(business.created_at)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-secondary btn-sm" onclick="adminUI.editBusiness('${business.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="adminUI.deleteBusiness('${business.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    tbody.innerHTML = ADMIN_STATE.users.map(user => `
      <tr>
        <td>
          <div class="user-info">
            <div class="user-avatar-small">${user.name.charAt(0).toUpperCase()}</div>
            <span>${user.name}</span>
          </div>
        </td>
        <td>${user.email}</td>
        <td>
          <span class="status-badge">
            ${user.role || 'Member'}
          </span>
        </td>
        <td>Nexus Agency</td>
        <td>
          <span class="status-badge status-approved">
            Active
          </span>
        </td>
        <td>${this.formatDate(user.joined_date)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-secondary btn-sm" onclick="adminUI.viewUser('${user.id}')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="adminUI.deleteUser('${user.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  switchView(viewName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

    // Update sections
    document.querySelectorAll('.admin-section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(viewName).classList.add('active');

    ADMIN_STATE.currentView = viewName;

    // Load specific data for the view
    switch (viewName) {
      case 'overview':
        this.loadOverviewData();
        break;
      case 'businesses':
        this.loadBusinessesData();
        break;
      case 'users':
        this.loadUsersData();
        break;
      case 'analytics':
        this.loadAnalyticsData();
        break;
    }
  }

  async loadOverviewData() {
    // Load overview-specific data
    await this.loadDashboardData();
  }

  async loadBusinessesData() {
    const businessesResponse = await AdminAPI.getBusinesses();
    ADMIN_STATE.businesses = businessesResponse.data || [];
    this.renderBusinessesTable();
  }

  async loadUsersData() {
    const usersResponse = await AdminAPI.getUsers();
    ADMIN_STATE.users = usersResponse.data || [];
    this.renderUsersTable();
  }

  async loadAnalyticsData() {
    // Load analytics data and update charts
    this.updateCharts();
  }

  filterBusinesses() {
    const searchTerm = document.getElementById('businessSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('businessStatusFilter')?.value || '';
    const planFilter = document.getElementById('businessPlanFilter')?.value || '';

    const filteredBusinesses = ADMIN_STATE.businesses.filter(business => {
      const matchesSearch = business.business_name.toLowerCase().includes(searchTerm) ||
                           business.owner_name.toLowerCase().includes(searchTerm) ||
                           business.email.toLowerCase().includes(searchTerm);
      
      const matchesStatus = !statusFilter || business.status === statusFilter;
      const matchesPlan = !planFilter || business.subscription_plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });

    this.renderFilteredBusinesses(filteredBusinesses);
  }

  renderFilteredBusinesses(businesses) {
    const tbody = document.getElementById('businessesTableBody');
    if (!tbody) return;

    tbody.innerHTML = businesses.map(business => `
      <tr>
        <td>
          <div class="business-info">
            <strong>${business.business_name}</strong>
          </div>
        </td>
        <td>${business.owner_name}</td>
        <td>${business.email}</td>
        <td>
          <span class="status-badge status-${business.subscription_plan}">
            ${business.subscription_plan || 'free'}
          </span>
        </td>
        <td>
          <span class="status-badge status-${business.status}">
            ${business.status}
          </span>
        </td>
        <td>${this.formatDate(business.created_at)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-secondary btn-sm" onclick="adminUI.editBusiness('${business.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="adminUI.deleteBusiness('${business.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  openBusinessModal() {
    const modal = document.getElementById('businessModal');
    const form = document.getElementById('businessForm');
    const title = document.getElementById('businessModalTitle');
    
    title.textContent = 'Add New Business';
    form.reset();
    ADMIN_STATE.currentBusiness = null;
    
    modal.classList.remove('hidden');
  }

  closeBusinessModal() {
    const modal = document.getElementById('businessModal');
    modal.classList.add('hidden');
  }

  async handleBusinessFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const businessData = {
      business_name: document.getElementById('businessName').value,
      owner_name: document.getElementById('ownerName').value,
      email: document.getElementById('businessEmail').value,
      phone: document.getElementById('businessPhone').value,
      subscription_plan: document.getElementById('businessPlan').value,
      status: document.getElementById('businessStatus').value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      let result;
      if (ADMIN_STATE.currentBusiness) {
        result = await AdminAPI.updateBusiness(ADMIN_STATE.currentBusiness.id, businessData);
      } else {
        result = await AdminAPI.createBusiness(businessData);
      }

      if (result) {
        this.showNotification('Business saved successfully!', 'success');
        this.closeBusinessModal();
        await this.loadBusinessesData();
      } else {
        this.showNotification('Error saving business', 'error');
      }
    } catch (error) {
      console.error('Error saving business:', error);
      this.showNotification('Error saving business', 'error');
    }
  }

  async editBusiness(id) {
    const business = ADMIN_STATE.businesses.find(b => b.id === id);
    if (!business) return;

    ADMIN_STATE.currentBusiness = business;

    const modal = document.getElementById('businessModal');
    const title = document.getElementById('businessModalTitle');
    
    title.textContent = 'Edit Business';
    
    // Populate form
    document.getElementById('businessName').value = business.business_name;
    document.getElementById('ownerName').value = business.owner_name;
    document.getElementById('businessEmail').value = business.email;
    document.getElementById('businessPhone').value = business.phone || '';
    document.getElementById('businessPlan').value = business.subscription_plan || 'free';
    document.getElementById('businessStatus').value = business.status || 'pending';
    
    modal.classList.remove('hidden');
  }

  async deleteBusiness(id) {
    if (!confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await AdminAPI.deleteBusiness(id);
      if (success) {
        this.showNotification('Business deleted successfully!', 'success');
        await this.loadBusinessesData();
      } else {
        this.showNotification('Error deleting business', 'error');
      }
    } catch (error) {
      console.error('Error deleting business:', error);
      this.showNotification('Error deleting business', 'error');
    }
  }

  viewUser(id) {
    this.showNotification('User details view coming soon!', 'info');
  }

  async deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await fetch(`tables/team_members/${id}`, { method: 'DELETE' });
      this.showNotification('User deleted successfully!', 'success');
      await this.loadUsersData();
    } catch (error) {
      console.error('Error deleting user:', error);
      this.showNotification('Error deleting user', 'error');
    }
  }

  initializeCharts() {
    // Business Growth Chart
    const businessGrowthCtx = document.getElementById('businessGrowthChart');
    if (businessGrowthCtx) {
      ADMIN_STATE.charts.businessGrowth = new Chart(businessGrowthCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'New Businesses',
            data: [12, 19, 15, 25, 20, 30],
            borderColor: '#7C3AED',
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0,0,0,0.1)'
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }

    // Subscription Distribution Chart
    const subscriptionCtx = document.getElementById('subscriptionChart');
    if (subscriptionCtx) {
      ADMIN_STATE.charts.subscription = new Chart(subscriptionCtx, {
        type: 'doughnut',
        data: {
          labels: ['Free', 'Starter', 'Professional', 'Enterprise'],
          datasets: [{
            data: [30, 25, 20, 15],
            backgroundColor: ['#6B7280', '#3B82F6', '#7C3AED', '#10B981']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }

    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
      ADMIN_STATE.charts.revenue = new Chart(revenueCtx, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Revenue',
            data: [5000, 7500, 6200, 8900, 7800, 9500],
            backgroundColor: '#7C3AED'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      });
    }
  }

  updateCharts() {
    // Update charts with real data
    const planCounts = this.getSubscriptionPlanCounts();
    
    if (ADMIN_STATE.charts.subscription) {
      ADMIN_STATE.charts.subscription.data.datasets[0].data = [
        planCounts.free || 0,
        planCounts.starter || 0,
        planCounts.professional || 0,
        planCounts.enterprise || 0
      ];
      ADMIN_STATE.charts.subscription.update();
    }
  }

  getSubscriptionPlanCounts() {
    const counts = { free: 0, starter: 0, professional: 0, enterprise: 0 };
    ADMIN_STATE.businesses.forEach(business => {
      const plan = business.subscription_plan || 'free';
      counts[plan] = (counts[plan] || 0) + 1;
    });
    return counts;
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('adminTheme', newTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');
    icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
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
}

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser || currentUser.role !== 'SuperAdmin') {
    window.location.href = 'login.html';
    return;
  }

  // Initialize theme
  const savedTheme = localStorage.getItem('adminTheme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Initialize admin UI
  window.adminUI = new AdminUI();

  console.log('Admin panel initialized');
});