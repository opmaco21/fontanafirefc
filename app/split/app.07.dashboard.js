/* =========================================================
   FONTANA FIRE FC ATTENDANCE APP
   MASTER DASHBOARD (FULL CONSOLIDATED VERSION)
   Updated: June 25, 2026
   ========================================================= */

// --- DASHBOARD STATE ---
let dashboardSelectedMonth = new Date().toISOString().slice(0, 7); 
let dashboardMonthFilterReady = false;
let dashboardPlayerDates = {};
let dashboardOpenSummaryCard = ""; 
let dashboardSummaryPlayerCache = {}; 
let dashboardOpenDetailKey = "";

// --- UTILITIES & FORMATTERS ---

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
  const date = new Date(Number(parts[0]), Number(parts[1]), 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function escapeDashboardHtml(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatDashboardPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0.0%";
  return `${num.toFixed(1)}%`;
}

function formatDashboardBirthday(value) {
  if (!value) return "-";
  const raw = String(value);
  const dateOnly = raw.includes("T") ? raw.split("T")[0] : raw.substring(0, 10);
  const parts = dateOnly.split("-");
  return parts.length === 3 ? `${parts[1]}/${parts[2]}` : escapeDashboardHtml(raw);
}

function formatDashboardDate(value) {
  if (!value) return "-";
  const raw = String(value);
  const dateOnly = raw.includes("T") ? raw.split("T")[0] : raw.substring(0, 10);
  const parts = dateOnly.split("-");
  return parts.length === 3 ? `${parts[1]}/${parts[2]}/${parts[0]}` : escapeDashboardHtml(raw);
}

function formatDashboardTime(value) {
  if (!value) return "Time TBD";
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return escapeDashboardHtml(value);
  let hour = Number(match[1]);
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${match[2]} ${suffix}`;
}

function getDashboardPercentClass(value, counted) {
  const percent = Number(value);
  if (!Number(counted || 0)) return "dashboard-percent-none";
  if (percent === 100) return "dashboard-percent-perfect";
  if (percent >= 85) return "dashboard-percent-good";
  if (percent > 70) return "dashboard-percent-watch";
  return "dashboard-percent-low";
}

// --- TOP SUMMARY CARDS & PANELS ---

function renderDashboardCard(label, value, note = "", clickAction = "") {
  const isOpen = clickAction && dashboardOpenSummaryCard === clickAction;
  const clickAttr = clickAction
    ? `data-dash-card="${escapeDashboardHtml(clickAction)}" tabindex="0" role="button" style="cursor:pointer;${isOpen ? "border-color:#f57c00;box-shadow:0 0 0 2px rgba(245,124,0,0.15);" : ""}"`
    : "";
  const arrow = clickAction ? ` <span style="font-size:9px;color:#f57c00;vertical-align:middle;">${isOpen ? "▲" : "▼"}</span>` : "";
  return `
    <div class="dashboard-stat-card" ${clickAttr}>
      <div class="dashboard-stat-label">${escapeDashboardHtml(label)}${arrow}</div>
      <div class="dashboard-stat-value">${value}</div>
      ${note ? `<div class="dashboard-stat-note">${escapeDashboardHtml(note)}</div>` : ""}
    </div>
  `;
}

function renderDashboardSummaryCards(data) {
  if (!dashboardSummaryCards) return;
  const totals = data.playerTotals || {};
  const snack = data.snackTotals || {};
  const paperwork = data.paperworkTotals || {};
  const photo = data.photoReleaseTotals || {};

  // Logic to ensure 65 active players are represented
  const activeCount = totals.ActivePlayers || 0;
  const optIn = photo.OptInPhotoRelease || 0;
  const optOut = photo.OptOutPhotoRelease || 0;
  const missingPhoto = activeCount - optIn - optOut;

  const cards = [
    renderDashboardCard("Inactive Players", totals.InactivePlayers || 0, `${activeCount} active players`, "active"),
    renderDashboardCard("Missing Paperwork", paperwork.MissingPaperwork || 0, `${paperwork.CompletePaperwork || 0} complete`, "paperwork"),
    renderDashboardCard("Photo Release", optIn, `${optIn} In · ${optOut} Out · ${missingPhoto} Missing`, "photo"),
    renderDashboardCard("Bring Snack", snack.BringSnackPlayers || 0, "Parent rotation", "snack"),
    renderDashboardCard("Paid Out", snack.PaidOutPlayers || 0, "Coach provides", "paidout")
  ].join("");

  dashboardSummaryCards.innerHTML = cards + `<div id="dashboardSummaryPanel" style="grid-column:1/-1;"></div>`;

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
      if (panel) panel.innerHTML = `<div style="padding:12px;color:#999;font-size:13px;">Loading list...</div>`;

      if (!dashboardSummaryPlayerCache[category]) {
        try {
          const res = await fetch(`${API_BASE}/dashboard/summary-players?category=${encodeURIComponent(category)}`, { credentials: "include" });
          const d = await res.json();
          if (d.success) dashboardSummaryPlayerCache[category] = d.players;
        } catch (e) { console.error("Summary load error:", e); }
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
  
  const titles = { active: "Inactive Players", paperwork: "Missing Paperwork", photo: "Photo Release Issues", snack: "Bring Snack Rotation", paidout: "Coach Provided Snacks" };
  const subtitles = { active: "Currently inactive", paperwork: "Needs paperwork", photo: "Missing/Out", snack: "Families in rotation", paidout: "Players who paid out" };

  const actionBtn = category === "active" 
    ? `<button onclick="if(typeof playerManagementTab!=='undefined')playerManagementTab.click();" class="btn-dashboard-panel-action">→ Player Management</button>`
    : `<button onclick="reportsTab.click();" class="btn-dashboard-panel-action">→ View Report</button>`;

  const formatPlayer = (p) => {
    const extra = {
      paperwork: p.PaperworkStatus ? ` · ${p.PaperworkStatus}` : " · Not Received",
      photo: p.PhotoReleaseStatus === "No" ? " · Opted Out" : " · Missing",
      active: p.BirthYear ? ` · ${p.BirthYear}` : ""
    }[category] || "";
    return `<div class="dashboard-panel-player-row"><span class="name">${escapeDashboardHtml(`${p.FirstName} ${p.LastName}`)}</span><span class="meta">${escapeDashboardHtml(extra)}</span></div>`;
  };

  panel.innerHTML = `
    <div class="dashboard-expansion-panel" style="border-left: 4px solid #f57c00;">
      <div class="panel-header">
        <div>
          <div class="title">${escapeDashboardHtml(titles[category] || "")}</div>
          <div class="subtitle">${players.length} players</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${actionBtn}
          <button onclick="dashboardOpenSummaryCard=''; renderSummaryPanel(null);" class="panel-close-btn">&times;</button>
        </div>
      </div>
      <div class="panel-list">${players.length === 0 ? '<div class="empty">No players found.</div>' : players.map(formatPlayer).join("")}</div>
    </div>`;
}

// --- BIRTHDAYS & UPCOMING ---

function renderBirthdays(data) {
  if (!dashboardBirthdays) return;
  const thisMonth = data.thisMonth || [];
  const nextMonth = data.nextMonth || [];
  
  function list(items, emptyText) {
    if (!items.length) return `<p class="subtext">${escapeDashboardHtml(emptyText)}</p>`;
    return `<ul class="birthday-player-list">${items.map(p => `
      <li class="birthday-player-item">
        <strong class="birthday-player-name">${escapeDashboardHtml(p.FirstName)} ${escapeDashboardHtml(p.LastName)}</strong>
        <span class="birthday-player-date">${formatDashboardBirthday(p.DateOfBirth)}${p.BirthYear ? ` | ${escapeDashboardHtml(p.BirthYear)}` : ""}</span>
      </li>`).join("")}</ul>`;
  }

  const selectedLabel = dashboardSelectedMonth ? formatDashboardMonthLabel(dashboardSelectedMonth) : "This Month";
  const nextMonthVal = dashboardSelectedMonth ? getNextDashboardMonthValue(dashboardSelectedMonth) : "";
  const nextLabel = nextMonthVal ? formatDashboardMonthLabel(nextMonthVal) : "Next Month";

  dashboardBirthdays.innerHTML = `
    <div class="dashboard-mini-card dashboard-birthday-current" style="border-left: 4px solid #f57c00;">
      <h4 style="color: #f57c00;">${escapeDashboardHtml(selectedLabel)} <span class="birthday-count-badge">${thisMonth.length}</span></h4>
      ${list(thisMonth, `No birthdays for ${selectedLabel}.`)}
    </div>
    <div class="dashboard-mini-card dashboard-birthday-next" style="border-left: 4px solid #6366f1;">
      <h4 style="color: #6366f1;">${escapeDashboardHtml(nextLabel)} <span class="birthday-count-badge">${nextMonth.length}</span></h4>
      ${list(nextMonth, `No birthdays for ${nextLabel}.`)}
    </div>`;
}

function renderUpcomingSnapshot(rows) {
  const container = document.getElementById("dashboardUpcomingSnapshot");
  if (!container) return;
  if (!rows || rows.length === 0) {
    container.innerHTML = `<div class="roster-empty-message">No upcoming games or events.</div>`;
    return;
  }
  const snapshotNote = dashboardSelectedMonth ? `${rows.length} found for ${formatDashboardMonthLabel(dashboardSelectedMonth)}.` : `Showing next ${rows.length} upcoming events.`;

  container.innerHTML = `<div class="dashboard-upcoming-count">${snapshotNote}</div>` + rows.map(event => {
    const eventType = event.EventType || "Event";
    const status = event.EventStatus || "Scheduled";
    const typeClass = eventType === "Game" ? "snapshot-card--game" : (eventType === "Team Event" ? "snapshot-card--team-event" : "snapshot-card--practice");
    const cancelledClass = status === "Cancelled" ? "snapshot-card--cancelled" : "";
    const statusPillClass = status === "Completed" ? "snapshot-status--completed" : (status === "Cancelled" ? "snapshot-status--cancelled" : "snapshot-status--scheduled");
    const snackChip = eventType === "Game" ? `<div class="snapshot-snack-chip">🍎 Snack: ${escapeDashboardHtml(event.AssignedSnackFamily || "Not assigned")}</div>` : "";

    return `
      <article class="dashboard-upcoming-card snapshot-card ${typeClass} ${cancelledClass}">
        <div class="snapshot-topline">
          <div class="snapshot-name-block">
            <div class="snapshot-name" ${status === "Cancelled" ? 'style="text-decoration:line-through;"' : ""}>${escapeDashboardHtml(event.EventName || eventType)}</div>
            <div class="snapshot-datetime">${formatDashboardDate(event.EventDate)} &middot; ${formatDashboardTime(event.StartTime)}</div>
          </div>
          <span class="snapshot-status-pill ${statusPillClass}">${status === 'Completed' ? '✓ ' : ''}${status}</span>
        </div>
        <div class="snapshot-meta"><span><strong>Location:</strong> ${escapeDashboardHtml(event.LocationName || "TBD")}</span></div>
        ${snackChip}
      </article>`;
  }).join("");
}

// --- TABLES & SUMMARIES ---

function renderMonthlySummary(rows) {
  if (!dashboardMonthlySummary) return;
  if (!rows || rows.length === 0) {
    dashboardMonthlySummary.innerHTML = `<div class="roster-empty-message">No records found.</div>`;
    return;
  }
  dashboardMonthlySummary.innerHTML = `
    <table class="dashboard-table dashboard-monthly-simple-table">
      <thead><tr><th>Month</th><th>Practices</th><th>Practice %</th><th>Games</th><th>Game %</th><th>Events</th><th>Event %</th></tr></thead>
      <tbody>${rows.map(row => `<tr>
          <td><strong>${escapeDashboardHtml(row.AttendanceMonth || "-")}</strong></td>
          <td>${row.PracticeTotal || 0}</td><td><strong>${formatDashboardPercent(row.PracticePercent)}</strong></td>
          <td>${row.GameTotal || 0}</td><td><strong>${formatDashboardPercent(row.GamePercent)}</strong></td>
          <td>${row.EventTotal || 0}</td><td><strong>${formatDashboardPercent(row.EventPercent)}</strong></td>
        </tr>`).join("")}</tbody>
    </table>`;
}

function renderPracticeSummary(s) {
  if (!dashboardPracticeSummary) return;
  dashboardPracticeSummary.innerHTML = [
    renderDashboardCard("Total Practices", s.TotalPractices || 0),
    renderDashboardCard("Practice Att %", formatDashboardPercent(s.PracticeAttendancePercent)),
    renderDashboardCard("70% or Lower", s.LowPracticePlayers || 0),
    renderDashboardCard("85% or Higher", s.HighPracticePlayers || 0)
  ].join("");
}

function renderGameSummary(s) {
  if (!dashboardGameSummary) return;
  dashboardGameSummary.innerHTML = [
    renderDashboardCard("Total Games", s.TotalGames || 0),
    renderDashboardCard("Game Att %", formatDashboardPercent(s.GameAttendancePercent)),
    renderDashboardCard("70% or Lower", s.LowGamePlayers || 0),
    renderDashboardCard("85% or Higher", s.HighGamePlayers || 0)
  ].join("");
}

function renderEventSummary(s) {
  if (!dashboardEventSummary) return;
  dashboardEventSummary.innerHTML = [
    renderDashboardCard("Total Events", s.TotalEvents || 0),
    renderDashboardCard("Event Att %", formatDashboardPercent(s.EventAttendancePercent)),
    renderDashboardCard("70% or Lower", s.LowEventPlayers || 0),
    renderDashboardCard("85% or Higher", s.HighEventPlayers || 0)
  ].join("");
}

// --- PLAYER ALERTS & DRILL-DOWN ---

function getDashboardCategoryDetail(row, cat) {
  const cfg = { practice: { l: "Practice", c: "PracticeCounted", p: "PracticePercent" }, game: { l: "Game", c: "GameCounted", p: "GamePercent" }, teamEvent: { l: "Event", c: "TeamEventCounted", p: "TeamEventPercent" } }[cat];
  const dates = dashboardPlayerDates[`${row.PlayerID}-${cat}`] || [];
  const missed = dates.filter(d => d.AttendanceStatus === "Absent" || d.AttendanceStatus === "No Record").map(d => 
    `<div style="font-size:12px;color:#555;padding:2px 0;border-bottom:1px solid #f3f4f6;">${formatDashboardDate(d.EventDate)}</div>`
  ).join("");
  return `
    <div class="dashboard-player-detail-box">
      <strong>${cfg.l} Details</strong>
      <div class="dashboard-player-detail-grid"><span>Counted: <strong>${row[cfg.c]}</strong></span><span>Att %: <strong>${formatDashboardPercent(row[cfg.p])}</strong></span></div>
      ${missed ? `<div style="font-weight:700;color:#c62828;margin-top:8px;">Missed (${dates.filter(d=>d.AttendanceStatus==="Absent" || d.AttendanceStatus === "No Record").length})</div>` + missed : ""}
    </div>`;
}

function renderPlayerAlertCard(row, cardType) {
  const name = `${row.FirstName} ${row.LastName}`;
  const prefix = `${cardType}-${row.PlayerID}-`;
  const activeCat = dashboardOpenDetailKey.startsWith(prefix) ? dashboardOpenDetailKey.replace(prefix, "") : "";
  const badgeClass = `dashboard-${cardType}-badge`;

  return `
    <article class="dashboard-alert-card dashboard-${cardType}-card">
      <div class="dashboard-alert-topline">
        <div><h4>${escapeDashboardHtml(name)}</h4><p>Birth Year: <strong>${row.BirthYear || "-"}</strong></p></div>
        <span class="dashboard-alert-badge ${badgeClass}">${row.AlertType || row.HighlightType || "Info"}</span>
      </div>
      <p class="dashboard-alert-detail">${row.AlertDetail || row.HighlightDetail || "Attendance record check."}</p>
      <div class="dashboard-alert-metrics dashboard-clickable-metrics">
        ${['practice', 'game', 'teamEvent'].map(c => `<button type="button" class="dashboard-category-btn ${activeCat === c ? 'active-dashboard-category' : ''}" data-dashboard-detail-key="${prefix}${c}"><span>${c}</span><strong class="dashboard-percent-badge">${formatDashboardPercent(row[c+'Percent'])}</strong></button>`).join("")}
      </div>
      ${activeCat ? getDashboardCategoryDetail(row, activeCat) : ""}
    </article>`;
}

function renderCollapsiblePlayerSection(container, countEl, rows, cardType, emptyText) {
  if (countEl) countEl.textContent = `${rows?.length || 0} players`;
  if (container) container.innerHTML = rows?.length ? rows.map(row => renderPlayerAlertCard(row, cardType)).join("") : `<div class="roster-empty-message">${emptyText}</div>`;
}

// --- CONTROLLER ---

async function loadDashboard() {
  if (!dashboardSection) return;
  try {
    setMessage(dashboardMessage, "Updating Dashboard...", false);
    if (refreshDashboardBtn) { refreshDashboardBtn.disabled = true; refreshDashboardBtn.textContent = "Loading..."; }

    const res = await fetch(`${API_BASE}/dashboard${dashboardSelectedMonth ? '?month='+dashboardSelectedMonth : ''}`, { credentials: "include" });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    renderDashboardSummaryCards(data);
    renderBirthdays(data.birthdays || {});
    renderUpcomingSnapshot(data.upcomingSnapshot || []);
    renderMonthlySummary(data.monthlySummary || []);
    renderPracticeSummary(data.practiceSummary || {});
    renderGameSummary(data.gameSummary || {});
    renderEventSummary(data.eventSummary || {});

    renderCollapsiblePlayerSection(dashboardPlayerAlerts, dashboardPlayerAlertsCount, data.playerAlerts, "attention", "No players need attention.");
    renderCollapsiblePlayerSection(dashboardGoodPlayers, dashboardGoodPlayersCount, data.goodPlayers, "good", "None found.");
    renderCollapsiblePlayerSection(dashboardExceptionalPlayers, dashboardExceptionalPlayersCount, data.exceptionalPlayers, "exceptional", "None found.");
    renderCollapsiblePlayerSection(dashboardPerfectPlayers, dashboardPerfectPlayersCount, data.perfectPlayers, "perfect", "None found.");

    if (dashboardLastUpdated) dashboardLastUpdated.textContent = `Last updated: ${new Date().toLocaleString()}`;
    setMessage(dashboardMessage, "Dashboard updated.", false);
  } catch (err) { setMessage(dashboardMessage, "Error loading dashboard.", true); }
  finally { if (refreshDashboardBtn) { refreshDashboardBtn.disabled = false; refreshDashboardBtn.textContent = "Refresh Dashboard"; } }
}

function ensureDashboardMonthFilterOptions() {
  if (!dashboardMonthFilter || dashboardMonthFilterReady) return;
  const current = getDashboardCurrentMonthValue();
  const options = [{ value: "", label: "All Months" }, { value: current, label: `Current Month` }];
  for (let i = 1; i <= 6; i++) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
      const btn = e.target.closest(".dashboard-category-btn");
      if (!btn) return;
      const key = btn.dataset.dashboardDetailKey;
      dashboardOpenDetailKey = (dashboardOpenDetailKey === key) ? "" : key;
      if (dashboardOpenDetailKey) {
        const [type, pid, cat] = key.split("-");
        const eventType = cat === "practice" ? "Practice" : (cat === "game" ? "Game" : "Team Event");
        const res = await fetch(`${API_BASE}/dashboard/player-dates/${pid}?eventType=${eventType}${dashboardSelectedMonth ? '&month='+dashboardSelectedMonth : ''}`, { credentials: "include" });
        const d = await res.json();
        if (d.success) dashboardPlayerDates[`${pid}-${cat}`] = d.dates;
      }
      loadDashboard();
    });
  });
}

ensureDashboardMonthFilterOptions();
setupDashboardDetailClickHandlers();