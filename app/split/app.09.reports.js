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
      group: '', gender: '', below: '',
      viewingPlayer: null   // { playerId, playerName } when in detail view
    },
    paperwork:  { loaded: false, data: null },
    snacks:     { loaded: false, data: null },
    emergency:  { loaded: false, data: null },
    roster:     { loaded: false, data: null },
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
      const res = await fetch(`${API_BASE}/groups`, { credentials: 'include' });
      const data = await res.json();
      groupsCache = Array.isArray(data) ? data : (data.groups || []);
    } catch (_) { groupsCache = []; }
    return groupsCache;
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  window.initReportsTab = function () {
    const container = document.getElementById('reportsContainer');
    if (!container) return;
    container.innerHTML = buildReportsShell();
    wireAttendanceControls();
  };

  // ── Shell ──────────────────────────────────────────────────────────────────
  function buildReportsShell() {
    return `
      <div class="reports-wrap">
        ${buildAccordion('attendance', '📊 Attendance Summary', buildAttendanceControls())}
        ${buildAccordion('paperwork',  '📋 Missing Paperwork & Photo Release')}
        ${buildAccordion('snacks',     '🍎 Snack Rotation')}
        ${buildAccordion('emergency',  '🚨 Emergency Contacts')}
        ${buildAccordion('roster',     '👥 Full Roster')}
        ${buildAccordion('paperwork-complete', '✅ Paperwork Complete')}
        ${buildAccordion('redflags',   '🔴 Attendance Red Flags', buildRedFlagControls())}
        ${buildAccordion('gameday',    '⚽ Game Day Roster', buildGameDayControls())}
        ${buildAccordion('groupstats', '📈 Monthly Group Breakdown', buildGroupStatsControls())}
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
  }

  window.onAttFilterChange = function () {
    const st = reportState.attendance;
    st.month  = document.getElementById('att-month')?.value  || '';
    st.group  = document.getElementById('att-group')?.value  || '';
    st.gender = document.getElementById('att-gender')?.value || '';
    st.below  = document.getElementById('att-below')?.value  || '';
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
        const month = document.getElementById('rf-month')?.value || '';
        const below = document.getElementById('rf-below')?.value || '70';
        const params = new URLSearchParams();
        if (month) params.set('month', month);
        params.set('below', below);
        const res = await fetch(`${API_BASE}/reports/attendance?${params}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        st.data = json.data || [];
        st.loaded = true;
        el.innerHTML = renderRedFlags(st.data, below);
        return;
      }

      if (key === 'gameday') {
        const gameId = st.gameId;
        if (!gameId) { el.innerHTML = '<div class="report-empty">Select a game above to view the roster.</div>'; return; }
        const [detRes, rosterRes, attRes] = await Promise.all([
          fetch(`${API_BASE}/events/${gameId}/details`, { credentials: 'include' }),
          fetch(`${API_BASE}/events/${gameId}/roster`, { credentials: 'include' }),
          fetch(`${API_BASE}/reports/game-attendance/${gameId}`, { credentials: 'include' })
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
        const res = await fetch(`${API_BASE}/reports/attendance?${params}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        st.data = json.data || [];
        st.loaded = true;
        el.innerHTML = renderGroupStats(st.data, month);
        return;
      }
      if (key === 'paperwork-complete') {
        const res = await fetch(`${API_BASE}/reports/paperwork-complete`, { credentials: 'include' });
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

      const res = await fetch(url, { credentials: 'include' });
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

      const res = await fetch(url, { credentials: 'include' });
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

  // ── Attendance Summary (list view) ─────────────────────────────────────────
  function renderAttendance(data) {
    if (!data || !data.length) return '<div class="report-empty">No attendance data for this period.</div>';

    const st = reportState.attendance;
    let periodLabel = '';
    if (st.from && st.to) periodLabel = `${fmtDate(st.from)} – ${fmtDate(st.to)}`;
    else if (st.month) {
      const sel = document.getElementById('att-month');
      periodLabel = sel?.selectedOptions[0]?.text || st.month;
    } else { periodLabel = 'All Time'; }

    // Group by BirthYear
    const groups = {};
    data.forEach(r => {
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

    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC — Attendance Summary</strong>
        <span>${periodLabel}</span>
      </div>
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
      <div class="report-footer-note">${data.length} players</div>
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
          <td>${esc(e.LocationName || '—')}</td>
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
    return `
      <div class="report-print-header"><strong>Fontana Fire FC — Missing Paperwork & Photo Release</strong></div>
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
              <td><span class="status-badge ${r.PhotoRelease === 'Received' ? 'badge-ok' : 'badge-missing'}">${esc(r.PhotoRelease || 'Missing')}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="report-footer-note">${data.length} player(s) with missing items</div>`;
  }

  function renderSnacks(data) {
    if (!data || !data.length) return '<div class="report-empty">No snack data available.</div>';
    return `
      <div class="report-print-header"><strong>Fontana Fire FC — Snack Rotation</strong></div>
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
    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC — Emergency Contact Sheet</strong>
        <span class="report-print-confidential">CONFIDENTIAL</span>
      </div>
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
    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC — Full Roster</strong>
        <span>As of ${new Date().toLocaleDateString()}</span>
      </div>
      <table class="report-table">
        <thead><tr><th>#</th><th>Jersey</th><th>Player</th><th>Group</th><th>DOB</th><th>Parent</th><th>Phone</th><th>Coach</th><th>Paperwork</th></tr></thead>
        <tbody>
          ${data.map((r, i) => `
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
      <div class="report-footer-note">${data.length} active players</div>`;
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
    const fnName = `downloadReport_${key}`;
    if (typeof window[fnName] === 'function') window[fnName]();
    else alert('Excel export for this report is not yet available.');
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

  function esc(str) {
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(str);
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }


  // ── Red Flag Controls ──────────────────────────────────────────────────────
  function buildRedFlagControls() {
    const months = buildMonthOptions();
    return `
      <div class="att-filters">
        <div class="att-filter-group">
          <label class="report-filter-label">Month</label>
          <select id="rf-month" class="report-month-select" onchange="onRedFlagFilterChange()">${months}</select>
        </div>
        <div class="att-filter-group">
          <label class="report-filter-label">Threshold</label>
          <select id="rf-below" class="report-month-select" onchange="onRedFlagFilterChange()">
            <option value="70">Below 70%</option>
            <option value="80">Below 80%</option>
            <option value="60">Below 60%</option>
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
      const res = await fetch(`${API_BASE}/events`, { credentials: 'include' });
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

  // ── Red Flags Renderer ─────────────────────────────────────────────────────
  function renderRedFlags(data, below) {
    below = below || '70';
    if (!data || !data.length) return `<div class="report-empty">No players below ${below}% this period.</div>`;
    const rows = data.map((r, i) => {
      const pct = r.OverallPct ?? r.PracticePct;
      return `
        <tr class="rpt-player-row" onclick="drillDownPlayer(${r.PlayerID}, '${esc(r.FirstName + ' ' + r.LastName).replace(/'/g,"\\'")}')">
          <td class="col-num">${i+1}</td>
          <td><span class="rpt-player-name">${esc(r.FirstName)} ${esc(r.LastName)}</span>${r.PlayerNumber ? ` <span class="rpt-jersey">#${r.PlayerNumber}</span>` : ''}</td>
          <td class="rpt-cell-sub">${esc(r.GroupName || String(r.BirthYear || ''))}</td>
          <td><span class="pct-badge ${pctClass(r.PracticePct)}">${fmtPct(r.PracticePct)}</span> <span class="rpt-fraction">${r.PracticePresent??0}/${r.PracticeCounted??0}</span></td>
          <td><span class="pct-badge ${pctClass(r.GamePct)}">${fmtPct(r.GamePct)}</span> <span class="rpt-fraction">${r.GamePresent??0}/${r.GameCounted??0}</span></td>
          <td><span class="pct-badge ${pctClass(pct)}" style="font-weight:800;">${fmtPct(pct)}</span></td>
        </tr>`;
    }).join('');
    return `
      <div class="report-print-header"><strong>Fontana Fire FC - Attendance Red Flags (Below ${below}%)</strong></div>
      <div class="rpt-hint">Click a player to see their full event history</div>
      <table class="report-table">
        <thead><tr><th>#</th><th>Player</th><th>Group</th><th>Practice %</th><th>Game %</th><th>Overall %</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="report-footer-note">${data.length} player(s) flagged</div>`;
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
      ${event.StartTime ? `<div style="font-size:12px;color:#666;margin-bottom:14px;">Time: ${event.StartTime}</div>` : ''}
      <table class="report-table">
        <thead><tr><th>Jersey</th><th>Player</th><th>Group</th><th>Gender</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="report-footer-note">${players.length} rostered player(s)</div>`;
  }

  // ── Monthly Group Breakdown Renderer ──────────────────────────────────────
  function renderGroupStats(data, month) {
    if (!data || !data.length) return '<div class="report-empty">No data for this period.</div>';
    const sel = document.getElementById('gs-month');
    const periodLabel = sel?.selectedOptions[0]?.text || month || 'All Time';
    const groups = {};
    data.forEach(r => {
      const gkey = r.GroupName || String(r.BirthYear || 'No Group Assigned');
      if (!groups[gkey]) groups[gkey] = [];
      groups[gkey].push(r);
    });
    const rows = Object.keys(groups).sort().map(groupKey => {
      const players = groups[groupKey];
      const avgP = avg(players.map(p => p.PracticePct));
      const avgG = avg(players.map(p => p.GamePct));
      const avgO = avg(players.map(p => p.OverallPct));
      const flagged = players.filter(p => (p.OverallPct ?? p.PracticePct) != null && (p.OverallPct ?? p.PracticePct) < 70).length;
      return `
        <tr>
          <td style="font-weight:700;">${esc(groupKey)}</td>
          <td class="col-num">${players.length}</td>
          <td><span class="pct-badge ${pctClass(avgP)}">${fmtPct(avgP)}</span></td>
          <td><span class="pct-badge ${pctClass(avgG)}">${fmtPct(avgG)}</span></td>
          <td><span class="pct-badge ${pctClass(avgO)}">${fmtPct(avgO)}</span></td>
          <td>${flagged > 0 ? `<span style="color:#dc2626;font-weight:700;">!! ${flagged}</span>` : '<span style="color:#16a34a;">None</span>'}</td>
        </tr>`;
    }).join('');
    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC - Monthly Group Breakdown</strong>
        <span>${periodLabel}</span>
      </div>
      <table class="report-table">
        <thead><tr><th>Group</th><th>Players</th><th>Avg Practice %</th><th>Avg Game %</th><th>Avg Overall %</th><th>Below 70%</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="report-footer-note">${Object.keys(groups).length} group(s) - ${data.length} total players</div>`;
  }


  // ── Paperwork Complete Renderer ───────────────────────────────────────────
  function renderPaperworkComplete(data) {
    if (!data || !data.length) return '<div class="report-empty">No players with complete paperwork found.</div>';

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