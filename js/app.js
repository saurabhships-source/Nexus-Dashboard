/* ============================================================
   DEMO DATABASE (Frontend Only)
   ============================================================ */

const DEMO_DATA = {

clients: [
{ id:"cl-1", company:"Acme Corp", name:"John Doe", status:"Active", industry:"Tech", email:"john@acme.com" },
{ id:"cl-2", company:"Bright Marketing", name:"Sarah Lee", status:"Active", industry:"Marketing", email:"sarah@bright.com" }
],

projects: [
{
id:"pr-1",
name:"Website Redesign",
client_id:"cl-1",
status:"Active",
priority:"High",
progress:65,
budget:12000,
color:"#7C3AED",
assigned_members:["tm-1"]
},
{
id:"pr-2",
name:"SEO Campaign",
client_id:"cl-2",
status:"Planning",
priority:"Medium",
progress:20,
budget:5000,
color:"#3B82F6",
assigned_members:["tm-1"]
}
],

tasks: [
{
id:"task-1",
title:"Design homepage",
project_id:"pr-1",
status:"In Progress",
priority:"High",
assigned_user:"tm-1",
due_date:"2026-03-20"
},
{
id:"task-2",
title:"Setup analytics",
project_id:"pr-1",
status:"To Do",
priority:"Medium",
assigned_user:"tm-1",
due_date:"2026-03-25"
},
{
id:"task-3",
title:"Keyword research",
project_id:"pr-2",
status:"Review",
priority:"Medium",
assigned_user:"tm-1",
due_date:"2026-03-30"
}
],

team_members: [
{
id:"tm-1",
name:"Alex Johnson",
avatar:"A",
role:"Admin",
department:"Management",
email:"alex@nexus.com",
joined_date:"2024-01-01"
},
{
id:"tm-2",
name:"Emma Smith",
avatar:"E",
role:"Member",
department:"Design",
email:"emma@nexus.com",
joined_date:"2024-02-01"
}
],

activity_log: [],
subtasks: [],
task_dependencies: [],
recurring_tasks: [],
task_comments: [],
files: [],
notifications: [],
automations: [],
workspace_invites: [],
client_portal_users: [],
attendance: []

};


/* ============================================================
   FAKE API LAYER (REPLACES REAL BACKEND)
   ============================================================ */

const API = {

async get(table) {
return { data: DEMO_DATA[table] || [] };
},

async getOne(table, id) {
const item = (DEMO_DATA[table] || []).find(x => x.id === id);
return item || null;
},

async post(table, data) {
if (!DEMO_DATA[table]) DEMO_DATA[table] = [];
DEMO_DATA[table].push(data);
return data;
},

async put(table, id, data) {
const index = (DEMO_DATA[table] || []).findIndex(x => x.id === id);
if (index !== -1) {
DEMO_DATA[table][index] = data;
}
return data;
},

async patch(table, id, data) {
const item = (DEMO_DATA[table] || []).find(x => x.id === id);
if (item) Object.assign(item, data);
return item;
},

async delete(table, id) {
if (!DEMO_DATA[table]) return;
DEMO_DATA[table] = DEMO_DATA[table].filter(x => x.id !== id);
},

async getCurrentUser() {
return {
id: "tm-1",
name: "Alex Johnson",
role: "Admin"
};
}

};
