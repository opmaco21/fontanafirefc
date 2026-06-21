// app.07.dashboard.js — Core dashboard: state vars, formatters, loadDashboard()

/* =========================
   DASHBOARD STATE
   ========================= */
let dashboardSelectedMonth = "";
let dashboardOpenSummaryCard = "";
let dashboardSummaryPlayerCache = {};
let dashboardOpenDetailKey = "";
let dashboardPlayerDates = {};

/* =========================
   FORMATTERS
   ========================= */
function escapeDashboardHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDashboardPercent(value) {
  if (value == null || value === "") return "--";
  const num = parseFloat(value);
  if (isNaN(num)) return "--";
  return num.toFixed(1) + "%";
}

function formatDashboardDate(dateStr) {
  if (!dateStr) return "--";
  const s = String(dateStr).substring(0, 10);
  const parts = s.split("-");
  if (parts.length !== 3) return s;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatDashboardTime(timeStr) {
  if (!timeStr) return "--";
  const s = String(timeStr).substring(0, 5);
  const [h, m] = s.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${suffix}`;
}

function formatDashboardBirthday(dateStr) {
  if (!dateStr) return "--";
  const s = String(dateStr).substring(0, 10);
  const parts = s.split("-");
  if (parts.length !== 3) return s;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function formatDashboardMonthLabel(monthVal) {
  if (!monthVal) return "";
  const parts = monthVal.split("-");
  if (parts.length !== 2) return monthVal;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getNextDashboardMonthValue(monthVal) {
  if (!monthVal) return "";
  const parts = monthVal.split("-");
  if (parts.length !== 2) return "";
  let year = Number(parts[0]);
  let month = Number(parts[1]);
  month++;
  if (month > 12) { month = 1; year++; }
  return `${year}-${String(month).padStart(2, "0")}`;
}

function getDashboardPercentClass(percent, counted) {
  if (percent == null || counted == null || Number(counted) === 0) return "dashboard-percent-none";
  const p = parseFloat(percent);
  if (isNaN(p)) return "dashboard-percent-none";
  if (p >= 100) return "dashboard-percent-perfect";
  if (p >= 85) return "dashboard-percent-high";
  if (p >= 71) return "dashboard-percent-mid";
  return "dashboard-percent-low";
}

/* =========================
   CARD RENDERER
   ========================= */
function renderDashboardCard(label, value, subtext, actionKey, reportOpts) {
  const hasAction = !!actionKey;
  const arrow = hasAction ? `<span class="dashboard-card-arrow">&#9660;</span>` : "";
  const dataAttr = actionKey ? `data-dash-card="${escapeDashboardHtml(actionKey)}"` : "";
  const clickable = hasAction ? "dashboard-card--clickable" : "";
  return `
    <div class="dashboard-stat-card ${clickable}" ${dataAttr}>
      <div class="dashboard-card-label">${escapeDashboardHtml(label)} ${arrow}</div>
      <div class="dashboard-card-value">${escapeDashboardHtml(String(value))}</div>
      ${subtext ? `<div class="dashboard-card-subtext">${escapeDashboardHtml(subtext)}</div>` : ""}
    </div>`;
}

/* =========================
   OPEN REPORT FROM DASHBOARD
   ========================= */
function openReportFromDashboard(report) {
  const reportsTab = document.getElementById("reportsTab");
  if (reportsTab) reportsTab.click();
  if (report && typeof window.onAttFilterChange === "function") {
    setTimeout(() => {
      const sel = document.getElementById("reportTypeSelect");
      if (sel) { sel.value = report; window.onAttFilterChange(); }
    }, 300);
  }
}

/* =========================
   MONTH FILTER OPTIONS
   ========================= */
function ensureDashboardMonthFilterOptions() {
  const select = dashboardMonthFilter;
  if (!select) return;
  if (select.options.length > 1) return;
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = label;
    select.appendChild(opt);
  }
}

/* =========================
   LOAD DASHBOARD
   ========================= */
async function loadDashboard() {
  ensureDashboardMonthFilterOptions();
  setupDashboardDetailClickHandlers();

  dashboardSummaryPlayerCache = {};
  dashboardOpenSummaryCard = "";
  dashboardOpenDetailKey = "";
  dashboardPlayerDates = {};

  const month = dashboardSelectedMonth || "";
  const monthParam = month ? `?month=${encodeURIComponent(month)}` : "";

  if (dashboardMessage) {
    dashboardMessage.textContent = "Loading dashboard...";
    dashboardMessage.style.color = "#999";
  }

  try {
    const res = await fetch(`${API_BASE}/dashboard${monthParam}`, { credentials: "include" });
    if (!res.ok) {
      if (dashboardMessage) {
        dashboardMessage.textContent = "Could not load dashboard. Please refresh.";
        dashboardMessage.style.color = "#c62828";
      }
      return;
    }

    const data = await res.json();
    if (!data.success) {
      if (dashboardMessage) {
        dashboardMessage.textContent = data.message || "Dashboard error.";
        dashboardMessage.style.color = "#c62828";
      }
      return;
    }

    if (dashboardMessage) dashboardMessage.textContent = "";
    if (dashboardLastUpdated) {
      dashboardLastUpdated.textContent = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }

    // Render all sections
    if (typeof renderDashboardSummaryCards === "function") renderDashboardSummaryCards(data);
    if (typeof renderMonthlySummary === "function")        renderMonthlySummary(data.monthlySummary);
    if (typeof renderBirthdays === "function")             renderBirthdays(data.birthdays || {});
    if (typeof renderUpcomingSnapshot === "function")      renderUpcomingSnapshot(data.upcomingSnapshot);
    if (typeof renderPracticeSummary === "function")       renderPracticeSummary(data.practiceSummary);
    if (typeof renderGameSummary === "function")           renderGameSummary(data.gameSummary);
    if (typeof renderEventSummary === "function")          renderEventSummary(data.eventSummary);
    if (typeof renderPlayerAlerts === "function")          renderPlayerAlerts(data.playerAlerts);
    if (typeof renderGoodPlayers === "function")           renderGoodPlayers(data.goodPlayers);
    if (typeof renderExceptionalPlayers === "function")    renderExceptionalPlayers(data.exceptionalPlayers);
    if (typeof renderPerfectPlayers === "function")        renderPerfectPlayers(data.perfectPlayers);

  } catch (err) {
    console.error("Dashboard load error:", err);
    if (dashboardMessage) {
      dashboardMessage.textContent = "Could not reach server.";
      dashboardMessage.style.color = "#c62828";
    }
  }
}

/* =========================
   MONTH FILTER WIRING
   Called after DOM is ready (from app.99.bootstrap.js via loadDashboard)
   ========================= */
if (dashboardMonthFilter) {
  dashboardMonthFilter.addEventListener("change", async () => {
    dashboardSelectedMonth = dashboardMonthFilter.value || "";
    await loadDashboard();
  });
}