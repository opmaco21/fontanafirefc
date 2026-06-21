/* =========================
   LOAD VERSION DISPLAY

   Web version:
   - Generated automatically by push-website.bat into
     /app/version.json.
   - index.html reads it before loading app.js and exposes it
     as window.WEB_APP_VERSION.

   API version:
   - Generated automatically by push-backend.bat into the
     backend version.json file.
   - Loaded from /api/version.
   ========================= */
async function loadVersionDisplay() {
  const webVersion =
    window.WEB_APP_VERSION && window.WEB_APP_VERSION.webVersion
      ? window.WEB_APP_VERSION.webVersion
      : "web-version-unavailable";

  if (webVersionText) {
    webVersionText.textContent = webVersion;
  }

  try {
    const res = await fetch(`${API_BASE}/version`, {
      credentials: "include"
    });

    const data = await res.json();

    if (apiVersionText) {
      apiVersionText.textContent =
        res.ok && data.success && data.version
          ? data.version
          : "api-version-unavailable";
    }

  } catch (err) {
    console.error("Could not load API version:", err);

    if (apiVersionText) {
      apiVersionText.textContent = "api-version-unavailable";
    }
  }
}

/* =========================
   PASSWORD VALIDATION
   ========================= */
function validatePasswordStrength(password) {
  const hasLength = password.length >= 8;
  const hasAlphanumeric = /[a-zA-Z0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_\-+=\[\]{};:'",.<>?/\\|`~]/.test(password);
  return hasLength && hasAlphanumeric && hasSpecial;
}

function getPasswordStrengthMessage(password) {
  const checks = [];
  if (password.length < 8) checks.push("at least 8 characters");
  if (!/[a-zA-Z0-9]/.test(password)) checks.push("letters and numbers");
  if (!/[!@#$%^&*()_\-+=\[\]{};:'",.<>?/\\|`~]/.test(password)) checks.push("a special character");
  
  if (checks.length === 0) return "✓ Password is strong";
  return "Password needs: " + checks.join(", ");
}

/* =========================
   FORCED PASSWORD CHANGE
   ========================= */
async function showForcedPasswordChangeModal(userName) {
  const modal = document.createElement("div");
  modal.id = "forcedPasswordModal";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  const content = document.createElement("div");
  content.style.cssText = `
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 30px;
    width: 90%;
    max-width: 500px;
    text-align: center;
  `;

  content.innerHTML = `
    <h2 style="color: #d32f2f; margin-top: 0;">Password Change Required</h2>
    <p style="color: #555; margin-bottom: 20px;">
      Your password has been reset by an administrator.<br>
      <strong>You must set a new password to continue.</strong>
    </p>
    
    <div style="text-align: left; margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">
        New Password
      </label>
      <input type="password" id="newPasswordInput" placeholder="Enter new password"
        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
      <div id="passwordStrength" style="margin-top: 8px; font-size: 12px; color: #666;">
        Password needs: at least 8 characters, letters and numbers, a special character
      </div>
    </div>

    <div style="display: flex; gap: 10px; justify-content: center;">
      <button id="confirmPasswordBtn" 
        style="padding: 10px 20px; background-color: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        Set New Password
      </button>
    </div>
    
    <div id="passwordError" style="color: #d32f2f; margin-top: 15px; font-size: 12px; display: none;"></div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  const newPasswordInput = document.getElementById("newPasswordInput");
  const passwordStrength = document.getElementById("passwordStrength");
  const confirmBtn = document.getElementById("confirmPasswordBtn");
  const passwordError = document.getElementById("passwordError");

  newPasswordInput.addEventListener("input", (e) => {
    const pwd = e.target.value;
    passwordStrength.textContent = getPasswordStrengthMessage(pwd);
    passwordStrength.style.color = validatePasswordStrength(pwd) ? "#388e3c" : "#666";
  });

  confirmBtn.addEventListener("click", async () => {
    const newPassword = newPasswordInput.value;

    if (!validatePasswordStrength(newPassword)) {
      passwordError.textContent = "Password does not meet requirements";
      passwordError.style.display = "block";
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = "Setting password...";

    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        passwordError.textContent = data.message || "Failed to change password";
        passwordError.style.display = "block";
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Set New Password";
        return;
      }

      // Success - remove modal and proceed to app
      modal.remove();
      await showApp();

    } catch (err) {
      console.error("Change password error:", err);
      passwordError.textContent = "Network error. Please try again.";
      passwordError.style.display = "block";
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Set New Password";
    }
  });

  newPasswordInput.focus();
}

/* =========================
   RESTORE SESSION
   ========================= */
async function restoreSession() {
  // Show a friendly message while the backend wakes up.
  // Render free tier can take 30-50s on cold start - this avoids
  // "Session expired" flashing during normal startup.
  // Show soccer ball animation while connecting
  const loginLoading = document.getElementById("loginLoading");
  if (loginLoading) loginLoading.classList.remove("hidden");
  if (loginMessage) loginMessage.textContent = "";

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include"
    });

    const data = await res.json();

    if (loginLoading) loginLoading.classList.add("hidden");

    if (res.ok && data.success) {
      currentUser = data.user;
      currentPermissions = data.permissions || {};
      localStorage.setItem("attendanceUser", JSON.stringify(currentUser));
      if (loginMessage) loginMessage.textContent = "";

      // Check if user must change password
      if (data.mustChangePassword) {
        await showForcedPasswordChangeModal(currentUser.FullName);
      } else {
        await showApp();
      }
      return;
    }

    // No active session - just clear the message and let user log in.
    localStorage.removeItem("attendanceUser");
    if (loginMessage) loginMessage.textContent = "";

  } catch (err) {
    console.error("Restore session error:", err);
    if (loginLoading) loginLoading.classList.add("hidden");
    localStorage.removeItem("attendanceUser");
    if (loginMessage) {
      loginMessage.style.color = "#c62828";
      loginMessage.textContent = "Could not reach server. Please try again.";
    }
  }
}