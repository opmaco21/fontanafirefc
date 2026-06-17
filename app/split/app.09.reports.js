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
    bindReportAccordions();
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
    const months = buildMonthOptions();
    return `
      <div class="report-filter-row">
        <label class="report-filter-label">Month</label>
        <select id="attendance-month-select" class="report-month-select" onchange="onAttendanceMonthChange(this.value)">
          ${months}
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
    const chevron = accordion.querySelector('.report-accordion-chevron');
    const isOpen = body.style.display !== 'none';

    if (isOpen) {
      body.style.display = 'none';
      accordion.classList.remove('report-accordion--open');
      chevron.textContent = '▼';
    } else {
      body.style.display = 'block';
      accordion.classList.add('report-accordion--open');
      chevron.textContent = '▲';
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
    el.innerHTML = '<div class="report-loading">Loading…</div>';

    try {
      let url = `${API_BASE}/api/reports/${key}`;
      if (key === 'attendance') {
        url += `?month=${reportState.attendance.month}`;
      }

      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

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

  // Attendance Summary
  function renderAttendance(data) {
    if (!data || !data.length) return '<div class="report-empty">No attendance data for this month.</div>';

    const monthLabel = document.getElementById('attendance-month-select')?.selectedOptions[0]?.text || '';

    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC — Attendance Summary</strong>
        <span>${monthLabel}</span>
      </div>
      <table class="report-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Practices</th>
            <th>Games</th>
            <th>Overall %</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((r, i) => `
            <tr>
              <td class="col-num">${i + 1}</td>
              <td>${escapeHtml(r.FullName || r.PlayerName || '')}</td>
              <td>${r.PracticeAttended ?? 0} / ${r.PracticeTotal ?? 0}</td>
              <td>${r.GameAttended ?? 0} / ${r.GameTotal ?? 0}</td>
              <td><span class="pct-badge ${pctClass(r.OverallPct)}">${fmtPct(r.OverallPct)}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="report-footer-note">${data.length} players</div>
    `;
  }

  // Paperwork
  function renderPaperwork(data) {
    if (!data || !data.length) return '<div class="report-empty">All paperwork is complete. 🎉</div>';
    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC — Missing Paperwork & Photo Release</strong>
      </div>
      <table class="report-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Parent</th>
            <th>Phone</th>
            <th>Paperwork</th>
            <th>Photo Release</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((r, i) => `
            <tr>
              <td class="col-num">${i + 1}</td>
              <td>${escapeHtml(r.FullName || '')}</td>
              <td>${escapeHtml(r.ParentName || '')}</td>
              <td>${escapeHtml(r.ParentPhone || '')}</td>
              <td><span class="status-badge ${r.PaperworkStatus === 'Complete' ? 'badge-ok' : 'badge-missing'}">${escapeHtml(r.PaperworkStatus || 'Missing')}</span></td>
              <td><span class="status-badge ${r.PhotoReleaseFormReceived ? 'badge-ok' : 'badge-missing'}">${r.PhotoReleaseFormReceived ? 'Received' : 'Missing'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="report-footer-note">${data.length} player(s) with missing items</div>
    `;
  }

  // Snacks
  function renderSnacks(data) {
    if (!data || !data.length) return '<div class="report-empty">No snack data available.</div>';
    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC — Snack Rotation</strong>
      </div>
      <table class="report-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Parent</th>
            <th>Phone</th>
            <th>Snack Preference</th>
            <th>Assigned Date</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((r, i) => `
            <tr>
              <td class="col-num">${i + 1}</td>
              <td>${escapeHtml(r.FullName || '')}</td>
              <td>${escapeHtml(r.ParentName || '')}</td>
              <td>${escapeHtml(r.ParentPhone || '')}</td>
              <td>${escapeHtml(r.SnackPreference || '—')}</td>
              <td>${r.AssignedDate ? fmtDate(r.AssignedDate) : '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="report-footer-note">${data.length} players</div>
    `;
  }

  // Emergency Contacts
  function renderEmergency(data) {
    if (!data || !data.length) return '<div class="report-empty">No emergency contact data.</div>';
    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC — Emergency Contact Sheet</strong>
        <span class="report-print-confidential">CONFIDENTIAL</span>
      </div>
      <table class="report-table report-table--compact">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Parent</th>
            <th>Parent Phone</th>
            <th>Emergency Contact</th>
            <th>Relationship</th>
            <th>EC Phone</th>
            <th>Alt Phone</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((r, i) => `
            <tr>
              <td class="col-num">${i + 1}</td>
              <td>${escapeHtml(r.FullName || '')}</td>
              <td>${escapeHtml(r.ParentName || '')}</td>
              <td>${escapeHtml(r.ParentPhone || '')}</td>
              <td>${escapeHtml(r.EmergencyContactName || '')}</td>
              <td>${escapeHtml(r.EmergencyContactRelationship || '')}</td>
              <td>${escapeHtml(r.EmergencyContactPhone || '')}</td>
              <td>${escapeHtml(r.EmergencyContactAltPhone || '')}</td>
              <td>${escapeHtml(r.EmergencyNotes || '')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="report-footer-note">${data.length} players</div>
    `;
  }

  // Full Roster
  function renderRoster(data) {
    if (!data || !data.length) return '<div class="report-empty">No roster data.</div>';
    return `
      <div class="report-print-header">
        <strong>Fontana Fire FC — Full Roster</strong>
        <span>As of ${new Date().toLocaleDateString()}</span>
      </div>
      <table class="report-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Jersey</th>
            <th>Player</th>
            <th>DOB</th>
            <th>Parent</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Paperwork</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((r, i) => `
            <tr>
              <td class="col-num">${i + 1}</td>
              <td class="col-num">${r.PlayerNumber ?? '—'}</td>
              <td>${escapeHtml(r.FullName || '')}</td>
              <td>${r.DateOfBirth ? fmtDate(r.DateOfBirth) : '—'}</td>
              <td>${escapeHtml(r.ParentName || '')}</td>
              <td>${escapeHtml(r.ParentPhone || '')}</td>
              <td>${escapeHtml(r.ParentEmail || '')}</td>
              <td><span class="status-badge ${r.PaperworkStatus === 'Complete' ? 'badge-ok' : 'badge-missing'}">${escapeHtml(r.PaperworkStatus || 'Missing')}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="report-footer-note">${data.length} active players</div>
    `;
  }

  // ── Print ──────────────────────────────────────────────────────────────────
  window.printReport = function (key) {
    if (!reportState[key].loaded) {
      alert('Report is still loading. Please wait a moment and try again.');
      return;
    }
    // Set a body attr so the print CSS knows which section to show
    document.body.setAttribute('data-printing-report', key);
    window.print();
    setTimeout(() => document.body.removeAttribute('data-printing-report'), 1000);
  };

  // ── Excel download (delegates to existing SheetJS logic) ───────────────────
  window.downloadReportExcel = function (key) {
    // Re-use whatever function was in the original reports build.
    // Pattern: downloadReport_<key>() — call if it exists, else warn.
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
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // escapeHtml — use shared helper if available, else local fallback
  function escapeHtml(str) {
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(str);
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();