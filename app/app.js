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
groupSelect.addEventListener("change", loadEvents);

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

async function loadGroups() {
  groupSelect.innerHTML = `<option value="">Select group</option>`;
  eventSelect.innerHTML = `<option value="">Select event</option>`;

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
      await loadEvents();
    }
  } catch (err) {
    console.error("Failed to load groups", err);
  }
}

async function loadEvents() {
  const groupId = groupSelect.value;
  eventSelect.innerHTML = `<option value="">Select event</option>`;

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

      eventSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load events", err);
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
  groupSelect.innerHTML = `<option value="">Select group</option>`;
  eventSelect.innerHTML = `<option value="">Select event</option>`;
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
