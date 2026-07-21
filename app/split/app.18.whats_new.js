/* =========================================================
   FONTANA FIRE FC ATTENDANCE APP
   WHAT'S NEW
   Standalone release notice.
   ========================================================= */

(function () {
  "use strict";

  const VERSION = "2026-07-coach-filter";
  const STORAGE_KEY = "attendanceWhatsNewVersion";

  function showWhatsNewPopup() {
    if (!document.body) return;
    if (localStorage.getItem(STORAGE_KEY) === VERSION) return;
    if (document.getElementById("attendanceWhatsNewOverlay")) return;

    const appScreen = document.getElementById("appScreen");
    if (!appScreen || appScreen.classList.contains("hidden")) return;

    const overlay = document.createElement("div");
    overlay.id = "attendanceWhatsNewOverlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "What's New");
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:10000",
      "background:rgba(0,0,0,.55)",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:20px"
    ].join(";");

    overlay.innerHTML = `
      <div style="width:min(420px,100%);background:#fff;border-radius:16px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.3);">
        <h2 style="margin:0 0 14px;">What's New</h2>
        <ul style="margin:0 0 20px;padding-left:22px;line-height:1.6;">
          <li>Coach filter added to Attendance</li>
          <li>Coach Override added to Player Management</li>
          <li>Player cards now show each player's resolved coach</li>
          <li>Select All Coaches anytime to take full attendance</li>
        </ul>
        <button id="attendanceWhatsNewGotIt" type="button" class="btn btn-primary" style="width:100%;">
          Got it
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("attendanceWhatsNewGotIt").addEventListener("click", () => {
      localStorage.setItem(STORAGE_KEY, VERSION);
      overlay.remove();
    });
  }

  function schedulePopupCheck() {
    [150, 500, 1200, 2500].forEach(delay => {
      window.setTimeout(showWhatsNewPopup, delay);
    });
  }

  window.addEventListener("load", schedulePopupCheck);

  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", schedulePopupCheck);
  }

  window.showAttendanceWhatsNew = showWhatsNewPopup;
})();
