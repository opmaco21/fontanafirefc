window.ATTENDANCE_CHANGELOG = [
  {
    version: "2026.07.28-stability-refresh",
    date: "July 28, 2026",
    title: "Stability, Live Refresh, and Data Consistency",
    summary: "Improved save-and-refresh behavior, corrected Photo Release data consistency, and fixed several event-management regressions.",
    features: [
      "Save and update workflows refresh current data while keeping the user in context.",
      "Newly created games remain selected after save.",
      "Edit Roster preserves the current event, search, and roster filters after saving.",
      "Reports refresh live data instead of reusing stale rows.",
      "Full Roster includes coach filtering for All Coaches, Jose, Alfredo, Bobby, Damian, and Unassigned."
    ],
    fixes: [
      "Photo Release now uses PhotoReleaseStatus as the source of truth: Yes and No count as received, while Not Received remains missing.",
      "Corrected the SQL Photo Release trigger so Not Received is no longer converted to No.",
      "Declined photo releases are no longer classified as Missing.",
      "Admin and Team Mom Delete Event permission is available immediately after a fresh login.",
      "Permanent event deletion now safely removes related Attendance, cancellation backup, roster, and snack rows before deleting the event.",
      "Player Management save keeps the current page and refreshes the saved player data.",
      "Help includes the How-To Guide together with What's New and persistent Release History."
    ],
    testing: [
      "Photo Release SQL consistency audit returns zero mismatches.",
      "Matthew Gonzales remains Not Received after saving.",
      "Game creation stay-in-place behavior passed.",
      "Edit Roster loads all active players and preserves roster context.",
      "Permanent game deletion passed."
    ]
  },
  {
    version: "2026.07-coach-assignment",
    date: "July 2026",
    title: "Coach Assignment and Attendance Filtering",
    summary: "Added permanent coach assignments, player-level overrides, attendance filtering, and stability improvements.",
    features: [
      "Coach filter added to attendance.",
      "Coach Override added directly to Player Management.",
      "Player cards and Player Details show the resolved coach.",
      "All Coaches restores the complete attendance roster."
    ],
    fixes: [
      "Coach Override can be cleared back to Default (Automatic).",
      "Add and Edit Player are compatible with the Players table trigger.",
      "Coach filtering changes visibility only and does not modify event rosters."
    ],
    backend: [
      "Players API returns and saves CoachOverride through normal player routes.",
      "Player INSERT and UPDATE use trigger-safe save-and-select queries."
    ],
    frontend: [
      "Coach logic is owned by Player Management and Attendance.",
      "Temporary wrappers and fetch bridges were removed."
    ],
    deployment: [
      "Deploy the updated Players route before the matching frontend.",
      "Confirm the CoachOverride SQL column exists."
    ],
    testing: [
      "Coach Override workflow passed.",
      "Default coach reset passed.",
      "Add Player trigger-safe save passed.",
      "Attendance filtering and save/reload safety passed."
    ]
  }
];
