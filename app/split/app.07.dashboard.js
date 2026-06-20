/* =========================================================
   FONTANA FIRE FC ATTENDANCE APP
   Batch 6E Dashboard Summary + Collapsible Player Reports

   Purpose:
   - Dashboard stays a reporting screen, not Player Management.
   - Monthly summary shows Practices, Games, Team Events and percentages.
   - Practice, Game, and Event summaries are separate.
   - Player report sections are collapsible.
   - Player cards show details only after clicking Practice, Game, or Team Event.
   ========================================================= */

let dashboardSelectedMonth = new Date().toISOString().slice(0, 7); // default to current month (YYYY-MM)
let dashboardMonthFilterReady = false;
let dashboardPlayerDates = {};
let dashboardOpenSummaryCard = ""; // tracks which top summary card is expanded
let dashboardSummaryPlayerCache = {}; // cache of player lists per card
let dashboardOpenDetailKey = "";

function getDashboardCurrentMonthValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function formatDashboardMonthLabel(value) {
  if (!value) return "All Months";
  const parts = String(value).split("-");
  if (parts.length !== 2) return value;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!year || !month) return value;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function getNextDashboardMonthValue(value) {
  if (!value) return "";
  const parts = String(value).split("-");
  if (parts.length !== 2) return "";
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!year || !month) return "";
  const date = new Date(year, month, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function ensureDashboardMonthFilterOptions() {
  if (!dashboardMonthFilter || dashboardMonthFilterReady) return;

  const currentMonth = getDashboardCurrentMonthValue();

  // Generate last 6 months dynamically so the list never goes stale.
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
    .filter(option => {
      const key = option.value || "all";
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(option => `<option value="${option.value}">${option.label}</option>`)
    .join("");

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
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDashboardPercent(value) {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
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

function getDashboardPercentClass(value, counted) {
  const percent = Number(value);
  const total = Number(counted || 0);

  if (!total) return "dashboard-percent-none";

  /*
    Excel-compatible attendance rule:
    100% should stay metallic gold.
    Percentages are calculated by the backend as:
    Present / (Present + Absent)
    Excused and Cancelled do not count against percentage.
  */
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
    ? `<div style="margin-top:6px;">
        <button onclick="event.stopPropagation();openReportFromDashboard(${JSON.stringify(reportAction)})"
          style="font-size:10px;font-weight:700;color:#f57c00;background:none;border:none;padding:0;cursor:pointer;text-decoration:underline;">
          → View Report
        </button>
       </div>`
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

function renderDashboardSummaryCards(data) {
  if (!dashboardSummaryCards) return;

  const totals = data.playerTotals || {};
  const snack = data.snackTotals || {};
  const paperwork = data.paperworkTotals || {};
  const photo = data.photoReleaseTotals || {};
  const emergency = data.emergencyTotals || {};

  const cards = [
    renderDashboardCard("Active Players", totals.ActivePlayers || 0, `${totals.InactivePlayers || 0} inactive`, "active"),
    renderDashboardCard("Missing Paperwork", paperwork.MissingPaperwork || 0, `${paperwork.CompletePaperwork || 0} complete`, "paperwork"),
    renderDashboardCard("Photo Release Missing", photo.MissingPhotoRelease || 0, `${photo.ReceivedPhotoRelease || 0} received`, "photo"),
    renderDashboardCard("Emergency Info Missing", emergency.MissingEmergencyInfo || 0, `${emergency.CompleteEmergencyInfo || 0} complete`, "emergency"),
    renderDashboardCard("Bring Snack", snack.BringSnackPlayers || 0, "Parent snack rotation", "snack"),
    renderDashboardCard("Paid Out", snack.PaidOutPlayers || 0, "Coach provides snacks", "paidout")
  ].join("");

  // Expandable panel below cards
  const panelHtml = `<div id="dashboardSummaryPanel" style="grid-column:1/-1;"></div>`;

  dashboardSummaryCards.innerHTML = cards + panelHtml;

  // Wire click handlers
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
      if (panel) panel.innerHTML = `<div style="padding:12px;color:#999;font-size:13px;">Loading...</div>`;

      if (!dashboardSummaryPlayerCache[category]) {
        try {
          const res = await fetch(`${API_BASE}/dashboard/summary-players?category=${encodeURIComponent(category)}`, { credentials: "include" });
          const data = await res.json();
          if (data.success) dashboardSummaryPlayerCache[category] = data.players;
        } catch (e) {
          console.error("Failed to load summary players:", e);
        }
      }
      renderSummaryPanel(category);
    });
  });

  // Re-render panel if a card was already open
  if (dashboardOpenSummaryCard) {
    renderSummaryPanel(dashboardOpenSummaryCard);
  }
}

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

function renderBirthdays(data) {
  if (!dashboardBirthdays) return;

  const thisMonth = data.thisMonth || [];
  const nextMonth = data.nextMonth || [];

  function list(items, emptyText) {
    if (!items.length) return `<p class="subtext">${escapeDashboardHtml(emptyText)}</p>`;
    return `
      <ul class="birthday-player-list">
        ${items.map(player => `
          <li class="birthday-player-item">
            <strong class="birthday-player-name">${escapeDashboardHtml(player.FirstName)} ${escapeDashboardHtml(player.LastName)}</strong>
            <span class="birthday-player-date">${formatDashboardBirthday(player.DateOfBirth)}${player.BirthYear ? ` &nbsp;|&nbsp; ${escapeDashboardHtml(player.BirthYear)}` : ""}</span>
          </li>
        `).join("")}
      </ul>
    `;
  }

  const selectedBirthdayLabel = dashboardSelectedMonth
    ? formatDashboardMonthLabel(dashboardSelectedMonth)
    : "This Month";

  const nextBirthdayMonth = dashboardSelectedMonth
    ? getNextDashboardMonthValue(dashboardSelectedMonth)
    : "";

  const nextBirthdayLabel = nextBirthdayMonth
    ? formatDashboardMonthLabel(nextBirthdayMonth)
    : "Next Month";

  // Heading is just "Birthdays" - counts go inside each card
  const birthdayHeading = document.getElementById("dashboardBirthdaysHeading");
  if (birthdayHeading) {
    birthdayHeading.textContent = "Birthdays";
  }

  const thisCount = thisMonth.length;
  const nextCount = nextMonth.length;
  const thisCountLabel = thisCount === 1 ? "1 player" : `${thisCount} players`;
  const nextCountLabel = nextCount === 1 ? "1 player" : `${nextCount} players`;

  dashboardBirthdays.innerHTML = `
    <div class="dashboard-mini-card dashboard-birthday-current">
      <h4>${escapeDashboardHtml(selectedBirthdayLabel)} <span class="birthday-count-badge">${thisCountLabel}</span></h4>
      ${list(thisMonth, `No birthdays for ${selectedBirthdayLabel}.`)}
    </div>
    <div class="dashboard-mini-card dashboard-birthday-next">
      <h4>${escapeDashboardHtml(nextBirthdayLabel)} <span class="birthday-count-badge">${nextCountLabel}</span></h4>
      ${list(nextMonth, `No birthdays for ${nextBirthdayLabel}.`)}
    </div>
  `;
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

function renderUpcomingSnapshot(rows) {
  const container = typeof dashboardUpcomingSnapshot !== "undefined"
    ? dashboardUpcomingSnapshot
    : document.getElementById("dashboardUpcomingSnapshot");

  if (!container) return;

  if (!rows || rows.length === 0) {
    container.innerHTML = `
      <div class="roster-empty-message">No games or team events found for this view.</div>
    `;
    return;
  }

  const snapshotCount = rows.length;
  const snapshotNote = dashboardSelectedMonth
    ? `${snapshotCount} ${snapshotCount === 1 ? "game/event" : "games/events"} found for ${formatDashboardMonthLabel(dashboardSelectedMonth)}.`
    : `Showing next ${snapshotCount} upcoming ${snapshotCount === 1 ? "game/event" : "games/events"}.`;

  const cardsHtml = rows.map(event => {
    const eventType = event.EventType || "Event";
    const eventName = event.EventName || eventType;
    const dateText = formatDashboardDate(event.EventDate);
    const timeText = formatDashboardTime(event.StartTime);
    const locationText = event.LocationName || "Location TBD";
    const teamText = event.GroupCode || event.GroupName || "Team TBD";
    const snackText = event.AssignedSnackFamily || event.SnackStatus || "Not assigned yet";

    return `
      <article class="dashboard-upcoming-card">
        <div class="dashboard-upcoming-topline">
          <span class="dashboard-upcoming-type">${escapeDashboardHtml(eventType)}</span>
          <strong>${escapeDashboardHtml(dateText)} • ${escapeDashboardHtml(timeText)}</strong>
        </div>
        <h4>${escapeDashboardHtml(eventName)}</h4>
        <div class="dashboard-upcoming-meta">
          <span><strong>Team:</strong> ${escapeDashboardHtml(teamText)}</span>
          <span><strong>Location:</strong> ${escapeDashboardHtml(locationText)}</span>
          <span><strong>Snack:</strong> ${escapeDashboardHtml(snackText)}</span>
        </div>
      </article>
    `;
  }).join("");

  container.innerHTML = `
    <div class="dashboard-upcoming-count">${escapeDashboardHtml(snapshotNote)}</div>
    ${cardsHtml}
  `;
}

function renderPracticeSummary(summary) {
  if (!dashboardPracticeSummary) return;
  const practice = summary || {};
  const month = dashboardSelectedMonth || "";
  dashboardPracticeSummary.innerHTML = [
    renderDashboardCard("Total Practices", practice.TotalPractices || 0, "Selected month", "scroll-upcoming"),
    renderDashboardCard("Practice Att %", formatDashboardPercent(practice.PracticeAttendancePercent), "Excused and cancelled do not count", "", {report:"attendance",month}),
    renderDashboardCard("70% or Lower", practice.LowPracticePlayers || 0, "Players needing attention", "scroll-attention", {report:"attendance",month,below:70}),
    renderDashboardCard("85% or Higher", practice.HighPracticePlayers || 0, "Strong attendance", "scroll-exceptional", {report:"attendance",month})
  ].join("");
}

function renderGameSummary(summary) {
  if (!dashboardGameSummary) return;
  const game = summary || {};
  const month = dashboardSelectedMonth || "";
  dashboardGameSummary.innerHTML = [
    renderDashboardCard("Total Games", game.TotalGames || 0, "Selected month", "scroll-upcoming"),
    renderDashboardCard("Game Att %", formatDashboardPercent(game.GameAttendancePercent), "Excused and cancelled do not count", "", {report:"attendance",month}),
    renderDashboardCard("70% or Lower", game.LowGamePlayers || 0, "Players needing attention", "scroll-attention", {report:"attendance",month,below:70}),
    renderDashboardCard("85% or Higher", game.HighGamePlayers || 0, "Strong attendance", "scroll-exceptional", {report:"attendance",month})
  ].join("");
}

function renderEventSummary(summary) {
  if (!dashboardEventSummary) return;
  const event = summary || {};
  dashboardEventSummary.innerHTML = [
    renderDashboardCard("Total Events", event.TotalEvents || 0, "Team events / scrimmages", "scroll-upcoming"),
    renderDashboardCard("Event Att %", formatDashboardPercent(event.EventAttendancePercent), "Excused and cancelled do not count"),
    renderDashboardCard("70% or Lower", event.LowEventPlayers || 0, "Players needing attention", "scroll-attention"),
    renderDashboardCard("85% or Higher", event.HighEventPlayers || 0, "Strong attendance", "scroll-exceptional"),
    renderDashboardCard("Cancelled Events", event.CancelledEvents || 0, "Selected month")
  ].join("");
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

function getDashboardCategoryDetail(row, category) {
  const config = getDashboardCategoryConfig(category);
  const counted = Number(row[config.counted] || 0);
  const cancelled = Number(row[config.cancelled] || 0);
  const playerId = row.PlayerID;

  if (!counted && !cancelled) {
    return `
      <div class="dashboard-player-detail-box">
        <strong>${config.label} Details</strong>
        <p>No ${config.label.toLowerCase()} attendance has been recorded for this player in the selected month.</p>
      </div>
    `;
  }

  // Build missed dates list from cache
  const datesKey = `${playerId}-${category}`;
  const dates = dashboardPlayerDates[datesKey] || [];
  const missedDates = dates.filter(d => d.AttendanceStatus === "Absent" || d.AttendanceStatus === "No Record");
  const presentDates = dates.filter(d => d.AttendanceStatus === "Present");
  const excusedDates = dates.filter(d => d.AttendanceStatus === "Excused");

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const missedHtml = missedDates.length > 0
    ? `<div style="margin-top:8px;">
        <div style="font-size:12px;font-weight:700;color:#c62828;margin-bottom:4px;">Missed (${missedDates.length})</div>
        ${missedDates.map(d => `<div style="font-size:12px;color:#555;padding:2px 0;border-bottom:1px solid #f3f4f6;">${formatDate(d.EventDate)}${d.LocationName ? ` · ${d.LocationName}` : ""}</div>`).join("")}
       </div>`
    : "";

  const excusedHtml = excusedDates.length > 0
    ? `<div style="margin-top:8px;">
        <div style="font-size:12px;font-weight:700;color:#f9a825;margin-bottom:4px;">Excused (${excusedDates.length})</div>
        ${excusedDates.map(d => `<div style="font-size:12px;color:#555;padding:2px 0;border-bottom:1px solid #f3f4f6;">${formatDate(d.EventDate)}</div>`).join("")}
       </div>`
    : "";

  return `
    <div class="dashboard-player-detail-box">
      <strong>${config.label} Details</strong>
      <div class="dashboard-player-detail-grid">
        <span>Counted: <strong>${counted}</strong></span>
        <span>Present: <strong>${row[config.present] || 0}</strong></span>
        <span>Absent: <strong>${row[config.absent] || 0}</strong></span>
        <span>Excused: <strong>${row[config.excused] || 0}</strong></span>
        <span>Attendance: <strong>${formatDashboardPercent(row[config.percent])}</strong></span>
      </div>
      ${missedHtml}
      ${excusedHtml}
      ${dates.length === 0 ? '<p style="font-size:12px;color:#999;margin-top:6px;">Loading dates...</p>' : ""}
    </div>
  `;
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

function renderPlayerAlertCard(row, cardType = "attention") {
  const playerName = `${row.FirstName || ""} ${row.LastName || ""}`.trim();
  const groupLabel = row.BirthYear || row.GroupCode || "-";
  const issue = row.AlertType || row.HighlightType || "Review";
  const issueDetail = row.AlertDetail || row.HighlightDetail || "Review attendance record.";
  const isExceptional = cardType === "exceptional";
  const isPerfect = cardType === "perfect";
  const isGood = cardType === "good";

  return `
    <article class="dashboard-alert-card ${isExceptional ? "dashboard-exceptional-card" : ""} ${isPerfect ? "dashboard-perfect-card" : ""} ${isGood ? "dashboard-good-card" : ""}">
      <div class="dashboard-alert-topline">
        <div>
          <h4>${escapeDashboardHtml(playerName || "Player")}</h4>
          <p>Birth Year: <strong>${escapeDashboardHtml(groupLabel)}</strong></p>
        </div>
        <span class="dashboard-alert-badge ${isExceptional ? "dashboard-exceptional-badge" : ""} ${isPerfect ? "dashboard-perfect-badge" : ""} ${isGood ? "dashboard-good-badge" : ""}">${escapeDashboardHtml(issue)}</span>
      </div>

      <p class="dashboard-alert-detail">${escapeDashboardHtml(issueDetail)}</p>

      ${renderDashboardCategoryButtons(row, cardType)}
      ${getOpenDashboardDetail(row, cardType)}
    </article>
  `;
}

function renderCollapsiblePlayerSection(container, countEl, rows, cardType, emptyText) {
  if (countEl) {
    const count = rows && rows.length ? rows.length : 0;
    countEl.textContent = `${count} ${count === 1 ? "player" : "players"}`;
  }

  if (!container) return;

  if (!rows || rows.length === 0) {
    container.innerHTML = `<div class="roster-empty-message">${escapeDashboardHtml(emptyText)}</div>`;
    return;
  }

  container.innerHTML = rows.map(row => renderPlayerAlertCard(row, cardType)).join("");
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
    "No players in the 71%–84% attendance range for the selected month."
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

function renderSummaryPanel(category) {
  const panel = document.getElementById("dashboardSummaryPanel");
  if (!panel) return;
  if (!category) { panel.innerHTML = ""; return; }

  const players = dashboardSummaryPlayerCache[category] || [];

  const titles = {
    active:    "Active Players",
    paperwork: "Missing Paperwork",
    photo:     "Missing Photo Release",
    emergency: "Missing Emergency Info",
    snack:     "Bring Snack Players",
    paidout:   "Paid Out Players"
  };

  const subtitles = {
    active:    "All currently active players",
    paperwork: "These players need paperwork completed",
    photo:     "These players have not returned photo release",
    emergency: "These players are missing emergency contact name or phone",
    snack:     "These families are in the snack rotation",
    paidout:   "Coach provides snacks for these players"
  };

  // Map dashboard card categories to report accordion + filter config
  const reportLinks = {
    paperwork: { report: "paperwork", label: "Paperwork Report" },
    photo:     { report: "paperwork", label: "Paperwork Report" },
    emergency: { report: "emergency", label: "Emergency Contacts" },
    active:    { report: "roster",    label: "Full Roster" },
  };

  const reportLink = reportLinks[category];
  const reportBtn = reportLink
    ? `<button onclick="openReportFromDashboard('${reportLink.report}')"
        style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;background:#f57c00;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">
        → ${escapeDashboardHtml(reportLink.label)}
      </button>`
    : "";

  const formatPlayer = (p) => {
    const num = p.PlayerNumber ? `#${p.PlayerNumber}` : "";
    const extra = {
      paperwork: p.PaperworkStatus ? ` · ${p.PaperworkStatus}` : " · Not Received",
      photo:     p.PhotoReleaseStatus ? ` · ${p.PhotoReleaseStatus}` : " · Not Received",
      emergency: (p.EmergencyContactName ? "" : " · No contact name") + (p.EmergencyContactPhone ? "" : " · No phone"),
      active:    p.BirthYear ? ` · ${p.BirthYear}` : "",
      snack:     "",
      paidout:   ""
    }[category] || "";
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f3f4f6;font-size:13px;">
      <span style="font-weight:700;color:#111827;">${escapeDashboardHtml(`${p.FirstName} ${p.LastName}`.trim())}</span>
      <span style="color:#6b7280;font-size:12px;">${escapeDashboardHtml(num + extra)}</span>
    </div>`;
  };

  panel.innerHTML = `
    <div style="margin-top:12px;background:#fff;border:1px solid #e1e5ea;border-radius:14px;padding:14px;border-left:4px solid #f57c00;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div>
          <div style="font-weight:800;font-size:15px;color:#111827;">${escapeDashboardHtml(titles[category] || "")}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:2px;">${escapeDashboardHtml(subtitles[category] || "")} · ${players.length} player${players.length !== 1 ? "s" : ""}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${reportBtn}
          <button onclick="dashboardOpenSummaryCard=''; document.getElementById('dashboardSummaryPanel').innerHTML='';" style="background:none;border:none;cursor:pointer;font-size:18px;color:#6b7280;padding:4px;">✕</button>
        </div>
      </div>
      ${players.length === 0
        ? `<div style="color:#999;font-size:13px;padding:8px 0;">No players found.</div>`
        : `<div style="max-height:280px;overflow-y:auto;">${players.map(formatPlayer).join("")}</div>`
      }
    </div>
  `;
}

function setupDashboardDetailClickHandlers() {
  [dashboardPlayerAlerts, dashboardGoodPlayers, dashboardPerfectPlayers, dashboardExceptionalPlayers].forEach(container => {
    if (!container || container.dataset.detailListenerAttached) return;

    container.dataset.detailListenerAttached = "1";
    container.addEventListener("click", async event => {
      const button = event.target.closest(".dashboard-category-btn");
      if (!button) return;

      const nextKey = button.dataset.dashboardDetailKey || "";
      dashboardOpenDetailKey = dashboardOpenDetailKey === nextKey ? "" : nextKey;

      // Load missed dates if opening a category
      if (dashboardOpenDetailKey) {
        const parts = dashboardOpenDetailKey.split("-");
        const playerId = parts[1];
        const category = parts[2];
        const eventTypeMap = { practice: "Practice", game: "Game", teamEvent: "Team Event" };
        const eventType = eventTypeMap[category] || null;

        if (playerId && eventType) {
          const monthParam = dashboardSelectedMonth ? `&month=${dashboardSelectedMonth}` : "";
          try {
            const res = await fetch(`${API_BASE}/dashboard/player-dates/${playerId}?eventType=${encodeURIComponent(eventType)}${monthParam}`, {
              credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
              dashboardPlayerDates[`${playerId}-${category}`] = data.dates;
            }
          } catch (e) {
            console.error("Failed to load player dates:", e);
          }
        }
      }

      if (typeof loadDashboard === "function") {
        loadDashboard();
      }
    });
  });
}

async function loadDashboard() {
  if (!dashboardSection) return;

  try {
    setMessage(dashboardMessage, "Loading dashboard...", false);

    if (refreshDashboardBtn) {
      refreshDashboardBtn.disabled = true;
      refreshDashboardBtn.textContent = "Loading...";
    }

    ensureDashboardMonthFilterOptions();
    setupDashboardDetailClickHandlers();

    const dashboardParams = new URLSearchParams();
    if (dashboardSelectedMonth) dashboardParams.set("month", dashboardSelectedMonth);

    const dashboardUrl = dashboardParams.toString()
      ? `${API_BASE}/dashboard?${dashboardParams.toString()}`
      : `${API_BASE}/dashboard`;

    const res = await fetch(dashboardUrl, {
      credentials: "include",
      cache: "no-store"
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(dashboardMessage, data.message || "Could not load dashboard.", true);
      return;
    }

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

    // Wire stat card scroll-to handlers for Practice/Game/Event summaries
    [dashboardPracticeSummary, dashboardGameSummary, dashboardEventSummary].forEach(container => {
      if (!container) return;
      container.querySelectorAll("[data-dash-action]").forEach(card => {
        card.addEventListener("click", () => {
          const action = card.dataset.dashAction;
          let target = null;
          if (action === "scroll-attention") target = dashboardPlayerAlerts;
          if (action === "scroll-exceptional") target = dashboardExceptionalPlayers;
          if (action === "scroll-upcoming") target = document.getElementById("dashboardUpcomingSnapshotSection") || dashboardSection;
          if (target) {
            // Open the collapsible if closed
            const details = target.closest("details");
            if (details && !details.open) details.open = true;
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      });
    });

    const filterLabel = dashboardSelectedMonth
      ? formatDashboardMonthLabel(dashboardSelectedMonth)
      : "All Months";

    if (dashboardLastUpdated) {
      dashboardLastUpdated.textContent = `Last updated: ${new Date().toLocaleString()} | Filter: ${filterLabel}`;
    }

    setMessage(dashboardMessage, `Dashboard updated. Showing: ${filterLabel}.`, false);
  } catch (err) {
    console.error("Dashboard load error:", err);
    setMessage(dashboardMessage, "Could not load dashboard.", true);
  } finally {
    if (refreshDashboardBtn) {
      refreshDashboardBtn.disabled = false;
      refreshDashboardBtn.textContent = "Refresh Dashboard";
    }
  }
}

ensureDashboardMonthFilterOptions();
setupDashboardDetailClickHandlers();

/* =========================
   DASHBOARD → REPORTS NAVIGATION
   Opens the Reports tab and pre-applies filters.
   Called from dashboard card "→ View Report" buttons.
   config: { report: 'attendance'|'paperwork'|'emergency'|'roster', month, below }
   ========================= */
window.openReportFromDashboard = function (config) {
  if (!config) return;

  // Switch to Reports tab
  currentTab = "Reports";
  if (typeof setActiveTab === "function") setActiveTab();
  if (typeof updateMainModeVisibility === "function") updateMainModeVisibility();

  // Give the Reports tab a moment to initialise, then apply filters + open accordion
  setTimeout(() => {
    const key = config.report || "attendance";

    // Open the accordion
    if (typeof toggleReportAccordion === "function") {
      const body = document.getElementById(`body-${key}`);
      if (body && body.style.display === "none") {
        toggleReportAccordion(key);
      }
    }

    // Apply attendance filters if specified
    if (key === "attendance") {
      const monthSel = document.getElementById("att-month");
      if (monthSel && config.month) {
        monthSel.value = config.month;
      }

      const belowSel = document.getElementById("att-below");
      if (belowSel) {
        belowSel.value = config.below ? String(config.below) : "";
      }

      // Trigger filter reload
      if (typeof onAttFilterChange === "function") {
        onAttFilterChange();
      }
    }
  }, 150);
};