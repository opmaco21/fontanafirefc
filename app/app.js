const API_BASE = "http://localhost:3000/api";

const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginMessage = document.getElementById("loginMessage");

const groupSelect = document.getElementById("groupSelect");
const eventSelect = document.getElementById("eventSelect");
const loadAttendanceBtn = document.getElementById("loadAttendanceBtn");

const attendanceCard = document.getElementById("attendanceCard");
const attendanceTitle = document.getElementById("attendanceTitle");
const attendanceSubtitle = document.getElementById("attendanceSubtitle");
const attendanceTableBody = document.getElementById("attendanceTableBody");
const saveAttendanceBtn = document.getElementById("saveAttendanceBtn");
const saveMessage = document.getElementById("saveMessage");

const welcomeText = document.getElementById("welcomeText");
const roleText = document.getElementById("roleText");

let currentUser = null;
let currentAttendanceRows = [];

loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);
groupSelect.addEventListener("change", loadEventsForGroup);
loadAttendanceBtn.addEventListener("click", loadAttendance);
saveAttendanceBtn.addEventListener("click", saveAttendance);

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

    welcomeText.textContent = `Welcome, ${currentUser.FullName}`;
    roleText.textContent = `${currentUser.RoleName}${currentUser.GroupID ? ` • Group ${currentUser.GroupID}` : " • All Groups"}`;

    loginScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");

    await loadGroups();
  } catch (err) {
    setMessage(loginMessage, "Could not connect to server.", true);
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("attendanceUser");

  loginScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
  attendanceCard.classList.add("hidden");

  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
  loginMessage.textContent = "";
  saveMessage.textContent = "";
}

async function loadGroups() {
  groupSelect.innerHTML = `<option value="">Select group</option>`;
  eventSelect.innerHTML = `<option value="">Select event</option>`;
  attendanceCard.classList.add("hidden");

  try {
    const res = await fetch(`${API_BASE}/groups`);
    const groups = await res.json();

    let availableGroups = groups;

    if (currentUser.RoleName === "Coach" && currentUser.GroupID) {
      availableGroups = groups.filter(g => g.GroupID === currentUser.GroupID);
    }

    availableGroups.forEach(group => {
      const option = document.createElement("option");
      option.value = group.GroupID;
      option.textContent = group.GroupName;
      groupSelect.appendChild(option);
    });

    if (currentUser.RoleName === "Coach" && currentUser.GroupID) {
      groupSelect.value = currentUser.GroupID;
      await loadEventsForGroup();
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadEventsForGroup() {
  const groupId = groupSelect.value;
  eventSelect.innerHTML = `<option value="">Select event</option>`;
  attendanceCard.classList.add("hidden");

  if (!groupId) return;

  try {
    const month = "2026-04";
    const res = await fetch(`${API_BASE}/events?groupId=${groupId}&month=${month}`);
    const events = await res.json();

    events.forEach(event => {
      const option = document.createElement("option");
      option.value = event.EventID;

      const eventDate = new Date(event.EventDate).toLocaleDateString();
      option.textContent = `${eventDate} - ${event.EventType} - ${event.EventStatus}`;

      option.dataset.eventType = event.EventType;
      option.dataset.eventDate = event.EventDate;
      option.dataset.eventStatus = event.EventStatus;

      eventSelect.appendChild(option);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadAttendance() {
  const eventId = eventSelect.value;
  const groupId = groupSelect.value;
  saveMessage.textContent = "";

  if (!groupId || !eventId) {
    setMessage(saveMessage, "Select a group and event first.", true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/attendance?eventId=${eventId}`);
    const players = await res.json();

    currentAttendanceRows = players;
    attendanceTableBody.innerHTML = "";

    const selectedOption = eventSelect.options[eventSelect.selectedIndex];
    const prettyDate = new Date(selectedOption.dataset.eventDate).toLocaleDateString();

    attendanceTitle.textContent = `Attendance`;
    attendanceSubtitle.textContent = `${selectedOption.dataset.eventType} • ${prettyDate} • ${selectedOption.dataset.eventStatus}`;

    players.forEach(player => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${player.PlayerNumber ?? ""}</td>
        <td>${player.FullName}</td>
        <td>
          <select class="status-select" data-player-id="${player.PlayerID}">
            <option value="">Select</option>
            <option value="Present" ${player.AttendanceStatus === "Present" ? "selected" : ""}>Present</option>
            <option value="Absent" ${player.AttendanceStatus === "Absent" ? "selected" : ""}>Absent</option>
            <option value="Excused" ${player.AttendanceStatus === "Excused" ? "selected" : ""}>Excused</option>
            <option value="Canceled" ${player.AttendanceStatus === "Canceled" ? "selected" : ""}>Canceled</option>
          </select>
        </td>
      `;

      attendanceTableBody.appendChild(tr);
    });

    attendanceCard.classList.remove("hidden");
  } catch (err) {
    setMessage(saveMessage, "Could not load attendance.", true);
  }
}

async function saveAttendance() {
  const eventId = eventSelect.value;

  if (!eventId) {
    setMessage(saveMessage, "No event selected.", true);
    return;
  }

  const statusSelects = document.querySelectorAll(".status-select");
  const attendance = [];

  statusSelects.forEach(select => {
    const playerId = Number(select.dataset.playerId);
    const status = select.value;

    if (status) {
      attendance.push({
        playerId,
        status
      });
    }
  });

  if (attendance.length === 0) {
    setMessage(saveMessage, "Select at least one attendance status.", true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/attendance/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        eventId: Number(eventId),
        markedByUserId: currentUser.UserID,
        attendance
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(saveMessage, data.message || "Save failed.", true);
      return;
    }

    setMessage(saveMessage, "Attendance saved successfully.");
  } catch (err) {
    setMessage(saveMessage, "Could not save attendance.", true);
  }
}

function restoreSession() {
  const savedUser = localStorage.getItem("attendanceUser");
  if (!savedUser) return;

  try {
    currentUser = JSON.parse(savedUser);
    welcomeText.textContent = `Welcome, ${currentUser.FullName}`;
    roleText.textContent = `${currentUser.RoleName}${currentUser.GroupID ? ` • Group ${currentUser.GroupID}` : " • All Groups"}`;

    loginScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");

    loadGroups();
  } catch (err) {
    localStorage.removeItem("attendanceUser");
  }
}

restoreSession();
