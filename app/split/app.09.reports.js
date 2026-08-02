// app.09.reports.js — Reports Tab
// Accordion sections with inline rendering, Print + Excel download
// Attendance Summary: group subtotals, filters, player detail view (Option 3)

(function () {

  // ── State ──────────────────────────────────────────────────────────────────
  const reportState = {
    attendance: {
      loaded: false, data: null,
      month: getCurrentMonthValue(),
      from: '', to: '',
      group: '', gender: '', below: '', search: '',
      viewingPlayer: null   // { playerId, playerName } when in detail view
    },
    paperwork:  { loaded: false, data: null },
    snacks:     { loaded: false, data: null },
    emergency:  { loaded: false, data: null },
    roster:     { loaded: false, data: null, coach: '' },
    redflags:   { loaded: false, data: null },
    gameday:    { loaded: false, data: null, gameId: null },
    groupstats: { loaded: false, data: null, month: '' },
    'paperwork-complete': { loaded: false, data: null },
  };

  function getCurrentMonthValue() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // ── Groups cache ──────────────────────────────────────────────────────────
  let groupsCache = null;
  async function loadGroups() {
    if (groupsCache) return groupsCache;
    try {
      const res = await fetch(`${API_BASE}/groups`, { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      groupsCache = Array.isArray(data) ? data : (data.groups || []);
    } catch (_) { groupsCache = []; }
    return groupsCache;
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  window.initReportsTab = function () {
    const container = document.getElementById('reportsContainer');
    if (!container) return;

    // Reports are live views of current app data.
    // Preserve filter/search selections, but never reuse stale loaded rows
    // after leaving and returning to the Reports tab.
    Object.values(reportState).forEach(st => {
      st.loaded = false;
      st.data = null;
    });

    container.innerHTML = buildReportsShell();
    wireAttendanceControls();
  };

  // Mark report data stale after player/event/attendance updates.
  // Filter/search selections remain intact.
  window.invalidateReportsData = function () {
    Object.values(reportState).forEach(st => {
      st.loaded = false;
      st.data = null;
    });
  };

  // ── Shell ──────────────────────────────────────────────────────────────────
  function buildReportsShell() {
    return `
      <div class="reports-wrap">
        <div class="reports-modern-header">
          <div>
            <span class="reports-modern-kicker">FONTANA FIRE FC</span>
            <h3>Reports & Coaching Insights</h3>
            <p>Attendance, roster, player follow-up, game-day, and club administration reports.</p>
          </div>
          <div class="reports-modern-header-mark">FF</div>
        </div>

        <div class="reports-modern-section-label">Coaching & Attendance</div>
        ${buildAccordion('attendance', '📊 Attendance Summary', buildAttendanceControls())}
        ${buildAccordion('groupstats', '📈 Monthly Attendance by Group', buildGroupStatsControls())}
        <div class="reports-modern-section-label">Club Administration</div>
        ${buildAccordion('paperwork',  '📋 Missing Paperwork & Photo Release')}
        ${buildAccordion('snacks',     '🍎 Snack Rotation')}
        ${buildAccordion('emergency',  '🚨 Emergency Contacts')}
        ${buildAccordion('roster',     '👥 Full Roster', buildRosterControls())}
        ${buildAccordion('paperwork-complete', '✅ Paperwork Complete')}
        <div class="reports-modern-section-label">Coaching Follow-Up</div>
        ${buildAccordion('redflags',   '🎯 Player Follow-Up', buildRedFlagControls())}
        <div class="reports-modern-section-label">Game Day</div>
        ${buildAccordion('gameday',    '⚽ Game Day Roster', buildGameDayControls())}
      </div>
    `;
  }

  function buildAccordion(key, label, controlsHtml = '') {
    return `
      <div class="report-accordion" id="accordion-${key}" data-report="${key}">
        <button class="report-accordion-header" onclick="toggleReportAccordion('${key}')">
          <span class="report-accordion-label">${label}</span>
          <span class="report-accordion-chevron">▼</span>
        </button>
        <div class="report-accordion-body" id="body-${key}" style="display:none;">
          <div class="report-toolbar" id="toolbar-${key}">
            ${controlsHtml}
            <div class="report-toolbar-actions">
              <button class="btn-report-print" onclick="printReport('${key}')" title="Print">🖨 Print</button>
              <button class="btn-report-excel" onclick="downloadReportExcel('${key}')" title="Excel">⬇ Excel</button>
            </div>
          </div>
          <div class="report-content" id="content-${key}">
            <div class="report-loading">Loading…</div>
          </div>
        </div>
      </div>
    `;
  }

  // ── Attendance controls ────────────────────────────────────────────────────
  function buildAttendanceControls() {
    const months = buildMonthOptions();
    return `
      <div class="att-filters">
        <div class="att-filter-group">
          <label class="report-filter-label">Month</label>
          <select id="att-month" class="report-month-select">${months}</select>
        </div>
        <div class="att-filter-group att-range-group" style="display:none;">
          <label class="report-filter-label">From</label>
          <input type="date" id="att-from" class="report-date-input" />
          <label class="report-filter-label">To</label>
          <input type="date" id="att-to" class="report-date-input" />
        </div>
        <div class="att-filter-group att-search-group">
          <label class="report-filter-label" for="att-player-search">Player</label>
          <input
            id="att-player-search"
            class="report-player-search"
            type="search"
            placeholder="Search name or #"
            autocomplete="off"
          />
        </div>
        <div class="att-filter-group">
          <label class="report-filter-label">Group</label>
          <select id="att-group" class="report-month-select">
            <option value="">All Groups</option>
          </select>
        </div>
        <div class="att-filter-group">
          <label class="report-filter-label">Gender</label>
          <select id="att-gender" class="report-month-select">
            <option value="">All</option>
            <option value="M">Boys</option>
            <option value="F">Girls</option>
          </select>
        </div>
        <div class="att-filter-group">
          <label class="report-filter-label">Show</label>
          <select id="att-below" class="report-month-select">
            <option value="">All players</option>
            <option value="90">Below 90%</option>
            <option value="80">Below 80%</option>
            <option value="70">Below 70%</option>
          </select>
        </div>
        <div class="att-filter-group">
          <button class="btn-att-range-toggle" id="att-range-toggle" onclick="toggleAttDateRange()" title="Switch between month and date range">📅 Date Range</button>
        </div>
      </div>
    `;
  }

  function buildRosterControls() {
    const selected = reportState.roster.coach || '';
    const options = [
      ['', 'All Coaches'],
      ['Jose', 'Jose'],
      ['Alfredo', 'Alfredo'],
      ['Bobby', 'Bobby'],
      ['Damian', 'Damian'],
      ['Unassigned', 'Unassigned']
    ];

    return `
      <div class="att-filters">
        <div class="att-filter-group">
          <label class="report-filter-label">Coach</label>
          <select id="roster-coach" class="report-month-select" onchange="onRosterCoachFilterChange()">
            ${options.map(([value, label]) =>
              `<option value="${value}" ${selected === value ? 'selected' : ''}>${label}</option>`
            ).join('')}
          </select>
        </div>
      </div>
    `;
  }

  window.onRosterCoachFilterChange = function () {
    const st = reportState.roster;
    st.coach = document.getElementById('roster-coach')?.value || '';

    const el = document.getElementById('content-roster');
    if (!el) return;

    if (st.data) {
      el.innerHTML = renderRoster(st.data);
    } else {
      loadReport('roster');
    }
  };

  function buildMonthOptions() {
    const now = new Date();
    let html = '<option value="">All time</option>';
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      html += `<option value="${val}" ${i === 0 ? 'selected' : ''}>${label}</option>`;
    }
    return html;
  }

  function wireAttendanceControls() {
    // Populate groups dropdown async
    loadGroups().then(groups => {
      const sel = document.getElementById('att-group');
      if (!sel) return;
      groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.BirthYear || g.GroupCode || g.GroupName;
        opt.textContent = g.GroupName;
        sel.appendChild(opt);
      });
    });

    const ids = ['att-month','att-group','att-gender','att-below','att-from','att-to'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', onAttFilterChange);
    });

    const playerSearch = document.getElementById('att-player-search');
    if (playerSearch) {
      playerSearch.addEventListener('input', () => {
        reportState.attendance.search = playerSearch.value || '';
        reportState.attendance.viewingPlayer = null;

        const content = document.getElementById('content-attendance');
        if (content && reportState.attendance.data) {
          content.innerHTML = renderAttendance(reportState.attendance.data);
        }
      });
    }
  }

  window.onAttFilterChange = function () {
    const st = reportState.attendance;
    st.month  = document.getElementById('att-month')?.value  || '';
    st.group  = document.getElementById('att-group')?.value  || '';
    st.gender = document.getElementById('att-gender')?.value || '';
    st.below  = document.getElementById('att-below')?.value  || '';
    st.search = document.getElementById('att-player-search')?.value || st.search || '';
    st.from   = document.getElementById('att-from')?.value   || '';
    st.to     = document.getElementById('att-to')?.value     || '';
    st.loaded = false;
    st.viewingPlayer = null;
    loadReport('attendance');
  };

  window.toggleAttDateRange = function () {
    const rangeGroup = document.querySelector('.att-range-group');
    const monthGroup = document.querySelector('#att-month')?.closest('.att-filter-group');
    const btn = document.getElementById('att-range-toggle');
    if (!rangeGroup) return;
    const isRange = rangeGroup.style.display !== 'none';
    rangeGroup.style.display = isRange ? 'none' : 'flex';
    if (monthGroup) monthGroup.style.display = isRange ? 'flex' : 'none';
    if (btn) btn.classList.toggle('active', !isRange);
    onAttFilterChange();
  };

  // ── Accordion toggle ───────────────────────────────────────────────────────
  window.toggleReportAccordion = function (key) {
    const body = document.getElementById(`body-${key}`);
    const accordion = document.getElementById(`accordion-${key}`);
    if (!body || !accordion) return;
    const chevron = accordion.querySelector('.report-accordion-chevron');
    const isOpen = body.style.display !== 'none';

    if (isOpen) {
      body.style.display = 'none';
      accordion.classList.remove('report-accordion--open');
      if (chevron) chevron.textContent = '▼';
    } else {
      body.style.display = 'block';
      accordion.classList.add('report-accordion--open');
      if (chevron) chevron.textContent = '▲';
      if (!reportState[key].loaded) loadReport(key);
    }
  };

  // ── Data loading ───────────────────────────────────────────────────────────
  async function loadReport(key) {
    const el = document.getElementById(`content-${key}`);
    if (!el) return;
    el.innerHTML = '<div class="report-loading">Loading…</div>';

    try {
      const st = reportState[key];

      // ── New report loaders ──
      if (key === 'redflags') {
        const month = document.getElementById('rf-month')?.value || getCurrentMonthValue();
        const params = new URLSearchParams();
        if (month) params.set('month', month);

        const res = await fetch(`${API_BASE}/reports/redflags?${params}`, {
          credentials: 'include',
          cache: 'no-store'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        st.data = json.data || [];
        st.loaded = true;
        el.innerHTML = renderRedFlags(st.data, json.month || month);
        return;
      }

      if (key === 'gameday') {
        const gameId = st.gameId;
        if (!gameId) { el.innerHTML = '<div class="report-empty">Select a game above to view the roster.</div>'; return; }
        const [detRes, rosterRes, attRes] = await Promise.all([
          fetch(`${API_BASE}/events/${gameId}/details`, { credentials: 'include', cache: 'no-store' }),
          fetch(`${API_BASE}/events/${gameId}/roster`, { credentials: 'include', cache: 'no-store' }),
          fetch(`${API_BASE}/reports/game-attendance/${gameId}`, { credentials: 'include', cache: 'no-store' })
        ]);
        const det = await detRes.json();
        const roster = await rosterRes.json();
        // Build attendance map: PlayerID -> AttendanceStatus
        const attMap = {};
        try {
          const attData = await attRes.json();
          const attList = Array.isArray(attData) ? attData : (attData.attendance || attData.records || []);
          attList.forEach(a => { if (a.PlayerID) attMap[a.PlayerID] = a.AttendanceStatus; });
        } catch(e) {}
        st.loaded = true;
        el.innerHTML = renderGameDay(det.event || det, roster.players || [], attMap);
        return;
      }

      if (key === 'groupstats') {
        const month = document.getElementById('gs-month')?.value || '';
        const params = new URLSearchParams();
        if (month) params.set('month', month);
        const res = await fetch(`${API_BASE}/reports/attendance?${params}`, { credentials: 'include', cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        st.data = json.data || [];
        st.loaded = true;
        el.innerHTML = renderGroupStats(st.data, month);
        return;
      }
      if (key === 'paperwork-complete') {
        const res = await fetch(`${API_BASE}/reports/paperwork-complete`, { credentials: 'include', cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        st.data = json.data || [];
        st.loaded = true;
        el.innerHTML = renderPaperworkComplete(st.data);
        return;
      }

      // ── End new report loaders ──

      let url = `${API_BASE}/reports/${key}`;

      if (key === 'attendance') {
        const params = new URLSearchParams();
        if (st.from && st.to) { params.set('from', st.from); params.set('to', st.to); }
        else if (st.month)    { params.set('month', st.month); }
        if (st.group)  params.set('group', st.group);
        if (st.gender) params.set('gender', st.gender);
        if (st.below)  params.set('below', st.below);
        url += '?' + params.toString();
      }

      const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json.data || json;

      st.data = data;
      st.loaded = true;
      el.innerHTML = renderReport(key, data);
    } catch (err) {
      el.innerHTML = `<div class="report-error">Failed to load report. ${err.message}</div>`;
    }
  }

  // ── Player detail loader ───────────────────────────────────────────────────
  async function loadPlayerDetail(playerId, playerName) {
    const el = document.getElementById('content-attendance');
    if (!el) return;

    reportState.attendance.viewingPlayer = { playerId, playerName };

    // Hide toolbar, show back button area
    const toolbar = document.getElementById('toolbar-attendance');
    if (toolbar) toolbar.style.display = 'none';

    el.innerHTML = '<div class="report-loading">Loading player detail…</div>';

    try {
      const st = reportState.attendance;
      const params = new URLSearchParams();
      if (st.from && st.to) { params.set('from', st.from); params.set('to', st.to); }
      else if (st.month)    { params.set('month', st.month); }
      const url = `${API_BASE}/reports/player-detail/${playerId}?${params.toString()}`;

      const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      el.innerHTML = renderPlayerDetail(json.player, json.events);
    } catch (err) {
      el.innerHTML = `<div class="report-error">Failed to load player detail. ${err.message}</div>
        <button class="btn-detail-back" onclick="backToAttendanceList()">← Back to list</button>`;
    }
  }

  window.backToAttendanceList = function () {
    reportState.attendance.viewingPlayer = null;
    const toolbar = document.getElementById('toolbar-attendance');
    if (toolbar) toolbar.style.display = '';

    const el = document.getElementById('content-attendance');
    if (!el) return;

    if (reportState.attendance.data) {
      el.innerHTML = renderReport('attendance', reportState.attendance.data);
    } else {
      loadReport('attendance');
    }
  };

  window.drillDownPlayer = function (playerId, playerName) {
    loadPlayerDetail(playerId, playerName);
  };

  // ── Renderers ──────────────────────────────────────────────────────────────
  function renderReport(key, data) {
    switch (key) {
      case 'attendance': return renderAttendance(data);
      case 'paperwork':  return renderPaperwork(data);
      case 'snacks':     return renderSnacks(data);
      case 'emergency':  return renderEmergency(data);
      case 'roster':     return renderRoster(data);
      case 'paperwork-complete': return renderPaperworkComplete(data);
      case 'redflags':   return renderRedFlags(data);
      case 'gameday':    return renderGameDay({}, data || []);
      case 'groupstats': return renderGroupStats(data);
      default: return '<p>Unknown report.</p>';
    }
  }

  function renderModernSummaryCards(cards) {
    return `
      <div class="rpt-summary-grid">
        ${cards.map(card => `
          <div class="rpt-summary-card ${card.tone ? `rpt-summary-card--${card.tone}` : ''}">
            <span>${esc(card.label)}</span>
            <strong>${esc(card.value)}</strong>
            ${card.note ? `<small>${esc(card.note)}</small>` : ''}
          </div>`).join('')}
      </div>`;
  }

  // ── Attendance Summary (list view) ─────────────────────────────────────────
  function renderAttendance(data) {
    if (!data || !data.length) return '<div class="report-empty">No attendance data for this period.</div>';

    const st = reportState.attendance;
    const rawSearch = String(st.search || '').trim().toLowerCase();
    const search = rawSearch.replace(/^#/, '');
    const filteredData = !search ? data : data.filter(r => {
      const first = String(r.FirstName || '').toLowerCase();
      const last = String(r.LastName || '').toLowerCase();
      const full = `${first} ${last}`.trim();
      const number = r.PlayerNumber == null ? '' : String(r.PlayerNumber).toLowerCase();
      return first.includes(search) || last.includes(search) || full.includes(search) || number.includes(search);
    });

    if (!filteredData.length) {
      return `<div class="report-empty">No players match “${esc(st.search)}”.</div>`;
    }
    let periodLabel = '';
    if (st.from && st.to) periodLabel = `${fmtDate(st.from)} – ${fmtDate(st.to)}`;
    else if (st.month) {
      const sel = document.getElementById('att-month');
      periodLabel = sel?.selectedOptions[0]?.text || st.month;
    } else { periodLabel = 'All Time'; }

    // Group by BirthYear
    const groups = {};
    filteredData.forEach(r => {
      const key = r.BirthYear || r.GroupName || 'No Group Assigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    let rows = '';
    Object.keys(groups).sort().forEach(groupKey => {
      const players = groups[groupKey];
      // Group subtotal
      const avgPractice = avg(players.map(p => p.PracticePct));
      const avgGame     = avg(players.map(p => p.GamePct));
      const avgOverall  = avg(players.map(p => p.OverallPct));
      rows += `
        <tr class="rpt-group-row">
          <td colspan="2">
            <span class="rpt-group-name">${esc(String(groupKey))}</span>
            <span class="rpt-group-count">${players.length} players</span>
          </td>
          <td><span class="pct-badge ${pctClass(avgPractice)}">${fmtPct(avgPractice)} avg</span></td>
          <td><span class="pct-badge ${pctClass(avgGame)}">${fmtPct(avgGame)} avg</span></td>
          <td><span class="pct-badge ${pctClass(avgOverall)}">${fmtPct(avgOverall)} avg</span></td>
        </tr>`;

      players.forEach(r => {
        const pid = r.PlayerID;
        const pname = esc(`${r.FirstName} ${r.LastName}`);
        rows += `
          <tr class="rpt-player-row" onclick="drillDownPlayer(${pid}, '${pname.replace(/'/g,"\\'")}')">
            <td>
              <span class="rpt-player-name">${pname}</span>
              ${r.PlayerNumber ? `<span class="rpt-jersey">#${r.PlayerNumber}</span>` : ''}
            </td>
            <td class="rpt-cell-sub">${esc(r.GroupName || String(r.BirthYear || ''))}</td>
            <td>
              <span class="pct-badge ${pctClass(r.PracticePct)}">${fmtPct(r.PracticePct)}</span>
              <span class="rpt-fraction">${r.PracticePresent ?? 0}/${r.PracticeCounted ?? 0}</span>
            </td>
            <td>
              <span class="pct-badge ${pctClass(r.GamePct)}">${fmtPct(r.GamePct)}</span>
              <span class="rpt-fraction">${r.GamePresent ?? 0}/${r.GameCounted ?? 0}</span>
            </td>
            <td>
              <span class="pct-badge ${pctClass(r.OverallPct)}">${fmtPct(r.OverallPct)}</span>
            </td>
          </tr>`;
      });
    });

    const attendanceCards = renderModernSummaryCards([
      { label: 'Players', value: String(filteredData.length), note: periodLabel },
      { label: 'Practice Avg', value: fmtPct(avg(filteredData.map(p => p.PracticePct))), tone: 'info' },
      { label: 'Game Avg', value: fmtPct(avg(filteredData.map(p => p.GamePct))), tone: 'success' },
      { label: 'Overall Avg', value: fmtPct(avg(filteredData.map(p => p.OverallPct))), tone: 'brand' }
    ]);

    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC — Attendance Summary</strong>
        <span>${periodLabel}</span>
      </div>
      ${attendanceCards}
      <div class="rpt-hint">Click any player row to see their full event history →</div>
      <table class="report-table rpt-att-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Group</th>
            <th>Practice %</th>
            <th>Game %</th>
            <th>Overall %</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="report-footer-note">${filteredData.length}${filteredData.length !== data.length ? ` of ${data.length}` : ""} players</div>
    `;
  }

  // ── Player Detail View ─────────────────────────────────────────────────────
  function renderPlayerDetail(player, events) {
    if (!player) return '<div class="report-error">Player not found.</div>';

    const practices = events.filter(e => e.EventType === 'Practice');
    const games     = events.filter(e => e.EventType === 'Game');

    const pPct = calcPct(practices);
    const gPct = calcPct(games);
    const oAll = events.filter(e => e.EventType !== 'Team Event');
    const oPct = calcPct(oAll);

    const initials = `${player.FirstName?.[0] || ''}${player.LastName?.[0] || ''}`;

    const eventRows = events.map(e => {
      const status = e.AttendanceStatus || 'Not Marked';
      const dotClass = {
        'Present': 'dot-present', 'Absent': 'dot-absent',
        'Excused': 'dot-excused', 'Cancelled': 'dot-cancelled'
      }[status] || 'dot-none';
      const badgeClass = {
        'Present': 'badge-present', 'Absent': 'badge-absent',
        'Excused': 'badge-excused', 'Cancelled': 'badge-cancelled'
      }[status] || 'badge-none';

      return `
        <tr class="rpt-detail-event-row">
          <td>${fmtDate(e.EventDate)}</td>
          <td><span class="rpt-event-type-pill rpt-type-${(e.EventType||'').replace(' ','-').toLowerCase()}">${esc(e.EventType)}</span></td>
          <td>${esc(e.EventName || e.EventType)}</td>
          <td>${esc(e.LocationName || (e.EventType === 'Practice' ? 'Central Park' : '—'))}</td>
          <td><span class="rpt-status-dot ${dotClass}"></span><span class="rpt-status-badge ${badgeClass}">${status}</span></td>
        </tr>`;
    }).join('');

    const noEvents = !events.length
      ? '<div class="report-empty">No events found for this period.</div>'
      : '';

    return `
      <div class="rpt-detail-wrap">
        <button class="btn-detail-back" onclick="backToAttendanceList()">← Back to list</button>

        <div class="rpt-detail-header">
          <div class="rpt-detail-avatar">${esc(initials)}</div>
          <div class="rpt-detail-info">
            <div class="rpt-detail-name">${esc(player.FirstName)} ${esc(player.LastName)}</div>
            <div class="rpt-detail-sub">
              ${player.GroupName ? `${esc(player.GroupName)} · ` : ''}
              ${player.PlayerNumber ? `Jersey #${player.PlayerNumber} · ` : ''}
              ${esc(player.PaperworkStatus || '')}
            </div>
          </div>
          <div class="rpt-detail-print-actions">
            <button class="btn-report-print" onclick="printReport('attendance')">🖨 Print</button>
          </div>
        </div>

        <div class="rpt-detail-stats">
          <div class="rpt-detail-stat">
            <div class="rpt-detail-stat-val ${pctClass(pPct)}-text">${fmtPct(pPct)}</div>
            <div class="rpt-detail-stat-label">Practice</div>
            <div class="rpt-detail-stat-sub">${countPresent(practices)} of ${practices.length} events</div>
          </div>
          <div class="rpt-detail-stat">
            <div class="rpt-detail-stat-val ${pctClass(gPct)}-text">${fmtPct(gPct)}</div>
            <div class="rpt-detail-stat-label">Games</div>
            <div class="rpt-detail-stat-sub">${countPresent(games)} of ${games.length} events</div>
          </div>
          <div class="rpt-detail-stat">
            <div class="rpt-detail-stat-val ${pctClass(oPct)}-text">${fmtPct(oPct)}</div>
            <div class="rpt-detail-stat-label">Overall</div>
            <div class="rpt-detail-stat-sub">${countPresent(oAll)} of ${oAll.length} events</div>
          </div>
        </div>

        ${noEvents}
        ${events.length ? `
        <table class="report-table rpt-detail-table">
          <thead>
            <tr><th>Date</th><th>Type</th><th>Event</th><th>Location</th><th>Status</th></tr>
          </thead>
          <tbody>${eventRows}</tbody>
        </table>` : ''}

        <div class="report-footer-note">${events.length} event(s) in this period</div>
      </div>
    `;
  }

  // ── Other report renderers (unchanged) ────────────────────────────────────
  function renderPaperwork(data) {
    if (!data || !data.length) return '<div class="report-empty">All paperwork is complete. 🎉</div>';

    const paperworkMissing = data.filter(r => (r.PaperworkStatus || 'Not Received') !== 'Complete').length;
    const photoMissing = data.filter(r => (r.PhotoRelease || 'Missing') === 'Missing').length;
    const declined = data.filter(r => (r.PhotoRelease || '') === 'Declined').length;
    const summaryCards = renderModernSummaryCards([
      { label: 'Players With Missing Items', value: String(data.length), tone: 'attention' },
      { label: 'Paperwork Missing', value: String(paperworkMissing), tone: 'warning' },
      { label: 'Photo Release Missing', value: String(photoMissing), tone: 'warning' },
      { label: 'Photo Release Declined', value: String(declined), note: 'Form received', tone: 'info' }
    ]);

    return `
      <div class="report-print-header"><strong>Fontana Fire FC — Missing Paperwork & Photo Release</strong></div>
      ${summaryCards}
      <table class="report-table">
        <thead><tr><th>#</th><th>Player</th><th>Parent</th><th>Phone</th><th>Paperwork</th><th>Photo Release</th></tr></thead>
        <tbody>
          ${data.map((r, i) => `
            <tr>
              <td class="col-num">${i + 1}</td>
              <td>${esc(r.FirstName)} ${esc(r.LastName)}</td>
              <td>${esc(r.ParentName || '')}</td>
              <td>${esc(r.ParentPhone || '')}</td>
              <td><span class="status-badge ${r.PaperworkStatus === 'Complete' ? 'badge-ok' : 'badge-missing'}">${esc(r.PaperworkStatus || 'Missing')}</span></td>
              <td><span class="status-badge ${r.PhotoRelease === 'Missing' ? 'badge-missing' : 'badge-ok'}">${esc(r.PhotoRelease || 'Missing')}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="report-footer-note">${data.length} player(s) with missing items</div>`;
  }

  function renderSnacks(data) {
    if (!data || !data.length) return '<div class="report-empty">No snack data available.</div>';

    const bringSnack = data.filter(r => (r.SnackPreference || 'Bring Snack') === 'Bring Snack').length;
    const paidOut = data.filter(r => String(r.SnackPreference || '').toLowerCase().includes('paid')).length;
    const summaryCards = renderModernSummaryCards([
      { label: 'Players', value: String(data.length) },
      { label: 'Bring Snack', value: String(bringSnack), tone: 'success' },
      { label: 'Paid Out', value: String(paidOut), tone: 'info' }
    ]);

    return `
      <div class="report-print-header"><strong>Fontana Fire FC — Snack Rotation</strong></div>
      ${summaryCards}
      <table class="report-table">
        <thead><tr><th>#</th><th>Player</th><th>Parent</th><th>Phone</th><th>Snack Preference</th></tr></thead>
        <tbody>
          ${data.map((r, i) => `
            <tr>
              <td class="col-num">${i + 1}</td>
              <td>${esc(r.FirstName)} ${esc(r.LastName)}</td>
              <td>${esc(r.ParentName || '')}</td>
              <td>${esc(r.ParentPhone || '')}</td>
              <td>${esc(r.SnackPreference || '—')}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="report-footer-note">${data.length} players</div>`;
  }

  function renderEmergency(data) {
    if (!data || !data.length) return '<div class="report-empty">No emergency contact data.</div>';

    const missingEmergency = data.filter(r => !String(r.EmergencyContactName || '').trim() || !String(r.EmergencyContactPhone || '').trim()).length;
    const summaryCards = renderModernSummaryCards([
      { label: 'Active Players', value: String(data.length) },
      { label: 'Emergency Contact Complete', value: String(data.length - missingEmergency), tone: 'success' },
      { label: 'Missing Emergency Contact', value: String(missingEmergency), tone: missingEmergency ? 'attention' : 'success' }
    ]);

    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC — Emergency Contact Sheet</strong>
        <span class="report-print-confidential">CONFIDENTIAL</span>
      </div>
      ${summaryCards}
      <table class="report-table report-table--compact">
        <thead><tr><th>#</th><th>Player</th><th>Parent</th><th>Parent Phone</th><th>Emergency Contact</th><th>Relationship</th><th>EC Phone</th><th>Notes</th></tr></thead>
        <tbody>
          ${data.map((r, i) => `
            <tr>
              <td class="col-num">${i + 1}</td>
              <td>${esc(r.FirstName)} ${esc(r.LastName)}</td>
              <td>${esc(r.ParentName || '')}</td>
              <td>${esc(r.ParentPhone || '')}</td>
              <td>${esc(r.EmergencyContactName || '')}</td>
              <td>${esc(r.EmergencyContactRelationship || '')}</td>
              <td>${esc(r.EmergencyContactPhone || '')}</td>
              <td>${esc(r.EmergencyNotes || '')}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="report-footer-note">${data.length} players</div>`;
  }

  function renderRoster(data) {
    if (!data || !data.length) return '<div class="report-empty">No roster data.</div>';

    const selectedCoach = reportState.roster.coach || '';
    const filtered = data.filter(r => {
      const coach = (r.CoachName || 'Unassigned').trim() || 'Unassigned';
      return !selectedCoach || coach === selectedCoach;
    });

    if (!filtered.length) {
      return `<div class="report-empty">No active players found for ${esc(selectedCoach || 'this coach')}.</div>`;
    }

    const coachLabel = selectedCoach || 'All Coaches';
    const paperworkComplete = filtered.filter(r => r.PaperworkStatus === 'Complete').length;
    const unassigned = filtered.filter(r => (r.CoachName || 'Unassigned') === 'Unassigned').length;
    const summaryCards = renderModernSummaryCards([
      { label: 'Active Players', value: String(filtered.length) },
      { label: 'Paperwork Complete', value: String(paperworkComplete), tone: 'success' },
      { label: 'Missing Paperwork', value: String(filtered.length - paperworkComplete), tone: 'warning' },
      { label: 'Unassigned Coach', value: String(unassigned), tone: unassigned ? 'attention' : 'success' }
    ]);

    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC — Full Roster</strong>
        <span>${esc(coachLabel)} · As of ${new Date().toLocaleDateString()}</span>
      </div>
      ${summaryCards}
      <table class="report-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Jersey</th>
            <th>Player</th>
            <th>Group</th>
            <th>DOB</th>
            <th>Parent</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Coach</th>
            <th>Paperwork</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((r, i) => `
            <tr>
              <td class="col-num">${i + 1}</td>
              <td class="col-num">${r.PlayerNumber ?? '—'}</td>
              <td>${esc(r.FirstName)} ${esc(r.LastName)}</td>
              <td>${esc(r.GroupName || '')}</td>
              <td>${r.DateOfBirth ? fmtDate(r.DateOfBirth) : '—'}</td>
              <td>${esc(r.ParentName || '')}</td>
              <td>${esc(r.ParentPhone || '')}</td>
              <td>${esc(r.ParentEmail || '')}</td>
              <td>${esc(r.CoachName || 'Unassigned')}</td>
              <td><span class="status-badge ${r.PaperworkStatus === 'Complete' ? 'badge-ok' : 'badge-missing'}">${esc(r.PaperworkStatus || 'Missing')}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="report-footer-note">${filtered.length} active player${filtered.length === 1 ? '' : 's'} · ${esc(coachLabel)}</div>`;
  }

  // ── Print ──────────────────────────────────────────────────────────────────
  window.printReport = function (key) {
    // Hide all other accordions during print to avoid blank pages
    const styleId = 'rpt-print-style';
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = `@media print {
      .report-accordion:not(#accordion-${key}) { display: none !important; }
      .report-accordion-body { display: block !important; }
      .no-print, .report-toolbar, .btn-detail-back, .btn-report-print, .btn-report-excel { display: none !important; }
      .reports-wrap { padding: 0 !important; }
    }`;
    document.body.setAttribute('data-printing-report', key);
    window.print();
    setTimeout(() => {
      document.body.removeAttribute('data-printing-report');
      style.textContent = '';
    }, 1000);
  };

  window.downloadReportExcel = function (key) {
    const content = document.getElementById(`content-${key}`);
    if (!content) {
      alert('This report is not available yet.');
      return;
    }

    const table = content.querySelector('.report-table');
    if (!table) {
      alert('Open and load the report before exporting to Excel.');
      return;
    }

    const titleMap = {
      attendance: 'Attendance Summary',
      paperwork: 'Missing Paperwork and Photo Release',
      snacks: 'Snack Rotation',
      emergency: 'Emergency Contacts',
      roster: 'Full Roster',
      'paperwork-complete': 'Paperwork Complete',
      redflags: 'Player Follow-Up',
      gameday: 'Game Day Roster',
      groupstats: 'Monthly Attendance by Group'
    };

    const rows = Array.from(table.querySelectorAll('tr')).map(tr =>
      Array.from(tr.querySelectorAll('th,td'))
        .filter(cell => !cell.closest('.rpt-attention-detail-row'))
        .map(cell => String(cell.innerText || '').replace(/\s+/g, ' ').trim())
    );

    if (!rows.length) {
      alert('There is no report data to export.');
      return;
    }

    function xmlEscape(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    const worksheetRows = rows.map(row => {
      const cells = row.map(value => {
        const numeric = /^-?\d+(?:\.\d+)?$/.test(value);
        const type = numeric ? 'Number' : 'String';
        return `<Cell><Data ss:Type="${type}">${xmlEscape(value)}</Data></Cell>`;
      }).join('');
      return `<Row>${cells}</Row>`;
    }).join('');

    const reportTitle = titleMap[key] || 'Report';
    const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Report">
  <Table>${worksheetRows}</Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    const safeTitle = reportTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    link.href = url;
    link.download = `${safeTitle}-${stamp}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  function avg(vals) {
    const valid = vals.filter(v => v != null);
    if (!valid.length) return null;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  }

  function calcPct(events) {
    const counted = events.filter(e => e.AttendanceStatus && !['Cancelled','Excused'].includes(e.AttendanceStatus));
    const present = counted.filter(e => e.AttendanceStatus === 'Present');
    if (!counted.length) return null;
    return Math.round(100 * present.length / counted.length);
  }

  function countPresent(events) {
    return events.filter(e => e.AttendanceStatus === 'Present').length;
  }

  function pctClass(pct) {
    if (pct == null) return 'pct-grey';
    if (pct >= 90) return 'pct-green';
    if (pct >= 70) return 'pct-yellow';
    return 'pct-red';
  }

  function fmtPct(pct) {
    if (pct == null) return '—';
    return Math.round(pct) + '%';
  }

  function fmtDate(val) {
    if (!val) return '—';
    const s = String(val).substring(0, 10);
    const parts = s.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return s;
  }

  function fmtTime(val) {
    if (!val) return '';
    const s = String(val);
    // Extract HH:MM from ISO string or HH:MM:SS
    let hours, minutes;
    const isoMatch = s.match(/T(\d{2}):(\d{2})/);
    const plainMatch = s.match(/^(\d{1,2}):(\d{2})/);
    if (isoMatch) { hours = parseInt(isoMatch[1]); minutes = isoMatch[2]; }
    else if (plainMatch) { hours = parseInt(plainMatch[1]); minutes = plainMatch[2]; }
    else return s;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return h12 + ':' + minutes + ' ' + ampm;
  }

  function esc(str) {
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(str);
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }


  // ── Player Follow-Up Controls ─────────────────────────────────────────────
  function buildRedFlagControls() {
    const months = buildMonthOptions();
    return `
      <div class="att-filters">
        <div class="att-filter-group">
          <label class="report-filter-label">Month</label>
          <select id="rf-month" class="report-month-select" onchange="onRedFlagFilterChange()">${months}</select>
        </div>
        <div class="att-filter-group">
          <label class="report-filter-label">Coach</label>
          <select id="rf-coach" class="report-month-select" onchange="onRedFlagFilterChange()">
            <option value="">All Coaches</option>
            <option value="Jose">Jose</option>
            <option value="Alfredo">Alfredo</option>
            <option value="Bobby">Bobby</option>
            <option value="Damian">Damian</option>
            <option value="Unassigned">Unassigned</option>
          </select>
        </div>
        <div class="att-filter-group">
          <label class="report-filter-label">Status</label>
          <select id="rf-status" class="report-month-select" onchange="onRedFlagFilterChange()">
            <option value="">All Follow-Up</option>
            <option value="Priority">Priority</option>
            <option value="Follow Up">Follow Up</option>
            <option value="Watch">Watch</option>
          </select>
        </div>
      </div>`;
  }

  window.onRedFlagFilterChange = function() {
    reportState.redflags.loaded = false;
    loadReport('redflags');
  };

  // ── Game Day Controls ──────────────────────────────────────────────────────
  function buildGameDayControls() {
    return `
      <div class="att-filters">
        <div class="att-filter-group">
          <label class="report-filter-label">Select Game</label>
          <select id="gameday-select" class="report-month-select" onchange="onGameDaySelectChange()">
            <option value="">Loading games...</option>
          </select>
        </div>
      </div>`;
  }

  window.onGameDaySelectChange = function() {
    const sel = document.getElementById('gameday-select');
    reportState.gameday.gameId = sel ? sel.value : null;
    reportState.gameday.loaded = false;
    loadReport('gameday');
  };

  async function loadGameDayGames() {
    try {
      const res = await fetch(`${API_BASE}/events`, { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      const events = Array.isArray(data) ? data : (data.events || []);
      const games = events
        .filter(e => e.EventType === 'Game')
        .sort((a, b) => new Date(b.EventDate) - new Date(a.EventDate));
      const sel = document.getElementById('gameday-select');
      if (!sel) return;
      sel.innerHTML = '<option value="">Select a game...</option>' +
        games.map(g => `<option value="${g.EventID}">${fmtDate(g.EventDate)} - ${esc(g.EventName || 'Game')}</option>`).join('');
    } catch(e) { console.error('Could not load games for game day report', e); }
  }

  // Wire gameday accordion to load games list on open
  const _basToggle = window.toggleReportAccordion;
  window.toggleReportAccordion = function(key) {
    _basToggle(key);
    if (key === 'gameday') {
      const body = document.getElementById('body-gameday');
      if (body && body.style.display !== 'none') loadGameDayGames();
    }
  };

  // ── Group Stats Controls ───────────────────────────────────────────────────
  function buildGroupStatsControls() {
    const months = buildMonthOptions();
    return `
      <div class="att-filters">
        <div class="att-filter-group">
          <label class="report-filter-label">Month</label>
          <select id="gs-month" class="report-month-select" onchange="onGroupStatsFilterChange()">${months}</select>
        </div>
      </div>`;
  }

  window.onGroupStatsFilterChange = function() {
    reportState.groupstats.month = document.getElementById('gs-month')?.value || '';
    reportState.groupstats.loaded = false;
    loadReport('groupstats');
  };

  // ── Player Follow-Up Renderer ─────────────────────────────────────────────
  function renderRedFlags(data, month) {
    const coachFilter = document.getElementById('rf-coach')?.value || '';
    const statusFilter = document.getElementById('rf-status')?.value || '';

    const filtered = (data || []).filter(r => {
      const coach = (r.CoachName || 'Unassigned').trim() || 'Unassigned';
      const status = r.FollowUpStatus || 'Watch';
      return (!coachFilter || coach === coachFilter)
        && (!statusFilter || status === statusFilter);
    });

    const monthLabel = (() => {
      if (!month) return 'Current Month';
      const parts = String(month).split('-');
      if (parts.length !== 2) return month;
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      return d.toLocaleString('default', { month: 'long', year: 'numeric' });
    })();

    if (!filtered.length) {
      return '<div class="report-empty">No players currently need follow-up for these filters.</div>';
    }

    const priority = filtered.filter(r => r.FollowUpStatus === 'Priority').length;
    const followUp = filtered.filter(r => r.FollowUpStatus === 'Follow Up').length;
    const watch = filtered.filter(r => r.FollowUpStatus === 'Watch').length;
    const neverSeen = filtered.filter(r => !r.LastSeen).length;

    const summaryCards = renderModernSummaryCards([
      { label: 'Need Follow-Up', value: String(filtered.length), tone: 'attention' },
      { label: 'Priority', value: String(priority), note: '30+ days or never seen', tone: 'attention' },
      { label: 'Follow Up', value: String(followUp), note: '14–29 days away', tone: 'warning' },
      { label: 'Watch', value: String(watch), note: 'Below 70% but seen recently', tone: 'info' }
    ]);

    const buckets = [
      { label: 'Seen < 7 days', count: filtered.filter(r => r.DaysAway != null && r.DaysAway < 7).length, tone: 'good' },
      { label: '7–13 days', count: filtered.filter(r => r.DaysAway != null && r.DaysAway >= 7 && r.DaysAway < 14).length, tone: 'info' },
      { label: '14–29 days', count: filtered.filter(r => r.DaysAway != null && r.DaysAway >= 14 && r.DaysAway < 30).length, tone: 'warning' },
      { label: '30+ days', count: filtered.filter(r => r.DaysAway != null && r.DaysAway >= 30).length, tone: 'danger' },
      { label: 'Never attended', count: neverSeen, tone: 'danger' }
    ];
    const maxBucket = Math.max(1, ...buckets.map(b => b.count));

    const recencyChart = buckets.map(b => `
      <div class="rpt-followup-bar-row">
        <span>${b.label}</span>
        <div class="rpt-followup-bar-track">
          <div class="rpt-followup-bar rpt-followup-bar--${b.tone}" style="width:${Math.round((b.count / maxBucket) * 100)}%"></div>
        </div>
        <strong>${b.count}</strong>
      </div>`).join('');

    const statusRank = { 'Priority': 1, 'Follow Up': 2, 'Watch': 3, 'OK': 4 };
    filtered.sort((a, b) => {
      const sr = (statusRank[a.FollowUpStatus] || 9) - (statusRank[b.FollowUpStatus] || 9);
      if (sr !== 0) return sr;
      const ad = a.DaysAway == null ? 9999 : Number(a.DaysAway);
      const bd = b.DaysAway == null ? 9999 : Number(b.DaysAway);
      return bd - ad;
    });

    const rows = filtered.map((r, i) => {
      const status = r.FollowUpStatus || 'Watch';
      const statusClass = status === 'Priority'
        ? 'rpt-followup-status--priority'
        : status === 'Follow Up'
          ? 'rpt-followup-status--follow'
          : 'rpt-followup-status--watch';

      const pct = r.OverallPct ?? r.PracticePct;
      const daysText = r.LastSeen
        ? `${Number(r.DaysAway || 0)} day${Number(r.DaysAway || 0) === 1 ? '' : 's'}`
        : 'Never';

      return `
        <tr class="rpt-followup-row">
          <td class="col-num">${i + 1}</td>
          <td>
            <span class="rpt-player-name">${esc(r.FirstName)} ${esc(r.LastName)}</span>
            ${r.PlayerNumber ? `<span class="rpt-jersey">#${r.PlayerNumber}</span>` : ''}
          </td>
          <td>${esc(r.CoachName || 'Unassigned')}</td>
          <td class="rpt-cell-sub">${esc(r.GroupName || String(r.BirthYear || ''))}</td>
          <td>${r.LastSeen ? fmtDate(r.LastSeen) : '<span class="rpt-never-seen">Never</span>'}</td>
          <td>${esc(daysText)}</td>
          <td><span class="pct-badge ${pctClass(pct)}">${fmtPct(pct)}</span></td>
          <td>
            <div class="rpt-parent-stack">
              <span>${esc(r.ParentName || '—')}</span>
              <small>${esc(r.ParentPhone || '')}</small>
            </div>
          </td>
          <td><span class="rpt-followup-status ${statusClass}">${esc(status)}</span></td>
          <td>
            <button type="button"
              class="rpt-followup-action"
              onclick="drillDownPlayer(${Number(r.PlayerID)}, '${esc((r.FirstName || '') + ' ' + (r.LastName || '')).replace(/'/g,"\\'")}')">
              View Attendance
            </button>
          </td>
        </tr>`;
    }).join('');

    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC — Player Follow-Up</strong>
        <span>${esc(monthLabel)}</span>
      </div>

      <div class="rpt-followup-intro">
        <div>
          <span class="reports-modern-kicker">COACH ACTION LIST</span>
          <h3>Player Follow-Up</h3>
          <p>Players who may need attention based on attendance level or time since they were last present.</p>
        </div>
      </div>

      ${summaryCards}

      <div class="rpt-followup-chart-card">
        <div class="rpt-modern-section-heading">
          <div>
            <h4>Time Since Last Attendance</h4>
            <p>Recency helps distinguish a low monthly percentage from a player who may be disengaging.</p>
          </div>
        </div>
        <div class="rpt-followup-bars">${recencyChart}</div>
      </div>

      <div class="rpt-followup-key">
        <span><b class="rpt-followup-dot rpt-followup-dot--priority"></b><strong>Priority</strong> — never seen or 30+ days away</span>
        <span><b class="rpt-followup-dot rpt-followup-dot--follow"></b><strong>Follow Up</strong> — 14–29 days away</span>
        <span><b class="rpt-followup-dot rpt-followup-dot--watch"></b><strong>Watch</strong> — below 70% but attended recently</span>
      </div>

      <div class="rpt-modern-table-wrap">
        <table class="report-table rpt-followup-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Coach</th>
              <th>Group</th>
              <th>Last Seen</th>
              <th>Days Away</th>
              <th>${esc(monthLabel)} Attendance</th>
              <th>Parent</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <div class="report-footer-note">${filtered.length} player${filtered.length === 1 ? '' : 's'} currently need follow-up</div>`;
  }

  // ── Game Day Roster Renderer ───────────────────────────────────────────────
  function fmtGender(g) {
    if (!g) return '--';
    const s = String(g).trim().toLowerCase();
    if (s === 'm' || s === 'male') return 'Boy';
    if (s === 'f' || s === 'female') return 'Girl';
    return g;
  }

  function renderGameDay(event, players, attendanceMap) {
    if (!event || !event.EventDate) return '<div class="report-empty">No game data available.</div>';
    if (!players.length) return `
      <div class="report-print-header"><strong>${esc(event.EventName || 'Game')} - ${fmtDate(event.EventDate)}</strong></div>
      <div class="report-empty">No players rostered for this game. Use Edit Roster to add players.</div>`;
    const attMap = attendanceMap || {};
    const statuses = players.map(p => attMap[p.PlayerID] || p.AttendanceStatus || 'Not Marked');
    const presentCount = statuses.filter(s => s === 'Present').length;
    const absentCount = statuses.filter(s => s === 'Absent').length;
    const notMarkedCount = statuses.filter(s => s === 'Not Marked').length;
    const summaryCards = renderModernSummaryCards([
      { label: 'Rostered', value: String(players.length) },
      { label: 'Present', value: String(presentCount), tone: 'success' },
      { label: 'Absent', value: String(absentCount), tone: 'attention' },
      { label: 'Not Marked', value: String(notMarkedCount), tone: notMarkedCount ? 'warning' : 'success' }
    ]);

    const rows = players.map(p => {
      const status = attMap[p.PlayerID] || p.AttendanceStatus || 'Not Marked';
      const badgeClass = { 'Present': 'badge-present', 'Absent': 'badge-absent', 'Excused': 'badge-excused', 'Cancelled': 'badge-cancelled' }[status] || '';
      const statusHtml = badgeClass
        ? `<span class="rpt-status-badge ${badgeClass}">${status}</span>`
        : `<span style="color:#aaa;">Not Marked</span>`;
      return `
        <tr>
          <td class="col-num">${p.PlayerNumber ?? '--'}</td>
          <td style="font-weight:600;">${esc(p.FirstName)} ${esc(p.LastName)}</td>
          <td class="rpt-cell-sub">${esc(p.GroupName || String(p.BirthYear || ''))}</td>
          <td>${fmtGender(p.Gender)}</td>
          <td>${statusHtml}</td>
        </tr>`;
    }).join('');
    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC - Game Day Roster</strong>
        <span>${esc(event.EventName || 'Game')} - ${fmtDate(event.EventDate)}</span>
      </div>
      ${event.LocationName ? `<div style="font-size:12px;color:#666;margin-bottom:10px;">Location: ${esc(event.LocationName)}</div>` : ''}
      ${event.StartTime ? `<div style="font-size:12px;color:#666;margin-bottom:14px;">Time: ${fmtTime(event.StartTime)}</div>` : ''}
      ${summaryCards}
      <table class="report-table">
        <thead><tr><th>Jersey</th><th>Player</th><th>Group</th><th>Gender</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="report-footer-note">${players.length} rostered player(s)</div>`;
  }

  // ── Monthly Attendance by Group Renderer ─────────────────────────────────
  function renderGroupStats(data, month) {
    if (!data || !data.length) return '<div class="report-empty">No data for this period.</div>';

    const sel = document.getElementById('gs-month');
    const periodLabel = sel?.selectedOptions[0]?.text || month || 'All Time';

    const groups = {};
    data.forEach(r => {
      const gkey = String(r.BirthYear || r.GroupName || 'No Group Assigned');
      if (!groups[gkey]) groups[gkey] = [];
      groups[gkey].push(r);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const an = Number(a), bn = Number(b);
      if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
      return String(a).localeCompare(String(b));
    });

    const clubPractice = avg(data.map(p => p.PracticePct));
    const clubGame = avg(data.map(p => p.GamePct));
    const clubOverall = avg(data.map(p => p.OverallPct));
    const needingAttention = data.filter(p => {
      const pct = p.OverallPct ?? p.PracticePct;
      return pct != null && pct < 70;
    });

    const groupStats = sortedKeys.map(groupKey => {
      const players = groups[groupKey];
      const avgP = avg(players.map(p => p.PracticePct));
      const avgG = avg(players.map(p => p.GamePct));
      const avgO = avg(players.map(p => p.OverallPct));
      const flaggedPlayers = players.filter(p => {
        const pct = p.OverallPct ?? p.PracticePct;
        return pct != null && pct < 70;
      }).sort((a, b) => {
        const ap = a.OverallPct ?? a.PracticePct ?? 999;
        const bp = b.OverallPct ?? b.PracticePct ?? 999;
        return ap - bp;
      });
      return { groupKey, players, avgP, avgG, avgO, flaggedPlayers };
    });

    const chartRows = groupStats.map(g => {
      const pct = g.avgO == null ? 0 : Math.max(0, Math.min(100, Number(g.avgO)));
      const goalClass = pct >= 70 ? 'rpt-modern-bar--goal' : 'rpt-modern-bar--attention';
      return `
        <div class="rpt-modern-bar-row">
          <div class="rpt-modern-bar-label">${esc(g.groupKey)}</div>
          <div class="rpt-modern-bar-track">
            <div class="rpt-modern-bar-fill ${goalClass}" style="width:${pct}%"></div>
            <span class="rpt-modern-goal-line" aria-hidden="true"></span>
          </div>
          <div class="rpt-modern-bar-value">${fmtPct(g.avgO)}</div>
        </div>`;
    }).join('');

    const tableRows = groupStats.map(g => {
      const count = g.flaggedPlayers.length;
      const detailId = `gs-attention-${g.groupKey.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
      const flagged = count
        ? `<button type="button" class="rpt-attention-link" onclick="toggleGroupAttention('${detailId}', this)" aria-expanded="false">${count} player${count === 1 ? '' : 's'}</button>`
        : '<span class="rpt-none-label">None</span>';

      const detail = count ? `
        <tr id="${detailId}" class="rpt-attention-detail-row" style="display:none;">
          <td colspan="6">
            <div class="rpt-attention-panel">
              <div class="rpt-attention-panel-heading">
                <div>
                  <strong>${esc(g.groupKey)} · Players Needing Attention</strong>
                  <span>Below 70% overall attendance for ${esc(periodLabel)}</span>
                </div>
                <span class="rpt-attention-count">${count}</span>
              </div>
              <div class="rpt-attention-player-grid">
                ${g.flaggedPlayers.map(p => {
                  const pct = p.OverallPct ?? p.PracticePct;
                  const name = `${p.FirstName || ''} ${p.LastName || ''}`.trim();
                  return `
                    <button type="button" class="rpt-attention-player" onclick="openGroupStatsPlayer(${Number(p.PlayerID)}, '${esc(name).replace(/'/g, "\\'")}')">
                      <span><strong>${esc(name)}</strong>${p.PlayerNumber ? `<small>#${esc(p.PlayerNumber)}</small>` : ''}</span>
                      <span class="pct-badge ${pctClass(pct)}">${fmtPct(pct)}</span>
                    </button>`;
                }).join('')}
              </div>
            </div>
          </td>
        </tr>` : '';

      return `
        <tr>
          <td class="rpt-modern-group-name">${esc(g.groupKey)}</td>
          <td class="col-num">${g.players.length}</td>
          <td><span class="pct-badge ${pctClass(g.avgP)}">${fmtPct(g.avgP)}</span></td>
          <td><span class="pct-badge ${pctClass(g.avgG)}">${fmtPct(g.avgG)}</span></td>
          <td><span class="pct-badge ${pctClass(g.avgO)}">${fmtPct(g.avgO)}</span></td>
          <td>${flagged}</td>
        </tr>${detail}`;
    }).join('');

    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC — Monthly Attendance by Group</strong>
        <span>${esc(periodLabel)}</span>
      </div>

      <div class="rpt-modern-report">
        <div class="rpt-modern-report-heading">
          <div>
            <div class="rpt-modern-eyebrow">COACHING OVERVIEW</div>
            <h3>Monthly Attendance by Group</h3>
            <p>${esc(periodLabel)} · Compare attendance across birth-year groups and quickly identify players who may need follow-up.</p>
          </div>
          <span class="rpt-modern-goal-chip">Goal 70%+</span>
        </div>

        <div class="rpt-modern-stats">
          <div class="rpt-modern-stat"><span>Active Players</span><strong>${data.length}</strong><small>${sortedKeys.length} birth-year groups</small></div>
          <div class="rpt-modern-stat"><span>Practice Average</span><strong class="${pctClass(clubPractice)}-text">${fmtPct(clubPractice)}</strong><small>Club average</small></div>
          <div class="rpt-modern-stat"><span>Game Average</span><strong class="${pctClass(clubGame)}-text">${fmtPct(clubGame)}</strong><small>Rostered games</small></div>
          <div class="rpt-modern-stat rpt-modern-stat--attention"><span>Need Attention</span><strong>${needingAttention.length}</strong><small>Players below 70%</small></div>
        </div>

        <div class="rpt-modern-chart-card">
          <div class="rpt-modern-section-heading">
            <div><h4>Overall Attendance by Birth Year</h4><p>Each bar shows the group's average overall attendance.</p></div>
            <div class="rpt-modern-chart-legend">
              <span><i class="rpt-legend-dot rpt-legend-dot--goal"></i>70% or higher</span>
              <span><i class="rpt-legend-dot rpt-legend-dot--attention"></i>Below 70%</span>
            </div>
          </div>
          <div class="rpt-modern-bars">${chartRows}</div>
        </div>

        <div class="rpt-modern-table-heading">
          <div><h4>Group Detail</h4><p>Click a player count to see who is below the attendance goal.</p></div>
        </div>

        <div class="rpt-modern-table-wrap">
          <table class="report-table rpt-modern-table">
            <thead>
              <tr><th>Birth Year</th><th>Players</th><th>Practice Avg</th><th>Game Avg</th><th>Overall Avg</th><th>Players Needing Attention</th></tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>

        <div class="report-footer-note">${sortedKeys.length} birth-year groups · ${data.length} active players</div>
      </div>`;
  }

  window.toggleGroupAttention = function(detailId, button) {
    const row = document.getElementById(detailId);
    if (!row) return;
    const isOpen = row.style.display !== 'none';
    row.style.display = isOpen ? 'none' : 'table-row';
    if (button) {
      button.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      button.classList.toggle('is-open', !isOpen);
    }
  };

  window.openGroupStatsPlayer = function(playerId, playerName) {
    const attendanceAccordion = document.getElementById('accordion-attendance');
    const attendanceBody = document.getElementById('body-attendance');
    if (attendanceAccordion && attendanceBody) {
      attendanceBody.style.display = 'block';
      attendanceAccordion.classList.add('report-accordion--open');
      const chevron = attendanceAccordion.querySelector('.report-accordion-chevron');
      if (chevron) chevron.textContent = '▲';
    }
    loadPlayerDetail(playerId, playerName);
    setTimeout(() => document.getElementById('accordion-attendance')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };


  // ── Paperwork Complete Renderer ───────────────────────────────────────────
  function renderPaperworkComplete(data) {
    if (!data || !data.length) return '<div class="report-empty">No players with complete paperwork found.</div>';

    const groupsCount = new Set(data.map(r => r.GroupName || 'No Group Assigned')).size;
    const declinedCount = data.filter(r => (r.PhotoReleaseStatus || '') === 'Declined').length;
    const summaryCards = renderModernSummaryCards([
      { label: 'Complete Players', value: String(data.length), tone: 'success' },
      { label: 'Groups', value: String(groupsCount), tone: 'info' },
      { label: 'Photo Release Declined', value: String(declinedCount), note: 'Form received', tone: 'info' }
    ]);

    // Group by GroupName
    const groups = {};
    data.forEach(r => {
      const gkey = r.GroupName || 'No Group Assigned';
      if (!groups[gkey]) groups[gkey] = [];
      groups[gkey].push(r);
    });

    let rows = '';
    let num = 0;
    Object.keys(groups).sort().forEach(groupKey => {
      const players = groups[groupKey];
      rows += `
        <tr class="rpt-group-row">
          <td colspan="6">
            <span class="rpt-group-name">${esc(groupKey)}</span>
            <span class="rpt-group-count">${players.length} players</span>
          </td>
        </tr>`;
      players.forEach(r => {
        num++;
        rows += `
          <tr>
            <td class="col-num">${num}</td>
            <td style="font-weight:600;">${esc(r.FirstName)} ${esc(r.LastName)}</td>
            <td class="col-num">${r.PlayerNumber ?? '--'}</td>
            <td class="rpt-cell-sub">${esc(r.GroupName || '')}</td>
            <td><span class="status-badge badge-ok">Complete</span></td>
            <td><span class="status-badge badge-ok">${esc(r.PhotoReleaseStatus || 'Yes')}</span></td>
          </tr>`;
      });
    });

    return `
      <div class="report-print-header"><strong>Fontana Fire FC - Paperwork Complete</strong></div>
      ${summaryCards}
      <table class="report-table">
        <thead><tr><th>#</th><th>Player</th><th>Jersey</th><th>Group</th><th>Paperwork</th><th>Photo Release</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="report-footer-note">${data.length} player(s) with complete paperwork</div>`;
  }

  // ── Coach Comments print fix ───────────────────────────────────────────────
  const _basePrint = window.printReport;
  window.printReport = function(key) {
    document.querySelectorAll('.coach-comment-textarea').forEach(ta => {
      const box = ta.closest('.coach-comments-box');
      if (!box) return;
      const printDiv = box.nextElementSibling;
      if (printDiv && printDiv.classList.contains('coach-comments-print')) {
        const textEl = printDiv.querySelector('.coach-comments-text');
        if (textEl) textEl.textContent = ta.value;
        printDiv.style.display = ta.value.trim() ? 'block' : 'none';
      }
    });
    _basePrint(key);
  };

})();