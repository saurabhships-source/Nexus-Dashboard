# Nexus — Multi-Workspace Project Management & CRM Platform

A comprehensive project management and CRM platform built for agencies and startups, featuring multi-workspace SaaS architecture, client portals, and advanced automation. Inspired by ClickUp and Monday.com.

## 🚀 Enhanced Platform Features

### Two Access Levels
- **Super Admin Panel**: Complete platform management with business oversight
- **Business Owner Panel**: Business management with team and client control

### Secure Authentication System
- **Role-Based Authentication**: Secure login with role-based routing
- **Multi-Role Access**: Admin, Business Owner, Team Member, and Client roles
- **Session Management**: Automatic timeout and secure logout
- **Password Protection**: Encrypted password storage and validation

### Modern UI with Theme Support
- **Dark/Light Theme Toggle**: Seamless switching between themes
- **Persistent Preferences**: Theme choice saved across sessions
- **Responsive Design**: Mobile-first responsive interface
- **Modern Card-Based Layout**: Clean, professional design with smooth animations

### Enhanced Navigation
- **Comprehensive Sidebar**: Dashboard, Projects, Tasks, Clients, Team, Attendance, Calendar, Analytics, Reports, Files, Settings
- **Quick Access**: Recent projects and frequently used features
- **Breadcrumb Navigation**: Clear navigation path indication
- **Search Functionality**: Global search across projects, tasks, and clients

### Advanced Attendance & Time Tracking
- **Check-in/Check-out System**: Daily attendance tracking with timestamps
- **Work Hours Calculation**: Automatic calculation of work duration
- **Attendance Status**: Present, Absent, Late, Half-day status tracking
- **Monthly Overview**: Visual attendance charts and statistics
- **Team Attendance**: Monitor team attendance in real-time
- **Attendance History**: Complete attendance records with filtering

### Enhanced Analytics & Reporting
- **Comprehensive Reports**: Project progress, team productivity, task completion rates
- **Export Capabilities**: Excel (CSV) and PDF export functionality
- **Custom Date Ranges**: Filter reports by specific time periods
- **Printable Reports**: Professional printable report generation
- **Data Visualization**: Interactive charts and graphs
- **Performance Metrics**: Team productivity and project efficiency tracking

### Business Management Features
- **Business Account Management**: Super admin control over business accounts
- **Subscription Management**: Plan-based access control (Free, Starter, Professional, Enterprise)
- **User Management**: Business owner control over team members and clients
- **Platform Analytics**: System-wide usage and performance metrics
- **Backup & Restore**: Data backup and restoration capabilities

## ✅ Completed Features

### Multi-Workspace SaaS Architecture
- **Workspace Management**: Create and manage multiple workspaces for different companies/agencies
- **Workspace Switcher**: Seamless switching between workspaces with dropdown interface
- **Workspace Branding**: Custom logo, name, and color theme per workspace
- **Workspace Invites**: Email-based team member invitations with role assignment
- **Multi-tenant Data Isolation**: All data is automatically filtered by workspace

### Advanced Client CRM
- **Full Client Management**: Complete client profiles with company, contact, email, phone, industry, status, notes
- **Client Portal**: Secure client login with isolated access to their projects only
- **Client Dashboard**: Customized dashboard for clients showing their projects and progress
- **Client File Management**: Upload and manage files for clients with preview support
- **Client Activity Tracking**: Track client interactions and project updates
- **Client Portal Authentication**: Secure login system for clients with role-based access

### Enhanced Project Management
- **Project Lifecycle**: Planning, Active, On Hold, Completed, Cancelled statuses
- **Project Templates**: Create projects from templates for consistency
- **Progress Tracking**: Automatic progress calculation based on task completion
- **Team Assignment**: Assign multiple team members to projects
- **Budget Management**: Track project budgets and compare with actual costs
- **Timeline Visualization**: Visual timeline with start/end dates and milestones
- **Project Files**: File attachments and document management

### Advanced Task Management
- **Task Hierarchy**: Subtasks with their own status, assignee, and due date
- **Task Dependencies**: Link tasks with dependencies (blocks/blocked_by)
- **Recurring Tasks**: Create recurring tasks with frequency (daily, weekly, monthly)
- **Task Templates**: Save and reuse task templates
- **Threaded Comments**: Discussion threads on tasks with @mentions
- **File Attachments**: Upload files and documents to tasks
- **Task History**: Complete audit trail of task changes
- **Task Status Automation**: Automatic status updates based on rules

### Multiple Task Views
- **Kanban Board**: Drag-and-drop kanban with customizable columns
- **List View**: Traditional list view with inline editing capabilities
- **Calendar View**: Monthly calendar with task due dates visualization
- **Timeline View**: Gantt-style timeline for project planning
- **Table View**: Spreadsheet-style view with advanced filtering options

### Automation System
- **Automated Rules**: Create rules based on triggers and conditions
- **Task Status Automation**: Automatically update task status based on conditions
- **Notification Automation**: Send notifications when tasks are completed
- **Overdue Reminders**: Automatic reminders for overdue tasks
- **Client Onboarding**: Auto-create project templates for new clients
- **Workflow Automation**: Custom workflow rules for different scenarios

### Notifications Center
- **Real-time Notifications**: Instant notifications for task updates
- **Notification Types**: Task assignments, comments, status changes, deadlines
- **Notification Preferences**: Customizable notification settings per user
- **Email Notifications**: Optional email notifications for important events
- **Notification History**: Complete notification history and management

### Team Management
- **Role-based Access Control**: Admin, Manager, Member, Client roles with permissions
- **Team Analytics**: Productivity metrics and workload distribution
- **Member Profiles**: Detailed team member profiles with task statistics
- **Department Management**: Organize team members by departments
- **Activity Tracking**: Track team member activity and contributions
- **Workload Management**: Balance workload across team members

### File Management
- **File Uploads**: Upload files to tasks, projects, and clients
- **File Preview**: Preview images, PDFs, and documents directly in the app
- **File Organization**: Organize files by entity (task, project, client)
- **File Permissions**: Control access to files based on user roles
- **File Versioning**: Track file versions and history

### Advanced Analytics & Reporting
- **Project Analytics**: Project completion rates, budget tracking, timeline analysis
- **Team Productivity**: Individual and team productivity metrics
- **Client Analytics**: Client engagement and project success rates
- **Custom Reports**: Generate custom reports with filters and charts
- **Export Functionality**: Export reports in PDF, CSV, and Excel formats
- **Real-time Dashboards**: Live updating dashboard with key metrics

### User Interface & Navigation
- **Dark Sidebar**: Modern dark sidebar with collapsible navigation
- **Responsive Design**: Fully responsive layout for desktop, tablet, and mobile
- **Global Search**: Instant search across projects, tasks, and clients
- **Keyboard Shortcuts**: Keyboard shortcuts for power users
- **Theme Customization**: Light and dark theme options
- **Modern Card-based Design**: Clean, modern interface with card-based layouts

### Data Models & Schemas
- **Multi-tenant Architecture**: Workspace-based data isolation
- **Flexible Task Status**: Customizable task workflows
- **Role-based Permissions**: Granular access control system
- **Audit Logging**: Complete activity tracking for compliance
- **Data Relationships**: Proper relational data modeling

## 📡 API Endpoints & Data Models

### Core Tables
| Table | Endpoint | Key Features |
|-------|----------|-------------|
| Workspaces | `tables/workspaces` | Multi-tenant workspace management |
| Team Members | `tables/team_members` | Team member profiles with roles |
| Clients | `tables/clients` | Client CRM with full profiles |
| Projects | `tables/projects` | Project management with budgets |
| Tasks | `tables/tasks` | Task management with dependencies |

### Advanced Features
| Table | Endpoint | Purpose |
|-------|----------|---------|
| Subtasks | `tables/subtasks` | Task hierarchy and breakdown |
| Task Dependencies | `tables/task_dependencies` | Task relationships and blocking |
| Recurring Tasks | `tables/recurring_tasks` | Automated task creation |
| Task Comments | `tables/task_comments` | Discussion threads |
| Files | `tables/files` | File attachments and management |
| Notifications | `tables/notifications` | User notifications and alerts |
| Automations | `tables/automations` | Workflow automation rules |
| Workspace Invites | `tables/workspace_invites` | Team invitation system |
| Client Portal Users | `tables/client_portal_users` | Client portal authentication |
| Activity Log | `tables/activity_log` | System activity tracking |

## 🔀 Navigation Routes

### Internal User Views
| View | Description | Access Level |
|------|-------------|---------------|
| `dashboard` | Main dashboard with analytics | All internal users |
| `projects` | All projects table view | All internal users |
| `project-detail` | Individual project workspace | All internal users |
| `tasks` | All tasks with multiple views | All internal users |
| `clients` | Client CRM grid view | Internal users only |
| `client-detail` | Client profile with linked projects | Internal users only |
| `team` | Team member management | Managers+ |
| `calendar` | Monthly calendar view | All internal users |
| `reports` | Analytics and charts | Managers+ |
| `settings` | Workspace and profile settings | All internal users |

### Client Portal Views
| View | Description | Access Level |
|------|-------------|---------------|
| `client-dashboard` | Client-specific dashboard | Clients only |
| `client-projects` | Client's projects view | Clients only |
| `client-tasks` | Client's tasks view | Clients only |

## 🗂️ File Structure

```
index.html          — Main HTML shell with all modals
css/style.css       — Complete stylesheet (dark sidebar, kanban, cards, forms)
js/app.js           — Full application logic (routing, CRUD, drag-drop, charts)
```

## 🚀 Key Features Summary

### Multi-Workspace SaaS
- ✅ Multiple workspaces per account
- ✅ Workspace-based data isolation
- ✅ Workspace branding and customization
- ✅ Team member invitations

### Client Portal
- ✅ Secure client login system
- ✅ Client-specific dashboard
- ✅ Isolated project access for clients
- ✅ File upload and preview
- ✅ Client activity tracking

### Advanced Task Management
- ✅ Subtasks and task hierarchy
- ✅ Task dependencies and blocking
- ✅ Recurring tasks automation
- ✅ Task templates
- ✅ Threaded comments
- ✅ File attachments
- ✅ Task history and audit trail

### Automation & Workflow
- ✅ Rule-based automation
- ✅ Automated notifications
- ✅ Overdue task reminders
- ✅ Client onboarding automation
- ✅ Custom workflow rules

### Analytics & Reporting
- ✅ Project analytics and metrics
- ✅ Team productivity tracking
- ✅ Client engagement analytics
- ✅ Custom report generation
- ✅ Export functionality (PDF, CSV, Excel)

## 🚧 Future Enhancements

### Real-time Features
- **WebSocket Integration**: Real-time collaboration and updates
- **Live Notifications**: Instant notifications across all connected clients
- **Real-time Editing**: Collaborative editing of tasks and documents

### Advanced Integrations
- **Third-party Integrations**: Slack, Microsoft Teams, Google Workspace
- **API Access**: RESTful API for custom integrations
- **Webhook Support**: Outbound webhooks for external systems
- **Single Sign-On**: SSO integration for enterprise environments

### Enhanced Functionality
- **Time Tracking**: Built-in time tracking with timesheets and reports
- **Resource Management**: Resource allocation and capacity planning
- **Custom Fields**: User-defined fields for projects and tasks
- **Advanced Filtering**: Complex filtering and search capabilities
- **Mobile Applications**: Native iOS and Android apps

### Enterprise Features
- **Advanced Security**: Enterprise-grade security and compliance
- **Custom Branding**: White-label options for agencies
- **Advanced Permissions**: Granular permission system
- **Backup & Recovery**: Automated backup and disaster recovery
- **Compliance**: GDPR, SOC 2, and other compliance standards

## 🎯 Target Users

- **Digital Agencies**: Multi-client project management
- **Consulting Firms**: Client relationship and project tracking
- **Software Teams**: Agile project management with clients
- **Marketing Agencies**: Campaign and client management
- **Freelancers**: Client project organization
- **Enterprise Teams**: Multi-department project coordination

## 🏆 Success Metrics

- **Multi-workspace Architecture**: Supports unlimited workspaces with complete data isolation
- **Client Portal**: Secure, isolated access for clients with role-based permissions
- **Advanced Task Management**: Comprehensive task system with dependencies, subtasks, and automation
- **Real-time Analytics**: Live dashboard with key performance indicators
- **Scalable Design**: Built to scale from small teams to enterprise environments