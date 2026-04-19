const API_BASE = "http://localhost:3000/api";

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");
const loginMessage = document.getElementById("loginMessage");
const welcomeText = document.getElementById("welcomeText");
const roleText = document.getElementById("roleText");

let currentUser = null;

loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);

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
  } catch (err) {
    setMessage(loginMessage, "Could not connect to server.", true);
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
  } catch (err) {
    localStorage.removeItem("attendanceUser");
  }
}

restoreSession();
