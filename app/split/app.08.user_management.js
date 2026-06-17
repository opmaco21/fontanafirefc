/* =========================
   USER MANAGEMENT (Batch 7)
   Admin-only page for managing users, passwords, and access.
   ========================= */

let allUsers = [];

function escapeUserMgmtHtml(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function closeUserManagement() {
  const section = document.getElementById("userMgmtSection");
  if (!section) return;
  section.remove();

  const appScreen = document.getElementById("appScreen");
  if (appScreen) {
    appScreen.querySelectorAll("section, hr").forEach(el => el.classList.remove("hidden"));
  }

  if (typeof updateMainModeVisibility === "function") {
    updateMainModeVisibility();
  }
  if (typeof applyRolePermissions === "function") {
    applyRolePermissions();
  }
}

// Close User Management whenever a main nav tab is clicked
function attachUserMgmtTabCloseListeners() {
  const tabIds = ["dashboardTab", "practiceTab", "gamesTab", "teamEventsTab", "playerManagementTab"];
  tabIds.forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.dataset.userMgmtListenerAttached) {
      el.addEventListener("click", () => {
        if (document.getElementById("userMgmtSection")) {
          closeUserManagement();
        }
      });
      el.dataset.userMgmtListenerAttached = "true";
    }
  });
}

async function showUserManagement() {
  const appScreen = document.getElementById("appScreen");
  if (!appScreen) return;

  // Only Admin and TeamMom can access User Management
  if (!currentUser || (!["Admin", "TeamMom"].includes(currentUser.RoleName))) {
    alert("Access denied. Admin or Team Mom role required.");
    return;
  }

  attachUserMgmtTabCloseListeners();

  // Hide all other sections
  appScreen.querySelectorAll("section, hr").forEach(el => el.classList.add("hidden"));

  // Remove existing user mgmt section if present
  const existing = document.getElementById("userMgmtSection");
  if (existing) existing.remove();

  // Build the section
  const section = document.createElement("section");
  section.id = "userMgmtSection";
  section.className = "user-mgmt-container";
  const isAdmin = currentUser && currentUser.RoleName === 'Admin';
  section.innerHTML = `
    <div class="user-mgmt-header">
      <h3>User Management</h3>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${isAdmin ? `<button id="createUserBtn" class="btn btn-primary" style="margin-top:0;">+ Create New User</button>` : ""}
        <button id="backFromUserMgmtBtn" class="btn btn-secondary" style="margin-top:0;">← Back to App</button>
      </div>
    </div>

    <div class="user-mgmt-table-wrap">
      <table class="user-mgmt-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="userMgmtTableBody">
          <tr><td colspan="6" style="padding:20px; text-align:center; color:#999;">Loading users...</td></tr>
        </tbody>
      </table>
    </div>

    ${isAdmin ? `
    <div style="margin-top:24px;">
      <div class="user-mgmt-header" style="margin-bottom:12px;">
        <h3 style="margin:0;">Role Permissions</h3>
        <span style="font-size:13px; color:#666;">Changes take effect immediately</span>
      </div>
      <div id="permissionManagerContainer">
        <div style="padding:20px; text-align:center; color:#999;">Loading permissions...</div>
      </div>
    </div>
    ` : ""}
  `;

  appScreen.appendChild(section);

  const createUserBtn = document.getElementById("createUserBtn");
  if (createUserBtn) createUserBtn.addEventListener("click", showCreateUserModal);
  document.getElementById("backFromUserMgmtBtn").addEventListener("click", closeUserManagement);

  await loadUsers();
  if (isAdmin) {
    await loadPermissionManager();
  }
}

async function loadUsers() {
  try {
    const res = await fetch(`${API_BASE}/auth/users`, { credentials: "include" });
    const data = await res.json();

    if (!res.ok || !data.success) {
      renderUserTableError("Failed to load users: " + (data.message || ""));
      return;
    }

    allUsers = data.users || [];
    renderUsersTable();

  } catch (err) {
    console.error("Load users error:", err);
    renderUserTableError("Network error loading users");
  }
}

function renderUsersTable() {
  const tbody = document.getElementById("userMgmtTableBody");
  if (!tbody) return;

  if (allUsers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color:#999;">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = allUsers.map(u => {
    const roleClass = {
      Admin:     "user-role-admin",
      TeamMom:   "user-role-teammom",
      HeadCoach: "user-role-headcoach",
      Coaches:   "user-role-coaches"
    }[u.RoleName] || "";

    const roleLabel = {
      Admin:     "Admin",
      TeamMom:   "Team Mom",
      HeadCoach: "Head Coach",
      Coaches:   "Coaches"
    }[u.RoleName] || u.RoleName;

    const lastLogin = u.LastLoginAt
      ? new Date(u.LastLoginAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Never";

    const mustChangeBadge = (u.MustChangePassword === true || u.MustChangePassword === 1)
      ? `<span class="user-must-change">⚠ Must change</span>`
      : "";

    const isSelf = currentUser && u.UserID === currentUser.UserID;

    return `
      <tr>
        <td><strong>${escapeUserMgmtHtml(u.FullName)}</strong>${mustChangeBadge}</td>
        <td style="color:#555; font-size:13px;">${escapeUserMgmtHtml(u.Email)}</td>
        <td><span class="user-role-badge ${roleClass}">${escapeUserMgmtHtml(roleLabel)}</span></td>
        <td>
          <span class="user-status-badge ${u.IsActive ? 'user-status-active' : 'user-status-inactive'}">
            ${u.IsActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td style="color:#666; font-size:12px;">${lastLogin}</td>
        <td>
          <div class="user-action-buttons">
            ${currentUser && currentUser.RoleName === "Admin" ? `
            <button class="user-action-btn user-action-edit"
              data-action="edit" data-user-id="${u.UserID}" data-user-name="${escapeUserMgmtHtml(u.FullName)}" data-user-email="${escapeUserMgmtHtml(u.Email)}" data-user-role="${escapeUserMgmtHtml(u.RoleName)}">
              Edit
            </button>
            <button class="user-action-btn user-action-reset"
              data-action="reset" data-user-id="${u.UserID}" data-user-name="${escapeUserMgmtHtml(u.FullName)}">
              Reset
            </button>
            ${!isSelf ? `
            <button class="user-action-btn ${u.IsActive ? 'user-action-deactivate' : 'user-action-activate'}"
              data-action="toggle-active" data-user-id="${u.UserID}" data-user-name="${escapeUserMgmtHtml(u.FullName)}" data-is-active="${u.IsActive ? '1' : '0'}">
              ${u.IsActive ? 'Deactivate' : 'Activate'}
            </button>` : ''}
            ` : '<span style="color:#999; font-size:12px;">View only</span>'}
          </div>
        </td>
      </tr>
    `;
  }).join("");

  attachUserMgmtRowActionListener();
}

/* =========================
   ROW ACTION DELEGATION
   Reads data-* attributes (already HTML-decoded by the browser),
   so user-entered names/emails can never break out of an
   attribute or be executed as HTML/JS.
   ========================= */
function attachUserMgmtRowActionListener() {
  const tbody = document.getElementById("userMgmtTableBody");
  if (!tbody || tbody.dataset.actionListenerAttached) return;
  tbody.dataset.actionListenerAttached = "1";

  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const userID = Number(btn.dataset.userId);
    const userName = btn.dataset.userName || "";

    switch (btn.dataset.action) {
      case "edit":
        showEditUserModal(userID, userName, btn.dataset.userEmail || "", btn.dataset.userRole || "");
        break;
      case "reset":
        showResetPasswordModal(userID, userName);
        break;
      case "toggle-active":
        toggleUserActive(userID, userName, btn.dataset.isActive === "1");
        break;
    }
  });
}

function renderUserTableError(msg) {
  const tbody = document.getElementById("userMgmtTableBody");
  if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="padding:20px; text-align:center; color:#c62828;">${msg}</td></tr>`;
}

/* =========================
   CREATE NEW USER MODAL
   ========================= */
function showCreateUserModal() {
  const modal = buildModal("createUserModal", `
    <h3 style="color:#1976d2;">Create New User</h3>
    <p>A temporary password will be generated. The user must change it on first login.</p>

    <div class="form-row">
      <label>Full Name</label>
      <input type="text" id="newUserFullName" placeholder="e.g., Sarah Johnson" />
    </div>
    <div class="form-row">
      <label>Email</label>
      <input type="email" id="newUserEmail" placeholder="e.g., sarah@example.com" />
    </div>
    <div class="form-row">
      <label>Role</label>
      <select id="newUserRole">
        <option value="">-- Select Role --</option>
        <option value="Coaches">Coaches</option>
        <option value="HeadCoach">Head Coach</option>
        <option value="TeamMom">Team Mom</option>
        <option value="Admin">Admin</option>
      </select>
    </div>

    <div id="createUserError" style="color:#c62828; font-size:12px; display:none; margin-bottom:10px;"></div>

    <div class="user-mgmt-modal-actions">
      <button class="btn btn-secondary" id="cancelCreateBtn" style="margin-top:0;">Cancel</button>
      <button class="btn btn-primary" id="confirmCreateBtn" style="margin-top:0;">Create User</button>
    </div>
  `);

  document.getElementById("cancelCreateBtn").addEventListener("click", () => modal.remove());
  document.getElementById("confirmCreateBtn").addEventListener("click", () => submitCreateUser(modal));
  document.getElementById("newUserFullName").focus();
}

async function submitCreateUser(modal) {
  const fullName = document.getElementById("newUserFullName").value.trim();
  const email = document.getElementById("newUserEmail").value.trim();
  const roleName = document.getElementById("newUserRole").value;
  const errorDiv = document.getElementById("createUserError");
  const btn = document.getElementById("confirmCreateBtn");

  if (!fullName || !email || !roleName) {
    errorDiv.textContent = "All fields are required";
    errorDiv.style.display = "block";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Creating...";

  try {
    const res = await fetch(`${API_BASE}/auth/users/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ fullName, email, roleName })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      errorDiv.textContent = data.message || "Failed to create user";
      errorDiv.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Create User";
      return;
    }

    modal.remove();
    showTempPasswordModal(data.fullName, data.email, data.tempPassword);
    await loadUsers();

  } catch (err) {
    errorDiv.textContent = "Network error. Please try again.";
    errorDiv.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Create User";
  }
}

/* =========================
   RESET PASSWORD MODAL
   ========================= */
function showResetPasswordModal(userID, userName) {
  const safeUserName = escapeUserMgmtHtml(userName);
  const modal = buildModal("resetConfirmModal", `
    <h3 style="color:#c2410c;">Reset Password?</h3>
    <p>A new temporary password will be generated for <strong>${safeUserName}</strong>. They will be required to change it on next login.</p>

    <div id="resetError" style="color:#c62828; font-size:12px; display:none; margin-bottom:10px;"></div>

    <div class="user-mgmt-modal-actions">
      <button class="btn btn-secondary" id="cancelResetBtn" style="margin-top:0;">Cancel</button>
      <button class="btn btn-primary" id="confirmResetBtn" style="margin-top:0; background:#c2410c;">Reset Password</button>
    </div>
  `);

  document.getElementById("cancelResetBtn").addEventListener("click", () => modal.remove());
  document.getElementById("confirmResetBtn").addEventListener("click", () => submitResetPassword(userID, userName, modal));
}

async function submitResetPassword(userID, userName, modal) {
  const errorDiv = document.getElementById("resetError");
  const btn = document.getElementById("confirmResetBtn");
  btn.disabled = true;
  btn.textContent = "Resetting...";

  try {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ targetUserID: userID })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      errorDiv.textContent = data.message || "Failed to reset password";
      errorDiv.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Reset Password";
      return;
    }

    modal.remove();
    showTempPasswordModal(userName, "", data.tempPassword, true);
    await loadUsers();

  } catch (err) {
    errorDiv.textContent = "Network error. Please try again.";
    errorDiv.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Reset Password";
  }
}

/* =========================
   TEMP PASSWORD DISPLAY
   ========================= */
function showTempPasswordModal(userName, email, tempPassword, isReset = false) {
  const safeUserName = escapeUserMgmtHtml(userName);
  const safeEmail = escapeUserMgmtHtml(email);
  const safeTempPassword = escapeUserMgmtHtml(tempPassword);

  const modal = buildModal("tempPasswordModal", `
    <h3 style="color:#166534; text-align:center;">✓ Password ${email ? 'Created' : 'Reset'}</h3>
    <p style="text-align:center;">
      <strong>${safeUserName}</strong>${email ? `<br><span style="font-size:13px; color:#666;">${safeEmail}</span>` : ''}<br>
      Must change password on next login.
    </p>

    <div class="temp-password-box">
      <div class="temp-password-label">Temporary Password</div>
      <div class="temp-password-row">
        <div class="temp-password-value" id="tempPasswordValue">${safeTempPassword}</div>
        <button class="temp-password-copy-btn" id="copyTempPasswordBtn">Copy</button>
      </div>
    </div>

    ${isReset ? `
    <div class="temp-password-warning" style="background:#fee2e2; border-color:#fca5a5; color:#991b1b;">
      🔒 ${safeUserName}'s old password no longer works. They must log in with this temporary password above, then set a new one.
    </div>
    ` : ''}

    <div class="temp-password-warning">
      ⚠️ Share this password securely. It will not be shown again.
    </div>

    <div class="user-mgmt-modal-actions" style="justify-content:center; margin-top:20px;">
      <button class="btn btn-primary" id="closeTempPasswordBtn" style="margin-top:0;">Done</button>
    </div>
  `);

  document.getElementById("copyTempPasswordBtn").addEventListener("click", () => {
    navigator.clipboard.writeText(tempPassword).then(() => {
      document.getElementById("copyTempPasswordBtn").textContent = "Copied!";
      setTimeout(() => {
        const btn = document.getElementById("copyTempPasswordBtn");
        if (btn) btn.textContent = "Copy";
      }, 2000);
    });
  });

  document.getElementById("closeTempPasswordBtn").addEventListener("click", () => modal.remove());
}

/* =========================
   TOGGLE ACTIVE STATUS
   ========================= */
async function toggleUserActive(userID, userName, isCurrentlyActive) {
  const action = isCurrentlyActive ? "deactivate" : "activate";
  if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${userName}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/auth/users/${userID}/toggle-active`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.message || "Failed to update user");
      return;
    }

    await loadUsers();

  } catch (err) {
    console.error("Toggle active error:", err);
    alert("Network error. Please try again.");
  }
}

/* =========================
   EDIT USER MODAL
   ========================= */
function showEditUserModal(userID, fullName, email, roleName) {
  const safeFullName = escapeUserMgmtHtml(fullName);
  const safeEmail = escapeUserMgmtHtml(email);

  const modal = buildModal("editUserModal", `
    <h3 style="color:#1976d2;">Edit User</h3>
    <p style="color:#666; margin-bottom:16px;">Update details for <strong>${safeFullName}</strong></p>

    <div class="form-row">
      <label>Full Name</label>
      <input type="text" id="editUserFullName" value="${safeFullName}" />
    </div>
    <div class="form-row">
      <label>Email</label>
      <input type="email" id="editUserEmail" value="${safeEmail}" />
    </div>
    <div class="form-row">
      <label>Role</label>
      <select id="editUserRole">
        <option value="TeamMom" ${roleName === "TeamMom" ? "selected" : ""}>Team Mom</option>
        <option value="HeadCoach" ${roleName === "HeadCoach" ? "selected" : ""}>Head Coach</option>
        <option value="Coaches" ${roleName === "Coaches" ? "selected" : ""}>Coach</option>
        <option value="Admin" ${roleName === "Admin" ? "selected" : ""}>Admin</option>
      </select>
    </div>

    <div id="editUserError" style="color:#c62828; font-size:12px; display:none; margin-bottom:10px;"></div>

    <div class="user-mgmt-modal-actions">
      <button class="btn btn-secondary" id="cancelEditBtn" style="margin-top:0;">Cancel</button>
      <button class="btn btn-primary" id="confirmEditBtn" style="margin-top:0;">Save Changes</button>
    </div>
  `);

  document.getElementById("cancelEditBtn").addEventListener("click", () => modal.remove());
  document.getElementById("confirmEditBtn").addEventListener("click", () => submitEditUser(userID, modal));
  document.getElementById("editUserFullName").focus();
}

async function submitEditUser(userID, modal) {
  const fullName = document.getElementById("editUserFullName").value.trim();
  const email = document.getElementById("editUserEmail").value.trim();
  const roleName = document.getElementById("editUserRole").value;
  const errorDiv = document.getElementById("editUserError");
  const btn = document.getElementById("confirmEditBtn");

  if (!fullName || !email || !roleName) {
    errorDiv.textContent = "All fields are required";
    errorDiv.style.display = "block";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    const res = await fetch(`${API_BASE}/auth/users/${userID}/edit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ fullName, email, roleName })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      errorDiv.textContent = data.message || "Failed to update user";
      errorDiv.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Save Changes";
      return;
    }

    modal.remove();
    await loadUsers();

  } catch (err) {
    errorDiv.textContent = "Network error. Please try again.";
    errorDiv.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Save Changes";
  }
}

/* =========================
   MODAL BUILDER HELPER
   ========================= */
function buildModal(id, innerHtml) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = id;
  overlay.className = "user-mgmt-modal-overlay";

  const box = document.createElement("div");
  box.className = "user-mgmt-modal";
  box.innerHTML = innerHtml;

  overlay.appendChild(box);
  document.body.appendChild(overlay);
  return overlay;
}
/* =========================
   PERMISSION MANAGER
   Admin-only. Loads from DB, renders grid of toggles per role per capability.
   Changes save immediately on toggle.
   ========================= */

const PERMISSION_LABELS = {
  canMarkAttendance:     { label: "Mark Attendance",       desc: "Take roll call for practices, games, and events" },
  canManageEvents:       { label: "Manage Events",         desc: "Create, edit, cancel, restore games and events; manage rosters" },
  canManagePlayers:      { label: "Manage Players",        desc: "Add, edit, and view full player profiles and contact info" },
  canGenerateSchedule:   { label: "Generate Schedule",     desc: "Bulk-create practice events from the Practice tab" },
  canViewDashboard:      { label: "View Dashboard",        desc: "Access attendance reports and player summaries" },
  canViewUserManagement: { label: "View User Management",  desc: "See the user list (Admin can also edit users)" }
};

const ROLE_LABELS = {
  Admin:     "Admin",
  TeamMom:   "Team Mom",
  HeadCoach: "Head Coach",
  Coaches:   "Coaches"
};

// Capabilities that Admin cannot have toggled (prevent lockout)
const ADMIN_LOCKED = ["canMarkAttendance", "canViewDashboard", "canViewUserManagement"];

async function loadPermissionManager() {
  const container = document.getElementById("permissionManagerContainer");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/permissions`, { credentials: "include" });
    const data = await res.json();

    if (!res.ok || !data.success) {
      container.innerHTML = `<p style="color:#c62828;">Failed to load permissions: ${escapeUserMgmtHtml(data.message || "")}</p>`;
      return;
    }

    renderPermissionManager(data.permissions, container);

  } catch (err) {
    console.error("Load permissions error:", err);
    container.innerHTML = `<p style="color:#c62828;">Network error loading permissions.</p>`;
  }
}

function renderPermissionManager(permissions, container) {
  const roles = ["Admin", "TeamMom", "HeadCoach", "Coaches"];
  const capabilities = Object.keys(PERMISSION_LABELS);

  let html = `
    <div class="perm-table-wrap">
      <table class="perm-table">
        <thead>
          <tr>
            <th class="perm-cap-col">Capability</th>
            ${roles.map(r => `<th class="perm-role-col">${escapeUserMgmtHtml(ROLE_LABELS[r])}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
  `;

  capabilities.forEach(cap => {
    const info = PERMISSION_LABELS[cap];
    html += `<tr>
      <td class="perm-cap-cell">
        <div class="perm-cap-label">${escapeUserMgmtHtml(info.label)}</div>
        <div class="perm-cap-desc">${escapeUserMgmtHtml(info.desc)}</div>
      </td>`;

    roles.forEach(role => {
      const isGranted = permissions[role] && permissions[role][cap] === true;
      const isLocked = role === "Admin" && ADMIN_LOCKED.includes(cap);
      const toggleId = `perm-${role}-${cap}`;

      html += `<td class="perm-toggle-cell">
        <label class="perm-toggle ${isLocked ? "perm-toggle-locked" : ""}" title="${isLocked ? "Cannot be changed for Admin" : ""}">
          <input
            type="checkbox"
            id="${escapeUserMgmtHtml(toggleId)}"
            data-role="${escapeUserMgmtHtml(role)}"
            data-capability="${escapeUserMgmtHtml(cap)}"
            ${isGranted ? "checked" : ""}
            ${isLocked ? "disabled" : ""}
            style="width:auto; margin:0; padding:0;"
          />
          <span class="perm-toggle-track ${isGranted ? "perm-on" : "perm-off"} ${isLocked ? "perm-locked" : ""}"></span>
        </label>
      </td>`;
    });

    html += `</tr>`;
  });

  html += `</tbody></table></div>
    <p id="permSaveMessage" style="font-size:13px; margin-top:8px; min-height:18px;"></p>`;

  container.innerHTML = html;

  // Wire up toggle listeners
  container.querySelectorAll("input[data-role][data-capability]").forEach(input => {
    input.addEventListener("change", async function() {
      const role = this.dataset.role;
      const capability = this.dataset.capability;
      const isGranted = this.checked;
      const track = this.nextElementSibling;

      this.disabled = true;
      await savePermission(role, capability, isGranted, track);
      this.disabled = this.closest(".perm-toggle-locked") ? true : false;
    });
  });
}

async function savePermission(role, capability, isGranted, trackEl) {
  const msgEl = document.getElementById("permSaveMessage");

  try {
    const res = await fetch(`${API_BASE}/permissions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ roleName: role, capability, isGranted })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      if (msgEl) { msgEl.style.color = "#c62828"; msgEl.textContent = data.message || "Failed to save."; }
      return;
    }

    // Update track styling
    if (trackEl) {
      trackEl.classList.toggle("perm-on", isGranted);
      trackEl.classList.toggle("perm-off", !isGranted);
    }

    // Refresh local permissions so the app reflects changes immediately
    try {
      const permRes = await fetch(`${API_BASE}/permissions/my`, { credentials: "include" });
      const permData = await permRes.json();
      if (permData.success) {
        currentPermissions = permData.permissions;
        if (typeof applyRolePermissions === "function") applyRolePermissions();
      }
    } catch (_) {}

    if (msgEl) {
      msgEl.style.color = "#2e7d32";
      msgEl.textContent = `✓ ${ROLE_LABELS[role]} · ${PERMISSION_LABELS[capability].label} ${isGranted ? "enabled" : "disabled"}`;
      setTimeout(() => { if (msgEl) msgEl.textContent = ""; }, 3000);
    }

  } catch (err) {
    console.error("Save permission error:", err);
    if (msgEl) { msgEl.style.color = "#c62828"; msgEl.textContent = "Network error. Please try again."; }
  }
}
