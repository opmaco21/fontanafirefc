// app.07b.dashboard-summary.js
// Summary cards: practice, game, event + upcoming snapshot
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
    renderDashboardCard("85% or Higher", game.HighGamePlayers || 0, "Strong attendance", "scroll-exceptional", {report:"attendance",month}),
    renderDashboardCard("Cancelled Games", game.CancelledGames || 0, "Selected month")
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
  const missedDates = dates.filter(d => d.AttendanceStatus === "Absent");
  const presentDates = dates.filter(d => d.AttendanceStatus === "Present");
  const excusedDates = dates.filter(d => d.AttendanceStatus === "Excused");

  const formatDate = (dateStr) => {
    if (!dateStr) return "�";
    const s = String(dateStr).substring(0, 10);
    const parts = s.split("-");
    if (parts.length !== 3) return s;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const missedHtml = missedDates.length > 0
    ? `<div style="margin-top:8px;">
        <div style="font-size:12px;font-weight:700;color:#c62828;margin-bottom:4px;">Missed (${missedDates.length})</div>
        ${missedDates.map(d => `<div style="font-size:12px;color:#555;padding:2px 0;border-bottom:1px solid #f3f4f6;">${formatDate(d.EventDate)}${d.LocationName ? ` � ${d.LocationName}` : ""}</div>`).join("")}
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
    "No players in the 71%�84% attendance range for the selected month."
  );
}

function renderGoodPlayers(rows) {
  renderCollapsiblePlayerSection(
    dashboardGoodPlayers,
    dashboardGoodPlayersCount,
    rows,
    "good",
    "No players in the 71%�84% attendance range for the selected month."
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
