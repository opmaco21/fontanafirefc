// app.07c.dashboard-players.js — Player alert sections: attention, good, outstanding, perfect

function getDashboardCategoryConfig(category) {
  if (category === "practice") return { label:"Practice", counted:"PracticeCounted", present:"PracticePresent", absent:"PracticeAbsent", excused:"PracticeExcused", cancelled:"PracticeCancelled", percent:"PracticePercent" };
  if (category === "game") return { label:"Game", counted:"GameCounted", present:"GamePresent", absent:"GameAbsent", excused:"GameExcused", cancelled:"GameCancelled", percent:"GamePercent" };
  return { label:"Team Event", counted:"TeamEventCounted", present:"TeamEventPresent", absent:"TeamEventAbsent", excused:"TeamEventExcused", cancelled:"TeamEventCancelled", percent:"TeamEventPercent" };
}

function getDashboardCategoryDetail(row, category) {
  const config = getDashboardCategoryConfig(category);
  const counted = Number(row[config.counted] || 0);
  const cancelled = Number(row[config.cancelled] || 0);
  const playerId = row.PlayerID;
  if (!counted && !cancelled) {
    return `<div class="dashboard-player-detail-box"><strong>${config.label} Details</strong><p>No ${config.label.toLowerCase()} attendance has been recorded for this player in the selected month.</p></div>`;
  }
  const datesKey = `${playerId}-${category}`;
  const dates = dashboardPlayerDates[datesKey] || [];
  const missedDates = dates.filter(d => d.AttendanceStatus === "Absent");
  const excusedDates = dates.filter(d => d.AttendanceStatus === "Excused");
  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    const s = String(dateStr).substring(0, 10);
    const parts = s.split("-");
    if (parts.length !== 3) return s;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };
  const missedHtml = missedDates.length > 0
    ? `<div style="margin-top:8px;"><div style="font-size:12px;font-weight:700;color:#c62828;margin-bottom:4px;">Missed (${missedDates.length})</div>${missedDates.map(d => `<div style="font-size:12px;color:#555;padding:2px 0;border-bottom:1px solid #f3f4f6;">${formatDate(d.EventDate)}${d.LocationName ? ` - ${d.LocationName}` : ""}</div>`).join("")}</div>` : "";
  const excusedHtml = excusedDates.length > 0
    ? `<div style="margin-top:8px;"><div style="font-size:12px;font-weight:700;color:#f9a825;margin-bottom:4px;">Excused (${excusedDates.length})</div>${excusedDates.map(d => `<div style="font-size:12px;color:#555;padding:2px 0;border-bottom:1px solid #f3f4f6;">${formatDate(d.EventDate)}</div>`).join("")}</div>` : "";
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
      ${missedHtml}${excusedHtml}
      ${dates.length === 0 ? '<p style="font-size:12px;color:#999;margin-top:6px;">Loading dates...</p>' : ""}
    </div>`;
}

function renderDashboardCategoryButtons(row, cardType) {
  const playerId = row.PlayerID;
  function button(category, label, percentField, countedField) {
    const detailKey = `${cardType}-${playerId}-${category}`;
    const active = dashboardOpenDetailKey === detailKey;
    const badgeClass = getDashboardPercentClass(row[percentField], row[countedField]);
    return `<button type="button" class="dashboard-category-btn ${active ? "active-dashboard-category" : ""}" data-dashboard-detail-key="${detailKey}"><span>${label}</span><strong class="dashboard-percent-badge ${badgeClass}">${formatDashboardPercent(row[percentField])}</strong></button>`;
  }
  return `<div class="dashboard-alert-metrics dashboard-clickable-metrics">
    ${button("practice", "Practice", "PracticePercent", "PracticeCounted")}
    ${button("game", "Game", "GamePercent", "GameCounted")}
    ${button("teamEvent", "Team Event", "TeamEventPercent", "TeamEventCounted")}
  </div>`;
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
    </article>`;
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
  renderCollapsiblePlayerSection(dashboardPlayerAlerts, dashboardPlayerAlertsCount, rows, "attention", "No players are at 70% or lower for practices or games in the selected month.");
}

function renderGoodPlayers(rows) {
  renderCollapsiblePlayerSection(dashboardGoodPlayers, dashboardGoodPlayersCount, rows, "good", "No players in the 71%-84% attendance range for the selected month.");
}

function renderExceptionalPlayers(rows) {
  renderCollapsiblePlayerSection(dashboardExceptionalPlayers, dashboardExceptionalPlayersCount, rows, "exceptional", "No players have outstanding attendance at 85% or higher for both practices and games in the selected month yet.");
}

function renderPerfectPlayers(rows) {
  renderCollapsiblePlayerSection(dashboardPerfectPlayers, dashboardPerfectPlayersCount, rows, "perfect", "No players have 100% attendance for both practices and games in the selected month yet.");
}

function renderSummaryPanel(category) {
  const panel = document.getElementById("dashboardSummaryPanel");
  if (!panel) return;
  if (!category) { panel.innerHTML = ""; return; }
  const players = dashboardSummaryPlayerCache[category] || [];
  const titles = { active:"Active Players", paperwork:"Missing Paperwork", photo:"Missing Photo Release", emergency:"Missing Emergency Info", snack:"Bring Snack Players", paidout:"Paid Out Players" };
  const subtitles = { active:"All currently active players", paperwork:"These players need paperwork completed", photo:"These players have not returned photo release", emergency:"These players are missing emergency contact name or phone", snack:"These families are in the snack rotation", paidout:"Coach provides snacks for these players" };
  const reportLinks = { paperwork:{report:"paperwork",label:"Paperwork Report"}, photo:{report:"paperwork",label:"Paperwork Report"}, emergency:{report:"emergency",label:"Emergency Contacts"}, active:{report:"roster",label:"Full Roster"} };
  const reportLink = reportLinks[category];
  const reportBtn = reportLink
    ? `<button onclick="openReportFromDashboard('${reportLink.report}')" style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;background:#f57c00;color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">&rarr; ${escapeDashboardHtml(reportLink.label)}</button>`
    : "";
  const formatPlayer = (p) => {
    const num = p.PlayerNumber ? `#${p.PlayerNumber}` : "";
    const extra = {
      paperwork: p.PaperworkStatus ? ` - ${p.PaperworkStatus}` : " - Not Received",
      photo: p.PhotoReleaseStatus ? ` - ${p.PhotoReleaseStatus}` : " - Not Received",
      emergency: (p.EmergencyContactName ? "" : " - No contact name") + (p.EmergencyContactPhone ? "" : " - No phone"),
      active: p.BirthYear ? ` - ${p.BirthYear}` : "",
      snack: "", paidout: ""
    }[category] || "";
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f3f4f6;font-size:13px;"><span style="font-weight:700;color:#111827;">${escapeDashboardHtml(`${p.FirstName} ${p.LastName}`.trim())}</span><span style="color:#6b7280;font-size:12px;">${escapeDashboardHtml(num + extra)}</span></div>`;
  };
  panel.innerHTML = `
    <div style="margin-top:12px;background:#fff;border:1px solid #e1e5ea;border-radius:14px;padding:14px;border-left:4px solid #f57c00;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div>
          <div style="font-weight:800;font-size:15px;color:#111827;">${escapeDashboardHtml(titles[category] || "")}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:2px;">${escapeDashboardHtml(subtitles[category] || "")} - ${players.length} player${players.length !== 1 ? "s" : ""}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${reportBtn}
          <button onclick="dashboardOpenSummaryCard=''; document.getElementById('dashboardSummaryPanel').innerHTML='';" style="background:none;border:none;cursor:pointer;font-size:18px;color:#6b7280;padding:4px;">&times;</button>
        </div>
      </div>
      ${players.length === 0
        ? `<div style="color:#999;font-size:13px;padding:8px 0;">No players found.</div>`
        : `<div style="max-height:280px;overflow-y:auto;">${players.map(formatPlayer).join("")}</div>`}
    </div>`;
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
      if (dashboardOpenDetailKey) {
        const parts = dashboardOpenDetailKey.split("-");
        const playerId = parts[1];
        const category = parts[2];
        const eventTypeMap = { practice:"Practice", game:"Game", teamEvent:"Team Event" };
        const eventType = eventTypeMap[category] || null;
        if (playerId && eventType) {
          const monthParam = dashboardSelectedMonth ? `&month=${dashboardSelectedMonth}` : "";
          try {
            const res = await fetch(`${API_BASE}/dashboard/player-dates/${playerId}?eventType=${encodeURIComponent(eventType)}${monthParam}`, { credentials:"include" });
            const data = await res.json();
            if (data.success) dashboardPlayerDates[`${playerId}-${category}`] = data.dates;
          } catch (e) { console.error("Failed to load player dates:", e); }
        }
      }
      if (typeof loadDashboard === "function") loadDashboard();
    });
  });
}
