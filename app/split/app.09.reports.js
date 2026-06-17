/* =========================
   FONTANA FIRE FC — REPORTS TAB
   Generates downloadable Excel reports for Admin + TeamMom.
   Uses SheetJS (xlsx) for client-side Excel generation.
   ========================= */

let reportsSelectedMonth = new Date().toISOString().slice(0, 7);

/* =========================
   SHOW REPORTS TAB
   ========================= */
function showReportsTab() {
  const appScreen = document.getElementById("appScreen");
  if (!appScreen) return;

  // Remove any existing reports section
  const existing = document.getElementById("reportsSection");
  if (existing) existing.remove();

  const section = document.createElement("div");
  section.id = "reportsSection";
  section.className = "card reports-container";

  section.innerHTML = `
    <div class="reports-header">
      <h3>Reports</h3>
      <p>Download Excel reports for team management and follow-up.</p>
    </div>

    <div class="reports-filter-row">
      <label for="reportsMonthFilter">Attendance month:</label>
      <select id="reportsMonthFilter"></select>
    </div>

    <div class="reports-grid">

      <div class="report-card">
        <div class="report-card-info">
          <div class="report-card-title">Attendance Summary</div>
          <div class="report-card-desc">Practice, game, and event attendance % per player for the selected month.</div>
        </div>
        <button class="btn-download" id="reportBtnAttendance" type="button">
          <i class="ti ti-file-spreadsheet" aria-hidden="true"></i> Download
        </button>
      </div>

      <div class="report-card">
        <div class="report-card-info">
          <div class="report-card-title">Missing Paperwork &amp; Photo Release</div>
          <div class="report-card-desc">Players who still need paperwork completed or photo release returned.</div>
        </div>
        <button class="btn-download" id="reportBtnPaperwork" type="button">
          <i class="ti ti-file-spreadsheet" aria-hidden="true"></i> Download
        </button>
      </div>

      <div class="report-card">
        <div class="report-card-info">
          <div class="report-card-title">Snack Rotation</div>
          <div class="report-card-desc">Full snack rotation list with parent contact info.</div>
        </div>
        <button class="btn-download" id="reportBtnSnacks" type="button">
          <i class="ti ti-file-spreadsheet" aria-hidden="true"></i> Download
        </button>
      </div>

      <div class="report-card">
        <div class="report-card-info">
          <div class="report-card-title">Emergency Contact Sheet</div>
          <div class="report-card-desc">All active players with emergency contacts, parent info, and address.</div>
        </div>
        <button class="btn-download" id="reportBtnEmergency" type="button">
          <i class="ti ti-file-spreadsheet" aria-hidden="true"></i> Download
        </button>
      </div>

      <div class="report-card">
        <div class="report-card-info">
          <div class="report-card-title">Full Roster</div>
          <div class="report-card-desc">Complete active roster with all contact info, paperwork status, and snack preference.</div>
        </div>
        <button class="btn-download" id="reportBtnRoster" type="button">
          <i class="ti ti-file-spreadsheet" aria-hidden="true"></i> Download
        </button>
      </div>

    </div>

    <p id="reportsMessage" class="reports-message"></p>
  `;

  appScreen.appendChild(section);
  populateReportsMonthFilter();
  wireReportButtons();
}

function hideReportsTab() {
  const section = document.getElementById("reportsSection");
  if (section) section.remove();
}

/* =========================
   MONTH FILTER
   ========================= */
function populateReportsMonthFilter() {
  const select = document.getElementById("reportsMonthFilter");
  if (!select) return;

  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      value: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    });
  }
  months.push({ value: "", label: "All Time" });

  select.innerHTML = months.map(m =>
    `<option value="${m.value}" ${m.value === reportsSelectedMonth ? "selected" : ""}>${m.label}</option>`
  ).join("");

  select.addEventListener("change", () => {
    reportsSelectedMonth = select.value;
  });
}

/* =========================
   WIRE DOWNLOAD BUTTONS
   ========================= */
function wireReportButtons() {
  const buttons = [
    { id: "reportBtnAttendance", type: "attendance",  label: "Attendance_Summary" },
    { id: "reportBtnPaperwork",  type: "paperwork",   label: "Missing_Paperwork" },
    { id: "reportBtnSnacks",     type: "snacks",      label: "Snack_Rotation" },
    { id: "reportBtnEmergency",  type: "emergency",   label: "Emergency_Contacts" },
    { id: "reportBtnRoster",     type: "roster",      label: "Full_Roster" }
  ];

  buttons.forEach(({ id, type, label }) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("click", () => downloadReport(type, label, btn));
  });
}

/* =========================
   DOWNLOAD REPORT
   ========================= */
async function downloadReport(reportType, fileLabel, btn) {
  const msgEl = document.getElementById("reportsMessage");
  if (btn) { btn.disabled = true; btn.textContent = "Generating..."; }
  if (msgEl) { msgEl.style.color = "#f57c00"; msgEl.textContent = "Preparing your report..."; }

  try {
    const monthParam = (reportType === "attendance" && reportsSelectedMonth)
      ? `?month=${reportsSelectedMonth}`
      : "";

    const res = await fetch(`${API_BASE}/reports/${reportType}${monthParam}`, {
      credentials: "include"
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to load report data");
    }

    const rows = data.data || [];
    if (rows.length === 0) {
      if (msgEl) { msgEl.style.color = "#f9a825"; msgEl.textContent = "No data found for this report."; }
      return;
    }

    generateExcelDownload(rows, reportType, fileLabel, data.month);

    if (msgEl) { msgEl.style.color = "#2e7d32"; msgEl.textContent = `✓ ${fileLabel.replace(/_/g," ")} downloaded successfully.`; }
    setTimeout(() => { if (msgEl) msgEl.textContent = ""; }, 4000);

  } catch (err) {
    console.error("Report download error:", err);
    if (msgEl) { msgEl.style.color = "#c62828"; msgEl.textContent = err.message || "Error generating report."; }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ti ti-file-spreadsheet"></i> Download';
    }
  }
}

/* =========================
   EXCEL GENERATION (SheetJS)
   ========================= */
function generateExcelDownload(rows, reportType, fileLabel, month) {
  // Load SheetJS dynamically if not already loaded
  if (typeof XLSX === "undefined") {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => buildAndDownload(rows, reportType, fileLabel, month);
    document.head.appendChild(script);
  } else {
    buildAndDownload(rows, reportType, fileLabel, month);
  }
}

function buildAndDownload(rows, reportType, fileLabel, month) {
  const wb = XLSX.utils.book_new();

  const headerMaps = {
    attendance: [
      { key: "FirstName",    header: "First Name" },
      { key: "LastName",     header: "Last Name" },
      { key: "PlayerNumber", header: "Jersey #" },
      { key: "BirthYear",    header: "Birth Year" },
      { key: "Gender",       header: "Gender" },
      { key: "GroupName",    header: "Group" },
      { key: "PracticeCounted", header: "Practices Total" },
      { key: "PracticePresent", header: "Practices Present" },
      { key: "PracticePct",     header: "Practice %" },
      { key: "GameCounted",     header: "Games Total" },
      { key: "GamePresent",     header: "Games Present" },
      { key: "GamePct",         header: "Game %" },
      { key: "EventCounted",    header: "Events Total" },
      { key: "EventPresent",    header: "Events Present" },
      { key: "EventPct",        header: "Event %" }
    ],
    paperwork: [
      { key: "FirstName",        header: "First Name" },
      { key: "LastName",         header: "Last Name" },
      { key: "PlayerNumber",     header: "Jersey #" },
      { key: "BirthYear",        header: "Birth Year" },
      { key: "PaperworkStatus",  header: "Paperwork Status" },
      { key: "PhotoRelease",     header: "Photo Release" },
      { key: "ParentName",       header: "Parent Name" },
      { key: "ParentPhone",      header: "Parent Phone" },
      { key: "ParentEmail",      header: "Parent Email" }
    ],
    snacks: [
      { key: "FirstName",       header: "First Name" },
      { key: "LastName",        header: "Last Name" },
      { key: "PlayerNumber",    header: "Jersey #" },
      { key: "BirthYear",       header: "Birth Year" },
      { key: "SnackPreference", header: "Snack Preference" },
      { key: "ParentName",      header: "Parent Name" },
      { key: "ParentPhone",     header: "Parent Phone" },
      { key: "ParentEmail",     header: "Parent Email" }
    ],
    emergency: [
      { key: "FirstName",                   header: "First Name" },
      { key: "LastName",                    header: "Last Name" },
      { key: "PlayerNumber",                header: "Jersey #" },
      { key: "BirthYear",                   header: "Birth Year" },
      { key: "Gender",                      header: "Gender" },
      { key: "ParentName",                  header: "Parent 1 Name" },
      { key: "ParentPhone",                 header: "Parent 1 Phone" },
      { key: "ParentEmail",                 header: "Parent 1 Email" },
      { key: "Parent2Name",                 header: "Parent 2 Name" },
      { key: "Parent2Phone",                header: "Parent 2 Phone" },
      { key: "EmergencyContactName",        header: "Emergency Contact" },
      { key: "EmergencyContactRelationship",header: "Relationship" },
      { key: "EmergencyContactPhone",       header: "Emergency Phone" },
      { key: "EmergencyContactAltPhone",    header: "Emergency Alt Phone" },
      { key: "EmergencyNotes",              header: "Notes" },
      { key: "StreetAddress",               header: "Address" },
      { key: "City",                        header: "City" },
      { key: "State",                       header: "State" },
      { key: "ZipCode",                     header: "Zip" }
    ],
    roster: [
      { key: "FirstName",      header: "First Name" },
      { key: "LastName",       header: "Last Name" },
      { key: "PlayerNumber",   header: "Jersey #" },
      { key: "BirthYear",      header: "Birth Year" },
      { key: "DateOfBirth",    header: "Date of Birth" },
      { key: "Gender",         header: "Gender" },
      { key: "GroupName",      header: "Group" },
      { key: "ParentName",     header: "Parent 1 Name" },
      { key: "ParentPhone",    header: "Parent 1 Phone" },
      { key: "ParentEmail",    header: "Parent 1 Email" },
      { key: "Parent2Name",    header: "Parent 2 Name" },
      { key: "Parent2Phone",   header: "Parent 2 Phone" },
      { key: "StreetAddress",  header: "Address" },
      { key: "City",           header: "City" },
      { key: "State",          header: "State" },
      { key: "ZipCode",        header: "Zip" },
      { key: "PaperworkStatus",header: "Paperwork" },
      { key: "PhotoRelease",   header: "Photo Release" },
      { key: "SnackPreference",header: "Snack" }
    ]
  };

  const colMap = headerMaps[reportType] || Object.keys(rows[0]).map(k => ({ key: k, header: k }));
  const headers = colMap.map(c => c.header);

  const sheetData = [
    headers,
    ...rows.map(row => colMap.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return "";
      // Format date of birth nicely
      if (c.key === "DateOfBirth" && val) {
        const d = new Date(val);
        return isNaN(d) ? val : `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
      }
      // Format percentages
      if (c.key.endsWith("Pct") && val !== null && val !== "") {
        return `${val}%`;
      }
      return val;
    }))
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Auto-width columns
  const colWidths = colMap.map((c, i) => {
    const maxLen = sheetData.reduce((max, row) => {
      const cell = String(row[i] || "");
      return Math.max(max, cell.length);
    }, c.header.length);
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });
  ws["!cols"] = colWidths;

  const monthSuffix = month ? `_${month}` : "";
  const sheetName = fileLabel.replace(/_/g, " ").slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const today = new Date().toISOString().slice(0, 10);
  const filename = `FontanaFireFC_${fileLabel}${monthSuffix}_${today}.xlsx`;
  XLSX.writeFile(wb, filename);
}
