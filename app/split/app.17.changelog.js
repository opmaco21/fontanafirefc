window.ATTENDANCE_CHANGELOG = [
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
