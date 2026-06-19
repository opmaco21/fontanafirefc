// app.09.reports.js — Reports Tab
// Accordion sections: each loads data on expand, renders inline, Print + Excel download

(function () {

  // ── State ──────────────────────────────────────────────────────────────────
  const reportState = {
    attendance: { loaded: false, data: null, month: getCurrentMonthValue() },
    paperwork:  { loaded: false, data: null },
    snacks:     { loaded: false, data: null },
    emergency:  { loaded: false, data: null },
    roster:     { loaded: false, data: null },
  };

  function getCurrentMonthValue() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  window.initReportsTab = function () {
    const container = document.getElementById('reportsContainer');
    if (!container) return;
    container.innerHTML = buildReportsShell();
    // Wire month select
    const sel = document.getElementById('attendance-month-select');
    if (sel) sel.addEventListener('change', () => onAttendanceMonthChange(sel.value));
  };

  // ── Shell HTML ─────────────────────────────────────────────────────────────
  function buildReportsShell() {
    return `
      <div class="reports-wrap">
        ${buildAccordion('attendance', '📊 Attendance Summary', buildAttendanceControls())}
        ${buildAccordion('paperwork',  '📋 Missing Paperwork & Photo Release')}
        ${buildAccordion('snacks',     '🍎 Snack Rotation')}
        ${buildAccordion('emergency',  '🚨 Emergency Contacts')}
        ${buildAccordion('roster',     '👥 Full Roster')}
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
          <div class="report-toolbar">
            ${controlsHtml}
            <div class="report-toolbar-actions">
              <button class="btn-report-print" onclick="printReport('${key}')" title="Print this report">🖨 Print</button>
              <button class="btn-report-excel" onclick="downloadReportExcel('${key}')" title="Download as Excel">⬇ Excel</button>
            </div>
          </div>
          <div class="report-content" id="content-${key}">
            <div class="report-loading">Loading…</div>
          </div>
        </div>
      </div>
    `;
  }

  function buildAttendanceControls() {
    return `
      <div class="report-filter-row">
        <label class="report-filter-label">Month</label>
        <select id="attendance-month-select" class="report-month-select">
          ${buildMonthOptions()}
        </select>
      </div>
    `;
  }

  function buildMonthOptions() {
    const now = new Date();
    let html = '';
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      html += `<option value="${val}" ${i === 0 ? 'selected' : ''}>${label}</option>`;
    }
    return html;
  }

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
      if (!reportState[key].loaded) {
        loadReport(key);
      }
    }
  };

  window.onAttendanceMonthChange = function (val) {
    reportState.attendance.month = val;
    reportState.attendance.loaded = false;
    loadReport('attendance');
  };

  // ── Data loading ───────────────────────────────────────────────────────────
  async function loadReport(key) {
    const el = document.getElementById(`content-${key}`);
    if (!el) return;
    el.innerHTML = '<div class="report-loading">Loading…</div>';

    try {
      // API_BASE already ends with /api — so path is /reports/key
      let url = `${API_BASE}/reports/${key}`;
      if (key === 'attendance') {
        url += `?month=${reportState.attendance.month}`;
      }

      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json.data || json;

      reportState[key].data = data;
      reportState[key].loaded = true;

      el.innerHTML = renderReport(key, data);
    } catch (err) {
      el.innerHTML = `<div class="report-error">Failed to load report. ${err.message}</div>`;
    }
  }

  // ── Renderers ──────────────────────────────────────────────────────────────
  function renderReport(key, data) {
    switch (key) {
      case 'attendance': return renderAttendance(data);
      case 'paperwork':  return renderPaperwork(data);
      case 'snacks':     return renderSnacks(data);
      case 'emergency':  return renderEmergency(data);
      case 'roster':     return renderRoster(data);
      default: return '<p>Unknown report.</p>';
    }
  }

  function renderAttendance(data) {
    if (!data || !data.length) return '<div class="report-empty">No attendance data for this month.</div>';
    const monthLabel = document.getElementById('attendance-month-select')?.selectedOptions[0]?.text || '';
    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC — Attendance Summary</strong>
        <span>${monthLabel}</span>
      </div>
      <table class="report-table">
        <thead><tr>
          <th>#</th><th>Player</th><th>Practices</th><th>Games</th><th>Practice %</th><th>Game %</th>
        </tr></thead>
        <tbody>
          ${data.map((r, i) => `
            <tr>
              <td class="col-num">${i + 1}</td>
              <td>${esc(r.FirstName)} ${esc(r.LastName)}</td>
              <td>${r.PracticePresent ?? 0} / ${r.PracticeCounted ?? 0}</td>
              <td>${r.GamePresent ?? 0} / ${r.GameCounted ?? 0}</td>
              <td><span class="pct-badge ${pctClass(r.PracticePct)}">${fmtPct(r.PracticePct)}</span></td>
              <td><span class="pct-badge ${pctClass(r.GamePct)}">${fmtPct(r.GamePct)}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="report-footer-note">${data.length} players</div>
    `;
  }

  function renderPaperwork(data) {
    if (!data || !data.length) return '<div class="report-empty">All paperwork is complete. 🎉</div>';
    return `
      <div class="report-print-header"><strong>Fontana Fire FC — Missing Paperwork & Photo Release</strong></div>
      <table class="report-table">
        <thead><tr>
          <th>#</th><th>Player</th><th>Parent</th><th>Phone</th><th>Paperwork</th><th>Photo Release</th>
        </tr></thead>
        <tbody>
          ${data.map((r, i) => `
            <tr>
              <td class="col-num">${i + 1}</td>
              <td>${esc(r.FirstName)} ${esc(r.LastName)}</td>
              <td>${esc(r.ParentName || '')}</td>
              <td>${esc(r.ParentPhone || '')}</td>
              <td><span class="status-badge ${r.PaperworkStatus === 'Complete' ? 'badge-ok' : 'badge-missing'}">${esc(r.PaperworkStatus || 'Missing')}</span></td>
              <td><span class="status-badge ${r.PhotoRelease === 'Received' ? 'badge-ok' : 'badge-missing'}">${esc(r.PhotoRelease || 'Missing')}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="report-footer-note">${data.length} player(s) with missing items</div>
    `;
  }

  function renderSnacks(data) {
    if (!data || !data.length) return '<div class="report-empty">No snack data available.</div>';
    return `
      <div class="report-print-header"><strong>Fontana Fire FC — Snack Rotation</strong></div>
      <table class="report-table">
        <thead><tr>
          <th>#</th><th>Player</th><th>Parent</th><th>Phone</th><th>Snack Preference</th>
        </tr></thead>
        <tbody>
          ${data.map((r, i) => `
            <tr>
              <td class="col-num">${i + 1}</td>
              <td>${esc(r.FirstName)} ${esc(r.LastName)}</td>
              <td>${esc(r.ParentName || '')}</td>
              <td>${esc(r.ParentPhone || '')}</td>
              <td>${esc(r.SnackPreference || '—')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="report-footer-note">${data.length} players</div>
    `;
  }

  function renderEmergency(data) {
    if (!data || !data.length) return '<div class="report-empty">No emergency contact data.</div>';
    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC — Emergency Contact Sheet</strong>
        <span class="report-print-confidential">CONFIDENTIAL</span>
      </div>
      <table class="report-table report-table--compact">
        <thead><tr>
          <th>#</th><th>Player</th><th>Parent</th><th>Parent Phone</th>
          <th>Emergency Contact</th><th>Relationship</th><th>EC Phone</th><th>Notes</th>
        </tr></thead>
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
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="report-footer-note">${data.length} players</div>
    `;
  }

  function renderRoster(data) {
    if (!data || !data.length) return '<div class="report-empty">No roster data.</div>';
    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC — Full Roster</strong>
        <span>As of ${new Date().toLocaleDateString()}</span>
      </div>
      <table class="report-table">
        <thead><tr>
          <th>#</th><th>Jersey</th><th>Player</th><th>DOB</th>
          <th>Parent</th><th>Phone</th><th>Email</th><th>Paperwork</th>
        </tr></thead>
        <tbody>
          ${data.map((r, i) => `
            <tr>
              <td class="col-num">${i + 1}</td>
              <td class="col-num">${r.PlayerNumber ?? '—'}</td>
              <td>${esc(r.FirstName)} ${esc(r.LastName)}</td>
              <td>${r.DateOfBirth ? fmtDate(r.DateOfBirth) : '—'}</td>
              <td>${esc(r.ParentName || '')}</td>
              <td>${esc(r.ParentPhone || '')}</td>
              <td>${esc(r.ParentEmail || '')}</td>
              <td><span class="status-badge ${r.PaperworkStatus === 'Complete' ? 'badge-ok' : 'badge-missing'}">${esc(r.PaperworkStatus || 'Missing')}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="report-footer-note">${data.length} active players</div>
    `;
  }

  // ── Print ──────────────────────────────────────────────────────────────────
  window.printReport = function (key) {
    if (!reportState[key] || !reportState[key].loaded) {
      alert('Report is still loading. Please wait and try again.');
      return;
    }
    document.body.setAttribute('data-printing-report', key);
    window.print();
    setTimeout(() => document.body.removeAttribute('data-printing-report'), 1000);
  };

  // ── Excel download ─────────────────────────────────────────────────────────
  window.downloadReportExcel = function (key) {
    const fnName = `downloadReport_${key}`;
    if (typeof window[fnName] === 'function') {
      window[fnName]();
    } else {
      alert('Excel export for this report is not yet available.');
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
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
    const parts = val.substring(0, 10).split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return val;
  }

  function esc(str) {
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(str);
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

})();
