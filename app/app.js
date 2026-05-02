const API_BASE = "http://192.168.1.174:3000/api";

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");
const loginMessage = document.getElementById("loginMessage");
const welcomeText = document.getElementById("welcomeText");
const roleText = document.getElementById("roleText");
const groupSelect = document.getElementById("groupSelect");
const eventSelect = document.getElementById("eventSelect");

let currentUser = null;

loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);

// Keep groups available for later, but do not require group first
if (groupSelect) {
  groupSelect.addEventListener("change", loadEventsByGroup);
}

function setMessage(el, text, isError = false) {
  el.textContent = text;
  el.style.color = isError ? "#c62828" : "#2e7d32";
}

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

async function showApp() {
  welcomeText.textContent = `Welcome, ${currentUser.FullName}`;
  roleText.textContent = `${currentUser.RoleName}`;

  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");

  await loadGroups();   // keep groups ready for later
  await loadEvents();   // load events by default
  await loadPlayers();  // load all active players by default
}

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

async function loadEvents() {
  eventSelect.innerHTML = `<option value="">Select event</option>`;

  try {
    const res = await fetch(`${API_BASE}/events`);
    const events = await res.json();

    events.forEach(event => {
      const option = document.createElement("option");
      option.value = event.EventID;

      const eventDate = new Date(event.EventDate).toLocaleDateString();
      option.textContent = `${eventDate} - ${event.EventType} - ${event.EventStatus}`;

      eventSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load events", err);
  }
}

async function loadEventsByGroup() {
  const groupId = groupSelect.value;

  if (!groupId) {
    await loadEvents();
    return;
  }

  eventSelect.innerHTML = `<option value="">Select event</option>`;

  try {
    const month = "2026-04";
    const res = await fetch(`${API_BASE}/events?groupId=${groupId}&month=${month}`);
    const events = await res.json();

    events.forEach(event => {
      const option = document.createElement("option");
      option.value = event.EventID;

      const eventDate = new Date(event.EventDate).toLocaleDateString();
      option.textContent = `${eventDate} - ${event.EventType} - ${event.EventStatus}`;

      eventSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load events by group", err);
  }
}

async function loadPlayers() {
  try {
    const res = await fetch(`${API_BASE}/players`);
    const players = await res.json();

    console.log("Players loaded:", players);

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
}

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

restoreSession();
