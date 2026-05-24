/* =========================================================
   FONTANA FIRE FC ATTENDANCE APP
   Frontend JavaScript
   ========================================================= */

const API_BASE = "https://attendance-api-xb3v.onrender.com/api";

/* =========================
   HTML ELEMENT REFERENCES
   ========================= */
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");

const loginMessage = document.getElementById("loginMessage");
const loginLoading = document.getElementById("loginLoading");
const loginBtnText = document.getElementById("loginBtnText");
const welcomeText = document.getElementById("welcomeText");
const roleText = document.getElementById("roleText");

const groupSelect = document.getElementById("groupSelect");
const eventSelect = document.getElementById("eventSelect");

const dashboardTab = document.getElementById("dashboardTab");
const practiceTab = document.getElementById("practiceTab");
const gamesTab = document.getElementById("gamesTab");
const teamEventsTab = document.getElementById("teamEventsTab");
const playerManagementTab = document.getElementById("playerManagementTab");
const dashboardSection = document.getElementById("dashboardSection");
const refreshDashboardBtn = document.getElementById("refreshDashboardBtn");
const dashboardMonthFilter = document.getElementById("dashboardMonthFilter");
const dashboardLastUpdated = document.getElementById("dashboardLastUpdated");
const dashboardMessage = document.getElementById("dashboardMessage");
const dashboardSummaryCards = document.getElementById("dashboardSummaryCards");
const dashboardMonthlySummary = document.getElementById("dashboardMonthlySummary");
const dashboardBirthdays = document.getElementById("dashboardBirthdays");
const dashboardPracticeSummary = document.getElementById("dashboardPracticeSummary");
const dashboardGameSummary = document.getElementById("dashboardGameSummary");
const dashboardEventSummary = document.getElementById("dashboardEventSummary");
const dashboardGroupSummary = document.getElementById("dashboardGroupSummary");
const dashboardPlayerAlerts = document.getElementById("dashboardPlayerAlerts");
const dashboardPlayerAlertsCount = document.getElementById("dashboardPlayerAlertsCount");
const dashboardPerfectPlayers = document.getElementById("dashboardPerfectPlayers");
const dashboardPerfectPlayersCount = document.getElementById("dashboardPerfectPlayersCount");
const dashboardExceptionalPlayers = document.getElementById("dashboardExceptionalPlayers");
const dashboardExceptionalPlayersCount = document.getElementById("dashboardExceptionalPlayersCount");

const saveAttendanceBtn = document.getElementById("saveAttendanceBtn");
const eventActionButtons = document.getElementById("eventActionButtons");
const cancelEventBtn = document.getElementById("cancelEventBtn");
const restoreEventBtn = document.getElementById("restoreEventBtn");
const deleteEventBtn = document.getElementById("deleteEventBtn");
const attendanceMessage = document.getElementById("attendanceMessage");

const eventDetailsSection = document.getElementById("eventDetailsSection");
const eventDetailDate = document.getElementById("eventDetailDate");
const eventDetailType = document.getElementById("eventDetailType");
const eventDetailTeams = document.getElementById("eventDetailTeams");
const eventDetailStatus = document.getElementById("eventDetailStatus");
const eventDetailStartTime = document.getElementById("eventDetailStartTime");
const eventDetailEndTime = document.getElementById("eventDetailEndTime");
const eventDetailLocation = document.getElementById("eventDetailLocation");
const eventDetailNotes = document.getElementById("eventDetailNotes");

const addPlayerBtn = document.getElementById("addPlayerBtn");
const addPlayerMessage = document.getElementById("addPlayerMessage");
const addPlayerSection = document.getElementById("addPlayerSection");
const playerManagementSection = document.getElementById("playerManagementSection");
const playerSearchInput = document.getElementById("playerSearchInput");
const showInactivePlayersToggle = document.getElementById("showInactivePlayersToggle");
const refreshPlayersBtn = document.getElementById("refreshPlayersBtn");
const playerManagementSummary = document.getElementById("playerManagementSummary");
const playerManagementList = document.getElementById("playerManagementList");

const teamEventSection = document.getElementById("teamEventSection");
const teamEventWorkflowBar = document.getElementById("teamEventWorkflowBar");
const showTeamEventFormBtn = document.getElementById("showTeamEventFormBtn");
const addTeamEventBtn = document.getElementById("addTeamEventBtn");
const teamEventMessage = document.getElementById("teamEventMessage");

/* =========================
   GAME MANAGEMENT REFERENCES
   Batch 4B Frontend
   ========================= */
let gameSection = null;
let gameWorkflowBar = null;
let showGameFormBtn = null;
let addGameBtn = null;
let gameMessage = null;

let newGameName = null;
let newGameDate = null;
let newGameStartTime = null;
let newGameLocationType = null;
let newGameCustomLocation = null;

let gamePlayerSelectorPanel = null;
let gamePlayerSearch = null;
let gameGenderFilterSelect = null;
let gameRefreshPlayersBtn = null;
let gameSelectAllPlayersBtn = null;
let gameClearPlayersBtn = null;
let gamePlayerSummary = null;
let gamePlayerList = null;


const teamEventAllGroups = document.getElementById("teamEventAllGroups");
const teamEventGroupCheckboxes = document.getElementById("teamEventGroupCheckboxes");

const newTeamEventName = document.getElementById("newTeamEventName");
const newTeamEventDate = document.getElementById("newTeamEventDate");
const newTeamEventStartTime = document.getElementById("newTeamEventStartTime");
const newTeamEventEndTime = document.getElementById("newTeamEventEndTime");
const newTeamEventLocation = document.getElementById("newTeamEventLocation");
const newTeamEventNotes = document.getElementById("newTeamEventNotes");

const eventRosterSection = document.getElementById("eventRosterSection");
const eventRosterHelp = document.getElementById("eventRosterHelp");
const eventRosterSummary = document.getElementById("eventRosterSummary");
const eventRosterList = document.getElementById("eventRosterList");
const saveRosterBtn = document.getElementById("saveRosterBtn");
const continueToAttendanceBtn = document.getElementById("continueToAttendanceBtn");
const selectAllRosterBtn = document.getElementById("selectAllRosterBtn");
const clearRosterBtn = document.getElementById("clearRosterBtn");
const eventRosterMessage = document.getElementById("eventRosterMessage");

const attendanceSection = document.getElementById("attendanceSection");
const editRosterBtn = document.getElementById("editRosterBtn");
const attendanceSummary = document.getElementById("attendanceSummary");
let refreshCurrentPlayersBtn = null;
const hideMarkedToggle = document.getElementById("hideMarkedToggle");
const showCompletedBtn = document.getElementById("showCompletedBtn");
const completedPlayerList = document.getElementById("completedPlayerList");

const webVersionText = document.getElementById("webVersionText");
const apiVersionText = document.getElementById("apiVersionText");

/* =========================
   APP STATE
   ========================= */
let currentUser = null;
let currentTab = "Dashboard";
let isTeamEventFormOpen = false;
let isAttendanceModeActive = true;
let playerSearchTimer = null;
let attendanceSearchTimer = null;
let attendanceSearchText = "";
let attendanceStatusFilter = "";
let attendanceBirthYearFilter = "";
let attendanceGenderFilter = "";
let teamEventPlayerSearchTimer = null;
let latestTeamEventPlayers = [];
let teamEventGenderFilter = "";

/* =========================
   GAME MANAGEMENT STATE
   Batch 4B Frontend
   ========================= */
let isGameFormOpen = false;
let gamePlayerSearchTimer = null;
let latestGamePlayers = [];
let gameGenderFilter = "";
let selectedGamePlayerIds = new Set();

/* =========================
   EDIT ROSTER FILTER STATE
   Used by Game / Team Event Edit Roster screen.
   Filters hide/show players only; checked players stay selected
   even when hidden by a filter.
   ========================= */
let latestRosterPlayers = [];
let selectedRosterPlayerIds = new Set();
let rosterPlayerSearchTimer = null;
let rosterPlayerSearchText = "";
let rosterBirthYearFilter = "";
let rosterGenderFilter = "";
let rosterSelectionFilter = "";

/* =========================
 GROUP UI SIMPLIFICATION
 Purpose:
 - Hide the Group dropdown in the main workflow.
 - Use All-Groups attendance behavior by default.
 - Keep birth-year filtering inside the Attendance filter panel instead.
========================= */
function getSelectedGroupIdValue() {
  // Group dropdown is hidden/disabled; treat as All Groups.
  return "";
}

function hideGroupDropdown() {
  if (!groupSelect) return;
  const row = groupSelect.closest(".form-row");
  if (row) row.classList.add("hidden");
  groupSelect.value = "";
  groupSelect.disabled = true;
}


/* =========================
   MESSAGE HELPER
   ========================= */
function setMessage(el, text, isError = false) {
  if (!el) return;

  el.textContent = text;
  el.style.color = isError ? "#c62828" : "#2e7d32";
}

/* =========================
   AUTO LOGOUT ON SESSION EXPIRED
   Purpose:
   - If any protected API call returns 401 / not logged in,
     return the user to the login screen automatically.
   - Login failures are ignored so invalid passwords still show
     the normal login error message.
   ========================= */
let authExpiredHandled = false;

function isLoginRequest(input) {
  const url = typeof input === "string"
    ? input
    : input && input.url
      ? input.url
      : "";

  return String(url).includes("/auth/login");
}

function handleAuthExpired(message = "Session expired. Please log in again.") {
  if (authExpiredHandled) return;

  authExpiredHandled = true;
  currentUser = null;

  localStorage.removeItem("attendanceUser");
  clearSelectedEvent();

  if (appScreen) {
    appScreen.classList.add("hidden");
  }

  if (loginScreen) {
    loginScreen.classList.remove("hidden");
  }

  if (welcomeText) {
    welcomeText.textContent = "Welcome";
  }

  if (roleText) {
    roleText.textContent = "";
  }

  setLoginLoading(false);
  setMessage(loginMessage, message, true);
}

(function installAuthExpiredInterceptor() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function attendanceAppFetch(input, init) {
    const response = await originalFetch(input, init);

    if (response && response.status === 401 && !isLoginRequest(input)) {
      handleAuthExpired();
    }

    return response;
  };
})();

/* =========================
   LOGIN LOADING STATE
   ========================= */
function setLoginLoading(isLoading) {
  if (loginBtn) {
    loginBtn.disabled = isLoading;
  }

  if (loginBtnText) {
    loginBtnText.textContent = isLoading ? "Logging in..." : "Login";
  }

  if (loginLoading) {
    loginLoading.classList.toggle("hidden", !isLoading);
  }
}

/* =========================
   ROLE PERMISSIONS
   ========================= */
function applyRolePermissions() {
  if (!currentUser) return;

  if (currentUser.RoleName === "MainCoach") {
    if (addPlayerSection) {
      addPlayerSection.style.display = "none";
    }
  } else {
    if (addPlayerSection) {
      addPlayerSection.style.display = "block";
    }
  }

  updateTeamEventSection();
}

/* =========================
   LOGIN
   ========================= */
async function login() {
  if (loginMessage) {
    loginMessage.textContent = "";
  }

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const email = emailInput ? emailInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value.trim() : "";

  if (!email || !password) {
    setMessage(loginMessage, "Enter email and password.", true);
    return;
  }

  setLoginLoading(true);
  setMessage(loginMessage, "Connecting to server...", false);

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(loginMessage, data.message || "Login failed.", true);
      return;
    }

    currentUser = data.user;
    localStorage.setItem("attendanceUser", JSON.stringify(currentUser));

    await showApp();

  } catch (err) {
    console.error("Login error:", err);
    setMessage(loginMessage, "Could not connect to server.", true);
  } finally {
    setLoginLoading(false);
  }
}

/* =========================
   LOGOUT
   ========================= */
async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
  } catch (err) {
    console.error("Logout error:", err);
  }

  currentUser = null;
  localStorage.removeItem("attendanceUser");
  clearSelectedEvent();

  if (appScreen) {
    appScreen.classList.add("hidden");
  }

  if (loginScreen) {
    loginScreen.classList.remove("hidden");
  }

  if (welcomeText) {
    welcomeText.textContent = "Welcome";
  }

  if (roleText) {
    roleText.textContent = "";
  }
}

/* =========================
   SHOW MAIN APP
   ========================= */
async function showApp() {
  if (!currentUser) return;

  if (welcomeText) {
    welcomeText.textContent = `Welcome, ${currentUser.FullName}`;
  }

  if (roleText) {
    roleText.textContent = `${currentUser.RoleName}`;
  }

  if (loginScreen) {
    loginScreen.classList.add("hidden");
  }

  if (appScreen) {
    appScreen.classList.remove("hidden");
  }
  hideGroupDropdown();


applyRolePermissions();
ensureGameManagementElements();
setActiveTab();
resetWorkflowForSelectedEvent();
updateTeamEventSection();
updateGameSection();
updateAttendanceSectionVisibility();

  await loadGroups();

  if (currentTab === "Dashboard") {
    if (typeof loadDashboard === "function") {
      await loadDashboard();
    }
    return;
  }

  await loadEvents();
  await updateEventRosterSection();
  await loadPlayers();
}

/* =========================
   LOAD GROUPS
   ========================= */
async function loadGroups() {
  if (!groupSelect) return;

  groupSelect.innerHTML = `<option value="">All Groups</option>`;

  if (teamEventGroupCheckboxes) {
    teamEventGroupCheckboxes.innerHTML = "";
  }

  if (teamEventAllGroups) {
    teamEventAllGroups.checked = false;
  }

  try {
    const res = await fetch(`${API_BASE}/groups`, {
      credentials: "include"
    });

    const groups = await res.json();

    /*
      Defensive cleanup:
      - Keeps only one checkbox/dropdown option per GroupID.
      - Prevents duplicate age groups from appearing even if
        the route ever returns repeated rows.
    */
    const uniqueGroups = Array.from(
      new Map(
        groups.map(group => [String(group.GroupID), group])
      ).values()
    );

    uniqueGroups.forEach(group => {
      const option = document.createElement("option");
      option.value = group.GroupID;
      option.textContent = group.GroupName;
      groupSelect.appendChild(option);

      if (teamEventGroupCheckboxes) {
        const label = document.createElement("label");
        label.className = "team-event-group-option";

        label.innerHTML = `
          <input
            type="checkbox"
            class="team-event-group-checkbox"
            value="${group.GroupID}"
          />
          ${group.GroupName}
        `;

        teamEventGroupCheckboxes.appendChild(label);
      }
    });

  } catch (err) {
    console.error("Failed to load groups", err);
  }
}

/* =========================
   ACTIVE TAB STYLE
   ========================= */
function setActiveTab() {
  if (!dashboardTab || !practiceTab || !gamesTab || !teamEventsTab || !playerManagementTab) return;

  dashboardTab.classList.remove("active");
  practiceTab.classList.remove("active");
  gamesTab.classList.remove("active");
  teamEventsTab.classList.remove("active");
  playerManagementTab.classList.remove("active");

  if (currentTab === "Dashboard") {
    dashboardTab.classList.add("active");
  } else if (currentTab === "Practice") {
    practiceTab.classList.add("active");
  } else if (currentTab === "Game") {
    gamesTab.classList.add("active");
  } else if (currentTab === "Team Event") {
    teamEventsTab.classList.add("active");
  } else if (currentTab === "Player Management") {
    playerManagementTab.classList.add("active");
  }

  updateMainModeVisibility();
  updateTeamEventSection();
  updateGameSection();
}

/* =========================
   GAME FORM ELEMENT SETUP
   Batch 4B Frontend

   Purpose:
   - The current HTML does not have a hard-coded Game form yet.
   - We create it from app.js so we do not need to edit index.html first.
   ========================= */
function ensureGameManagementElements() {
  if (gameSection) return;

  const appShell = document.querySelector(".app-shell") || document.body;

  gameWorkflowBar = document.createElement("div");
  gameWorkflowBar.id = "gameWorkflowBar";
  gameWorkflowBar.className = "team-event-workflow-bar hidden";

  gameWorkflowBar.innerHTML = `
    <button type="button" id="showGameFormBtn" class="btn btn-secondary">
      + Add New Game
    </button>
  `;

  gameSection = document.createElement("section");
  gameSection.id = "gameSection";
  gameSection.className = "team-event-section hidden";

  gameSection.innerHTML = `
    <h2>Add New Game</h2>

    <p class="subtext">
      Create one real game, select the expected players, then take attendance on game day.
    </p>

    <div class="form-grid">
      <label>
        Game Name / Opponent
        <input id="newGameName" type="text" placeholder="Example: 2015-2016 Boys vs Strikers" />
      </label>

      <label>
        Game Date
        <input id="newGameDate" type="date" />
      </label>

      <label>
        Game Start Time
        <input id="newGameStartTime" type="time" />
      </label>

      <label>
        Location
        <select id="newGameLocationType">
          <option value="Ralph M. Lewis Sports Complex">Ralph M. Lewis Sports Complex</option>
          <option value="Central Park">Central Park</option>
          <option value="Other">Other</option>
        </select>
      </label>

      <label id="newGameCustomLocationWrapper" class="hidden">
        Other Location
        <input id="newGameCustomLocation" type="text" placeholder="Enter game location" />
      </label>
    </div>

    <div id="gamePlayerSelectorPanel" class="team-event-player-selector-panel">
      <h3>Select Players</h3>

      <p class="subtext team-event-player-help">
        Checked players are expected for this game. Attendance is marked later after the game starts.
      </p>

      <input
        id="gamePlayerSearch"
        type="text"
        placeholder="Search players by name, number, group, or gender"
      />

      <label class="team-event-gender-filter-label">
        Gender Filter
        <select id="gameGenderFilter">
          <option value="">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </label>

      <div class="team-event-player-actions">

        <button type="button" id="gameSelectAllPlayersBtn" class="btn btn-secondary">
          Select All Shown
        </button>

        <button type="button" id="gameClearPlayersBtn" class="btn btn-secondary">
          Clear Players
        </button>
      </div>

      <div id="gamePlayerSummary" class="roster-summary">
        Selected Players: 0
      </div>

      <div id="gamePlayerList" class="team-event-player-list"></div>
    </div>

    <button type="button" id="addGameBtn" class="btn btn-primary">
      Save Game
    </button>

    <p id="gameMessage" class="form-message"></p>
  `;

  if (eventDetailsSection && eventDetailsSection.parentNode) {
    eventDetailsSection.parentNode.insertBefore(gameWorkflowBar, eventDetailsSection);
    eventDetailsSection.parentNode.insertBefore(gameSection, eventDetailsSection);
  } else {
    appShell.appendChild(gameWorkflowBar);
    appShell.appendChild(gameSection);
  }

  showGameFormBtn = document.getElementById("showGameFormBtn");
  addGameBtn = document.getElementById("addGameBtn");
  gameMessage = document.getElementById("gameMessage");

  newGameName = document.getElementById("newGameName");
  newGameDate = document.getElementById("newGameDate");
  newGameStartTime = document.getElementById("newGameStartTime");
  newGameLocationType = document.getElementById("newGameLocationType");
  newGameCustomLocation = document.getElementById("newGameCustomLocation");

  gamePlayerSelectorPanel = document.getElementById("gamePlayerSelectorPanel");
  gamePlayerSearch = document.getElementById("gamePlayerSearch");
  gameGenderFilterSelect = document.getElementById("gameGenderFilter");
  gameRefreshPlayersBtn = document.getElementById("gameRefreshPlayersBtn");
  gameSelectAllPlayersBtn = document.getElementById("gameSelectAllPlayersBtn");
  gameClearPlayersBtn = document.getElementById("gameClearPlayersBtn");
  gamePlayerSummary = document.getElementById("gamePlayerSummary");
  gamePlayerList = document.getElementById("gamePlayerList");
  if (showGameFormBtn && !showGameFormBtn.dataset.listenerAttached) {
  showGameFormBtn.dataset.listenerAttached = "1";

  showGameFormBtn.addEventListener("click", async () => {
    isGameFormOpen = true;
    isAttendanceModeActive = false;

    if (eventSelect) {
      eventSelect.value = "";
    }

    clearSelectedEvent();

    if (gameMessage) gameMessage.textContent = "";
    if (attendanceMessage) attendanceMessage.textContent = "";
    if (eventRosterMessage) eventRosterMessage.textContent = "";

    updateEventActionButtons();
    clearSelectedEventDetails();
    updateGameSection();
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();

    resetGameForm(false);
    await loadGamePlayerSelector();

    if (gameSection) {
      gameSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

if (addGameBtn && !addGameBtn.dataset.listenerAttached) {
  addGameBtn.dataset.listenerAttached = "1";
  addGameBtn.addEventListener("click", addGame);
}

if (newGameLocationType && !newGameLocationType.dataset.listenerAttached) {
  newGameLocationType.dataset.listenerAttached = "1";

  newGameLocationType.addEventListener("change", () => {
    const customWrapper = document.getElementById("newGameCustomLocationWrapper");

    if (customWrapper) {
      customWrapper.classList.toggle(
        "hidden",
        newGameLocationType.value !== "Other"
      );
    }
  });
}

if (gamePlayerSearch && !gamePlayerSearch.dataset.listenerAttached) {
  gamePlayerSearch.dataset.listenerAttached = "1";

  gamePlayerSearch.addEventListener("input", () => {
    clearTimeout(gamePlayerSearchTimer);
    gamePlayerSearchTimer = setTimeout(renderGamePlayerOptions, 150);
  });
}

if (gameGenderFilterSelect && !gameGenderFilterSelect.dataset.listenerAttached) {
  gameGenderFilterSelect.dataset.listenerAttached = "1";

  gameGenderFilterSelect.addEventListener("change", () => {
    gameGenderFilter = gameGenderFilterSelect.value || "";
    renderGamePlayerOptions();
  });
}


if (gameSelectAllPlayersBtn && !gameSelectAllPlayersBtn.dataset.listenerAttached) {
  gameSelectAllPlayersBtn.dataset.listenerAttached = "1";
  gameSelectAllPlayersBtn.addEventListener("click", () => {
    setAllShownGamePlayerCheckboxes(true);
  });
}

if (gameClearPlayersBtn && !gameClearPlayersBtn.dataset.listenerAttached) {
  gameClearPlayersBtn.dataset.listenerAttached = "1";
  gameClearPlayersBtn.addEventListener("click", () => {
    selectedGamePlayerIds = new Set();
    renderGamePlayerOptions();
  });
}
}


/* =========================
   MAIN MODE VISIBILITY
   ========================= */
function updateMainModeVisibility() {
  const isDashboard = currentTab === "Dashboard";
  const isPlayerManagement = currentTab === "Player Management";

  const eventFlowElements = [
    null, // group dropdown hidden
    eventSelect ? eventSelect.closest(".form-row") : null,
    eventDetailsSection,
    gameWorkflowBar,
    gameSection,
    teamEventWorkflowBar,
    eventRosterSection,
    teamEventSection,
    attendanceSection
  ];

  eventFlowElements.forEach(element => {
    if (!element) return;

    if (isDashboard || isPlayerManagement) {
      element.classList.add("hidden");
    } else if (
      element !== eventDetailsSection &&
      element !== gameWorkflowBar &&
      element !== gameSection &&
      element !== teamEventWorkflowBar &&
      element !== eventRosterSection &&
      element !== teamEventSection
    ) {
      element.classList.remove("hidden");
    }
  });

  if (dashboardSection) {
    dashboardSection.classList.toggle("hidden", !isDashboard);
  }

  if (playerManagementSection) {
    playerManagementSection.classList.toggle("hidden", !isPlayerManagement);
  }
}

/* =========================
   SHOW / HIDE TEAM EVENT FORM
   ========================= */
function updateTeamEventSection() {
  if (!teamEventSection) return;

  if (currentTab === "Dashboard" || currentTab === "Player Management") {
    teamEventSection.classList.add("hidden");
    if (teamEventWorkflowBar) teamEventWorkflowBar.classList.add("hidden");
    return;
  }

  const canAddTeamEvents =
    currentUser &&
    currentUser.RoleName !== "MainCoach";

  const hasSelectedTeamEvent =
    currentTab === "Team Event" &&
    eventSelect &&
    eventSelect.value &&
    getSelectedEventType() === "Team Event";

  if (teamEventWorkflowBar) {
    if (hasSelectedTeamEvent && canAddTeamEvents && !isTeamEventFormOpen) {
      teamEventWorkflowBar.classList.remove("hidden");
    } else {
      teamEventWorkflowBar.classList.add("hidden");
    }
  }

  if (currentTab === "Team Event" && canAddTeamEvents && isTeamEventFormOpen) {
    teamEventSection.classList.remove("hidden");
  } else {
    teamEventSection.classList.add("hidden");
  }
}

function updateGameSection() {
  if (!gameSection || !gameWorkflowBar) return;

  const canAddGames =
    currentUser &&
    currentUser.RoleName !== "MainCoach";

  if (currentTab !== "Game" || !canAddGames) {
    gameSection.classList.add("hidden");
    gameWorkflowBar.classList.add("hidden");
    isGameFormOpen = false;
    return;
  }

  if (isGameFormOpen) {
    gameSection.classList.remove("hidden");
    gameWorkflowBar.classList.add("hidden");
  } else {
    gameSection.classList.add("hidden");
    gameWorkflowBar.classList.remove("hidden");
  }
}


function resetWorkflowForSelectedEvent() {
  const hasSelectedEvent = Boolean(eventSelect && eventSelect.value);

  if (currentTab === "Team Event") {
    isTeamEventFormOpen = !hasSelectedEvent;
  } else {
    isTeamEventFormOpen = false;
  }

  /* =========================
   SHOW / HIDE GAME FORM
   Batch 4B Frontend
   ========================= */
  
  /*
    Batch 4 fix:
    Selected events should open in attendance mode by default.

    Before:
    - Games and Team Events opened in roster-edit mode automatically.
    - Games in All Groups mode then showed:
      "Select a specific group above before managing a Game roster."

    After:
    - Practice opens attendance.
    - Games open attendance.
    - Existing Team Events open attendance.
    - Staff can still click Edit Roster when they need to manage rosters.
    - New Team Event creation still opens the Team Event form when no event is selected.
  */
  isAttendanceModeActive = true;
}

function updateAttendanceSectionVisibility() {
  if (!attendanceSection) return;

  if (currentTab === "Dashboard" || currentTab === "Player Management") {
    attendanceSection.classList.add("hidden");
    if (editRosterBtn) editRosterBtn.classList.add("hidden");
    return;
  }

  if (currentTab === "Team Event" && isTeamEventFormOpen && (!eventSelect || !eventSelect.value)) {
    attendanceSection.classList.add("hidden");
    if (editRosterBtn) editRosterBtn.classList.add("hidden");
    return;
  }

  const eventType = getSelectedEventType();
  const hasSelectedRosterEvent =
    eventSelect &&
    eventSelect.value &&
    (eventType === "Game" || eventType === "Team Event");

  if (hasSelectedRosterEvent && !isAttendanceModeActive) {
    attendanceSection.classList.add("hidden");
  } else {
    attendanceSection.classList.remove("hidden");
  }

  if (editRosterBtn) {
    if (hasSelectedRosterEvent && isAttendanceModeActive) {
      editRosterBtn.classList.remove("hidden");
    } else {
      editRosterBtn.classList.add("hidden");
    }
  }
}

/* =========================
   TEAM EVENT GROUP HELPERS
   ========================= */
function getSelectedTeamEventGroupIds() {
  const checkedBoxes = document.querySelectorAll(
    ".team-event-group-checkbox:checked"
  );

  return Array.from(checkedBoxes)
    .map(checkbox => Number(checkbox.value))
    .filter(value => Number.isInteger(value) && value > 0);
}

function updateAllGroupsCheckboxState() {
  if (!teamEventAllGroups) return;

  const groupCheckboxes = Array.from(
    document.querySelectorAll(".team-event-group-checkbox")
  );

  if (groupCheckboxes.length === 0) {
    teamEventAllGroups.checked = false;
    return;
  }

  teamEventAllGroups.checked = groupCheckboxes.every(
    checkbox => checkbox.checked
  );
}

function clearTeamEventGroupSelections() {
  if (teamEventAllGroups) {
    teamEventAllGroups.checked = false;
  }

  const groupCheckboxes = document.querySelectorAll(".team-event-group-checkbox");

  groupCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
}

/* =========================
   EVENT ROSTER HELPERS
   ========================= */
function getSelectedEventOption() {
  if (!eventSelect || !eventSelect.value) return null;
  return eventSelect.options[eventSelect.selectedIndex] || null;
}

function getSelectedEventType() {
  const selectedOption = getSelectedEventOption();
  return selectedOption ? selectedOption.dataset.eventType || "" : "";
}

function shouldShowRosterSection() {
  const eventType = getSelectedEventType();
  return Boolean(eventSelect && eventSelect.value && (eventType === "Game" || eventType === "Team Event"));
}

function clearEventRosterSection() {
  if (eventRosterList) {
    eventRosterList.innerHTML = "";
  }

  if (eventRosterMessage) {
    eventRosterMessage.textContent = "";
  }

  if (eventRosterSummary) {
    eventRosterSummary.textContent = "Selected Players: 0";
  }

  if (continueToAttendanceBtn) {
    continueToAttendanceBtn.classList.add("hidden");
  }
}

function normalizeRosterSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/#/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rosterPlayerIsExpected(player) {
  return player &&
    (
      player.IsExpected === true ||
      player.IsExpected === 1 ||
      player.IsExpected === "1" ||
      player.IsExpected === "true"
    );
}

function resetRosterFilters() {
  rosterPlayerSearchText = "";
  rosterBirthYearFilter = "";
  rosterGenderFilter = "";
  rosterSelectionFilter = "";

  const searchInput = document.getElementById("eventRosterSearchInput");
  const birthYearSelect = document.getElementById("eventRosterBirthYearFilter");
  const genderSelect = document.getElementById("eventRosterGenderFilter");
  const selectionSelect = document.getElementById("eventRosterSelectionFilter");

  if (searchInput) searchInput.value = "";
  if (birthYearSelect) birthYearSelect.value = "";
  if (genderSelect) genderSelect.value = "";
  if (selectionSelect) selectionSelect.value = "";
}

function ensureEventRosterFilterControls() {
  if (!eventRosterSection || !eventRosterList) return;

  let filterPanel = document.getElementById("eventRosterFilterPanel");

  if (!filterPanel) {
    filterPanel = document.createElement("div");
    filterPanel.id = "eventRosterFilterPanel";
    filterPanel.className = "event-roster-filter-panel";

    filterPanel.innerHTML = `
      <div class="event-roster-filter-grid">
        <label class="event-roster-search-label">
          Search Players
          <input
            id="eventRosterSearchInput"
            type="text"
            placeholder="Search by name, number, birth year, group, or gender"
          />
        </label>

        <label>
          Birth Year
          <select id="eventRosterBirthYearFilter">
            <option value="">All Birth Years</option>
            <option value="2012">2012</option>
            <option value="2013">2013</option>
            <option value="2014">2014</option>
            <option value="2015">2015</option>
            <option value="2016">2016</option>
            <option value="2017">2017</option>
            <option value="2018">2018</option>
            <option value="2019">2019</option>
            <option value="2020">2020</option>
            <option value="2021">2021</option>
          </select>
        </label>

        <label>
          Gender
          <select id="eventRosterGenderFilter">
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>

        <label>
          Roster View
          <select id="eventRosterSelectionFilter">
            <option value="">All Players</option>
            <option value="selected">Selected Only</option>
            <option value="notSelected">Not Selected</option>
          </select>
        </label>
      </div>
    `;

    eventRosterList.parentNode.insertBefore(filterPanel, eventRosterList);
  }

  const searchInput = document.getElementById("eventRosterSearchInput");
  const birthYearSelect = document.getElementById("eventRosterBirthYearFilter");
  const genderSelect = document.getElementById("eventRosterGenderFilter");
  const selectionSelect = document.getElementById("eventRosterSelectionFilter");

  if (searchInput && !searchInput.dataset.listenerAttached) {
    searchInput.dataset.listenerAttached = "1";
    searchInput.addEventListener("input", () => {
      clearTimeout(rosterPlayerSearchTimer);
      rosterPlayerSearchTimer = setTimeout(() => {
        captureRosterSelectionsFromDom();
        rosterPlayerSearchText = normalizeRosterSearchText(searchInput.value);
        renderRosterPlayers(latestRosterPlayers);
      }, 150);
    });
  }

  if (birthYearSelect && !birthYearSelect.dataset.listenerAttached) {
    birthYearSelect.dataset.listenerAttached = "1";
    birthYearSelect.addEventListener("change", () => {
      captureRosterSelectionsFromDom();
      rosterBirthYearFilter = birthYearSelect.value || "";
      renderRosterPlayers(latestRosterPlayers);
    });
  }

  if (genderSelect && !genderSelect.dataset.listenerAttached) {
    genderSelect.dataset.listenerAttached = "1";
    genderSelect.addEventListener("change", () => {
      captureRosterSelectionsFromDom();
      rosterGenderFilter = genderSelect.value || "";
      renderRosterPlayers(latestRosterPlayers);
    });
  }

  if (selectionSelect && !selectionSelect.dataset.listenerAttached) {
    selectionSelect.dataset.listenerAttached = "1";
    selectionSelect.addEventListener("change", () => {
      captureRosterSelectionsFromDom();
      rosterSelectionFilter = selectionSelect.value || "";
      renderRosterPlayers(latestRosterPlayers);
    });
  }
}

function captureRosterSelectionsFromDom() {
  document.querySelectorAll(".roster-player-checkbox").forEach(checkbox => {
    const playerId = Number(checkbox.value);

    if (!playerId) return;

    if (checkbox.checked) {
      selectedRosterPlayerIds.add(playerId);
    } else {
      selectedRosterPlayerIds.delete(playerId);
    }
  });
}

function getRosterPlayerSearchText(player) {
  const playerNumber =
    player.PlayerNumber === 0 || player.PlayerNumber
      ? `#${player.PlayerNumber}`
      : "";

  const groupLabel = player.GroupName || player.GroupCode || "";
  const birthYear = player.BirthYear || player.GroupCode || groupLabel || "";
  const gender = player.Gender || "";

  return normalizeRosterSearchText([
    player.FirstName || "",
    player.LastName || "",
    player.FullName || "",
    playerNumber,
    player.PlayerNumber || "",
    birthYear,
    groupLabel,
    gender,
    typeof formatGenderShort === "function" ? formatGenderShort(gender) : ""
  ].join(" "));
}

function getFilteredRosterPlayers(players) {
  return players.filter(player => {
    const playerId = Number(player.PlayerID);
    const birthYear = String(player.BirthYear || player.GroupCode || player.GroupName || "");
    const gender = String(player.Gender || "");
    const isSelected = selectedRosterPlayerIds.has(playerId);

    const searchMatches =
      !rosterPlayerSearchText ||
      getRosterPlayerSearchText(player).includes(rosterPlayerSearchText);

    const birthYearMatches =
      !rosterBirthYearFilter ||
      birthYear === rosterBirthYearFilter;

    const genderMatches =
      !rosterGenderFilter ||
      gender === rosterGenderFilter;

    const selectionMatches =
      !rosterSelectionFilter ||
      (rosterSelectionFilter === "selected" && isSelected) ||
      (rosterSelectionFilter === "notSelected" && !isSelected);

    return searchMatches && birthYearMatches && genderMatches && selectionMatches;
  });
}

function loadRosterPlayers(players) {
  latestRosterPlayers = Array.isArray(players) ? players : [];
  selectedRosterPlayerIds = new Set(
    latestRosterPlayers
      .filter(rosterPlayerIsExpected)
      .map(player => Number(player.PlayerID))
      .filter(playerId => Number.isInteger(playerId) && playerId > 0)
  );

  ensureEventRosterFilterControls();
  resetRosterFilters();
  renderRosterPlayers(latestRosterPlayers);
}

function updateRosterSummary() {
  if (!eventRosterSummary) return;

  captureRosterSelectionsFromDom();

  const visibleCount = document.querySelectorAll(".roster-player-checkbox").length;
  const selectedVisibleCount = document.querySelectorAll(".roster-player-checkbox:checked").length;
  const selectedCount = selectedRosterPlayerIds.size;
  const totalCount = latestRosterPlayers.length;

  eventRosterSummary.textContent =
    `Selected Players: ${selectedCount} | Showing: ${visibleCount} of ${totalCount} | Selected Shown: ${selectedVisibleCount}`;

  if (continueToAttendanceBtn) {
    if (selectedCount > 0) {
      continueToAttendanceBtn.classList.remove("hidden");
    } else {
      continueToAttendanceBtn.classList.add("hidden");
    }
  }
}

function setAllRosterCheckboxes(isChecked) {
  const checkboxes = document.querySelectorAll(".roster-player-checkbox");

  checkboxes.forEach(checkbox => {
    const playerId = Number(checkbox.value);
    checkbox.checked = isChecked;

    if (!playerId) return;

    if (isChecked) {
      selectedRosterPlayerIds.add(playerId);
    } else {
      selectedRosterPlayerIds.delete(playerId);
    }
  });

  updateRosterSummary();
}

function renderRosterPlayers(players) {
  if (!eventRosterList) return;

  eventRosterList.innerHTML = "";

  const allPlayers = Array.isArray(players) ? players : [];
  const filteredPlayers = getFilteredRosterPlayers(allPlayers);

  if (!allPlayers.length) {
    eventRosterList.innerHTML = `
      <div class="roster-empty-message">
        No active players are available for this roster.
      </div>
    `;
    updateRosterSummary();
    return;
  }

  if (!filteredPlayers.length) {
    eventRosterList.innerHTML = `
      <div class="roster-empty-message">
        No players match the current roster filters.
      </div>
    `;
    updateRosterSummary();
    return;
  }

  filteredPlayers.forEach(player => {
    const label = document.createElement("label");
    label.className = "roster-player-row";

    const playerId = Number(player.PlayerID);
    const groupLabel = player.GroupName || player.GroupCode || "No Group";
    const birthYear = player.BirthYear || player.GroupCode || "";
    const gender = player.Gender || "";
    const playerNumber =
      player.PlayerNumber === 0 || player.PlayerNumber
        ? `#${player.PlayerNumber}`
        : "No #";

    const shortGender =
      typeof formatGenderShort === "function"
        ? formatGenderShort(gender)
        : gender === "Female"
          ? "F"
          : gender === "Male"
            ? "M"
            : "-";

    const rosterMeta = [
      playerNumber,
      birthYear || groupLabel || "No Group",
      shortGender && shortGender !== "-" ? shortGender : null
    ].filter(Boolean).join(" | ");

    label.innerHTML = `
      <input
        type="checkbox"
        class="roster-player-checkbox"
        value="${player.PlayerID}"
        ${selectedRosterPlayerIds.has(playerId) ? "checked" : ""}
      />
      <span class="roster-player-info">
        <span class="roster-player-name">${player.FirstName} ${player.LastName}</span>
        <span class="roster-player-group">${rosterMeta}</span>
      </span>
    `;

    const checkbox = label.querySelector(".roster-player-checkbox");

    if (checkbox) {
      checkbox.addEventListener("change", () => {
        const id = Number(checkbox.value);

        if (checkbox.checked) {
          selectedRosterPlayerIds.add(id);
        } else {
          selectedRosterPlayerIds.delete(id);
        }

        updateRosterSummary();
      });
    }

    eventRosterList.appendChild(label);
  });

  updateRosterSummary();
}

async function updateEventRosterSection() {
  if (!eventRosterSection) return;

  if (currentTab === "Dashboard" || currentTab === "Player Management") {
    clearEventRosterSection();
    eventRosterSection.classList.add("hidden");
    return;
  }

  clearEventRosterSection();

  if (!shouldShowRosterSection()) {
    eventRosterSection.classList.add("hidden");
    return;
  }

  if (isAttendanceModeActive) {
    eventRosterSection.classList.add("hidden");
    return;
  }

  const eventType = getSelectedEventType();
  const selectedGroupId = getSelectedGroupIdValue();
  const selectedEventId = eventSelect ? eventSelect.value : "";

  eventRosterSection.classList.remove("hidden");


  if (saveRosterBtn) saveRosterBtn.classList.remove("hidden");
  if (selectAllRosterBtn) selectAllRosterBtn.classList.remove("hidden");
  if (clearRosterBtn) clearRosterBtn.classList.remove("hidden");

  if (eventRosterHelp) {
    eventRosterHelp.textContent =
      eventType === "Game"
        ? "Choose the exact players expected for this Game. Players from any age group may be selected."
        : selectedGroupId
          ? "Choose the exact players expected for this Team Event group."
          : "Choose the exact players expected for this multi-group Team Event.";
  }

  // Games use ?edit=1 so the backend returns ALL active players with
  // IsExpected checked/unchecked, not just the rostered subset.
  const rosterParam =
    eventType === "Game"
      ? "?edit=1"
      : !selectedGroupId && eventType === "Team Event"
        ? "?allMatching=1&edit=1"
        : "";

  try {
    const res = await fetch(`${API_BASE}/events/${selectedEventId}/roster${rosterParam}`, {
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(
        eventRosterMessage,
        data.message || "Could not load event roster.",
        true
      );
      return;
    }

    loadRosterPlayers(data.players || []);

  } catch (err) {
    console.error("Load roster error:", err);
    setMessage(eventRosterMessage, "Could not load event roster.", true);
  }
}

async function saveEventRoster() {
  if (!eventSelect || !eventSelect.value) {
    setMessage(eventRosterMessage, "Select an event first.", true);
    return;
  }

  const eventType = getSelectedEventType();
  const selectedGroupId = getSelectedGroupIdValue();

  captureRosterSelectionsFromDom();

  const selectedPlayerIds = Array.from(selectedRosterPlayerIds)
    .map(playerId => Number(playerId))
    .filter(playerId => Number.isInteger(playerId) && playerId > 0);

  const allMatchingParam = !selectedGroupId && eventType === "Team Event"
    ? "?allMatching=1"
    : "";

  try {
    setMessage(eventRosterMessage, "Saving roster...", false);

    const res = await fetch(`${API_BASE}/events/${eventSelect.value}/roster${allMatchingParam}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        playerIds: selectedPlayerIds
      })
    });

    let data = {};

    try {
      data = await res.json();
    } catch (jsonErr) {
      console.error("Save roster JSON parse error:", jsonErr);

      setMessage(
        eventRosterMessage,
        `Could not read server response. HTTP ${res.status}`,
        true
      );

      return;
    }

    if (!res.ok || !data.success) {
      console.error("Save roster failed:", {
        status: res.status,
        data
      });

      setMessage(
        eventRosterMessage,
        data.error || data.message || `Could not save roster. HTTP ${res.status}`,
        true
      );

      return;
    }

    const savedCount = data.savedCount || 0;
    const deletedCount = data.deletedCount || 0;
    const skippedText = data.skippedCount
      ? ` ${data.skippedCount} player(s) skipped.`
      : "";

    setMessage(
      eventRosterMessage,
      savedCount === 0
        ? `✅ Roster cleared. ${deletedCount} player(s) removed.`
        : `✅ Roster saved. ${savedCount} player(s) expected.${skippedText}`,
      false
    );

    await updateEventRosterSection();
    await loadPlayers();

  } catch (err) {
    console.error("Save roster request error:", err);

    setMessage(
      eventRosterMessage,
      `Could not save roster: ${err.message}`,
      true
    );
  }
}

/* =========================
   DATE HELPER
   ========================= */
function getEventDateParts(eventDateValue) {
  const dateOnly = eventDateValue.split("T")[0];
  const parts = dateOnly.split("-");

  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);

  const localDate = new Date(year, month, day);

  return {
    dateOnly,
    localDate,
    dayOfWeek: localDate.getDay()
  };
}

/* =========================
   LOAD EVENTS
   ========================= */
async function loadEvents() {
  if (!eventSelect) return;

  eventSelect.innerHTML = `<option value="">Select event</option>`;

  try {
    const selectedGroupId = getSelectedGroupIdValue();

    let eventsUrl = `${API_BASE}/events`;

    if (selectedGroupId) {
      eventsUrl += `?groupId=${encodeURIComponent(selectedGroupId)}`;
    }

    console.log("Loading events from:", eventsUrl);

    const res = await fetch(eventsUrl, {
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Events API failed:", res.status, data);
      return;
    }

    const events = Array.isArray(data)
      ? data
      : Array.isArray(data.events)
        ? data.events
        : Array.isArray(data.recordset)
          ? data.recordset
          : [];

    console.log("Events loaded:", events.length, events);

    const filteredEvents = events.filter(event => {
      if (!event.EventDate || !event.EventType) return false;

      const isPractice = event.EventType === "Practice";
      const isGame = event.EventType === "Game";
      const isTeamEvent = event.EventType === "Team Event";

      if (currentTab === "Practice") return isPractice;
      if (currentTab === "Game") return isGame;
      if (currentTab === "Team Event") return isTeamEvent;

      return true;
    });

    console.log(
      "Filtered events for tab:",
      currentTab,
      filteredEvents.length,
      filteredEvents
    );

    filteredEvents.forEach(event => addEventOption(event));

    updateEventActionButtons();

  } catch (err) {
    console.error("Failed to load events", err);
  }
}
/* =========================
   ADD EVENT TO DROPDOWN
   ========================= */
function addEventOption(event) {
  if (!eventSelect) return;

  const option = document.createElement("option");
  option.value = event.EventID;

  const dateInfo = getEventDateParts(event.EventDate);
  const eventDate = dateInfo.localDate.toLocaleDateString();

  const eventName =
    event.EventName && event.EventName !== event.EventType
      ? ` - ${event.EventName}`
      : "";

  const statusLabel =
    event.EventStatus === "Cancelled"
      ? " - CANCELLED"
      : ` - ${event.EventStatus}`;

  const groupCountLabel =
    !event.GroupID && event.GroupCount > 1
      ? ` - ${event.GroupCount} Groups`
      : "";

  option.textContent =
    `${eventDate} - ${event.EventType}${eventName}${groupCountLabel}${statusLabel}`;

  option.dataset.eventStatus = event.EventStatus;
  option.dataset.eventType = event.EventType;
  option.dataset.groupId = event.GroupID || "";
  option.dataset.groupCount = event.GroupCount || 1;

  eventSelect.appendChild(option);
}

/* =========================
   SELECTED EVENT DETAILS
   ========================= */
function clearSelectedEventDetails() {
  if (eventDetailsSection) {
    eventDetailsSection.classList.add("hidden");
  }

  const detailFields = [
    eventDetailDate,
    eventDetailType,
    eventDetailTeams,
    eventDetailStatus,
    eventDetailStartTime,
    eventDetailEndTime,
    eventDetailLocation,
    eventDetailNotes
  ];

  detailFields.forEach(field => {
    if (field) field.textContent = "-";
  });
}

function formatEventTime(timeValue) {
  if (!timeValue) return "-";

  const raw = String(timeValue).trim();

  /*
    SQL TIME values may arrive from the API as:
    - "18:00:00"
    - "18:00"
    - "1970-01-01T18:00:00.000Z"

    Display them all as regular 12-hour time.
  */
  let timePart = raw;

  if (raw.includes("T")) {
    timePart = raw.split("T")[1] || raw;
  }

  timePart = timePart.replace("Z", "");

  const parts = timePart.split(":");

  if (parts.length < 2) return raw;

  const hour = Number(parts[0]);
  const minute = String(parts[1]).padStart(2, "0").substring(0, 2);

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return raw;

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
}

async function loadSelectedEventDetails() {
  if (!eventSelect || !eventSelect.value) {
    clearSelectedEventDetails();
    return;
  }

  const eventId = eventSelect.value;
  const allMatchingParam = getAllMatchingParam();

  try {
    const res = await fetch(`${API_BASE}/events/${eventId}/details${allMatchingParam}`, {
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok || !data.success || !data.event) {
      clearSelectedEventDetails();
      return;
    }

    const event = data.event;
    const dateInfo = getEventDateParts(event.EventDate);
    const teams = Array.isArray(data.groups) && data.groups.length > 0
      ? data.groups.map(group => group.GroupName || group.GroupCode).join(", ")
      : event.GroupName || event.GroupCode || "-";

    if (eventDetailDate) eventDetailDate.textContent = dateInfo.localDate.toLocaleDateString();
    if (eventDetailType) eventDetailType.textContent = event.EventType || "-";
    if (eventDetailTeams) eventDetailTeams.textContent = teams;
    if (eventDetailStatus) eventDetailStatus.textContent = event.EventStatus || "-";
    if (eventDetailStartTime) eventDetailStartTime.textContent = formatEventTime(event.StartTime);
    if (eventDetailEndTime) eventDetailEndTime.textContent = formatEventTime(event.EndTime);
    if (eventDetailLocation) eventDetailLocation.textContent = event.LocationName || "-";
    if (eventDetailNotes) eventDetailNotes.textContent = event.Notes || "-";

    if (eventDetailsSection) {
      eventDetailsSection.classList.remove("hidden");
    }

  } catch (err) {
    console.error("Could not load selected event details:", err);
    clearSelectedEventDetails();
  }
}

/* =========================
   UPDATE EVENT ACTION BUTTONS

   Purpose:
   - Scheduled events show Cancel Event.
   - Cancelled events show Restore Event.
   - Delete Event is available to Admin / Team Mom for
     accidental events or duplicates.
   - No selected event hides all event action buttons.
   ========================= */
function updateEventActionButtons() {
  if (!eventSelect) return;

  const selectedOption = eventSelect.options[eventSelect.selectedIndex];
  const eventStatus = selectedOption ? selectedOption.dataset.eventStatus : "";
  const canDeleteEvents =
    currentUser &&
    currentUser.RoleName !== "MainCoach";

  if (eventActionButtons) {
    eventActionButtons.classList.add("hidden");
  }

  if (cancelEventBtn) {
    cancelEventBtn.classList.add("hidden");
  }

  if (restoreEventBtn) {
    restoreEventBtn.classList.add("hidden");
  }

  if (deleteEventBtn) {
    deleteEventBtn.classList.add("hidden");
  }

  if (!eventSelect.value || !eventStatus) {
    return;
  }

  if (eventActionButtons) {
    eventActionButtons.classList.remove("hidden");
  }

  if (eventStatus === "Cancelled") {
    if (restoreEventBtn) {
      restoreEventBtn.classList.remove("hidden");
    }
  } else {
    if (cancelEventBtn) {
      cancelEventBtn.classList.remove("hidden");
    }
  }

  if (deleteEventBtn && canDeleteEvents) {
    deleteEventBtn.classList.remove("hidden");
  }
}
