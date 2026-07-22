// app.10.help.js — Help Tab (inline, role-filtered)
// Called via initHelpTab() from app.99.bootstrap.js

(function () {

  function renderReleaseHistory() {
    const releases = Array.isArray(window.ATTENDANCE_CHANGELOG) ? window.ATTENDANCE_CHANGELOG : [];
    if (!releases.length) return '<p>No release history is available yet.</p>';
    return releases.map(function(release) {
      function list(title, items) {
        if (!Array.isArray(items) || !items.length) return '';
        return '<h5>' + title + '</h5><ul>' + items.map(function(item) { return '<li>' + item + '</li>'; }).join('') + '</ul>';
      }
      return '<article class="release-history-entry">' +
        '<div class="release-history-heading"><strong>' + release.title + '</strong><span>' + release.version + ' · ' + release.date + '</span></div>' +
        '<p>' + release.summary + '</p>' +
        list('New features', release.features) +
        list('Fixes', release.fixes) +
        list('Backend / database', release.backend) +
        list('Frontend', release.frontend) +
        list('Deployment notes', release.deployment) +
        list('Testing status', release.testing) +
      '</article>';
    }).join('');
  }

  // Each section: title, body HTML, roles that can see it (empty = all roles)
  const HELP_SECTIONS = [
    {
      title: 'Quick Start',
      roles: [],
      body: `
        <ol>
          <li>Log in with your assigned account.</li>
          <li>Select <strong>Dash</strong>, <strong>Practice</strong>, <strong>Games</strong>, <strong>Events</strong>, or <strong>Players</strong> from the tab bar.</li>
          <li>Select the event from the dropdown, or open Player Management.</li>
          <li>Mark attendance and click <strong>Submit Attendance</strong> to save.</li>
        </ol>
      `
    },
    {
      title: 'Roles &amp; Permissions',
      roles: ['Admin', 'TeamMom', 'HeadCoach'],
      body: `
        <ul>
          <li><strong>Admin:</strong> full access — players, events, attendance, reports, user management, import, and permission settings.</li>
          <li><strong>Team Mom:</strong> can manage players, create games and events, manage rosters, take attendance, import games, and view reports.</li>
          <li><strong>Head Coach:</strong> can view players and take attendance; can create/edit events but cannot manage players or view reports.</li>
          <li><strong>Coaches:</strong> can mark attendance only. No event creation, no player management, no reports.</li>
        </ul>
        <div class="help-note">Permissions can be adjusted per role by an Admin in the <strong>Users</strong> tab &rarr; Role Permissions.</div>
      `
    },
    {
      title: 'Dashboard',
      roles: ['Admin', 'TeamMom', 'HeadCoach'],
      body: `
        <ul>
          <li>Use the month filter to review a specific month, or select All Months.</li>
          <li>Birthdays follow the selected month. The badge shows the count for each month.</li>
          <li>Practice, Game, and Event summaries show totals, attendance %, and player tier breakdowns (Needs Attention, Good, Strong).</li>
          <li>Game Summary includes a <strong>Not Rostered</strong> card — click it to see which players haven't been on any game roster that month.</li>
          <li><strong>Players Needing Attention</strong>, <strong>Good Attendance</strong>, <strong>Outstanding</strong>, and <strong>Perfect Attendance</strong> are collapsible sections.</li>
        </ul>
      `
    },
    {
      title: 'Practice Attendance',
      roles: [],
      body: `
        <ol>
          <li>Open the <strong>Practice</strong> tab.</li>
          <li>Select the practice date from the dropdown. By default, only current month and future dates show. Toggle <em>Show all dates</em> to see older practices.</li>
          <li>Use search, coach, birth year, gender, and status filters to narrow the list. <strong>All Coaches</strong> always shows the full roster.</li>
          <li>Tap <strong>Present</strong>, <strong>Absent</strong>, <strong>Excused</strong>, <strong>Cancelled</strong>, or <strong>Clear / Reset</strong> for each player.</li>
          <li>Click <strong>Submit Attendance</strong>.</li>
          <li>A <strong>Completed</strong> badge appears when all players are marked.</li>
        </ol>
      `
    },
    {
      title: 'Generate Practice Schedule',
      roles: ['Admin'],
      body: `
        <ol>
          <li>Click the <strong>Schedule</strong> button in the Practice tab header.</li>
          <li>Set a start date, end date, practice days of the week, start and end time.</li>
          <li>Optionally enter dates to skip (e.g. holidays), comma-separated.</li>
          <li>A live preview shows the dates that will be created.</li>
          <li>Click <strong>Generate schedule</strong>. Dates that already exist are skipped automatically.</li>
        </ol>
      `
    },
    {
      title: 'Game Attendance',
      roles: [],
      body: `
        <div class="help-note">Games use an exact player roster. You pick the specific players for each game when creating it, or create the game without a roster and add players later.</div>
        <ol>
          <li>Open the <strong>Games</strong> tab.</li>
          <li>To create a new game: click <strong>+ Add New Game</strong>, fill in opponent/name, date, time, and location. Player roster is optional at creation.</li>
          <li>To take attendance: select the game from the dropdown. Only rostered players appear.</li>
          <li>To edit the roster: click <strong>Edit Roster</strong>. All active players appear with the current roster pre-checked.</li>
          <li>Mark each player and click <strong>Submit Attendance</strong>.</li>
        </ol>
      `
    },
    {
      title: 'Import Games',
      roles: ['Admin', 'TeamMom'],
      body: `
        <ol>
          <li>Open the <strong>Games</strong> tab and click <strong>Import from Post</strong>.</li>
          <li>Choose <strong>Upload Photos</strong> to add screenshots of the schedule (from Band app, league website, etc.) or <strong>Paste Text</strong> to paste the schedule text.</li>
          <li>Click <strong>Parse Schedule</strong>. Claude AI reads the images/text and extracts all Fontana Fire games.</li>
          <li>Review the results: each game shows opponent, date, time, location, age group (COMP), and field number. All fields are editable.</li>
          <li>Games that may already exist are flagged as <strong>Possible duplicate</strong> and unchecked by default.</li>
          <li>Check the games you want to create and click <strong>Create Games</strong>.</li>
        </ol>
        <div class="help-note">The import only finds games for <strong>Fontana Fire</strong>. Games for other teams (e.g. Fontana FC) are excluded.</div>
      `
    },
    {
      title: 'Team Events',
      roles: [],
      body: `
        <ol>
          <li>Open the <strong>Events</strong> tab.</li>
          <li>Click <strong>+ Add New Team Event</strong>.</li>
          <li>Enter the event name and date. Player selection is optional — you can add the roster later.</li>
          <li>Use the Gender filter for girls-only or boys-only events.</li>
          <li>Click <strong>Add Team Event</strong>. The event is created and selected automatically.</li>
          <li>To edit the roster later: select the event and click <strong>Edit Roster</strong>.</li>
        </ol>
      `
    },
    {
      title: 'Edit Event Details',
      roles: ['Admin', 'TeamMom', 'HeadCoach'],
      body: `
        <ul>
          <li>Select any event (practice, game, or team event) from the dropdown.</li>
          <li>Click the <strong>pencil icon</strong> next to the event dropdown to open the actions menu.</li>
          <li>Click <strong>Edit details</strong> to change the event name, date, time, location, or notes.</li>
          <li>Click <strong>Save Changes</strong>. The event list reloads automatically.</li>
        </ul>
        <div class="help-note">Editing details does not affect the roster or attendance records.</div>
      `
    },
    {
      title: 'Player Management',
      roles: ['Admin', 'TeamMom'],
      body: `
        <ul>
          <li>Click <strong>Add New Player</strong> to open the add form.</li>
          <li>Player cards show jersey number, birth year, gender, resolved coach, status, and parent contacts.</li>
          <li>Use <strong>Coach Override</strong> only for exceptions. Leave it on <strong>Default (Automatic)</strong> for the standard birth-year and gender assignment.</li>
          <li>Click <strong>View Details</strong> to see the full profile including address, emergency contact, and paperwork status.</li>
          <li>Use <strong>Edit</strong> only when changing player information.</li>
          <li>Use filters for birth year, gender, missing paperwork, missing photo release, and missing emergency info.</li>
          <li>Use <strong>Make Inactive</strong> to remove a player from attendance lists. Toggle <em>Show inactive players</em> to view or restore them.</li>
        </ul>
      `
    },
    {
      title: 'Reports',
      roles: ['Admin', 'TeamMom'],
      body: `
        <ul>
          <li>Click any report section to expand it and load the data.</li>
          <li><strong>Attendance Summary:</strong> practice and game attendance % per player. Filter by month, group, gender, or date range. Click any player to see their full event history.</li>
          <li><strong>Missing Paperwork &amp; Photo Release:</strong> players still needing forms.</li>
          <li><strong>Paperwork Complete:</strong> players with all paperwork and photo release on file.</li>
          <li><strong>Snack Rotation:</strong> full snack list with parent contact info.</li>
          <li><strong>Emergency Contact Sheet:</strong> all active players with emergency contacts.</li>
          <li><strong>Full Roster:</strong> complete roster with group, coach, contact info, and paperwork status.</li>
          <li><strong>Attendance Red Flags:</strong> players below a chosen threshold. Click any player to drill down.</li>
          <li><strong>Game Day Roster:</strong> select a game to see rostered players with jersey, group, gender, and attendance status.</li>
          <li><strong>Monthly Group Breakdown:</strong> per birth year group averages for practice, game, and overall attendance.</li>
          <li>Use <strong>Print</strong> to print any open report. Use <strong>Excel</strong> to download a spreadsheet.</li>
        </ul>
      `
    },
    {
      title: 'User Management',
      roles: ['Admin', 'TeamMom'],
      body: `
        <div class="help-note">Visible to Admin and Team Mom. Create/edit/reset is Admin only.</div>
        <ul>
          <li>The Users table shows all accounts with role, status, and last login.</li>
          <li>Admin can create new users, edit roles, reset passwords, and enable/disable accounts.</li>
          <li>The <strong>Role Permissions</strong> grid lets Admin toggle capabilities per role including:
            <ul>
              <li><strong>Delete Events</strong> — who can permanently delete games/events</li>
              <li><strong>Import Games</strong> — who can use the AI schedule import</li>
            </ul>
          </li>
          <li>Changes to role permissions take effect within 5 minutes.</li>
        </ul>
      `
    },
    {
      title: 'Event Actions',
      roles: ['Admin', 'TeamMom', 'HeadCoach'],
      body: `
        <ul>
          <li><strong>Edit Details:</strong> change the event name, date, time, location, or notes without affecting the roster or attendance.</li>
          <li><strong>Cancel Event:</strong> use for rainouts or normal cancellations. Keeps event history and can be restored later.</li>
          <li><strong>Restore Event:</strong> reopens a cancelled event and clears cancelled attendance so you can mark again.</li>
          <li><strong>Delete Event:</strong> permanent removal. Use only for mistakes or duplicates — not for normal cancellations. Requires the <strong>Delete Events</strong> permission.</li>
        </ul>
      `
    },
    {
      title: 'Snack Rules',
      roles: ['Admin', 'TeamMom'],
      body: `
        <ul>
          <li><strong>Bring Snack:</strong> family can be assigned snack duty for a practice.</li>
          <li><strong>Paid Out:</strong> player is tracked but parent is skipped for snack duty — coach provides snacks instead.</li>
        </ul>
      `
    },
    {
      title: 'What\'s New / Release History',
      roles: [],
      body: renderReleaseHistory()
    },
    {
      title: 'Troubleshooting',
      roles: [],
      body: `
        <ul>
          <li>If the app looks old after an update, hard refresh with <strong>Ctrl + F5</strong> (desktop) or clear browser cache (mobile).</li>
          <li>If players don't show for a game, confirm the game roster has been saved. Click <strong>Edit Roster</strong> to check.</li>
          <li>If players don't show for a practice, confirm the correct date is selected.</li>
          <li>If login fails, refresh and try again. If it continues, check that the backend API is online.</li>
          <li>If your session expires, the app returns to the login screen automatically after 20 minutes of inactivity.</li>
          <li>If a password was recently reset, the old password no longer works — use the new temporary password provided.</li>
          <li>Check the version numbers on the login screen (<strong>web:</strong> and <strong>api:</strong>) to confirm the latest deploy is live.</li>
        </ul>
      `
    }
  ];

  function section(title, bodyHtml) {
    return `
      <details class="help-section">
        <summary class="help-section-title">${title}</summary>
        <div class="help-section-body">${bodyHtml}</div>
      </details>
    `;
  }

  window.initHelpTab = function () {
    const container = document.getElementById('helpContainer');
    if (!container || container._rendered) return;
    container._rendered = true;

    const role = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.RoleName : 'Coaches';

    const visibleSections = HELP_SECTIONS.filter(function(s) {
      if (!s.roles || s.roles.length === 0) return true;
      return s.roles.includes(role);
    });

    const sectionsHtml = visibleSections.map(function(s) { return section(s.title, s.body); }).join('');

    container.innerHTML = '<div class="help-wrap">' +
      '<div class="help-header">' +
        '<span class="help-logo"><svg class="app-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22c-4 0-7-3-7-7 0-3 2-6 5-9 0 3 2 4 3 5 1-3 1-6 0-9 4 3 7 7 7 12 0 5-3 8-8 8zM9 17c0-2 1-3 3-5 0 2 2 3 2 5a2.5 2.5 0 01-5 0z"/></svg></span>' +
        '<div>' +
          '<h2 class="help-title" style="color:#c2410c; opacity:1;">Fontana Fire FC</h2>' +
          '<p class="help-subtitle">Attendance App \u2014 Help Guide</p>' +
        '</div>' +
      '</div>' +
      sectionsHtml +
    '</div>';
  };

})();