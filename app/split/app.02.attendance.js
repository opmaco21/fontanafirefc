/* =========================
   ATTENDANCE LIST QOL HELPERS
   Compact rows, quick status buttons, search, and filters.
   ========================= */

/* =========================
   ATTENDANCE SEARCH NORMALIZER
   Makes search more forgiving:
   - ignores upper/lowercase
   - handles extra spaces
   - keeps player number searchable with or without #
   ========================= */
function normalizeAttendanceSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/#/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureAttendanceFilterControls() {
  if (!attendanceSection || !attendanceSummary) return;

  let filterPanel = document.getElementById("attendanceFilterPanel");

  if (!filterPanel) {
    filterPanel = document.createElement("div");
    filterPanel.id = "attendanceFilterPanel";
    filterPanel.className = "attendance-filter-panel hidden";

    filterPanel.innerHTML = `
      <div class="attendance-filter-row attendance-search-row">
        <label class="attendance-filter-label">
          Search Players
          <input id="attendanceSearchInput" type="text" placeholder="Search by name, number, birth year, or gender" />
        </label>
      </div>

      <div class="attendance-filter-row">
        <div class="attendance-filter-label">Gender</div>
        <div class="attendance-gender-filter-buttons">
          <button type="button" class="attendance-filter-btn active-filter" data-gender-filter="">All</button>
          <button type="button" class="attendance-filter-btn" data-gender-filter="Male">Male</button>
          <button type="button" class="attendance-filter-btn" data-gender-filter="Female">Female</button>
        </div>
      </div>

      <details class="attendance-advanced-filters">
        <summary>More filters</summary>

        <div class="attendance-filter-row">
          <div class="attendance-filter-label">View</div>
          <div class="attendance-status-filter-buttons">
            <button type="button" class="attendance-filter-btn active-filter" data-status-filter="">All</button>
            <button type="button" class="attendance-filter-btn" data-status-filter="Remaining">Remaining</button>
            <button type="button" class="attendance-filter-btn" data-status-filter="Present">Present</button>
            <button type="button" class="attendance-filter-btn" data-status-filter="Absent">Absent</button>
            <button type="button" class="attendance-filter-btn" data-status-filter="Excused">Excused</button>
            <button type="button" class="attendance-filter-btn" data-status-filter="Cancelled">Cancelled</button>
          </div>
        </div>

        <div class="attendance-filter-row">
          <div class="attendance-filter-label">Birth Year</div>
          <div id="attendanceBirthYearFilterButtons" class="attendance-birth-year-filter-buttons">
            <button type="button" class="attendance-filter-btn active-filter" data-birth-year-filter="">All</button>
          </div>
        </div>
      </details>
    `;

    const tools = attendanceSummary.closest(".attendance-tools");

    if (tools) {
      tools.insertBefore(filterPanel, attendanceSummary.nextSibling);
    } else {
      attendanceSection.insertBefore(filterPanel, attendanceSection.firstChild);
    }
  }

  const searchInput = document.getElementById("attendanceSearchInput");

  if (searchInput && !searchInput.dataset.listenerAttached) {
    searchInput.dataset.listenerAttached = "1";
    searchInput.addEventListener("input", () => {
      clearTimeout(attendanceSearchTimer);
      attendanceSearchTimer = setTimeout(() => {
        attendanceSearchText = normalizeAttendanceSearchText(searchInput.value);
        updateAttendanceDisplay();
      }, 150);
    });
  }

  // Compact search input (Batch 8)
  const compactSearch = document.getElementById("attendanceSearchInputCompact");
  if (compactSearch && !compactSearch.dataset.listenerAttached) {
    compactSearch.dataset.listenerAttached = "1";
    compactSearch.addEventListener("input", () => {
      clearTimeout(attendanceSearchTimer);
      attendanceSearchTimer = setTimeout(() => {
        attendanceSearchText = normalizeAttendanceSearchText(compactSearch.value);
        updateAttendanceDisplay();
      }, 150);
    });
  }

  // Filter icon btn toggles the existing filter panel
  const filterIconBtn = document.getElementById("attendanceFilterIconBtn");
  if (filterIconBtn && !filterIconBtn.dataset.listenerAttached) {
    filterIconBtn.dataset.listenerAttached = "1";
    filterIconBtn.addEventListener("click", () => {
      const panel = document.getElementById("attendanceFilterPanel");
      if (panel) {
        const isHidden = panel.classList.toggle("hidden");
        filterIconBtn.classList.toggle("filters-active", !isHidden);
      }
    });
  }

  document.querySelectorAll(".attendance-filter-btn[data-status-filter]").forEach(button => {
    if (button.dataset.listenerAttached) return;

    button.dataset.listenerAttached = "1";
    button.addEventListener("click", () => {
      attendanceStatusFilter = button.dataset.statusFilter || "";
      updateAttendanceFilterButtonStates();
      updateAttendanceDisplay();
    });
  });

  document.querySelectorAll(".attendance-filter-btn[data-birth-year-filter]").forEach(button => {
    if (button.dataset.listenerAttached) return;

    button.dataset.listenerAttached = "1";
    button.addEventListener("click", () => {
      attendanceBirthYearFilter = button.dataset.birthYearFilter || "";
      updateAttendanceFilterButtonStates();
      updateAttendanceDisplay();
    });
  });

  document.querySelectorAll(".attendance-filter-btn[data-gender-filter]").forEach(button => {
    if (button.dataset.listenerAttached) return;

    button.dataset.listenerAttached = "1";
    button.addEventListener("click", () => {
      attendanceGenderFilter = button.dataset.genderFilter || "";
      updateAttendanceFilterButtonStates();
      updateAttendanceDisplay();
    });
  });

  updateAttendanceFilterButtonStates();
}

function updateAttendanceFilterButtonStates() {
  document.querySelectorAll(".attendance-filter-btn[data-status-filter]").forEach(button => {
    button.classList.toggle(
      "active-filter",
      (button.dataset.statusFilter || "") === attendanceStatusFilter
    );
  });

  document.querySelectorAll(".attendance-filter-btn[data-birth-year-filter]").forEach(button => {
    button.classList.toggle(
      "active-filter",
      (button.dataset.birthYearFilter || "") === attendanceBirthYearFilter
    );
  });

  document.querySelectorAll(".attendance-filter-btn[data-gender-filter]").forEach(button => {
    button.classList.toggle(
      "active-filter",
      (button.dataset.genderFilter || "") === attendanceGenderFilter
    );
  });
}

/* =========================
   LOAD PLAYERS

   Practice:
   - Practice is date/group based.
   - Use /players with eventId and allMatching=1 so all practice
     players for that practice date load correctly.

   Games:
   - Games are roster based.
   - Use /events/:eventId/roster so only selected game roster players show.

   Team Events:
   - Team Events are roster based.
   - Use /events/:eventId/roster, with allMatching=1 when using grouped
     Team Events.
   ========================= */
async function loadPlayers() {
  if (currentTab === "Player Management") {
    await loadPlayerManagementList();
    return;
  }

  ensureAttendanceFilterControls();

  try {
    const selectedEventId = eventSelect ? eventSelect.value : "";
    const selectedEventType = getSelectedEventType();
    const selectedGroupId = getSelectedGroupIdValue();

    const playerList = document.getElementById("playerList");
    if (!playerList) return;

    if (!selectedEventId) {
      playerList.innerHTML = `
        <div class="roster-empty-message">Select a practice or event first.</div>
      `;

      if (completedPlayerList) {
        completedPlayerList.innerHTML = "";
        completedPlayerList.classList.add("hidden");
      }

      updateAttendanceDisplay();
      return;
    }

    let playersUrl = "";

    /*
      Practice still uses the player endpoint because practice is
      date/group based, not custom roster based.
    */
    if (selectedEventType === "Practice") {
      const playerParams = new URLSearchParams();

      playerParams.set("eventId", selectedEventId);

      if (selectedGroupId) {
        playerParams.set("groupId", selectedGroupId);
      } else {
        playerParams.set("allMatching", "1");
      }

      playersUrl = `${API_BASE}/players?${playerParams.toString()}`;

    /*
      Games and Team Events use custom rosters.
    */
    } else {
      let rosterUrl = `${API_BASE}/events/${selectedEventId}/roster`;

      if (selectedEventType === "Team Event" && !selectedGroupId) {
        rosterUrl += "?allMatching=1";
      }

      playersUrl = rosterUrl;
    }

    const res = await fetch(playersUrl, {
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Players API failed:", res.status, data);

      playerList.innerHTML = `
        <div class="roster-empty-message">Could not load players.</div>
      `;

      return;
    }

    const players = Array.isArray(data)
      ? data
      : Array.isArray(data.players)
        ? data.players
        : Array.isArray(data.recordset)
          ? data.recordset
          : [];

    playerList.innerHTML = "";

    if (completedPlayerList) {
      completedPlayerList.innerHTML = "";
      completedPlayerList.classList.add("hidden");
    }

    if (!players.length) {
      playerList.innerHTML = `
        <div class="roster-empty-message">No players found for this attendance list.</div>
      `;
    }

    players.forEach(player => {
      playerList.appendChild(createAttendancePlayerRow(player));
    });

    updateAttendanceBirthYearButtons(players);
    updateAttendanceDisplay();

    updateEventActionButtons();
    await loadSelectedEventDetails();
    await loadAttendanceForEvent();

  } catch (err) {
    console.error("Failed to load players", err);
  }
}

/* =========================
   CLEAR ATTENDANCE SELECTIONS
   ========================= */
/* =========================
   DYNAMIC BIRTH YEAR FILTER BUTTONS
   Generates buttons from the actual players loaded for this event.
   Adding a 2022 player automatically adds the 2022 button —
   no code changes needed.
   ========================= */
function updateAttendanceBirthYearButtons(players) {
  const container = document.getElementById("attendanceBirthYearFilterButtons");
  if (!container) return;

  // Collect distinct birth years from loaded players, sorted numerically.
  const years = [...new Set(
    players
      .map(p => String(p.BirthYear || p.GroupCode || "").trim())
      .filter(y => /^\d{4}$/.test(y))
  )].sort((a, b) => Number(a) - Number(b));

  // Rebuild buttons: All + one per year.
  container.innerHTML = `
    <button type="button" class="attendance-filter-btn active-filter" data-birth-year-filter="">All</button>
    ${years.map(y => `
      <button type="button" class="attendance-filter-btn" data-birth-year-filter="${y}">${y}</button>
    `).join("")}
  `;

  // Reset filter if previously selected year is no longer in the list.
  if (attendanceBirthYearFilter && !years.includes(attendanceBirthYearFilter)) {
    attendanceBirthYearFilter = "";
  }

  // Re-attach click listeners.
  container.querySelectorAll(".attendance-filter-btn[data-birth-year-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      attendanceBirthYearFilter = btn.dataset.birthYearFilter || "";
      container.querySelectorAll(".attendance-filter-btn").forEach(b =>
        b.classList.toggle("active-filter",
          (b.dataset.birthYearFilter || "") === attendanceBirthYearFilter)
      );
      updateAttendanceDisplay();
    });
  });
}

function clearPlayerAttendanceSelections() {
  const rows = getAllAttendanceRows();

  rows.forEach(row => {
    setAttendanceRowStatus(row, "", { saveDraft: false });
    row.classList.remove(
      "status-present",
      "status-absent",
      "status-excused",
      "status-cancelled",
      "status-clear"
    );
  });

  if (completedPlayerList) {
    completedPlayerList.classList.add("hidden");
  }

  if (attendanceMessage) {
    attendanceMessage.textContent = "";
  }

  updateAttendanceDisplay();
}

/* =========================
   LOCAL ATTENDANCE DRAFTS
   ========================= */
function getDraftKey(eventId) {
  return `attendanceDraft_event_${eventId}`;
}

function saveAttendanceDraft() {
  if (!eventSelect) return;

  const eventId = eventSelect.value;

  if (!eventId) return;

  saveSelectedEvent();

  const draft = {};

  getAllAttendanceRows().forEach(row => {
    const playerId = row.dataset.playerId;
    const status = getAttendanceRowStatus(row);

    if (playerId) {
      draft[playerId] = status;
    }
  });

  localStorage.setItem(getDraftKey(eventId), JSON.stringify(draft));
}

function loadAttendanceDraft(eventId) {
  const savedDraft = localStorage.getItem(getDraftKey(eventId));

  if (!savedDraft) return false;

  try {
    const draft = JSON.parse(savedDraft);

    getAllAttendanceRows().forEach(row => {
      const playerId = row.dataset.playerId;

      if (Object.prototype.hasOwnProperty.call(draft, playerId)) {
        setAttendanceRowStatus(row, draft[playerId], { saveDraft: false });
      }
    });

    updateAttendanceDisplay();
    return true;

  } catch (err) {
    console.error("Could not load attendance draft", err);
    return false;
  }
}

function clearAttendanceDraft(eventId) {
  if (!eventId) return;
  localStorage.removeItem(getDraftKey(eventId));
}

/* =========================
   REMEMBER SELECTED EVENT
   ========================= */
function saveSelectedEvent() {
  if (!eventSelect) return;

  if (!eventSelect.value) {
    clearSelectedEvent();
    return;
  }

  localStorage.setItem("lastSelectedEventId", eventSelect.value);
}

function getSelectedEvent() {
  return localStorage.getItem("lastSelectedEventId");
}

function clearSelectedEvent() {
  localStorage.removeItem("lastSelectedEventId");
}

/* =========================
   ALL GROUPS HELPER

   Purpose:
   - When no specific age group is selected, the app is in
     All Groups mode.
   - Backend routes use ?allMatching=1 so grouped events
     load/save/cancel/restore across matching EventIDs.
   ========================= */
function getAllMatchingParam() {
  const selectedGroupId = getSelectedGroupIdValue();
  const selectedEventType = getSelectedEventType();

  /*
    Batch 4B Game Management:
    Games are individual real games now, so they should not use
    allMatching=1. Practice and Team Events can still use grouped
    All Groups behavior.
  */
  if (selectedEventType === "Game") {
    return "";
  }

  return selectedGroupId ? "" : "?allMatching=1";
}

/* =========================
   LOAD SAVED ATTENDANCE

   Behavior:
   - Specific age group selected:
       Loads attendance for one EventID.

   - All Groups selected:
       Loads attendance across all matching EventIDs using
       ?allMatching=1.
   ========================= */
async function loadAttendanceForEvent() {
  if (!eventSelect) return;

  const eventId = eventSelect.value;

  clearPlayerAttendanceSelections();

  if (!eventId) return;

  const allMatchingParam = getAllMatchingParam();

  try {
    const res = await fetch(`${API_BASE}/attendance/${eventId}${allMatchingParam}`, {
      credentials: "include"
    });

    const savedAttendance = await res.json();
    const attendanceMap = {};

    savedAttendance.forEach(record => {
      attendanceMap[record.PlayerID] = record.AttendanceStatus;
    });

    getAllAttendanceRows().forEach(row => {
      const playerId = row.dataset.playerId;
      const savedStatus = attendanceMap[playerId] || "";

      setAttendanceRowStatus(row, savedStatus, { saveDraft: false });
    });

    updateAttendanceDisplay();

    const draftRestored = loadAttendanceDraft(eventId);

    if (draftRestored) {
      setMessage(
        attendanceMessage,
        "Draft restored. Review and submit when ready.",
        false
      );
    } else if (savedAttendance.length > 0) {
      setMessage(attendanceMessage, "Saved attendance loaded.", false);
    }

  } catch (err) {
    console.error("Failed to load saved attendance", err);
    setMessage(attendanceMessage, "Could not load saved attendance.", true);
  }
}

/* =========================
   UPDATE ATTENDANCE DISPLAY
   ========================= */
function updateAttendanceDisplay() {
  const playerList = document.getElementById("playerList");
  if (!playerList) return;

  const allRows = getAllAttendanceRows();

  let present = 0;
  let absent = 0;
  let excused = 0;
  let cancelled = 0;
  let remaining = 0;
  let completed = 0;
  let visibleCount = 0;

  allRows.forEach(row => {
    const status = getAttendanceRowStatus(row);

    row.classList.remove(
      "status-present",
      "status-absent",
      "status-excused",
      "status-cancelled",
      "status-clear"
    );

    row.querySelectorAll(".attendance-status-btn").forEach(button => {
      button.classList.toggle("active-status-btn", button.dataset.status === status);
    });

    if (status === "Present") {
      present++;
      completed++;
      row.classList.add("status-present");
    } else if (status === "Absent") {
      absent++;
      completed++;
      row.classList.add("status-absent");
    } else if (status === "Excused") {
      excused++;
      completed++;
      row.classList.add("status-excused");
    } else if (status === "Cancelled") {
      cancelled++;
      completed++;
      row.classList.add("status-cancelled");
    } else if (status === "Clear") {
      completed++;
      row.classList.add("status-clear");
    } else {
      remaining++;
    }
  });

  if (attendanceSummary) {
    attendanceSummary.textContent =
      `Present: ${present} · Absent: ${absent} · Excused: ${excused} · Remaining: ${remaining}`;
  }

  const hideMarked = hideMarkedToggle ? hideMarkedToggle.checked : true;

  allRows.forEach(row => {
    const status = getAttendanceRowStatus(row);
    const matchesFilters = rowMatchesAttendanceFilters(row);

    row.classList.toggle("hidden", !matchesFilters);

    if (matchesFilters) {
      visibleCount++;
    }

    if (status && hideMarked && completedPlayerList) {
      completedPlayerList.appendChild(row);
    } else {
      playerList.appendChild(row);
    }
  });

  if (showCompletedBtn) {
    const completedHidden = completedPlayerList
      ? completedPlayerList.classList.contains("hidden")
      : true;

    const filterText = attendanceSearchText || attendanceStatusFilter || attendanceBirthYearFilter || attendanceGenderFilter
      ? ` | Showing ${visibleCount}`
      : "";

    showCompletedBtn.textContent = completedHidden
      ? `Show Completed Attendance (${completed})${filterText}`
      : `Hide Completed Attendance (${completed})${filterText}`;
  }
}

function getAttendanceRowStatus(row) {
  return row ? row.dataset.status || "" : "";
}

function setAttendanceRowStatus(row, status, options = {}) {
  if (!row) return;

  row.dataset.status = status || "";

  row.querySelectorAll(".attendance-status-btn").forEach(button => {
    button.classList.toggle("active-status-btn", button.dataset.status === row.dataset.status);
  });

  if (options.saveDraft !== false) {
    saveAttendanceDraft();
  }

  updateAttendanceDisplay();
}

function rowMatchesAttendanceFilters(row) {
  if (!row) return false;

  const status = getAttendanceRowStatus(row);
  const rowSearchText = normalizeAttendanceSearchText(row.dataset.searchText || "");
  const rowBirthYear = String(row.dataset.birthYear || "");
  const rowGender = String(row.dataset.gender || "");

  const searchMatches =
    !attendanceSearchText ||
    rowSearchText.includes(attendanceSearchText);

  const birthYearMatches =
    !attendanceBirthYearFilter ||
    rowBirthYear === attendanceBirthYearFilter;

  const genderMatches =
    !attendanceGenderFilter ||
    rowGender === attendanceGenderFilter;

  const statusMatches =
    !attendanceStatusFilter ||
    (attendanceStatusFilter === "Remaining" && !status) ||
    status === attendanceStatusFilter;

  return searchMatches && birthYearMatches && genderMatches && statusMatches;
}

function createAttendancePlayerRow(player) {
  const row = document.createElement("div");
  const groupLabel = player.GroupName || player.GroupCode || "";
  const birthYear = player.BirthYear || player.GroupCode || groupLabel || "";
  const playerNumber =
    player.PlayerNumber === 0 || player.PlayerNumber
      ? `#${player.PlayerNumber}`
      : "No #";
  const playerName = `${player.FirstName} ${player.LastName}`.trim();
  const gender = player.Gender || "";

  row.className = "player-row attendance-player-card";
  row.dataset.playerId = player.PlayerID;
  row.dataset.status = "";
  row.dataset.birthYear = String(birthYear || "");
  row.dataset.gender = String(gender || "");

  row.dataset.searchText = normalizeAttendanceSearchText([
    playerName,
    player.FirstName || "",
    player.LastName || "",
    player.FullName || "",
    player.PlayerNumber || "",
    playerNumber,
    birthYear,
    gender,
    formatGenderShort(gender),
    groupLabel
  ].join(" "));

  const playerNameHtml = escapeHtml(playerName);

  row.innerHTML = `
    <div class="attendance-player-info">
      <div class="attendance-player-name">${playerNameHtml}</div>
      <div class="attendance-player-meta">${playerNumber} ${birthYear ? `| Birth Year: ${birthYear}` : ""} ${gender ? `| Gender: ${formatGenderShort(gender)}` : ""}</div>
    </div>

    <div class="attendance-status-buttons" role="group" aria-label="Attendance status for ${playerNameHtml}">
      <button type="button" class="attendance-status-btn present-btn" data-status="Present">Present</button>
      <button type="button" class="attendance-status-btn absent-btn" data-status="Absent">Absent</button>
      <button type="button" class="attendance-status-btn excused-btn" data-status="Excused">Excused</button>
      <button type="button" class="attendance-status-btn cancelled-btn" data-status="Cancelled">Cancelled</button>
      <button type="button" class="attendance-status-btn clear-btn" data-status="Clear">Clear / Reset</button>
    </div>
  `;

  row.querySelectorAll(".attendance-status-btn").forEach(button => {
    button.addEventListener("click", () => {
      const nextStatus = button.dataset.status || "";
      const currentStatus = getAttendanceRowStatus(row);

      setAttendanceRowStatus(row, currentStatus === nextStatus ? "" : nextStatus);

      if (attendanceMessage) {
        if (nextStatus === "Clear") {
          setMessage(attendanceMessage, "Reset selected. Submit attendance to remove this saved status.", false);
        } else {
          setMessage(attendanceMessage, nextStatus ? "Draft saved automatically." : "Status cleared from draft.", false);
        }
      }
    });
  });

  return row;
}

function getAllAttendanceRows() {
  return Array.from(
    document.querySelectorAll("#playerList .player-row, #completedPlayerList .player-row")
  );
}

/* =========================
   SAVE / UPDATE ATTENDANCE

   Behavior:
   - Specific age group selected:
       Saves to one selected EventID.

   - All Groups selected:
       Sends ?allMatching=1 so the backend can save each
       player to the correct matching EventID for that
       player's age group.
   ========================= */
async function saveAttendance() {
  if (attendanceMessage) {
    attendanceMessage.textContent = "";
  }

  if (!eventSelect) return;

  const eventId = eventSelect.value;

  if (!eventId) {
    setMessage(attendanceMessage, "Select an event first.", true);
    return;
  }

  const rows = getAllAttendanceRows();

  const attendance = [];

  rows.forEach(row => {
    const playerId = row.dataset.playerId;
    const status = getAttendanceRowStatus(row);

    if (status) {
      attendance.push({
        playerId: Number(playerId),
        status
      });
    }
  });

  if (attendance.length === 0) {
    setMessage(
      attendanceMessage,
      "Select Present, Absent, Excused, Cancelled, or Clear / Reset for at least one player.",
      true
    );
    return;
  }

  const allMatchingParam = getAllMatchingParam();

  try {
    const res = await fetch(`${API_BASE}/attendance${allMatchingParam}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        eventId: Number(eventId),
        attendance
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(attendanceMessage, data.message || "Error saving attendance.", true);
      return;
    }

    clearAttendanceDraft(eventId);

    setMessage(attendanceMessage, "✅ Attendance saved / updated.", false);
    await loadAttendanceForEvent();

  } catch (err) {
    console.error("Save attendance error:", err);
    setMessage(attendanceMessage, "Could not save attendance.", true);
  }
}

/* =========================
   CANCEL SELECTED EVENT

   Behavior:
   - If one age group is selected:
       Cancels only that selected EventID.

   - If All Groups is selected:
       Sends ?allMatching=1 so the backend can cancel
       all events on the same date and event type.
   ========================= */
async function cancelSelectedEvent() {
  if (!eventSelect || !eventSelect.value) {
    setMessage(attendanceMessage, "Select an event first.", true);
    return;
  }

  const selectedGroupId = getSelectedGroupIdValue();
  const allMatchingParam = getAllMatchingParam();

  if (!selectedGroupId) {
    const continueCancel = confirm(
      "All Groups is selected.\n\nThis will cancel all matching events on the same date and event type for every group included in that event.\n\nDo you want to continue?"
    );

    if (!continueCancel) return;
  }

  const selectedOption = eventSelect.options[eventSelect.selectedIndex];
  const eventText = selectedOption ? selectedOption.textContent : "this event";

  const confirmed = confirm(
    `Are you sure you want to cancel this event?\n\n${eventText}\n\nThis will mark the assigned players as Cancelled.`
  );

  if (!confirmed) return;

  const eventId = eventSelect.value;

  try {
    const res = await fetch(`${API_BASE}/events/${eventId}/cancel${allMatchingParam}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(
        attendanceMessage,
        data.message || "Could not cancel event.",
        true
      );
      return;
    }

    clearAttendanceDraft(eventId);

    const cancelledPlayers =
      data.cancelledPlayers ||
      data.CancelledPlayers ||
      (data.event && data.event.CancelledPlayers) ||
      0;

    setMessage(
      attendanceMessage,
      `✅ Event cancelled. ${cancelledPlayers} player(s) marked Cancelled.`,
      false
    );

    await loadEvents();

    if (eventSelect) {
      eventSelect.value = eventId;
    }

    updateEventActionButtons();

    await loadAttendanceForEvent();

  } catch (err) {
    console.error("Error cancelling event:", err);
    setMessage(attendanceMessage, "Server error cancelling event.", true);
  }
}

/* =========================
   RESTORE SELECTED EVENT

   Behavior:
   - If one age group is selected:
       Restores only that selected EventID.

   - If All Groups is selected:
       Sends ?allMatching=1 so the backend can restore
       all events on the same date and event type.
   ========================= */
async function restoreSelectedEvent() {
  if (!eventSelect || !eventSelect.value) {
    setMessage(attendanceMessage, "Select an event first.", true);
    return;
  }

  const selectedGroupId = getSelectedGroupIdValue();
  const allMatchingParam = getAllMatchingParam();

  const selectedOption = eventSelect.options[eventSelect.selectedIndex];
  const eventText = selectedOption ? selectedOption.textContent : "this event";

  const confirmed = confirm(
    selectedGroupId
      ? `Restore this cancelled event?\n\n${eventText}\n\nPrevious attendance will be recovered if a backup exists.`
      : `All Groups is selected.\n\nThis will restore all matching events on the same date and event type for every group included in that event.\n\nPrevious attendance will be recovered if backups exist.\n\nDo you want to continue?`
  );

  if (!confirmed) return;

  const eventId = eventSelect.value;

  try {
    const res = await fetch(`${API_BASE}/events/${eventId}/restore${allMatchingParam}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(
        attendanceMessage,
        data.message || "Could not restore event.",
        true
      );
      return;
    }

    clearAttendanceDraft(eventId);

    setMessage(
      attendanceMessage,
      "✅ Event restored and previous attendance recovered.",
      false
    );

    await loadEvents();

    if (eventSelect) {
      eventSelect.value = eventId;
    }

    updateEventActionButtons();

    await loadAttendanceForEvent();

  } catch (err) {
    console.error("Error restoring event:", err);
    setMessage(attendanceMessage, "Server error restoring event.", true);
  }
}

/* =========================
   DELETE SELECTED EVENT

   Use only for mistakes such as:
   - duplicate event
   - wrong date
   - event created accidentally

   Normal rainouts / cancellations should use Cancel Event
   so history remains available for reports.
   ========================= */
async function deleteSelectedEvent() {
  if (!eventSelect || !eventSelect.value) {
    setMessage(attendanceMessage, "Select an event first.", true);
    return;
  }

  const selectedGroupId = getSelectedGroupIdValue();
  const allMatchingParam = getAllMatchingParam();
  const selectedOption = eventSelect.options[eventSelect.selectedIndex];
  const eventText = selectedOption ? selectedOption.textContent : "this event";

  const scopeMessage = !selectedGroupId
    ? "All Groups is selected. This will permanently delete every matching event row included in this grouped event."
    : "This will permanently delete the selected event row.";

  const confirmed = confirm(
    `Delete this event permanently?

${eventText}

${scopeMessage}

Use Delete only for mistakes or duplicates. Normal cancelled events should stay as Cancelled.`
  );

  if (!confirmed) return;

  const secondConfirm = confirm(
    "This cannot be undone. Delete this event now?"
  );

  if (!secondConfirm) return;

  const eventId = eventSelect.value;

  try {
    const res = await fetch(`${API_BASE}/events/${eventId}${allMatchingParam}`, {
      method: "DELETE",
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(
        attendanceMessage,
        data.message || "Could not delete event.",
        true
      );
      return;
    }

    clearAttendanceDraft(eventId);
    clearSelectedEvent();

    if (eventSelect) {
      eventSelect.value = "";
    }

    setMessage(
      attendanceMessage,
      `✅ Event deleted. ${data.deletedEvents || 0} event row(s) removed.`,
      false
    );

    await loadEvents();
    resetWorkflowForSelectedEvent();
    updateEventActionButtons();
    clearSelectedEventDetails();
    updateTeamEventSection();
    if (isTeamEventFormOpen) {
      await loadTeamEventPlayerSelector();
    }
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();

  } catch (err) {
    console.error("Error deleting event:", err);
    setMessage(attendanceMessage, "Server error deleting event.", true);
  }
}