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
   RESTORE SESSION
   ========================= */
async function restoreSession() {
  // Show a friendly message while the backend wakes up.
  // Render free tier can take 30-50s on cold start - this avoids
  // "Session expired" flashing during normal startup.
  if (loginMessage) {
    loginMessage.style.color = "#f57c00";
    loginMessage.textContent = "Connecting to server, please wait...";
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include"
    });

    const data = await res.json();

    if (res.ok && data.success) {
      currentUser = data.user;
      localStorage.setItem("attendanceUser", JSON.stringify(currentUser));
      if (loginMessage) loginMessage.textContent = "";
      await showApp();
      return;
    }

    // No active session - just clear the message and let user log in.
    localStorage.removeItem("attendanceUser");
    if (loginMessage) loginMessage.textContent = "";

  } catch (err) {
    console.error("Restore session error:", err);
    localStorage.removeItem("attendanceUser");
    if (loginMessage) {
      loginMessage.style.color = "#c62828";
      loginMessage.textContent = "Could not reach server. Please try again.";
    }
  }
}
