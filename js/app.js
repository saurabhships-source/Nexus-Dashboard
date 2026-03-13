/* ============================================================
   NEXUS — App State & API Layer
   ============================================================ */

const API = {
  async get(table, params = {}) {
    // Automatically add workspace filter for multi-tenant isolation
    if (STATE.workspace && STATE.workspace.id && !params.workspace_id) {
      params.workspace_id = STATE.workspace.id;
    }
    const qs = new URLSearchParams(params).toString();
    const r = await fetch(`tables/${table}${qs ? '?' + qs : ''}`);
    return r.json();
  },
  async getOne(table, id) {
    const r = await fetch(`tables/${table}/${id}`);
    return r.json();
  },
  async post(table, data) {
    // Automatically add workspace_id for multi-tenant isolation
    if (STATE.workspace && STATE.workspace.id && !data.workspace_id) {
      data.workspace_id = STATE.workspace.id;
    }
    const r = await fetch(`tables/${table}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return r.json();
  },
  async put(table, id, data) {
    const r = await fetch(`tables/${table}/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return r.json();
  },
  async patch(table, id, data) {
    const r = await fetch(`tables/${table}/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return r.json();
  },
  async delete(table, id) {
    await fetch(`tables/${table}/${id}`, { method: 'DELETE' });
  },
  
  // New methods for advanced features
  async getWorkspaceData(workspaceId) {
    const r = await fetch(`tables/workspaces/${workspaceId}`);
    return r.json();
  },
  
  async getCurrentUser() {
    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!authToken || !currentUser) {
      // Redirect to login
      window.location.href = 'login.html';
      return null;
    }
    
    return currentUser;
  }
};

// App State
const STATE = {
  workspace: { id: 'ws-1', name: 'Nexus Agency', color: '#7C3AED' },
  currentView: 'dashboard',
  currentProjectId: null,
  currentClientId: null,
  projectTaskView: 'kanban',
  data: { 
    clients: [], 
    projects: [], 
    tasks: [], 
    team: [], 
    activity: [],
    subtasks: [],
    taskDependencies: [],
    recurringTasks: [],
    taskComments: [],
    files: [],
    notifications: [],
    automations: [],
    workspaceInvites: [],
    clientPortalUsers: [],
    attendance: []
  },
  charts: {},
  dragData: null,
  currentUser: null,
  userRole: 'Admin' // Admin, Manager, Member, Client
};

// Color palette for avatars
const AVATAR_COLORS = ['#7C3AED','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899'];
let colorIdx = 0;
function nextColor() { return AVATAR_COLORS[colorIdx++ % AVATAR_COLORS.length]; }

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  await loadAllData();
  renderSidebarProjects();
  setupNav();
  setupModals();
  setupSearch();
  setupWorkspaceSwitcher();
  setupSidebarToggle();
  setupThemeToggle();
  navigate('dashboard');
});

async function loadAllData() {
  const [
    clients, projects, tasks, team, activity, subtasks, 
    taskDependencies, recurringTasks, taskComments, files, 
    notifications, automations, workspaceInvites, clientPortalUsers, attendance
  ] = await Promise.all([
    API.get('clients', { limit: 100 }),
    API.get('projects', { limit: 100 }),
    API.get('tasks', { limit: 200 }),
    API.get('team_members', { limit: 100 }),
    API.get('activity_log', { limit: 50 }),
    API.get('subtasks', { limit: 100 }),
    API.get('task_dependencies', { limit: 50 }),
    API.get('recurring_tasks', { limit: 20 }),
    API.get('task_comments', { limit: 100 }),
    API.get('files', { limit: 50 }),
    API.get('notifications', { limit: 50 }),
    API.get('automations', { limit: 20 }),
    API.get('workspace_invites', { limit: 20 }),
    API.get('client_portal_users', { limit: 20 }),
    API.get('attendance', { limit: 100 })
  ]);
  
  STATE.data.clients = clients.data || [];
  STATE.data.projects = projects.data || [];
  STATE.data.tasks = tasks.data || [];
  STATE.data.team = team.data || [];
  STATE.data.activity = activity.data || [];
  STATE.data.subtasks = subtasks.data || [];
  STATE.data.taskDependencies = taskDependencies.data || [];
  STATE.data.recurringTasks = recurringTasks.data || [];
  STATE.data.taskComments = taskComments.data || [];
  STATE.data.files = files.data || [];
  STATE.data.notifications = notifications.data || [];
  STATE.data.automations = automations.data || [];
  STATE.data.workspaceInvites = workspaceInvites.data || [];
  STATE.data.clientPortalUsers = clientPortalUsers.data || [];
  STATE.data.attendance = attendance.data || [];
  
  // Set current user
  STATE.currentUser = await API.getCurrentUser();
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function setupNav() {
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigate(el.dataset.view);
    });
  });
}

function navigate(view, extra = {}) {
  STATE.currentView = view;
  if (extra.projectId) STATE.currentProjectId = extra.projectId;
  if (extra.clientId) STATE.currentClientId = extra.clientId;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });

  // Update breadcrumb
  const names = {
    dashboard: 'Dashboard', projects: 'Projects', tasks: 'All Tasks',
    clients: 'Clients', team: 'Team', calendar: 'Calendar',
    reports: 'Reports', settings: 'Settings',
    'project-detail': 'Projects', 'client-detail': 'Clients',
    'client-dashboard': 'Client Portal'
  };
  const bc = document.getElementById('topbarBreadcrumb');
  if (view === 'project-detail') {
    const proj = STATE.data.projects.find(p => p.id === STATE.currentProjectId);
    bc.innerHTML = `<span style="cursor:pointer;color:var(--text-muted)" onclick="navigate('projects')">Projects</span><span class="breadcrumb-sep"> / </span><span>${proj ? proj.name : ''}</span>`;
  } else if (view === 'client-detail') {
    const cl = STATE.data.clients.find(c => c.id === STATE.currentClientId);
    bc.innerHTML = `<span style="cursor:pointer;color:var(--text-muted)" onclick="navigate('clients')">Clients</span><span class="breadcrumb-sep"> / </span><span>${cl ? cl.company : ''}</span>`;
  } else {
    bc.innerHTML = `<span>${names[view] || view}</span>`;
  }

  // Render view
  const vc = document.getElementById('viewContainer');
  switch (view) {
    case 'dashboard': 
      vc.innerHTML = STATE.userRole === 'Client' ? renderClientDashboard() : renderDashboard(); 
      initDashboardCharts(); 
      break;
    case 'projects': vc.innerHTML = renderProjects(); bindProjectsEvents(); break;
    case 'tasks': vc.innerHTML = renderAllTasks(); bindTasksEvents(); break;
    case 'clients': vc.innerHTML = renderClients(); bindClientsEvents(); break;
    case 'team': vc.innerHTML = renderTeam(); bindTeamEvents(); break;
    case 'attendance': vc.innerHTML = renderAttendance(); bindAttendanceEvents(); break;
    case 'calendar': vc.innerHTML = renderCalendar(); setTimeout(buildCalendar, 50); break;
    case 'reports': vc.innerHTML = renderReports(); initReportCharts(); break;
    case 'settings': vc.innerHTML = renderSettings(); bindSettingsEvents(); break;
    case 'project-detail': vc.innerHTML = renderProjectDetail(); bindProjectDetailEvents(); break;
    case 'client-detail': vc.innerHTML = renderClientDetail(); break;
    case 'client-dashboard': vc.innerHTML = renderClientDashboard(); break;
    default: vc.innerHTML = `<p style="color:var(--text-muted)">View not found.</p>`;
  }
}

/* ============================================================
   SIDEBAR PROJECTS
   ============================================================ */
function renderSidebarProjects() {
  const el = document.getElementById('sidebarProjectList');
  el.innerHTML = STATE.data.projects.slice(0, 8).map(p => `
    <div class="sidebar-project-item" onclick="openProject('${p.id}')">
      <div class="sidebar-project-dot" style="background:${p.color || '#7C3AED'}"></div>
      <span>${p.name}</span>
    </div>
  `).join('');
}

/* ============================================================
   HELPERS
   ============================================================ */
function getStatusBadge(status) {
  const map = {
    'To Do': 'todo', 'In Progress': 'inprogress', 'Review': 'review',
    'Done': 'done', 'Blocked': 'blocked'
  };
  const key = map[status] || 'todo';
  return `<span class="badge badge-${key}">${status}</span>`;
}

function getPriorityBadge(priority) {
  const map = { 'Low': 'low', 'Medium': 'medium', 'High': 'high', 'Critical': 'critical' };
  const key = map[priority] || 'low';
  const icons = { 'Low': '↓', 'Medium': '→', 'High': '↑', 'Critical': '⚡' };
  return `<span class="badge badge-${key}">${icons[priority] || ''} ${priority}</span>`;
}

function getProjectStatusBadge(status) {
  const map = { 'Planning': 'planning', 'Active': 'active', 'On Hold': 'on-hold', 'Completed': 'completed', 'Cancelled': 'cancelled' };
  const key = map[status] || 'planning';
  return `<span class="badge badge-${key}">${status}</span>`;
}

function getClientStatusBadge(status) {
  const map = { 'Active': 'active', 'Lead': 'lead', 'Inactive': 'inactive', 'Churned': 'churned' };
  const key = map[status] || 'inactive';
  return `<span class="badge badge-${key}">${status}</span>`;
}

function getMemberName(id) {
  const m = STATE.data.team.find(t => t.id === id);
  return m ? m.name : 'Unassigned';
}

function getMemberAvatar(id, size = '') {
  const m = STATE.data.team.find(t => t.id === id);
  const colors = ['#7C3AED','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4'];
  const color = m ? colors[STATE.data.team.indexOf(m) % colors.length] : '#6b7280';
  return `<div class="avatar ${size}" style="background:${color}" title="${m ? m.name : 'Unassigned'}">${m ? m.avatar : '?'}</div>`;
}

function getClientName(id) {
  const c = STATE.data.clients.find(c => c.id === id);
  return c ? c.company : 'Unknown';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date() && new Date(dateStr).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  return Math.floor(diff/86400) + 'd ago';
}

function showToast(msg, type = 'success') {
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<i class="fas ${icons[type]} toast-icon"></i><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function genId(prefix = 'x') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
}

/* ============================================================
   DASHBOARD VIEW
   ============================================================ */
function renderDashboard() {
  const tasks = STATE.data.tasks;
  const projects = STATE.data.projects;
  const total = tasks.length;
  const active = tasks.filter(t => t.status === 'In Progress').length;
  const done = tasks.filter(t => t.status === 'Done').length;
  const overdue = tasks.filter(t => t.status !== 'Done' && isOverdue(t.due_date)).length;
  const activeProjects = projects.filter(p => p.status === 'Active').length;

  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1>Good morning, Alex 👋</h1>
      <p>Here's what's happening across your workspace today.</p>
    </div>
    <div class="page-header-right">
      <button class="btn-primary" onclick="openModal('quickAddModal')"><i class="fas fa-plus"></i> New</button>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(124,58,237,0.15)"><i class="fas fa-folder" style="color:#7C3AED"></i></div>
      <div class="stat-info">
        <div class="stat-value">${projects.length}</div>
        <div class="stat-label">Total Projects</div>
        <div class="stat-trend up"><i class="fas fa-arrow-up"></i> ${activeProjects} active</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(59,130,246,0.15)"><i class="fas fa-check-square" style="color:#3B82F6"></i></div>
      <div class="stat-info">
        <div class="stat-value">${total}</div>
        <div class="stat-label">Total Tasks</div>
        <div class="stat-trend up"><i class="fas fa-arrow-up"></i> ${active} in progress</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(16,185,129,0.15)"><i class="fas fa-check" style="color:#10B981"></i></div>
      <div class="stat-info">
        <div class="stat-value">${done}</div>
        <div class="stat-label">Completed Tasks</div>
        <div class="stat-trend up"><i class="fas fa-check"></i> ${total > 0 ? Math.round(done/total*100) : 0}% completion rate</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(239,68,68,0.15)"><i class="fas fa-exclamation-circle" style="color:#EF4444"></i></div>
      <div class="stat-info">
        <div class="stat-value">${overdue}</div>
        <div class="stat-label">Overdue Tasks</div>
        <div class="stat-trend ${overdue > 0 ? 'down' : 'up'}"><i class="fas fa-${overdue > 0 ? 'exclamation' : 'check'}"></i> ${overdue > 0 ? 'needs attention' : 'all on track'}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(6,182,212,0.15)"><i class="fas fa-users" style="color:#06B6D4"></i></div>
      <div class="stat-info">
        <div class="stat-value">${STATE.data.clients.length}</div>
        <div class="stat-label">Active Clients</div>
        <div class="stat-trend up"><i class="fas fa-user-plus"></i> ${STATE.data.clients.filter(c=>c.status==='Lead').length} leads</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(245,158,11,0.15)"><i class="fas fa-user-friends" style="color:#F59E0B"></i></div>
      <div class="stat-info">
        <div class="stat-value">${STATE.data.team.length}</div>
        <div class="stat-label">Team Members</div>
        <div class="stat-trend up"><i class="fas fa-circle" style="font-size:8px"></i> All active</div>
      </div>
    </div>
  </div>

  <div class="dashboard-grid">
    <div>
      <!-- Project Progress -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-header">
          <span class="card-title">Project Progress</span>
          <a class="card-link" onclick="navigate('projects')">View all →</a>
        </div>
        <div class="project-progress-list">
          ${projects.map(p => `
            <div class="project-progress-item" onclick="openProject('${p.id}')" style="cursor:pointer">
              <div class="project-progress-header">
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="color-swatch" style="background:${p.color || '#7C3AED'}"></div>
                  <span class="project-progress-name">${p.name}</span>
                  ${getProjectStatusBadge(p.status)}
                </div>
                <span class="project-progress-pct">${p.progress || 0}%</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width:${p.progress||0}%;background:${p.color||'#7C3AED'}"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Task Status Chart -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Task Overview</span>
          <a class="card-link" onclick="navigate('tasks')">View all →</a>
        </div>
        <div class="chart-container" style="height:220px">
          <canvas id="taskStatusChart"></canvas>
        </div>
      </div>
    </div>

    <div>
      <!-- Recent Activity -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-header">
          <span class="card-title">Recent Activity</span>
        </div>
        <div class="activity-feed">
          ${STATE.data.activity.slice().reverse().slice(0,8).map(a => {
            const member = STATE.data.team.find(m => m.id === a.user_id);
            const colors = ['#7C3AED','#3B82F6','#10B981','#F59E0B','#EF4444'];
            const col = member ? colors[STATE.data.team.indexOf(member) % colors.length] : '#6b7280';
            const icons = { task: 'fa-check-square', project: 'fa-folder', client: 'fa-user', team: 'fa-user-plus', workspace: 'fa-building' };
            return `
            <div class="activity-item">
              <div class="activity-avatar" style="background:${col}">${member ? member.avatar : '?'}</div>
              <div class="activity-content">
                <div class="activity-text"><strong>${member ? member.name : 'Unknown'}</strong> ${a.action} <strong>${a.entity_name}</strong></div>
                <div class="activity-time"><i class="fas ${icons[a.entity_type]||'fa-circle'}" style="font-size:10px;margin-right:4px"></i>${timeAgo(a.timestamp)}</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- My Tasks (assigned to Alex = tm-1) -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">My Tasks</span>
          <a class="card-link" onclick="navigate('tasks')">View all →</a>
        </div>
        <div class="task-list">
          ${STATE.data.tasks.filter(t => t.assigned_user === 'tm-1').slice(0,5).map(t => `
            <div class="task-list-item" onclick="openTaskDetail('${t.id}')">
              <div class="task-checkbox ${t.status==='Done'?'checked':''}"></div>
              <div class="task-list-title ${t.status==='Done'?'done':''}">${t.title}</div>
              ${getPriorityBadge(t.priority)}
              ${getStatusBadge(t.status)}
            </div>
          `).join('') || '<div style="color:var(--text-muted);font-size:13px;padding:12px 0">No tasks assigned.</div>'}
        </div>
      </div>
    </div>
  </div>`;
}

function renderClientDashboard() {
  // This is a simplified client dashboard - in a real app, you would load client-specific data
  const clientData = getClientDataForPortal();
  
  return `
  <div class="client-portal-container">
    <div class="client-portal-header">
      <div class="client-portal-nav">
        <div class="client-portal-logo">Client Portal</div>
        <div class="client-portal-user">
          <div class="client-portal-avatar">C</div>
          <div>
            <div style="font-weight: 600; color: var(--text-primary)">Client User</div>
            <div style="font-size: 12px; color: var(--text-muted)">Viewer Access</div>
          </div>
          <button class="btn-secondary" onclick="logoutClientPortal()">Logout</button>
        </div>
      </div>
    </div>
    
    <div class="client-portal-content">
      <h2>Welcome to Your Project Dashboard</h2>
      <p style="color: var(--text-secondary); margin-bottom: 24px;">Here you can view your projects, track progress, and collaborate with our team.</p>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(124,58,237,0.15)"><i class="fas fa-folder" style="color:#7C3AED"></i></div>
          <div class="stat-info">
            <div class="stat-value">3</div>
            <div class="stat-label">Active Projects</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.15)"><i class="fas fa-check" style="color:#10B981"></i></div>
          <div class="stat-info">
            <div class="stat-value">12</div>
            <div class="stat-label">Completed Tasks</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.15)"><i class="fas fa-clock" style="color:#F59E0B"></i></div>
          <div class="stat-info">
            <div class="stat-value">2</div>
            <div class="stat-label">Pending Reviews</div>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 32px;">
        <h3>Your Recent Projects</h3>
        <div class="project-list" style="margin-top: 16px;">
          <div class="project-card">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
              <div class="color-swatch" style="background:#7C3AED"></div>
              <div>
                <div style="font-weight: 600;">Website Redesign</div>
                <div style="font-size: 12px; color: var(--text-muted)">Status: In Progress</div>
              </div>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width:75%;background:#7C3AED"></div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
              <span style="font-size: 12px; color: var(--text-muted)">75% Complete</span>
              <button class="btn-secondary" style="font-size: 12px; padding: 4px 8px;">View Details</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function initDashboardCharts() {
  const tasks = STATE.data.tasks;
  const statusCounts = {
    'To Do': tasks.filter(t => t.status === 'To Do').length,
    'In Progress': tasks.filter(t => t.status === 'In Progress').length,
    'Review': tasks.filter(t => t.status === 'Review').length,
    'Done': tasks.filter(t => t.status === 'Done').length,
    'Blocked': tasks.filter(t => t.status === 'Blocked').length,
  };
  const ctx = document.getElementById('taskStatusChart');
  if (!ctx) return;
  if (STATE.charts.taskStatus) STATE.charts.taskStatus.destroy();
  STATE.charts.taskStatus = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: ['#6b7280','#3b82f6','#f59e0b','#10b981','#ef4444'],
        borderRadius: 6, borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { color: '#71717a', font: {size:11} }, grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { ticks: { color: '#71717a', font: {size:11} }, grid: { display: false } }
      }
    }
  });
}

/* ============================================================
   PROJECTS VIEW
   ============================================================ */
function renderProjects() {
  const projects = STATE.data.projects;
  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1>Projects</h1>
      <p>${projects.length} projects across ${STATE.data.clients.length} clients</p>
    </div>
    <div class="page-header-right">
      <button class="btn-primary" onclick="openNewProjectModal()"><i class="fas fa-plus"></i> New Project</button>
    </div>
  </div>

  <div class="filter-bar" style="margin-bottom:20px">
    <div class="filter-bar-search">
      <i class="fas fa-search"></i>
      <input type="text" id="projSearch" placeholder="Search projects..." oninput="filterProjects()" />
    </div>
    <select class="form-control" id="projStatusFilter" onchange="filterProjects()">
      <option value="">All Statuses</option>
      <option value="Planning">Planning</option>
      <option value="Active">Active</option>
      <option value="On Hold">On Hold</option>
      <option value="Completed">Completed</option>
      <option value="Cancelled">Cancelled</option>
    </select>
    <select class="form-control" id="projClientFilter" onchange="filterProjects()">
      <option value="">All Clients</option>
      ${STATE.data.clients.map(c => `<option value="${c.id}">${c.company}</option>`).join('')}
    </select>
  </div>

  <div class="card">
    <div class="data-table-wrap">
      <table class="data-table" id="projectsTable">
        <thead>
          <tr>
            <th>Project</th>
            <th>Client</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Progress</th>
            <th>Team</th>
            <th>Due Date</th>
            <th>Budget</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="projectsTableBody">
          ${renderProjectRows(projects)}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderProjectRows(projects) {
  if (!projects.length) return `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon"><i class="fas fa-folder-open"></i></div><div class="empty-title">No projects yet</div><div class="empty-desc">Create your first project to get started.</div><button class="btn-primary" onclick="openNewProjectModal()"><i class="fas fa-plus"></i> New Project</button></div></td></tr>`;
  return projects.map(p => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:10px;height:10px;border-radius:50%;background:${p.color||'#7C3AED'};flex-shrink:0"></div>
          <div>
            <div style="font-weight:600;cursor:pointer;color:var(--text-primary)" onclick="openProject('${p.id}')" class="hover-brand">${p.name}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${(p.description||'').substring(0,50)}${p.description&&p.description.length>50?'…':''}</div>
          </div>
        </div>
      </td>
      <td><span style="font-size:13px">${getClientName(p.client_id)}</span></td>
      <td>${getProjectStatusBadge(p.status)}</td>
      <td>${getPriorityBadge(p.priority)}</td>
      <td style="min-width:120px">
        <div style="display:flex;align-items:center;gap:8px">
          <div class="progress-bar-bg" style="flex:1">
            <div class="progress-bar-fill" style="width:${p.progress||0}%;background:${p.color||'#7C3AED'}"></div>
          </div>
          <span style="font-size:11px;color:var(--text-muted);min-width:28px">${p.progress||0}%</span>
        </div>
      </td>
      <td>
        <div class="avatar-group">
          ${(p.assigned_members||[]).slice(0,3).map(mid => getMemberAvatar(mid,'avatar-sm')).join('')}
          ${(p.assigned_members||[]).length > 3 ? `<div class="avatar avatar-sm" style="background:#374151">+${p.assigned_members.length-3}</div>` : ''}
        </div>
      </td>
      <td><span style="font-size:13px;color:${isOverdue(p.end_date)?'var(--blocked)':'var(--text-secondary)'}">${formatDate(p.end_date)}</span></td>
      <td><span style="font-size:13px">$${(p.budget||0).toLocaleString()}</span></td>
      <td>
        <div class="row-actions">
          <button class="btn-ghost" style="padding:4px 8px" onclick="openProject('${p.id}')" title="Open"><i class="fas fa-arrow-right"></i></button>
          <button class="btn-ghost" style="padding:4px 8px" onclick="editProject('${p.id}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn-ghost" style="padding:4px 8px;color:#ef4444" onclick="deleteProject('${p.id}')" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterProjects() {
  const q = document.getElementById('projSearch').value.toLowerCase();
  const st = document.getElementById('projStatusFilter').value;
  const cl = document.getElementById('projClientFilter').value;
  let filtered = STATE.data.projects.filter(p => {
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q);
    const matchSt = !st || p.status === st;
    const matchCl = !cl || p.client_id === cl;
    return matchQ && matchSt && matchCl;
  });
  document.getElementById('projectsTableBody').innerHTML = renderProjectRows(filtered);
}

function bindProjectsEvents() {}

function openProject(id) {
  STATE.currentProjectId = id;
  navigate('project-detail');
}

/* ============================================================
   PROJECT DETAIL VIEW
   ============================================================ */
function renderProjectDetail() {
  const p = STATE.data.projects.find(x => x.id === STATE.currentProjectId);
  if (!p) return '<p>Project not found.</p>';
  const client = STATE.data.clients.find(c => c.id === p.client_id);
  const projectTasks = STATE.data.tasks.filter(t => t.project_id === STATE.currentProjectId);
  const done = projectTasks.filter(t => t.status === 'Done').length;

  return `
  <button class="back-btn" onclick="navigate('projects')"><i class="fas fa-arrow-left"></i> Back to Projects</button>

  <div class="project-detail-header">
    <div class="project-detail-top">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div style="width:14px;height:14px;border-radius:50%;background:${p.color||'#7C3AED'}"></div>
          ${getProjectStatusBadge(p.status)}
          ${getPriorityBadge(p.priority)}
        </div>
        <div class="project-detail-title">${p.name}</div>
        <div class="project-detail-desc">${p.description || ''}</div>
        <div class="project-detail-meta">
          <div class="project-meta-item"><i class="fas fa-user"></i><span>Client: <strong>${client ? client.company : 'N/A'}</strong></span></div>
          <div class="project-meta-item"><i class="fas fa-calendar-start"></i><span>Start: <strong>${formatDate(p.start_date)}</strong></span></div>
          <div class="project-meta-item"><i class="fas fa-calendar-end"></i><span>Due: <strong style="color:${isOverdue(p.end_date)?'var(--blocked)':'inherit'}">${formatDate(p.end_date)}</strong></span></div>
          <div class="project-meta-item"><i class="fas fa-dollar-sign"></i><span>Budget: <strong>$${(p.budget||0).toLocaleString()}</strong></span></div>
          <div class="project-meta-item"><i class="fas fa-tasks"></i><span><strong>${done}/${projectTasks.length}</strong> tasks done</span></div>
        </div>
        <div class="project-detail-meta" style="margin-top:10px">
          <div class="project-meta-item"><i class="fas fa-users"></i><span>Team:</span></div>
          <div class="avatar-group">${(p.assigned_members||[]).map(mid => getMemberAvatar(mid)).join('')}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn-secondary" onclick="editProject('${p.id}')"><i class="fas fa-edit"></i> Edit</button>
        <button class="btn-primary" onclick="openNewTaskModal('${p.id}')"><i class="fas fa-plus"></i> Add Task</button>
      </div>
    </div>
    <div class="project-detail-progress">
      <div class="project-detail-progress-header">
        <span>Overall Progress</span>
        <span>${p.progress||0}%</span>
      </div>
      <div class="progress-bar-bg" style="height:8px;border-radius:4px">
        <div class="progress-bar-fill" style="width:${p.progress||0}%;background:${p.color||'#7C3AED'};height:8px;border-radius:4px"></div>
      </div>
    </div>
  </div>

  <div class="view-tabs">
    <button class="view-tab ${STATE.projectTaskView==='kanban'?'active':''}" onclick="setProjectView('kanban')"><i class="fas fa-columns"></i> Kanban</button>
    <button class="view-tab ${STATE.projectTaskView==='list'?'active':''}" onclick="setProjectView('list')"><i class="fas fa-list"></i> List</button>
  </div>

  <div id="projectTasksContainer">
    ${STATE.projectTaskView === 'kanban' ? renderKanbanBoard(projectTasks, STATE.currentProjectId) : renderTaskList(projectTasks)}
  </div>`;
}

function setProjectView(view) {
  STATE.projectTaskView = view;
  const p = STATE.data.projects.find(x => x.id === STATE.currentProjectId);
  const projectTasks = STATE.data.tasks.filter(t => t.project_id === STATE.currentProjectId);
  document.querySelectorAll('.view-tab').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase().includes(view)));
  document.getElementById('projectTasksContainer').innerHTML =
    view === 'kanban' ? renderKanbanBoard(projectTasks, STATE.currentProjectId) : renderTaskList(projectTasks);
  if (view === 'kanban') setupKanban();
}

function bindProjectDetailEvents() {
  setupKanban();
}

/* ============================================================
   TASK LIST VIEW (inside project)
   ============================================================ */
function renderTaskList(tasks) {
  if (!tasks.length) return `
    <div class="card empty-state">
      <div class="empty-icon"><i class="fas fa-tasks"></i></div>
      <div class="empty-title">No tasks yet</div>
      <div class="empty-desc">Add your first task to this project.</div>
      <button class="btn-primary" onclick="openNewTaskModal('${STATE.currentProjectId}')"><i class="fas fa-plus"></i> Add Task</button>
    </div>`;
  return `
  <div class="card">
    <div class="task-list">
      ${tasks.map(t => `
        <div class="task-list-item" onclick="openTaskDetail('${t.id}')">
          <div class="task-checkbox ${t.status==='Done'?'checked':''}" onclick="event.stopPropagation();toggleTask('${t.id}')"></div>
          <div class="task-list-title ${t.status==='Done'?'done':''}">${t.title}</div>
          ${getStatusBadge(t.status)}
          ${getPriorityBadge(t.priority)}
          ${getMemberAvatar(t.assigned_user, 'avatar-sm')}
          <span style="font-size:12px;color:${isOverdue(t.due_date)?'var(--blocked)':'var(--text-muted)'}">
            <i class="fas fa-calendar" style="font-size:10px;margin-right:3px"></i>${formatDate(t.due_date)}
          </span>
          <div class="row-actions">
            <button class="btn-ghost" style="padding:4px 8px" onclick="event.stopPropagation();editTask('${t.id}')" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn-ghost" style="padding:4px 8px;color:#ef4444" onclick="event.stopPropagation();deleteTask('${t.id}')" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

/* ============================================================
   ALL TASKS VIEW
   ============================================================ */
function renderAllTasks() {
  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1>All Tasks</h1>
      <p>${STATE.data.tasks.length} tasks across all projects</p>
    </div>
    <div class="page-header-right">
      <button class="btn-primary" onclick="openNewTaskModal()"><i class="fas fa-plus"></i> New Task</button>
    </div>
  </div>

  <div class="view-tabs" style="margin-bottom:20px">
    <button class="view-tab active" id="tab-kanban" onclick="switchTasksView('kanban')"><i class="fas fa-columns"></i> Kanban</button>
    <button class="view-tab" id="tab-list" onclick="switchTasksView('list')"><i class="fas fa-list"></i> List</button>
  </div>

  <div class="kanban-toolbar">
    <div class="kanban-filters">
      <span class="filter-chip active" data-filter="all" onclick="filterKanban('all',this)">All Tasks</span>
      <span class="filter-chip" data-filter="mine" onclick="filterKanban('mine',this)">My Tasks</span>
      <span class="filter-chip" data-filter="overdue" onclick="filterKanban('overdue',this)"><i class="fas fa-exclamation-circle" style="color:#ef4444"></i> Overdue</span>
      <span class="filter-chip" data-filter="high" onclick="filterKanban('high',this)"><i class="fas fa-arrow-up" style="color:#f59e0b"></i> High Priority</span>
    </div>
    <div style="margin-left:auto">
      <select class="form-control" id="kanbanProjectFilter" onchange="filterKanbanByProject()" style="min-width:160px">
        <option value="">All Projects</option>
        ${STATE.data.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
      </select>
    </div>
  </div>

  <div id="allTasksKanban">
    ${renderKanbanBoard(STATE.data.tasks, null)}
  </div>`;
}

function switchTasksView(view) {
  document.getElementById('tab-kanban').classList.toggle('active', view==='kanban');
  document.getElementById('tab-list').classList.toggle('active', view==='list');
  const el = document.getElementById('allTasksKanban');
  if (view === 'kanban') {
    el.innerHTML = renderKanbanBoard(STATE.data.tasks, null);
    setupKanban();
  } else {
    el.innerHTML = renderAllTasksTable(STATE.data.tasks);
  }
}

function renderAllTasksTable(tasks) {
  if (!tasks.length) return `<div class="card"><div class="empty-state"><div class="empty-icon"><i class="fas fa-tasks"></i></div><div class="empty-title">No tasks</div></div></div>`;
  return `
  <div class="card">
    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th><th></th></tr>
        </thead>
        <tbody>
          ${tasks.map(t => {
            const proj = STATE.data.projects.find(p => p.id === t.project_id);
            return `<tr>
              <td><div style="font-weight:500;cursor:pointer" onclick="openTaskDetail('${t.id}')">${t.title}</div></td>
              <td><span style="font-size:12px;color:var(--text-muted)">${proj ? proj.name : '—'}</span></td>
              <td>${getStatusBadge(t.status)}</td>
              <td>${getPriorityBadge(t.priority)}</td>
              <td style="display:flex;align-items:center;gap:6px;padding-top:14px">${getMemberAvatar(t.assigned_user,'avatar-sm')}<span style="font-size:12px">${getMemberName(t.assigned_user)}</span></td>
              <td><span style="font-size:12px;color:${isOverdue(t.due_date)?'var(--blocked)':'var(--text-secondary)'}">${formatDate(t.due_date)}</span></td>
              <td><div class="row-actions"><button class="btn-ghost" style="padding:4px 8px" onclick="editTask('${t.id}')"><i class="fas fa-edit"></i></button><button class="btn-ghost" style="padding:4px 8px;color:#ef4444" onclick="deleteTask('${t.id}')"><i class="fas fa-trash"></i></button></div></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function filterKanban(type, el) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  let tasks = [...STATE.data.tasks];
  if (type === 'mine') tasks = tasks.filter(t => t.assigned_user === 'tm-1');
  else if (type === 'overdue') tasks = tasks.filter(t => t.status !== 'Done' && isOverdue(t.due_date));
  else if (type === 'high') tasks = tasks.filter(t => t.priority === 'High' || t.priority === 'Critical');
  document.getElementById('allTasksKanban').innerHTML = renderKanbanBoard(tasks, null);
  setupKanban();
}

function filterKanbanByProject() {
  const pid = document.getElementById('kanbanProjectFilter').value;
  const tasks = pid ? STATE.data.tasks.filter(t => t.project_id === pid) : STATE.data.tasks;
  document.getElementById('allTasksKanban').innerHTML = renderKanbanBoard(tasks, null);
  setupKanban();
}

function bindTasksEvents() {
  setupKanban();
}

/* ============================================================
   KANBAN BOARD
   ============================================================ */
const KANBAN_COLS = [
  { id: 'To Do', label: 'To Do', color: '#6b7280' },
  { id: 'In Progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'Review', label: 'Review', color: '#f59e0b' },
  { id: 'Done', label: 'Done', color: '#10b981' },
  { id: 'Blocked', label: 'Blocked', color: '#ef4444' }
];

function renderKanbanBoard(tasks, projectId) {
  return `
  <div class="kanban-board" id="kanbanBoard">
    ${KANBAN_COLS.map(col => {
      const colTasks = tasks.filter(t => t.status === col.id);
      return `
      <div class="kanban-col" data-status="${col.id}">
        <div class="kanban-col-header">
          <div class="kanban-col-dot" style="background:${col.color}"></div>
          <span class="kanban-col-title">${col.label}</span>
          <span class="kanban-col-count">${colTasks.length}</span>
          <button class="kanban-col-add" onclick="openNewTaskModal('${projectId||''}', '${col.id}')" title="Add task">+</button>
        </div>
        <div class="kanban-cards" data-status="${col.id}" ondragover="onDragOver(event)" ondrop="onDrop(event)" ondragleave="onDragLeave(event)">
          ${colTasks.map(t => renderKanbanCard(t)).join('')}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function renderKanbanCard(task) {
  const proj = STATE.data.projects.find(p => p.id === task.project_id);
  const overdue = task.status !== 'Done' && isOverdue(task.due_date);
  return `
  <div class="kanban-card" draggable="true" data-task-id="${task.id}"
       ondragstart="onDragStart(event, '${task.id}')"
       ondragend="onDragEnd(event)"
       onclick="openTaskDetail('${task.id}')">
    <div class="kanban-card-top">
      <span class="kanban-card-title">${task.title}</span>
      <span class="kanban-card-priority">${getPriorityBadge(task.priority)}</span>
    </div>
    ${proj ? `<div class="kanban-card-project"><div class="kanban-card-project-dot" style="background:${proj.color||'#7C3AED'}"></div>${proj.name}</div>` : ''}
    <div class="kanban-card-footer">
      <span class="kanban-card-due ${overdue?'overdue':''}">
        <i class="fas fa-calendar-alt" style="font-size:10px"></i>
        ${overdue ? '<i class="fas fa-exclamation-circle" style="color:#ef4444;font-size:10px"></i>' : ''}
        ${formatDate(task.due_date)}
      </span>
      ${getMemberAvatar(task.assigned_user, 'avatar-sm')}
    </div>
  </div>`;
}

/* Drag & Drop */
function onDragStart(e, taskId) {
  STATE.dragData = taskId;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => { const el = document.querySelector(`[data-task-id="${taskId}"]`); if(el) el.classList.add('dragging'); }, 0);
}
function onDragEnd(e) {
  document.querySelectorAll('.kanban-card').forEach(c => c.classList.remove('dragging'));
  document.querySelectorAll('.kanban-cards').forEach(c => c.classList.remove('drag-over'));
}
function onDragOver(e) {
  e.preventDefault(); e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}
function onDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
async function onDrop(e) {
  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
  const newStatus = e.currentTarget.dataset.status;
  const taskId = STATE.dragData;
  if (!taskId || !newStatus) return;
  const task = STATE.data.tasks.find(t => t.id === taskId);
  if (!task || task.status === newStatus) return;

  task.status = newStatus;
  await API.patch('tasks', task.id, { status: newStatus });
  await logActivity('tm-1', `moved task to ${newStatus}`, 'task', task.id, task.title);
  await loadAllData();
  showToast(`Task moved to "${newStatus}"`, 'success');

  // Re-render current board
  const boardEl = document.getElementById('kanbanBoard');
  if (boardEl) {
    const projectId = STATE.currentProjectId;
    const tasks = projectId ? STATE.data.tasks.filter(t => t.project_id === projectId) : STATE.data.tasks;
    boardEl.outerHTML = renderKanbanBoard(tasks, projectId);
    setupKanban();
    if (STATE.currentView === 'project-detail') {
      // Update progress
      updateProjectProgress(projectId || STATE.currentProjectId);
    }
  }
}

function setupKanban() {
  // Already using inline handlers, nothing extra needed
}

async function updateProjectProgress(projectId) {
  if (!projectId) return;
  const tasks = STATE.data.tasks.filter(t => t.project_id === projectId);
  if (!tasks.length) return;
  const done = tasks.filter(t => t.status === 'Done').length;
  const pct = Math.round((done / tasks.length) * 100);
  const proj = STATE.data.projects.find(p => p.id === projectId);
  if (proj) { proj.progress = pct; await API.patch('projects', projectId, { progress: pct }); }
}

/* ============================================================
   CLIENTS VIEW
   ============================================================ */
function renderClients() {
  const clients = STATE.data.clients;
  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1>Clients</h1>
      <p>${clients.length} clients in this workspace</p>
    </div>
    <div class="page-header-right">
      <button class="btn-primary" onclick="openNewClientModal()"><i class="fas fa-plus"></i> New Client</button>
    </div>
  </div>

  <div class="filter-bar" style="margin-bottom:20px">
    <div class="filter-bar-search">
      <i class="fas fa-search"></i>
      <input type="text" id="clientSearch" placeholder="Search clients..." oninput="filterClients()" />
    </div>
    <select class="form-control" id="clientStatusFilter" onchange="filterClients()">
      <option value="">All Statuses</option>
      <option value="Active">Active</option>
      <option value="Lead">Lead</option>
      <option value="Inactive">Inactive</option>
      <option value="Churned">Churned</option>
    </select>
  </div>

  <div class="clients-grid" id="clientsGrid">
    ${renderClientCards(clients)}
  </div>`;
}

function renderClientCards(clients) {
  if (!clients.length) return `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon"><i class="fas fa-users"></i></div><div class="empty-title">No clients yet</div><div class="empty-desc">Add your first client to get started.</div><button class="btn-primary" onclick="openNewClientModal()"><i class="fas fa-plus"></i> Add Client</button></div>`;
  return clients.map(c => {
    const projects = STATE.data.projects.filter(p => p.client_id === c.id);
    const initials = c.company.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    return `
    <div class="client-card" onclick="openClientDetail('${c.id}')">
      <div class="client-card-header">
        <div class="avatar avatar-lg" style="background:${c.avatar_color||'#7C3AED'}">${initials}</div>
        <div class="client-card-info">
          <h3>${c.company}</h3>
          <p>${c.name}</p>
        </div>
        ${getClientStatusBadge(c.status)}
      </div>
      <div class="client-detail-row"><i class="fas fa-envelope"></i> ${c.email || '—'}</div>
      <div class="client-detail-row"><i class="fas fa-phone"></i> ${c.phone || '—'}</div>
      <div class="client-detail-row"><i class="fas fa-industry"></i> ${c.industry || '—'}</div>
      <div class="client-card-footer">
        <div style="font-size:12px;color:var(--text-muted)">
          <i class="fas fa-folder" style="margin-right:4px"></i>${projects.length} project${projects.length!==1?'s':''}
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn-ghost" style="padding:4px 8px;font-size:11px" onclick="event.stopPropagation();editClient('${c.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn-ghost" style="padding:4px 8px;font-size:11px;color:#ef4444" onclick="event.stopPropagation();deleteClient('${c.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function filterClients() {
  const q = (document.getElementById('clientSearch').value||'').toLowerCase();
  const st = document.getElementById('clientStatusFilter').value;
  const filtered = STATE.data.clients.filter(c => {
    const matchQ = !q || c.company.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q);
    const matchSt = !st || c.status === st;
    return matchQ && matchSt;
  });
  document.getElementById('clientsGrid').innerHTML = renderClientCards(filtered);
}

function bindClientsEvents() {}

function openClientDetail(id) {
  STATE.currentClientId = id;
  navigate('client-detail');
}

/* ============================================================
   CLIENT DETAIL VIEW
   ============================================================ */
function renderClientDetail() {
  const c = STATE.data.clients.find(x => x.id === STATE.currentClientId);
  if (!c) return '<p>Client not found.</p>';
  const projects = STATE.data.projects.filter(p => p.client_id === c.id);
  const initials = c.company.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const allTasks = STATE.data.tasks.filter(t => projects.some(p => p.id === t.project_id));

  return `
  <button class="back-btn" onclick="navigate('clients')"><i class="fas fa-arrow-left"></i> Back to Clients</button>

  <div class="client-profile-header">
    <div class="avatar avatar-xl" style="background:${c.avatar_color||'#7C3AED'}">${initials}</div>
    <div class="client-profile-info">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <h1>${c.company}</h1>
        ${getClientStatusBadge(c.status)}
      </div>
      <p>${c.name} · ${c.industry || 'No industry'}</p>
      <div class="client-profile-meta">
        ${c.email ? `<div class="client-meta-item"><i class="fas fa-envelope"></i>${c.email}</div>` : ''}
        ${c.phone ? `<div class="client-meta-item"><i class="fas fa-phone"></i>${c.phone}</div>` : ''}
        ${c.website ? `<div class="client-meta-item"><i class="fas fa-globe"></i>${c.website}</div>` : ''}
        <div class="client-meta-item"><i class="fas fa-calendar"></i>Since ${formatDate(c.created_date)}</div>
      </div>
    </div>
    <div class="client-profile-actions">
      <button class="btn-secondary" onclick="editClient('${c.id}')"><i class="fas fa-edit"></i> Edit</button>
      <button class="btn-primary" onclick="openNewProjectModalForClient('${c.id}')"><i class="fas fa-plus"></i> New Project</button>
    </div>
  </div>

  <div class="dashboard-grid">
    <div>
      <!-- Projects -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-header">
          <span class="card-title">Projects (${projects.length})</span>
        </div>
        ${projects.length ? `
        <div class="data-table-wrap">
          <table class="data-table">
            <thead><tr><th>Project</th><th>Status</th><th>Progress</th><th>Due</th><th></th></tr></thead>
            <tbody>
              ${projects.map(p => `
                <tr>
                  <td><span style="font-weight:500;cursor:pointer" onclick="openProject('${p.id}')">${p.name}</span></td>
                  <td>${getProjectStatusBadge(p.status)}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;min-width:100px">
                      <div class="progress-bar-bg" style="flex:1"><div class="progress-bar-fill" style="width:${p.progress||0}%;background:${p.color||'#7C3AED'}"></div></div>
                      <span style="font-size:11px;color:var(--text-muted)">${p.progress||0}%</span>
                    </div>
                  </td>
                  <td style="font-size:12px;color:var(--text-secondary)">${formatDate(p.end_date)}</td>
                  <td><button class="btn-ghost" style="padding:4px 8px" onclick="openProject('${p.id}')"><i class="fas fa-arrow-right"></i></button></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>` : `<div class="empty-state" style="padding:30px"><div class="empty-icon"><i class="fas fa-folder-open"></i></div><div class="empty-title">No projects yet</div><button class="btn-primary" style="margin-top:12px" onclick="openNewProjectModalForClient('${c.id}')"><i class="fas fa-plus"></i> New Project</button></div>`}
      </div>

      <!-- Recent Tasks -->
      <div class="card">
        <div class="card-header"><span class="card-title">Recent Tasks (${allTasks.length})</span></div>
        ${allTasks.length ? `
        <div class="task-list">
          ${allTasks.slice(0,6).map(t => `
            <div class="task-list-item" onclick="openTaskDetail('${t.id}')">
              <div class="task-checkbox ${t.status==='Done'?'checked':''}"></div>
              <div class="task-list-title ${t.status==='Done'?'done':''}">${t.title}</div>
              ${getStatusBadge(t.status)} ${getPriorityBadge(t.priority)}
            </div>`).join('')}
        </div>` : '<div style="color:var(--text-muted);font-size:13px;padding:12px 0">No tasks found.</div>'}
      </div>
    </div>

    <div>
      <!-- Client Stats -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><span class="card-title">Overview</span></div>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;justify-content:space-between;font-size:13px">
            <span style="color:var(--text-muted)">Total Projects</span>
            <span style="font-weight:600">${projects.length}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px">
            <span style="color:var(--text-muted)">Active Projects</span>
            <span style="font-weight:600">${projects.filter(p=>p.status==='Active').length}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px">
            <span style="color:var(--text-muted)">Total Tasks</span>
            <span style="font-weight:600">${allTasks.length}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px">
            <span style="color:var(--text-muted)">Completed Tasks</span>
            <span style="font-weight:600;color:#10b981">${allTasks.filter(t=>t.status==='Done').length}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px">
            <span style="color:var(--text-muted)">Total Budget</span>
            <span style="font-weight:600">$${projects.reduce((s,p)=>s+(p.budget||0),0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="card">
        <div class="card-header"><span class="card-title">Notes</span></div>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.6">${c.notes || 'No notes added yet.'}</p>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   TEAM VIEW
   ============================================================ */
function renderTeam() {
  const team = STATE.data.team;
  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1>Team</h1>
      <p>${team.length} members in Nexus Agency</p>
    </div>
    <div class="page-header-right">
      <button class="btn-primary" onclick="openModal('inviteModal')"><i class="fas fa-user-plus"></i> Invite Member</button>
    </div>
  </div>

  <div class="team-grid" id="teamGrid">
    ${renderTeamCards(team)}
  </div>`;
}

function renderTeamCards(team) {
  const colors = ['#7C3AED','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4'];
  return team.map((m, i) => {
    const tasks = STATE.data.tasks.filter(t => t.assigned_user === m.id);
    const done = tasks.filter(t => t.status === 'Done').length;
    const inprogress = tasks.filter(t => t.status === 'In Progress').length;
    const roleClass = { Admin: 'role-admin', Manager: 'role-manager', Member: 'role-member' }[m.role] || 'role-member';
    return `
    <div class="team-card">
      <div class="team-card-header">
        <div class="avatar avatar-lg" style="background:${colors[i % colors.length]}">${m.avatar}</div>
        <div>
          <div class="team-card-name">${m.name}</div>
          <div class="team-card-role">${m.department}</div>
        </div>
        <span class="role-badge ${roleClass}" style="margin-left:auto">${m.role}</span>
      </div>
      <div class="team-card-dept"><i class="fas fa-envelope"></i> ${m.email}</div>
      <div class="team-card-dept" style="margin-top:6px"><i class="fas fa-calendar"></i> Joined ${formatDate(m.joined_date)}</div>
      <div class="team-card-stats">
        <div class="team-stat"><div class="team-stat-val">${tasks.length}</div><div class="team-stat-lbl">Tasks</div></div>
        <div class="team-stat"><div class="team-stat-val" style="color:#3b82f6">${inprogress}</div><div class="team-stat-lbl">Active</div></div>
        <div class="team-stat"><div class="team-stat-val" style="color:#10b981">${done}</div><div class="team-stat-lbl">Done</div></div>
      </div>
    </div>`;
  }).join('');
}

function bindTeamEvents() {}

function setupThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  const updateThemeIcon = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const icon = themeToggle.querySelector('i');
    icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
  };

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
  });

  // Initialize icon
  updateThemeIcon();
}

/* ============================================================
   CALENDAR VIEW
   ============================================================ */
let calendarDate = new Date();

function renderCalendar() {
  return `
  <div class="page-header">
    <div class="page-header-left"><h1>Calendar</h1><p>Task and project due dates</p></div>
  </div>
  <div class="calendar-wrap">
    <div class="calendar-header">
      <div class="calendar-nav">
        <button onclick="calendarPrev()"><i class="fas fa-chevron-left"></i></button>
        <button onclick="calendarToday()">Today</button>
        <button onclick="calendarNext()"><i class="fas fa-chevron-right"></i></button>
      </div>
      <div class="calendar-month-title" id="calMonthTitle"></div>
      <div style="display:flex;gap:8px;font-size:12px;color:var(--text-muted)">
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#3b82f6;margin-right:4px"></span>Tasks</span>
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#10b981;margin-right:4px"></span>Projects</span>
      </div>
    </div>
    <div class="calendar-grid-header">
      ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="calendar-day-name">${d}</div>`).join('')}
    </div>
    <div class="calendar-grid" id="calendarGrid"></div>
  </div>`;
}

function buildCalendar() {
  const title = document.getElementById('calMonthTitle');
  const grid = document.getElementById('calendarGrid');
  if (!title || !grid) return;
  const year = calendarDate.getFullYear(), month = calendarDate.getMonth();
  title.textContent = calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const today = new Date();

  // Build events map
  const events = {};
  STATE.data.tasks.forEach(t => {
    if (!t.due_date) return;
    const d = new Date(t.due_date); if(isNaN(d)) return;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!events[key]) events[key] = [];
    events[key].push({ label: t.title, color: '#3b82f6', type: 'task' });
  });
  STATE.data.projects.forEach(p => {
    if (!p.end_date) return;
    const d = new Date(p.end_date); if(isNaN(d)) return;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!events[key]) events[key] = [];
    events[key].push({ label: p.name, color: '#10b981', type: 'project' });
  });

  let cells = '';
  // Prev month fill
  for (let i = first - 1; i >= 0; i--) {
    cells += `<div class="calendar-cell other-month"><div class="calendar-day-num">${daysInPrev - i}</div></div>`;
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const key = `${year}-${month}-${d}`;
    const dayEvents = events[key] || [];
    cells += `
    <div class="calendar-cell ${isToday ? 'today' : ''}">
      <div class="calendar-day-num">${d}</div>
      ${dayEvents.slice(0,3).map(e => `<div class="calendar-event" style="background:${e.color}22;color:${e.color};border-left:2px solid ${e.color}" title="${e.label}">${e.label}</div>`).join('')}
      ${dayEvents.length > 3 ? `<div style="font-size:10px;color:var(--text-muted);margin-top:2px">+${dayEvents.length-3} more</div>` : ''}
    </div>`;
  }
  // Next month fill
  const total = first + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let d = 1; d <= remaining; d++) {
    cells += `<div class="calendar-cell other-month"><div class="calendar-day-num">${d}</div></div>`;
  }
  grid.innerHTML = cells;
}

function calendarPrev() { calendarDate.setMonth(calendarDate.getMonth()-1); buildCalendar(); }
function calendarNext() { calendarDate.setMonth(calendarDate.getMonth()+1); buildCalendar(); }
function calendarToday() { calendarDate = new Date(); buildCalendar(); }

/* ============================================================
   ATTENDANCE VIEW
   ============================================================ */
function renderAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = STATE.data.attendance.find(a => a.date === today);
  
  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1>Attendance & Time Tracking</h1>
      <p>Monitor team attendance, work hours, and productivity</p>
    </div>
    <div class="page-header-right">
      <button class="btn btn-primary" onclick="checkInToday()">
        <i class="fas fa-sign-in-alt"></i>
        ${todayAttendance && !todayAttendance.check_out ? 'Check Out' : 'Check In'}
      </button>
    </div>
  </div>

  <div class="attendance-grid">
    <div class="attendance-card">
      <div class="attendance-header">
        <h3>Today's Status</h3>
        <span class="status-badge ${todayAttendance ? 'status-present' : 'status-absent'}">
          ${todayAttendance ? 'Present' : 'Absent'}
        </span>
      </div>
      <div class="attendance-stats">
        <div class="stat-item">
          <div class="stat-value">${todayAttendance ? new Date(todayAttendance.check_in).toLocaleTimeString() : '--:--'}</div>
          <div class="stat-label">Check In</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${todayAttendance && todayAttendance.check_out ? new Date(todayAttendance.check_out).toLocaleTimeString() : '--:--'}</div>
          <div class="stat-label">Check Out</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${todayAttendance ? todayAttendance.work_hours || '0' : '0'}h</div>
          <div class="stat-label">Work Hours</div>
        </div>
      </div>
    </div>

    <div class="attendance-card">
      <h3>Team Attendance</h3>
      <div class="attendance-list" id="attendanceList">
        ${renderAttendanceList()}
      </div>
    </div>

    <div class="attendance-card">
      <h3>Monthly Overview</h3>
      <canvas id="attendanceChart" style="height: 200px;"></canvas>
    </div>

    <div class="attendance-card">
      <h3>Recent Activity</h3>
      <div class="activity-list">
        ${renderAttendanceActivity()}
      </div>
    </div>
  </div>

  <div class="attendance-table-container">
    <h3>Attendance History</h3>
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Employee</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Work Hours</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${renderAttendanceHistory()}
        </tbody>
      </table>
    </div>
  </div>
  `;
}

function renderAttendanceList() {
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = STATE.data.attendance.filter(a => a.date === today);
  
  return STATE.data.team.map(member => {
    const attendance = todayAttendance.find(a => a.user_id === member.id);
    return `
      <div class="attendance-item">
        <div class="attendance-user">
          <div class="user-avatar-small" style="background: ${AVATAR_COLORS[member.name.length % AVATAR_COLORS.length]}">
            ${member.name.charAt(0).toUpperCase()}
          </div>
          <div class="user-info">
            <div class="user-name">${member.name}</div>
            <div class="user-role">${member.role}</div>
          </div>
        </div>
        <div class="attendance-status">
          <span class="status-badge ${attendance ? 'status-present' : 'status-absent'}">
            ${attendance ? 'Present' : 'Absent'}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function renderAttendanceActivity() {
  const recentAttendance = STATE.data.attendance
    .sort((a, b) => new Date(b.check_in) - new Date(a.check_in))
    .slice(0, 5);
  
  return recentAttendance.map(att => {
    const user = STATE.data.team.find(t => t.id === att.user_id);
    return `
      <div class="activity-item">
        <div class="activity-icon">
          <i class="fas fa-${att.status === 'present' ? 'check' : 'times'}"></i>
        </div>
        <div class="activity-content">
          <div class="activity-title">${user ? user.name : 'Unknown User'}</div>
          <div class="activity-time">${new Date(att.check_in).toLocaleString()}</div>
        </div>
        <div class="activity-status">
          <span class="status-badge status-${att.status}">${att.status}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderAttendanceHistory() {
  return STATE.data.attendance
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)
    .map(att => {
      const user = STATE.data.team.find(t => t.id === att.user_id);
      return `
        <tr>
          <td>${new Date(att.date).toLocaleDateString()}</td>
          <td>${user ? user.name : 'Unknown'}</td>
          <td>${att.check_in ? new Date(att.check_in).toLocaleTimeString() : '--:--'}</td>
          <td>${att.check_out ? new Date(att.check_out).toLocaleTimeString() : '--:--'}</td>
          <td>${att.work_hours || '0'}h</td>
          <td>
            <span class="status-badge status-${att.status}">${att.status}</span>
          </td>
          <td>${att.notes || '-'}</td>
        </tr>
      `;
    }).join('');
}

function bindAttendanceEvents() {
  // Initialize attendance chart
  setTimeout(() => {
    const ctx = document.getElementById('attendanceChart');
    if (ctx) {
      const attendanceData = processAttendanceData();
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: attendanceData.labels,
          datasets: [{
            label: 'Present',
            data: attendanceData.present,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4
          }, {
            label: 'Absent',
            data: attendanceData.absent,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }, 100);
}

function processAttendanceData() {
  const last30Days = [];
  const present = [];
  const absent = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayAttendance = STATE.data.attendance.filter(a => a.date === dateStr);
    const totalTeam = STATE.data.team.length;
    const presentCount = dayAttendance.length;
    const absentCount = totalTeam - presentCount;
    
    last30Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    present.push(presentCount);
    absent.push(absentCount);
  }
  
  return { labels: last30Days, present, absent };
}

async function checkInToday() {
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = STATE.data.attendance.find(a => a.date === today && a.user_id === STATE.currentUser?.id);
  
  if (todayAttendance && !todayAttendance.check_out) {
    // Check out
    const checkOutTime = new Date().toISOString();
    const checkInTime = new Date(todayAttendance.check_in);
    const workHours = (new Date(checkOutTime) - checkInTime) / (1000 * 60 * 60);
    
    try {
      await API.put('attendance', todayAttendance.id, {
        ...todayAttendance,
        check_out: checkOutTime,
        work_hours: Math.round(workHours * 100) / 100
      });
      
      showToast('Checked out successfully!', 'success');
      await loadAllData();
      navigate('attendance');
    } catch (error) {
      showToast('Error checking out', 'error');
    }
  } else {
    // Check in
    const checkInTime = new Date().toISOString();
    
    try {
      await API.post('attendance', {
        user_id: STATE.currentUser?.id || 'user-001',
        workspace_id: STATE.workspace.id,
        check_in: checkInTime,
        date: today,
        status: 'present',
        notes: 'Checked in via web'
      });
      
      showToast('Checked in successfully!', 'success');
      await loadAllData();
      navigate('attendance');
    } catch (error) {
      showToast('Error checking in', 'error');
    }
  }
}

/* ============================================================
   REPORTS VIEW
   ============================================================ */
function renderReports() {
  const tasks = STATE.data.tasks;
  const projects = STATE.data.projects;
  const totalBudget = projects.reduce((s,p) => s+(p.budget||0), 0);
  return `
  <div class="page-header">
    <div class="page-header-left"><h1>Reports & Analytics</h1><p>Workspace performance overview</p></div>
    <div class="page-header-right">
      <button class="btn-secondary" onclick="exportReports('excel')"><i class="fas fa-file-excel"></i> Export Excel</button>
      <button class="btn-secondary" onclick="exportReports('pdf')"><i class="fas fa-file-pdf"></i> Export PDF</button>
    </div>
  </div>

  <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(124,58,237,0.15)"><i class="fas fa-dollar-sign" style="color:#7C3AED"></i></div>
      <div class="stat-info">
        <div class="stat-value">$${(totalBudget/1000).toFixed(0)}k</div>
        <div class="stat-label">Total Budget</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(16,185,129,0.15)"><i class="fas fa-check-double" style="color:#10B981"></i></div>
      <div class="stat-info">
        <div class="stat-value">${tasks.filter(t=>t.status==='Done').length}</div>
        <div class="stat-label">Tasks Completed</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(59,130,246,0.15)"><i class="fas fa-chart-line" style="color:#3B82F6"></i></div>
      <div class="stat-info">
        <div class="stat-value">${projects.filter(p=>p.status==='Active').length}</div>
        <div class="stat-label">Active Projects</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(245,158,11,0.15)"><i class="fas fa-users" style="color:#F59E0B"></i></div>
      <div class="stat-info">
        <div class="stat-value">${STATE.data.clients.length}</div>
        <div class="stat-label">Total Clients</div>
      </div>
    </div>
  </div>

  <div class="reports-grid">
    <div class="card">
      <div class="card-header"><span class="card-title">Task Status Distribution</span></div>
      <div class="chart-container"><canvas id="reportTaskStatus"></canvas></div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Project Status Overview</span></div>
      <div class="chart-container"><canvas id="reportProjectStatus"></canvas></div>
    </div>
  </div>

  <div class="reports-grid">
    <div class="card">
      <div class="card-header"><span class="card-title">Tasks by Priority</span></div>
      <div class="chart-container"><canvas id="reportPriority"></canvas></div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title">Workload by Team Member</span></div>
      <div class="chart-container"><canvas id="reportWorkload"></canvas></div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><span class="card-title">Project Budget Overview</span></div>
    <div class="chart-container"><canvas id="reportBudget"></canvas></div>
  </div>`;
}

function initReportCharts() {
  const tasks = STATE.data.tasks;
  const projects = STATE.data.projects;

  const chartDefaults = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#a1a1aa', font: { size: 11 } } } }
  };
  const gridOpts = { color: 'rgba(255,255,255,0.05)' };
  const tickOpts = { color: '#71717a', font: { size: 11 } };

  // Task Status Donut
  const tsByStatus = ['To Do','In Progress','Review','Done','Blocked'].map(s=>tasks.filter(t=>t.status===s).length);
  new Chart(document.getElementById('reportTaskStatus'), {
    type: 'doughnut',
    data: {
      labels: ['To Do','In Progress','Review','Done','Blocked'],
      datasets: [{ data: tsByStatus, backgroundColor: ['#6b7280','#3b82f6','#f59e0b','#10b981','#ef4444'], borderWidth: 0 }]
    },
    options: { ...chartDefaults, cutout: '65%' }
  });

  // Project Status Donut
  const psByStatus = ['Planning','Active','On Hold','Completed','Cancelled'].map(s=>projects.filter(p=>p.status===s).length);
  new Chart(document.getElementById('reportProjectStatus'), {
    type: 'doughnut',
    data: {
      labels: ['Planning','Active','On Hold','Completed','Cancelled'],
      datasets: [{ data: psByStatus, backgroundColor: ['#8b5cf6','#10b981','#f59e0b','#3b82f6','#ef4444'], borderWidth: 0 }]
    },
    options: { ...chartDefaults, cutout: '65%' }
  });

  // Priority Bar
  const byPriority = ['Low','Medium','High','Critical'].map(p=>tasks.filter(t=>t.priority===p).length);
  new Chart(document.getElementById('reportPriority'), {
    type: 'bar',
    data: {
      labels: ['Low','Medium','High','Critical'],
      datasets: [{ label: 'Tasks', data: byPriority, backgroundColor: ['#6b7280','#3b82f6','#f59e0b','#ef4444'], borderRadius: 6, borderSkipped: false }]
    },
    options: { ...chartDefaults, plugins: { legend: { display: false } }, scales: { y: { ticks: tickOpts, grid: gridOpts }, x: { ticks: tickOpts, grid: { display: false } } } }
  });

  // Workload
  const members = STATE.data.team;
  const workload = members.map(m => tasks.filter(t => t.assigned_user === m.id).length);
  new Chart(document.getElementById('reportWorkload'), {
    type: 'bar',
    data: {
      labels: members.map(m => m.avatar),
      datasets: [{ label: 'Tasks Assigned', data: workload, backgroundColor: '#7C3AED', borderRadius: 6, borderSkipped: false }]
    },
    options: { ...chartDefaults, plugins: { legend: { display: false } }, scales: { y: { ticks: tickOpts, grid: gridOpts }, x: { ticks: tickOpts, grid: { display: false } } } }
  });

  // Budget Bar
  new Chart(document.getElementById('reportBudget'), {
    type: 'bar',
    data: {
      labels: projects.map(p => p.name.split(' ').slice(0,2).join(' ')),
      datasets: [{ label: 'Budget ($)', data: projects.map(p=>p.budget||0), backgroundColor: projects.map(p=>p.color||'#7C3AED'), borderRadius: 6, borderSkipped: false }]
    },
    options: { ...chartDefaults, plugins: { legend: { display: false } }, scales: { y: { ticks: { ...tickOpts, callback: v => '$'+v.toLocaleString() }, grid: gridOpts }, x: { ticks: tickOpts, grid: { display: false } } } }
  });
}

function exportReports(format) {
  const tasks = STATE.data.tasks;
  const projects = STATE.data.projects;
  const clients = STATE.data.clients;
  
  if (format === 'excel') {
    exportToExcel({ tasks, projects, clients });
  } else if (format === 'pdf') {
    exportToPDF({ tasks, projects, clients });
  }
}

function exportToExcel(data) {
  // Simulate Excel export - in real app, this would generate actual Excel file
  const csvContent = generateCSV(data);
  downloadFile(csvContent, 'nexus-report.csv', 'text/csv');
  showToast('Excel report exported successfully!', 'success');
}

function exportToPDF(data) {
  // Simulate PDF export - in real app, this would generate actual PDF
  showToast('PDF report exported successfully!', 'success');
  
  // For demo, we'll create a printable version
  const printContent = generatePrintableReport(data);
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
}

/* ============================================================
   SETTINGS VIEW
   ============================================================ */
function renderSettings() {
  return `
  <div class="page-header">
    <div class="page-header-left"><h1>Settings</h1><p>Manage your workspace settings</p></div>
  </div>
  <div class="settings-layout">
    <div class="settings-nav">
      <div class="settings-nav-item active" onclick="showSettingsSection('workspace',this)">Workspace</div>
      <div class="settings-nav-item" onclick="showSettingsSection('profile',this)">My Profile</div>
      <div class="settings-nav-item" onclick="showSettingsSection('notifications',this)">Notifications</div>
      <div class="settings-nav-item" onclick="showSettingsSection('billing',this)">Billing</div>
    </div>
    <div>
      <div id="settings-workspace" class="settings-section active">
        <div class="settings-card">
          <div class="settings-card-title">Workspace Details</div>
          <div class="settings-card-desc">Update your workspace name and branding.</div>
          <div class="form-row">
            <div class="form-group">
              <label>Workspace Name</label>
              <input type="text" class="form-control" value="Nexus Agency" />
            </div>
            <div class="form-group">
              <label>Industry</label>
              <input type="text" class="form-control" value="Digital Agency" />
            </div>
          </div>
          <button class="btn-primary">Save Changes</button>
        </div>
        <div class="settings-card">
          <div class="settings-card-title">Danger Zone</div>
          <div class="settings-card-desc">Permanently delete this workspace and all its data.</div>
          <button class="btn-danger"><i class="fas fa-trash"></i> Delete Workspace</button>
        </div>
      </div>
      <div id="settings-profile" class="settings-section">
        <div class="settings-card">
          <div class="settings-card-title">Profile Information</div>
          <div class="settings-card-desc">Update your personal information.</div>
          <div class="form-row">
            <div class="form-group"><label>Full Name</label><input type="text" class="form-control" value="Alex Johnson" /></div>
            <div class="form-group"><label>Email</label><input type="email" class="form-control" value="alex@nexusagency.com" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Role</label><input type="text" class="form-control" value="Admin" readonly /></div>
            <div class="form-group"><label>Department</label><input type="text" class="form-control" value="Management" /></div>
          </div>
          <button class="btn-primary">Save Changes</button>
        </div>
        <div class="settings-card">
          <div class="settings-card-title">Change Password</div>
          <div class="settings-card-desc">Update your account password.</div>
          <div class="form-group"><label>Current Password</label><input type="password" class="form-control" placeholder="••••••••" /></div>
          <div class="form-row">
            <div class="form-group"><label>New Password</label><input type="password" class="form-control" placeholder="••••••••" /></div>
            <div class="form-group"><label>Confirm Password</label><input type="password" class="form-control" placeholder="••••••••" /></div>
          </div>
          <button class="btn-primary">Update Password</button>
        </div>
      </div>
      <div id="settings-notifications" class="settings-section">
        <div class="settings-card">
          <div class="settings-card-title">Notification Preferences</div>
          <div class="settings-card-desc">Choose what you get notified about.</div>
          ${[['Task assigned to me', true],['Task due tomorrow', true],['Project status change', true],['New comment on task', false],['Weekly summary email', true]].map(([label, checked]) => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px">${label}</span>
            <label style="position:relative;display:inline-block;width:36px;height:20px;cursor:pointer">
              <input type="checkbox" ${checked?'checked':''} style="opacity:0;width:0;height:0" />
              <span style="position:absolute;inset:0;background:${checked?'var(--brand)':'#374151'};border-radius:20px;transition:0.2s"></span>
              <span style="position:absolute;width:14px;height:14px;background:#fff;border-radius:50%;top:3px;left:${checked?'19px':'3px'};transition:0.2s"></span>
            </label>
          </div>`).join('')}
        </div>
      </div>
      <div id="settings-billing" class="settings-section">
        <div class="settings-card">
          <div class="settings-card-title">Current Plan</div>
          <div class="settings-card-desc">You are on the <strong>Pro Plan</strong></div>
          <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.3);border-radius:var(--r-md);padding:16px;margin-bottom:16px">
            <div style="font-size:20px;font-weight:700;color:var(--brand-light)">Pro Plan <span style="font-size:13px;color:var(--text-muted)">$49/month</span></div>
            <div style="font-size:13px;color:var(--text-secondary);margin-top:6px">Up to 20 team members · Unlimited projects · Advanced reports</div>
          </div>
          <button class="btn-secondary">Upgrade to Enterprise</button>
        </div>
      </div>
    </div>
  </div>`;
}

function showSettingsSection(section, el) {
  document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.settings-nav-item').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById(`settings-${section}`);
  if (sec) sec.classList.add('active');
  if (el) el.classList.add('active');
}

function bindSettingsEvents() {}

/* ============================================================
   MODAL SYSTEM
   ============================================================ */
function openModal(id) {
  document.getElementById('modalBackdrop').classList.remove('hidden');
  const m = document.getElementById(id);
  m.classList.remove('hidden');
  setTimeout(() => m.classList.add('show'), 10);
}

function closeModal(id) {
  const m = document.getElementById(id);
  m.classList.remove('show');
  setTimeout(() => {
    m.classList.add('hidden');
    const anyOpen = document.querySelectorAll('.modal.show').length > 0;
    if (!anyOpen) document.getElementById('modalBackdrop').classList.add('hidden');
  }, 200);
}

function setupModals() {
  // Close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  // Backdrop click
  document.getElementById('modalBackdrop').addEventListener('click', () => {
    document.querySelectorAll('.modal.show').forEach(m => closeModal(m.id));
  });

  // Quick Add
  document.getElementById('quickAddBtn').addEventListener('click', () => openModal('quickAddModal'));
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal('quickAddModal');
      const act = btn.dataset.action;
      if (act === 'new-task') openNewTaskModal();
      else if (act === 'new-project') openNewProjectModal();
      else if (act === 'new-client') openNewClientModal();
      else if (act === 'invite-member') openModal('inviteModal');
    });
  });

  // Task Form
  document.getElementById('taskForm').addEventListener('submit', submitTask);
  // Project Form
  document.getElementById('projectForm').addEventListener('submit', submitProject);
  // Client Form
  document.getElementById('clientForm').addEventListener('submit', submitClient);
  // Invite Form
  document.getElementById('inviteForm').addEventListener('submit', submitInvite);
}

/* ============================================================
   TASK CRUD
   ============================================================ */
function openNewTaskModal(projectId = '', status = 'To Do') {
  document.getElementById('taskModalTitle').textContent = 'New Task';
  document.getElementById('taskId').value = '';
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskDescription').value = '';
  document.getElementById('taskStatus').value = status;
  document.getElementById('taskPriority').value = 'Medium';
  document.getElementById('taskDueDate').value = '';

  // Populate project dropdown
  const sel = document.getElementById('taskProject');
  sel.innerHTML = '<option value="">Select project...</option>' +
    STATE.data.projects.map(p => `<option value="${p.id}" ${p.id === projectId ? 'selected' : ''}>${p.name}</option>`).join('');

  // Populate assignee dropdown
  const asel = document.getElementById('taskAssignee');
  asel.innerHTML = '<option value="">Unassigned</option>' +
    STATE.data.team.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

  openModal('taskModal');
}

function editTask(id) {
  const t = STATE.data.tasks.find(x => x.id === id);
  if (!t) return;
  document.getElementById('taskModalTitle').textContent = 'Edit Task';
  document.getElementById('taskId').value = t.id;
  document.getElementById('taskTitle').value = t.title;
  document.getElementById('taskDescription').value = t.description || '';
  document.getElementById('taskStatus').value = t.status;
  document.getElementById('taskPriority').value = t.priority;
  document.getElementById('taskDueDate').value = t.due_date || '';

  const sel = document.getElementById('taskProject');
  sel.innerHTML = '<option value="">Select project...</option>' +
    STATE.data.projects.map(p => `<option value="${p.id}" ${p.id === t.project_id ? 'selected' : ''}>${p.name}</option>`).join('');

  const asel = document.getElementById('taskAssignee');
  asel.innerHTML = '<option value="">Unassigned</option>' +
    STATE.data.team.map(m => `<option value="${m.id}" ${m.id === t.assigned_user ? 'selected' : ''}>${m.name}</option>`).join('');

  openModal('taskModal');
}

async function submitTask(e) {
  e.preventDefault();
  const id = document.getElementById('taskId').value;
  const data = {
    title: document.getElementById('taskTitle').value,
    description: document.getElementById('taskDescription').value,
    project_id: document.getElementById('taskProject').value,
    assigned_user: document.getElementById('taskAssignee').value,
    status: document.getElementById('taskStatus').value,
    priority: document.getElementById('taskPriority').value,
    due_date: document.getElementById('taskDueDate').value,
    workspace_id: 'ws-1',
    created_date: new Date().toISOString().split('T')[0]
  };
  if (id) {
    await API.put('tasks', id, { ...data, id });
    showToast('Task updated successfully', 'success');
    await logActivity('tm-1', 'updated task', 'task', id, data.title);
  } else {
    data.id = genId('task');
    data.order_index = STATE.data.tasks.length + 1;
    await API.post('tasks', data);
    showToast('Task created successfully', 'success');
    await logActivity('tm-1', 'created task', 'task', data.id, data.title);
  }
  closeModal('taskModal');
  await loadAllData();
  navigate(STATE.currentView);
}

async function deleteTask(id) {
  const t = STATE.data.tasks.find(x => x.id === id);
  confirmDelete(`Delete task "${t ? t.title : ''}"?`, async () => {
    await API.delete('tasks', id);
    showToast('Task deleted', 'info');
    await loadAllData();
    navigate(STATE.currentView);
  });
}

async function toggleTask(id) {
  const t = STATE.data.tasks.find(x => x.id === id);
  if (!t) return;
  const newStatus = t.status === 'Done' ? 'To Do' : 'Done';
  await API.patch('tasks', id, { status: newStatus });
  await loadAllData();
  navigate(STATE.currentView);
}

function openTaskDetail(id) {
  const t = STATE.data.tasks.find(x => x.id === id);
  if (!t) return;
  const proj = STATE.data.projects.find(p => p.id === t.project_id);
  document.getElementById('tdProjectBadge').textContent = proj ? proj.name : '';
  document.getElementById('tdTitle').textContent = t.title;
  document.getElementById('tdDescription').textContent = t.description || 'No description provided.';
  document.getElementById('tdStatus').innerHTML = getStatusBadge(t.status);
  document.getElementById('tdPriority').innerHTML = getPriorityBadge(t.priority);
  document.getElementById('tdDueDate').innerHTML = `<span style="color:${isOverdue(t.due_date)?'var(--blocked)':'var(--text-primary)'}">${formatDate(t.due_date)}</span>`;
  document.getElementById('tdAssignee').innerHTML = `<div style="display:flex;align-items:center;gap:6px">${getMemberAvatar(t.assigned_user,'avatar-sm')}<span>${getMemberName(t.assigned_user)}</span></div>`;
  document.getElementById('tdEditBtn').onclick = () => { closeModal('taskDetailModal'); editTask(id); };
  openModal('taskDetailModal');
}

/* ============================================================
   PROJECT CRUD
   ============================================================ */
function openNewProjectModal() {
  document.getElementById('projectModalTitle').textContent = 'New Project';
  document.getElementById('projectId').value = '';
  document.getElementById('projectName').value = '';
  document.getElementById('projectDescription').value = '';
  document.getElementById('projectStatus').value = 'Planning';
  document.getElementById('projectPriority').value = 'Medium';
  document.getElementById('projectBudget').value = '';
  document.getElementById('projectStartDate').value = '';
  document.getElementById('projectEndDate').value = '';

  const sel = document.getElementById('projectClient');
  sel.innerHTML = '<option value="">Select client...</option>' +
    STATE.data.clients.map(c => `<option value="${c.id}">${c.company}</option>`).join('');
  openModal('projectModal');
}

function openNewProjectModalForClient(clientId) {
  openNewProjectModal();
  document.getElementById('projectClient').value = clientId;
}

function editProject(id) {
  const p = STATE.data.projects.find(x => x.id === id);
  if (!p) return;
  document.getElementById('projectModalTitle').textContent = 'Edit Project';
  document.getElementById('projectId').value = p.id;
  document.getElementById('projectName').value = p.name;
  document.getElementById('projectDescription').value = p.description || '';
  document.getElementById('projectStatus').value = p.status;
  document.getElementById('projectPriority').value = p.priority;
  document.getElementById('projectBudget').value = p.budget || '';
  document.getElementById('projectStartDate').value = p.start_date || '';
  document.getElementById('projectEndDate').value = p.end_date || '';

  const sel = document.getElementById('projectClient');
  sel.innerHTML = '<option value="">Select client...</option>' +
    STATE.data.clients.map(c => `<option value="${c.id}" ${c.id === p.client_id ? 'selected' : ''}>${c.company}</option>`).join('');
  openModal('projectModal');
}

async function submitProject(e) {
  e.preventDefault();
  const id = document.getElementById('projectId').value;
  const colors = ['#7C3AED','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4'];
  const data = {
    name: document.getElementById('projectName').value,
    description: document.getElementById('projectDescription').value,
    client_id: document.getElementById('projectClient').value,
    status: document.getElementById('projectStatus').value,
    priority: document.getElementById('projectPriority').value,
    budget: parseFloat(document.getElementById('projectBudget').value) || 0,
    start_date: document.getElementById('projectStartDate').value,
    end_date: document.getElementById('projectEndDate').value,
    workspace_id: 'ws-1',
    progress: 0,
    assigned_members: ['tm-1'],
    color: colors[Math.floor(Math.random() * colors.length)]
  };
  if (id) {
    const existing = STATE.data.projects.find(p => p.id === id);
    await API.put('projects', id, { ...data, id, progress: existing ? existing.progress : 0, color: existing ? existing.color : data.color });
    showToast('Project updated', 'success');
    await logActivity('tm-1', 'updated project', 'project', id, data.name);
  } else {
    data.id = genId('pr');
    await API.post('projects', data);
    showToast('Project created', 'success');
    await logActivity('tm-1', 'created project', 'project', data.id, data.name);
  }
  closeModal('projectModal');
  await loadAllData();
  renderSidebarProjects();
  navigate(STATE.currentView);
}

async function deleteProject(id) {
  const p = STATE.data.projects.find(x => x.id === id);
  confirmDelete(`Delete project "${p ? p.name : ''}"? This will also delete all tasks.`, async () => {
    await API.delete('projects', id);
    // Delete associated tasks
    const projTasks = STATE.data.tasks.filter(t => t.project_id === id);
    await Promise.all(projTasks.map(t => API.delete('tasks', t.id)));
    showToast('Project deleted', 'info');
    await loadAllData();
    renderSidebarProjects();
    navigate('projects');
  });
}

/* ============================================================
   CLIENT CRUD
   ============================================================ */
function openNewClientModal() {
  document.getElementById('clientModalTitle').textContent = 'New Client';
  document.getElementById('clientId').value = '';
  document.getElementById('clientName').value = '';
  document.getElementById('clientCompany').value = '';
  document.getElementById('clientEmail').value = '';
  document.getElementById('clientPhone').value = '';
  document.getElementById('clientIndustry').value = '';
  document.getElementById('clientStatus').value = 'Active';
  document.getElementById('clientNotes').value = '';
  openModal('clientModal');
}

function editClient(id) {
  const c = STATE.data.clients.find(x => x.id === id);
  if (!c) return;
  document.getElementById('clientModalTitle').textContent = 'Edit Client';
  document.getElementById('clientId').value = c.id;
  document.getElementById('clientName').value = c.name;
  document.getElementById('clientCompany').value = c.company;
  document.getElementById('clientEmail').value = c.email || '';
  document.getElementById('clientPhone').value = c.phone || '';
  document.getElementById('clientIndustry').value = c.industry || '';
  document.getElementById('clientStatus').value = c.status;
  document.getElementById('clientNotes').value = c.notes || '';
  openModal('clientModal');
}

async function submitClient(e) {
  e.preventDefault();
  const id = document.getElementById('clientId').value;
  const colors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#7C3AED'];
  const data = {
    name: document.getElementById('clientName').value,
    company: document.getElementById('clientCompany').value,
    email: document.getElementById('clientEmail').value,
    phone: document.getElementById('clientPhone').value,
    industry: document.getElementById('clientIndustry').value,
    status: document.getElementById('clientStatus').value,
    notes: document.getElementById('clientNotes').value,
    workspace_id: 'ws-1',
    created_date: new Date().toISOString().split('T')[0],
    avatar_color: colors[Math.floor(Math.random() * colors.length)]
  };
  if (id) {
    const existing = STATE.data.clients.find(c => c.id === id);
    await API.put('clients', id, { ...data, id, avatar_color: existing ? existing.avatar_color : data.avatar_color });
    showToast('Client updated', 'success');
    await logActivity('tm-1', 'updated client', 'client', id, data.company);
  } else {
    data.id = genId('cl');
    await API.post('clients', data);
    showToast('Client created', 'success');
    await logActivity('tm-1', 'added new client', 'client', data.id, data.company);
  }
  closeModal('clientModal');
  await loadAllData();
  navigate(STATE.currentView);
}

async function deleteClient(id) {
  const c = STATE.data.clients.find(x => x.id === id);
  confirmDelete(`Delete client "${c ? c.company : ''}"?`, async () => {
    await API.delete('clients', id);
    showToast('Client deleted', 'info');
    await loadAllData();
    navigate('clients');
  });
}

/* ============================================================
   TEAM INVITE
   ============================================================ */
async function submitInvite(e) {
  e.preventDefault();
  const data = {
    id: genId('tm'),
    name: document.getElementById('inviteName').value,
    email: document.getElementById('inviteEmail').value,
    role: document.getElementById('inviteRole').value,
    department: document.getElementById('inviteDept').value,
    workspace_id: 'ws-1',
    status: 'active',
    joined_date: new Date().toISOString().split('T')[0],
    avatar: document.getElementById('inviteName').value.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  };
  await API.post('team_members', data);
  await logActivity('tm-1', 'invited new team member', 'team', data.id, data.name);
  showToast(`Invite sent to ${data.name}`, 'success');
  closeModal('inviteModal');
  document.getElementById('inviteForm').reset();
  await loadAllData();
  if (STATE.currentView === 'team') navigate('team');
}

/* ============================================================
   CONFIRM DELETE
   ============================================================ */
function confirmDelete(msg, callback) {
  document.getElementById('confirmMessage').textContent = msg;
  document.getElementById('confirmDeleteBtn').onclick = async () => {
    closeModal('confirmModal');
    await callback();
  };
  openModal('confirmModal');
}

/* ============================================================
   ACTIVITY LOG
   ============================================================ */
async function logActivity(userId, action, entityType, entityId, entityName) {
  try {
    await API.post('activity_log', {
      id: genId('act'),
      workspace_id: 'ws-1',
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      timestamp: new Date().toISOString()
    });
    const a = await API.get('activity_log', { limit: 50 });
    STATE.data.activity = a.data || [];
  } catch {}
}

/* ============================================================
   SEARCH
   ============================================================ */
function setupSearch() {
  const input = document.getElementById('globalSearch');
  const wrap = document.querySelector('.topbar-search');
  let resultsEl = null;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (resultsEl) resultsEl.remove();
    if (!q) return;

    const taskMatches = STATE.data.tasks.filter(t => t.title.toLowerCase().includes(q)).slice(0,4);
    const projMatches = STATE.data.projects.filter(p => p.name.toLowerCase().includes(q)).slice(0,4);
    const clientMatches = STATE.data.clients.filter(c => c.company.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)).slice(0,3);

    if (!taskMatches.length && !projMatches.length && !clientMatches.length) return;

    resultsEl = document.createElement('div');
    resultsEl.className = 'search-results';
    resultsEl.innerHTML = `
      ${projMatches.length ? `
      <div class="search-result-group">
        <div class="search-group-title">Projects</div>
        ${projMatches.map(p => `
          <div class="search-result-item" onclick="openProject('${p.id}');document.getElementById('globalSearch').value='';resultsEl&&resultsEl.remove()">
            <div class="search-result-icon" style="background:${p.color||'#7C3AED'}22"><i class="fas fa-folder" style="color:${p.color||'#7C3AED'}"></i></div>
            <div>
              <div style="font-weight:500">${p.name}</div>
              <div style="font-size:11px;color:var(--text-muted)">${getClientName(p.client_id)}</div>
            </div>
          </div>`).join('')}
      </div>` : ''}
      ${taskMatches.length ? `
      <div class="search-result-group">
        <div class="search-group-title">Tasks</div>
        ${taskMatches.map(t => `
          <div class="search-result-item" onclick="openTaskDetail('${t.id}');document.getElementById('globalSearch').value='';resultsEl&&resultsEl.remove()">
            <div class="search-result-icon" style="background:rgba(59,130,246,0.15)"><i class="fas fa-check-square" style="color:#3b82f6"></i></div>
            <div>
              <div style="font-weight:500">${t.title}</div>
              <div style="font-size:11px;color:var(--text-muted)">${getStatusBadge(t.status)}</div>
            </div>
          </div>`).join('')}
      </div>` : ''}
      ${clientMatches.length ? `
      <div class="search-result-group">
        <div class="search-group-title">Clients</div>
        ${clientMatches.map(c => `
          <div class="search-result-item" onclick="openClientDetail('${c.id}');document.getElementById('globalSearch').value='';resultsEl&&resultsEl.remove()">
            <div class="search-result-icon" style="background:${c.avatar_color||'#7C3AED'}22;color:${c.avatar_color||'#7C3AED'};font-weight:700;font-size:12px">${c.company[0]}</div>
            <div>
              <div style="font-weight:500">${c.company}</div>
              <div style="font-size:11px;color:var(--text-muted)">${c.name}</div>
            </div>
          </div>`).join('')}
      </div>` : ''}`;

    wrap.appendChild(resultsEl);
  });

  document.addEventListener('click', e => {
    if (!wrap.contains(e.target) && resultsEl) { resultsEl.remove(); resultsEl = null; }
  });
}

/* ============================================================
   WORKSPACE SWITCHER
   ============================================================ */
function setupWorkspaceSwitcher() {
  const btn = document.getElementById('workspaceBtn');
  const dd = document.getElementById('workspaceDropdown');
  
  // Load workspace data
  loadWorkspaceData();
  
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    dd.classList.toggle('hidden');
  });
  
  document.addEventListener('click', e => {
    if (!btn.closest('.sidebar-workspace').contains(e.target)) {
      btn.classList.remove('open'); dd.classList.add('hidden');
    }
  });
  
  document.getElementById('addWorkspaceBtn').addEventListener('click', () => {
    dd.classList.add('hidden'); 
    btn.classList.remove('open');
    openModal('createWorkspaceModal');
  });
}

async function loadWorkspaceData() {
  try {
    // Get current user's workspaces
    const response = await API.get('workspaces', { owner_id: STATE.currentUser?.id || 'user-001' });
    const workspaces = response.data || [];
    
    // Render workspace list in dropdown
    const dropdown = document.getElementById('workspaceDropdown');
    const currentWorkspaceEl = dropdown.querySelector('.workspace-dropdown-item.active');
    
    // Clear existing workspace items (keep the add workspace button)
    const existingItems = dropdown.querySelectorAll('.workspace-dropdown-item:not(#addWorkspaceBtn)');
    existingItems.forEach(item => item.remove());
    
    // Add workspace items
    workspaces.forEach(workspace => {
      const item = document.createElement('div');
      item.className = 'workspace-dropdown-item';
      item.dataset.workspaceId = workspace.id;
      
      const initials = workspace.name.split(' ').map(n => n[0]).join('').toUpperCase();
      item.innerHTML = `
        <div class="workspace-logo-sm" style="background:${workspace.color || '#374151'}">${initials}</div>
        <span>${workspace.name}</span>
        ${workspace.id === STATE.workspace.id ? '<i class="fas fa-check ml-auto"></i>' : ''}
      `;
      
      item.addEventListener('click', () => switchWorkspace(workspace));
      
      // Insert before the add workspace button
      dropdown.insertBefore(item, document.getElementById('addWorkspaceBtn'));
    });
    
    // Update current workspace display
    const currentWorkspace = workspaces.find(w => w.id === STATE.workspace.id) || STATE.workspace;
    updateWorkspaceDisplay(currentWorkspace);
    
  } catch (error) {
    console.error('Failed to load workspace data:', error);
    showToast('Failed to load workspaces', 'error');
  }
}

function updateWorkspaceDisplay(workspace) {
  const workspaceBtn = document.getElementById('workspaceBtn');
  const workspaceName = workspaceBtn.querySelector('.workspace-name');
  const workspacePlan = workspaceBtn.querySelector('.workspace-plan');
  const workspaceLogo = workspaceBtn.querySelector('.workspace-logo');
  
  workspaceName.textContent = workspace.name;
  workspacePlan.textContent = workspace.plan || 'Pro Plan';
  
  const initials = workspace.name.split(' ').map(n => n[0]).join('').toUpperCase();
  workspaceLogo.textContent = initials;
  workspaceLogo.style.background = workspace.color || '#7C3AED';
}

async function switchWorkspace(workspace) {
  if (workspace.id === STATE.workspace.id) return;
  
  STATE.workspace = workspace;
  
  // Reload all data for new workspace
  await loadAllData();
  renderSidebarProjects();
  
  // Update UI
  updateWorkspaceDisplay(workspace);
  
  // Navigate to dashboard
  navigate('dashboard');
  
  showToast(`Switched to ${workspace.name}`, 'success');
}

async function createWorkspace(name, description, color) {
  try {
    const newWorkspace = await API.post('workspaces', {
      name,
      description,
      color: color || '#7C3AED',
      owner_id: STATE.currentUser?.id || 'user-001',
      created_at: new Date().toISOString()
    });
    
    showToast('Workspace created successfully', 'success');
    await loadWorkspaceData();
    closeModal('createWorkspaceModal');
    
    // Switch to new workspace
    await switchWorkspace(newWorkspace);
    
  } catch (error) {
    console.error('Failed to create workspace:', error);
    showToast('Failed to create workspace', 'error');
  }
}

/* ============================================================
   SIDEBAR TOGGLE
   ============================================================ */
function setupSidebarToggle() {
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });
}

/* ============================================================
   CLIENT PORTAL AUTHENTICATION
   ============================================================ */
async function loginClientPortal(email, password) {
  try {
    // Find client portal user
    const portalUsers = await API.get('client_portal_users', { email, is_active: true });
    const user = portalUsers.data?.[0];
    
    if (!user) {
      showToast('Invalid credentials', 'error');
      return null;
    }
    
    // In a real app, you would verify password hash here
    // For demo, we'll simulate successful login
    
    // Store session
    localStorage.setItem('clientPortalToken', user.access_token);
    localStorage.setItem('clientPortalUserId', user.id);
    localStorage.setItem('clientWorkspaceId', user.workspace_id);
    
    // Update current user role
    STATE.userRole = 'Client';
    STATE.workspace = { id: user.workspace_id };
    
    showToast('Welcome to the client portal!', 'success');
    return user;
    
  } catch (error) {
    console.error('Client portal login failed:', error);
    showToast('Login failed', 'error');
    return null;
  }
}

async function logoutClientPortal() {
  localStorage.removeItem('clientPortalToken');
  localStorage.removeItem('clientPortalUserId');
  localStorage.removeItem('clientWorkspaceId');
  
  STATE.userRole = 'Admin';
  STATE.workspace = { id: 'ws-1', name: 'Nexus Agency', color: '#7C3AED' };
  
  showToast('Logged out successfully', 'success');
  navigate('dashboard');
}

function isClientPortalUser() {
  return !!localStorage.getItem('clientPortalToken');
}

function getClientPortalUser() {
  return {
    token: localStorage.getItem('clientPortalToken'),
    userId: localStorage.getItem('clientPortalUserId'),
    workspaceId: localStorage.getItem('clientWorkspaceId')
  };
}

async function getClientDataForPortal() {
  const portalUser = getClientPortalUser();
  if (!portalUser.token) return null;
  
  try {
    const clientPortalUser = await API.getOne('client_portal_users', portalUser.userId);
    const client = await API.getOne('clients', clientPortalUser.client_id);
    
    // Filter data for this client only
    const clientProjects = await API.get('projects', { client_id: client.id });
    const clientTasks = await API.get('tasks', { project_id: clientProjects.data.map(p => p.id) });
    
    return {
      client,
      projects: clientProjects.data || [],
      tasks: clientTasks.data || [],
      portalUser: clientPortalUser
    };
    
  } catch (error) {
    console.error('Failed to load client portal data:', error);
    return null;
  }
}

async function createWorkspaceFromForm() {
  const name = document.getElementById('workspaceName').value.trim();
  const description = document.getElementById('workspaceDescription').value.trim();
  const color = document.getElementById('workspaceColor').value;
  
  if (!name) {
    showToast('Please enter a workspace name', 'error');
    return;
  }
  
  await createWorkspace(name, description, color);
}

async function loginClientPortalFromForm() {
  const email = document.getElementById('clientEmail').value.trim();
  const password = document.getElementById('clientPassword').value;
  
  if (!email || !password) {
    showToast('Please enter both email and password', 'error');
    return;
  }
  
  const user = await loginClientPortal(email, password);
  if (user) {
    closeModal('clientPortalLoginModal');
    // Redirect to client portal dashboard
    navigate('client-dashboard');
  }
}

function showClientForgotPassword() {
  showToast('Password reset functionality coming soon!', 'info');
}

/* Calendar post-render hook is handled inline in the switch statement */

function generateCSV(data) {
  const { tasks, projects } = data;
  
  // Project summary CSV
  let csv = 'Project,Status,Progress,Tasks,Budget,Deadline\n';
  projects.forEach(p => {
    const taskCount = tasks.filter(t => t.project_id === p.id).length;
    csv += `"${p.name}","${p.status}","${p.progress||0}%","${taskCount}","$${p.budget||0}","${p.end_date||''}"\n`;
  });
  
  csv += '\nTask Summary\n';
  csv += 'Task,Project,Status,Priority,Assignee,Due Date\n';
  tasks.forEach(t => {
    const project = projects.find(p => p.id === t.project_id);
    const assignee = STATE.data.team.find(m => m.id === t.assigned_user);
    csv += `"${t.title}","${project?.name||''}","${t.status}","${t.priority||''}","${assignee?.name||''}","${t.due_date||''}"\n`;
  });
  
  return csv;
}

function generatePrintableReport(data) {
  const { tasks, projects } = data;
  const completedTasks = tasks.filter(t => t.status === 'Done').length;
  const overdueTasks = tasks.filter(t => isOverdue(t.due_date)).length;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Nexus Analytics Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
        .metric { text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #7C3AED; }
        .metric-label { font-size: 14px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; }
        .chart-placeholder { height: 200px; background: #f9f9f9; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Nexus Analytics Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="summary">
        <div class="metric">
          <div class="metric-value">${tasks.length}</div>
          <div class="metric-label">Total Tasks</div>
        </div>
        <div class="metric">
          <div class="metric-value">${completedTasks}</div>
          <div class="metric-label">Completed</div>
        </div>
        <div class="metric">
          <div class="metric-value">${overdueTasks}</div>
          <div class="metric-label">Overdue</div>
        </div>
        <div class="metric">
          <div class="metric-value">${projects.length}</div>
          <div class="metric-label">Projects</div>
        </div>
      </div>
      
      <h2>Project Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Project</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Tasks</th>
            <th>Budget</th>
          </tr>
        </thead>
        <tbody>
          ${projects.map(p => {
            const taskCount = tasks.filter(t => t.project_id === p.id).length;
            return `
              <tr>
                <td>${p.name}</td>
                <td>${p.status}</td>
                <td>${p.progress || 0}%</td>
                <td>${taskCount}</td>
                <td>$${(p.budget || 0).toLocaleString()}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
        Generated by Nexus Project Management System
      </div>
    </body>
    </html>
  `;
}

function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
