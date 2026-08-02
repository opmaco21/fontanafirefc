window.ATTENDANCE_CHANGELOG = [
  {
    version: "2026.07.29-reports-insights",
    date: "July 29, 2026",
    title: "Reports & Coaching Insights",
    summary: "Reports now provide a modern coaching-focused experience with clearer attendance insights and player follow-up tools.",
    highlights: [
      "Modern Reports design with visual summaries and coaching-focused organization.",
      "Monthly Attendance by Group includes birth-year comparisons and players needing attention.",
      "Player Follow-Up replaces Attendance Red Flags with more meaningful action data.",
      "Excel export is available for loaded report tables."
    ],
    features: [
      "Modernized the Reports area with summary cards, clearer organization, and updated report colors.",
      "Added Monthly Attendance by Group with birth-year visualization and player drill-down.",
      "Added Player Follow-Up using attendance percentage, last-seen date, days away, coach, and parent contact information.",
      "Added Excel-compatible export for loaded report tables."
    ],
    improvements: [
      "Reports are organized into Coaching & Attendance, Club Administration, Coaching Follow-Up, and Game Day sections.",
      "Players needing attention can be opened directly from report views.",
      "Help now explains the current Reports and Player Follow-Up workflows."
    ],
    fixes: [
      "Grouped several report reliability, filtering, export, and data-display corrections into this release."
    ]
  },
  {
    version: "2026.07.28-stability-refresh",
    date: "July 28, 2026",
    title: "Stability, Live Refresh, and Data Consistency",
    summary: "Improved data consistency and event-management stability across the attendance app.",
    highlights: [
      "Save and update flows refresh current data while preserving working context.",
      "Photo Release values are consistent throughout Player Management and Reports.",
      "Permanent event deletion safely handles related event records."
    ],
    features: [
      "Improved save-and-refresh behavior while preserving selected events, filters, and working context.",
      "Improved Full Roster coach filtering and report consistency.",
      "Added persistent Release History and What's New access through Help."
    ],
    improvements: [
      "Game creation and roster editing preserve the current workflow more reliably.",
      "Player Management and Reports refresh current data instead of relying on stale views."
    ],
    fixes: [
      "Grouped Photo Release consistency, login permission loading, event deletion, and related stability corrections into this release."
    ]
  },
  {
    version: "2026.07-coach-assignment",
    date: "July 2026",
    title: "Coach Assignment and Attendance Filtering",
    summary: "Added coach assignments, player-level overrides, and coach filtering for attendance.",
    highlights: [
      "Coach filter added to attendance.",
      "Coach Override added to Player Management.",
      "All Coaches restores the complete attendance roster."
    ],
    features: [
      "Coach filter added to attendance.",
      "Coach Override added directly to Player Management.",
      "Player cards and Player Details show the resolved coach.",
      "All Coaches restores the complete attendance roster."
    ],
    improvements: [
      "Coach filtering changes visibility only and does not modify event rosters."
    ],
    fixes: [
      "Grouped coach override reset and player-save compatibility corrections into this release."
    ]
  }
];
