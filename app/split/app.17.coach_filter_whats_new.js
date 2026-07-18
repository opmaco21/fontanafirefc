/* =========================================================
   FONTANA FIRE FC ATTENDANCE APP
   COACH FILTER + COACH OVERRIDE + WHAT'S NEW
   Drop-in extension for July 2026 split frontend.

   Load AFTER:
     app.05.player_management.js
     app.06.auth_and_misc.js

   Load BEFORE:
     app.99.bootstrap.js
   ========================================================= */

(function coachFilterFeature() {
  "use strict";

  const COACH_NAMES = ["Jose", "Alfredo", "Bobby", "Damian"];
  const WHATS_NEW_VERSION = "2026-07-coach-filter";
  const WHATS_NEW_STORAGE_KEY = "attendanceWhatsNewVersion";

  let coachOverrideMap = new Map();
  let coachOverrideLoadPromise = null;
  let selectedCoachFilter = "";

  function normalizeGender(value) {
    const gender = String(value || "").trim().toLowerCase();
    if (gender === "male" || gender === "m") return "Male";
    if (gender === "female" || gender === "f") return "Female";
    return "";
  }

  function getDefaultCoach(birthYear, gender) {
    const year = Number(birthYear);
    const normalizedGender = normalizeGender(gender);

    // Jose: 2017-2021, regardless of gender.
    if (year >= 2017 && year <= 2021) {
      return "Jose";
    }

    // Alfredo: boys born 2015-2016.
    if ((year === 2015 || year === 2016) && normalizedGender === "Male") {
      return "Alfredo";
    }

    // Bobby: default assignment for girls born 2014-2016.
    if (year >= 2014 && year <= 2016 && normalizedGender === "Female") {
      return "Bobby";
    }

    // Damian: boys born 2011-2014.
    if (year >= 2011 && year <= 2014 && normalizedGender === "Male") {
      return "Damian";
    }

    // Girls outside Bobby's automatic range are intentionally unassigned
    // unless a Coach Override is set.
    return "";
  }

  function resolvePlayerCoach(player) {
    if (!player) return "";

    const playerId = Number(player.PlayerID);
    const override = coachOverrideMap.get(playerId);

    if (override && COACH_NAMES.includes(override)) {
      return override;
    }

    return getDefaultCoach(
      player.BirthYear || player.GroupCode || "",
      player.Gender || ""
    );
  }

  function resolveRowCoach(row) {
    if (!row) return "";

    const playerId = Number(row.dataset.playerId || 0);
    const override = coachOverrideMap.get(playerId);

    if (override && COACH_NAMES.includes(override)) {
      return override;
    }

    return getDefaultCoach(
      row.dataset.birthYear || "",
      row.dataset.gender || ""
    );
  }

  async function refreshCoachOverrideMap(force = false) {
    if (coachOverrideLoadPromise && !force) {
      return coachOverrideLoadPromise;
    }

    coachOverrideLoadPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/coach-overrides`, {
          credentials: "include"
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Could not load coach overrides.");
        }

        const nextMap = new Map();

        (data.coachOverrides || []).forEach(item => {
          const playerId = Number(item.PlayerID);
          const coach = String(item.CoachOverride || "").trim();

          if (playerId && COACH_NAMES.includes(coach)) {
            nextMap.set(playerId, coach);
          }
        });

        coachOverrideMap = nextMap;
        return coachOverrideMap;
      } catch (err) {
        console.error("Coach override load failed:", err);
        return coachOverrideMap;
      } finally {
        coachOverrideLoadPromise = null;
      }
    })();

    return coachOverrideLoadPromise;
  }

  function ensureCoachFilterControl() {
    const panel = document.getElementById("attendanceFilterPanel");
    if (!panel) return;

    let row = document.getElementById("attendanceCoachFilterRow");

    if (!row) {
      row = document.createElement("div");
      row.id = "attendanceCoachFilterRow";
      row.className = "attendance-filter-row attendance-coach-filter-row";
      row.innerHTML = `
        <label class="attendance-filter-label" for="attendanceCoachFilter">
          Coach
          <select id="attendanceCoachFilter">
            <option value="">All Coaches</option>
            <option value="Jose">Jose</option>
            <option value="Alfredo">Alfredo</option>
            <option value="Bobby">Bobby</option>
            <option value="Damian">Damian</option>
          </select>
        </label>
      `;

      const searchRow = panel.querySelector(".attendance-search-row");
      if (searchRow && searchRow.nextSibling) {
        panel.insertBefore(row, searchRow.nextSibling);
      } else {
        panel.appendChild(row);
      }
    }

    const select = document.getElementById("attendanceCoachFilter");

    if (select && !select.dataset.listenerAttached) {
      select.dataset.listenerAttached = "1";
      select.value = selectedCoachFilter;

      select.addEventListener("change", () => {
        selectedCoachFilter = select.value || "";

        if (typeof updateAttendanceDisplay === "function") {
          updateAttendanceDisplay();
        }
      });
    }
  }

  function applyCoachDatasetToAllRows() {
    document.querySelectorAll(".attendance-player-card[data-player-id]").forEach(row => {
      row.dataset.coach = resolveRowCoach(row);
    });
  }

  function injectCoachOverrideField() {
    const form = document.getElementById("pmSavePlayerBtn");
    if (!form) return;

    if (document.getElementById("pmCoachOverride")) return;

    const genderSelect = document.getElementById("pmGender");
    const anchorLabel = genderSelect ? genderSelect.closest("label") : null;

    const label = document.createElement("label");
    label.innerHTML = `
      Coach Override
      <select id="pmCoachOverride">
        <option value="">Default</option>
        <option value="Jose">Jose</option>
        <option value="Alfredo">Alfredo</option>
        <option value="Bobby">Bobby</option>
        <option value="Damian">Damian</option>
      </select>
      <small style="display:block;margin-top:4px;color:#6b7280;">
        Default uses birth year and gender rules.
      </small>
    `;

    if (anchorLabel && anchorLabel.parentNode) {
      anchorLabel.insertAdjacentElement("afterend", label);
      return;
    }

    const firstGrid = document.querySelector("#addPlayerSection .player-form-grid");
    if (firstGrid) {
      firstGrid.appendChild(label);
    }
  }

  function getCurrentOverrideValue() {
    const select = document.getElementById("pmCoachOverride");
    return select ? select.value || "" : "";
  }

  function setCurrentOverrideValue(value) {
    const select = document.getElementById("pmCoachOverride");
    if (select) {
      select.value = COACH_NAMES.includes(value) ? value : "";
    }
  }

  async function saveCoachOverride(playerId, coachOverride) {
    if (!playerId) return;

    const res = await fetch(`${API_BASE}/coach-overrides/${playerId}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        coachOverride: coachOverride || null
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Could not save Coach Override.");
    }

    if (coachOverride) {
      coachOverrideMap.set(Number(playerId), coachOverride);
    } else {
      coachOverrideMap.delete(Number(playerId));
    }
  }

  function installFetchSaveBridge() {
    if (window.__coachOverrideFetchBridgeInstalled) return;
    window.__coachOverrideFetchBridgeInstalled = true;

    const nativeFetch = window.fetch.bind(window);

    window.fetch = async function coachOverrideAwareFetch(input, init = {}) {
      const url = typeof input === "string"
        ? input
        : input && input.url
          ? input.url
          : "";

      const method = String(init.method || "GET").toUpperCase();
      const isPlayerSave =
        url.startsWith(`${API_BASE}/players`) &&
        (method === "POST" || method === "PUT") &&
        !url.includes("/status");

      let requestedCoachOverride = null;
      let hasCoachOverride = false;

      if (isPlayerSave && init.body) {
        try {
          const parsed = JSON.parse(init.body);
          if (Object.prototype.hasOwnProperty.call(parsed, "coachOverride")) {
            hasCoachOverride = true;
            requestedCoachOverride = parsed.coachOverride || null;
          }
        } catch (_) {
          // Leave normal fetch behavior unchanged for non-JSON bodies.
        }
      }

      const response = await nativeFetch(input, init);

      if (isPlayerSave && hasCoachOverride && response.ok) {
        try {
          const clone = response.clone();
          const data = await clone.json();

          let playerId = 0;

          if (method === "PUT") {
            const match = url.match(/\/players\/(\d+)(?:\?|$)/);
            playerId = match ? Number(match[1]) : 0;
          } else if (data && data.player) {
            playerId = Number(data.player.PlayerID || 0);
          }

          if (playerId) {
            await saveCoachOverride(playerId, requestedCoachOverride);
          }
        } catch (err) {
          console.error("Player saved, but Coach Override save failed:", err);

          // Do not convert a successful player save into a failed response.
          // Surface the issue in Player Management when possible.
          if (typeof setPlayerManagementMessage === "function") {
            setTimeout(() => {
              setPlayerManagementMessage(
                "Player saved, but Coach Override could not be saved. Please edit the player and try again.",
                true
              );
            }, 0);
          }
        }
      }

      return response;
    };
  }

  function installFunctionExtensions() {
    if (typeof ensureAttendanceFilterControls === "function") {
      const originalEnsureAttendanceFilterControls = ensureAttendanceFilterControls;

      ensureAttendanceFilterControls = function extendedEnsureAttendanceFilterControls() {
        const result = originalEnsureAttendanceFilterControls.apply(this, arguments);
        ensureCoachFilterControl();
        return result;
      };
    }

    if (typeof createAttendancePlayerRow === "function") {
      const originalCreateAttendancePlayerRow = createAttendancePlayerRow;

      createAttendancePlayerRow = function extendedCreateAttendancePlayerRow(player) {
        const row = originalCreateAttendancePlayerRow.apply(this, arguments);
        row.dataset.coach = resolvePlayerCoach(player);
        return row;
      };
    }

    if (typeof rowMatchesAttendanceFilters === "function") {
      const originalRowMatchesAttendanceFilters = rowMatchesAttendanceFilters;

      rowMatchesAttendanceFilters = function extendedRowMatchesAttendanceFilters(row) {
        if (!originalRowMatchesAttendanceFilters.apply(this, arguments)) {
          return false;
        }

        const coach = row.dataset.coach || resolveRowCoach(row);
        row.dataset.coach = coach;

        return !selectedCoachFilter || coach === selectedCoachFilter;
      };
    }

    if (typeof loadPlayers === "function") {
      const originalLoadPlayers = loadPlayers;

      loadPlayers = async function extendedLoadPlayers() {
        await refreshCoachOverrideMap();
        const result = await originalLoadPlayers.apply(this, arguments);
        ensureCoachFilterControl();
        applyCoachDatasetToAllRows();

        if (typeof updateAttendanceDisplay === "function") {
          updateAttendanceDisplay();
        }

        return result;
      };
    }

    if (typeof ensurePlayerManagementForm === "function") {
      const originalEnsurePlayerManagementForm = ensurePlayerManagementForm;

      ensurePlayerManagementForm = function extendedEnsurePlayerManagementForm() {
        const result = originalEnsurePlayerManagementForm.apply(this, arguments);
        injectCoachOverrideField();
        return result;
      };
    }

    if (typeof getPlayerFormPayload === "function") {
      const originalGetPlayerFormPayload = getPlayerFormPayload;

      getPlayerFormPayload = function extendedGetPlayerFormPayload() {
        const payload = originalGetPlayerFormPayload.apply(this, arguments);
        payload.coachOverride = getCurrentOverrideValue() || null;
        return payload;
      };
    }

    if (typeof resetPlayerManagementForm === "function") {
      const originalResetPlayerManagementForm = resetPlayerManagementForm;

      resetPlayerManagementForm = function extendedResetPlayerManagementForm() {
        const result = originalResetPlayerManagementForm.apply(this, arguments);
        injectCoachOverrideField();
        setCurrentOverrideValue("");
        return result;
      };
    }

    if (typeof editPlayer === "function") {
      const originalEditPlayer = editPlayer;

      editPlayer = function extendedEditPlayer(playerId) {
        const result = originalEditPlayer.apply(this, arguments);
        injectCoachOverrideField();
        setCurrentOverrideValue(coachOverrideMap.get(Number(playerId)) || "");
        return result;
      };
    }

    if (typeof showPlayerDetails === "function") {
      const originalShowPlayerDetails = showPlayerDetails;

      showPlayerDetails = function extendedShowPlayerDetails(playerId) {
        const result = originalShowPlayerDetails.apply(this, arguments);
        const panel = document.getElementById("playerDetailsPanel");

        if (panel && !panel.querySelector(".coach-assignment-detail")) {
          const player = Array.isArray(latestManagedPlayers)
            ? latestManagedPlayers.find(item => Number(item.PlayerID) === Number(playerId))
            : null;

          const override = coachOverrideMap.get(Number(playerId)) || "";
          const resolved = override || resolvePlayerCoach(player);
          const section = panel.querySelector(".player-details-section");

          if (section) {
            const line = document.createElement("div");
            line.className = "player-detail-line coach-assignment-detail";
            line.innerHTML = `
              <span class="player-detail-label">Coach:</span>
              <strong class="player-detail-value">${
                resolved
                  ? `${escapeHtml(resolved)}${override ? " (Override)" : " (Default)"}`
                  : "Unassigned"
              }</strong>
            `;
            section.appendChild(line);
          }
        }

        return result;
      };
    }

    if (typeof showApp === "function") {
      const originalShowApp = showApp;

      showApp = async function extendedShowApp() {
        await refreshCoachOverrideMap();
        const result = await originalShowApp.apply(this, arguments);
        setTimeout(showWhatsNewPopupOnce, 50);
        return result;
      };
    }
  }

  function installSummaryCountExtension() {
    if (typeof updateAttendanceDisplay !== "function") return;

    const originalUpdateAttendanceDisplay = updateAttendanceDisplay;

    updateAttendanceDisplay = function extendedUpdateAttendanceDisplay() {
      applyCoachDatasetToAllRows();
      const result = originalUpdateAttendanceDisplay.apply(this, arguments);

      const showCompletedBtn = document.getElementById("showCompletedBtn");

      if (showCompletedBtn && selectedCoachFilter) {
        const suffix = ` | Coach: ${selectedCoachFilter}`;
        if (!showCompletedBtn.textContent.includes(suffix)) {
          showCompletedBtn.textContent += suffix;
        }
      }

      return result;
    };
  }

  function showWhatsNewPopupOnce() {
    if (!document.body) return;

    if (localStorage.getItem(WHATS_NEW_STORAGE_KEY) === WHATS_NEW_VERSION) {
      return;
    }

    if (document.getElementById("attendanceWhatsNewOverlay")) {
      return;
    }

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
          <li>New Coach filter added to Attendance</li>
          <li>Quickly view players by Jose, Alfredo, Bobby, or Damian</li>
          <li>Select All Coaches anytime to take full attendance</li>
        </ul>
        <button id="attendanceWhatsNewGotIt" type="button" class="btn btn-primary" style="width:100%;">
          Got it
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    const button = document.getElementById("attendanceWhatsNewGotIt");

    if (button) {
      button.addEventListener("click", () => {
        localStorage.setItem(WHATS_NEW_STORAGE_KEY, WHATS_NEW_VERSION);
        overlay.remove();
      });
    }
  }

  function initialize() {
    installFetchSaveBridge();
    installFunctionExtensions();
    installSummaryCountExtension();
    ensureCoachFilterControl();
    injectCoachOverrideField();

    // Covers an already-visible session when this script is loaded late.
    if (typeof appScreen !== "undefined" &&
        appScreen &&
        !appScreen.classList.contains("hidden")) {
      refreshCoachOverrideMap().then(() => {
        applyCoachDatasetToAllRows();
        if (typeof updateAttendanceDisplay === "function") {
          updateAttendanceDisplay();
        }
      });
      showWhatsNewPopupOnce();
    }
  }

  initialize();
})();
