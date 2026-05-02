/* =========================================================
   FONTANA FIRE FC ATTENDANCE APP
   Frontend JavaScript
   ========================================================= */

/* =========================
   API SETTINGS
   ========================= */
const API_BASE = "http://192.168.1.174:3000/api";

/* =========================
   HTML ELEMENT REFERENCES
   ========================= */
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");

const loginMessage = document.getElementById("loginMessage");
const welcomeText = document.getElementById("welcomeText");
const roleText = document.getElementById("roleText");

const groupSelect = document.getElementById("groupSelect");
const eventSelect = document.getElementById("eventSelect");

const practiceTab = document.getElementById("practiceTab");
const gamesTab = document.getElementById("gamesTab");

const saveAttendanceBtn = document.getElementById("saveAttendanceBtn");
const attendanceMessage = document.getElementById("attendanceMessage");

const addPlayerBtn = document.getElementById("addPlayerBtn");
const addPlayerMessage = document.getElementById("addPlayerMessage");

/* =========================
   APP STATE
   ========================= */
let currentUser = null;
let currentTab = "Practice"; // Practice or Game

/* =========================
   EVENT LISTENERS
   ========================= */
loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);
saveAttendanceBtn.addEventListener("click", saveAttendance);

if (addPlayerBtn) {
  addPlayerBtn.addEventListener("click", addPlayer);
}

if (groupSelect) {
  groupSelect.addEventListener("change", loadEvents);
}

if (practiceTab) {
  practiceTab.addEventListener("click", () => {
    currentTab = "Practice";
    setActiveTab();
    loadEvents();
  });
}

if (gamesTab) {
  gamesTab.addEventListener("click", () => {
    currentTab = "Game";
    setActiveTab();
    loadEvents();
  });
}

/* =========================
   MESSAGE HELPER
   Shows green success or red error text
   ========================= */
function setMessage(el, text, isError = false) {
  if (!el) return;

  el.textContent = text;
  el.style.color = isError ? "#c62828" : "#2e7d32";
}

/* =========================
   LOGIN
   Sends email/password to backend
   ========================= */
async function login() {
  loginMessage.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    setMessage(loginMessage, "Enter email and password.", true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
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

    showApp();
  } catch (err) {
    setMessage(loginMessage, "Could not connect to server.", true);
  }
}

/* =========================
   SHOW MAIN APP AFTER LOGIN
   Loads groups, events, and players
   ========================= */
async function showApp() {
  welcomeText.textContent = `Welcome, ${currentUser.FullName}`;
  roleText.textContent = `${currentUser.RoleName}`;

  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");

  setActiveTab();

  await loadGroups();
  await loadEvents();
  await loadPlayers();
}

/* =========================
   LOAD GROUPS
   Groups stay available for future filtering
   ========================= */
async function loadGroups() {
  if (!groupSelect) return;

  groupSelect.innerHTML = `<option value="">All Groups</option>`;

  try {
    const res = await fetch(`${API_BASE}/groups`);
    const groups = await res.json();

    groups.forEach(group => {
      const option = document.createElement("option");
      option.value = group.GroupID;
      option.textContent = group.GroupName;
      groupSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load groups", err);
  }
}

/* =========================
   SET ACTIVE TAB STYLE
   Practice button or Games button
   ========================= */
function setActiveTab() {
  if (!practiceTab || !gamesTab) return;

  practiceTab.classList.remove("active");
  gamesTab.classList.remove("active");

  if (currentTab === "Practice") {
    practiceTab.classList.add("active");
  } else {
    gamesTab.classList.add("active");
  }
}

/* =========================
   LOAD EVENTS
   Practice tab: Monday / Wednesday practices
   Games tab: Friday / Saturday / Sunday games
   Optional group dropdown still filters by GroupID
   ========================= */
async function loadEvents() {
  eventSelect.innerHTML = `<option value="">Select event</option>`;

  try {
    const res = await fetch(`${API_BASE}/events`);
    const events = await res.json();

    const selectedGroupId = groupSelect ? groupSelect.value : "";

    const filteredEvents = events.filter(event => {
      const eventDate = new Date(event.EventDate);
      const day = eventDate.getDay();

      const matchesGroup =
        !selectedGroupId || String(event.GroupID) === String(selectedGroupId);

      const isPractice =
        event.EventType === "Practice" && (day === 1 || day === 3);

      const isGame =
        event.EventType === "Game" && (day === 5 || day === 6 || day === 0);

      if (currentTab === "Practice") {
        return matchesGroup && isPractice;
      }

      if (currentTab === "Game") {
        return matchesGroup && isGame;
      }

      return matchesGroup;
    });

    filteredEvents.forEach(event => addEventOption(event));
  } catch (err) {
    console.error("Failed to load events", err);
  }
}

/* =========================
   ADD EVENT TO DROPDOWN
   ========================= */
function addEventOption(event) {
  const option = document.createElement("option");
  option.value = event.EventID;

  const eventDate = new Date(event.EventDate).toLocaleDateString();

  option.textContent =
    `${eventDate} - ${event.EventType} - ${event.EventStatus}`;

  eventSelect.appendChild(option);
}

/* =========================
   LOAD PLAYERS
   Loads all active players by default
   ========================= */
async function loadPlayers() {
  try {
    const res = await fetch(`${API_BASE}/players`);
    const players = await res.json();

    const playerList = document.getElementById("playerList");

    if (!playerList) {
      console.warn("Missing element: playerList");
      return;
    }

    playerList.innerHTML = "";

    players.forEach(player => {
      const row = document.createElement("div");
      row.className = "player-row";

      row.innerHTML = `
        <span>${player.FirstName} ${player.LastName}</span>

        <select data-player-id="${player.PlayerID}">
          <option value="">Select</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Excused">Excused</option>
        </select>
      `;

      playerList.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load players", err);
  }
}

/* =========================
   SAVE / UPDATE ATTENDANCE
   Same EventID + PlayerID updates existing record
   ========================= */
async function saveAttendance() {
  attendanceMessage.textContent = "";

  const eventId = eventSelect.value;

  if (!eventId) {
    setMessage(attendanceMessage, "Select an event first.", true);
    return;
  }

  const rows = document.querySelectorAll("#playerList select");
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
    setMessage(attendanceMessage, "Select attendance for at least one player.", true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/attendance`, {
      method: "POST",
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

    setMessage(attendanceMessage, "✅ Attendance saved / updated.", false);
  } catch (err) {
    setMessage(attendanceMessage, "Could not save attendance.", true);
  }
}

/* =========================
   ADD PLAYER
   Adds a new active player using first and last name
   ========================= */
async function addPlayer() {
  addPlayerMessage.textContent = "";

  const firstName = document.getElementById("newFirstName").value.trim();
  const lastName = document.getElementById("newLastName").value.trim();

  if (!firstName || !lastName) {
    setMessage(addPlayerMessage, "Enter first and last name.", true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/players`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        firstName,
        lastName
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(addPlayerMessage, data.message || "Could not add player.", true);
      return;
    }

    document.getElementById("newFirstName").value = "";
    document.getElementById("newLastName").value = "";

    setMessage(addPlayerMessage, "✅ Player added.", false);

    await loadPlayers();
  } catch (err) {
    setMessage(addPlayerMessage, "Server error adding player.", true);
  }
}

/* =========================
   LOGOUT
   Clears session and resets screen
   ========================= */
function logout() {
  currentUser = null;
  localStorage.removeItem("attendanceUser");

  loginScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");

  document.getElementById("email").value = "";
  document.getElementById("password").value = "";

  loginMessage.textContent = "";

  if (groupSelect) {
    groupSelect.innerHTML = `<option value="">All Groups</option>`;
  }

  eventSelect.innerHTML = `<option value="">Select event</option>`;

  const playerList = document.getElementById("playerList");
  if (playerList) {
    playerList.innerHTML = "";
  }

  if (attendanceMessage) attendanceMessage.textContent = "";
  if (addPlayerMessage) addPlayerMessage.textContent = "";
}

/* =========================
   RESTORE SESSION
   Keeps user logged in after page refresh
   ========================= */
function restoreSession() {
  const savedUser = localStorage.getItem("attendanceUser");

  if (!savedUser) return;

  try {
    currentUser = JSON.parse(savedUser);
    showApp();
  } catch (err) {
    localStorage.removeItem("attendanceUser");
  }
}

/* =========================
   START APP
   ========================= */
restoreSession();
