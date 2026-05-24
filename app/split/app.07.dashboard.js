/* =========================================================
   FONTANA FIRE FC ATTENDANCE APP
   Batch 6B Dashboard Cleanup

   Purpose:
   - Keep Player Management as the full player lookup area.
   - Use Dashboard for summary, group trends, birthdays, and
     attendance alerts that need coach/admin attention.
   ========================================================= */

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
  if (percent >= 90) return "dashboard-percent-good";
  if (percent >= 70) return "dashboard-percent-watch";
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
    <table class="dashboard-table dashboard-monthly-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Type</th>
          <th>Present</th>
          <th>Absent</th>
          <th>Excused</th>
          <th>Cancelled</th>
          <th>Attendance %</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            <td><strong>${escapeDashboardHtml(row.AttendanceMonth || "-")}</strong></td>
            <td>${escapeDashboardHtml(row.EventType || "-")}</td>
            <td>${row.PresentCount || 0}</td>
            <td>${row.AbsentCount || 0}</td>
            <td>${row.ExcusedCount || 0}</td>
            <td>${row.CancelledCount || 0}</td>
            <td><strong>${formatDashboardPercent(row.AttendancePercent)}</strong></td>
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

  dashboardBirthdays.innerHTML = `
    <div class="dashboard-mini-card">
      <h4>This Month</h4>
      ${list(thisMonth, "No birthdays this month.")}
    </div>
    <div class="dashboard-mini-card">
      <h4>Next Month</h4>
      ${list(nextMonth, "No birthdays next month.")}
    </div>
  `;
}

function renderGroupSummary(rows) {
  if (!dashboardGroupSummary) return;

  if (!rows || rows.length === 0) {
    dashboardGroupSummary.innerHTML = `<div class="roster-empty-message">No group attendance data found yet.</div>`;
    return;
  }

  dashboardGroupSummary.innerHTML = `
    <table class="dashboard-table dashboard-group-table">
      <thead>
        <tr>
          <th>Group</th>
          <th>Players</th>
          <th>Practice</th>
          <th>Game</th>
          <th>Team Event</th>
          <th>Absent</th>
          <th>Excused</th>
          <th>Cancelled</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => {
          const groupLabel = row.GroupCode || row.GroupName || row.BirthYear || "No Group";
          const practiceClass = getDashboardPercentClass(row.PracticePercent, row.PracticeCounted);
          const gameClass = getDashboardPercentClass(row.GamePercent, row.GameCounted);
          const teamEventClass = getDashboardPercentClass(row.TeamEventPercent, row.TeamEventCounted);

          return `
            <tr>
              <td><strong>${escapeDashboardHtml(groupLabel)}</strong></td>
              <td>${row.ActivePlayers || 0}</td>
              <td><span class="dashboard-percent-badge ${practiceClass}">${formatDashboardPercent(row.PracticePercent)}</span></td>
              <td><span class="dashboard-percent-badge ${gameClass}">${formatDashboardPercent(row.GamePercent)}</span></td>
              <td><span class="dashboard-percent-badge ${teamEventClass}">${formatDashboardPercent(row.TeamEventPercent)}</span></td>
              <td>${row.AbsentCount || 0}</td>
              <td>${row.ExcusedCount || 0}</td>
              <td>${row.CancelledCount || 0}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function renderPlayerAlerts(rows) {
  if (!dashboardPlayerAlerts) return;

  if (!rows || rows.length === 0) {
    dashboardPlayerAlerts.innerHTML = `
      <div class="roster-empty-message">
        No attendance alerts right now. Full player records are still available in the Players tab.
      </div>
    `;
    return;
  }

  dashboardPlayerAlerts.innerHTML = rows.map(row => {
    const playerName = `${row.FirstName || ""} ${row.LastName || ""}`.trim();
    const groupLabel = row.BirthYear || row.GroupCode || "-";
    const issue = row.AlertType || "Needs Review";
    const issueDetail = row.AlertDetail || "Review attendance record.";
    const practiceClass = getDashboardPercentClass(row.PracticePercent, row.PracticeCounted);
    const gameClass = getDashboardPercentClass(row.GamePercent, row.GameCounted);
    const teamEventClass = getDashboardPercentClass(row.TeamEventPercent, row.TeamEventCounted);

    return `
      <article class="dashboard-alert-card">
        <div class="dashboard-alert-topline">
          <div>
            <h4>${escapeDashboardHtml(playerName || "Player")}</h4>
            <p>Birth Year: <strong>${escapeDashboardHtml(groupLabel)}</strong></p>
          </div>
          <span class="dashboard-alert-badge">${escapeDashboardHtml(issue)}</span>
        </div>

        <p class="dashboard-alert-detail">${escapeDashboardHtml(issueDetail)}</p>

        <div class="dashboard-alert-metrics">
          <span>Practice <strong class="dashboard-percent-badge ${practiceClass}">${formatDashboardPercent(row.PracticePercent)}</strong></span>
          <span>Game <strong class="dashboard-percent-badge ${gameClass}">${formatDashboardPercent(row.GamePercent)}</strong></span>
          <span>Team Event <strong class="dashboard-percent-badge ${teamEventClass}">${formatDashboardPercent(row.TeamEventPercent)}</strong></span>
        </div>

        <div class="dashboard-alert-counts">
          Present: ${row.PresentCount || 0} | Absent: ${row.AbsentCount || 0} | Excused: ${row.ExcusedCount || 0} | Cancelled: ${row.CancelledCount || 0}
        </div>
      </article>
    `;
  }).join("");
}

async function loadDashboard() {
  if (!dashboardSection) return;

  try {
    setMessage(dashboardMessage, "Loading dashboard...", false);

    if (refreshDashboardBtn) {
      refreshDashboardBtn.disabled = true;
      refreshDashboardBtn.textContent = "Loading...";
    }

    const res = await fetch(`${API_BASE}/dashboard`, {
      credentials: "include",
      cache: "no-store"
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(dashboardMessage, data.message || "Could not load dashboard.", true);
      return;
    }

    renderDashboardSummaryCards(data);
    renderMonthlySummary(data.monthlySummary || []);
    renderBirthdays(data.birthdays || {});
    renderGroupSummary(data.groupSummary || []);
    renderPlayerAlerts(data.playerAlerts || []);

    setMessage(dashboardMessage, "Dashboard updated.", false);
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
