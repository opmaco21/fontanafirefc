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

const saveAttendanceBtn = document.getElementById("saveAttendanceBtn");
const cancelEventBtn = document.getElementById("cancelEventBtn");
const restoreEventBtn = document.getElementById("restoreEventBtn");
const attendanceMessage = document.getElementById("attendanceMessage");

const addPlayerBtn = document.getElementById("addPlayerBtn");
const addPlayerMessage = document.getElementById("addPlayerMessage");
const addPlayerSection = document.getElementById("addPlayerSection");

const teamEventSection = document.getElementById("teamEventSection");
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

if (eventSelect) {
  eventSelect.addEventListener("change", async () => {
    saveSelectedEvent();
    updateEventActionButtons();
    await loadAttendanceForEvent();
  });
}

if (addPlayerBtn) {
  addPlayerBtn.addEventListener("click", addPlayer);
}

if (addTeamEventBtn) {
  addTeamEventBtn.addEventListener("click", addTeamEvent);
}

if (groupSelect) {
  groupSelect.addEventListener("change", async () => {
    await loadEvents();
    await loadPlayers();
    clearPlayerAttendanceSelections();
  });
}

if (practiceTab) {
  practiceTab.addEventListener("click", async () => {
    currentTab = "Practice";
    setActiveTab();
    await loadEvents();
    clearPlayerAttendanceSelections();
  });
}

if (gamesTab) {
  gamesTab.addEventListener("click", async () => {
    currentTab = "Game";
    setActiveTab();
    await loadEvents();
    clearPlayerAttendanceSelections();
  });
}

if (teamEventsTab) {
  teamEventsTab.addEventListener("click", async () => {
    currentTab = "Team Event";
    setActiveTab();
    await loadEvents();
    clearPlayerAttendanceSelections();
  });
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

  await loadGroups();
  await loadEvents();
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
  if (!practiceTab || !gamesTab || !teamEventsTab) return;

  practiceTab.classList.remove("active");
  gamesTab.classList.remove("active");
  teamEventsTab.classList.remove("active");

  if (currentTab === "Practice") {
    practiceTab.classList.add("active");
  } else if (currentTab === "Game") {
    gamesTab.classList.add("active");
  } else if (currentTab === "Team Event") {
    teamEventsTab.classList.add("active");
  }

  updateTeamEventSection();
}

/* =========================
   SHOW / HIDE TEAM EVENT FORM
   ========================= */
function updateTeamEventSection() {
  if (!teamEventSection) return;

  const canAddTeamEvents =
    currentUser &&
    currentUser.RoleName !== "MainCoach";

  if (currentTab === "Team Event" && canAddTeamEvents) {
    teamEventSection.classList.remove("hidden");
  } else {
    teamEventSection.classList.add("hidden");
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
   UPDATE EVENT ACTION BUTTONS

   Purpose:
   - Scheduled events show Cancel Event.
   - Cancelled events show Restore Event.
   - No selected event hides both.
   ========================= */
function updateEventActionButtons() {
  if (!eventSelect) return;

  const selectedOption = eventSelect.options[eventSelect.selectedIndex];
  const eventStatus = selectedOption ? selectedOption.dataset.eventStatus : "";

  if (cancelEventBtn) {
    cancelEventBtn.classList.add("hidden");
  }

  if (restoreEventBtn) {
    restoreEventBtn.classList.add("hidden");
  }

  if (!eventSelect.value || !eventStatus) {
    return;
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
}

/* =========================
   LOAD PLAYERS
   ========================= */
async function loadPlayers() {
  try {
    const selectedGroupId = groupSelect ? groupSelect.value : "";

    let playersUrl = `${API_BASE}/players`;

    if (selectedGroupId) {
      playersUrl += `?groupId=${encodeURIComponent(selectedGroupId)}`;
    }

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

    players.forEach(player => {
      const row = document.createElement("div");
      row.className = "player-row";
      row.dataset.status = "";

      row.innerHTML = `
        <span>${player.FirstName} ${player.LastName}</span>

        <select data-player-id="${player.PlayerID}">
          <option value="">Select</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Excused">Excused</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Clear">Remove / Reset</option>
        </select>
      `;

      const select = row.querySelector("select");

      if (select) {
        select.addEventListener("change", () => {
          row.dataset.status = select.value;
          saveAttendanceDraft();
          updateAttendanceDisplay();

          if (attendanceMessage) {
            if (select.value === "Clear") {
              setMessage(
                attendanceMessage,
                "Reset selected. Submit attendance to remove this saved status.",
                false
              );
            } else {
              setMessage(attendanceMessage, "Draft saved automatically.", false);
            }
          }
        });
      }

      playerList.appendChild(row);
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
        await loadAttendanceForEvent();
        return;
      }
    }

    if (eventSelect && eventSelect.value) {
      updateEventActionButtons();
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
  const selects = document.querySelectorAll(
    "#playerList select, #completedPlayerList select"
  );

  selects.forEach(select => {
    select.value = "";

    const row = select.closest(".player-row");

    if (row) {
      row.dataset.status = "";
      row.classList.remove(
        "status-present",
        "status-absent",
        "status-excused",
        "status-cancelled",
        "status-clear"
      );
    }
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

  const selects = document.querySelectorAll(
    "#playerList select, #completedPlayerList select"
  );

  const draft = {};

  selects.forEach(select => {
    const playerId = select.dataset.playerId;
    const status = select.value;

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

    const selects = document.querySelectorAll(
      "#playerList select, #completedPlayerList select"
    );

    selects.forEach(select => {
      const playerId = select.dataset.playerId;

      if (Object.prototype.hasOwnProperty.call(draft, playerId)) {
        select.value = draft[playerId];

        const row = select.closest(".player-row");

        if (row) {
          row.dataset.status = select.value;
        }
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
  if (!eventSelect || !eventSelect.value) return;
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

    const playerSelects = document.querySelectorAll(
      "#playerList select, #completedPlayerList select"
    );

    playerSelects.forEach(select => {
      const playerId = select.dataset.playerId;

      if (attendanceMap[playerId]) {
        select.value = attendanceMap[playerId];
      }

      const row = select.closest(".player-row");

      if (row) {
        row.dataset.status = select.value;
      }
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

  const allRows = Array.from(
    document.querySelectorAll("#playerList .player-row, #completedPlayerList .player-row")
  );

  let present = 0;
  let absent = 0;
  let excused = 0;
  let cancelled = 0;
  let remaining = 0;
  let completed = 0;

  allRows.forEach(row => {
    const select = row.querySelector("select");
    const status = select ? select.value : "";

    row.dataset.status = status;
    row.classList.remove(
      "status-present",
      "status-absent",
      "status-excused",
      "status-cancelled",
      "status-clear"
    );

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
    const select = row.querySelector("select");
    const status = select ? select.value : "";

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

    showCompletedBtn.textContent = completedHidden
      ? `Show Completed Attendance (${completed})`
      : `Hide Completed Attendance (${completed})`;
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

  const rows = document.querySelectorAll(
    "#playerList select, #completedPlayerList select"
  );

  const attendance = [];

  rows.forEach(row => {
    const playerId = row.dataset.playerId;
    const status = row.value;

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
      "Select Present, Absent, Excused, Cancelled, or Remove / Reset for at least one player.",
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

  const selectedGroupIds = getSelectedTeamEventGroupIds();

  const eventName = newTeamEventName ? newTeamEventName.value.trim() : "";
  const eventDate = newTeamEventDate ? newTeamEventDate.value : "";
  const startTime = newTeamEventStartTime ? newTeamEventStartTime.value : "";
  const endTime = newTeamEventEndTime ? newTeamEventEndTime.value : "";
  const locationName = newTeamEventLocation ? newTeamEventLocation.value.trim() : "";
  const notes = newTeamEventNotes ? newTeamEventNotes.value.trim() : "";

  if (selectedGroupIds.length === 0 || !eventName || !eventDate) {
    setMessage(
      teamEventMessage,
      "Select at least one group and enter an event name and date.",
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
        groupIds: selectedGroupIds,
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

    clearTeamEventGroupSelections();

    /*
      If one group was selected, move to that group.
      If multiple groups were selected, move to All Groups
      so the grouped Team Event appears as one dropdown option.
    */
    if (groupSelect) {
      groupSelect.value =
        selectedGroupIds.length === 1
          ? String(selectedGroupIds[0])
          : "";
    }

    const createdCount = data.createdEvents || selectedGroupIds.length;

    setMessage(
      teamEventMessage,
      createdCount === 1
        ? "✅ Team event added."
        : `✅ Team event added for ${createdCount} groups.`,
      false
    );

    await loadEvents();
    await loadPlayers();

  } catch (err) {
    console.error("Add team event error:", err);
    setMessage(teamEventMessage, "Server error adding team event.", true);
  }
}

/* =========================
   ADD PLAYER

   Purpose:
   - Adds a player using first name, last name, and birth year only.
   - Backend automatically finds the correct age group.
   - Full DOB will be synced later from Excel.
   ========================= */
async function addPlayer() {
  if (addPlayerMessage) {
    addPlayerMessage.textContent = "";
  }

  if (currentUser && currentUser.RoleName === "MainCoach") {
    setMessage(
      addPlayerMessage,
      "Access denied. Only Admin and Team Mom can add players.",
      true
    );
    return;
  }

  const firstNameInput = document.getElementById("newFirstName");
  const lastNameInput = document.getElementById("newLastName");
  const birthYearInput = document.getElementById("newBirthYear");

  const firstName = firstNameInput ? firstNameInput.value.trim() : "";
  const lastName = lastNameInput ? lastNameInput.value.trim() : "";
  const birthYear = birthYearInput ? birthYearInput.value : "";

  if (!firstName || !lastName || !birthYear) {
    setMessage(
      addPlayerMessage,
      "Enter first name, last name, and birth year.",
      true
    );
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/players`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        firstName,
        lastName,
        birthYear: Number(birthYear)
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      if (res.status === 401) {
        setMessage(addPlayerMessage, "Session expired. Please login again.", true);
      } else if (res.status === 403) {
        setMessage(addPlayerMessage, "Access denied.", true);
      } else {
        setMessage(addPlayerMessage, data.message || "Could not add player.", true);
      }
      return;
    }

    if (firstNameInput) firstNameInput.value = "";
    if (lastNameInput) lastNameInput.value = "";
    if (birthYearInput) birthYearInput.value = "";

    setMessage(
      addPlayerMessage,
      `✅ Player added to ${data.player.GroupName} age group.`,
      false
    );

    await loadPlayers();

  } catch (err) {
    console.error("Add player error:", err);
    setMessage(addPlayerMessage, "Server error adding player.", true);
  }
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