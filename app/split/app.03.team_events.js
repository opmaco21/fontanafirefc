/* =========================
   TEAM EVENT PLAYER SELECTOR

   Purpose:
   - Team Events can be created by selecting exact players.
   - Backend will create the needed event rows by each player's group.
   ========================= */
function getSelectedTeamEventPlayerIds() {
  return Array.from(
    document.querySelectorAll(".team-event-player-checkbox:checked")
  )
    .map(checkbox => Number(checkbox.value))
    .filter(value => Number.isInteger(value) && value > 0);
}

function updateTeamEventPlayerSummary() {
  const summary = document.getElementById("teamEventPlayerSummary");
  if (!summary) return;

  const selectedCount = getSelectedTeamEventPlayerIds().length;
  summary.textContent = `Selected Players: ${selectedCount}`;
}

function setAllTeamEventPlayerCheckboxes(isChecked) {
  document.querySelectorAll(".team-event-player-checkbox").forEach(checkbox => {
    checkbox.checked = isChecked;
  });

  updateTeamEventPlayerSummary();
}

function getFilteredTeamEventPlayers() {
  const searchInput = document.getElementById("teamEventPlayerSearch");
  const searchText = searchInput ? searchInput.value.trim().toLowerCase() : "";

  if (!searchText && !teamEventGenderFilter) {
    return latestTeamEventPlayers;
  }

  return latestTeamEventPlayers.filter(player => {
    const genderMatches = !teamEventGenderFilter || (player.Gender || "") === teamEventGenderFilter;
    const searchable = [
      player.FirstName,
      player.LastName,
      player.FullName,
      player.PlayerNumber === 0 || player.PlayerNumber ? `#${player.PlayerNumber}` : "",
      player.GroupName,
      player.GroupCode,
      player.Gender,
      player.BirthYear
    ].filter(Boolean).join(" ").toLowerCase();

    return genderMatches && searchable.includes(searchText);
  });
}

function renderTeamEventPlayerOptions() {
  const list = document.getElementById("teamEventPlayerList");
  if (!list) return;

  const selectedIds = new Set(getSelectedTeamEventPlayerIds());
  const players = getFilteredTeamEventPlayers();

  list.innerHTML = "";

  if (!players.length) {
    list.innerHTML = `
      <div class="roster-empty-message">
        No active players found.
      </div>
    `;
    updateTeamEventPlayerSummary();
    return;
  }

  players.forEach(player => {
    const label = document.createElement("label");
    label.className = "team-event-player-option";

    const groupLabel = player.GroupName || player.GroupCode || player.BirthYear || "No Group";
    const playerNumber = player.PlayerNumber === 0 || player.PlayerNumber
      ? `#${player.PlayerNumber}`
      : "No #";

    label.innerHTML = `
      <input
        type="checkbox"
        class="team-event-player-checkbox"
        value="${player.PlayerID}"
        ${selectedIds.has(Number(player.PlayerID)) ? "checked" : ""}
      />
      <span class="team-event-player-info">
        <span class="team-event-player-name">${player.FirstName} ${player.LastName}</span>
        <span class="team-event-player-meta">${playerNumber} | Group: ${groupLabel}${player.Gender ? ` | Gender: ${formatGenderShort(player.Gender)}` : ""}</span>
      </span>
    `;

    list.appendChild(label);
  });

  list.querySelectorAll(".team-event-player-checkbox").forEach(checkbox => {
    checkbox.addEventListener("change", updateTeamEventPlayerSummary);
  });

  updateTeamEventPlayerSummary();
}

function ensureTeamEventPlayerSelectorPanel() {
  if (!teamEventSection) return null;

  let panel = document.getElementById("teamEventPlayerSelectorPanel");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "teamEventPlayerSelectorPanel";
    panel.className = "team-event-player-selector-panel";

    panel.innerHTML = `
      <h3>Select Players</h3>
      <p class="subtext team-event-player-help">
        Select the exact players for this Team Event. The app will create the correct roster automatically, even when players are from different birth years.
      </p>

      <input
        id="teamEventPlayerSearch"
        type="text"
        placeholder="Search players by name, number, group, or gender"
      />

      <label class="team-event-gender-filter-label">
        Gender Filter
        <select id="teamEventGenderFilter">
          <option value="">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </label>

      <div class="team-event-player-actions">
        <button type="button" id="teamEventRefreshPlayersBtn" class="btn btn-secondary">
          Refresh Players
        </button>
        <button type="button" id="teamEventSelectAllPlayersBtn" class="btn btn-secondary">
          Select All Shown
        </button>
        <button type="button" id="teamEventClearPlayersBtn" class="btn btn-secondary">
          Clear Players
        </button>
      </div>

      <div id="teamEventPlayerSummary" class="roster-summary">
        Selected Players: 0
      </div>

      <div id="teamEventPlayerList" class="team-event-player-list"></div>
    `;

    const insertAfter = newTeamEventNotes || teamEventGroupCheckboxes || teamEventAllGroups;

    if (insertAfter && insertAfter.parentNode) {
      insertAfter.parentNode.insertBefore(panel, insertAfter.nextSibling);
    } else {
      teamEventSection.appendChild(panel);
    }
  }

  const searchInput = document.getElementById("teamEventPlayerSearch");
  const genderFilter = document.getElementById("teamEventGenderFilter");
  const refreshBtn = document.getElementById("teamEventRefreshPlayersBtn");
  const selectAllBtn = document.getElementById("teamEventSelectAllPlayersBtn");
  const clearBtn = document.getElementById("teamEventClearPlayersBtn");

  if (searchInput && !searchInput.dataset.listenerAttached) {
    searchInput.dataset.listenerAttached = "1";
    searchInput.addEventListener("input", () => {
      clearTimeout(teamEventPlayerSearchTimer);
      teamEventPlayerSearchTimer = setTimeout(renderTeamEventPlayerOptions, 150);
    });
  }

  if (genderFilter && !genderFilter.dataset.listenerAttached) {
    genderFilter.dataset.listenerAttached = "1";
    genderFilter.addEventListener("change", () => {
      teamEventGenderFilter = genderFilter.value || "";
      renderTeamEventPlayerOptions();
    });
  }

  if (refreshBtn && !refreshBtn.dataset.listenerAttached) {
    refreshBtn.dataset.listenerAttached = "1";
    refreshBtn.addEventListener("click", async () => {
      await loadTeamEventPlayerSelector();
    });
  }

  if (selectAllBtn && !selectAllBtn.dataset.listenerAttached) {
    selectAllBtn.dataset.listenerAttached = "1";
    selectAllBtn.addEventListener("click", () => setAllTeamEventPlayerCheckboxes(true));
  }

  if (clearBtn && !clearBtn.dataset.listenerAttached) {
    clearBtn.dataset.listenerAttached = "1";
    clearBtn.addEventListener("click", () => setAllTeamEventPlayerCheckboxes(false));
  }

  return panel;
}

function hideTeamEventGroupSelectorForPlayerMode() {
  const groupBox = teamEventAllGroups
    ? teamEventAllGroups.closest(".team-event-group-box")
    : null;

  if (groupBox) {
    groupBox.classList.add("hidden");
  } else if (teamEventGroupCheckboxes) {
    teamEventGroupCheckboxes.classList.add("hidden");
  }
}

async function loadTeamEventPlayerSelector() {
  const panel = ensureTeamEventPlayerSelectorPanel();

  if (!panel) return;

  hideTeamEventGroupSelectorForPlayerMode();

  const list = document.getElementById("teamEventPlayerList");

  if (list) {
    list.innerHTML = `<div class="roster-empty-message">Loading active players...</div>`;
  }

  try {
    const res = await fetch(`${API_BASE}/players`, {
      credentials: "include"
    });

    const data = await res.json();
    latestTeamEventPlayers = Array.isArray(data) ? data : data.players || [];

    renderTeamEventPlayerOptions();

  } catch (err) {
    console.error("Could not load players for Team Event:", err);

    if (list) {
      list.innerHTML = `<div class="roster-empty-message">Could not load players.</div>`;
    }
  }
}

/* =========================
   ADD TEAM EVENT

   Purpose:
   - Submits the Team Event creation form.
   - Uses the exact players selected in the player selector panel.
   - Backend creates one Events row per group represented.
   ========================= */
async function addTeamEvent() {
  if (teamEventMessage) {
    teamEventMessage.textContent = "";
  }

  if (currentUser && currentUser.RoleName === "MainCoach") {
    setMessage(
      teamEventMessage,
      "Access denied. Only Admin and Team Mom can add team events.",
      true
    );
    return;
  }

  const selectedPlayerIds = getSelectedTeamEventPlayerIds();

  const eventName = newTeamEventName ? newTeamEventName.value.trim() : "";
  const eventDate = newTeamEventDate ? newTeamEventDate.value : "";
  const startTime = newTeamEventStartTime ? newTeamEventStartTime.value : "";
  const endTime = newTeamEventEndTime ? newTeamEventEndTime.value : "";
  const locationName = newTeamEventLocation ? newTeamEventLocation.value.trim() : "";
  const notes = newTeamEventNotes ? newTeamEventNotes.value.trim() : "";

  if (selectedPlayerIds.length === 0 || !eventName || !eventDate) {
    setMessage(
      teamEventMessage,
      "Select at least one player and enter an event name and date.",
      true
    );
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/events`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        playerIds: selectedPlayerIds,
        eventDate,
        eventType: "Team Event",
        eventName,
        startTime: startTime || null,
        endTime: endTime || null,
        locationName: locationName || null,
        notes: notes || null
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      if (res.status === 401) {
        setMessage(teamEventMessage, "Session expired. Please login again.", true);
      } else if (res.status === 403) {
        setMessage(teamEventMessage, "Access denied.", true);
      } else {
        setMessage(teamEventMessage, data.message || "Could not add team event.", true);
      }
      return;
    }

    if (newTeamEventName) newTeamEventName.value = "";
    if (newTeamEventDate) newTeamEventDate.value = "";
    if (newTeamEventStartTime) newTeamEventStartTime.value = "";
    if (newTeamEventEndTime) newTeamEventEndTime.value = "";
    if (newTeamEventLocation) newTeamEventLocation.value = "";
    if (newTeamEventNotes) newTeamEventNotes.value = "";

    setAllTeamEventPlayerCheckboxes(false);

    if (groupSelect) {
      groupSelect.value = "";
    }

    const createdCount = data.createdEvents || 1;

    setMessage(
      teamEventMessage,
      createdCount === 1
        ? "✅ Team event added."
        : `✅ Team event added for ${createdCount} groups.`,
      false
    );

    await loadEvents();

    if (eventSelect && data.event && data.event.EventID) {
      const createdEventOption = eventSelect.querySelector(
        `option[value="${data.event.EventID}"]`
      );

      if (createdEventOption) {
        eventSelect.value = String(data.event.EventID);
        saveSelectedEvent();
      }
    }

    resetWorkflowForSelectedEvent();
    updateEventActionButtons();
    updateTeamEventSection();
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();

  } catch (err) {
    console.error("Add team event error:", err);
    setMessage(teamEventMessage, "Server error adding team event.", true);
  }
}
