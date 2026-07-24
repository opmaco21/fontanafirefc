/* =========================================================
   FONTANA FIRE FC ATTENDANCE APP
   MASTER DASHBOARD - FULL HD VERSION (CLEARER TITLES)
   Updated: June 25, 2026
   ========================================================= */

// --- DASHBOARD STATE ---
function getDashboardCurrentMonthValue() {
  const now = new Date();
  return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
}
let dashboardSelectedMonth = getDashboardCurrentMonthValue();
let dashboardMonthFilterReady = false;
let dashboardPlayerDates = {};
let dashboardOpenSummaryCard = ""; 
let dashboardSummaryPlayerCache = {}; 
let dashboardOpenDetailKey = "";

// --- UTILITIES & FORMATTERS ---

function formatDashboardMonthLabel(value) {
  if (!value) return "All Months";
  const parts = String(value).split("-");
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function getNextDashboardMonthValue(value) {
  if (!value) return "";
  const parts = String(value).split("-");
  const date = new Date(Number(parts[0]), Number(parts[1]), 1);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

function escapeDashboardHtml(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatDashboardPercent(value) {
  const num = Number(value);
  return (Number.isFinite(num) ? num : 0).toFixed(1) + "%";
}

function formatDashboardBirthday(value) {
  if (!value) return "-";
  const parts = String(value).split("T")[0].split("-");
  return parts.length === 3 ? parts[1] + "/" + parts[2] : value;
}

function formatDashboardDate(value) {
  if (!value) return "-";
  const parts = String(value).split("T")[0].split("-");
  return parts.length === 3 ? parts[1] + "/" + parts[2] + "/" + parts[0] : value;
}

function formatDashboardTime(value) {
  if (!value) return "Time TBD";
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return value;
  let hour = Number(match[1]);
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return hour + ":" + match[2] + " " + suffix;
}

function getDashboardPercentClass(value, counted) {
  const percent = Number(value);
  if (!Number(counted || 0)) return "dashboard-percent-none";
  if (percent >= 100) return "dashboard-percent-perfect"; // GOLD
  if (percent >= 85) return "dashboard-percent-good";     // GREEN
  if (percent > 70) return "dashboard-percent-watch";     // BLUE
  return "dashboard-percent-low";                         // RED
}

// --- RENDERING HELPERS ---

function renderCollapsiblePlayerSection(container, countEl, rows, cardType, emptyText) {
  if (countEl) countEl.textContent = (rows ? rows.length : 0) + " players";
  if (!container) return;
  container.innerHTML = (rows && rows.length) 
    ? rows.map(row => renderPlayerAlertCard(row, cardType)).join("") 
    : `<div class="roster-empty-message">${emptyText}</div>`;
}

function renderDashboardCard(label, value, note, clickAction) {
  const isOpen = clickAction && dashboardOpenSummaryCard === clickAction;
  const arrow = isOpen ? "▲" : "▼";
  return `
    <div class="dashboard-stat-card" data-dash-card="${escapeDashboardHtml(clickAction)}" 
         style="cursor:pointer; ${isOpen ? 'border-color:#f57c00; box-shadow:0 4px 12px rgba(245,124,0,0.1);' : ''}">
      <div class="dashboard-stat-label">${escapeDashboardHtml(label)} <span style="font-size:10px; color:#f57c00;">${arrow}</span></div>
      <div class="dashboard-stat-value">${value}</div>
      <div class="dashboard-stat-note" style="font-size:11px; line-height:1.2; color:#666;">${note}</div>
    </div>
  `;
}

function renderDashboardSummaryCards(data) {
  if (!dashboardSummaryCards) return;
  const totals = data.playerTotals || {};
  const snack = data.snackTotals || {};
  const paperwork = data.paperworkTotals || {};
  const photo = data.photoReleaseTotals || {};

  const activeCount = totals.ActivePlayers || 0;
  const optIn = photo.OptInPhotoRelease || 0;
  const optOut = photo.OptOutPhotoRelease || 0;
  const missingPhoto = activeCount - optIn - optOut;

  const cards = [
    renderDashboardCard("Inactive Players", totals.InactivePlayers || 0, activeCount + " active players", "inactive"),
    renderDashboardCard("Missing Paperwork", paperwork.MissingPaperwork || 0, (paperwork.CompletePaperwork || 0) + " complete roster", "paperwork"),
    renderDashboardCard("Photo Release", optIn, "<b>" + optIn + " Allowed</b> . " + optOut + " Denied<br>" + missingPhoto + " Missing Response", "photo"),
    renderDashboardCard("Bring Snack 🍎", snack.BringSnackPlayers || 0, "Rotation families", "snack"),
    renderDashboardCard("Paid Out 💰", snack.PaidOutPlayers || 0, "Coach provides snack", "paidout")
  ].join("");

  dashboardSummaryCards.innerHTML = cards + `<div id="dashboardSummaryPanel" style="grid-column: 1 / -1;"></div>`;

  dashboardSummaryCards.querySelectorAll("[data-dash-card]").forEach(card => {
    card.addEventListener("click", async () => {
      const category = card.dataset.dashCard;
      if (dashboardOpenSummaryCard === category) {
        dashboardOpenSummaryCard = "";
        renderSummaryPanel(null);
        return;
      }
      dashboardOpenSummaryCard = category;
      const panel = document.getElementById("dashboardSummaryPanel");
      if (panel) panel.innerHTML = `<div style="padding:20px; color:#999;">Loading player list...</div>`;

      if (!dashboardSummaryPlayerCache[category]) {
        try {
          const res = await fetch(API_BASE + "/dashboard/summary-players?category=" + encodeURIComponent(category), { credentials: "include" });
          const d = await res.json();
          if (d.success) dashboardSummaryPlayerCache[category] = d.players;
        } catch (e) { console.error("Summary error:", e); }
      }
      renderSummaryPanel(category);
    });
  });

  if (dashboardOpenSummaryCard) renderSummaryPanel(dashboardOpenSummaryCard);
}

function renderSummaryPanel(category) {
  const panel = document.getElementById("dashboardSummaryPanel");
  if (!panel || !category) { if(panel) panel.innerHTML = ""; return; }
  const players = dashboardSummaryPlayerCache[category] || [];
  const titles = { inactive: "Inactive Players", paperwork: "Missing Paperwork", photo: "Photo Release Needed", snack: "Snack Rotation", paidout: "Coach Snacks" };

  const formatPlayer = (p, idx) => {
    const extra = {
      paperwork: p.PaperworkStatus || "Not Received",
      photo: p.PhotoReleaseStatus === "No" ? "DENIED" : "MISSING",
      inactive: p.BirthYear || ""
    }[category] || "";
    return `<div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee; background:${idx % 2 === 0 ? '#fff' : '#f9f9f9'};">
      <span style="font-weight:600;">${escapeDashboardHtml(p.FirstName + " " + p.LastName)}</span>
      <span style="color:#f57c00; font-weight:700; font-size:12px;">${escapeDashboardHtml(extra)}</span>
    </div>`;
  };

  panel.innerHTML = `
    <div style="margin: 15px 0; background:#fff; border:1px solid #ddd; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08);">
      <div style="background:#f8f9fa; padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
        <div style="font-weight:800;">${titles[category]} (${players.length})</div>
        <button onclick="dashboardOpenSummaryCard=''; renderSummaryPanel(null);" style="background:#eee; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer;">X</button>
      </div>
      <div style="max-height:300px; overflow-y:auto;">${players.map((p, i) => formatPlayer(p, i)).join("")}</div>
    </div>`;
}

// --- BIRTHDAYS ---

function renderBirthdays(data) {
  if (!dashboardBirthdays) return;
  const thisMonth = data.thisMonth || [];
  const nextMonth = data.nextMonth || [];
  const selectedLabel = dashboardSelectedMonth ? formatDashboardMonthLabel(dashboardSelectedMonth) : "This Month";
  
  function list(items, label, color) {
    const count = items.length;
    return `
      <div class="dashboard-mini-card" style="border-left: 5px solid ${color}; flex:1; min-width:280px;">
        <h4 style="color:${color}; display:flex; justify-content:space-between; align-items:center;">
          ${label}
          <span style="display:inline-flex; align-items:center; justify-content:center; background:${color}; color:#fff; font-size:13px; font-weight:800; min-width:26px; height:26px; border-radius:13px; padding:0 7px;">${count}</span>
        </h4>
        ${items.length ? `<ul class="birthday-player-list">
          ${items.map(p => `<li class="birthday-player-item"><strong>${p.FirstName} ${p.LastName}</strong> <span>${formatDashboardBirthday(p.DateOfBirth)}</span></li>`).join("")}
        </ul>` : `<p class="subtext">No birthdays.</p>`}
      </div>`;
  }
  dashboardBirthdays.style.display = "flex";
  dashboardBirthdays.style.gap = "15px";
  dashboardBirthdays.style.flexWrap = "wrap";
  dashboardBirthdays.innerHTML = list(thisMonth, selectedLabel, "#f57c00") + list(nextMonth, "Next Month", "#6366f1");
}

// --- UPCOMING SNAPSHOT ---

function renderUpcomingSnapshot(rows) {
  const container = document.getElementById("dashboardUpcomingSnapshot");
  if (!container) return;
  if (!rows || rows.length === 0) {
    container.innerHTML = `<div class="roster-empty-message">No upcoming games or events.</div>`;
    return;
  }
  container.innerHTML = rows.map(event => {
    const isGame = event.EventType === "Game";
    const status = event.EventStatus || "Scheduled";
    const groupText = event.GroupCode || event.GroupName || "All Teams";
    const pillClass = status === "Completed" ? "snapshot-status--completed" : (status === "Cancelled" ? "snapshot-status--cancelled" : "snapshot-status--scheduled");
    const check = status === "Completed" ? "✓ " : "";
    
    return `
      <article class="dashboard-upcoming-card snapshot-card ${isGame ? 'snapshot-card--game' : 'snapshot-card--team-event'} ${status === 'Cancelled' ? 'snapshot-card--cancelled' : ''}">
        <div class="snapshot-topline">
          <div class="snapshot-name-block">
            <div class="snapshot-name" ${status === "Cancelled" ? 'style="text-decoration:line-through;"' : ""}>${escapeDashboardHtml(event.EventName || event.EventType)}</div>
            <div class="snapshot-datetime">${formatDashboardDate(event.EventDate)} . ${formatDashboardTime(event.StartTime)}</div>
          </div>
          <span class="snapshot-status-pill ${pillClass}">${check}${status}</span>
        </div>
        <div style="font-size:11px; color:#666; margin-top:4px;"><b>Team:</b> ${escapeDashboardHtml(groupText)} | <b>Loc:</b> ${escapeDashboardHtml(event.LocationName || "TBD")}</div>
        ${isGame ? `<div class="snapshot-snack-chip" style="margin-top:8px; font-size:12px; color:#f57c00;">🍎 Snack: ${escapeDashboardHtml(event.AssignedSnackFamily || "Not assigned")}</div>` : ""}
      </article>`;
  }).join("");
}

// --- PLAYER CARDS & ATTENDANCE ---

function getDashboardCategoryDetail(row, cat) {
  const cfg = { practice: "Practice", game: "Game", teamEvent: "Event" }[cat];
  const dates = dashboardPlayerDates[row.PlayerID + "-" + cat] || [];
  
  // Logic to identify missed dates
  const missedDates = dates.filter(d => d.AttendanceStatus === "Absent" || d.AttendanceStatus === "No Record");
  const missedCount = missedDates.length;

  const missedHtml = missedDates.map(d => 
    `<div style="padding:4px 0; border-bottom:1px solid #eee; font-size:12px; color:#c62828;">${formatDashboardDate(d.EventDate)}</div>`).join("");
  
  return `
    <div class="dashboard-player-detail-box" style="margin-top:10px; padding:12px; background:#fff9f0; border-radius:10px; border:1px solid #ffe0b2;">
      <div style="font-weight:800; font-size:13px; margin-bottom:5px; color:#111;">${cfg} History - ${missedCount} Missed</div>
      <div>${missedHtml || "<span style='color:#2e7d32; font-weight:700;'>Perfect record!</span>"}</div>
    </div>`;
}

function renderPlayerAlertCard(row, cardType) {
  const prefix = cardType + "-" + row.PlayerID + "-";
  const activeCat = dashboardOpenDetailKey.startsWith(prefix) ? dashboardOpenDetailKey.replace(prefix, "") : "";
  
  const pPct = row.PracticePercent || 0;
  const gPct = row.GamePercent || 0;
  const tPct = row.TeamEventPercent || 0;

  return `
    <article class="dashboard-alert-card dashboard-${cardType}-card" style="margin-bottom:15px; padding:15px; border-radius:14px; background:#fff; border:1px solid #eee; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
      <div class="dashboard-alert-topline" style="display:flex; justify-content:space-between; margin-bottom:10px;">
        <div>
          <h4 style="margin:0;">${row.FirstName} ${row.LastName}</h4>
          <span style="font-size:11px; color:#999; font-weight:700;">BY: ${row.BirthYear || "-"}</span>
        </div>
        <span class="dashboard-alert-badge dashboard-${cardType}-badge">${row.AlertType || row.HighlightType || "INFO"}</span>
      </div>
      
      <div class="dashboard-alert-metrics" style="display:flex; flex-direction:column; gap:6px;">
        <button type="button" class="dashboard-category-row ${activeCat === 'practice' ? 'active' : ''}" data-dashboard-detail-key="${prefix}practice" style="display:flex; justify-content:space-between; padding:10px; border-radius:8px; background:#f9f9f9; border:1px solid #eee; cursor:pointer;">
          <span style="font-weight:700; font-size:12px;">Practice</span> <strong class="dashboard-percent-badge ${getDashboardPercentClass(pPct, row.PracticeCounted)}">${formatDashboardPercent(pPct)}</strong>
        </button>
        ${activeCat === 'practice' ? getDashboardCategoryDetail(row, 'practice') : ""}

        <button type="button" class="dashboard-category-row ${activeCat === 'game' ? 'active' : ''}" data-dashboard-detail-key="${prefix}game" style="display:flex; justify-content:space-between; padding:10px; border-radius:8px; background:#f9f9f9; border:1px solid #eee; cursor:pointer;">
          <span style="font-weight:700; font-size:12px;">Game</span> <strong class="dashboard-percent-badge ${getDashboardPercentClass(gPct, row.GameCounted)}">${formatDashboardPercent(gPct)}</strong>
        </button>
        ${activeCat === 'game' ? getDashboardCategoryDetail(row, 'game') : ""}

        <button type="button" class="dashboard-category-row ${activeCat === 'teamEvent' ? 'active' : ''}" data-dashboard-detail-key="${prefix}teamEvent" style="display:flex; justify-content:space-between; padding:10px; border-radius:8px; background:#f9f9f9; border:1px solid #eee; cursor:pointer;">
          <span style="font-weight:700; font-size:12px;">Events</span> <strong class="dashboard-percent-badge ${getDashboardPercentClass(tPct, row.TeamEventCounted)}">${formatDashboardPercent(tPct)}</strong>
        </button>
        ${activeCat === 'teamEvent' ? getDashboardCategoryDetail(row, 'teamEvent') : ""}
      </div>
    </article>`;
}

// --- MAIN CONTROLLER ---

async function loadDashboard() {
  if (!dashboardSection) return;
  try {
    setMessage(dashboardMessage, "Updating Dashboard...", false);
    if (refreshDashboardBtn) { refreshDashboardBtn.disabled = true; refreshDashboardBtn.textContent = "Loading..."; }
    
    const url = API_BASE + "/dashboard" + (dashboardSelectedMonth ? '?month=' + dashboardSelectedMonth : '');
    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();
    
    renderDashboardSummaryCards(data);
    renderBirthdays(data.birthdays || {});
    renderUpcomingSnapshot(data.upcomingSnapshot || []);
    
    if (dashboardMonthlySummary) {
      dashboardMonthlySummary.innerHTML = `<table class="dashboard-table"><thead><tr><th>Month</th><th>Prac %</th><th>Game %</th></tr></thead><tbody>${(data.monthlySummary || []).map(r => `<tr><td><strong>${r.AttendanceMonth}</strong></td><td><strong>${formatDashboardPercent(r.PracticePercent)}</strong></td><td><strong>${formatDashboardPercent(r.GamePercent)}</strong></td></tr>`).join("")}</tbody></table>`;
    }

    renderPracticeSummary(data.practiceSummary || {});
    renderGameSummary(data.gameSummary || {});
    renderEventSummary(data.eventSummary || {});
    
    renderCollapsiblePlayerSection(dashboardPlayerAlerts, dashboardPlayerAlertsCount, data.playerAlerts, "attention", "No players need attention.");
    renderCollapsiblePlayerSection(dashboardGoodPlayers, dashboardGoodPlayersCount, data.goodPlayers, "good", "None found.");
    renderCollapsiblePlayerSection(dashboardExceptionalPlayers, dashboardExceptionalPlayersCount, data.exceptionalPlayers, "exceptional", "None found.");
    renderCollapsiblePlayerSection(dashboardPerfectPlayers, dashboardPerfectPlayersCount, data.perfectPlayers, "perfect", "None found.");
    
    if (dashboardLastUpdated) dashboardLastUpdated.textContent = "Last updated: " + new Date().toLocaleString();
    setMessage(dashboardMessage, "Dashboard updated.", false);
  } catch (err) { setMessage(dashboardMessage, "Error loading dashboard.", true); }
  finally { if (refreshDashboardBtn) { refreshDashboardBtn.disabled = false; refreshDashboardBtn.textContent = "Refresh Dashboard"; } }
}

function ensureDashboardMonthFilterOptions() {
  if (!dashboardMonthFilter || dashboardMonthFilterReady) return;
  const current = getDashboardCurrentMonthValue();
  const options = [{ value: "", label: "All Months" }, { value: current, label: "Current Month" }];
  for (let i = 1; i <= 6; i++) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const v = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    options.push({ value: v, label: formatDashboardMonthLabel(v) });
  }
  dashboardMonthFilter.innerHTML = options.map(o => `<option value="${o.value}">${o.label}</option>`).join("");
  dashboardMonthFilter.value = dashboardSelectedMonth;
  dashboardMonthFilter.addEventListener("change", () => { dashboardSelectedMonth = dashboardMonthFilter.value; loadDashboard(); });
  dashboardMonthFilterReady = true;
}

function setupDashboardDetailClickHandlers() {
  [dashboardPlayerAlerts, dashboardGoodPlayers, dashboardExceptionalPlayers, dashboardPerfectPlayers].forEach(container => {
    if (!container || container.dataset.listener) return;
    container.dataset.listener = "true";
    container.addEventListener("click", async e => {
      const btn = e.target.closest(".dashboard-category-row");
      if (!btn) return;
      const key = btn.dataset.dashboardDetailKey;
      dashboardOpenDetailKey = (dashboardOpenDetailKey === key) ? "" : key;
      if (dashboardOpenDetailKey) {
        const parts = key.split("-");
        const pid = parts[1];
        const cat = parts[2];
        const eventType = cat === "practice" ? "Practice" : (cat === "game" ? "Game" : "Team Event");
        const res = await fetch(API_BASE + "/dashboard/player-dates/" + pid + "?eventType=" + eventType + (dashboardSelectedMonth ? '&month=' + dashboardSelectedMonth : ''), { credentials: "include" });
        const d = await res.json();
        if (d.success) dashboardPlayerDates[pid + "-" + cat] = d.dates;
      }
      loadDashboard();
    });
  });
}

function renderPracticeSummary(practice) {
  if (!dashboardPracticeSummary) return;
  const p = practice || {};
  const low = p.LowPracticePlayers || 0;
  const good = p.GoodPracticePlayers || 0;
  const high = p.HighPracticePlayers || 0;
  const noData = p.NoDataPracticePlayers || 0;
  const total = low + good + high + noData;
  dashboardPracticeSummary.innerHTML = `
    <div class="dashboard-stat-card">
      <div class="dashboard-stat-label">TOTAL PRACTICES</div>
      <div class="dashboard-stat-value">${p.TotalPractices || 0}</div>
      <div class="dashboard-stat-note">Selected month</div>
    </div>
    <div class="dashboard-stat-card">
      <div class="dashboard-stat-label">PRACTICE ATT %</div>
      <div class="dashboard-stat-value">${formatDashboardPercent(p.PracticeAttendancePercent)}</div>
      <div class="dashboard-stat-note">Team average &middot; excused not counted</div>
    </div>
    <div class="dashboard-stat-card" style="border-left:4px solid #ef4444;">
      <div class="dashboard-stat-label" style="color:#c62828;">&#128308; NEEDS ATTENTION</div>
      <div class="dashboard-stat-value">${low}</div>
      <div class="dashboard-stat-note">Practice &le;70%</div>
    </div>
    <div class="dashboard-stat-card" style="border-left:4px solid #f59e0b;">
      <div class="dashboard-stat-label" style="color:#b45309;">&#128993; GOOD</div>
      <div class="dashboard-stat-value">${good}</div>
      <div class="dashboard-stat-note">Practice 71&ndash;84%</div>
    </div>
    <div class="dashboard-stat-card" style="border-left:4px solid #22c55e;">
      <div class="dashboard-stat-label" style="color:#166534;">&#128994; STRONG</div>
      <div class="dashboard-stat-value">${high}</div>
      <div class="dashboard-stat-note">Practice &ge;85%</div>
    </div>`;
}
function renderGameSummary(game) {
  if (!dashboardGameSummary) return;
  const g = game || {};
  const low = g.LowGamePlayers || 0;
  const good = g.GoodGamePlayers || 0;
  const high = g.HighGamePlayers || 0;
  const noData = g.NoDataGamePlayers || 0;
  const total = low + good + high + noData;
  dashboardGameSummary.innerHTML = `
    <div class="dashboard-stat-card">
      <div class="dashboard-stat-label">TOTAL GAMES</div>
      <div class="dashboard-stat-value">${g.TotalGames || 0}</div>
      <div class="dashboard-stat-note">Selected month &middot; ${g.CancelledGames || 0} cancelled</div>
    </div>
    <div class="dashboard-stat-card">
      <div class="dashboard-stat-label">GAME ATT %</div>
      <div class="dashboard-stat-value">${formatDashboardPercent(g.GameAttendancePercent)}</div>
      <div class="dashboard-stat-note">Rostered players &middot; excused not counted</div>
    </div>
    <div class="dashboard-stat-card" style="border-left:4px solid #ef4444;">
      <div class="dashboard-stat-label" style="color:#c62828;">&#128308; NEEDS ATTENTION</div>
      <div class="dashboard-stat-value">${low}</div>
      <div class="dashboard-stat-note">Game &le;70%</div>
    </div>
    <div class="dashboard-stat-card" style="border-left:4px solid #f59e0b;">
      <div class="dashboard-stat-label" style="color:#b45309;">&#128993; GOOD</div>
      <div class="dashboard-stat-value">${good}</div>
      <div class="dashboard-stat-note">Game 71&ndash;84%</div>
    </div>
    <div class="dashboard-stat-card" style="border-left:4px solid #22c55e;">
      <div class="dashboard-stat-label" style="color:#166534;">&#128994; STRONG</div>
      <div class="dashboard-stat-value">${high}</div>
      <div class="dashboard-stat-note">Game &ge;85%</div>
    </div>
    <div class="dashboard-stat-card" id="gameNotRosteredCard" style="border-left:4px solid #94a3b8; cursor:pointer;" onclick="toggleGameNotRostered()">
      <div class="dashboard-stat-label" style="color:#475569;">&#9898; NOT ROSTERED <span id="gameNotRosteredArrow" style="font-size:10px; color:#f57c00;">&#9660;</span></div>
      <div class="dashboard-stat-value">${noData}</div>
      <div class="dashboard-stat-note">These players have not been rostered for any game this month</div>
    </div>
    <div id="gameNotRosteredPanel" style="grid-column: 1 / -1; display:none;"></div>`;

  window._gameNotRosteredOpen = false;
}

async function toggleGameNotRostered() {
  const panel = document.getElementById("gameNotRosteredPanel");
  const arrow = document.getElementById("gameNotRosteredArrow");
  const card  = document.getElementById("gameNotRosteredCard");
  if (!panel) return;

  window._gameNotRosteredOpen = !window._gameNotRosteredOpen;

  if (!window._gameNotRosteredOpen) {
    panel.style.display = "none";
    if (arrow) arrow.innerHTML = "&#9660;";
    if (card)  card.style.boxShadow = "";
    return;
  }

  if (arrow) arrow.innerHTML = "&#9650;";
  if (card)  card.style.boxShadow = "0 4px 12px rgba(245,124,0,0.15)";
  panel.style.display = "block";
  panel.innerHTML = `<div style="padding:16px; color:#999;">Loading players...</div>`;

  try {
    const monthParam = dashboardSelectedMonth ? "&month=" + dashboardSelectedMonth : "";
    const res = await fetch(API_BASE + "/dashboard/summary-players?category=gamenotrostered" + monthParam, { credentials: "include" });
    const data = await res.json();
    const players = data.players || [];

    if (!players.length) {
      panel.innerHTML = `<div style="padding:16px; color:#666;">All active players are rostered for at least one game this month.</div>`;
      return;
    }

    const rows = players.map((p, i) => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-bottom:1px solid #eee; background:${i % 2 === 0 ? "#fff" : "#f9f9f9"};">
        <span style="font-weight:600;">${escapeDashboardHtml(p.FirstName + " " + p.LastName)}${p.PlayerNumber != null ? ' <span style="color:#999;font-size:12px;">#' + p.PlayerNumber + '</span>' : ""}</span>
        <span style="color:#64748b; font-size:12px; font-weight:600;">${escapeDashboardHtml(p.GroupName || String(p.BirthYear || ""))}</span>
      </div>`).join("");

    panel.innerHTML = `
      <div style="margin:8px 0 15px; background:#fff; border:1px solid #ddd; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08);">
        <div style="background:#f8f9fa; padding:14px 16px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
          <div style="font-weight:800; font-size:14px;">&#9898; Not Rostered for Any Game (${players.length})</div>
          <button onclick="toggleGameNotRostered()" style="background:#eee; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer; font-size:13px;">&#x2715;</button>
        </div>
        <div style="max-height:320px; overflow-y:auto;">${rows}</div>
      </div>`;
  } catch (err) {
    console.error("Not rostered load error:", err);
    panel.innerHTML = `<div style="padding:16px; color:#c00;">Could not load players.</div>`;
  }
}
function renderEventSummary(event) {
  if (!dashboardEventSummary) return;
  const ev = event || {};
  const low = ev.LowEventPlayers || 0;
  const good = ev.GoodEventPlayers || 0;
  const high = ev.HighEventPlayers || 0;
  const noData = ev.NoDataEventPlayers || 0;
  const total = low + good + high + noData;
  dashboardEventSummary.innerHTML = `
    <div class="dashboard-stat-card">
      <div class="dashboard-stat-label">TOTAL EVENTS</div>
      <div class="dashboard-stat-value">${ev.TotalEvents || 0}</div>
      <div class="dashboard-stat-note">Scrimmages / team events &middot; ${ev.CancelledEvents || 0} cancelled</div>
    </div>
    <div class="dashboard-stat-card">
      <div class="dashboard-stat-label">EVENT ATT %</div>
      <div class="dashboard-stat-value">${formatDashboardPercent(ev.EventAttendancePercent)}</div>
      <div class="dashboard-stat-note">Rostered players &middot; excused not counted</div>
    </div>
    <div class="dashboard-stat-card" style="border-left:4px solid #ef4444;">
      <div class="dashboard-stat-label" style="color:#c62828;">&#128308; NEEDS ATTENTION</div>
      <div class="dashboard-stat-value">${low}</div>
      <div class="dashboard-stat-note">Event &le;70%</div>
    </div>
    <div class="dashboard-stat-card" style="border-left:4px solid #f59e0b;">
      <div class="dashboard-stat-label" style="color:#b45309;">&#128993; GOOD</div>
      <div class="dashboard-stat-value">${good}</div>
      <div class="dashboard-stat-note">Event 71&ndash;84%</div>
    </div>
    <div class="dashboard-stat-card" style="border-left:4px solid #22c55e;">
      <div class="dashboard-stat-label" style="color:#166534;">&#128994; STRONG</div>
      <div class="dashboard-stat-value">${high}</div>
      <div class="dashboard-stat-note">Event &ge;85%</div>
    </div>`;
}

ensureDashboardMonthFilterOptions();
setupDashboardDetailClickHandlers();

function renderMonthlySummary(rows) {
  if (!dashboardMonthlySummary) return;

  if (!rows || rows.length === 0) {
    dashboardMonthlySummary.innerHTML = `<div class="roster-empty-message">No attendance records found yet.</div>`;
    return;
  }

  dashboardMonthlySummary.innerHTML = `
    <table class="dashboard-table dashboard-monthly-table dashboard-monthly-simple-table dashboard-monthly-six-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Practices</th>
          <th>Practice %</th>
          <th>Games</th>
          <th>Game %</th>
          <th>Events</th>
          <th>Event %</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            <td><strong>${escapeDashboardHtml(row.AttendanceMonth || "-")}</strong></td>
            <td>${row.PracticeTotal || 0}</td>
            <td><strong>${formatDashboardPercent(row.PracticePercent)}</strong></td>
            <td>${row.GameTotal || 0}</td>
            <td><strong>${formatDashboardPercent(row.GamePercent)}</strong></td>
            <td>${row.EventTotal || 0}</td>
            <td><strong>${formatDashboardPercent(row.EventPercent)}</strong></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function getDashboardCategoryConfig(category) {
  if (category === "practice") {
    return {
      label: "Practice",
      counted: "PracticeCounted",
      present: "PracticePresent",
      absent: "PracticeAbsent",
      excused: "PracticeExcused",
      cancelled: "PracticeCancelled",
      percent: "PracticePercent"
    };
  }

  if (category === "game") {
    return {
      label: "Game",
      counted: "GameCounted",
      present: "GamePresent",
      absent: "GameAbsent",
      excused: "GameExcused",
      cancelled: "GameCancelled",
      percent: "GamePercent"
    };
  }

  return {
    label: "Team Event",
    counted: "TeamEventCounted",
    present: "TeamEventPresent",
    absent: "TeamEventAbsent",
    excused: "TeamEventExcused",
    cancelled: "TeamEventCancelled",
    percent: "TeamEventPercent"
  };
}

function renderDashboardCategoryButtons(row, cardType) {
  const playerId = row.PlayerID;

  function button(category, label, percentField, countedField) {
    const detailKey = `${cardType}-${playerId}-${category}`;
    const active = dashboardOpenDetailKey === detailKey;
    const badgeClass = getDashboardPercentClass(row[percentField], row[countedField]);

    return `
      <button type="button" class="dashboard-category-btn ${active ? "active-dashboard-category" : ""}" data-dashboard-detail-key="${detailKey}">
        <span>${label}</span>
        <strong class="dashboard-percent-badge ${badgeClass}">${formatDashboardPercent(row[percentField])}</strong>
      </button>
    `;
  }

  return `
    <div class="dashboard-alert-metrics dashboard-clickable-metrics">
      ${button("practice", "Practice", "PracticePercent", "PracticeCounted")}
      ${button("game", "Game", "GamePercent", "GameCounted")}
      ${button("teamEvent", "Team Event", "TeamEventPercent", "TeamEventCounted")}
    </div>
  `;
}

function getOpenDashboardDetail(row, cardType) {
  const playerId = row.PlayerID;
  const prefix = `${cardType}-${playerId}-`;

  if (!dashboardOpenDetailKey || !dashboardOpenDetailKey.startsWith(prefix)) return "";

  const category = dashboardOpenDetailKey.replace(prefix, "");
  return getDashboardCategoryDetail(row, category);
}

function renderPlayerAlerts(rows) {
  renderCollapsiblePlayerSection(
    dashboardPlayerAlerts,
    dashboardPlayerAlertsCount,
    rows,
    "attention",
    "No players are at 70% or lower for practices or games in the selected month."
  );
}

function renderGoodPlayers(rows) {
  renderCollapsiblePlayerSection(
    dashboardGoodPlayers,
    dashboardGoodPlayersCount,
    rows,
    "good",
    "No players in the 71%-84% attendance range for the selected month."
  );
}

function renderPerfectPlayers(rows) {
  renderCollapsiblePlayerSection(
    dashboardPerfectPlayers,
    dashboardPerfectPlayersCount,
    rows,
    "perfect",
    "No players have 100% attendance for both practices and games in the selected month yet."
  );
}

function renderExceptionalPlayers(rows) {
  renderCollapsiblePlayerSection(
    dashboardExceptionalPlayers,
    dashboardExceptionalPlayersCount,
    rows,
    "exceptional",
    "No players have outstanding attendance at 85% or higher for both practices and games in the selected month yet."
  );
}