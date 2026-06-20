// app.07d.dashboard-report.js
// Dashboard → Reports navigation
window.openReportFromDashboard = function (config) {
  if (!config) return;

  // Switch to Reports tab
  currentTab = "Reports";
  if (typeof setActiveTab === "function") setActiveTab();
  if (typeof updateMainModeVisibility === "function") updateMainModeVisibility();

  // Give the Reports tab a moment to initialise, then apply filters + open accordion
  setTimeout(() => {
    const key = config.report || "attendance";

    // Open the accordion
    if (typeof toggleReportAccordion === "function") {
      const body = document.getElementById(`body-${key}`);
      if (body && body.style.display === "none") {
        toggleReportAccordion(key);
      }
    }

    // Apply attendance filters if specified
    if (key === "attendance") {
      const monthSel = document.getElementById("att-month");
      if (monthSel && config.month) {
        monthSel.value = config.month;
      }

      const belowSel = document.getElementById("att-below");
      if (belowSel) {
        belowSel.value = config.below ? String(config.below) : "";
      }

      // Trigger filter reload
      if (typeof onAttFilterChange === "function") {
        onAttFilterChange();
      }
    }
  }, 150);
};