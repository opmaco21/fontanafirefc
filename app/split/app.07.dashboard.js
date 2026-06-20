// app.07.dashboard.js — Core: state, formatters, loaders, month filter

let dashboardSelectedMonth = new Date().toISOString().slice(0, 7);
let dashboardMonthFilterReady = false;
let dashboardPlayerDates = {};
let dashboardOpenSummaryCard = "";
let dashboardSummaryPlayerCache = {};
let dashboardOpenDetailKey = "";

function getDashboardCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatDashboardMonthLabel(value) {
  if (!value) return "All Months";
  const parts = String(value).split("-");
  if (parts.length !== 2) return value;
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function getNextDashboardMonthValue(value) {
  if (!value) return "";
  const parts = String(value).split("-");
  if (parts.length !== 2) return "";
  const date = new Date(Number(parts[0]), Number(parts[1]), 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function ensureDashboardMonthFilterOptions() {
  if (!dashboardMonthFilter || dashboardMonthFilterReady) return;
  const currentMonth = getDashboardCurrentMonthValue();
  const pastMonths = [];
  const now = new Date();
  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    pastMonths.push({ value, label: formatDashboardMonthLabel(value) });
  }
  const options = [
    { value: "", label: "All Months" },
    { value: currentMonth, label: `Current Month (${formatDashboardMonthLabel(currentMonth)})` },
    ...pastMonths
  ];
  const seen = new Set();
  dashboardMonthFilter.innerHTML = options
    .filter(o => { const k = o.value || "all"; if (seen.has(k)) return false; seen.add(k); return true; })
    .map(o => `<option value="${o.value}">${o.label}</option>`).join("");
  dashboardMonthFilter.value = dashboardSelectedMonth;
  dashboardMonthFilter.addEventListener("change", async () => {
    dashboardSelectedMonth = dashboardMonthFilter.value || "";
    dashboardOpenDetailKey = "";
    dashboardPlayerDates = {};
    dashboardSummaryPlayerCache = {};
    dashboardOpenSummaryCard = "";
    await loadDashboard();
  });
  dashboardMonthFilterReady = true;
}

function escapeDashboardHtml(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatDashboardPercent(value) {
  if (value === null || value === undefined || value === "") return "--";
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return `${num.toFixed(1)}%`;
}

function formatDashboardBirthday(value) {
  if (!value) return "-";
  const raw = String(value);
  const dateOnly = raw.includes("T") ? raw.split("T")[0] : raw.substring(0, 10);
  const parts = dateOnly.split("-");
  if (parts.length !== 3) return escapeDashboardHtml(raw);
  return `${parts[1]}/${parts[2]}`;
}

function formatDashboardDate(value) {
  if (!value) return "-";
  const raw = String(value);
  const dateOnly = raw.includes("T") ? raw.split("T")[0] : raw.substring(0, 10);
  const parts = dateOnly.split("-");
  if (parts.length !== 3) return escapeDashboardHtml(raw);
  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

function formatDashboardTime(value) {
  if (!value) return "Time TBD";
  const raw = String(value);
  const match = raw.match(/(\d{1,2}):(\d{2})/);
  if (!match) return escapeDashboardHtml(raw);
  let hour = Number(match[1]);
  const minute = match[2];
  if (!Number.isFinite(hour)) return escapeDashboardHtml(raw);
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${suffix}`;
}

function getDashboardPercentClass(value, counted) {
  const percent = Number(value);
  const total = Number(counted || 0);
  if (!total) return "dashboard-percent-none";
  if (percent === 100) return "dashboard-percent-perfect";
  if (percent >= 85) return "dashboard-percent-good";
  if (percent > 70) return "dashboard-percent-watch";
  return "dashboard-percent-low";
}

function renderDashboardCard(label, value, note = "", clickAction = "", reportAction = "") {
  const isOpen = clickAction && dashboardOpenSummaryCard === clickAction;
  const clickAttr = clickAction
    ? `data-dash-card="${escapeDashboardHtml(clickAction)}" tabindex="0" role="button" style="cursor:pointer;${isOpen ? "border-color:#f57c00;box-shadow:0 0 0 2px rgba(245,124,0,0.15);" : ""}"`
    : "";
  const arrow = clickAction ? ` <span style="font-size:9px;color:#f57c00;vertical-align:middle;">${isOpen ? "▲" : "▼"}</span>` : "";
  const reportBtn = reportAction
    ? `<div style="margin-top:6px;"><button onclick="event.stopPropagation();openReportFromDashboard(${JSON.stringify(reportAction)})" style="font-size:10px;font-weight:700;color:#f57c00;background:none;border:none;padding:0;cursor:pointer;text-decoration:underline;">→ View Report</button></div>`
    : "";
  return `
    <div class="dashboard-stat-card" ${clickAttr}>
      <div class="dashboard-stat-label">${escapeDashboardHtml(label)}${arrow}</div>
      <div class="dashboard-stat-value">${value}</div>
      ${note ? `<div class="dashboard-stat-note">${escapeDashboardHtml(note)}</div>` : ""}
      ${reportBtn}
    </div>
  `;
}

async function loadDashboard() {
  if (!dashboardSection) return;
  try {
    setMessage(dashboardMessage, "Loading dashboard...", false);
    if (refreshDashboardBtn) { refreshDashboardBtn.disabled = true; refreshDashboardBtn.textContent = "Loading..."; }
    ensureDashboardMonthFilterOptions();
    setupDashboardDetailClickHandlers();
    const params = new URLSearchParams();
    if (dashboardSelectedMonth) params.set("month", dashboardSelectedMonth);
    const url = params.toString() ? `${API_BASE}/dashboard?${params}` : `${API_BASE}/dashboard`;
    const res = await fetch(url, { credentials: "include", cache: "no-store" });
    const data = await res.json();
    if (!res.ok || !data.success) { setMessage(dashboardMessage, data.message || "Could not load dashboard.", true); return; }

    renderDashboardSummaryCards(data);
    renderBirthdays(data.birthdays || {});
    renderUpcomingSnapshot(data.upcomingSnapshot || []);
    renderMonthlySummary(data.monthlySummary || []);
    renderPracticeSummary(data.practiceSummary || {});
    renderGameSummary(data.gameSummary || {});
    renderEventSummary(data.eventSummary || {});
    renderPlayerAlerts(data.playerAlerts || []);
    renderGoodPlayers(data.goodPlayers || []);
    renderExceptionalPlayers(data.exceptionalPlayers || []);
    renderPerfectPlayers(data.perfectPlayers || []);

    const filterLabel = dashboardSelectedMonth ? formatDashboardMonthLabel(dashboardSelectedMonth) : "All Months";
    if (dashboardLastUpdated) dashboardLastUpdated.textContent = `Last updated: ${new Date().toLocaleString()} | Filter: ${filterLabel}`;
    setMessage(dashboardMessage, `Dashboard updated. Showing: ${filterLabel}.`, false);
  } catch (err) {
    console.error("Dashboard load error:", err);
    setMessage(dashboardMessage, "Could not load dashboard.", true);
  } finally {
    if (refreshDashboardBtn) { refreshDashboardBtn.disabled = false; refreshDashboardBtn.textContent = "Refresh Dashboard"; }
  }
}

ensureDashboardMonthFilterOptions();
setupDashboardDetailClickHandlers();

window.openReportFromDashboard = function (config) {
  if (!config) return;
  currentTab = "Reports";
  if (typeof setActiveTab === "function") setActiveTab();
  if (typeof updateMainModeVisibility === "function") updateMainModeVisibility();
  setTimeout(() => {
    if (typeof initReportsTab === "function") initReportsTab();
    const key = config.report || "attendance";
    if (typeof toggleReportAccordion === "function") {
      const body = document.getElementById(`body-${key}`);
      if (body && body.style.display === "none") toggleReportAccordion(key);
    }
    if (key === "attendance") {
      const monthSel = document.getElementById("att-month");
      if (monthSel && config.month) monthSel.value = config.month;
      const belowSel = document.getElementById("att-below");
      if (belowSel) belowSel.value = config.below ? String(config.below) : "";
      if (typeof onAttFilterChange === "function") onAttFilterChange();
    }
  }, 150);
};
