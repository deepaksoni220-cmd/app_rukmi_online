// Mock Database using localStorage
const DB_USERS_KEY = 'employee_app_users';
const DB_REPORTS_KEY = 'employee_app_reports';
const DB_TASKS_KEY = 'employee_app_tasks';
const DB_ATTENDANCE_KEY = 'employee_app_attendance';

const DEPARTMENTS = {
  ADMIN: 'admin',
  SALES: 'online_sales',
  CONTENT: 'content_creation',
  CATALOG: 'cataloging'
};

function initDB() {
  const users = localStorage.getItem(DB_USERS_KEY);
  if (!users) {
    // Scaffold default admin and test users if empty
    const initialUsers = [
      { id: '1', username: 'admin', password: '123', department: DEPARTMENTS.ADMIN, name: 'Main Admin' },
      { id: '2', username: 'sales_test', password: '123', department: DEPARTMENTS.SALES, name: 'John (Sales)' },
      { id: '3', username: 'content_test', password: '123', department: DEPARTMENTS.CONTENT, name: 'Alice (Content)' },
      { id: '4', username: 'catalog_test', password: '123', department: DEPARTMENTS.CATALOG, name: 'Bob (Catalog)' }
    ];
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(initialUsers));
  }
  
  if (!localStorage.getItem(DB_REPORTS_KEY)) {
    localStorage.setItem(DB_REPORTS_KEY, JSON.stringify([]));
  }

  if (!localStorage.getItem(DB_TASKS_KEY)) {
    localStorage.setItem(DB_TASKS_KEY, JSON.stringify([]));
  }

  if (!localStorage.getItem(DB_ATTENDANCE_KEY)) {
    localStorage.setItem(DB_ATTENDANCE_KEY, JSON.stringify([]));
  }
}

function getUsers() {
  return JSON.parse(localStorage.getItem(DB_USERS_KEY) || '[]');
}

function getReports() {
  const reportsRaw = localStorage.getItem(DB_REPORTS_KEY);
  return reportsRaw ? JSON.parse(reportsRaw) : [];
}

function getTasks() {
  const tasksRaw = localStorage.getItem(DB_TASKS_KEY);
  return tasksRaw ? JSON.parse(tasksRaw) : [];
}

function getAttendance() {
  const data = localStorage.getItem(DB_ATTENDANCE_KEY);
  return data ? JSON.parse(data) : [];
}

function addUser(user) {
  const users = getUsers();
  user.id = String(Date.now());
  users.push(user);
  localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
}

function updateUser(updatedUser) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
  }
}

function deleteUser(userId) {
  let users = getUsers();
  users = users.filter(u => u.id !== userId);
  localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
}

function addReport(report) {
  const reports = getReports();
  report.id = String(Date.now());
  report.date = new Date().toISOString();
  reports.push(report);
  localStorage.setItem(DB_REPORTS_KEY, JSON.stringify(reports));
}

function addTask(task) {
  const tasks = getTasks();
  task.id = String(Date.now());
  task.date = new Date().toISOString();
  tasks.push(task);
  localStorage.setItem(DB_TASKS_KEY, JSON.stringify(tasks));
}

function logLogin(userId) {
  const attendance = getAttendance();
  const newSession = {
    id: String(Date.now()),
    userId: userId,
    loginTime: new Date().toISOString(),
    logoutTime: null
  };
  attendance.push(newSession);
  localStorage.setItem(DB_ATTENDANCE_KEY, JSON.stringify(attendance));
}

function logLogout(userId) {
  const attendance = getAttendance();
  for (let i = attendance.length - 1; i >= 0; i--) {
    if (attendance[i].userId === userId && !attendance[i].logoutTime) {
      attendance[i].logoutTime = new Date().toISOString();
      break;
    }
  }
  localStorage.setItem(DB_ATTENDANCE_KEY, JSON.stringify(attendance));
}

function authenticate(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  return user || null;
}

initDB();
