// app.10.help.js — Help Tab (inline, no new window)
// Called via initHelpTab() from app.99.bootstrap.js

(function () {

  window.initHelpTab = function () {
    const container = document.getElementById('helpContainer');
    if (!container || container._rendered) return;
    container._rendered = true;
    container.innerHTML = HELP_HTML;
  };

  const HELP_HTML = `
<div class="help-wrap">

  <div class="help-header">
    <span class="help-logo">🔥</span>
    <div>
      <h2 class="help-title">Fontana Fire FC</h2>
      <p class="help-subtitle">Attendance App — Help Guide</p>
    </div>
  </div>

  ${section('Quick Start', `
    <ol>
      <li>Log in with your assigned account.</li>
      <li>Select <strong>Dash</strong>, <strong>Practice</strong>, <strong>Games</strong>, <strong>Events</strong>, or <strong>Players</strong>.</li>
      <li>Select the event or open Player Management.</li>
      <li>Save changes before leaving the tab.</li>
    </ol>
  `)}

  ${section('Roles &amp; Permissions', `
    <ul>
      <li><strong>Admin:</strong> full access — players, events, attendance, reports, user management, and permission settings.</li>
      <li><strong>Team Mom:</strong> can manage players, create games and events, manage rosters, take attendance, and view reports.</li>
      <li><strong>Head Coach:</strong> can view players and take attendance; can create/edit events but cannot manage players or view reports.</li>
      <li><strong>Coaches:</strong> can mark attendance only. No event creation, no player management, no reports.</li>
    </ul>
    <div class="help-note">Permissions can be adjusted per role by an Admin in the <strong>Users</strong> tab → Role Permissions.</div>
  `)}

  ${section('Dashboard', `
    <ul>
      <li>Use the month filter to review a specific month, or select All Months.</li>
      <li>Birthdays follow the selected month. If All Months is selected, birthdays show the current month and next month.</li>
      <li>The top 6 summary cards are clickable — tap to expand the player list inline.</li>
      <li>Practice, Game, and Event summaries show totals, attendance %, and player breakdowns.</li>
      <li><strong>Players Needing Attention</strong>, <strong>Perfect Attendance Club</strong>, and <strong>Outstanding Attendance</strong> are collapsible sections.</li>
    </ul>
  `)}

  ${section('Practice Attendance', `
    <ol>
      <li>Open the <strong>Practice</strong> tab.</li>
      <li>Select the practice date from the dropdown. By default, only current month and future dates show. Toggle <em>Show all dates</em> to see older practices.</li>
      <li>Use search, birth year, gender, and status filters to narrow the list.</li>
      <li>Tap <strong>Present</strong>, <strong>Absent</strong>, <strong>Excused</strong>, <strong>Cancelled</strong>, or <strong>Clear / Reset</strong> for each player.</li>
      <li>Click <strong>Submit Attendance</strong>.</li>
      <li>A <strong>Completed</strong> badge appears when all players are marked.</li>
    </ol>
  `)}

  ${section('Generate Practice Schedule', `
    <div class="help-note">Admin only.</div>
    <ol>
      <li>Click the <strong>Schedule</strong> button in the Practice tab header.</li>
      <li>Set a start date, end date, practice days of the week (Mon/Wed by default), start and end time.</li>
      <li>Optionally enter dates to skip (e.g. holidays), comma-separated.</li>
      <li>A live preview shows the dates that will be created.</li>
      <li>Click <strong>Generate schedule</strong>. Dates that already exist are skipped automatically.</li>
    </ol>
  `)}

  ${section('Game Attendance', `
    <div class="help-note">Games use an exact player roster. You pick the specific players for each game when creating it.</div>
    <ol>
      <li>Open the <strong>Games</strong> tab.</li>
      <li>To create a new game: click <strong>+ Add New Game</strong>, fill in details, select expected players, and click <strong>Save Game</strong>.</li>
      <li>To take attendance: select the game from the dropdown. Only rostered players appear.</li>
      <li>To edit the roster: click <strong>Edit Roster</strong>. All active players appear with the current roster pre-checked.</li>
      <li>Mark each player and click <strong>Submit Attendance</strong>.</li>
    </ol>
  `)}

  ${section('Team Events', `
    <ol>
      <li>Open the <strong>Events</strong> tab.</li>
      <li>Click <strong>+ Add New Team Event</strong>.</li>
      <li>Enter the event name and date. Select the exact players for the event. Use the Gender filter for girls-only or boys-only events.</li>
      <li>Click <strong>Add Team Event</strong>. The event is created and selected automatically.</li>
      <li>To edit the roster later: select the event and click <strong>Edit Roster</strong>.</li>
    </ol>
  `)}

  ${section('Player Management', `
    <ul>
      <li>Click <strong>Add New Player</strong> to open the add form.</li>
      <li>Player cards show jersey number, birth year, gender, status, parent 1 name, phone, email, and parent 2 contact if entered.</li>
      <li>Click <strong>View Details</strong> to see the full read-only profile including address, emergency contact, and paperwork status.</li>
      <li>Use <strong>Edit</strong> only when changing player information.</li>
      <li>Use filters for birth year, gender, missing paperwork, missing photo release, and missing emergency info.</li>
      <li>Use <strong>Make Inactive</strong> to remove a player from attendance lists. Toggle <em>Show inactive players</em> to view or restore them.</li>
    </ul>
  `)}

  ${section('Reports', `
    <div class="help-note">Visible to Admin and Team Mom.</div>
    <ul>
      <li>Click any report section to expand it and load the data.</li>
      <li><strong>Attendance Summary:</strong> practice and game attendance % per player for the selected month.</li>
      <li><strong>Missing Paperwork &amp; Photo Release:</strong> players still needing paperwork or photo release.</li>
      <li><strong>Snack Rotation:</strong> full snack rotation list with parent contact info.</li>
      <li><strong>Emergency Contact Sheet:</strong> all active players with emergency contacts and parent info.</li>
      <li><strong>Full Roster:</strong> complete active roster with all contact info and paperwork status.</li>
      <li>Use the <strong>🖨 Print</strong> button to print any open report. Use <strong>⬇ Excel</strong> to download a spreadsheet.</li>
    </ul>
  `)}

  ${section('User Management', `
    <div class="help-note">Visible to Admin and Team Mom. Create/edit/reset is Admin only.</div>
    <ul>
      <li>The Users table shows all accounts with role, status, and last login.</li>
      <li>Admin can create new users, edit roles, reset passwords, and enable/disable accounts.</li>
      <li>The <strong>Role Permissions</strong> grid at the bottom lets Admin toggle capabilities per role using switches.</li>
      <li>Changes to role permissions take effect within 5 minutes (server cache).</li>
    </ul>
  `)}

  ${section('Event Actions', `
    <ul>
      <li><strong>Cancel Event:</strong> use for rainouts or normal cancellations. Keeps event history and can be restored.</li>
      <li><strong>Restore Event:</strong> reopens a cancelled event and clears cancelled attendance so you can mark again.</li>
      <li><strong>Delete Event:</strong> permanent. Use only for mistakes or duplicates — not for normal cancellations.</li>
    </ul>
  `)}

  ${section('Snack Rules', `
    <ul>
      <li><strong>Bring Snack:</strong> family can be assigned snack duty.</li>
      <li><strong>Paid Out:</strong> player is tracked but parent is skipped for snack duty — coach provides snacks.</li>
    </ul>
  `)}

  ${section('Troubleshooting', `
    <ul>
      <li>If the app looks old after an update, hard refresh with <strong>Ctrl + F5</strong>.</li>
      <li>If players don't show for a game, confirm the game roster has been saved. Click <strong>Edit Roster</strong> to check.</li>
      <li>If players don't show for a practice, confirm the correct date is selected.</li>
      <li>If login fails, refresh and try again. If it continues, check that the backend API is online.</li>
      <li>If your session expires, the app returns to the login screen automatically.</li>
      <li>If a password was recently reset, the old password no longer works — use the new temporary password provided.</li>
    </ul>
  `)}

</div>
  `;

  function section(title, bodyHtml) {
    return `
      <details class="help-section">
        <summary class="help-section-title">${title}</summary>
        <div class="help-section-body">${bodyHtml}</div>
      </details>
    `;
  }

})();
