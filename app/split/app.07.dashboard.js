// app.07b.dashboard-summary.js — Summary cards, monthly table, birthdays, snapshot

function renderDashboardSummaryCards(data) {
  if (!dashboardSummaryCards) return;
  const totals = data.playerTotals || {};
  const snack = data.snackTotals || {};
  const paperwork = data.paperworkTotals || {};
  const photo = data.photoReleaseTotals || {};
  const emergency = data.emergencyTotals || {};
  const cards = [
    renderDashboardCard("Inactive Players", totals.InactivePlayers || 0, `${totals.ActivePlayers || 0} active`, "active"),
    renderDashboardCard("Missing Paperwork", paperwork.MissingPaperwork || 0, `${paperwork.CompletePaperwork || 0} complete`, "paperwork"),
    renderDashboardCard("Photo Release Missing", photo.MissingPhotoRelease || 0, `${photo.ReceivedPhotoRelease || 0} received`, "photo"),
    renderDashboardCard("Emergency Info Missing", emergency.MissingEmergencyInfo || 0, `${emergency.CompleteEmergencyInfo || 0} complete`, "emergency"),
    renderDashboardCard("Bring Snack", snack.BringSnackPlayers || 0, "Parent snack rotation", "snack"),
    renderDashboardCard("Paid Out", snack.PaidOutPlayers || 0, "Coach provides snacks", "paidout")
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
      if (panel) panel.innerHTML = `<div style="padding:12px;color:#999;font-size:13px;">Loading...</div>`;
      if (!dashboardSummaryPlayerCache[category]) {
        try {
          const res = await fetch(`${API_BASE}/dashboard/summary-players?category=${encodeURIComponent(category)}`, { credentials: "include" });
          const d = await res.json();
          if (d.success) dashboardSummaryPlayerCache[category] = d.players;
        } catch (e) { console.error("Failed to load summary players:", e); }
      }
      renderSummaryPanel(category);
    });
  });
  if (dashboardOpenSummaryCard) renderSummaryPanel(dashboardOpenSummaryCard);
}

function renderMonthlySummary(rows) {
  if (!dashboardMonthlySummary) return;
  if (!rows || rows.length === 0) {
    dashboardMonthlySummary.innerHTML = `<div class="roster-empty-message">No attendance records found yet.</div>`;
    return;
  }
  dashboardMonthlySummary.innerHTML = `
    <table class="dashboard-table dashboard-monthly-table dashboard-monthly-simple-table dashboard-monthly-six-table">
      <thead><tr><th>Month</th><th>Practices</th><th>Practice %</th><th>Games</th><th>Game %</th><th>Events</th><th>Event %</th></tr></thead>
      <tbody>
        ${rows.map(row => `<tr>
          <td><strong>${escapeDashboardHtml(row.AttendanceMonth || "-")}</strong></td>
          <td>${row.PracticeTotal || 0}</td>
          <td><strong>${formatDashboardPercent(row.PracticePercent)}</strong></td>
          <td>${row.GameTotal || 0}</td>
          <td><strong>${formatDashboardPercent(row.GamePercent)}</strong></td>
          <td>${row.EventTotal || 0}</td>
          <td><strong>${formatDashboardPercent(row.EventPercent)}</strong></td>
        </tr>`).join("")}
      </tbody>
    </table>`;
}

function renderBirthdays(data) {
  if (!dashboardBirthdays) return;
  const thisMonth = data.thisMonth || [];
  const nextMonth = data.nextMonth || [];
  function list(items, emptyText) {
    if (!items.length) return `<p class="subtext">${escapeDashboardHtml(emptyText)}</p>`;
    return `<ul class="birthday-player-list">${items.map(p => `
      <li class="birthday-player-item">
        <strong class="birthday-player-name">${escapeDashboardHtml(p.FirstName)} ${escapeDashboardHtml(p.LastName)}</strong>
        <span class="birthday-player-date">${formatDashboardBirthday(p.DateOfBirth)}${p.BirthYear ? ` &nbsp;|&nbsp; ${escapeDashboardHtml(p.BirthYear)}` : ""}</span>
      </li>`).join("")}</ul>`;
  }
  const selectedLabel = dashboardSelectedMonth ? formatDashboardMonthLabel(dashboardSelectedMonth) : "This Month";
  const nextMonth2 = dashboardSelectedMonth ? getNextDashboardMonthValue(dashboardSelectedMonth) : "";
  const nextLabel = nextMonth2 ? formatDashboardMonthLabel(nextMonth2) : "Next Month";
  const birthdayHeading = document.getElementById("dashboardBirthdaysHeading");
  if (birthdayHeading) birthdayHeading.textContent = "Birthdays";
  dashboardBirthdays.innerHTML = `
    <div class="dashboard-mini-card dashboard-birthday-current">
      <h4>${escapeDashboardHtml(selectedLabel)} <span class="birthday-count-badge">${thisMonth.length} player${thisMonth.length !== 1 ? "s" : ""}</span></h4>
      ${list(thisMonth, `No birthdays for ${selectedLabel}.`)}
    </div>
    <div class="dashboard-mini-card dashboard-birthday-next">
      <h4>${escapeDashboardHtml(nextLabel)} <span class="birthday-count-badge">${nextMonth.length} player${nextMonth.length !== 1 ? "s" : ""}</span></h4>
      ${list(nextMonth, `No birthdays for ${nextLabel}.`)}
    </div>`;
}

function renderUpcomingSnapshot(rows) {
  const container = typeof dashboardUpcomingSnapshot !== "undefined"
    ? dashboardUpcomingSnapshot : document.getElementById("dashboardUpcomingSnapshot");
  if (!container) return;
  if (!rows || rows.length === 0) {
    container.innerHTML = `<div class="roster-empty-message">No games or team events found for this view.</div>`;
    return;
  }
  const snapshotCount = rows.length;
  const snapshotNote = dashboardSelectedMonth
    ? `${snapshotCount} ${snapshotCount === 1 ? "game/event" : "games/events"} found for ${formatDashboardMonthLabel(dashboardSelectedMonth)}.`
    : `Showing next ${snapshotCount} upcoming ${snapshotCount === 1 ? "game/event" : "games/events"}.`;
  const cardsHtml = rows.map(event => {
    const eventType    = event.EventType  || "Event";
    const eventName    = event.EventName  || eventType;
    const dateText     = formatDashboardDate(event.EventDate);
    const timeText     = formatDashboardTime(event.StartTime);
    const locationText = event.LocationName || "Location TBD";
    const snackText    = event.AssignedSnackFamily || event.SnackStatus || "Not assigned yet";
    const status       = event.EventStatus || "Scheduled";
    const typeClass = eventType === "Game" ? "snapshot-card--game"
      : eventType === "Team Event" ? "snapshot-card--team-event" : "snapshot-card--practice";
    const cancelledClass = status === "Cancelled" ? "snapshot-card--cancelled" : "";
    const statusPillClass = status === "Completed" ? "snapshot-status--completed"
      : status === "Cancelled" ? "snapshot-status--cancelled" : "snapshot-status--scheduled";
    const statusIcon = status === "Completed" ? "&#10003; " : "";
    const snackChip = eventType === "Game"
      ? `<div class="snapshot-snack-chip">&#127822; Snack: ${escapeDashboardHtml(snackText)}</div>` : "";
    const nameStyle = status === "Cancelled" ? ' style="text-decoration:line-through;color:#999;"' : "";
    return `
      <article class="dashboard-upcoming-card snapshot-card ${typeClass} ${cancelledClass}">
        <div class="snapshot-topline">
          <div class="snapshot-name-block">
            <div class="snapshot-name"${nameStyle}>${escapeDashboardHtml(eventName)}</div>
            <div class="snapshot-datetime">${escapeDashboardHtml(dateText)} &middot; ${escapeDashboardHtml(timeText)}</div>
          </div>
          <span class="snapshot-status-pill ${statusPillClass}">${statusIcon}${escapeDashboardHtml(status)}</span>
        </div>
        <div class="snapshot-meta">
          <span><strong>Location:</strong> ${escapeDashboardHtml(locationText)}</span>
          <span><strong>Type:</strong> ${escapeDashboardHtml(eventType)}</span>
        </div>
        ${snackChip}
      </article>`;
  }).join("");
  container.innerHTML = cardsHtml;
  const snapshotSection = container.closest(".dashboard-upcoming-snapshot-section") || container.parentElement;
  const existingNote = snapshotSection ? snapshotSection.querySelector(".dashboard-upcoming-count") : null;
  if (existingNote) existingNote.remove();
  const noteEl = document.createElement("div");
  noteEl.className = "dashboard-upcoming-count";
  noteEl.textContent = snapshotNote;
  if (snapshotSection) snapshotSection.insertBefore(noteEl, container);
}

function renderPracticeSummary(summary) {
  if (!dashboardPracticeSummary) return;
  const practice = summary || {};
  dashboardPracticeSummary.innerHTML = [
    renderDashboardCard("Total Practices", practice.TotalPractices || 0, "Selected month", "scroll-upcoming"),
    renderDashboardCard("Practice Att %", formatDashboardPercent(practice.PracticeAttendancePercent), "Excused and cancelled do not count"),
    renderDashboardCard("70% or Lower", practice.LowPracticePlayers || 0, "Players needing attention"),
    renderDashboardCard("85% or Higher", practice.HighPracticePlayers || 0, "Strong attendance")
  ].join("");
}

function renderGameSummary(summary) {
  if (!dashboardGameSummary) return;
  const game = summary || {};
  dashboardGameSummary.innerHTML = [
    renderDashboardCard("Total Games", game.TotalGames || 0, "Selected month", "scroll-upcoming"),
    renderDashboardCard("Game Att %", formatDashboardPercent(game.GameAttendancePercent), "Excused and cancelled do not count"),
    renderDashboardCard("70% or Lower", game.LowGamePlayers || 0, "Players needing attention"),
    renderDashboardCard("85% or Higher", game.HighGamePlayers || 0, "Strong attendance"),
    renderDashboardCard("Cancelled Games", game.CancelledGames || 0, "Selected month")
  ].join("");
}

function renderEventSummary(summary) {
  if (!dashboardEventSummary) return;
  const event = summary || {};
  dashboardEventSummary.innerHTML = [
    renderDashboardCard("Total Events", event.TotalEvents || 0, "Team events / scrimmages", "scroll-upcoming"),
    renderDashboardCard("Event Att %", formatDashboardPercent(event.EventAttendancePercent), "Excused and cancelled do not count"),
    renderDashboardCard("70% or Lower", event.LowEventPlayers || 0, "Players needing attention"),
    renderDashboardCard("85% or Higher", event.HighEventPlayers || 0, "Strong attendance"),
    renderDashboardCard("Cancelled Events", event.CancelledEvents || 0, "Selected month")
  ].join("");
}