/* =========================================================
   app.12.tour.js — Interactive App Tour
   Self-contained. Does not modify any existing functions.
   Highlights real UI elements with a spotlight + tooltip.
   ========================================================= */
(function () {

  const TOUR_STEPS = [
    {
      target: "#dashboardTab",
      title: "Welcome to the Dashboard",
      body: "This is your home base. The Dashboard shows attendance summaries for practices, games, and events. Use the month filter at the top to review any month. Click any colored summary card (Needs Attention, Good, Strong) to see the exact players behind that number. Birthdays and player highlight lists are further down the page.",
      tab: "Dashboard"
    },
    {
      target: "#dashboardMonthFilter",
      title: "Filters & Icons",
      body: "🔴 Needs Attention &nbsp;·&nbsp; 🟡 Good &nbsp;·&nbsp; 🟢 Strong &nbsp;·&nbsp; ⚪ Not Rostered (no games/practices tracked yet). These colors are used throughout the Dashboard and Reports to flag attendance at a glance. Use the month dropdown here to change which month's data you're viewing.",
      tab: "Dashboard"
    },
    {
      target: "#practiceTab",
      title: "Practice Attendance",
      body: "Click here to take attendance for practices. Select a date, then mark each player Present, Absent, Excused, or Cancelled.",
      tab: "Practice"
    },
    {
      target: "#eventSelect, .event-selector-row select",
      title: "Select an Event",
      body: "Use this dropdown to pick which practice, game, or event you want to work with. Once you select one, a <strong>pencil icon</strong> appears next to it — click it to <strong>Edit details</strong> (name, date, time, location), <strong>Cancel</strong> the event, <strong>Restore</strong> a cancelled one, or <strong>Delete</strong> it permanently. More options like Edit Roster and Submit Attendance also appear below.",
      tab: "Practice"
    },
    {
      target: "#attendanceFilterIconBtn",
      title: "Search & Filter Icon",
      body: "Next to the player search box, this sliders icon opens extra filters — birth year, gender, and attendance status — to help you narrow down a long player list quickly.",
      tab: "Practice"
    },
    {
      target: "#gamesTab",
      title: "Games",
      body: "Create new games here. You can pick players right away, or leave the roster empty and add players later with Edit Roster — which appears once you've selected a game above.",
      tab: "Games"
    },
    {
      target: "#importGamesBtn",
      title: "Import Games",
      body: "Have a schedule photo or text from your league? Click here and Claude AI will automatically read it and create the games for you.",
      tab: null
    },
    {
      target: "#teamEventsTab",
      title: "Team Events",
      body: "Scrimmages, tournaments, team parties — anything that's not a regular practice or league game goes here.",
      tab: "Events"
    },
    {
      target: "#helpTab",
      title: "You're all set!",
      body: "You can retake this tour anytime — just come back to the Help tab and click 'Take an Interactive Tour' again. Good luck!",
      tab: null
    }
  ];

  let currentStep = 0;
  let overlayEl = null;
  let spotlightEl = null;
  let tooltipEl = null;

  function findTarget(selectorList) {
    const selectors = selectorList.split(",").map(s => s.trim());
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
    }
    // Fall back to first match even if hidden, so tour doesn't break
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function buildOverlay() {
    overlayEl = document.createElement("div");
    overlayEl.id = "appTourOverlay";
    overlayEl.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:99998;pointer-events:none;";

    spotlightEl = document.createElement("div");
    spotlightEl.id = "appTourSpotlight";
    spotlightEl.style.cssText = "position:fixed;border-radius:10px;box-shadow:0 0 0 9999px rgba(0,0,0,0.55);transition:all 0.25s ease;pointer-events:none;z-index:99998;";

    tooltipEl = document.createElement("div");
    tooltipEl.id = "appTourTooltip";
    tooltipEl.style.cssText = "position:fixed;background:#fff;border-radius:12px;padding:18px;width:90vw;max-width:340px;box-shadow:0 8px 30px rgba(0,0,0,0.3);z-index:99999;pointer-events:auto;font-family:inherit;box-sizing:border-box;";

    document.body.appendChild(overlayEl);
    document.body.appendChild(spotlightEl);
    document.body.appendChild(tooltipEl);
  }

  function removeOverlay() {
    if (spotlightEl) spotlightEl.remove();
    if (tooltipEl) tooltipEl.remove();
    if (overlayEl) overlayEl.remove();
    spotlightEl = tooltipEl = overlayEl = null;
    document.removeEventListener("keydown", handleKeydown);
  }

  function handleKeydown(e) {
    if (e.key === "Escape") endTour();
    if (e.key === "ArrowRight") nextStep();
    if (e.key === "ArrowLeft") prevStep();
  }

  function positionForTarget(target) {
    const rect = target.getBoundingClientRect();
    const pad = 6;

    spotlightEl.style.top = (rect.top - pad) + "px";
    spotlightEl.style.left = (rect.left - pad) + "px";
    spotlightEl.style.width = (rect.width + pad * 2) + "px";
    spotlightEl.style.height = (rect.height + pad * 2) + "px";

    // Dock the tooltip to the bottom of the screen, centered.
    // This avoids overlapping page content, regardless of where the
    // highlighted element sits or how tall the page is.
    tooltipEl.style.top = "";
    tooltipEl.style.bottom = "20px";
    tooltipEl.style.left = "50%";
    tooltipEl.style.transform = "translateX(-50%)";

    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function renderStep() {
    const step = TOUR_STEPS[currentStep];
    if (!step) { endTour(); return; }

    // Switch tab if this step requires it
    if (step.tab) {
      const tabButtonMap = {
        "Dashboard": "dashboardTab",
        "Games": "gamesTab",
        "Events": "teamEventsTab",
        "Practice": "practiceTab",
        "Players": "playerManagementTab"
      };
      const btnId = tabButtonMap[step.tab];
      const btn = btnId ? document.getElementById(btnId) : null;
      if (btn) btn.click();
    }

    // Auto-select the first available event so elements like the
    // pencil menu (which only appear once an event is chosen) are visible.
    const stepDelay = step.tab ? 200 : 0;
    const selectDelay = step.requiresEventSelection ? stepDelay + 250 : stepDelay;

    setTimeout(() => {
      if (step.requiresEventSelection) {
        const sel = document.querySelector("#eventSelect, .event-selector-row select");
        if (sel && !sel.value && sel.options && sel.options.length > 1) {
          sel.value = sel.options[1].value;
          sel.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    }, stepDelay);

    // Give the DOM a moment to update after tab switch / event selection
    setTimeout(() => {
      const target = findTarget(step.target);

      if (!target) {
        // Skip step if element not found on this screen/role
        if (currentStep < TOUR_STEPS.length - 1) { currentStep++; renderStep(); }
        else endTour();
        return;
      }

      positionForTarget(target);

      const isFirst = currentStep === 0;
      const isLast = currentStep === TOUR_STEPS.length - 1;

      tooltipEl.innerHTML = `
        <div style="font-weight:800;font-size:15px;color:#111827;margin-bottom:6px;">${step.title}</div>
        <div style="font-size:13px;color:#374151;line-height:1.5;margin-bottom:14px;">${step.body}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <button id="appTourSkip" style="background:none;border:none;color:#9ca3af;font-size:12px;cursor:pointer;">Skip tour</button>
          <div style="display:flex;gap:8px;">
            ${!isFirst ? `<button id="appTourBack" style="background:#f3f4f6;border:none;padding:7px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">Back</button>` : ""}
            <button id="appTourNext" style="background:#f57c00;color:#fff;border:none;padding:7px 16px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">${isLast ? "Finish" : "Next"}</button>
          </div>
        </div>
        <div style="text-align:center;margin-top:10px;font-size:11px;color:#c2c8d1;">${currentStep + 1} of ${TOUR_STEPS.length}</div>
      `;

      const nextBtn = document.getElementById("appTourNext");
      const backBtn = document.getElementById("appTourBack");
      const skipBtn = document.getElementById("appTourSkip");

      if (nextBtn) nextBtn.onclick = nextStep;
      if (backBtn) backBtn.onclick = prevStep;
      if (skipBtn) skipBtn.onclick = endTour;
    }, selectDelay);
  }

  function nextStep() {
    if (currentStep < TOUR_STEPS.length - 1) {
      currentStep++;
      renderStep();
    } else {
      endTour();
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      renderStep();
    }
  }

  function endTour() {
    removeOverlay();
    currentStep = 0;
    // If they engaged with the tour at all, don't nag them with the banner again
    try { localStorage.setItem("fffcTourBannerSeen", "1"); } catch (e) {}
  }

  window.startAppTour = function () {
    currentStep = 0;
    buildOverlay();
    document.addEventListener("keydown", handleKeydown);
    renderStep();
  };

  /* =========================
     ONE-TIME WELCOME BANNER
     Shown once after login, points to the Help tab.
     Tracked via localStorage so it never nags again.
     ========================= */
  window.maybeShowTourBanner = function () {
    try {
      if (localStorage.getItem("fffcTourBannerSeen") === "1") return;
    } catch (e) { return; }

    if (document.getElementById("tourWelcomeBanner")) return;

    const banner = document.createElement("div");
    banner.id = "tourWelcomeBanner";
    banner.style.cssText = "background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px 16px;margin:0 0 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;";
    banner.innerHTML = `
      <span style="font-size:13px;color:#9a3412;">
        <strong>New here?</strong> Check out the interactive tour in the <strong>Help</strong> tab to learn your way around.
      </span>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:#9a3412;cursor:pointer;white-space:nowrap;">
          <input type="checkbox" id="tourBannerDontShow" checked style="cursor:pointer;" />
          Don't show this again
        </label>
        <button id="tourBannerDismiss" style="background:#f57c00;color:#fff;border:none;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">Got it</button>
      </div>
    `;

    const appScreen = document.getElementById("appScreen");
    if (appScreen) {
      appScreen.insertBefore(banner, appScreen.firstChild.nextSibling || appScreen.firstChild);
    }

    const dismissBtn = document.getElementById("tourBannerDismiss");
    const dontShowCheckbox = document.getElementById("tourBannerDontShow");
    if (dismissBtn) {
      dismissBtn.onclick = () => {
        banner.remove();
        // Only permanently suppress the banner if the checkbox is checked
        if (dontShowCheckbox && dontShowCheckbox.checked) {
          try { localStorage.setItem("fffcTourBannerSeen", "1"); } catch (e) {}
        }
      };
    }
  };

})();