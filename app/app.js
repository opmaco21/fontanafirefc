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

const practiceTab = document.getElementById("practiceTab");
const gamesTab = document.getElementById("gamesTab");
const teamEventsTab = document.getElementById("teamEventsTab");
const playerManagementTab = document.getElementById("playerManagementTab");

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
const hideMarkedToggle = document.getElementById("hideMarkedToggle");
const showCompletedBtn = document.getElementById("showCompletedBtn");
const completedPlayerList = document.getElementById("completedPlayerList");

const webVersionText = document.getElementById("webVersionText");
const apiVersionText = document.getElementById("apiVersionText");

/* =========================
   APP STATE
   ========================= */
let currentUser = null;
let currentTab = "Practice";
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
   EVENT LISTENERS
   ========================= */
if (loginBtn) {
  loginBtn.addEventListener("click", login);
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

if (saveAttendanceBtn) {
  saveAttendanceBtn.addEventListener("click", saveAttendance);
}

if (cancelEventBtn) {
  cancelEventBtn.addEventListener("click", cancelSelectedEvent);
}

if (restoreEventBtn) {
  restoreEventBtn.addEventListener("click", restoreSelectedEvent);
}

if (deleteEventBtn) {
  deleteEventBtn.addEventListener("click", deleteSelectedEvent);
}

if (eventSelect) {
  eventSelect.addEventListener("change", async () => {
    saveSelectedEvent();
    resetWorkflowForSelectedEvent();
    updateEventActionButtons();
    await loadSelectedEventDetails();
    updateTeamEventSection();
    if (isTeamEventFormOpen) {
      await loadTeamEventPlayerSelector();
    }
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();
  });
}

if (addPlayerBtn) {
  addPlayerBtn.addEventListener("click", addPlayer);
}

if (addTeamEventBtn) {
  addTeamEventBtn.addEventListener("click", addTeamEvent);
}

if (showTeamEventFormBtn) {
  showTeamEventFormBtn.addEventListener("click", async () => {
    isTeamEventFormOpen = true;
    isAttendanceModeActive = false;

    if (eventSelect) {
      eventSelect.value = "";
    }

    if (attendanceMessage) attendanceMessage.textContent = "";
    if (teamEventMessage) teamEventMessage.textContent = "";
    if (eventRosterMessage) eventRosterMessage.textContent = "";

    saveSelectedEvent();
    updateEventActionButtons();
    clearSelectedEventDetails();
    updateTeamEventSection();
    if (isTeamEventFormOpen) {
      await loadTeamEventPlayerSelector();
    }
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();
  });
}

if (continueToAttendanceBtn) {
  continueToAttendanceBtn.addEventListener("click", async () => {
    isAttendanceModeActive = true;
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();

    if (attendanceSection) {
      attendanceSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

if (editRosterBtn) {
  editRosterBtn.addEventListener("click", async () => {
    isAttendanceModeActive = false;
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();

    if (eventRosterSection) {
      eventRosterSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

if (saveRosterBtn) {
  saveRosterBtn.addEventListener("click", saveEventRoster);
}

if (selectAllRosterBtn) {
  selectAllRosterBtn.addEventListener("click", () => {
    setAllRosterCheckboxes(true);
  });
}

if (clearRosterBtn) {
  clearRosterBtn.addEventListener("click", () => {
    setAllRosterCheckboxes(false);
  });
}

if (eventRosterList) {
  eventRosterList.addEventListener("change", event => {
    if (!event.target.classList.contains("roster-player-checkbox")) return;
    updateRosterSummary();
  });
}

if (groupSelect) {
  groupSelect.addEventListener("change", async () => {
    await loadEvents();
    resetWorkflowForSelectedEvent();
    await loadSelectedEventDetails();
    updateTeamEventSection();
    if (isTeamEventFormOpen) {
      await loadTeamEventPlayerSelector();
    }
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();
    clearPlayerAttendanceSelections();
  });
}

if (practiceTab) {
  practiceTab.addEventListener("click", async () => {
    currentTab = "Practice";
    setActiveTab();
    await loadEvents();
    resetWorkflowForSelectedEvent();
    await loadSelectedEventDetails();
    updateTeamEventSection();
    if (isTeamEventFormOpen) {
      await loadTeamEventPlayerSelector();
    }
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();
    clearPlayerAttendanceSelections();
  });
}

if (gamesTab) {
  gamesTab.addEventListener("click", async () => {
    currentTab = "Game";
    setActiveTab();
    await loadEvents();
    resetWorkflowForSelectedEvent();
    await loadSelectedEventDetails();
    updateTeamEventSection();
    if (isTeamEventFormOpen) {
      await loadTeamEventPlayerSelector();
    }
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();
    clearPlayerAttendanceSelections();
  });
}

if (teamEventsTab) {
  teamEventsTab.addEventListener("click", async () => {
    currentTab = "Team Event";
    setActiveTab();
    await loadEvents();
    resetWorkflowForSelectedEvent();
    await loadSelectedEventDetails();
    updateTeamEventSection();
    if (isTeamEventFormOpen) {
      await loadTeamEventPlayerSelector();
    }
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();
    clearPlayerAttendanceSelections();
  });
}

if (playerManagementTab) {
  playerManagementTab.addEventListener("click", async () => {
    currentTab = "Player Management";
    setActiveTab();
    clearSelectedEvent();

    if (eventSelect) {
      eventSelect.value = "";
    }

    resetWorkflowForSelectedEvent();
    clearSelectedEventDetails();
    updateTeamEventSection();
    if (isTeamEventFormOpen) {
      await loadTeamEventPlayerSelector();
    }
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayerManagementList();
  });
}

if (playerSearchInput) {
  playerSearchInput.addEventListener("input", () => {
    clearTimeout(playerSearchTimer);
    playerSearchTimer = setTimeout(loadPlayerManagementList, 250);
  });
}

if (showInactivePlayersToggle) {
  showInactivePlayersToggle.addEventListener("change", loadPlayerManagementList);
}

if (refreshPlayersBtn) {
  refreshPlayersBtn.addEventListener("click", loadPlayerManagementList);
}

if (teamEventAllGroups) {
  teamEventAllGroups.addEventListener("change", () => {
    const groupCheckboxes = document.querySelectorAll(".team-event-group-checkbox");

    groupCheckboxes.forEach(checkbox => {
      checkbox.checked = teamEventAllGroups.checked;
    });
  });
}

if (teamEventGroupCheckboxes) {
  teamEventGroupCheckboxes.addEventListener("change", event => {
    if (!event.target.classList.contains("team-event-group-checkbox")) return;

    updateAllGroupsCheckboxState();
  });
}

if (hideMarkedToggle) {
  hideMarkedToggle.addEventListener("change", updateAttendanceDisplay);
}

if (showCompletedBtn) {
  showCompletedBtn.addEventListener("click", () => {
    if (!completedPlayerList) return;

    completedPlayerList.classList.toggle("hidden");
    updateAttendanceDisplay();
  });
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

  applyRolePermissions();
  setActiveTab();
  resetWorkflowForSelectedEvent();
  updateAttendanceSectionVisibility();

  await loadGroups();
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
  if (!practiceTab || !gamesTab || !teamEventsTab || !playerManagementTab) return;

  practiceTab.classList.remove("active");
  gamesTab.classList.remove("active");
  teamEventsTab.classList.remove("active");
  playerManagementTab.classList.remove("active");

  if (currentTab === "Practice") {
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
}

/* =========================
   MAIN MODE VISIBILITY
   ========================= */
function updateMainModeVisibility() {
  const isPlayerManagement = currentTab === "Player Management";

  const eventFlowElements = [
    groupSelect ? groupSelect.closest(".form-row") : null,
    eventSelect ? eventSelect.closest(".form-row") : null,
    eventDetailsSection,
    teamEventWorkflowBar,
    eventRosterSection,
    teamEventSection,
    attendanceSection
  ];

  eventFlowElements.forEach(element => {
    if (!element) return;

    if (isPlayerManagement) {
      element.classList.add("hidden");
    } else if (element !== eventDetailsSection && element !== teamEventWorkflowBar && element !== eventRosterSection && element !== teamEventSection) {
      element.classList.remove("hidden");
    }
  });

  if (playerManagementSection) {
    playerManagementSection.classList.toggle("hidden", !isPlayerManagement);
  }
}

/* =========================
   SHOW / HIDE TEAM EVENT FORM
   ========================= */
function updateTeamEventSection() {
  if (!teamEventSection) return;

  if (currentTab === "Player Management") {
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

function resetWorkflowForSelectedEvent() {
  const eventType = getSelectedEventType();
  const hasSelectedEvent = Boolean(eventSelect && eventSelect.value);

  if (currentTab === "Team Event") {
    isTeamEventFormOpen = !hasSelectedEvent;
  } else {
    isTeamEventFormOpen = false;
  }

  isAttendanceModeActive = !(hasSelectedEvent && (eventType === "Game" || eventType === "Team Event"));
}

function updateAttendanceSectionVisibility() {
  if (!attendanceSection) return;

  if (currentTab === "Player Management") {
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

function updateRosterSummary() {
  if (!eventRosterSummary) return;

  const selectedCount = document.querySelectorAll(
    ".roster-player-checkbox:checked"
  ).length;

  eventRosterSummary.textContent = `Selected Players: ${selectedCount}`;

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
    checkbox.checked = isChecked;
  });

  updateRosterSummary();
}

function renderRosterPlayers(players) {
  if (!eventRosterList) return;

  eventRosterList.innerHTML = "";

  if (!players.length) {
    eventRosterList.innerHTML = `
      <div class="roster-empty-message">
        No active players are available for this roster.
      </div>
    `;
    updateRosterSummary();
    return;
  }

  players.forEach(player => {
    const label = document.createElement("label");
    label.className = "roster-player-row";

    const groupLabel = player.GroupName || player.GroupCode || "No Group";

    label.innerHTML = `
      <input
        type="checkbox"
        class="roster-player-checkbox"
        value="${player.PlayerID}"
        ${player.IsExpected ? "checked" : ""}
      />
      <span class="roster-player-info">
        <span class="roster-player-name">${player.FirstName} ${player.LastName}</span>
        <span class="roster-player-group">Group: ${groupLabel}</span>
      </span>
    `;

    eventRosterList.appendChild(label);
  });

  updateRosterSummary();
}

async function updateEventRosterSection() {
  if (!eventRosterSection) return;

  if (currentTab === "Player Management") {
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
  const selectedGroupId = groupSelect ? groupSelect.value : "";
  const selectedEventId = eventSelect ? eventSelect.value : "";

  eventRosterSection.classList.remove("hidden");

  /*
    A game belongs to a specific team event row.
    When All Groups is selected, several same-day games can be
    represented by one grouped dropdown item, which is too broad
    for roster editing. Require one specific group before editing
    a Game roster.
  */
  if (eventType === "Game" && !selectedGroupId) {
    if (eventRosterHelp) {
      eventRosterHelp.textContent =
        "Select a specific group above before managing a Game roster.";
    }

    if (eventRosterList) {
      eventRosterList.innerHTML = `
        <div class="roster-empty-message">
          Game rosters are managed one team at a time.
        </div>
      `;
    }

    if (saveRosterBtn) saveRosterBtn.classList.add("hidden");
    if (selectAllRosterBtn) selectAllRosterBtn.classList.add("hidden");
    if (clearRosterBtn) clearRosterBtn.classList.add("hidden");
    return;
  }

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

  const allMatchingParam = !selectedGroupId && eventType === "Team Event"
    ? "?allMatching=1"
    : "";

  try {
    const res = await fetch(`${API_BASE}/events/${selectedEventId}/roster${allMatchingParam}`, {
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

    renderRosterPlayers(data.players || []);

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
  const selectedGroupId = groupSelect ? groupSelect.value : "";

  if (eventType === "Game" && !selectedGroupId) {
    setMessage(
      eventRosterMessage,
      "Select a specific group before saving a Game roster.",
      true
    );
    return;
  }

  const selectedPlayerIds = Array.from(
    document.querySelectorAll(".roster-player-checkbox:checked")
  ).map(checkbox => Number(checkbox.value));

  const allMatchingParam = !selectedGroupId && eventType === "Team Event"
    ? "?allMatching=1"
    : "";

  try {
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

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(
        eventRosterMessage,
        data.message || "Could not save roster.",
        true
      );
      return;
    }

    const skippedText = data.skippedCount
      ? ` ${data.skippedCount} player(s) skipped.`
      : "";

    setMessage(
      eventRosterMessage,
      `✅ Roster saved. ${data.savedCount || 0} player(s) expected.${skippedText}`,
      false
    );

    await updateEventRosterSection();
    await loadPlayers();

  } catch (err) {
    console.error("Save roster error:", err);
    setMessage(eventRosterMessage, "Could not save roster.", true);
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
    const selectedGroupId = groupSelect ? groupSelect.value : "";

    let eventsUrl = `${API_BASE}/events`;

    if (selectedGroupId) {
      eventsUrl += `?groupId=${encodeURIComponent(selectedGroupId)}`;
    }

    const res = await fetch(eventsUrl, {
      credentials: "include"
    });

    const events = await res.json();

    const filteredEvents = events.filter(event => {
      const dateInfo = getEventDateParts(event.EventDate);
      const day = dateInfo.dayOfWeek;

      const isPractice =
        event.EventType === "Practice" && (day === 1 || day === 3);

      const isGame =
        event.EventType === "Game" && (day === 5 || day === 6 || day === 0);

      const isTeamEvent =
        event.EventType === "Team Event";

      if (currentTab === "Practice") return isPractice;
      if (currentTab === "Game") return isGame;
      if (currentTab === "Team Event") return isTeamEvent;

      return true;
    });

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

/* =========================
   ATTENDANCE LIST QOL HELPERS
   Compact rows, quick status buttons, search, and filters.
   ========================= */
function ensureAttendanceFilterControls() {
  if (!attendanceSection || !attendanceSummary) return;

  let filterPanel = document.getElementById("attendanceFilterPanel");

  if (!filterPanel) {
    filterPanel = document.createElement("div");
    filterPanel.id = "attendanceFilterPanel";
    filterPanel.className = "attendance-filter-panel";

    filterPanel.innerHTML = `
      <div class="attendance-filter-row attendance-search-row">
        <label class="attendance-filter-label">
          Search Players
          <input id="attendanceSearchInput" type="text" placeholder="Search by name, number, birth year, or gender" />
        </label>
      </div>

      <div class="attendance-filter-row">
        <div class="attendance-filter-label">View</div>
        <div class="attendance-status-filter-buttons">
          <button type="button" class="attendance-filter-btn active-filter" data-status-filter="">All</button>
          <button type="button" class="attendance-filter-btn" data-status-filter="Remaining">Remaining</button>
          <button type="button" class="attendance-filter-btn" data-status-filter="Present">Present</button>
          <button type="button" class="attendance-filter-btn" data-status-filter="Absent">Absent</button>
          <button type="button" class="attendance-filter-btn" data-status-filter="Excused">Excused</button>
          <button type="button" class="attendance-filter-btn" data-status-filter="Cancelled">Cancelled</button>
        </div>
      </div>

      <div class="attendance-filter-row">
        <div class="attendance-filter-label">Birth Year</div>
        <div class="attendance-birth-year-filter-buttons">
          <button type="button" class="attendance-filter-btn active-filter" data-birth-year-filter="">All</button>
          <button type="button" class="attendance-filter-btn" data-birth-year-filter="2012">2012</button>
          <button type="button" class="attendance-filter-btn" data-birth-year-filter="2013">2013</button>
          <button type="button" class="attendance-filter-btn" data-birth-year-filter="2014">2014</button>
          <button type="button" class="attendance-filter-btn" data-birth-year-filter="2015">2015</button>
          <button type="button" class="attendance-filter-btn" data-birth-year-filter="2016">2016</button>
          <button type="button" class="attendance-filter-btn" data-birth-year-filter="2017">2017</button>
          <button type="button" class="attendance-filter-btn" data-birth-year-filter="2018">2018</button>
          <button type="button" class="attendance-filter-btn" data-birth-year-filter="2019">2019</button>
          <button type="button" class="attendance-filter-btn" data-birth-year-filter="2020">2020</button>
          <button type="button" class="attendance-filter-btn" data-birth-year-filter="2021">2021</button>
        </div>
      </div>

      <div class="attendance-filter-row">
        <div class="attendance-filter-label">Gender</div>
        <div class="attendance-gender-filter-buttons">
          <button type="button" class="attendance-filter-btn active-filter" data-gender-filter="">All</button>
          <button type="button" class="attendance-filter-btn" data-gender-filter="Male">Male</button>
          <button type="button" class="attendance-filter-btn" data-gender-filter="Female">Female</button>
        </div>
      </div>
    `;

    const tools = attendanceSummary.closest(".attendance-tools");

    if (tools) {
      tools.insertBefore(filterPanel, attendanceSummary.nextSibling);
    } else {
      attendanceSection.insertBefore(filterPanel, attendanceSection.firstChild);
    }
  }

  const searchInput = document.getElementById("attendanceSearchInput");

  if (searchInput && !searchInput.dataset.listenerAttached) {
    searchInput.dataset.listenerAttached = "1";
    searchInput.addEventListener("input", () => {
      clearTimeout(attendanceSearchTimer);
      attendanceSearchTimer = setTimeout(() => {
        attendanceSearchText = searchInput.value.trim().toLowerCase();
        updateAttendanceDisplay();
      }, 150);
    });
  }

  document.querySelectorAll(".attendance-filter-btn[data-status-filter]").forEach(button => {
    if (button.dataset.listenerAttached) return;

    button.dataset.listenerAttached = "1";
    button.addEventListener("click", () => {
      attendanceStatusFilter = button.dataset.statusFilter || "";
      updateAttendanceFilterButtonStates();
      updateAttendanceDisplay();
    });
  });

  document.querySelectorAll(".attendance-filter-btn[data-birth-year-filter]").forEach(button => {
    if (button.dataset.listenerAttached) return;

    button.dataset.listenerAttached = "1";
    button.addEventListener("click", () => {
      attendanceBirthYearFilter = button.dataset.birthYearFilter || "";
      updateAttendanceFilterButtonStates();
      updateAttendanceDisplay();
    });
  });

  document.querySelectorAll(".attendance-filter-btn[data-gender-filter]").forEach(button => {
    if (button.dataset.listenerAttached) return;

    button.dataset.listenerAttached = "1";
    button.addEventListener("click", () => {
      attendanceGenderFilter = button.dataset.genderFilter || "";
      updateAttendanceFilterButtonStates();
      updateAttendanceDisplay();
    });
  });

  updateAttendanceFilterButtonStates();
}

function updateAttendanceFilterButtonStates() {
  document.querySelectorAll(".attendance-filter-btn[data-status-filter]").forEach(button => {
    button.classList.toggle(
      "active-filter",
      (button.dataset.statusFilter || "") === attendanceStatusFilter
    );
  });

  document.querySelectorAll(".attendance-filter-btn[data-birth-year-filter]").forEach(button => {
    button.classList.toggle(
      "active-filter",
      (button.dataset.birthYearFilter || "") === attendanceBirthYearFilter
    );
  });

  document.querySelectorAll(".attendance-filter-btn[data-gender-filter]").forEach(button => {
    button.classList.toggle(
      "active-filter",
      (button.dataset.genderFilter || "") === attendanceGenderFilter
    );
  });
}

function getAttendanceRowStatus(row) {
  return row ? row.dataset.status || "" : "";
}

function setAttendanceRowStatus(row, status, options = {}) {
  if (!row) return;

  row.dataset.status = status || "";

  row.querySelectorAll(".attendance-status-btn").forEach(button => {
    button.classList.toggle("active-status-btn", button.dataset.status === row.dataset.status);
  });

  if (options.saveDraft !== false) {
    saveAttendanceDraft();
  }

  updateAttendanceDisplay();
}

function rowMatchesAttendanceFilters(row) {
  if (!row) return false;

  const status = getAttendanceRowStatus(row);
  const rowSearchText = row.dataset.searchText || "";
  const rowBirthYear = row.dataset.birthYear || "";
  const rowGender = row.dataset.gender || "";

  const searchMatches = !attendanceSearchText || rowSearchText.includes(attendanceSearchText);

  const birthYearMatches = !attendanceBirthYearFilter || rowBirthYear === attendanceBirthYearFilter;
  const genderMatches = !attendanceGenderFilter || rowGender === attendanceGenderFilter;

  const statusMatches =
    !attendanceStatusFilter ||
    (attendanceStatusFilter === "Remaining" && !status) ||
    status === attendanceStatusFilter;

  return searchMatches && birthYearMatches && genderMatches && statusMatches;
}

function createAttendancePlayerRow(player) {
  const row = document.createElement("div");
  const groupLabel = player.GroupName || player.GroupCode || "";
  const birthYear = player.BirthYear || player.GroupCode || groupLabel || "";
  const playerNumber =
    player.PlayerNumber === 0 || player.PlayerNumber
      ? `#${player.PlayerNumber}`
      : "No #";
  const playerName = `${player.FirstName} ${player.LastName}`.trim();
  const gender = player.Gender || "";

  row.className = "player-row attendance-player-card";
  row.dataset.playerId = player.PlayerID;
  row.dataset.status = "";
  row.dataset.birthYear = String(birthYear || "");
  row.dataset.gender = String(gender || "");
  row.dataset.searchText = [
    playerName,
    playerNumber,
    birthYear,
    gender,
    groupLabel,
    player.FullName || ""
  ].join(" ").toLowerCase();

  row.innerHTML = `
    <div class="attendance-player-info">
      <div class="attendance-player-name">${playerName}</div>
      <div class="attendance-player-meta">${playerNumber} ${birthYear ? `| Birth Year: ${birthYear}` : ""} ${gender ? `| Gender: ${gender}` : ""}</div>
    </div>

    <div class="attendance-status-buttons" role="group" aria-label="Attendance status for ${playerName}">
      <button type="button" class="attendance-status-btn present-btn" data-status="Present">Present</button>
      <button type="button" class="attendance-status-btn absent-btn" data-status="Absent">Absent</button>
      <button type="button" class="attendance-status-btn excused-btn" data-status="Excused">Excused</button>
      <button type="button" class="attendance-status-btn cancelled-btn" data-status="Cancelled">Cancelled</button>
      <button type="button" class="attendance-status-btn clear-btn" data-status="Clear">Clear / Reset</button>
    </div>
  `;

  row.querySelectorAll(".attendance-status-btn").forEach(button => {
    button.addEventListener("click", () => {
      const nextStatus = button.dataset.status || "";
      const currentStatus = getAttendanceRowStatus(row);

      setAttendanceRowStatus(row, currentStatus === nextStatus ? "" : nextStatus);

      if (attendanceMessage) {
        if (nextStatus === "Clear") {
          setMessage(attendanceMessage, "Reset selected. Submit attendance to remove this saved status.", false);
        } else {
          setMessage(attendanceMessage, nextStatus ? "Draft saved automatically." : "Status cleared from draft.", false);
        }
      }
    });
  });

  return row;
}

function getAllAttendanceRows() {
  return Array.from(
    document.querySelectorAll("#playerList .player-row, #completedPlayerList .player-row")
  );
}

/* =========================
   LOAD PLAYERS
   ========================= */
async function loadPlayers() {
  if (currentTab === "Player Management") {
    await loadPlayerManagementList();
    return;
  }

  ensureAttendanceFilterControls();

  try {
    const selectedGroupId = groupSelect ? groupSelect.value : "";
    const selectedEventId = eventSelect ? eventSelect.value : "";

    const playerParams = new URLSearchParams();
    const selectedEventType = getSelectedEventType();

    /*
      Always send eventId when an event is selected.

      Backend behavior:
      - Practice: loads active players from the selected practice group.
        In All Groups mode, ?allMatching=1 loads players from all groups
        included in that same practice date/name.
      - Game / Team Event: loads only players assigned to that event roster.

      This keeps Practice from returning zero players and keeps Games / Team
      Events roster-based after the event is selected.
    */
    if (selectedEventId) {
      playerParams.set("eventId", selectedEventId);

      if (!selectedGroupId) {
        playerParams.set("allMatching", "1");
      }
    } else if (selectedGroupId) {
      playerParams.set("groupId", selectedGroupId);
    }

    const playersUrl =
      playerParams.toString()
        ? `${API_BASE}/players?${playerParams.toString()}`
        : `${API_BASE}/players`;

    const res = await fetch(playersUrl, {
      credentials: "include"
    });

    const data = await res.json();

    const players = Array.isArray(data)
      ? data
      : data.players || [];

    const playerList = document.getElementById("playerList");

    if (!playerList) return;

    playerList.innerHTML = "";

    if (completedPlayerList) {
      completedPlayerList.innerHTML = "";
      completedPlayerList.classList.add("hidden");
    }

    if (!players.length) {
      playerList.innerHTML = `
        <div class="roster-empty-message">No players found for this attendance list.</div>
      `;
    }

    players.forEach(player => {
      playerList.appendChild(createAttendancePlayerRow(player));
    });

    updateAttendanceDisplay();

    const lastSelectedEventId = getSelectedEvent();

    if (lastSelectedEventId && eventSelect) {
      const matchingOption = eventSelect.querySelector(
        `option[value="${lastSelectedEventId}"]`
      );

      if (matchingOption) {
        eventSelect.value = lastSelectedEventId;
        updateEventActionButtons();
        await loadSelectedEventDetails();
        await loadAttendanceForEvent();
        return;
      }
    }

    if (eventSelect && eventSelect.value) {
      updateEventActionButtons();
      await loadSelectedEventDetails();
      await loadAttendanceForEvent();
    }

  } catch (err) {
    console.error("Failed to load players", err);
  }
}

/* =========================
   CLEAR ATTENDANCE SELECTIONS
   ========================= */
function clearPlayerAttendanceSelections() {
  const rows = getAllAttendanceRows();

  rows.forEach(row => {
    setAttendanceRowStatus(row, "", { saveDraft: false });
    row.classList.remove(
      "status-present",
      "status-absent",
      "status-excused",
      "status-cancelled",
      "status-clear"
    );
  });

  if (completedPlayerList) {
    completedPlayerList.classList.add("hidden");
  }

  if (attendanceMessage) {
    attendanceMessage.textContent = "";
  }

  updateAttendanceDisplay();
}

/* =========================
   LOCAL ATTENDANCE DRAFTS
   ========================= */
function getDraftKey(eventId) {
  return `attendanceDraft_event_${eventId}`;
}

function saveAttendanceDraft() {
  if (!eventSelect) return;

  const eventId = eventSelect.value;

  if (!eventId) return;

  saveSelectedEvent();

  const draft = {};

  getAllAttendanceRows().forEach(row => {
    const playerId = row.dataset.playerId;
    const status = getAttendanceRowStatus(row);

    if (playerId) {
      draft[playerId] = status;
    }
  });

  localStorage.setItem(getDraftKey(eventId), JSON.stringify(draft));
}

function loadAttendanceDraft(eventId) {
  const savedDraft = localStorage.getItem(getDraftKey(eventId));

  if (!savedDraft) return false;

  try {
    const draft = JSON.parse(savedDraft);

    getAllAttendanceRows().forEach(row => {
      const playerId = row.dataset.playerId;

      if (Object.prototype.hasOwnProperty.call(draft, playerId)) {
        setAttendanceRowStatus(row, draft[playerId], { saveDraft: false });
      }
    });

    updateAttendanceDisplay();
    return true;

  } catch (err) {
    console.error("Could not load attendance draft", err);
    return false;
  }
}

function clearAttendanceDraft(eventId) {
  if (!eventId) return;
  localStorage.removeItem(getDraftKey(eventId));
}

/* =========================
   REMEMBER SELECTED EVENT
   ========================= */
function saveSelectedEvent() {
  if (!eventSelect) return;

  if (!eventSelect.value) {
    clearSelectedEvent();
    return;
  }

  localStorage.setItem("lastSelectedEventId", eventSelect.value);
}

function getSelectedEvent() {
  return localStorage.getItem("lastSelectedEventId");
}

function clearSelectedEvent() {
  localStorage.removeItem("lastSelectedEventId");
}

/* =========================
   ALL GROUPS HELPER

   Purpose:
   - When no specific age group is selected, the app is in
     All Groups mode.
   - Backend routes use ?allMatching=1 so grouped events
     load/save/cancel/restore across matching EventIDs.
   ========================= */
function getAllMatchingParam() {
  const selectedGroupId = groupSelect ? groupSelect.value : "";
  return selectedGroupId ? "" : "?allMatching=1";
}

/* =========================
   LOAD SAVED ATTENDANCE

   Behavior:
   - Specific age group selected:
       Loads attendance for one EventID.

   - All Groups selected:
       Loads attendance across all matching EventIDs using
       ?allMatching=1.
   ========================= */
async function loadAttendanceForEvent() {
  if (!eventSelect) return;

  const eventId = eventSelect.value;

  clearPlayerAttendanceSelections();

  if (!eventId) return;

  const allMatchingParam = getAllMatchingParam();

  try {
    const res = await fetch(`${API_BASE}/attendance/${eventId}${allMatchingParam}`, {
      credentials: "include"
    });

    const savedAttendance = await res.json();
    const attendanceMap = {};

    savedAttendance.forEach(record => {
      attendanceMap[record.PlayerID] = record.AttendanceStatus;
    });

    getAllAttendanceRows().forEach(row => {
      const playerId = row.dataset.playerId;
      const savedStatus = attendanceMap[playerId] || "";

      setAttendanceRowStatus(row, savedStatus, { saveDraft: false });
    });

    updateAttendanceDisplay();

    const draftRestored = loadAttendanceDraft(eventId);

    if (draftRestored) {
      setMessage(
        attendanceMessage,
        "Draft restored. Review and submit when ready.",
        false
      );
    } else if (savedAttendance.length > 0) {
      setMessage(attendanceMessage, "Saved attendance loaded.", false);
    }

  } catch (err) {
    console.error("Failed to load saved attendance", err);
    setMessage(attendanceMessage, "Could not load saved attendance.", true);
  }
}

/* =========================
   UPDATE ATTENDANCE DISPLAY
   ========================= */
function updateAttendanceDisplay() {
  const playerList = document.getElementById("playerList");
  if (!playerList) return;

  const allRows = getAllAttendanceRows();

  let present = 0;
  let absent = 0;
  let excused = 0;
  let cancelled = 0;
  let remaining = 0;
  let completed = 0;
  let visibleCount = 0;

  allRows.forEach(row => {
    const status = getAttendanceRowStatus(row);

    row.classList.remove(
      "status-present",
      "status-absent",
      "status-excused",
      "status-cancelled",
      "status-clear"
    );

    row.querySelectorAll(".attendance-status-btn").forEach(button => {
      button.classList.toggle("active-status-btn", button.dataset.status === status);
    });

    if (status === "Present") {
      present++;
      completed++;
      row.classList.add("status-present");
    } else if (status === "Absent") {
      absent++;
      completed++;
      row.classList.add("status-absent");
    } else if (status === "Excused") {
      excused++;
      completed++;
      row.classList.add("status-excused");
    } else if (status === "Cancelled") {
      cancelled++;
      completed++;
      row.classList.add("status-cancelled");
    } else if (status === "Clear") {
      completed++;
      row.classList.add("status-clear");
    } else {
      remaining++;
    }
  });

  if (attendanceSummary) {
    attendanceSummary.textContent =
      `Present: ${present} | Absent: ${absent} | Excused: ${excused} | Cancelled: ${cancelled} | Remaining: ${remaining}`;
  }

  const hideMarked = hideMarkedToggle ? hideMarkedToggle.checked : true;

  allRows.forEach(row => {
    const status = getAttendanceRowStatus(row);
    const matchesFilters = rowMatchesAttendanceFilters(row);

    row.classList.toggle("hidden", !matchesFilters);

    if (matchesFilters) {
      visibleCount++;
    }

    if (status && hideMarked && completedPlayerList) {
      completedPlayerList.appendChild(row);
    } else {
      playerList.appendChild(row);
    }
  });

  if (showCompletedBtn) {
    const completedHidden = completedPlayerList
      ? completedPlayerList.classList.contains("hidden")
      : true;

    const filterText = attendanceSearchText || attendanceStatusFilter || attendanceBirthYearFilter || attendanceGenderFilter
      ? ` | Showing ${visibleCount}`
      : "";

    showCompletedBtn.textContent = completedHidden
      ? `Show Completed Attendance (${completed})${filterText}`
      : `Hide Completed Attendance (${completed})${filterText}`;
  }
}

/* =========================
   SAVE / UPDATE ATTENDANCE

   Behavior:
   - Specific age group selected:
       Saves to one selected EventID.

   - All Groups selected:
       Sends ?allMatching=1 so the backend can save each
       player to the correct matching EventID for that
       player's age group.
   ========================= */
async function saveAttendance() {
  if (attendanceMessage) {
    attendanceMessage.textContent = "";
  }

  if (!eventSelect) return;

  const eventId = eventSelect.value;

  if (!eventId) {
    setMessage(attendanceMessage, "Select an event first.", true);
    return;
  }

  const rows = getAllAttendanceRows();

  const attendance = [];

  rows.forEach(row => {
    const playerId = row.dataset.playerId;
    const status = getAttendanceRowStatus(row);

    if (status) {
      attendance.push({
        playerId: Number(playerId),
        status
      });
    }
  });

  if (attendance.length === 0) {
    setMessage(
      attendanceMessage,
      "Select Present, Absent, Excused, Cancelled, or Clear / Reset for at least one player.",
      true
    );
    return;
  }

  const allMatchingParam = getAllMatchingParam();

  try {
    const res = await fetch(`${API_BASE}/attendance${allMatchingParam}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        eventId: Number(eventId),
        attendance
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(attendanceMessage, data.message || "Error saving attendance.", true);
      return;
    }

    clearAttendanceDraft(eventId);

    setMessage(attendanceMessage, "✅ Attendance saved / updated.", false);
    await loadAttendanceForEvent();

  } catch (err) {
    console.error("Save attendance error:", err);
    setMessage(attendanceMessage, "Could not save attendance.", true);
  }
}

/* =========================
   CANCEL SELECTED EVENT

   Behavior:
   - If one age group is selected:
       Cancels only that selected EventID.

   - If All Groups is selected:
       Sends ?allMatching=1 so the backend can cancel
       all events on the same date and event type.
   ========================= */
async function cancelSelectedEvent() {
  if (!eventSelect || !eventSelect.value) {
    setMessage(attendanceMessage, "Select an event first.", true);
    return;
  }

  const selectedGroupId = groupSelect ? groupSelect.value : "";
  const allMatchingParam = getAllMatchingParam();

  if (!selectedGroupId) {
    const continueCancel = confirm(
      "All Groups is selected.\n\nThis will cancel all matching events on the same date and event type for every group included in that event.\n\nDo you want to continue?"
    );

    if (!continueCancel) return;
  }

  const selectedOption = eventSelect.options[eventSelect.selectedIndex];
  const eventText = selectedOption ? selectedOption.textContent : "this event";

  const confirmed = confirm(
    `Are you sure you want to cancel this event?\n\n${eventText}\n\nThis will mark the assigned players as Cancelled.`
  );

  if (!confirmed) return;

  const eventId = eventSelect.value;

  try {
    const res = await fetch(`${API_BASE}/events/${eventId}/cancel${allMatchingParam}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(
        attendanceMessage,
        data.message || "Could not cancel event.",
        true
      );
      return;
    }

    clearAttendanceDraft(eventId);

    const cancelledPlayers =
      data.cancelledPlayers ||
      data.CancelledPlayers ||
      (data.event && data.event.CancelledPlayers) ||
      0;

    setMessage(
      attendanceMessage,
      `✅ Event cancelled. ${cancelledPlayers} player(s) marked Cancelled.`,
      false
    );

    await loadEvents();

    if (eventSelect) {
      eventSelect.value = eventId;
    }

    updateEventActionButtons();

    await loadAttendanceForEvent();

  } catch (err) {
    console.error("Error cancelling event:", err);
    setMessage(attendanceMessage, "Server error cancelling event.", true);
  }
}

/* =========================
   RESTORE SELECTED EVENT

   Behavior:
   - If one age group is selected:
       Restores only that selected EventID.

   - If All Groups is selected:
       Sends ?allMatching=1 so the backend can restore
       all events on the same date and event type.
   ========================= */
async function restoreSelectedEvent() {
  if (!eventSelect || !eventSelect.value) {
    setMessage(attendanceMessage, "Select an event first.", true);
    return;
  }

  const selectedGroupId = groupSelect ? groupSelect.value : "";
  const allMatchingParam = getAllMatchingParam();

  const selectedOption = eventSelect.options[eventSelect.selectedIndex];
  const eventText = selectedOption ? selectedOption.textContent : "this event";

  const confirmed = confirm(
    selectedGroupId
      ? `Restore this cancelled event?\n\n${eventText}\n\nPrevious attendance will be recovered if a backup exists.`
      : `All Groups is selected.\n\nThis will restore all matching events on the same date and event type for every group included in that event.\n\nPrevious attendance will be recovered if backups exist.\n\nDo you want to continue?`
  );

  if (!confirmed) return;

  const eventId = eventSelect.value;

  try {
    const res = await fetch(`${API_BASE}/events/${eventId}/restore${allMatchingParam}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(
        attendanceMessage,
        data.message || "Could not restore event.",
        true
      );
      return;
    }

    clearAttendanceDraft(eventId);

    setMessage(
      attendanceMessage,
      "✅ Event restored and previous attendance recovered.",
      false
    );

    await loadEvents();

    if (eventSelect) {
      eventSelect.value = eventId;
    }

    updateEventActionButtons();

    await loadAttendanceForEvent();

  } catch (err) {
    console.error("Error restoring event:", err);
    setMessage(attendanceMessage, "Server error restoring event.", true);
  }
}

/* =========================
   DELETE SELECTED EVENT

   Use only for mistakes such as:
   - duplicate event
   - wrong date
   - event created accidentally

   Normal rainouts / cancellations should use Cancel Event
   so history remains available for reports.
   ========================= */
async function deleteSelectedEvent() {
  if (!eventSelect || !eventSelect.value) {
    setMessage(attendanceMessage, "Select an event first.", true);
    return;
  }

  const selectedGroupId = groupSelect ? groupSelect.value : "";
  const allMatchingParam = getAllMatchingParam();
  const selectedOption = eventSelect.options[eventSelect.selectedIndex];
  const eventText = selectedOption ? selectedOption.textContent : "this event";

  const scopeMessage = !selectedGroupId
    ? "All Groups is selected. This will permanently delete every matching event row included in this grouped event."
    : "This will permanently delete the selected event row.";

  const confirmed = confirm(
    `Delete this event permanently?

${eventText}

${scopeMessage}

Use Delete only for mistakes or duplicates. Normal cancelled events should stay as Cancelled.`
  );

  if (!confirmed) return;

  const secondConfirm = confirm(
    "This cannot be undone. Delete this event now?"
  );

  if (!secondConfirm) return;

  const eventId = eventSelect.value;

  try {
    const res = await fetch(`${API_BASE}/events/${eventId}${allMatchingParam}`, {
      method: "DELETE",
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(
        attendanceMessage,
        data.message || "Could not delete event.",
        true
      );
      return;
    }

    clearAttendanceDraft(eventId);
    clearSelectedEvent();

    if (eventSelect) {
      eventSelect.value = "";
    }

    setMessage(
      attendanceMessage,
      `✅ Event deleted. ${data.deletedEvents || 0} event row(s) removed.`,
      false
    );

    await loadEvents();
    resetWorkflowForSelectedEvent();
    updateEventActionButtons();
    clearSelectedEventDetails();
    updateTeamEventSection();
    if (isTeamEventFormOpen) {
      await loadTeamEventPlayerSelector();
    }
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();

  } catch (err) {
    console.error("Error deleting event:", err);
    setMessage(attendanceMessage, "Server error deleting event.", true);
  }
}

/* =========================
   TEAM EVENT PLAYER SELECTOR

   Purpose:
   - Team Events can be created by selecting exact players.
   - Backend will create the needed event rows by each player's group.
   ========================= */
function getSelectedTeamEventPlayerIds() {
  return Array.from(
    document.querySelectorAll(".team-event-player-checkbox:checked")
  )
    .map(checkbox => Number(checkbox.value))
    .filter(value => Number.isInteger(value) && value > 0);
}

function updateTeamEventPlayerSummary() {
  const summary = document.getElementById("teamEventPlayerSummary");
  if (!summary) return;

  const selectedCount = getSelectedTeamEventPlayerIds().length;
  summary.textContent = `Selected Players: ${selectedCount}`;
}

function setAllTeamEventPlayerCheckboxes(isChecked) {
  document.querySelectorAll(".team-event-player-checkbox").forEach(checkbox => {
    checkbox.checked = isChecked;
  });

  updateTeamEventPlayerSummary();
}

function getFilteredTeamEventPlayers() {
  const searchInput = document.getElementById("teamEventPlayerSearch");
  const searchText = searchInput ? searchInput.value.trim().toLowerCase() : "";

  if (!searchText && !teamEventGenderFilter) {
    return latestTeamEventPlayers;
  }

  return latestTeamEventPlayers.filter(player => {
    const genderMatches = !teamEventGenderFilter || (player.Gender || "") === teamEventGenderFilter;
    const searchable = [
      player.FirstName,
      player.LastName,
      player.FullName,
      player.PlayerNumber === 0 || player.PlayerNumber ? `#${player.PlayerNumber}` : "",
      player.GroupName,
      player.GroupCode,
      player.Gender,
      player.BirthYear
    ].filter(Boolean).join(" ").toLowerCase();

    return genderMatches && searchable.includes(searchText);
  });
}

function renderTeamEventPlayerOptions() {
  const list = document.getElementById("teamEventPlayerList");
  if (!list) return;

  const selectedIds = new Set(getSelectedTeamEventPlayerIds());
  const players = getFilteredTeamEventPlayers();

  list.innerHTML = "";

  if (!players.length) {
    list.innerHTML = `
      <div class="roster-empty-message">
        No active players found.
      </div>
    `;
    updateTeamEventPlayerSummary();
    return;
  }

  players.forEach(player => {
    const label = document.createElement("label");
    label.className = "team-event-player-option";

    const groupLabel = player.GroupName || player.GroupCode || player.BirthYear || "No Group";
    const playerNumber = player.PlayerNumber === 0 || player.PlayerNumber
      ? `#${player.PlayerNumber}`
      : "No #";

    label.innerHTML = `
      <input
        type="checkbox"
        class="team-event-player-checkbox"
        value="${player.PlayerID}"
        ${selectedIds.has(Number(player.PlayerID)) ? "checked" : ""}
      />
      <span class="team-event-player-info">
        <span class="team-event-player-name">${player.FirstName} ${player.LastName}</span>
        <span class="team-event-player-meta">${playerNumber} | Group: ${groupLabel}${player.Gender ? ` | Gender: ${player.Gender}` : ""}</span>
      </span>
    `;

    list.appendChild(label);
  });

  list.querySelectorAll(".team-event-player-checkbox").forEach(checkbox => {
    checkbox.addEventListener("change", updateTeamEventPlayerSummary);
  });

  updateTeamEventPlayerSummary();
}

function ensureTeamEventPlayerSelectorPanel() {
  if (!teamEventSection) return null;

  let panel = document.getElementById("teamEventPlayerSelectorPanel");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "teamEventPlayerSelectorPanel";
    panel.className = "team-event-player-selector-panel";

    panel.innerHTML = `
      <h3>Select Players</h3>
      <p class="subtext team-event-player-help">
        Select the exact players for this Team Event. The app will create the correct roster automatically, even when players are from different birth years.
      </p>

      <input
        id="teamEventPlayerSearch"
        type="text"
        placeholder="Search players by name, number, group, or gender"
      />

      <label class="team-event-gender-filter-label">
        Gender Filter
        <select id="teamEventGenderFilter">
          <option value="">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </label>

      <div class="team-event-player-actions">
        <button type="button" id="teamEventSelectAllPlayersBtn" class="btn btn-secondary">
          Select All Shown
        </button>
        <button type="button" id="teamEventClearPlayersBtn" class="btn btn-secondary">
          Clear Players
        </button>
      </div>

      <div id="teamEventPlayerSummary" class="roster-summary">
        Selected Players: 0
      </div>

      <div id="teamEventPlayerList" class="team-event-player-list"></div>
    `;

    const insertAfter = newTeamEventNotes || teamEventGroupCheckboxes || teamEventAllGroups;

    if (insertAfter && insertAfter.parentNode) {
      insertAfter.parentNode.insertBefore(panel, insertAfter.nextSibling);
    } else {
      teamEventSection.appendChild(panel);
    }
  }

  const searchInput = document.getElementById("teamEventPlayerSearch");
  const genderFilter = document.getElementById("teamEventGenderFilter");
  const selectAllBtn = document.getElementById("teamEventSelectAllPlayersBtn");
  const clearBtn = document.getElementById("teamEventClearPlayersBtn");

  if (searchInput && !searchInput.dataset.listenerAttached) {
    searchInput.dataset.listenerAttached = "1";
    searchInput.addEventListener("input", () => {
      clearTimeout(teamEventPlayerSearchTimer);
      teamEventPlayerSearchTimer = setTimeout(renderTeamEventPlayerOptions, 150);
    });
  }

  if (genderFilter && !genderFilter.dataset.listenerAttached) {
    genderFilter.dataset.listenerAttached = "1";
    genderFilter.addEventListener("change", () => {
      teamEventGenderFilter = genderFilter.value || "";
      renderTeamEventPlayerOptions();
    });
  }

  if (selectAllBtn && !selectAllBtn.dataset.listenerAttached) {
    selectAllBtn.dataset.listenerAttached = "1";
    selectAllBtn.addEventListener("click", () => setAllTeamEventPlayerCheckboxes(true));
  }

  if (clearBtn && !clearBtn.dataset.listenerAttached) {
    clearBtn.dataset.listenerAttached = "1";
    clearBtn.addEventListener("click", () => setAllTeamEventPlayerCheckboxes(false));
  }

  return panel;
}

function hideTeamEventGroupSelectorForPlayerMode() {
  const groupBox = teamEventAllGroups
    ? teamEventAllGroups.closest(".team-event-group-box")
    : null;

  if (groupBox) {
    groupBox.classList.add("hidden");
  } else if (teamEventGroupCheckboxes) {
    teamEventGroupCheckboxes.classList.add("hidden");
  }
}

async function loadTeamEventPlayerSelector() {
  const panel = ensureTeamEventPlayerSelectorPanel();

  if (!panel) return;

  hideTeamEventGroupSelectorForPlayerMode();

  const list = document.getElementById("teamEventPlayerList");

  if (list) {
    list.innerHTML = `<div class="roster-empty-message">Loading active players...</div>`;
  }

  try {
    const res = await fetch(`${API_BASE}/players`, {
      credentials: "include"
    });

    const data = await res.json();
    latestTeamEventPlayers = Array.isArray(data) ? data : data.players || [];

    renderTeamEventPlayerOptions();

  } catch (err) {
    console.error("Could not load players for Team Event:", err);

    if (list) {
      list.innerHTML = `<div class="roster-empty-message">Could not load players.</div>`;
    }
  }
}

/* =========================
   ADD TEAM EVENT

   Purpose:
   - Creates a manual event such as:
       Scrimmage
       Team get-together
       Other team activity
   - Supports one group or multiple selected groups.
   ========================= */
async function addTeamEvent() {
  if (teamEventMessage) {
    teamEventMessage.textContent = "";
  }

  if (currentUser && currentUser.RoleName === "MainCoach") {
    setMessage(
      teamEventMessage,
      "Access denied. Only Admin and Team Mom can add team events.",
      true
    );
    return;
  }

  const selectedPlayerIds = getSelectedTeamEventPlayerIds();

  const eventName = newTeamEventName ? newTeamEventName.value.trim() : "";
  const eventDate = newTeamEventDate ? newTeamEventDate.value : "";
  const startTime = newTeamEventStartTime ? newTeamEventStartTime.value : "";
  const endTime = newTeamEventEndTime ? newTeamEventEndTime.value : "";
  const locationName = newTeamEventLocation ? newTeamEventLocation.value.trim() : "";
  const notes = newTeamEventNotes ? newTeamEventNotes.value.trim() : "";

  if (selectedPlayerIds.length === 0 || !eventName || !eventDate) {
    setMessage(
      teamEventMessage,
      "Select at least one player and enter an event name and date.",
      true
    );
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/events`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        playerIds: selectedPlayerIds,
        eventDate,
        eventType: "Team Event",
        eventName,
        startTime: startTime || null,
        endTime: endTime || null,
        locationName: locationName || null,
        notes: notes || null
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      if (res.status === 401) {
        setMessage(teamEventMessage, "Session expired. Please login again.", true);
      } else if (res.status === 403) {
        setMessage(teamEventMessage, "Access denied.", true);
      } else {
        setMessage(teamEventMessage, data.message || "Could not add team event.", true);
      }
      return;
    }

    if (newTeamEventName) newTeamEventName.value = "";
    if (newTeamEventDate) newTeamEventDate.value = "";
    if (newTeamEventStartTime) newTeamEventStartTime.value = "";
    if (newTeamEventEndTime) newTeamEventEndTime.value = "";
    if (newTeamEventLocation) newTeamEventLocation.value = "";
    if (newTeamEventNotes) newTeamEventNotes.value = "";

    setAllTeamEventPlayerCheckboxes(false);

    /*
      Team Events can include players from multiple groups.
      Keep All Groups selected so the grouped Team Event appears
      as one dropdown option after creation.
    */
    if (groupSelect) {
      groupSelect.value = "";
    }

    const createdCount = data.createdEvents || 1;

    setMessage(
      teamEventMessage,
      createdCount === 1
        ? "✅ Team event added."
        : `✅ Team event added for ${createdCount} groups.`,
      false
    );

    await loadEvents();

    if (eventSelect && data.event && data.event.EventID) {
      const createdEventOption = eventSelect.querySelector(
        `option[value="${data.event.EventID}"]`
      );

      if (createdEventOption) {
        eventSelect.value = String(data.event.EventID);
        saveSelectedEvent();
      }
    }

    resetWorkflowForSelectedEvent();
    updateEventActionButtons();
    updateTeamEventSection();
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();

  } catch (err) {
    console.error("Add team event error:", err);
    setMessage(teamEventMessage, "Server error adding team event.", true);
  }
}

/* =========================
   PLAYER MANAGEMENT
   ========================= */
let playerManagementMode = "add";
let editingPlayerId = null;
let latestManagedPlayers = [];
let playerManagementPageIndex = 0;
const PLAYER_MANAGEMENT_PAGE_SIZE = 10;

let playerManagementBirthYearFilter = "";
let playerManagementPhotoReleaseFilter = "";
let playerManagementPaperworkFilter = "";
let playerManagementGenderFilter = "";
let playerManagementQuickFilter = "";
let isPlayerManagementFormExpanded = false;
let isPlayerManagementSaving = false;

function canManagePlayers() {
  return currentUser && currentUser.RoleName !== "MainCoach";
}

function getPlayerStatusLabel(player) {
  return player.IsActive ? "Active" : "Inactive";
}

function formatDateForInput(value) {
  if (!value) return "";

  const raw = String(value);

  if (raw.includes("T")) {
    return raw.split("T")[0];
  }

  return raw.substring(0, 10);
}

function safeValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

function getPhotoReleaseLabel(player) {
  return player.PhotoReleaseStatus || "Not Received";
}

function isPaperworkMissing(player) {
  const status = player.PaperworkStatus || "Not Received";
  return status !== "Complete";
}

function isPhotoReleaseMissing(player) {
  const status = getPhotoReleaseLabel(player);
  return status === "Not Received" || !player.PhotoReleaseFormReceived;
}

function hasEmergencyInfo(player) {
  return Boolean(
    player.StreetAddress ||
    player.City ||
    player.State ||
    player.ZipCode ||
    player.EmergencyContactName ||
    player.EmergencyContactPhone ||
    player.EmergencyContactAltPhone
  );
}

function isEmergencyInfoMissing(player) {
  return !hasEmergencyInfo(player);
}

function formatPlayerUpdatedAt(value) {
  if (!value) return "Not updated";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).split("T")[0] || "Not updated";
  }

  return date.toLocaleDateString();
}

function getPlayerManagementCounts(players) {
  return {
    paperworkMissing: players.filter(isPaperworkMissing).length,
    photoReleaseMissing: players.filter(isPhotoReleaseMissing).length,
    emergencyInfoMissing: players.filter(isEmergencyInfoMissing).length
  };
}

function setPlayerManagementSavingState(isSaving) {
  isPlayerManagementSaving = isSaving;

  const saveBtn = document.getElementById("pmSavePlayerBtn");

  if (saveBtn) {
    saveBtn.disabled = isSaving;
    saveBtn.textContent = isSaving
      ? "Saving..."
      : playerManagementMode === "edit"
        ? "Save Changes"
        : "Add Player";
  }
}

function ensurePlayerManagementFilters() {
  if (!playerManagementSection || !playerManagementSummary) return;

  let filterPanel = document.getElementById("playerManagementFilterPanel");

  if (!filterPanel) {
    filterPanel = document.createElement("div");
    filterPanel.id = "playerManagementFilterPanel";
    filterPanel.className = "player-management-filter-panel";

    filterPanel.innerHTML = `
      <div id="playerManagementQuickCounts" class="player-management-quick-counts">
        Missing: Paperwork 0 | Photo Release 0 | Emergency Info 0
      </div>

      <div class="player-management-quick-filter-buttons">
        <button type="button" id="pmQuickMissingPaperworkBtn" class="btn btn-secondary player-management-quick-filter-btn" data-filter="missingPaperwork">
          Missing Paperwork
        </button>

        <button type="button" id="pmQuickMissingPhotoReleaseBtn" class="btn btn-secondary player-management-quick-filter-btn" data-filter="missingPhotoRelease">
          Missing Photo Release
        </button>

        <button type="button" id="pmQuickMissingEmergencyBtn" class="btn btn-secondary player-management-quick-filter-btn" data-filter="missingEmergencyInfo">
          Missing Emergency Info
        </button>
      </div>

      <div class="player-management-filter-grid player-management-main-filter-grid">
        <label>
          Birth Year
          <select id="pmFilterBirthYear">
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
          <select id="pmFilterGender">
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>

        <button type="button" id="pmClearFiltersBtn" class="btn btn-secondary">
          Clear Filters
        </button>
      </div>

      <details class="player-management-advanced-filters">
        <summary>More filters</summary>

        <div class="player-management-filter-grid player-management-secondary-filter-grid">
          <label>
            Photo Release
            <select id="pmFilterPhotoRelease">
              <option value="">All Photo Releases</option>
              <option value="Opt In">Opt In</option>
              <option value="Opt Out">Opt Out</option>
              <option value="Not Received">Not Received</option>
            </select>
          </label>

          <label>
            Paperwork
            <select id="pmFilterPaperwork">
              <option value="">All Paperwork</option>
              <option value="Complete">Complete</option>
              <option value="Missing">Missing</option>
              <option value="Not Received">Not Received</option>
            </select>
          </label>
        </div>
      </details>
    `;

    playerManagementSection.insertBefore(filterPanel, playerManagementSummary);
  }

  const birthYearFilter = document.getElementById("pmFilterBirthYear");
  const genderFilter = document.getElementById("pmFilterGender");
  const photoReleaseFilter = document.getElementById("pmFilterPhotoRelease");
  const paperworkFilter = document.getElementById("pmFilterPaperwork");
  const clearFiltersBtn = document.getElementById("pmClearFiltersBtn");
  const quickFilterButtons = document.querySelectorAll(".player-management-quick-filter-btn");

  if (birthYearFilter && !birthYearFilter.dataset.listenerAttached) {
    birthYearFilter.dataset.listenerAttached = "1";
    birthYearFilter.addEventListener("change", () => {
      playerManagementBirthYearFilter = birthYearFilter.value;
      playerManagementPageIndex = 0;
      renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));
    });
  }

  if (genderFilter && !genderFilter.dataset.listenerAttached) {
    genderFilter.dataset.listenerAttached = "1";
    genderFilter.addEventListener("change", () => {
      playerManagementGenderFilter = genderFilter.value;
      playerManagementPageIndex = 0;
      renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));
    });
  }

  if (photoReleaseFilter && !photoReleaseFilter.dataset.listenerAttached) {
    photoReleaseFilter.dataset.listenerAttached = "1";
    photoReleaseFilter.addEventListener("change", () => {
      playerManagementPhotoReleaseFilter = photoReleaseFilter.value;
      playerManagementPageIndex = 0;
      renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));
    });
  }

  if (paperworkFilter && !paperworkFilter.dataset.listenerAttached) {
    paperworkFilter.dataset.listenerAttached = "1";
    paperworkFilter.addEventListener("change", () => {
      playerManagementPaperworkFilter = paperworkFilter.value;
      playerManagementPageIndex = 0;
      renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));
    });
  }

  quickFilterButtons.forEach(button => {
    if (button.dataset.listenerAttached) return;

    button.dataset.listenerAttached = "1";
    button.addEventListener("click", () => {
      const selectedFilter = button.dataset.filter || "";
      playerManagementQuickFilter = playerManagementQuickFilter === selectedFilter ? "" : selectedFilter;
      playerManagementPageIndex = 0;
      updatePlayerManagementQuickFilterButtons();
      renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));
    });
  });

  if (clearFiltersBtn && !clearFiltersBtn.dataset.listenerAttached) {
    clearFiltersBtn.dataset.listenerAttached = "1";
    clearFiltersBtn.addEventListener("click", () => {
      playerManagementBirthYearFilter = "";
      playerManagementPhotoReleaseFilter = "";
      playerManagementPaperworkFilter = "";
      playerManagementGenderFilter = "";
      playerManagementQuickFilter = "";

      if (birthYearFilter) birthYearFilter.value = "";
      if (genderFilter) genderFilter.value = "";
      if (photoReleaseFilter) photoReleaseFilter.value = "";
      if (paperworkFilter) paperworkFilter.value = "";

      playerManagementPageIndex = 0;
      updatePlayerManagementQuickFilterButtons();
      renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));
    });
  }

  updatePlayerManagementQuickCounts();
  updatePlayerManagementQuickFilterButtons();
}

function updatePlayerManagementQuickCounts() {
  const countBox = document.getElementById("playerManagementQuickCounts");

  if (!countBox) return;

  const counts = getPlayerManagementCounts(latestManagedPlayers);

  countBox.textContent =
    `Missing: Paperwork ${counts.paperworkMissing} | Photo Release ${counts.photoReleaseMissing} | Emergency Info ${counts.emergencyInfoMissing}`;
}

function updatePlayerManagementQuickFilterButtons() {
  document.querySelectorAll(".player-management-quick-filter-btn").forEach(button => {
    button.classList.toggle(
      "active-quick-filter",
      button.dataset.filter === playerManagementQuickFilter
    );
  });
}

function getFilteredManagedPlayers(players) {
  return players.filter(player => {
    const birthYearMatches = !playerManagementBirthYearFilter ||
      String(player.BirthYear || player.GroupCode || "") === playerManagementBirthYearFilter;

    const genderMatches = !playerManagementGenderFilter ||
      (player.Gender || "") === playerManagementGenderFilter;

    const photoReleaseMatches = !playerManagementPhotoReleaseFilter ||
      getPhotoReleaseLabel(player) === playerManagementPhotoReleaseFilter;

    const paperworkStatus = player.PaperworkStatus || "Not Received";
    const paperworkMatches = !playerManagementPaperworkFilter ||
      paperworkStatus === playerManagementPaperworkFilter;

    const quickFilterMatches =
      !playerManagementQuickFilter ||
      (playerManagementQuickFilter === "missingPaperwork" && isPaperworkMissing(player)) ||
      (playerManagementQuickFilter === "missingPhotoRelease" && isPhotoReleaseMissing(player)) ||
      (playerManagementQuickFilter === "missingEmergencyInfo" && isEmergencyInfoMissing(player));

    return birthYearMatches && genderMatches && photoReleaseMatches && paperworkMatches && quickFilterMatches;
  });
}

function getPlayerManagementFilterDescription() {
  const parts = [];

  if (playerManagementQuickFilter === "missingPaperwork") {
    parts.push("Missing Paperwork");
  } else if (playerManagementQuickFilter === "missingPhotoRelease") {
    parts.push("Missing Photo Release");
  } else if (playerManagementQuickFilter === "missingEmergencyInfo") {
    parts.push("Missing Emergency Info");
  }

  if (playerManagementBirthYearFilter) {
    parts.push(`Birth Year: ${playerManagementBirthYearFilter}`);
  }

  if (playerManagementGenderFilter) {
    parts.push(`Gender: ${playerManagementGenderFilter}`);
  }

  if (playerManagementPhotoReleaseFilter) {
    parts.push(`Photo Release: ${playerManagementPhotoReleaseFilter}`);
  }

  if (playerManagementPaperworkFilter) {
    parts.push(`Paperwork: ${playerManagementPaperworkFilter}`);
  }

  return parts.length ? ` | Filters: ${parts.join(", ")}` : "";
}

function ensurePlayerManagementForm() {
  if (!addPlayerSection) return;

  if (!canManagePlayers()) {
    addPlayerSection.innerHTML = "";
    addPlayerSection.classList.add("hidden");
    return;
  }

  addPlayerSection.classList.remove("hidden");

  if (!isPlayerManagementFormExpanded && playerManagementMode !== "edit") {
    addPlayerSection.innerHTML = `
      <div class="player-management-collapsed-form">
        <button type="button" id="pmShowAddPlayerFormBtn" class="btn btn-primary">
          Add New Player
        </button>
        <span class="player-management-collapsed-note">Open the form only when adding or editing a player.</span>
      </div>
    `;

    const showFormBtn = document.getElementById("pmShowAddPlayerFormBtn");

    if (showFormBtn) {
      showFormBtn.addEventListener("click", () => {
        isPlayerManagementFormExpanded = true;
        ensurePlayerManagementForm();
      });
    }

    return;
  }

  addPlayerSection.innerHTML = `
    <div class="player-management-form-card">
      <h3 id="playerFormTitle">Add New Player</h3>

      <div class="player-form-section">
        <h4>Player Info</h4>
        <div class="player-form-grid">
          <label>
            Player #
            <input id="pmPlayerNumber" type="number" min="0" placeholder="Player number" />
          </label>

          <label>
            Birth Year
            <select id="pmBirthYear">
              <option value="">Select birth year</option>
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
            <select id="pmGender">
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </label>

          <label>
            First Name
            <input id="pmFirstName" type="text" placeholder="First name" />
          </label>

          <label>
            Last Name
            <input id="pmLastName" type="text" placeholder="Last name" />
          </label>

          <label>
            Date of Birth
            <input id="pmDateOfBirth" type="date" />
          </label>

          <label>
            Start Date
            <input id="pmStartDate" type="date" />
          </label>
        </div>
      </div>

      <div class="player-form-section">
        <h4>Parent Info</h4>
        <div class="player-form-grid">
          <label>
            Parent 1 Name
            <input id="pmParentName" type="text" placeholder="Parent 1 name" />
          </label>

          <label>
            Parent 1 Phone
            <input id="pmParentPhone" type="tel" placeholder="Parent 1 phone" />
          </label>

          <label>
            Parent Email
            <input id="pmParentEmail" type="email" placeholder="Parent email" />
          </label>

          <label>
            Parent 2 Name
            <input id="pmParent2Name" type="text" placeholder="Parent 2 name" />
          </label>

          <label>
            Parent 2 Phone
            <input id="pmParent2Phone" type="tel" placeholder="Parent 2 phone" />
          </label>
        </div>
      </div>

      <div class="player-form-section player-private-section">
        <h4>Emergency / Address Info</h4>
        <p class="player-form-note">This information stays inside Edit Player and is not shown on player cards.</p>

        <div class="player-form-grid">
          <label>
            Street Address
            <input id="pmStreetAddress" type="text" placeholder="Street address" />
          </label>

          <label>
            City
            <input id="pmCity" type="text" placeholder="City" />
          </label>

          <label>
            State
            <input id="pmState" type="text" placeholder="State" />
          </label>

          <label>
            ZIP Code
            <input id="pmZipCode" type="text" placeholder="ZIP code" />
          </label>

          <label>
            Emergency Contact Name
            <input id="pmEmergencyContactName" type="text" placeholder="Emergency contact name" />
          </label>

          <label>
            Emergency Contact Relationship
            <input id="pmEmergencyContactRelationship" type="text" placeholder="Relationship" />
          </label>

          <label>
            Emergency Contact Phone
            <input id="pmEmergencyContactPhone" type="tel" placeholder="Emergency phone" />
          </label>

          <label>
            Emergency Contact Alt Phone
            <input id="pmEmergencyContactAltPhone" type="tel" placeholder="Alternate phone" />
          </label>

          <label class="player-form-wide">
            Emergency Notes
            <textarea id="pmEmergencyNotes" placeholder="Emergency notes, medical notes, or important instructions"></textarea>
          </label>
        </div>
      </div>

      <div class="player-form-section">
        <h4>Snack / Paperwork / Photo Release</h4>
        <div class="player-form-grid">
          <label>
            Snack Preference
            <select id="pmSnackPreference">
              <option value="Bring Snack">Bring Snack</option>
              <option value="Paid Out">Paid Out</option>
            </select>
          </label>

          <label>
            Paperwork Status
            <select id="pmPaperworkStatus">
              <option value="Not Received">Not Received</option>
              <option value="Missing">Missing</option>
              <option value="Complete">Complete</option>
            </select>
          </label>

          <label>
            Photo Release Status
            <select id="pmPhotoReleaseStatus">
              <option value="Not Received">Not Received</option>
              <option value="Opt In">Opt In</option>
              <option value="Opt Out">Opt Out</option>
            </select>
          </label>

          <label>
            Photo Release Form Received
            <select id="pmPhotoReleaseFormReceived">
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </label>
        </div>
      </div>

      <div class="player-form-section">
        <h4>Status</h4>
        <div class="player-form-grid">
          <label>
            Active Status
            <select id="pmIsActive">
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </label>

          <label>
            End Date
            <input id="pmEndDate" type="date" />
          </label>
        </div>
      </div>

      <div class="player-form-actions">
        <button type="button" id="pmSavePlayerBtn" class="btn btn-primary">
          Add Player
        </button>

        <button type="button" id="pmCancelEditBtn" class="btn btn-secondary hidden">
          Cancel Edit
        </button>
      </div>

      <p id="pmPlayerMessage" class="form-message"></p>
    </div>
  `;

  const saveBtn = document.getElementById("pmSavePlayerBtn");
  const cancelBtn = document.getElementById("pmCancelEditBtn");
  const birthYearInput = document.getElementById("pmBirthYear");
  const dobInput = document.getElementById("pmDateOfBirth");

  if (saveBtn) {
    saveBtn.addEventListener("click", savePlayerManagementForm);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", resetPlayerManagementForm);
  }

  if (birthYearInput && dobInput) {
    birthYearInput.addEventListener("change", () => {
      if (!dobInput.value && birthYearInput.value) {
        dobInput.value = `${birthYearInput.value}-01-01`;
      }
    });
  }

  resetPlayerManagementForm(false);
}

function setPlayerManagementMessage(text, isError = false) {
  const message = document.getElementById("pmPlayerMessage");

  if (message) {
    message.textContent = text;
    message.style.color = isError ? "#c62828" : "#2e7d32";
  }

  if (addPlayerMessage) {
    addPlayerMessage.textContent = text;
    addPlayerMessage.style.color = isError ? "#c62828" : "#2e7d32";
  }
}

function getPlayerFormPayload() {
  const playerNumberInput = document.getElementById("pmPlayerNumber");
  const firstNameInput = document.getElementById("pmFirstName");
  const lastNameInput = document.getElementById("pmLastName");
  const birthYearInput = document.getElementById("pmBirthYear");
  const dateOfBirthInput = document.getElementById("pmDateOfBirth");
  const genderInput = document.getElementById("pmGender");
  const parentNameInput = document.getElementById("pmParentName");
  const parentPhoneInput = document.getElementById("pmParentPhone");
  const parentEmailInput = document.getElementById("pmParentEmail");
  const parent2NameInput = document.getElementById("pmParent2Name");
  const parent2PhoneInput = document.getElementById("pmParent2Phone");
  const streetAddressInput = document.getElementById("pmStreetAddress");
  const cityInput = document.getElementById("pmCity");
  const stateInput = document.getElementById("pmState");
  const zipCodeInput = document.getElementById("pmZipCode");
  const emergencyContactNameInput = document.getElementById("pmEmergencyContactName");
  const emergencyContactRelationshipInput = document.getElementById("pmEmergencyContactRelationship");
  const emergencyContactPhoneInput = document.getElementById("pmEmergencyContactPhone");
  const emergencyContactAltPhoneInput = document.getElementById("pmEmergencyContactAltPhone");
  const emergencyNotesInput = document.getElementById("pmEmergencyNotes");
  const snackPreferenceInput = document.getElementById("pmSnackPreference");
  const paperworkStatusInput = document.getElementById("pmPaperworkStatus");
  const photoReleaseStatusInput = document.getElementById("pmPhotoReleaseStatus");
  const photoReleaseFormReceivedInput = document.getElementById("pmPhotoReleaseFormReceived");
  const startDateInput = document.getElementById("pmStartDate");
  const endDateInput = document.getElementById("pmEndDate");
  const isActiveInput = document.getElementById("pmIsActive");

  const birthYear = birthYearInput ? birthYearInput.value : "";

  const dateOfBirth =
    dateOfBirthInput && dateOfBirthInput.value
      ? dateOfBirthInput.value
      : birthYear
        ? `${birthYear}-01-01`
        : "";

  return {
    playerNumber:
      playerNumberInput && playerNumberInput.value !== ""
        ? Number(playerNumberInput.value)
        : null,

    firstName: firstNameInput ? firstNameInput.value.trim() : "",
    lastName: lastNameInput ? lastNameInput.value.trim() : "",
    birthYear: birthYear ? Number(birthYear) : null,
    dateOfBirth,
    gender: genderInput ? genderInput.value : "",

    parentName: parentNameInput ? parentNameInput.value.trim() : "",
    parentPhone: parentPhoneInput ? parentPhoneInput.value.trim() : "",
    parentEmail: parentEmailInput ? parentEmailInput.value.trim() : "",
    parent2Name: parent2NameInput ? parent2NameInput.value.trim() : "",
    parent2Phone: parent2PhoneInput ? parent2PhoneInput.value.trim() : "",

    streetAddress: streetAddressInput ? streetAddressInput.value.trim() : "",
    city: cityInput ? cityInput.value.trim() : "",
    state: stateInput ? stateInput.value.trim() : "",
    zipCode: zipCodeInput ? zipCodeInput.value.trim() : "",
    emergencyContactName: emergencyContactNameInput ? emergencyContactNameInput.value.trim() : "",
    emergencyContactRelationship: emergencyContactRelationshipInput ? emergencyContactRelationshipInput.value.trim() : "",
    emergencyContactPhone: emergencyContactPhoneInput ? emergencyContactPhoneInput.value.trim() : "",
    emergencyContactAltPhone: emergencyContactAltPhoneInput ? emergencyContactAltPhoneInput.value.trim() : "",
    emergencyNotes: emergencyNotesInput ? emergencyNotesInput.value.trim() : "",

    snackPreference: snackPreferenceInput ? snackPreferenceInput.value : "Bring Snack",
    paperworkStatus: paperworkStatusInput ? paperworkStatusInput.value : "Not Received",
    photoReleaseStatus: photoReleaseStatusInput ? photoReleaseStatusInput.value : "Not Received",
    photoReleaseFormReceived: photoReleaseFormReceivedInput ? photoReleaseFormReceivedInput.value === "1" : false,

    startDate: startDateInput ? startDateInput.value || null : null,
    endDate: endDateInput ? endDateInput.value || null : null,

    isActive: isActiveInput ? isActiveInput.value === "1" : true
  };
}

function validatePlayerPayload(payload) {
  if (!payload.firstName || !payload.lastName || !payload.birthYear) {
    return "First name, last name, and birth year are required.";
  }

  if (payload.birthYear < 2012 || payload.birthYear > 2021) {
    return "Birth year must be between 2012 and 2021.";
  }

  return "";
}

async function savePlayerManagementForm() {
  if (!canManagePlayers()) {
    setPlayerManagementMessage(
      "Access denied. Only Admin and Team Mom can manage players.",
      true
    );
    return;
  }

  const payload = getPlayerFormPayload();
  const validationMessage = validatePlayerPayload(payload);

  if (validationMessage) {
    setPlayerManagementMessage(validationMessage, true);
    return;
  }

  const isEditMode = playerManagementMode === "edit" && editingPlayerId;

  const url = isEditMode
    ? `${API_BASE}/players/${editingPlayerId}`
    : `${API_BASE}/players`;

  const method = isEditMode ? "PUT" : "POST";

  try {
    setPlayerManagementMessage(
      isEditMode ? "Saving player changes..." : "Adding player...",
      false
    );

    setPlayerManagementSavingState(true);

    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      if (res.status === 401) {
        setPlayerManagementMessage("Session expired. Please login again.", true);
      } else if (res.status === 403) {
        setPlayerManagementMessage("Access denied.", true);
      } else {
        setPlayerManagementMessage(data.message || "Could not save player.", true);
      }

      return;
    }

    setPlayerManagementMessage(
      isEditMode ? "✅ Player updated successfully." : "✅ Player added successfully.",
      false
    );

    resetPlayerManagementForm(false);
    await loadPlayerManagementList();

    if (currentTab !== "Player Management") {
      await loadPlayers();
    }

  } catch (err) {
    console.error("Save player error:", err);
    setPlayerManagementMessage("Server error saving player.", true);
  } finally {
    setPlayerManagementSavingState(false);
  }
}

function resetPlayerManagementForm(clearMessage = true) {
  playerManagementMode = "add";
  editingPlayerId = null;
  isPlayerManagementFormExpanded = false;

  const title = document.getElementById("playerFormTitle");
  const saveBtn = document.getElementById("pmSavePlayerBtn");
  const cancelBtn = document.getElementById("pmCancelEditBtn");

  if (title) title.textContent = "Add New Player";
  if (saveBtn) saveBtn.textContent = "Add Player";
  if (cancelBtn) cancelBtn.classList.add("hidden");

  const today = new Date().toISOString().split("T")[0];

  const fieldDefaults = {
    pmPlayerNumber: "",
    pmBirthYear: "",
    pmGender: "",
    pmFirstName: "",
    pmLastName: "",
    pmDateOfBirth: "",
    pmStartDate: today,
    pmParentName: "",
    pmParentPhone: "",
    pmParentEmail: "",
    pmParent2Name: "",
    pmParent2Phone: "",
    pmStreetAddress: "",
    pmCity: "",
    pmState: "",
    pmZipCode: "",
    pmEmergencyContactName: "",
    pmEmergencyContactRelationship: "",
    pmEmergencyContactPhone: "",
    pmEmergencyContactAltPhone: "",
    pmEmergencyNotes: "",
    pmSnackPreference: "Bring Snack",
    pmPaperworkStatus: "Not Received",
    pmPhotoReleaseStatus: "Not Received",
    pmPhotoReleaseFormReceived: "0",
    pmIsActive: "1",
    pmEndDate: ""
  };

  Object.entries(fieldDefaults).forEach(([id, value]) => {
    const element = document.getElementById(id);

    if (element) {
      element.value = value;
    }
  });

  if (clearMessage) {
    setPlayerManagementMessage("", false);
    ensurePlayerManagementForm();
  }
}

function editPlayer(playerId) {
  const player = latestManagedPlayers.find(
    item => Number(item.PlayerID) === Number(playerId)
  );

  if (!player) {
    alert("Player not found in current list.");
    return;
  }

  playerManagementMode = "edit";
  editingPlayerId = player.PlayerID;
  isPlayerManagementFormExpanded = true;
  ensurePlayerManagementForm();

  const title = document.getElementById("playerFormTitle");
  const saveBtn = document.getElementById("pmSavePlayerBtn");
  const cancelBtn = document.getElementById("pmCancelEditBtn");

  if (title) title.textContent = `Edit Player: ${player.FirstName} ${player.LastName}`;
  if (saveBtn) saveBtn.textContent = "Save Changes";
  if (cancelBtn) cancelBtn.classList.remove("hidden");

  const values = {
    pmPlayerNumber: safeValue(player.PlayerNumber),
    pmBirthYear: safeValue(player.BirthYear || player.GroupCode || ""),
    pmGender: safeValue(player.Gender || ""),
    pmFirstName: safeValue(player.FirstName),
    pmLastName: safeValue(player.LastName),
    pmDateOfBirth: formatDateForInput(player.DateOfBirth),
    pmStartDate: formatDateForInput(player.StartDate),
    pmParentName: safeValue(player.ParentName),
    pmParentPhone: safeValue(player.ParentPhone),
    pmParentEmail: safeValue(player.ParentEmail),
    pmParent2Name: safeValue(player.Parent2Name),
    pmParent2Phone: safeValue(player.Parent2Phone),
    pmStreetAddress: safeValue(player.StreetAddress),
    pmCity: safeValue(player.City),
    pmState: safeValue(player.State),
    pmZipCode: safeValue(player.ZipCode),
    pmEmergencyContactName: safeValue(player.EmergencyContactName),
    pmEmergencyContactRelationship: safeValue(player.EmergencyContactRelationship),
    pmEmergencyContactPhone: safeValue(player.EmergencyContactPhone),
    pmEmergencyContactAltPhone: safeValue(player.EmergencyContactAltPhone),
    pmEmergencyNotes: safeValue(player.EmergencyNotes),
    pmSnackPreference: player.SnackPreference === "Paid Out" ? "Paid Out" : "Bring Snack",
    pmPaperworkStatus:
      player.PaperworkStatus === "Complete" ||
      player.PaperworkStatus === "Missing" ||
      player.PaperworkStatus === "Not Received"
        ? player.PaperworkStatus
        : "Not Received",
    pmPhotoReleaseStatus:
      player.PhotoReleaseStatus === "Opt In" ||
      player.PhotoReleaseStatus === "Opt Out" ||
      player.PhotoReleaseStatus === "Not Received"
        ? player.PhotoReleaseStatus
        : "Not Received",
    pmPhotoReleaseFormReceived: player.PhotoReleaseFormReceived ? "1" : "0",
    pmIsActive: player.IsActive ? "1" : "0",
    pmEndDate: formatDateForInput(player.EndDate)
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);

    if (element) {
      element.value = value;
    }
  });

  setPlayerManagementMessage(
    "Editing player. Make changes, then click Save Changes.",
    false
  );

  if (addPlayerSection) {
    addPlayerSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function loadPlayerManagementList() {
  if (!playerManagementList) return;

  ensurePlayerManagementForm();
  ensurePlayerManagementFilters();

  const searchText = playerSearchInput ? playerSearchInput.value.trim() : "";
  const includeInactive =
    showInactivePlayersToggle && showInactivePlayersToggle.checked;

  const params = new URLSearchParams();

  if (searchText) {
    params.set("search", searchText);
  }

  if (includeInactive) {
    params.set("includeInactive", "1");
  }

  const url = params.toString()
    ? `${API_BASE}/players/manage?${params.toString()}`
    : `${API_BASE}/players/manage`;

  try {
    playerManagementList.innerHTML = `
      <div class="roster-empty-message">Loading players...</div>
    `;

    const res = await fetch(url, {
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      playerManagementList.innerHTML = `
        <div class="roster-empty-message">Could not load players.</div>
      `;
      return;
    }

    latestManagedPlayers = data.players || [];
    playerManagementPageIndex = 0;
    updatePlayerManagementQuickCounts();
    renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));

  } catch (err) {
    console.error("Player management load error:", err);

    playerManagementList.innerHTML = `
      <div class="roster-empty-message">Could not load players.</div>
    `;
  }
}

function renderPlayerManagementList(players) {
  if (!playerManagementList) return;

  const activeCount = players.filter(player => player.IsActive).length;
  const inactiveCount = players.filter(player => !player.IsActive).length;
  const totalPlayers = players.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalPlayers / PLAYER_MANAGEMENT_PAGE_SIZE)
  );

  if (playerManagementPageIndex < 0) {
    playerManagementPageIndex = 0;
  }

  if (playerManagementPageIndex > totalPages - 1) {
    playerManagementPageIndex = totalPages - 1;
  }

  const startIndex = playerManagementPageIndex * PLAYER_MANAGEMENT_PAGE_SIZE;
  const endIndex = Math.min(startIndex + PLAYER_MANAGEMENT_PAGE_SIZE, totalPlayers);
  const visiblePlayers = players.slice(startIndex, endIndex);

  if (playerManagementSummary) {
    const filteredCount = players.length;
    const totalRosterCount = latestManagedPlayers.length;
    const filterDescription = getPlayerManagementFilterDescription();

    playerManagementSummary.textContent =
      `Active: ${activeCount} | Inactive: ${inactiveCount} | Showing ${totalPlayers ? startIndex + 1 : 0}-${endIndex} of ${filteredCount} filtered / ${totalRosterCount} total${filterDescription}`;
  }

  playerManagementList.innerHTML = "";

  if (!players.length) {
    playerManagementList.innerHTML = `
      <div class="roster-empty-message">No players found.</div>
    `;
    return;
  }

  const nav = document.createElement("div");
  nav.className = "player-card-scroll-nav";

  nav.innerHTML = `
    <button type="button" class="btn btn-secondary" id="playerCardsPrevBtn" ${playerManagementPageIndex === 0 ? "disabled" : ""}>
      ← Previous 10
    </button>

    <span class="player-card-page-label">
      Showing ${startIndex + 1}-${endIndex} of ${totalPlayers}
    </span>

    <button type="button" class="btn btn-secondary" id="playerCardsNextBtn" ${playerManagementPageIndex >= totalPages - 1 ? "disabled" : ""}>
      Next 10 →
    </button>
  `;

  playerManagementList.appendChild(nav);

  const scrollRow = document.createElement("div");
  scrollRow.className = "player-card-scroll-row";

  visiblePlayers.forEach(player => {
    const card = document.createElement("div");

    card.className =
      `player-management-row player-management-card-scroll-item ${player.IsActive ? "" : "inactive-player"}`;

    const groupLabel = player.GroupName || player.GroupCode || "No Group";

    const playerNumber =
      player.PlayerNumber === 0 || player.PlayerNumber
        ? `#${player.PlayerNumber}`
        : "No #";

    const statusLabel = getPlayerStatusLabel(player);
    const canToggle = canManagePlayers();
    const photoReleaseLabel = getPhotoReleaseLabel(player);

    const parentLine = [
      player.ParentName || "No parent info entered",
      player.ParentPhone || "",
      player.ParentEmail || ""
    ].filter(Boolean).join(" | ");

    const snackLabel = player.SnackPreference || "Bring Snack";
    const paperworkLabel = player.PaperworkStatus || "Not Received";

    card.innerHTML = `
      <div class="player-management-info">
        <div class="player-management-name">${player.FirstName} ${player.LastName}</div>
        <div class="player-management-meta player-management-topline">${playerNumber} | Group: ${groupLabel} | Birth Year: ${player.BirthYear || "-"}</div>
        <div class="player-management-card-line"><strong>Gender:</strong> ${player.Gender || "Not set"}</div>
        <div class="player-management-card-line"><strong>Parent:</strong> ${parentLine}</div>
        <div class="player-management-card-line"><strong>Snack:</strong> ${snackLabel}</div>
        <div class="player-management-card-line"><strong>Paperwork:</strong> ${paperworkLabel}</div>
        <div class="player-management-card-line"><strong>Photo Release:</strong> ${photoReleaseLabel}</div>
        <div class="player-management-card-line"><strong>Last Updated:</strong> ${formatPlayerUpdatedAt(player.UpdatedAt)}</div>
        <div class="player-management-status ${player.IsActive ? "active-status" : "inactive-status"}">${statusLabel}</div>
      </div>

      <div class="player-management-actions">
        ${canToggle
          ? `
            <button type="button" class="btn btn-secondary player-edit-btn" data-player-id="${player.PlayerID}">
              Edit
            </button>

            <button type="button" class="btn btn-secondary player-status-toggle" data-player-id="${player.PlayerID}" data-is-active="${player.IsActive ? "1" : "0"}">
              ${player.IsActive ? "Make Inactive" : "Make Active"}
            </button>
          `
          : ""}
      </div>
    `;

    scrollRow.appendChild(card);
  });

  playerManagementList.appendChild(scrollRow);

  const prevBtn = document.getElementById("playerCardsPrevBtn");
  const nextBtn = document.getElementById("playerCardsNextBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      playerManagementPageIndex -= 1;
      renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      playerManagementPageIndex += 1;
      renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));
    });
  }

  playerManagementList.querySelectorAll(".player-edit-btn").forEach(button => {
    button.addEventListener("click", () => {
      editPlayer(Number(button.dataset.playerId));
    });
  });

  playerManagementList.querySelectorAll(".player-status-toggle").forEach(button => {
    button.addEventListener("click", async () => {
      const playerId = Number(button.dataset.playerId);
      const isCurrentlyActive = button.dataset.isActive === "1";

      await updatePlayerActiveStatus(playerId, !isCurrentlyActive);
    });
  });
}

async function updatePlayerActiveStatus(playerId, makeActive) {
  if (!playerId) return;

  const confirmed = confirm(
    makeActive
      ? "Make this player active again?"
      : "Make this player inactive? They will no longer appear in attendance lists."
  );

  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE}/players/${playerId}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        isActive: makeActive
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.message || "Could not update player status.");
      return;
    }

    await loadPlayerManagementList();

  } catch (err) {
    console.error("Update player status error:", err);
    alert("Could not update player status.");
  }
}

/* =========================
   ADD PLAYER

   This wrapper keeps the existing Add Player button compatible.
   The new Player Management form uses savePlayerManagementForm().
   ========================= */
async function addPlayer() {
  await savePlayerManagementForm();
}


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
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include"
    });

    const data = await res.json();

    if (res.ok && data.success) {
      currentUser = data.user;
      localStorage.setItem("attendanceUser", JSON.stringify(currentUser));
      await showApp();
      return;
    }

    localStorage.removeItem("attendanceUser");

  } catch (err) {
    console.error("Restore session error:", err);
    localStorage.removeItem("attendanceUser");
  }
}

/* =========================
   START APP
   ========================= */
loadVersionDisplay();
restoreSession();