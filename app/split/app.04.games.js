/* =========================================================
   FONTANA FIRE FC - GAMES MANAGEMENT
   Full Integrated Version: Manual Creation + AI Multi-Image Import
   Updated: June 25, 2026
   ========================================================= */

// --- PART 1: MANUAL GAME ROSTER SELECTION ---

function getSelectedGamePlayerIds() {
  return Array.from(selectedGamePlayerIds)
    .map(value => Number(value))
    .filter(value => Number.isInteger(value) && value > 0);
}

function updateGamePlayerSummary() {
  if (!gamePlayerSummary) return;
  gamePlayerSummary.textContent = `Selected Players: ${getSelectedGamePlayerIds().length}`;
}

function getFilteredGamePlayers() {
  const searchText = gamePlayerSearch ? gamePlayerSearch.value.trim().toLowerCase() : "";
  if (!searchText && !gameGenderFilter) return latestGamePlayers;

  return latestGamePlayers.filter(player => {
    const genderMatches = !gameGenderFilter || (player.Gender || "") === gameGenderFilter;
    const searchable = [
      player.FirstName, player.LastName, player.FullName,
      player.PlayerNumber === 0 || player.PlayerNumber ? `#${player.PlayerNumber}` : "",
      player.GroupName, player.GroupCode, player.Gender, player.BirthYear
    ].filter(Boolean).join(" ").toLowerCase();
    return genderMatches && searchable.includes(searchText);
  });
}

function renderGamePlayerOptions() {
  if (!gamePlayerList) return;
  const players = getFilteredGamePlayers();
  gamePlayerList.innerHTML = "";

  if (!players.length) {
    gamePlayerList.innerHTML = `<div class="roster-empty-message">No active players found.</div>`;
    updateGamePlayerSummary();
    return;
  }

  players.forEach(player => {
    const label = document.createElement("label");
    label.className = "team-event-player-option";
    const playerId = Number(player.PlayerID);
    const groupLabel = player.GroupName || player.GroupCode || player.BirthYear || "No Group";
    const playerNumber = player.PlayerNumber === 0 || player.PlayerNumber ? `#${player.PlayerNumber}` : "No #";

    label.innerHTML = `
      <input type="checkbox" class="game-player-checkbox" value="${player.PlayerID}" ${selectedGamePlayerIds.has(playerId) ? "checked" : ""}/>
      <span class="team-event-player-info">
        <span class="team-event-player-name">${escapeHtml(player.FirstName)} ${escapeHtml(player.LastName)}</span>
        <span class="team-event-player-meta">${playerNumber} | Group: ${groupLabel}${player.Gender ? ` | Gender: ${formatGenderShort(player.Gender)}` : ""}</span>
      </span>`;
    gamePlayerList.appendChild(label);
  });

  gamePlayerList.querySelectorAll(".game-player-checkbox").forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      const playerId = Number(checkbox.value);
      if (checkbox.checked) selectedGamePlayerIds.add(playerId);
      else selectedGamePlayerIds.delete(playerId);
      updateGamePlayerSummary();
    });
  });
  updateGamePlayerSummary();
}

function setAllShownGamePlayerCheckboxes(isChecked) {
  getFilteredGamePlayers().forEach(player => {
    const playerId = Number(player.PlayerID);
    if (isChecked) selectedGamePlayerIds.add(playerId);
    else selectedGamePlayerIds.delete(playerId);
  });
  renderGamePlayerOptions();
}

async function loadGamePlayerSelector() {
  if (!gamePlayerList) return;
  gamePlayerList.innerHTML = `<div class="roster-empty-message">Loading active players...</div>`;
  try {
    const res = await fetch(`${API_BASE}/players`, { credentials: "include" });
    const data = await res.json();
    latestGamePlayers = Array.isArray(data) ? data : (data.players || []);
    renderGamePlayerOptions();
  } catch (err) {
    gamePlayerList.innerHTML = `<div class="roster-empty-message">Could not load players.</div>`;
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
  if (customWrapper) customWrapper.classList.add("hidden");
  if (gamePlayerSearch) gamePlayerSearch.value = "";
  if (gameGenderFilterSelect) gameGenderFilterSelect.value = "";
  if (gamePlayerList) gamePlayerList.innerHTML = "";
  updateGamePlayerSummary();
  if (clearMessage && gameMessage) gameMessage.textContent = "";
}

async function addGame() {
  if (!canManageEvents()) return setMessage(gameMessage, "Access denied.", true);
  const eventName = newGameName ? (newGameName.value.trim() || "TBD") : "TBD";
  const eventDate = newGameDate ? newGameDate.value : "";
  const startTime = newGameStartTime ? newGameStartTime.value : "";
  const selectedPlayerIds = getSelectedGamePlayerIds();
  const locationType = newGameLocationType ? newGameLocationType.value : "Ralph M. Lewis Sports Complex";
  const locationName = locationType === "Other" ? newGameCustomLocation.value.trim() : locationType;

  if (!eventDate || !startTime) return setMessage(gameMessage, "Enter date and time.", true);

  try {
    setMessage(gameMessage, "Saving game...", false);
    const res = await fetch(`${API_BASE}/events`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerIds: selectedPlayerIds, eventDate, eventType: "Game", eventName, startTime, locationName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    
    setMessage(gameMessage, "✅ Game added successfully!", false);
    await loadEvents();
    isGameFormOpen = false;
    updateGameSection();
  } catch (err) { setMessage(gameMessage, "Error: " + err.message, true); }
}

// --- PART 2: AI GAME IMPORT (MULTI-IMAGE) ---

let gameImportImages = [];

function openGameImportModal() {
  if (document.getElementById("gameImportModal")) return;
  gameImportImages = []; 

  const modal = document.createElement("div");
  modal.id = "gameImportModal";
  modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;";

  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;width:100%;max-width:620px;max-height:90vh;overflow-y:auto;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:18px;color:#111827;">🗓️ Import Games from Schedule</h3>
        <button id="gameImportCloseBtn" style="background:none;border:none;font-size:22px;cursor:pointer;color:#6b7280;">&times;</button>
      </div>

      <div id="gameImportStep1">
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <button id="gameImportModeText" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;cursor:pointer;">Paste Text</button>
          <button id="gameImportModeImage" style="flex:1;padding:10px;border:2px solid #f57c00;background:#fff7ed;color:#c2410c;font-weight:700;border-radius:8px;cursor:pointer;">Upload Photos</button>
        </div>

        <div id="gameImportTextArea" style="display:none;">
          <textarea id="gameImportText" placeholder="Paste schedule here..." style="width:100%;height:150px;padding:10px;border:1px solid #ddd;border-radius:8px;resize:vertical;"></textarea>
        </div>

        <div id="gameImportImageArea">
          <div id="gameImportDropZone" style="border:2px dashed #d1d5db;border-radius:8px;padding:20px;text-align:center;cursor:pointer;background:#f9fafb;">
            <div style="font-size:24px;">📸</div>
            <div style="font-size:13px;font-weight:600;">Tap to add photos</div>
            <div style="font-size:11px;color:#9ca3af;">Upload multiple photos of the schedule</div>
            <input type="file" id="gameImportImageInput" accept="image/*" multiple style="display:none;" />
          </div>
          <div id="gameImportThumbnails" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;"></div>
        </div>

        <div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end;">
          <button id="gameImportParseBtn" class="btn btn-primary">⚡ Parse Schedule</button>
        </div>
        <div id="gameImportParseMsg" style="margin-top:8px;font-size:13px;"></div>
      </div>

      <div id="gameImportStep2" style="display:none;">
        <p style="font-size:13px;color:#666;">Review and edit the games Claude found.</p>
        <div id="gameImportPreview"></div>
        <div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end;">
          <button id="gameImportBackBtn" class="btn btn-secondary">← Back</button>
          <button id="gameImportCreateBtn" class="btn btn-primary">✓ Create Games</button>
        </div>
        <div id="gameImportCreateMsg" style="margin-top:8px;font-size:13px;"></div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Toggle UI
  const btnT = document.getElementById("gameImportModeText");
  const btnI = document.getElementById("gameImportModeImage");
  const areaT = document.getElementById("gameImportTextArea");
  const areaI = document.getElementById("gameImportImageArea");

  btnT.onclick = () => { areaT.style.display = "block"; areaI.style.display = "none"; btnT.style.borderColor = "#f57c00"; btnI.style.borderColor = "#ddd"; };
  btnI.onclick = () => { areaT.style.display = "none"; areaI.style.display = "block"; btnI.style.borderColor = "#f57c00"; btnT.style.borderColor = "#ddd"; };

  // Photo Handling
  const input = document.getElementById("gameImportImageInput");
  document.getElementById("gameImportDropZone").onclick = () => input.click();
  input.onchange = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const id = Date.now() + Math.random();
        gameImportImages.push({ id, base64: ev.target.result.split(',')[1], type: file.type });
        renderThumbnails();
      };
      reader.readAsDataURL(file);
    });
  };

  function renderThumbnails() {
    document.getElementById("gameImportThumbnails").innerHTML = gameImportImages.map(img => `
      <div style="position:relative;width:60px;height:60px;border-radius:4px;overflow:hidden;border:1px solid #ddd;">
        <img src="data:${img.type};base64,${img.base64}" style="width:100%;height:100%;object-fit:cover;" />
        <button onclick="removeImportImage(${img.id})" style="position:absolute;top:0;right:0;background:rgba(0,0,0,0.6);color:#fff;border:none;font-size:10px;cursor:pointer;">&times;</button>
      </div>`).join("");
  }
  window.removeImportImage = (id) => { gameImportImages = gameImportImages.filter(i => i.id !== id); renderThumbnails(); };

  document.getElementById("gameImportCloseBtn").onclick = () => modal.remove();
  document.getElementById("gameImportParseBtn").onclick = parseGameImportInput;
  document.getElementById("gameImportCreateBtn").onclick = createImportedGames;
  document.getElementById("gameImportBackBtn").onclick = () => {
    document.getElementById("gameImportStep1").style.display = "block";
    document.getElementById("gameImportStep2").style.display = "none";
  };
}

async function parseGameImportInput() {
  const msg = document.getElementById("gameImportParseMsg");
  const btn = document.getElementById("gameImportParseBtn");
  const isImg = document.getElementById("gameImportImageArea").style.display !== "none";
  const body = isImg ? { images: gameImportImages } : { text: document.getElementById("gameImportText").value };

  console.log("[Import Debug] isImg:", isImg);
  console.log("[Import Debug] gameImportImages.length:", gameImportImages.length);
  console.log("[Import Debug] body keys:", Object.keys(body));
  if (body.images) console.log("[Import Debug] images[0] keys:", body.images[0] ? Object.keys(body.images[0]) : "empty array");

  btn.disabled = true; btn.textContent = "AI Reading...";
  msg.textContent = "Claude is scanning for Fontana Fire games...";

  try {
    const res = await fetch(`${API_BASE}/import/parse-schedule`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    
    renderGameImportPreview(data.games);
    document.getElementById("gameImportStep1").style.display = "none";
    document.getElementById("gameImportStep2").style.display = "block";
  } catch (e) { msg.textContent = "Error: " + e.message; msg.style.color = "red"; }
  finally { btn.disabled = false; btn.textContent = "⚡ Parse Schedule"; }
}

function renderGameImportPreview(games) {
  const container = document.getElementById("gameImportPreview");
  container.innerHTML = games.map((g, i) => `
    <div style="border:1px solid #eee;padding:10px;margin-bottom:8px;background:#f9f9f9;border-radius:8px;position:relative;">
      <button onclick="this.parentElement.remove()" style="position:absolute;top:5px;right:5px;border:none;background:none;cursor:pointer;">🗑️</button>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <input type="text" data-field="name" value="${escapeHtml(g.name)}" style="width:100%;font-size:12px;padding:4px;">
        <input type="date" data-field="date" value="${g.date}" style="width:100%;font-size:12px;padding:4px;">
        <input type="time" data-field="time" value="${g.time}" style="width:100%;font-size:12px;padding:4px;">
        <input type="text" data-field="location" value="${escapeHtml(g.location)}" style="width:100%;font-size:12px;padding:4px;">
      </div>
    </div>`).join("");
}

async function createImportedGames() {
  const rows = document.getElementById("gameImportPreview").children;
  const games = [];
  for (let row of rows) {
    const g = {};
    row.querySelectorAll("input").forEach(inp => g[inp.dataset.field] = inp.value);
    games.push(g);
  }
  const btn = document.getElementById("gameImportCreateBtn");
  btn.disabled = true; btn.textContent = "Creating...";

  let count = 0;
  for (let g of games) {
    const res = await fetch(`${API_BASE}/events`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerIds: [], eventDate: g.date, eventType: "Game", eventName: g.name, startTime: g.time + ":00", locationName: g.location })
    });
    if (res.ok) count++;
  }
  document.getElementById("gameImportCreateMsg").textContent = `✅ Created ${count} games!`;
  await loadEvents();
  setTimeout(() => document.getElementById("gameImportModal").remove(), 2000);
}