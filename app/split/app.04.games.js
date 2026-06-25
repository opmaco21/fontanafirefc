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
        <span class="team-event-player-name">${escapeHtml(player.FirstName)} ${escapeHtml(player.LastName)}</span>
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

/* =========================
   GAME IMPORT MODAL
   Text paste OR image upload -> Claude parses -> editable preview -> create games
   ========================= */

let gameImportMode = "text"; // "text" or "image"
let gameImportImageBase64 = null;
let gameImportImageType = null;

function openGameImportModal() {
  if (document.getElementById("gameImportModal")) return;
  gameImportMode = "text";
  gameImportImageBase64 = null;
  gameImportImageType = null;

  const modal = document.createElement("div");
  modal.id = "gameImportModal";
  modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;";

  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;width:100%;max-width:620px;max-height:90vh;overflow-y:auto;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:18px;color:#111827;">&#128203; Import Games from Schedule</h3>
        <button id="gameImportCloseBtn" style="background:none;border:none;font-size:22px;cursor:pointer;color:#6b7280;padding:4px;">&times;</button>
      </div>

      <div id="gameImportStep1">
        <p style="font-size:14px;color:#555;margin-bottom:12px;">Paste schedule text <strong>or upload a photo</strong> of the schedule. Claude will extract the game details automatically.</p>

        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <button id="gameImportModeText" style="flex:1;padding:8px;border:2px solid #f57c00;border-radius:8px;background:#fff7ed;color:#c2410c;font-weight:700;font-size:13px;cursor:pointer;">&#128203; Paste Text</button>
          <button id="gameImportModeImage" style="flex:1;padding:8px;border:2px solid #d1d5db;border-radius:8px;background:#fff;color:#6b7280;font-weight:700;font-size:13px;cursor:pointer;">&#128247; Upload Photo</button>
        </div>

        <div id="gameImportTextArea">
          <textarea id="gameImportText" placeholder="Paste schedule text here&#10;&#10;Example:&#10;Saturday June 28 @ 9:00am vs FC Galaxy&#10;Location: Fontana Sports Complex&#10;&#10;Sunday June 29 @ 11:00am vs Strikers FC&#10;Location: Central Park Field 3"
            style="width:100%;height:150px;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;resize:vertical;box-sizing:border-box;font-family:inherit;"></textarea>
        </div>

        <div id="gameImportImageArea" style="display:none;">
          <div id="gameImportDropZone" style="border:2px dashed #d1d5db;border-radius:8px;padding:28px;text-align:center;cursor:pointer;background:#f9fafb;">
            <div style="font-size:36px;margin-bottom:8px;">&#128247;</div>
            <div style="font-size:14px;color:#374151;font-weight:600;">Tap to select a photo</div>
            <div style="font-size:12px;color:#9ca3af;margin-top:4px;">JPG, PNG, GIF supported</div>
            <input type="file" id="gameImportImageInput" accept="image/*" style="display:none;" />
          </div>
          <div id="gameImportImagePreview" style="margin-top:10px;display:none;text-align:center;">
            <img id="gameImportImageThumb" style="max-width:100%;max-height:180px;border-radius:8px;border:1px solid #e1e5ea;" />
            <div style="font-size:12px;color:#6b7280;margin-top:4px;" id="gameImportImageName"></div>
          </div>
        </div>

        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">
          <button id="gameImportCancelBtn" class="btn btn-secondary">Cancel</button>
          <button id="gameImportParseBtn" class="btn btn-primary">&#9889; Parse Schedule</button>
        </div>
        <div id="gameImportParseMsg" style="margin-top:8px;font-size:13px;"></div>
      </div>

      <div id="gameImportStep2" style="display:none;">
        <p style="font-size:14px;color:#555;margin-bottom:12px;">Review and edit the games below before creating them.</p>
        <div id="gameImportPreview"></div>
        <div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end;">
          <button id="gameImportBackBtn" class="btn btn-secondary">&#8592; Back</button>
          <button id="gameImportCreateBtn" class="btn btn-primary">&#10003; Create Games</button>
        </div>
        <div id="gameImportCreateMsg" style="margin-top:8px;font-size:13px;"></div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close handlers
  document.getElementById("gameImportCloseBtn").addEventListener("click", closeGameImportModal);
  document.getElementById("gameImportCancelBtn").addEventListener("click", closeGameImportModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeGameImportModal(); });

  // Mode toggle
  document.getElementById("gameImportModeText").addEventListener("click", () => {
    gameImportMode = "text";
    document.getElementById("gameImportTextArea").style.display = "";
    document.getElementById("gameImportImageArea").style.display = "none";
    document.getElementById("gameImportModeText").style.cssText = "flex:1;padding:8px;border:2px solid #f57c00;border-radius:8px;background:#fff7ed;color:#c2410c;font-weight:700;font-size:13px;cursor:pointer;";
    document.getElementById("gameImportModeImage").style.cssText = "flex:1;padding:8px;border:2px solid #d1d5db;border-radius:8px;background:#fff;color:#6b7280;font-weight:700;font-size:13px;cursor:pointer;";
  });
  document.getElementById("gameImportModeImage").addEventListener("click", () => {
    gameImportMode = "image";
    document.getElementById("gameImportTextArea").style.display = "none";
    document.getElementById("gameImportImageArea").style.display = "";
    document.getElementById("gameImportModeImage").style.cssText = "flex:1;padding:8px;border:2px solid #f57c00;border-radius:8px;background:#fff7ed;color:#c2410c;font-weight:700;font-size:13px;cursor:pointer;";
    document.getElementById("gameImportModeText").style.cssText = "flex:1;padding:8px;border:2px solid #d1d5db;border-radius:8px;background:#fff;color:#6b7280;font-weight:700;font-size:13px;cursor:pointer;";
  });

  // Image upload
  const dropZone = document.getElementById("gameImportDropZone");
  const imageInput = document.getElementById("gameImportImageInput");
  dropZone.addEventListener("click", () => imageInput.click());
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      gameImportImageType = file.type || "image/jpeg";
      gameImportImageBase64 = dataUrl.split(",")[1];
      document.getElementById("gameImportImageThumb").src = dataUrl;
      document.getElementById("gameImportImageName").textContent = file.name;
      document.getElementById("gameImportImagePreview").style.display = "";
      dropZone.style.borderColor = "#f57c00";
    };
    reader.readAsDataURL(file);
  });

  // Parse + back + create
  document.getElementById("gameImportParseBtn").addEventListener("click", parseGameImportInput);
  document.getElementById("gameImportBackBtn").addEventListener("click", () => {
    document.getElementById("gameImportStep1").style.display = "";
    document.getElementById("gameImportStep2").style.display = "none";
  });
  document.getElementById("gameImportCreateBtn").addEventListener("click", createImportedGames);
}

function closeGameImportModal() {
  const modal = document.getElementById("gameImportModal");
  if (modal) modal.remove();
  gameImportImageBase64 = null;
  gameImportImageType = null;
}

async function parseGameImportInput() {
  const msgEl = document.getElementById("gameImportParseMsg");
  const btn = document.getElementById("gameImportParseBtn");
  const today = new Date().toISOString().slice(0, 10);

  const systemPrompt = `Today is ${today}. Extract all soccer games from the provided schedule and return ONLY a JSON array. Each game object must have these exact fields:
- "name": opponent name or game name (string)
- "date": date in YYYY-MM-DD format (string)
- "time": start time in HH:MM 24-hour format (string)
- "location": location name (string, use "Ralph M. Lewis Sports Complex" if unknown)
Return ONLY the JSON array, no other text, no markdown, no backticks.`;

  let messageContent;

  if (gameImportMode === "image") {
    if (!gameImportImageBase64) {
      msgEl.style.color = "#c62828";
      msgEl.textContent = "Please select an image first.";
      return;
    }
    messageContent = [
      { type: "image", source: { type: "base64", media_type: gameImportImageType, data: gameImportImageBase64 } },
      { type: "text", text: systemPrompt }
    ];
  } else {
    const text = document.getElementById("gameImportText").value.trim();
    if (!text) {
      msgEl.style.color = "#c62828";
      msgEl.textContent = "Please paste some schedule text first.";
      return;
    }
    messageContent = `${systemPrompt}\n\nSchedule text:\n${text}`;
  }

  btn.disabled = true;
  btn.textContent = "Parsing...";
  msgEl.style.color = "#f57c00";
  msgEl.textContent = "Sending to Claude AI...";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: messageContent }]
      })
    });

    const data = await response.json();
    const raw = data.content && data.content[0] && data.content[0].text
      ? data.content[0].text.trim() : "";

    let games;
    try {
      games = JSON.parse(raw);
    } catch (e) {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) games = JSON.parse(match[0]);
      else throw new Error("Could not parse response");
    }

    if (!Array.isArray(games) || games.length === 0) {
      msgEl.style.color = "#c62828";
      msgEl.textContent = "No games found. Make sure the schedule has dates and times visible.";
      return;
    }

    msgEl.textContent = "";
    renderGameImportPreview(games);
    document.getElementById("gameImportStep1").style.display = "none";
    document.getElementById("gameImportStep2").style.display = "";

  } catch (err) {
    console.error("Parse error:", err);
    msgEl.style.color = "#c62828";
    msgEl.textContent = "Error parsing schedule. Please try again.";
  } finally {
    btn.disabled = false;
    btn.textContent = "&#9889; Parse Schedule";
  }
}

function renderGameImportPreview(games) {
  const container = document.getElementById("gameImportPreview");
  container.innerHTML = games.map((game, i) => `
    <div style="border:1px solid #e1e5ea;border-radius:10px;padding:14px;margin-bottom:12px;background:#fafafa;">
      <div style="font-size:12px;font-weight:700;color:#f57c00;margin-bottom:8px;">GAME ${i + 1}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <label style="font-size:12px;font-weight:600;color:#374151;">Opponent / Game Name
          <input type="text" data-field="name" data-index="${i}" value="${escapeHtml(game.name || "")}"
            style="display:block;width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;margin-top:3px;box-sizing:border-box;" />
        </label>
        <label style="font-size:12px;font-weight:600;color:#374151;">Date
          <input type="date" data-field="date" data-index="${i}" value="${escapeHtml(game.date || "")}"
            style="display:block;width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;margin-top:3px;box-sizing:border-box;" />
        </label>
        <label style="font-size:12px;font-weight:600;color:#374151;">Start Time
          <input type="time" data-field="time" data-index="${i}" value="${escapeHtml(game.time || "")}"
            style="display:block;width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;margin-top:3px;box-sizing:border-box;" />
        </label>
        <label style="font-size:12px;font-weight:600;color:#374151;">Location
          <input type="text" data-field="location" data-index="${i}" value="${escapeHtml(game.location || "")}"
            style="display:block;width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;margin-top:3px;box-sizing:border-box;" />
        </label>
      </div>
    </div>
  `).join("");
}

async function createImportedGames() {
  const btn = document.getElementById("gameImportCreateBtn");
  const msgEl = document.getElementById("gameImportCreateMsg");

  const games = [];
  const byIndex = {};
  document.getElementById("gameImportPreview").querySelectorAll("[data-field]").forEach(input => {
    const idx = input.dataset.index;
    if (!byIndex[idx]) byIndex[idx] = {};
    byIndex[idx][input.dataset.field] = input.value.trim();
  });
  Object.values(byIndex).forEach(g => games.push(g));

  for (let i = 0; i < games.length; i++) {
    if (!games[i].name || !games[i].date || !games[i].time) {
      msgEl.style.color = "#c62828";
      msgEl.textContent = `Game ${i + 1} is missing name, date, or time.`;
      return;
    }
  }

  btn.disabled = true;
  btn.textContent = "Creating...";
  msgEl.style.color = "#f57c00";
  msgEl.textContent = `Creating ${games.length} game(s)...`;

  let created = 0;
  let failed = 0;

  for (const game of games) {
    try {
      const res = await fetch(`${API_BASE}/events`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerIds: [],
          eventDate: game.date,
          eventType: "Game",
          eventName: game.name,
          startTime: game.time + ":00",
          endTime: null,
          locationName: game.location || "Ralph M. Lewis Sports Complex",
          notes: null
        })
      });
      const data = await res.json();
      if (res.ok && data.success) created++;
      else failed++;
    } catch (e) { failed++; }
  }

  msgEl.style.color = failed > 0 ? "#c62828" : "#2e7d32";
  msgEl.textContent = failed > 0
    ? `Created ${created} game(s). ${failed} failed.`
    : `\u2713 ${created} game(s) created! Go to Games tab to add rosters.`;

  btn.disabled = false;
  btn.textContent = "\u2713 Create Games";

  if (created > 0) {
    await loadEvents();
    setTimeout(() => closeGameImportModal(), 2500);
  }
}