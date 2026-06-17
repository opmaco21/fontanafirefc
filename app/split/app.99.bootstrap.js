/* =========================================================
 FONTANA FIRE FC ATTENDANCE APP
 Bootstrap + Event Listeners

 Notes:
 - Load this file LAST so function declarations exist when listeners attach.
 ========================================================= */

/* =========================
   EVENT LISTENERS
   ========================= */
if (loginBtn) {
  loginBtn.addEventListener("click", login);
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

if (saveAttendanceBtn) {
  saveAttendanceBtn.addEventListener("click", saveAttendance);
}

if (cancelEventBtn) {
  cancelEventBtn.addEventListener("click", cancelSelectedEvent);
}

if (restoreEventBtn) {
  restoreEventBtn.addEventListener("click", restoreSelectedEvent);
}

if (deleteEventBtn) {
  deleteEventBtn.addEventListener("click", deleteSelectedEvent);
}

if (eventSelect) {
  eventSelect.addEventListener("change", async () => {
    saveSelectedEvent();
    resetWorkflowForSelectedEvent();
    updateEventActionButtons();
    await loadSelectedEventDetails();
    updateTeamEventSection();
    if (isTeamEventFormOpen) {
      await loadTeamEventPlayerSelector();
    }
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();
  });
}

if (addPlayerBtn) {
  addPlayerBtn.addEventListener("click", addPlayer);
}

if (addTeamEventBtn) {
  addTeamEventBtn.addEventListener("click", addTeamEvent);
}

if (showTeamEventFormBtn) {
  showTeamEventFormBtn.addEventListener("click", async () => {
    isTeamEventFormOpen = true;
    isAttendanceModeActive = false;

    if (eventSelect) {
      eventSelect.value = "";
    }

    if (attendanceMessage) attendanceMessage.textContent = "";
    if (teamEventMessage) teamEventMessage.textContent = "";
    if (eventRosterMessage) eventRosterMessage.textContent = "";

    saveSelectedEvent();
    updateEventActionButtons();
    clearSelectedEventDetails();
    updateTeamEventSection();
    if (isTeamEventFormOpen) {
      await loadTeamEventPlayerSelector();
    }
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();
  });
}

if (continueToAttendanceBtn) {
  continueToAttendanceBtn.addEventListener("click", async () => {
    isAttendanceModeActive = true;
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();

    if (attendanceSection) {
      attendanceSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

if (editRosterBtn) {
  editRosterBtn.addEventListener("click", async () => {
    isAttendanceModeActive = false;
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();

    if (eventRosterSection) {
      eventRosterSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

if (saveRosterBtn) {
  saveRosterBtn.addEventListener("click", saveEventRoster);
}

if (selectAllRosterBtn) {
  selectAllRosterBtn.addEventListener("click", () => {
    setAllRosterCheckboxes(true);
  });
}

if (clearRosterBtn) {
  clearRosterBtn.addEventListener("click", () => {
    setAllRosterCheckboxes(false);
  });
}

if (eventRosterList) {
  eventRosterList.addEventListener("change", event => {
    if (!event.target.classList.contains("roster-player-checkbox")) return;
    updateRosterSummary();
  });
}

if (groupSelect) {
  groupSelect.addEventListener("change", async () => {
    await loadEvents();
    resetWorkflowForSelectedEvent();
    await loadSelectedEventDetails();
    updateTeamEventSection();
    if (isTeamEventFormOpen) {
      await loadTeamEventPlayerSelector();
    }
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();
    clearPlayerAttendanceSelections();
  });
}

if (dashboardTab) {
  dashboardTab.addEventListener("click", async () => {
    currentTab = "Dashboard";
    setActiveTab();
    clearSelectedEvent();

    if (eventSelect) {
      eventSelect.value = "";
    }

    resetWorkflowForSelectedEvent();
    clearSelectedEventDetails();
    updateTeamEventSection();
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();

    if (typeof loadDashboard === "function") {
      await loadDashboard();
    }
  });
}

if (practiceTab) {
  practiceTab.addEventListener("click", async () => {
    currentTab = "Practice";
    setActiveTab();
    await loadEvents();
    resetWorkflowForSelectedEvent();
    await loadSelectedEventDetails();
    updateTeamEventSection();
    if (isTeamEventFormOpen) {
      await loadTeamEventPlayerSelector();
    }
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();
    clearPlayerAttendanceSelections();
  });
}

if (gamesTab) {
  gamesTab.addEventListener("click", async () => {
    currentTab = "Game";
    setActiveTab();
    await loadEvents();
    resetWorkflowForSelectedEvent();
    await loadSelectedEventDetails();
    updateTeamEventSection();
    if (isTeamEventFormOpen) {
      await loadTeamEventPlayerSelector();
    }
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();
    clearPlayerAttendanceSelections();
  });
}

if (teamEventsTab) {
  teamEventsTab.addEventListener("click", async () => {
    currentTab = "Team Event";
    setActiveTab();
    await loadEvents();
    resetWorkflowForSelectedEvent();
    await loadSelectedEventDetails();
    updateTeamEventSection();
    if (isTeamEventFormOpen) {
      await loadTeamEventPlayerSelector();
    }
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();
    clearPlayerAttendanceSelections();
  });
}

if (playerManagementTab) {
  playerManagementTab.addEventListener("click", async () => {
    currentTab = "Player Management";
    setActiveTab();
    clearSelectedEvent();

    if (eventSelect) {
      eventSelect.value = "";
    }

    resetWorkflowForSelectedEvent();
    clearSelectedEventDetails();
    updateTeamEventSection();
    if (isTeamEventFormOpen) {
      await loadTeamEventPlayerSelector();
    }
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayerManagementList();
  });
}

if (playerSearchInput) {
  playerSearchInput.addEventListener("input", () => {
    clearTimeout(playerSearchTimer);
    playerSearchTimer = setTimeout(loadPlayerManagementList, 250);
  });
}

if (showInactivePlayersToggle) {
  showInactivePlayersToggle.addEventListener("change", loadPlayerManagementList);
}

if (refreshPlayersBtn) {
  refreshPlayersBtn.addEventListener("click", loadPlayerManagementList);
}

if (teamEventAllGroups) {
  teamEventAllGroups.addEventListener("change", () => {
    const groupCheckboxes = document.querySelectorAll(".team-event-group-checkbox");

    groupCheckboxes.forEach(checkbox => {
      checkbox.checked = teamEventAllGroups.checked;
    });
  });
}

if (teamEventGroupCheckboxes) {
  teamEventGroupCheckboxes.addEventListener("change", event => {
    if (!event.target.classList.contains("team-event-group-checkbox")) return;

    updateAllGroupsCheckboxState();
  });
}

if (hideMarkedToggle) {
  hideMarkedToggle.addEventListener("change", updateAttendanceDisplay);
}

if (showCompletedBtn) {
  showCompletedBtn.addEventListener("click", () => {
    if (!completedPlayerList) return;

    completedPlayerList.classList.toggle("hidden");
    updateAttendanceDisplay();
  });
}

if (refreshDashboardBtn) {
  refreshDashboardBtn.addEventListener("click", async () => {
    if (typeof loadDashboard === "function") {
      await loadDashboard();
    }
  });
}


/* =========================
   START APP
   ========================= */
loadVersionDisplay();
restoreSession();

if (reportsTab) {
  reportsTab.addEventListener("click", () => {
    currentTab = "Reports";
    setActiveTab();
    updateMainModeVisibility();
  });
}

// Init schedule modal (defined in app.01.core.js)
if (typeof initScheduleModal === "function") {
  initScheduleModal();
}
