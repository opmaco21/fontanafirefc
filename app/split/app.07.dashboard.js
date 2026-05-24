/* =========================================================
   FONTANA FIRE FC ATTENDANCE APP
   Batch 6 Dashboard + Reports
   ========================================================= */

function escapeDashboardHtml(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDashboardPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0%";
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
    <table class="dashboard-table">
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

function renderPlayerAttendanceReport(rows) {
  if (!dashboardPlayerReport) return;

  if (!rows || rows.length === 0) {
    dashboardPlayerReport.innerHTML = `<div class="roster-empty-message">No player attendance records found yet.</div>`;
    return;
  }

  dashboardPlayerReport.innerHTML = `
    <table class="dashboard-table">
      <thead>
        <tr>
          <th>Player</th>
          <th>Birth Year</th>
          <th>Practice %</th>
          <th>Game %</th>
          <th>Team Event %</th>
          <th>Present</th>
          <th>Absent</th>
          <th>Excused</th>
          <th>Cancelled</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            <td><strong>${escapeDashboardHtml(row.FirstName)} ${escapeDashboardHtml(row.LastName)}</strong></td>
            <td>${escapeDashboardHtml(row.BirthYear || row.GroupCode || "-")}</td>
            <td>${formatDashboardPercent(row.PracticePercent)}</td>
            <td>${formatDashboardPercent(row.GamePercent)}</td>
            <td>${formatDashboardPercent(row.TeamEventPercent)}</td>
            <td>${row.PresentCount || 0}</td>
            <td>${row.AbsentCount || 0}</td>
            <td>${row.ExcusedCount || 0}</td>
            <td>${row.CancelledCount || 0}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
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
    renderPlayerAttendanceReport(data.playerAttendance || []);

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
