/* =========================
   GAME PLAYER SELECTOR
   Batch 4B Frontend

   Purpose:
   - Games use exact player selection, similar to Team Events.
   - Checked players are expected for the game roster.
   ========================= */
function getSelectedGamePlayerIds() {
  return Array.from(selectedGamePlayerIds)
    .map(value => Number(value))
    .filter(value => Number.isInteger(value) && value > 0);
}

function updateGamePlayerSummary() {
  if (!gamePlayerSummary) return;

  gamePlayerSummary.textContent =
    `Selected Players: ${getSelectedGamePlayerIds().length}`;
}

function getFilteredGamePlayers() {
  const searchText = gamePlayerSearch
    ? gamePlayerSearch.value.trim().toLowerCase()
    : "";

  if (!searchText && !gameGenderFilter) {
    return latestGamePlayers;
  }

  return latestGamePlayers.filter(player => {
    const genderMatches =
      !gameGenderFilter ||
      (player.Gender || "") === gameGenderFilter;

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

function renderGamePlayerOptions() {
  if (!gamePlayerList) return;

  const players = getFilteredGamePlayers();

  gamePlayerList.innerHTML = "";

  if (!players.length) {
    gamePlayerList.innerHTML = `
      <div class="roster-empty-message">
        No active players found.
      </div>
    `;
    updateGamePlayerSummary();
    return;
  }

  players.forEach(player => {
    const label = document.createElement("label");
    label.className = "team-event-player-option";

    const playerId = Number(player.PlayerID);
    const groupLabel = player.GroupName || player.GroupCode || player.BirthYear || "No Group";
    const playerNumber = player.PlayerNumber === 0 || player.PlayerNumber
      ? `#${player.PlayerNumber}`
      : "No #";

    label.innerHTML = `
      <input
        type="checkbox"
        class="game-player-checkbox"
        value="${player.PlayerID}"
        ${selectedGamePlayerIds.has(playerId) ? "checked" : ""}
      />
      <span class="team-event-player-info">
        <span class="team-event-player-name">${player.FirstName} ${player.LastName}</span>
        <span class="team-event-player-meta">${playerNumber} | Group: ${groupLabel}${player.Gender ? ` | Gender: ${formatGenderShort(player.Gender)}` : ""}</span>
      </span>
    `;

    gamePlayerList.appendChild(label);
  });

  gamePlayerList.querySelectorAll(".game-player-checkbox").forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      const playerId = Number(checkbox.value);

      if (checkbox.checked) {
        selectedGamePlayerIds.add(playerId);
      } else {
        selectedGamePlayerIds.delete(playerId);
      }

      updateGamePlayerSummary();
    });
  });

  updateGamePlayerSummary();
}

function setAllShownGamePlayerCheckboxes(isChecked) {
  const visiblePlayers = getFilteredGamePlayers();

  visiblePlayers.forEach(player => {
    const playerId = Number(player.PlayerID);

    if (isChecked) {
      selectedGamePlayerIds.add(playerId);
    } else {
      selectedGamePlayerIds.delete(playerId);
    }
  });

  renderGamePlayerOptions();
}

async function loadGamePlayerSelector() {
  if (!gamePlayerList) return;

  gamePlayerList.innerHTML = `
    <div class="roster-empty-message">Loading active players...</div>
  `;

  try {
    const res = await fetch(`${API_BASE}/players`, {
      credentials: "include"
    });

    const data = await res.json();

    latestGamePlayers = Array.isArray(data)
      ? data
      : data.players || [];

    renderGamePlayerOptions();

  } catch (err) {
    console.error("Could not load players for Game:", err);

    gamePlayerList.innerHTML = `
      <div class="roster-empty-message">Could not load players.</div>
    `;
  }
}

function resetGameForm(clearMessage = true) {
  selectedGamePlayerIds = new Set();
  latestGamePlayers = [];
  gameGenderFilter = "";

  if (newGameName) newGameName.value = "";
  if (newGameDate) newGameDate.value = "";
  if (newGameStartTime) newGameStartTime.value = "";
  if (newGameLocationType) newGameLocationType.value = "Ralph M. Lewis Sports Complex";
  if (newGameCustomLocation) newGameCustomLocation.value = "";

  const customWrapper = document.getElementById("newGameCustomLocationWrapper");
  if (customWrapper) {
    customWrapper.classList.add("hidden");
  }

  if (gamePlayerSearch) gamePlayerSearch.value = "";
  if (gameGenderFilterSelect) gameGenderFilterSelect.value = "";
  if (gamePlayerList) gamePlayerList.innerHTML = "";

  updateGamePlayerSummary();

  if (clearMessage && gameMessage) {
    gameMessage.textContent = "";
  }
}

/* =========================
   ADD TEAM EVENT

   Purpose:
   - Creates a manual event such as:
       Scrimmage
       Team get-together
       Other team activity
   - Supports one group or multiple selected groups.
   ========================= */

/* =========================
   ADD GAME
   Batch 4B Frontend

   Purpose:
   - Creates one real game.
   - Uses exact player selection for the expected roster.
   ========================= */
async function addGame() {
  if (gameMessage) {
    gameMessage.textContent = "";
  }

  if (!canManageEvents()) {
    setMessage(
      gameMessage,
      "Access denied. Only Admin and Team Mom can add games.",
      true
    );
    return;
  }

  const eventName = newGameName ? newGameName.value.trim() : "";
  const eventDate = newGameDate ? newGameDate.value : "";
  const startTime = newGameStartTime ? newGameStartTime.value : "";
  const selectedPlayerIds = getSelectedGamePlayerIds();

  const locationType = newGameLocationType
    ? newGameLocationType.value
    : "Ralph M. Lewis Sports Complex";

  const customLocation = newGameCustomLocation
    ? newGameCustomLocation.value.trim()
    : "";

  const locationName =
    locationType === "Other"
      ? customLocation
      : locationType;

  if (!eventName || !eventDate || !startTime) {
    setMessage(
      gameMessage,
      "Enter game name/opponent, date, and start time.",
      true
    );
    return;
  }

  if (!locationName) {
    setMessage(gameMessage, "Enter a game location.", true);
    return;
  }

  if (selectedPlayerIds.length === 0) {
    setMessage(
      gameMessage,
      "Select at least one expected player for this game.",
      true
    );
    return;
  }

  try {
    setMessage(gameMessage, "Saving game...", false);

    const res = await fetch(`${API_BASE}/events`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        playerIds: selectedPlayerIds,
        eventDate,
        eventType: "Game",
        eventName,
        startTime,
        endTime: null,
        locationName,
        notes: null
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(
        gameMessage,
        data.error || data.message || "Could not add game.",
        true
      );
      return;
    }

    setMessage(
      gameMessage,
      `✅ Game added. ${data.rosterSavedCount || selectedPlayerIds.length} player(s) expected.`,
      false
    );

    if (groupSelect) {
      groupSelect.value = "";
    }

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

    isGameFormOpen = false;
    isAttendanceModeActive = true;

    updateGameSection();
    resetWorkflowForSelectedEvent();
    updateEventActionButtons();
    await loadSelectedEventDetails();
    updateAttendanceSectionVisibility();
    await updateEventRosterSection();
    await loadPlayers();

  } catch (err) {
    console.error("Add game error:", err);
    setMessage(gameMessage, "Server error adding game.", true);
  }
}
