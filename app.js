// Initialize Theme from Local Storage
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// App State
let currentUser = null;
let currentTaskFilter = null;
let feedDateFilter = new Date().toISOString().split('T')[0];
let adminViewMode = 'dashboard';

// Views
const AppEl = document.getElementById('app');

function render() {
  if (!currentUser) {
    AppEl.innerHTML = renderLogin();
    attachLoginEvents();
    return;
  }

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

  // Header for logged in users
  let html = `
    <header class="app-header" style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <img src="logo.png" alt="Logo" style="height: 40px; border-radius: 8px;" onerror="this.style.display='none'">
        <div style="position: relative; width: 40px; height: 40px; border-radius: 50%; background: var(--surface-hover); overflow: hidden; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid var(--border-color);" onclick="document.getElementById('dpUpload').click()">
          ${currentUser.dp 
             ? `<img src="${currentUser.dp}" style="width: 100%; height: 100%; object-fit: cover;">` 
             : `<i class="fa-solid fa-user text-muted"></i>`
          }
          <div style="position: absolute; bottom: 0; background: rgba(0,0,0,0.6); width: 100%; font-size: 0.6rem; text-align: center; color: white;">Edit</div>
        </div>
        <input type="file" id="dpUpload" style="display: none;" accept="image/*">
        <div>
          <div class="text-lg">${currentUser.name}</div>
          <div class="text-muted">${formatDept(currentUser.department)}</div>
        </div>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn" id="themeToggleBtn" style="padding: 0.5rem 0.8rem; background: var(--surface-color); border: 1px solid var(--border-color);"><i class="fa-solid ${currentTheme === 'light' ? 'fa-moon' : 'fa-sun'}"></i></button>
        <button class="btn btn-danger" id="logoutBtn" style="padding: 0.5rem 1rem;"><i class="fa-solid fa-right-from-bracket"></i></button>
      </div>
    </header>
  `;

  // Body based on role
  if (currentUser.department === DEPARTMENTS.ADMIN) {
    html += renderAdminDashboard();
  } else if (currentUser.department === DEPARTMENTS.SALES) {
    html += renderSalesDashboard();
  } else if (currentUser.department === DEPARTMENTS.CONTENT) {
    html += renderContentDashboard();
  } else if (currentUser.department === DEPARTMENTS.CATALOG) {
    html += renderCatalogDashboard();
  }

  AppEl.innerHTML = html;
  
  // Attach common events
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    // We intentionally don't call logLogout here automatically anymore, to force them to click "Check Out"
    currentUser = null;
    render();
  });

  document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
    const curTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = curTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    render(); // Update icon state
  });

  document.getElementById('dpUpload')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if(file.size > 1024 * 1024 * 2) return alert("Image too large (Max 2MB).");
      const reader = new FileReader();
      reader.onload = function(event) {
        currentUser.dp = event.target.result;
        updateUser(currentUser);
        render();
      };
      reader.readAsDataURL(file);
    }
  });

  // Attach specific events
  if (currentUser.department === DEPARTMENTS.ADMIN) attachAdminEvents();
  else attachEmployeeEvents();
}

function formatDept(dept) {
  if (dept === DEPARTMENTS.ADMIN) return 'Administrator';
  if (dept === DEPARTMENTS.SALES) return 'Online Sales';
  if (dept === DEPARTMENTS.CONTENT) return 'Content Creation';
  if (dept === DEPARTMENTS.CATALOG) return 'Website Cataloging';
  return dept;
}

// --- LOGIN VIEW ---
function renderLogin() {
  return `
    <div class="screen flex flex-col items-center justify-center" style="height: 100vh;">
      <div class="card w-full" style="text-align: center;">
        <img src="logo.png" alt="Company Logo" style="max-height: 80px; margin: 0 auto 1.5rem auto; border-radius: 12px;" onerror="this.outerHTML='<div style=\\'width: 70px; height: 70px; background: var(--surface-hover); border-radius: 50%; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;\\'><i class=\\'fa-solid fa-building text-2xl\\'></i></div>'">
        <h2 class="text-2xl mb-6">Rukmi Work manage log</h2>
        <div class="input-group" style="text-align: left;">
          <label>Username</label>
          <input type="text" id="loginUsername" class="input" placeholder="Enter your username">
        </div>
       <div style="position: relative;">
  <input 
    type="password" 
    id="password"
    placeholder="Enter your password"
    style="width: 100%; padding-right: 40px;"
  >

  <span 
    onclick="togglePassword()" 
    style="
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
    "
  >
    👁️
  </span>
</div>
        <button id="loginBtn" class="btn btn-primary w-full mt-4"><i class="fa-solid fa-right-to-bracket"></i> Login</button>
        <p id="loginError" class="text-center mt-4" style="color: var(--danger-color); display: none;">Invalid credentials</p>
      </div>
    </div>
  `;
}

function attachLoginEvents() {
  document.getElementById('loginBtn').addEventListener('click', () => {
    const u = document.getElementById('loginUsername').value;
    const p = document.getElementById('loginPassword').value;
    const user = authenticate(u, p);
    if (user) {
      currentUser = user;
      currentTaskFilter = null; // Reset filter on login
      adminViewMode = 'dashboard';
      render();
    } else {
      document.getElementById('loginError').style.display = 'block';
    }
  });
}

window.handleDashboardDateChange = function(val) {
  feedDateFilter = val;
  render();
};

window.toggleEmployeeAccordion = function(id) {
  const el = document.getElementById('accordion-' + id);
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
};

// --- ADMIN ATTENDANCE VIEW ---
function renderAttendanceView() {
  const users = getUsers();
  const attendance = getAttendance().reverse(); // newest first
  
  return `
    <div class="screen">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl">Employee Presentable</h3>
        <button class="btn btn-secondary" id="toggleAttendanceBtn" style="padding: 0.35rem 0.6rem; font-size: 0.85rem;"><i class="fa-solid fa-arrow-left"></i> Dashboard</button>
      </div>
      
      <div class="data-list">
        ${users.map(u => {
           const userLogs = attendance.filter(a => a.userId === u.id);
           const isActive = userLogs.length > 0 && !userLogs[0].logoutTime;
           return `
           <div class="data-item flex-col items-start" style="padding: 0; background: transparent; box-shadow: none;">
             <div class="w-full flex justify-between items-center p-3 cursor-pointer" style="background:var(--surface-color); border-radius: 8px;" onclick="toggleEmployeeAccordion('${u.id}')">
               <div style="display: flex; align-items: center; gap: 0.5rem;">
                 ${isActive ? '<div style="width: 8px; height: 8px; background: var(--secondary-color); border-radius: 50%;"></div>' : ''}
                 <strong>${u.name}</strong>
               </div>
               <div class="badge">${formatDept(u.department)}</div>
             </div>
             
             <div id="accordion-${u.id}" style="display: none; width: 100%; border-top: 1px solid var(--border-color); background: var(--bg-color);">
               ${userLogs.length === 0 ? '<p class="text-muted p-3">No attendance records found.</p>' : ''}
               ${userLogs.map(log => {
                  const day = new Date(log.loginTime).toLocaleDateString();
                  
                  if (log.status) {
                     const color = log.status === 'Absent' ? 'var(--danger-color)' : 'var(--text-muted)';
                     return `
                     <div class="flex justify-between items-center p-3" style="border-bottom: 1px solid var(--surface-color); font-size: 0.85rem;">
                       <strong>${day}</strong>
                       <strong style="color: ${color}; text-transform: uppercase;">${log.status}</strong>
                     </div>
                     `;
                  }

                  const loginTime = new Date(log.loginTime).toLocaleTimeString();
                  const logoutTime = log.logoutTime ? new Date(log.logoutTime).toLocaleTimeString() : 'In Office (Active)';
                  return `
                  <div class="flex justify-between items-center p-3" style="border-bottom: 1px solid var(--surface-color); font-size: 0.85rem;">
                    <strong>${day}</strong>
                    <div style="text-align: right;">
                       <span class="text-muted">In: </span>${loginTime}<br>
                       <span class="text-muted">Out: </span>${logoutTime}
                    </div>
                  </div>
                  `;
               }).join('')}
             </div>
           </div>
           `;
        }).join('')}
      </div>
    </div>
  `;
}

// --- ADMIN VIEW ---
function renderAdminDashboard() {
  if (adminViewMode === 'attendance') {
    return renderAttendanceView();
  }

  const users = getUsers();
  const reports = getReports();
  // Quick aggregates
  const selectedDate = feedDateFilter || new Date().toISOString().split('T')[0];
  const todaysReports = reports.filter(r => r.date.startsWith(selectedDate));
  
  // Aggregate logic
  let totalSalesValue = 0; let catalogOrderValue = 0; let cataloged = 0; let shoots = 0;
  let onlineSalesQty = 0; let websiteListingDone = 0; let contentDone = 0; let returnsQty = 0;

  todaysReports.forEach(r => {
    if(r.department === DEPARTMENTS.SALES) {
      totalSalesValue += parseFloat(r.data.sales_amount_value || 0);
      websiteListingDone += parseInt(r.data.website_listing_done || 0);
      returnsQty += parseInt(r.data.return_orders_qty || 0);
      Object.keys(r.data).forEach(k => {
        if (k.startsWith('Orders_')) onlineSalesQty += parseInt(r.data[k] || 0);
      });
    }
    if(r.department === DEPARTMENTS.CATALOG) {
      cataloged += parseInt(r.data.web_products_done || r.data.items || 0);
      catalogOrderValue += parseFloat(r.data.store_order_value || 0);
      contentDone += parseInt(r.data.content_done || 0);
      shoots += parseInt(r.data.content_shooted || 0);
    }
    if(r.department === DEPARTMENTS.CONTENT) {
      shoots += parseInt(r.data.shoots || 0);
    }
  });

  return `
    <div class="screen">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl">Aggregated Stats</h3>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-secondary" id="toggleAttendanceBtn" style="padding: 0.25rem 0.5rem; font-size: 0.85rem;">Employee Presentable</button>
          <input type="date" class="input" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.85rem;" value="${selectedDate}" onchange="handleDashboardDateChange(this.value)">
        </div>
      </div>
      <div class="stats-grid mb-6">
        <div class="stat-card">
          <span class="text-muted">Total Sales Value</span>
          <span class="stat-value">₹${parseFloat(totalSalesValue).toFixed(2)}</span>
        </div>
        <div class="stat-card">
          <span class="text-muted">Online Sales Qty</span>
          <span class="stat-value">${onlineSalesQty}</span>
        </div>
        <div class="stat-card">
          <span class="text-muted">Return Orders Qty</span>
          <span class="stat-value">${returnsQty}</span>
        </div>
        <div class="stat-card">
          <span class="text-muted">Store Order Value</span>
          <span class="stat-value">₹${parseFloat(catalogOrderValue).toFixed(2)}</span>
        </div>

        <div class="stat-card">
          <span class="text-muted">Website Listing Done</span>
          <span class="stat-value">${websiteListingDone}</span>
        </div>

        <div class="stat-card">
          <span class="text-muted">Content Done</span>
          <span class="stat-value">${contentDone}</span>
        </div>
      </div>

      <div class="card mb-6">
        <h3 class="text-xl mb-4">Assign Daily Work</h3>
        <div class="input-group">
          <label>Task Instructions</label>
          <input type="text" id="newTaskDesc" class="input" placeholder="What needs to be done today?">
        </div>
        <div class="input-group">
          <label>Assign To Team</label>
          <select id="newTaskTeam" class="input">
            <option value="${DEPARTMENTS.SALES}">Online Sales</option>
            <option value="${DEPARTMENTS.CONTENT}">Content Creation</option>
            <option value="${DEPARTMENTS.CATALOG}">Website Cataloging</option>
          </select>
        </div>
        <button id="addTaskBtn" class="btn btn-primary mt-2">Assign Work</button>
      </div>

      <div class="card mb-6">
        <h3 class="text-xl mb-4">Add New Employee</h3>
        <div class="input-group">
          <label>Name</label>
          <input type="text" id="newEmpName" class="input" placeholder="Full Name">
        </div>
        <div class="input-group">
          <label>Username</label>
          <input type="text" id="newEmpUser" class="input" placeholder="User ID">
        </div>
        <div class="input-group">
          <label>Password</label>
          <input type="text" id="newEmpPass" class="input" placeholder="Password">
        </div>
        <div class="input-group">
          <label>Department</label>
          <select id="newEmpDept" class="input">
            <option value="${DEPARTMENTS.SALES}">Online Sales</option>
            <option value="${DEPARTMENTS.CONTENT}">Content Creation</option>
            <option value="${DEPARTMENTS.CATALOG}">Website Cataloging</option>
            <option value="${DEPARTMENTS.ADMIN}">Admin</option>
          </select>
        </div>
        <button id="addEmpBtn" class="btn btn-primary mt-2">Create Employee</button>
      </div>

      <h3 class="text-xl mb-4">Employee Directory</h3>
      <div class="data-list mb-6">
        ${users.map(u => `
          <div class="data-item">
            <div>
              <strong>${u.name}</strong> <span class="text-muted">(@${u.username})</span>
              <div class="badge mt-2" style="display:inline-block">${formatDept(u.department)}</div>
            </div>
            ${u.id !== currentUser.id ? `<button class="btn btn-danger delete-user-btn" data-id="${u.id}" style="padding: 0.35rem 0.6rem; font-size: 0.8rem;">Delete</button>` : ''}
          </div>
        `).join('')}
      </div>

      ${renderCompanyFeed()}
    </div>
  `;
}

function attachAdminEvents() {
  document.getElementById('toggleAttendanceBtn')?.addEventListener('click', () => {
    adminViewMode = adminViewMode === 'dashboard' ? 'attendance' : 'dashboard';
    render();
  });

  // Add Employee
  document.getElementById('addEmpBtn')?.addEventListener('click', () => {
    const name = document.getElementById('newEmpName').value;
    const username = document.getElementById('newEmpUser').value;
    const password = document.getElementById('newEmpPass').value;
    const department = document.getElementById('newEmpDept').value;
    
    if(!name || !username || !password) return alert("Please fill all fields");
    
    addUser({ name, username, password, department });
    alert("Employee Added!");
    render();
  });

  // Delete Employee
  document.querySelectorAll('.delete-user-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      if(confirm("Are you sure you want to completely delete this user?")) {
        deleteUser(id);
        render();
      }
    });
  });

  // Add Task
  document.getElementById('addTaskBtn')?.addEventListener('click', () => {
    const desc = document.getElementById('newTaskDesc').value;
    const team = document.getElementById('newTaskTeam').value;
    if(!desc) return alert('Enter instructions');
    addTask({ targetTeam: team, description: desc });
    alert('Daily Work Assigned!');
    render();
  });
}

// --- EMPLOYEE VIEWS ---

function renderAttendanceControl() {
  const attendance = getAttendance();
  const userLogs = attendance.filter(a => a.userId === currentUser.id);
  
  const todayStr = new Date().toLocaleDateString();
  const todaySpecialRecord = userLogs.find(a => a.status && new Date(a.loginTime).toLocaleDateString() === todayStr);

  if (todaySpecialRecord) {
     return `
      <div class="card mb-6" style="border-left: 4px solid var(--text-muted);">
        <h3 class="text-xl mb-2">Office Attendance</h3>
        <p class="mb-0">Status: <span style="font-weight: bold; color: var(--text-muted);">${todaySpecialRecord.status}</span></p>
      </div>
     `;
  }

  const activeSession = userLogs.length > 0 && !userLogs[userLogs.length - 1].logoutTime ? userLogs[userLogs.length - 1] : null;

  if (activeSession) {
    const timeIn = new Date(activeSession.loginTime).toLocaleTimeString();
    return `
      <div class="card mb-6" style="border-left: 4px solid var(--secondary-color);">
        <h3 class="text-xl mb-2">Office Attendance</h3>
        <p class="mb-4">Status: <span style="color: var(--secondary-color); font-weight: bold;">In Office</span> <span class="text-muted" style="font-size:0.85rem;">(Checked in at ${timeIn})</span></p>
        <button id="checkOutBtn" class="btn btn-danger w-full"><i class="fa-solid fa-clock"></i> Check Out of Office</button>
      </div>
    `;
  } else {
    return `
      <div class="card mb-6" style="border-left: 4px solid var(--border-color);">
        <h3 class="text-xl mb-2">Office Attendance</h3>
        <p class="mb-4">Status: <span class="text-muted">Out of Office</span></p>
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          <button id="checkInBtn" class="btn btn-primary w-full"><i class="fa-solid fa-clock"></i> Check In to Office</button>
          <div style="display:flex; gap:0.5rem;">
             <button id="markAbsentBtn" class="btn btn-danger w-full" style="padding: 0.5rem; font-size: 0.9rem;">Mark Absent</button>
             <button id="markWeekoffBtn" class="btn w-full" style="padding: 0.5rem; font-size: 0.9rem; background: var(--surface-hover); border: 1px solid var(--border-color);">Mark Weekoff</button>
          </div>
        </div>
      </div>
    `;
  }
}

window.handleTaskFilterChange = function(val) {
  currentTaskFilter = val;
  render(); // Trigger re-render to reflect new filter
};

window.handleFeedDateChange = function(val) {
  feedDateFilter = val;
  render();
};

function renderWorkAssignments() {
  const filter = currentTaskFilter || currentUser.department;
  const allTasks = getTasks().reverse();
  const filteredTasks = allTasks.filter(t => t.targetTeam === filter);

  return `
    <div class="card mb-6" style="border-left: 4px solid var(--primary-color);">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl">Daily Work Assigned</h3>
        <select id="taskFilterDropdown" class="input" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.85rem;" onchange="handleTaskFilterChange(this.value)">
          <option value="${DEPARTMENTS.SALES}" ${filter === DEPARTMENTS.SALES ? 'selected' : ''}>Online Sales</option>
          <option value="${DEPARTMENTS.CONTENT}" ${filter === DEPARTMENTS.CONTENT ? 'selected' : ''}>Content Creation</option>
          <option value="${DEPARTMENTS.CATALOG}" ${filter === DEPARTMENTS.CATALOG ? 'selected' : ''}>Website Cataloging</option>
        </select>
      </div>
      <div class="data-list">
        ${filteredTasks.length === 0 ? '<p class="text-muted">No tasks assigned for this team right now.</p>' : ''}
        ${filteredTasks.map(t => `
          <div class="data-item p-3" style="background-color: var(--surface-hover); flex-direction: column; align-items: start; gap: 4px;">
             <strong>${t.description}</strong>
             <div class="text-muted" style="font-size: 0.8rem;">${new Date(t.date).toLocaleString()}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderSalesDashboard() {
  return `
    <div class="screen">
      ${renderAttendanceControl()}
      ${renderWorkAssignments()}
      <div class="card mb-6">
        <h3 class="text-xl mb-4">Log Daily Sales metrics</h3>
        <h4 class="text-lg mb-2 mt-4">Order Details</h4>
        <div class="input-group" style="flex-direction:row; gap:10px;">
           <select id="metrics-sales-source-1" class="input" style="flex:1; padding: 0.5rem;">
             <option value="">Select Platform 1...</option>
             <option value="Website">Website</option>
             <option value="Amazon">Amazon</option>
             <option value="Myntra">Myntra</option>
             <option value="Insta">Insta</option>
             <option value="Store">Store</option>
           </select>
           <input type="number" id="metrics-sales-qty-1" class="input" placeholder="Qty" min="0" style="width:80px; padding: 0.5rem;">
        </div>
        <div class="input-group" style="flex-direction:row; gap:10px;">
           <select id="metrics-sales-source-2" class="input" style="flex:1; padding: 0.5rem;">
             <option value="">Select Platform 2...</option>
             <option value="Website">Website</option>
             <option value="Amazon">Amazon</option>
             <option value="Myntra">Myntra</option>
             <option value="Insta">Insta</option>
             <option value="Store">Store</option>
           </select>
           <input type="number" id="metrics-sales-qty-2" class="input" placeholder="Qty" min="0" style="width:80px; padding: 0.5rem;">
        </div>
        <div class="input-group" style="flex-direction:row; gap:10px; margin-bottom: 1.5rem;">
           <select id="metrics-sales-source-3" class="input" style="flex:1; padding: 0.5rem;">
             <option value="">Select Platform 3...</option>
             <option value="Website">Website</option>
             <option value="Amazon">Amazon</option>
             <option value="Myntra">Myntra</option>
             <option value="Insta">Insta</option>
             <option value="Store">Store</option>
           </select>
           <input type="number" id="metrics-sales-qty-3" class="input" placeholder="Qty" min="0" style="width:80px; padding: 0.5rem;">
        </div>
        <hr style="border:0; border-top:1px solid var(--border-color); margin:1.5rem 0;">
        <div class="input-group">
           <label>Online Sales Amount / Order Value (₹)</label>
           <input type="number" id="metrics-sales-amount" class="input" min="0" step="0.01">
        </div>
        <div class="input-group">
           <label>Website Listing Done</label>
           <!-- MODIFIED: Changed from Dropdown to Number Input -->
           <input type="number" id="metrics-web-listing" class="input" min="0">
        </div>
        <div class="input-group">
           <label>Quantity Updated?</label>
           <select id="metrics-sales-qty-updated" class="input">
             <option value="Yes">Yes</option>
             <option value="No">No</option>
           </select>
        </div>
        <div class="input-group">
           <label>Add to cart Calling: Number of calls done</label>
           <input type="number" id="metrics-calls-done" class="input" min="0">
        </div>
        <div class="input-group">
           <label>Add to cart Calling: Details submitted on Drive?</label>
           <select id="metrics-drive-submitted" class="input">
             <option value="Yes">Yes</option>
             <option value="No">No</option>
           </select>
        </div>
        <div class="input-group">
           <label>Customer Enquiry Converted: Number of Customers</label>
           <input type="number" id="metrics-enquiry-number" class="input" min="0">
        </div>
        <div class="input-group">
           <label>Customer Enquiry Converted: Value (₹)</label>
           <input type="number" id="metrics-enquiry-value" class="input" min="0" step="0.01">
        </div>
        <div class="input-group">
           <label>Return orders qty</label>
           <input type="number" id="metrics-returns-qty" class="input" min="0">
        </div>
        <button id="submitMetricsBtn" class="btn btn-primary mt-2 w-full">Submit Report</button>
      </div>
      ${renderMyReports()}
      ${renderCompanyFeed()}
    </div>
  `;
}

function renderContentDashboard() {
  return `
    <div class="screen">
      ${renderAttendanceControl()}
      ${renderWorkAssignments()}
      <div class="card mb-6">
        <h3 class="text-xl mb-4">Log Content Creation</h3>
        <div class="input-group">
           <label>Shoots Completed</label>
           <input type="number" id="metrics-shoots" class="input" min="0">
        </div>
        <div class="input-group">
           <label>Videos/Photos Edited</label>
           <input type="number" id="metrics-edits" class="input" min="0">
        </div>
        <button id="submitMetricsBtn" class="btn btn-primary mt-2 w-full">Submit Report</button>
      </div>
      ${renderMyReports()}
      ${renderCompanyFeed()}
    </div>
  `;
}

function renderCatalogDashboard() {
  return `
    <div class="screen">
      ${renderAttendanceControl()}
      ${renderWorkAssignments()}
      <div class="card mb-6">
        <h3 class="text-xl mb-4">Log Website Cataloging Work</h3>
        <div class="input-group">
           <label>Website Catalog Product Done</label>
           <input type="number" id="metrics-web-products" class="input" min="0">
        </div>
        <div class="input-group">
           <label>Content Shooted</label>
           <input type="number" id="metrics-shooted" class="input" min="0">
        </div>
        <div class="input-group">
           <label>Content Done</label>
           <input type="number" id="metrics-content-done" class="input" min="0">
        </div>
        <div class="input-group">
           <label>Quantity Updated?</label>
           <select id="metrics-cat-qty-updated" class="input">
             <option value="Yes">Yes</option>
             <option value="No">No</option>
           </select>
        </div>
        <div class="input-group">
           <label>Store Order Value (₹)</label>
           <input type="number" id="metrics-store-order-value" class="input" min="0" step="0.01">
        </div>
        <button id="submitMetricsBtn" class="btn btn-primary mt-2 w-full">Submit Report</button>
      </div>
      ${renderMyReports()}
      ${renderCompanyFeed()}
    </div>
  `;
}

function renderMyReports() {
  const myReports = getReports().filter(r => r.userId === currentUser.id).reverse();
  return `
    <h3 class="text-xl mb-4">My Past Reports</h3>
    <div class="data-list">
      ${myReports.length === 0 ? '<p class="text-muted">No reports submitted yet.</p>' : ''}
      ${myReports.map(r => `
        <div class="data-item flex-col items-start gap-2">
          <div class="w-full flex justify-between">
            <span class="text-muted">${new Date(r.date).toLocaleString()}</span>
          </div>
          <div style="font-size: 0.9rem;">
             ${Object.entries(r.data).map(([k,v]) => {
                const displayVal = (k.includes('value') || k.includes('amount')) ? '₹'+v : v;
                return '<span style="text-transform: capitalize;">' + k.replace(/_/g, ' ') + '</span>: <strong>' + displayVal + '</strong>';
             }).join(' | ')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderCompanyFeed() {
  const users = getUsers();
  const allReports = getReports().reverse();
  const filteredReports = allReports.filter(r => {
    // If no filter selected, show today's by default, else match date
    if(!feedDateFilter) return true;
    return r.date.startsWith(feedDateFilter);
  });
  
  return `
    <div class="flex justify-between items-center mb-4 mt-8">
      <h3 class="text-xl">Company Feed</h3>
      <input type="date" class="input" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.85rem;" value="${feedDateFilter}" onchange="handleFeedDateChange(this.value)">
    </div>
    <div class="data-list">
      ${filteredReports.length === 0 ? '<p class="text-muted">No reports logged on this date.</p>' : ''}
      ${filteredReports.map(r => {
        const user = users.find(u => u.id === r.userId);
        const name = user ? user.name : 'Unknown';
        const dp = user?.dp ? '<img src="' + user.dp + '" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">' : '<i class="fa-solid fa-user text-muted text-xs"></i>';
        return '<div class="data-item flex-col items-start gap-2">' +
          '<div class="w-full flex justify-between items-center">' +
            '<div style="display:flex; align-items:center; gap:0.5rem;">' +
               '<div style="width:24px;height:24px; border-radius:50%; background:var(--surface-hover); display:flex; align-items:center; justify-content:center; overflow:hidden;">' + dp + '</div>' +
               '<strong>' + name + '</strong>' +
            '</div>' +
            '<span class="text-muted" style="font-size: 0.8rem;">' + new Date(r.date).toLocaleTimeString() + '</span>' +
          '</div>' +
          '<span class="badge" style="align-self: flex-start; margin-left: 2rem;">' + formatDept(r.department) + '</span>' +
          '<div style="font-size: 0.9rem; margin-top: 0.25rem; margin-left: 2rem;">' +
             Object.entries(r.data).map(([k,v]) => {
                const displayVal = (k.includes('value') || k.includes('amount')) ? '₹'+v : v;
                return '<span style="text-transform: capitalize;">' + k.replace(/_/g, ' ') + '</span>: <strong>' + displayVal + '</strong>';
             }).join(' | ') +
          '</div>' +
        '</div>';
      }).join('')}
    </div>
  `;
}

function attachEmployeeEvents() {
  document.getElementById('checkInBtn')?.addEventListener('click', () => {
    logLogin(currentUser.id);
    render();
  });

  document.getElementById('checkOutBtn')?.addEventListener('click', () => {
    logLogout(currentUser.id);
    render();
  });

  document.getElementById('markAbsentBtn')?.addEventListener('click', () => {
    logSpecialAttendance(currentUser.id, 'Absent');
    render();
  });

  document.getElementById('markWeekoffBtn')?.addEventListener('click', () => {
    logSpecialAttendance(currentUser.id, 'Weekoff');
    render();
  });

  document.getElementById('submitMetricsBtn')?.addEventListener('click', () => {
    let data = {};
    if (currentUser.department === DEPARTMENTS.SALES) {
      data = {
        sales_amount_value: document.getElementById('metrics-sales-amount').value || 0,
        website_listing_done: document.getElementById('metrics-web-listing').value || 0,
        quantity_updated: document.getElementById('metrics-sales-qty-updated').value,
        calling_number_of_calls: document.getElementById('metrics-calls-done').value || 0,
        calling_drive_submitted: document.getElementById('metrics-drive-submitted').value,
        enquiry_converted_number: document.getElementById('metrics-enquiry-number').value || 0,
        enquiry_converted_value: document.getElementById('metrics-enquiry-value').value || 0,
        return_orders_qty: document.getElementById('metrics-returns-qty').value || 0
      };

      const s1 = document.getElementById('metrics-sales-source-1').value;
      const q1 = document.getElementById('metrics-sales-qty-1').value;
      if (s1 && q1) data[`Orders_${s1}`] = q1;

      const s2 = document.getElementById('metrics-sales-source-2').value;
      const q2 = document.getElementById('metrics-sales-qty-2').value;
      if (s2 && q2) data[`Orders_${s2}`] = q2;

      const s3 = document.getElementById('metrics-sales-source-3').value;
      const q3 = document.getElementById('metrics-sales-qty-3').value;
      if (s3 && q3) data[`Orders_${s3}`] = q3;
    } else if (currentUser.department === DEPARTMENTS.CONTENT) {
      data = {
        shoots: document.getElementById('metrics-shoots').value || 0,
        edits: document.getElementById('metrics-edits').value || 0
      };
    } else if (currentUser.department === DEPARTMENTS.CATALOG) {
      data = {
        web_products_done: document.getElementById('metrics-web-products').value || 0,
        content_shooted: document.getElementById('metrics-shooted').value || 0,
        content_done: document.getElementById('metrics-content-done').value || 0,
        quantity_updated: document.getElementById('metrics-cat-qty-updated').value,
        store_order_value: document.getElementById('metrics-store-order-value').value || 0
      };
    }

    addReport({
      userId: currentUser.id,
      department: currentUser.department,
      data: data
    });
    alert("Report Submitted!");
    render(); // refresh
  });
}
function togglePassword() {
  const passwordField = document.getElementById("password");

  if (passwordField.type === "password") {
    passwordField.type = "text";
  } else {
    passwordField.type = "password";
  }
}
// Initial render
render();
