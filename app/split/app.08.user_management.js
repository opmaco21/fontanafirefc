/* =========================
   USER MANAGEMENT (Batch 7)
   Admin-only page for managing users, passwords, and access.
   ========================= */

let allUsers = [];

async function showUserManagement() {
  const appScreen = document.getElementById("appScreen");
  if (!appScreen) return;

  // Only Admin and TeamMom can access User Management
  if (!currentUser || (!["Admin", "TeamMom"].includes(currentUser.RoleName))) {
    alert("Access denied. Admin or Team Mom role required.");
    return;
  }

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
        ${currentUser && currentUser.RoleName === "Admin" ? `<button id="createUserBtn" class="btn btn-primary" style="margin-top:0;">+ Create New User</button>` : ""}
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
  `;

  appScreen.appendChild(section);

  const createUserBtn = document.getElementById("createUserBtn");
  if (createUserBtn) createUserBtn.addEventListener("click", showCreateUserModal);
  document.getElementById("backFromUserMgmtBtn").addEventListener("click", () => {
    section.remove();
    appScreen.querySelectorAll("section, hr").forEach(el => el.classList.remove("hidden"));
    if (typeof applyRolePermissions === "function") applyRolePermissions();
  });

  await loadUsers();
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
        <td><strong>${u.FullName}</strong>${mustChangeBadge}</td>
        <td style="color:#555; font-size:13px;">${u.Email}</td>
        <td><span class="user-role-badge ${roleClass}">${roleLabel}</span></td>
        <td>
          <span class="user-status-badge ${u.IsActive ? 'user-status-active' : 'user-status-inactive'}">
            ${u.IsActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td style="color:#666; font-size:12px;">${lastLogin}</td>
        <td>
          <div class="user-action-buttons">
            ${currentUser && currentUser.RoleName === "Admin" ? `
            <button class="user-action-btn user-action-reset"
              onclick="showResetPasswordModal(${u.UserID}, '${u.FullName.replace(/'/g, "\\'")}')">
              Reset Password
            </button>
            ${!isSelf ? `
            <button class="user-action-btn ${u.IsActive ? 'user-action-deactivate' : 'user-action-activate'}"
              onclick="toggleUserActive(${u.UserID}, '${u.FullName.replace(/'/g, "\\'")}', ${u.IsActive})">
              ${u.IsActive ? 'Deactivate' : 'Activate'}
            </button>` : ''}
            ` : '<span style="color:#999; font-size:12px;">View only</span>'}
          </div>
        </td>
      </tr>
    `;
  }).join("");
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
  const modal = buildModal("resetConfirmModal", `
    <h3 style="color:#c2410c;">Reset Password?</h3>
    <p>A new temporary password will be generated for <strong>${userName}</strong>. They will be required to change it on next login.</p>

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
    showTempPasswordModal(userName, "", data.tempPassword);
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
function showTempPasswordModal(userName, email, tempPassword) {
  const modal = buildModal("tempPasswordModal", `
    <h3 style="color:#166534; text-align:center;">✓ Password ${email ? 'Created' : 'Reset'}</h3>
    <p style="text-align:center;">
      <strong>${userName}</strong>${email ? `<br><span style="font-size:13px; color:#666;">${email}</span>` : ''}<br>
      Must change password on next login.
    </p>

    <div class="temp-password-box">
      <div class="temp-password-label">Temporary Password</div>
      <div class="temp-password-row">
        <div class="temp-password-value" id="tempPasswordValue">${tempPassword}</div>
        <button class="temp-password-copy-btn" id="copyTempPasswordBtn">Copy</button>
      </div>
    </div>

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
