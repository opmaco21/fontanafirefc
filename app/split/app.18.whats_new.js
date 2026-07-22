(function () {
  "use strict";
  const STORAGE_PREFIX = "attendanceWhatsNewDismissed:";

  function latestRelease() {
    return Array.isArray(window.ATTENDANCE_CHANGELOG) && window.ATTENDANCE_CHANGELOG.length
      ? window.ATTENDANCE_CHANGELOG[0]
      : null;
  }

  function showWhatsNewPopup(options = {}) {
    const release = latestRelease();
    if (!release || !document.body) return;

    const force = options.force === true;
    const key = STORAGE_PREFIX + release.version;
    if (!force && localStorage.getItem(key) === "1") return;
    if (document.getElementById("attendanceWhatsNewOverlay")) return;

    const appScreen = document.getElementById("appScreen");
    if (!force && (!appScreen || appScreen.classList.contains("hidden"))) return;

    const overlay = document.createElement("div");
    overlay.id = "attendanceWhatsNewOverlay";
    overlay.className = "whats-new-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    overlay.innerHTML = `
      <div class="whats-new-card">
        <div class="whats-new-heading">
          <div>
            <div class="whats-new-kicker">${release.version} · ${release.date}</div>
            <h2>What's New</h2>
          </div>
          <button id="attendanceWhatsNewClose" type="button" class="whats-new-close" aria-label="Close">×</button>
        </div>
        <h3>${release.title}</h3>
        <p>${release.summary}</p>
        <ul class="whats-new-list">${(release.features || []).map(item => `<li>${item}</li>`).join("")}</ul>
        <label class="whats-new-dismiss-choice">
          <input id="attendanceWhatsNewDontShow" type="checkbox" />
          <span class="whats-new-checkmark" aria-hidden="true">✓</span>
          <span>Don't show this update again</span>
        </label>
        <div class="whats-new-actions">
          <button id="attendanceWhatsNewHistory" type="button" class="btn btn-secondary">View Release History</button>
          <button id="attendanceWhatsNewGotIt" type="button" class="btn btn-primary">Continue</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    function closePopup() {
      const checkbox = document.getElementById("attendanceWhatsNewDontShow");
      if (checkbox && checkbox.checked) localStorage.setItem(key, "1");
      overlay.remove();
    }

    document.getElementById("attendanceWhatsNewClose").addEventListener("click", closePopup);
    document.getElementById("attendanceWhatsNewGotIt").addEventListener("click", closePopup);
    document.getElementById("attendanceWhatsNewHistory").addEventListener("click", () => {
      overlay.remove();
      if (typeof helpTab !== "undefined" && helpTab) {
        helpTab.click();
        setTimeout(() => {
          document.querySelectorAll(".help-section").forEach(section => {
            const title = section.querySelector(".help-section-title");
            if (title && title.textContent.includes("Release History")) {
              section.open = true;
              section.scrollIntoView({behavior:"smooth", block:"start"});
            }
          });
        }, 100);
      }
    });
  }

  function schedulePopupCheck() {
    [150, 500, 1200, 2500].forEach(delay => setTimeout(() => showWhatsNewPopup(), delay));
  }

  window.addEventListener("load", schedulePopupCheck);
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) loginBtn.addEventListener("click", schedulePopupCheck);
  window.showAttendanceWhatsNew = () => showWhatsNewPopup({force:true});
})();
