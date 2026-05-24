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

let dashboardSelectedMonth = "";
let dashboardMonthFilterReady = false;
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
  const options = [
    { value: "", label: "All Months" },
    { value: currentMonth, label: `Current Month (${formatDashboardMonthLabel(currentMonth)})` },
    { value: "2026-04", label: "April 2026" },
    { value: "2026-05", label: "May 2026" },
    { value: "2026-06", label: "June 2026" }
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
  const num = Number(value);
  if (!Number.isFinite(num)) return "0.0%";
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
  if (percent >= 85) return "dashboard-percent-good";
  if (percent > 70) return "dashboard-percent-watch";
  return "dashboard-percent-low";
}

function renderDashboardCard(label, value, note = "") {
  return `
    <div class="dashboard-stat-card">
      <div class="dashboard-stat-label">${escapeDashboardHtml(label)}</div>
      <div class="dashboard-stat-value">${escapeDashboardHtml(value)}</div>
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
  const emergency = data.emergencyTotals || {};

  dashboardSummaryCards.innerHTML = [
    renderDashboardCard("Active Players", totals.ActivePlayers || 0, `${totals.InactivePlayers || 0} inactive`),
    renderDashboardCard("Missing Paperwork", paperwork.MissingPaperwork || 0, `${paperwork.CompletePaperwork || 0} complete`),
    renderDashboardCard("Photo Release Missing", photo.MissingPhotoRelease || 0, `${photo.ReceivedPhotoRelease || 0} received`),
    renderDashboardCard("Emergency Info Missing", emergency.MissingEmergencyInfo || 0, `${emergency.CompleteEmergencyInfo || 0} complete`),
    renderDashboardCard("Bring Snack", snack.BringSnackPlayers || 0, "Parent snack rotation"),
    renderDashboardCard("Paid Out", snack.PaidOutPlayers || 0, "Coach provides snacks")
  ].join("");
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
      <ul>
        ${items.map(player => `
          <li>
            <strong>${escapeDashboardHtml(player.FirstName)} ${escapeDashboardHtml(player.LastName)}</strong>
            — ${formatDashboardBirthday(player.DateOfBirth)}
            ${player.BirthYear ? ` | ${escapeDashboardHtml(player.BirthYear)}` : ""}
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

  dashboardBirthdays.innerHTML = `
    <div class="dashboard-mini-card dashboard-birthday-current">
      <h4>${escapeDashboardHtml(selectedBirthdayLabel)}</h4>
      ${list(thisMonth, `No birthdays for ${selectedBirthdayLabel}.`)}
    </div>
    <div class="dashboard-mini-card dashboard-birthday-next">
      <h4>${escapeDashboardHtml(nextBirthdayLabel)}</h4>
      ${list(nextMonth, `No birthdays for ${nextBirthdayLabel}.`)}
    </div>
  `;
}

function renderPracticeSummary(summary) {
  if (!dashboardPracticeSummary) return;
  const practice = summary || {};
  dashboardPracticeSummary.innerHTML = [
    renderDashboardCard("Total Practices", practice.TotalPractices || 0, "Selected month"),
    renderDashboardCard("Practice Att %", formatDashboardPercent(practice.PracticeAttendancePercent), "Cancelled does not count"),
    renderDashboardCard("70% or Lower", practice.LowPracticePlayers || 0, "Players needing attention"),
    renderDashboardCard("85% or Higher", practice.HighPracticePlayers || 0, "Strong attendance")
  ].join("");
}

function renderGameSummary(summary) {
  if (!dashboardGameSummary) return;
  const game = summary || {};
  dashboardGameSummary.innerHTML = [
    renderDashboardCard("Total Games", game.TotalGames || 0, "Selected month"),
    renderDashboardCard("Game Att %", formatDashboardPercent(game.GameAttendancePercent), "Cancelled does not count"),
    renderDashboardCard("70% or Lower", game.LowGamePlayers || 0, "Players needing attention"),
    renderDashboardCard("85% or Higher", game.HighGamePlayers || 0, "Strong attendance")
  ].join("");
}

function renderEventSummary(summary) {
  if (!dashboardEventSummary) return;
  const event = summary || {};
  dashboardEventSummary.innerHTML = [
    renderDashboardCard("Total Events", event.TotalEvents || 0, "Team events / scrimmages"),
    renderDashboardCard("Event Att %", formatDashboardPercent(event.EventAttendancePercent), "Cancelled does not count"),
    renderDashboardCard("70% or Lower", event.LowEventPlayers || 0, "Players needing attention"),
    renderDashboardCard("85% or Higher", event.HighEventPlayers || 0, "Strong attendance"),
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

  if (!counted && !cancelled) {
    return `
      <div class="dashboard-player-detail-box">
        <strong>${config.label} Details</strong>
        <p>No ${config.label.toLowerCase()} attendance has been recorded for this player in the selected month.</p>
      </div>
    `;
  }

  return `
    <div class="dashboard-player-detail-box">
      <strong>${config.label} Details</strong>
      <div class="dashboard-player-detail-grid">
        <span>Total Counted: <strong>${counted}</strong></span>
        <span>Present: <strong>${row[config.present] || 0}</strong></span>
        <span>Absent: <strong>${row[config.absent] || 0}</strong></span>
        <span>Excused: <strong>${row[config.excused] || 0}</strong></span>
        <span>Cancelled: <strong>${cancelled}</strong></span>
        <span>Attendance: <strong>${formatDashboardPercent(row[config.percent])}</strong></span>
      </div>
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

  return `
    <article class="dashboard-alert-card ${isExceptional ? "dashboard-exceptional-card" : ""} ${isPerfect ? "dashboard-perfect-card" : ""}">
      <div class="dashboard-alert-topline">
        <div>
          <h4>${escapeDashboardHtml(playerName || "Player")}</h4>
          <p>Birth Year: <strong>${escapeDashboardHtml(groupLabel)}</strong></p>
        </div>
        <span class="dashboard-alert-badge ${isExceptional ? "dashboard-exceptional-badge" : ""} ${isPerfect ? "dashboard-perfect-badge" : ""}">${escapeDashboardHtml(issue)}</span>
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
    "No players have outstanding attendance at 85% or higher for practices or games in the selected month yet."
  );
}

function setupDashboardDetailClickHandlers() {
  [dashboardPlayerAlerts, dashboardPerfectPlayers, dashboardExceptionalPlayers].forEach(container => {
    if (!container || container.dataset.detailListenerAttached) return;

    container.dataset.detailListenerAttached = "1";
    container.addEventListener("click", event => {
      const button = event.target.closest(".dashboard-category-btn");
      if (!button) return;

      const nextKey = button.dataset.dashboardDetailKey || "";
      dashboardOpenDetailKey = dashboardOpenDetailKey === nextKey ? "" : nextKey;

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
    renderMonthlySummary(data.monthlySummary || []);
    renderPracticeSummary(data.practiceSummary || {});
    renderGameSummary(data.gameSummary || {});
    renderEventSummary(data.eventSummary || {});
    renderPlayerAlerts(data.playerAlerts || []);
    renderPerfectPlayers(data.perfectPlayers || []);
    renderExceptionalPlayers(data.exceptionalPlayers || []);

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
