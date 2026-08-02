// app.10.help.js — Task-based Help Guide
(function () {
  const tasks = [
    ['✓','Take Attendance','Practice Attendance','Select an event, mark players, then Submit Attendance.'],
    ['⚽','Manage a Game','Game Attendance','Create/select a game, manage the roster, and take attendance.'],
    ['↺','Fix Attendance','Practice Attendance','Change the incorrect status and submit attendance again.'],
    ['✓','Complete an Old Game','Event Actions','Use the event actions menu and choose Mark completed.'],
    ['⌕','Find a Player Report','Reports','Search Attendance Summary, then tap the player for details.'],
    ['🎯','Follow Up With a Player','Reports','Use Player Follow-Up to find players who may need parent contact.'],
    ['⊘','Cancel or Restore','Event Actions','Use Cancel for rainouts and Restore for accidental cancellations.']
  ];

  const sections = [
    ['Quick Start', [], `<ol>
      <li>Log in with your assigned account.</li>
      <li>Choose the tab for the task you need.</li>
      <li>Select the event or player.</li>
      <li>Make the change and save or submit it.</li>
    </ol><div class="help-note">This guide is organized by task. Open only the section you need.</div>`],

    ['Practice Attendance', [], `<ol>
      <li>Open <strong>Practice</strong>.</li>
      <li>Select the practice date. Use <strong>Show all dates</strong> for older practices.</li>
      <li>Use search, coach, birth year, gender, and status filters as needed.</li>
      <li>Mark <strong>Present</strong>, <strong>Absent</strong>, or <strong>Excused</strong>. Use <strong>Clear / Reset</strong> to remove an incorrect saved status.</li>
      <li>Tap <strong>Submit Attendance</strong>.</li>
      <li>The practice becomes <strong>Completed</strong> when every eligible player is marked.</li>
    </ol><div class="help-note">Players only belong to historical practices when the event date falls within their Start Date / End Date eligibility window.</div>`],

    ['Game Attendance', [], `<ol>
      <li>Open <strong>Games</strong> and select the game.</li>
      <li>Games use an exact roster. Use <strong>Edit Roster</strong> to add or remove players.</li>
      <li>Tap <strong>Continue to Attendance</strong>.</li>
      <li>Mark each rostered player and tap <strong>Submit Attendance</strong>.</li>
    </ol><div class="help-note">Attendance filters only change what you see. They do not change the saved game roster.</div>`],

    ['Team Events', [], `<ol>
      <li>Open <strong>Events</strong>.</li>
      <li>Select an event or add a new Team Event when your permission allows it.</li>
      <li>Choose the exact players for the event.</li>
      <li>Use <strong>Edit Roster</strong> later if the player list changes.</li>
      <li>Continue to Attendance and submit statuses just like a game.</li>
    </ol>`],

    ['Event Actions', ['Admin','TeamMom','HeadCoach'], `<p>Select an event, then tap the <strong>pencil / actions button</strong> beside the event dropdown.</p><ul>
      <li><strong>Edit details:</strong> change name, date, time, location, or notes.</li>
      <li><strong>Mark completed:</strong> close a Scheduled event when attendance was not taken. No fake attendance is created.</li>
      <li><strong>Reopen event:</strong> change a completed event back to Scheduled.</li>
      <li><strong>Cancel event:</strong> use for rainouts or normal cancellations.</li>
      <li><strong>Restore event:</strong> reopen a cancelled event and recover prior attendance where available.</li>
      <li><strong>Delete event:</strong> permanent removal for mistakes or duplicates only.</li>
    </ul>`],

    ['Player Management', ['Admin','TeamMom'], `<ul>
      <li>Use Search Players to find a player quickly.</li>
      <li>Use <strong>View Details</strong> for the complete profile and <strong>Edit</strong> to change information.</li>
      <li>Leave <strong>Coach Override</strong> on <strong>Default (Automatic)</strong> unless the player is an exception.</li>
      <li>Use <strong>Make Inactive</strong> when a player leaves the active roster.</li>
      <li>Turn on <strong>Show inactive players</strong> to review or restore inactive players.</li>
    </ul>`],

    ['Reports', ['Admin','TeamMom','HeadCoach'], `<div class="help-note">Reports are live views of current app data. Open a report section to load the latest information.</div><ul>
      <li><strong>Attendance Summary:</strong> review Practice, Game, and Overall attendance. Filter by month, group, gender, percentage, player search, or date range. Tap a player to see event-by-event attendance.</li>
      <li><strong>Monthly Attendance by Group:</strong> compares attendance by birth year and highlights groups and players below the 70% goal. Tap a player count to see names needing attention.</li>
      <li><strong>Player Follow-Up:</strong> identifies players who may need coach or parent follow-up using monthly attendance and time since last Present.
        <ul>
          <li><strong>Watch:</strong> below 70% but seen recently.</li>
          <li><strong>Follow Up:</strong> 14–29 days since last Present.</li>
          <li><strong>Priority:</strong> 30+ days since last Present or never seen.</li>
        </ul>
      </li>
      <li><strong>Game Day Roster:</strong> select a game to review roster and attendance status.</li>
      <li><strong>Full Roster:</strong> review active players and filter by coach.</li>
      <li><strong>Missing Paperwork &amp; Photo Release:</strong> identifies active players who still need required forms.</li>
      <li><strong>Paperwork Complete:</strong> shows players whose required paperwork and photo release status are on file.</li>
      <li><strong>Emergency Contacts:</strong> provides the active-player emergency contact sheet.</li>
      <li><strong>Snack Rotation:</strong> currently shows snack preference information.</li>
      <li>Use <strong>Print</strong> for a printable report and <strong>Excel</strong> to export a loaded report table.</li>
    </ul>`],

    ['Dashboard', ['Admin','TeamMom','HeadCoach'], `<ul>
      <li>Use the Month filter to review a specific month.</li>
      <li>Top cards show inactive players, paperwork, photo release, and snack information.</li>
      <li>Practice, Game, and Event summaries show attendance performance.</li>
      <li>The Game Summary <strong>Not Rostered</strong> card shows players who were not rostered for a game that month.</li>
      <li>Needs Attention, Good, Outstanding, and Perfect Attendance sections are expandable.</li>
    </ul>`],

    ['Generate Practice Schedule', ['Admin'], `<ol>
      <li>Open <strong>Practice</strong> and tap <strong>Schedule</strong>.</li>
      <li>Choose the date range, practice days, and times.</li>
      <li>Add optional skip dates.</li>
      <li>Review the preview and tap <strong>Generate schedule</strong>.</li>
    </ol>`],

    ['Import Games', ['Admin','TeamMom'], `<ol>
      <li>Open <strong>Games</strong> and choose the import option.</li>
      <li>Upload schedule screenshots or paste schedule text.</li>
      <li>Parse the schedule and review every detected game.</li>
      <li>Edit incorrect fields before creating games.</li>
      <li>Review possible duplicates carefully.</li>
    </ol>`],

    ['Roles & Permissions', ['Admin','TeamMom','HeadCoach'], `<ul>
      <li>Capabilities are permission-based and may differ by account.</li>
      <li>Report access uses <strong>canViewReports</strong>.</li>
      <li>Permanent player deletion uses <strong>canDeletePlayer</strong>.</li>
      <li>Permanent event deletion uses <strong>canDeleteEvents</strong>.</li>
    </ul>`],

    ['Troubleshooting', [], `<ul>
      <li>If the app looks old after an update, refresh or clear browser cache.</li>
      <li>If players do not show for a game, check <strong>Edit Roster</strong>.</li>
      <li>If a player does not show for an old practice, check the player's Start Date.</li>
      <li>If an event stays Scheduled after attendance is submitted, refresh and confirm all eligible players are marked.</li>
      <li>Check the web/api version numbers on the login screen to confirm the latest deploy.</li>
    </ul>`]
  ];

  function esc(v) {
    return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function renderSection(s) {
    return `<details class="help-section" data-help-section="${esc(s[0])}">
      <summary class="help-section-title">${s[0]}</summary>
      <div class="help-section-body">${s[2]}</div>
    </details>`;
  }

  function renderReleaseHistorySection() {
    const changelog = Array.isArray(window.ATTENDANCE_CHANGELOG)
      ? window.ATTENDANCE_CHANGELOG
      : [];

    if (!changelog.length) {
      return `
        <details class="help-section" data-help-section="Release Updates / Release History">
          <summary class="help-section-title">🔥 Release Updates / Release History</summary>
          <div class="help-section-body">
            <p>No release history is available in this build.</p>
          </div>
        </details>
      `;
    }

    const latest = changelog[0];

    const historyHtml = changelog.map((release, index) => `
      <div class="help-release-entry">
        <p><strong>${esc(release.version || '')} · ${esc(release.date || '')}</strong></p>
        <p><strong>${esc(release.title || '')}</strong></p>
        ${release.summary ? `<p>${esc(release.summary)}</p>` : ''}
        ${(release.features || []).length ? `
          <p><strong>New / Changed</strong></p>
          <ul>${release.features.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}
        ${(release.improvements || []).length ? `
          <p><strong>Improved</strong></p>
          <ul>${release.improvements.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}
        ${(release.fixes || []).length ? `
          <p><strong>Fixes</strong></p>
          <ul>${release.fixes.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}
        ${index < changelog.length - 1 ? '<hr>' : ''}
      </div>
    `).join('');

    return `
      <details class="help-section" data-help-section="Release Updates / Release History">
        <summary class="help-section-title">🔥 Release Updates / Release History</summary>
        <div class="help-section-body">
          <div class="help-note">
            <strong>Current release:</strong> ${esc(latest.version || '')} · ${esc(latest.date || '')}
          </div>
          <p><strong>${esc(latest.title || '')}</strong></p>
          <p>${esc(latest.summary || '')}</p>
          <div class="help-note">Release History lists meaningful user-facing releases. Small internal fixes and repeated debugging changes are grouped instead of listed individually.</div>
          <button type="button" id="helpShowWhatsNewBtn" class="btn btn-secondary" style="margin:6px 0 14px;">
            Show What's New
          </button>
          ${historyHtml}
        </div>
      </details>
    `;
  }

  window.initHelpTab = function () {
    const container = document.getElementById('helpContainer');
    if (!container) return;
    const role = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.RoleName : 'Coaches';
    const visible = sections.filter(s => !s[1].length || s[1].includes(role));
    const titles = new Set(visible.map(s => s[0]));
    const visibleTasks = tasks.filter(t => titles.has(t[2]));

    container.innerHTML = `<div class="help-wrap">
      <div class="help-header">
        <span class="help-logo" aria-hidden="true">🔥</span>
        <div><h2 class="help-title">How to Use the Attendance App</h2>
        <p class="help-subtitle">Choose what you need to do. No guided tour required.</p></div>
      </div>
      <section class="help-common-tasks">
        <div class="help-common-heading"><h3>I need to…</h3><p>Tap a task to jump directly to the instructions.</p></div>
        <div class="help-task-grid">${visibleTasks.map(t => `<button type="button" class="help-task-card" data-help-target="${esc(t[2])}">
          <span class="help-task-icon">${t[0]}</span>
          <span class="help-task-copy"><strong>${esc(t[1])}</strong><span>${esc(t[3])}</span></span>
          <span class="help-task-arrow">›</span></button>`).join('')}</div>
      </section>
      <div class="help-guide-heading"><h3>How-To Guide</h3><p>Open a section when you need more detail.</p></div>
      ${visible.map(renderSection).join('')}
      ${renderReleaseHistorySection()}
    </div>`;

    container.querySelectorAll('.help-task-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.helpTarget;
        const section = [...container.querySelectorAll('.help-section')].find(el => el.dataset.helpSection === target);
        if (!section) return;
        container.querySelectorAll('.help-section').forEach(el => { if (el !== section) el.open = false; });
        section.open = true;
        section.scrollIntoView({behavior:'smooth', block:'start'});
      });
    });

    const whatsNewBtn = document.getElementById('helpShowWhatsNewBtn');
    if (whatsNewBtn) {
      whatsNewBtn.addEventListener('click', () => {
        if (typeof window.showAttendanceWhatsNew === 'function') {
          window.showAttendanceWhatsNew();
        }
      });
    }
  };
})();
