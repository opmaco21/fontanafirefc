(function () {
  "use strict";
  const STORAGE_PREFIX = "attendanceWhatsNewDismissed:";

  function ensureWhatsNewStyles() {
    if (document.getElementById("attendanceWhatsNewStyles")) return;

    const style = document.createElement("style");
    style.id = "attendanceWhatsNewStyles";
    style.textContent = `
      .whats-new-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(15, 23, 42, 0.68);
        backdrop-filter: blur(2px);
      }

      .whats-new-card {
        width: min(620px, 100%);
        max-height: calc(100vh - 40px);
        overflow-y: auto;
        box-sizing: border-box;
        background: #ffffff;
        color: #111827;
        border: 1px solid #e5e7eb;
        border-top: 4px solid #f57c00;
        border-radius: 16px;
        padding: 22px;
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
      }

      .whats-new-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 12px;
      }

      .whats-new-heading h2,
      .whats-new-card h3 {
        margin: 0;
      }

      .whats-new-card h3 {
        margin-top: 8px;
        margin-bottom: 8px;
      }

      .whats-new-kicker {
        margin-bottom: 4px;
        color: #f57c00;
        font-size: 13px;
        font-weight: 700;
      }

      .whats-new-close {
        flex: 0 0 auto;
        width: 38px;
        height: 38px;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        background: #ffffff;
        color: #111827;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
      }

      .whats-new-close:hover {
        background: #f3f4f6;
      }

      .whats-new-list {
        margin: 14px 0 18px 20px;
        padding: 0;
      }

      .whats-new-list li {
        margin: 7px 0;
      }

      .whats-new-dismiss-choice {
        display: flex;
        align-items: center;
        gap: 9px;
        margin: 14px 0 18px;
        cursor: pointer;
      }

      .whats-new-checkmark {
        display: none;
      }

      .whats-new-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        flex-wrap: wrap;
      }

      @media (max-width: 560px) {
        .whats-new-overlay {
          align-items: flex-start;
          padding: 12px;
        }

        .whats-new-card {
          max-height: calc(100vh - 24px);
          padding: 18px;
          border-radius: 12px;
        }

        .whats-new-actions {
          display: grid;
          grid-template-columns: 1fr;
        }

        .whats-new-actions .btn {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }


  function latestRelease() {
    return Array.isArray(window.ATTENDANCE_CHANGELOG) && window.ATTENDANCE_CHANGELOG.length
      ? window.ATTENDANCE_CHANGELOG[0]
      : null;
  }

  function showWhatsNewPopup(options = {}) {
    ensureWhatsNewStyles();
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
