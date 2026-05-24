/* =========================
   PLAYER MANAGEMENT
   ========================= */
let playerManagementMode = "add";
let editingPlayerId = null;
let latestManagedPlayers = [];
let playerManagementPageIndex = 0;
const PLAYER_MANAGEMENT_PAGE_SIZE = 10;

let playerManagementBirthYearFilter = "";
let playerManagementPhotoReleaseFilter = "";
let playerManagementPaperworkFilter = "";
let playerManagementGenderFilter = "";
let playerManagementQuickFilter = "";
let isPlayerManagementFormExpanded = false;
let isPlayerManagementSaving = false;

function canManagePlayers() {
  return currentUser && currentUser.RoleName !== "MainCoach";
}

function getPlayerStatusLabel(player) {
  return player.IsActive ? "Active" : "Inactive";
}

function formatDateForInput(value) {
  if (!value) return "";

  const raw = String(value);

  if (raw.includes("T")) {
    return raw.split("T")[0];
  }

  return raw.substring(0, 10);
}

function safeValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

function getPhotoReleaseLabel(player) {
  return player.PhotoReleaseStatus || "Not Received";
}

function isPaperworkMissing(player) {
  const status = player.PaperworkStatus || "Not Received";
  return status !== "Complete";
}

function isPhotoReleaseMissing(player) {
  const status = getPhotoReleaseLabel(player);
  return status === "Not Received" || !player.PhotoReleaseFormReceived;
}

function hasEmergencyInfo(player) {
  return Boolean(
    player.StreetAddress ||
    player.City ||
    player.State ||
    player.ZipCode ||
    player.EmergencyContactName ||
    player.EmergencyContactPhone ||
    player.EmergencyContactAltPhone
  );
}

function isEmergencyInfoMissing(player) {
  return !hasEmergencyInfo(player);
}

function formatPlayerUpdatedAt(value) {
  if (!value) return "Not updated";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).split("T")[0] || "Not updated";
  }

  return date.toLocaleDateString();
}



function formatGenderShort(value) {
  const gender = safeValue(value).trim().toLowerCase();

  if (gender === "male" || gender === "m") return "M";
  if (gender === "female" || gender === "f") return "F";

  return "-";
}

function formatDisplayDate(value) {
  if (!value) return "-";

  const raw = String(value);
  const dateOnly = raw.includes("T") ? raw.split("T")[0] : raw.substring(0, 10);
  const parts = dateOnly.split("-");

  if (parts.length !== 3) return raw;

  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

function formatYesNo(value) {
  return value ? "Yes" : "No";
}

function detailLine(label, value) {
  const displayValue = value === null || value === undefined || value === "" ? "-" : value;

  return `
    <div class="player-detail-line">
      <span class="player-detail-label">${label}:</span>
      <strong class="player-detail-value">${displayValue}</strong>
    </div>
  `;
}

function ensurePlayerDetailsPanel() {
  if (!playerManagementSection || !playerManagementList) return null;

  let panel = document.getElementById("playerDetailsPanel");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "playerDetailsPanel";
    panel.className = "player-details-panel hidden";
    playerManagementSection.insertBefore(panel, playerManagementList);
  }

  return panel;
}

function closePlayerDetails() {
  const panel = document.getElementById("playerDetailsPanel");

  if (panel) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
  }
}

function showPlayerDetails(playerId) {
  const player = latestManagedPlayers.find(
    item => Number(item.PlayerID) === Number(playerId)
  );

  if (!player) {
    alert("Player not found in current list.");
    return;
  }

  const panel = ensurePlayerDetailsPanel();
  if (!panel) return;

  const fullName = `${player.FirstName || ""} ${player.LastName || ""}`.trim();
  const groupLabel = player.GroupName || player.GroupCode || "-";
  const playerNumber = player.PlayerNumber === 0 || player.PlayerNumber ? `#${player.PlayerNumber}` : "-";
  const fullAddress = [player.StreetAddress, player.City, player.State, player.ZipCode]
    .filter(Boolean)
    .join(", ");

  panel.innerHTML = `
    <div class="player-details-header">
      <div>
        <h3>${fullName || "Player Details"}</h3>
        <div class="player-details-badge-row">
          <span class="player-card-badge player-number-badge">${playerNumber}</span>
          <span class="player-card-badge">${groupLabel}</span>
          <span class="player-card-badge">${formatGenderShort(player.Gender)}</span>
        </div>
      </div>
      <button type="button" id="closePlayerDetailsBtn" class="btn btn-secondary player-details-close-btn">
        Close
      </button>
    </div>

    <div class="player-details-grid">
      <section class="player-details-section">
        <h4>Player Info</h4>
        ${detailLine("Player #", playerNumber)}
        ${detailLine("First Name", player.FirstName)}
        ${detailLine("Last Name", player.LastName)}
        ${detailLine("Birth Year", player.BirthYear || player.GroupCode)}
        ${detailLine("Gender", formatGenderShort(player.Gender))}
        ${detailLine("Date of Birth", formatDisplayDate(player.DateOfBirth))}
        ${detailLine("Start Date", formatDisplayDate(player.StartDate))}
        ${detailLine("End Date", formatDisplayDate(player.EndDate))}
        ${detailLine("Status", getPlayerStatusLabel(player))}
      </section>

      <section class="player-details-section">
        <h4>Parent Info</h4>
        ${detailLine("Parent 1 Name", player.ParentName)}
        ${detailLine("Parent 1 Phone", player.ParentPhone)}
        ${detailLine("Parent Email", player.ParentEmail)}
        ${detailLine("Parent 2 Name", player.Parent2Name)}
        ${detailLine("Parent 2 Phone", player.Parent2Phone)}
      </section>

      <section class="player-details-section">
        <h4>Address</h4>
        ${detailLine("Street", player.StreetAddress)}
        ${detailLine("City", player.City)}
        ${detailLine("State", player.State)}
        ${detailLine("ZIP Code", player.ZipCode)}
        ${detailLine("Full Address", fullAddress)}
      </section>

      <section class="player-details-section">
        <h4>Emergency Contact</h4>
        ${detailLine("Name", player.EmergencyContactName)}
        ${detailLine("Relationship", player.EmergencyContactRelationship)}
        ${detailLine("Phone", player.EmergencyContactPhone)}
        ${detailLine("Notes", player.EmergencyNotes)}
      </section>

      <section class="player-details-section">
        <h4>Snack / Paperwork / Photo</h4>
        ${detailLine("Snack", player.SnackPreference || "Bring Snack")}
        ${detailLine("Paperwork", player.PaperworkStatus || "Not Received")}
        ${detailLine("Photo Release", getPhotoReleaseLabel(player))}
        ${detailLine("Photo Form Received", formatYesNo(player.PhotoReleaseFormReceived))}
        ${detailLine("Last Updated", formatPlayerUpdatedAt(player.UpdatedAt))}
      </section>
    </div>
  `;

  panel.classList.remove("hidden");

  const closeBtn = document.getElementById("closePlayerDetailsBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", closePlayerDetails);
  }

  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getPlayerManagementCounts(players) {
  return {
    paperworkMissing: players.filter(isPaperworkMissing).length,
    photoReleaseMissing: players.filter(isPhotoReleaseMissing).length,
    emergencyInfoMissing: players.filter(isEmergencyInfoMissing).length
  };
}

function setPlayerManagementSavingState(isSaving) {
  isPlayerManagementSaving = isSaving;

  const saveBtn = document.getElementById("pmSavePlayerBtn");

  if (saveBtn) {
    saveBtn.disabled = isSaving;
    saveBtn.textContent = isSaving
      ? "Saving..."
      : playerManagementMode === "edit"
        ? "Save Changes"
        : "Add Player";
  }
}

function ensurePlayerManagementFilters() {
  if (!playerManagementSection || !playerManagementSummary) return;

  let filterPanel = document.getElementById("playerManagementFilterPanel");

  if (!filterPanel) {
    filterPanel = document.createElement("div");
    filterPanel.id = "playerManagementFilterPanel";
    filterPanel.className = "player-management-filter-panel";

    filterPanel.innerHTML = `
      <div id="playerManagementQuickCounts" class="player-management-quick-counts">
        Missing: Paperwork 0 | Photo Release 0 | Emergency Info 0
      </div>

      <div class="player-management-quick-filter-buttons">
        <button type="button" id="pmQuickMissingPaperworkBtn" class="btn btn-secondary player-management-quick-filter-btn" data-filter="missingPaperwork">
          Missing Paperwork
        </button>

        <button type="button" id="pmQuickMissingPhotoReleaseBtn" class="btn btn-secondary player-management-quick-filter-btn" data-filter="missingPhotoRelease">
          Missing Photo Release
        </button>

        <button type="button" id="pmQuickMissingEmergencyBtn" class="btn btn-secondary player-management-quick-filter-btn" data-filter="missingEmergencyInfo">
          Missing Emergency Info
        </button>
      </div>

      <div class="player-management-filter-grid player-management-main-filter-grid">
        <label>
          Birth Year
          <select id="pmFilterBirthYear">
            <option value="">All Birth Years</option>
            <option value="2012">2012</option>
            <option value="2013">2013</option>
            <option value="2014">2014</option>
            <option value="2015">2015</option>
            <option value="2016">2016</option>
            <option value="2017">2017</option>
            <option value="2018">2018</option>
            <option value="2019">2019</option>
            <option value="2020">2020</option>
            <option value="2021">2021</option>
          </select>
        </label>

        <label>
          Gender
          <select id="pmFilterGender">
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>

        <button type="button" id="pmClearFiltersBtn" class="btn btn-secondary">
          Clear Filters
        </button>
      </div>

      <details class="player-management-advanced-filters">
        <summary>More filters</summary>

        <div class="player-management-filter-grid player-management-secondary-filter-grid">
          <label>
            Photo Release
            <select id="pmFilterPhotoRelease">
              <option value="">All Photo Releases</option>
              <option value="Opt In">Opt In</option>
              <option value="Opt Out">Opt Out</option>
              <option value="Not Received">Not Received</option>
            </select>
          </label>

          <label>
            Paperwork
            <select id="pmFilterPaperwork">
              <option value="">All Paperwork</option>
              <option value="Complete">Complete</option>
              <option value="Missing">Missing</option>
              <option value="Not Received">Not Received</option>
            </select>
          </label>
        </div>
      </details>
    `;

    playerManagementSection.insertBefore(filterPanel, playerManagementSummary);
  }

  const birthYearFilter = document.getElementById("pmFilterBirthYear");
  const genderFilter = document.getElementById("pmFilterGender");
  const photoReleaseFilter = document.getElementById("pmFilterPhotoRelease");
  const paperworkFilter = document.getElementById("pmFilterPaperwork");
  const clearFiltersBtn = document.getElementById("pmClearFiltersBtn");
  const quickFilterButtons = document.querySelectorAll(".player-management-quick-filter-btn");

  /*
    Player Management top controls.
    These are in index.html, but after the JS split they need
    listeners here so Show inactive, Search, and Refresh work reliably.
  */
  if (showInactivePlayersToggle && !showInactivePlayersToggle.dataset.listenerAttached) {
    showInactivePlayersToggle.dataset.listenerAttached = "1";

    showInactivePlayersToggle.addEventListener("change", async () => {
      playerManagementPageIndex = 0;
      closePlayerDetails();
      await loadPlayerManagementList();
    });
  }

  if (playerSearchInput && !playerSearchInput.dataset.listenerAttached) {
    playerSearchInput.dataset.listenerAttached = "1";

    playerSearchInput.addEventListener("input", () => {
      clearTimeout(playerSearchTimer);

      playerSearchTimer = setTimeout(async () => {
        playerManagementPageIndex = 0;
        closePlayerDetails();
        await loadPlayerManagementList();
      }, 250);
    });
  }

  if (refreshPlayersBtn && !refreshPlayersBtn.dataset.listenerAttached) {
    refreshPlayersBtn.dataset.listenerAttached = "1";

    refreshPlayersBtn.addEventListener("click", async () => {
      playerManagementPageIndex = 0;
      closePlayerDetails();
      await loadPlayerManagementList();
    });
  }

  if (birthYearFilter && !birthYearFilter.dataset.listenerAttached) {
    birthYearFilter.dataset.listenerAttached = "1";

    birthYearFilter.addEventListener("change", () => {
      playerManagementBirthYearFilter = birthYearFilter.value;
      playerManagementPageIndex = 0;
      renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));
    });
  }

  if (genderFilter && !genderFilter.dataset.listenerAttached) {
    genderFilter.dataset.listenerAttached = "1";

    genderFilter.addEventListener("change", () => {
      playerManagementGenderFilter = genderFilter.value;
      playerManagementPageIndex = 0;
      renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));
    });
  }

  if (photoReleaseFilter && !photoReleaseFilter.dataset.listenerAttached) {
    photoReleaseFilter.dataset.listenerAttached = "1";

    photoReleaseFilter.addEventListener("change", () => {
      playerManagementPhotoReleaseFilter = photoReleaseFilter.value;
      playerManagementPageIndex = 0;
      renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));
    });
  }

  if (paperworkFilter && !paperworkFilter.dataset.listenerAttached) {
    paperworkFilter.dataset.listenerAttached = "1";

    paperworkFilter.addEventListener("change", () => {
      playerManagementPaperworkFilter = paperworkFilter.value;
      playerManagementPageIndex = 0;
      renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));
    });
  }

  quickFilterButtons.forEach(button => {
    if (button.dataset.listenerAttached) return;

    button.dataset.listenerAttached = "1";

    button.addEventListener("click", () => {
      const selectedFilter = button.dataset.filter || "";

      playerManagementQuickFilter =
        playerManagementQuickFilter === selectedFilter
          ? ""
          : selectedFilter;

      playerManagementPageIndex = 0;
      updatePlayerManagementQuickFilterButtons();
      renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));
    });
  });

  if (clearFiltersBtn && !clearFiltersBtn.dataset.listenerAttached) {
    clearFiltersBtn.dataset.listenerAttached = "1";

    clearFiltersBtn.addEventListener("click", () => {
      playerManagementBirthYearFilter = "";
      playerManagementPhotoReleaseFilter = "";
      playerManagementPaperworkFilter = "";
      playerManagementGenderFilter = "";
      playerManagementQuickFilter = "";

      if (birthYearFilter) birthYearFilter.value = "";
      if (genderFilter) genderFilter.value = "";
      if (photoReleaseFilter) photoReleaseFilter.value = "";
      if (paperworkFilter) paperworkFilter.value = "";

      playerManagementPageIndex = 0;
      updatePlayerManagementQuickFilterButtons();
      renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));
    });
  }

  updatePlayerManagementQuickCounts();
  updatePlayerManagementQuickFilterButtons();
}

function updatePlayerManagementQuickCounts() {
  const countBox = document.getElementById("playerManagementQuickCounts");

  if (!countBox) return;

  const counts = getPlayerManagementCounts(latestManagedPlayers);

  countBox.textContent =
    `Missing: Paperwork ${counts.paperworkMissing} | Photo Release ${counts.photoReleaseMissing} | Emergency Info ${counts.emergencyInfoMissing}`;
}

function updatePlayerManagementQuickFilterButtons() {
  document.querySelectorAll(".player-management-quick-filter-btn").forEach(button => {
    button.classList.toggle(
      "active-quick-filter",
      button.dataset.filter === playerManagementQuickFilter
    );
  });
}

function getFilteredManagedPlayers(players) {
  return players.filter(player => {
    const birthYearMatches = !playerManagementBirthYearFilter ||
      String(player.BirthYear || player.GroupCode || "") === playerManagementBirthYearFilter;

    const genderMatches = !playerManagementGenderFilter ||
      (player.Gender || "") === playerManagementGenderFilter;

    const photoReleaseMatches = !playerManagementPhotoReleaseFilter ||
      getPhotoReleaseLabel(player) === playerManagementPhotoReleaseFilter;

    const paperworkStatus = player.PaperworkStatus || "Not Received";
    const paperworkMatches = !playerManagementPaperworkFilter ||
      paperworkStatus === playerManagementPaperworkFilter;

    const quickFilterMatches =
      !playerManagementQuickFilter ||
      (playerManagementQuickFilter === "missingPaperwork" && isPaperworkMissing(player)) ||
      (playerManagementQuickFilter === "missingPhotoRelease" && isPhotoReleaseMissing(player)) ||
      (playerManagementQuickFilter === "missingEmergencyInfo" && isEmergencyInfoMissing(player));

    return birthYearMatches && genderMatches && photoReleaseMatches && paperworkMatches && quickFilterMatches;
  });
}

function getPlayerManagementFilterDescription() {
  const parts = [];

  if (playerManagementQuickFilter === "missingPaperwork") {
    parts.push("Missing Paperwork");
  } else if (playerManagementQuickFilter === "missingPhotoRelease") {
    parts.push("Missing Photo Release");
  } else if (playerManagementQuickFilter === "missingEmergencyInfo") {
    parts.push("Missing Emergency Info");
  }

  if (playerManagementBirthYearFilter) {
    parts.push(`Birth Year: ${playerManagementBirthYearFilter}`);
  }

  if (playerManagementGenderFilter) {
    parts.push(`Gender: ${playerManagementGenderFilter}`);
  }

  if (playerManagementPhotoReleaseFilter) {
    parts.push(`Photo Release: ${playerManagementPhotoReleaseFilter}`);
  }

  if (playerManagementPaperworkFilter) {
    parts.push(`Paperwork: ${playerManagementPaperworkFilter}`);
  }

  return parts.length ? ` | Filters: ${parts.join(", ")}` : "";
}

function ensurePlayerManagementForm() {
  if (!addPlayerSection) return;

  if (!canManagePlayers()) {
    addPlayerSection.innerHTML = "";
    addPlayerSection.classList.add("hidden");
    return;
  }

  addPlayerSection.classList.remove("hidden");

  if (!isPlayerManagementFormExpanded && playerManagementMode !== "edit") {
    addPlayerSection.innerHTML = `
      <div class="player-management-collapsed-form">
        <button type="button" id="pmShowAddPlayerFormBtn" class="btn btn-primary">
          Add New Player
        </button>
        <span class="player-management-collapsed-note">Open the form only when adding or editing a player.</span>
      </div>
    `;

    const showFormBtn = document.getElementById("pmShowAddPlayerFormBtn");

    if (showFormBtn) {
      showFormBtn.addEventListener("click", () => {
        isPlayerManagementFormExpanded = true;
        ensurePlayerManagementForm();
      });
    }

    return;
  }

  addPlayerSection.innerHTML = `
    <div class="player-management-form-card">
      <h3 id="playerFormTitle">Add New Player</h3>

      <div class="player-form-section">
        <h4>Player Info</h4>
        <div class="player-form-grid">
          <label>
            Player #
            <input id="pmPlayerNumber" type="number" min="0" placeholder="Player number" />
          </label>

          <label>
            Birth Year
            <select id="pmBirthYear">
              <option value="">Select birth year</option>
              <option value="2012">2012</option>
              <option value="2013">2013</option>
              <option value="2014">2014</option>
              <option value="2015">2015</option>
              <option value="2016">2016</option>
              <option value="2017">2017</option>
              <option value="2018">2018</option>
              <option value="2019">2019</option>
              <option value="2020">2020</option>
              <option value="2021">2021</option>
            </select>
          </label>

          <label>
            Gender
            <select id="pmGender">
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </label>

          <label>
            First Name
            <input id="pmFirstName" type="text" placeholder="First name" />
          </label>

          <label>
            Last Name
            <input id="pmLastName" type="text" placeholder="Last name" />
          </label>

          <label>
            Date of Birth
            <input id="pmDateOfBirth" type="date" />
          </label>

          <label>
            Start Date
            <input id="pmStartDate" type="date" />
          </label>
        </div>
      </div>

      <div class="player-form-section">
        <h4>Parent Info</h4>
        <div class="player-form-grid">
          <label>
            Parent 1 Name
            <input id="pmParentName" type="text" placeholder="Parent 1 name" />
          </label>

          <label>
            Parent 1 Phone
            <input id="pmParentPhone" type="tel" placeholder="Parent 1 phone" />
          </label>

          <label>
            Parent Email
            <input id="pmParentEmail" type="email" placeholder="Parent email" />
          </label>

          <label>
            Parent 2 Name
            <input id="pmParent2Name" type="text" placeholder="Parent 2 name" />
          </label>

          <label>
            Parent 2 Phone
            <input id="pmParent2Phone" type="tel" placeholder="Parent 2 phone" />
          </label>
        </div>
      </div>

      <div class="player-form-section player-private-section">
        <h4>Address</h4>
        <p class="player-form-note">Address information stays inside Edit Player and View Details.</p>

        <div class="player-form-grid">
          <label>
            Street Address
            <input id="pmStreetAddress" type="text" placeholder="Street address" />
          </label>

          <label>
            City
            <input id="pmCity" type="text" placeholder="City" />
          </label>

          <label>
            State
            <input id="pmState" type="text" placeholder="State" />
          </label>

          <label>
            ZIP Code
            <input id="pmZipCode" type="text" placeholder="ZIP code" />
          </label>
        </div>
      </div>

      <div class="player-form-section player-private-section">
        <h4>Emergency Contact</h4>
        <p class="player-form-note">Emergency information stays inside Edit Player and View Details.</p>

        <div class="player-form-grid">
          <label>
            Emergency Contact Name
            <input id="pmEmergencyContactName" type="text" placeholder="Emergency contact name" />
          </label>

          <label>
            Emergency Contact Relationship
            <input id="pmEmergencyContactRelationship" type="text" placeholder="Relationship" />
          </label>

          <label>
            Emergency Contact Phone
            <input id="pmEmergencyContactPhone" type="tel" placeholder="Emergency phone" />
          </label>

          <label>
            Emergency Contact Alt Phone
            <input id="pmEmergencyContactAltPhone" type="tel" placeholder="Alternate phone" />
          </label>

          <label class="player-form-wide">
            Emergency Notes
            <textarea id="pmEmergencyNotes" placeholder="Emergency notes, medical notes, or important instructions"></textarea>
          </label>
        </div>
      </div>

      <div class="player-form-section">
        <h4>Snack / Paperwork / Photo Release</h4>
        <div class="player-form-grid">
          <label>
            Snack Preference
            <select id="pmSnackPreference">
              <option value="Bring Snack">Bring Snack</option>
              <option value="Paid Out">Paid Out</option>
            </select>
          </label>

          <label>
            Paperwork Status
            <select id="pmPaperworkStatus">
              <option value="Not Received">Not Received</option>
              <option value="Missing">Missing</option>
              <option value="Complete">Complete</option>
            </select>
          </label>

          <label>
            Photo Release Status
            <select id="pmPhotoReleaseStatus">
              <option value="Not Received">Not Received</option>
              <option value="Opt In">Opt In</option>
              <option value="Opt Out">Opt Out</option>
            </select>
          </label>

          <label>
            Photo Release Form Received
            <select id="pmPhotoReleaseFormReceived">
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </label>
        </div>
      </div>

      <div class="player-form-section">
        <h4>Status</h4>
        <div class="player-form-grid">
          <label>
            Active Status
            <select id="pmIsActive">
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </label>

          <label>
            End Date
            <input id="pmEndDate" type="date" />
          </label>
        </div>
      </div>

      <div class="player-form-actions">
        <button type="button" id="pmSavePlayerBtn" class="btn btn-primary">
          Add Player
        </button>

        <button type="button" id="pmCancelEditBtn" class="btn btn-secondary hidden">
          Cancel Edit
        </button>
      </div>

      <p id="pmPlayerMessage" class="form-message"></p>
    </div>
  `;

  const saveBtn = document.getElementById("pmSavePlayerBtn");
  const cancelBtn = document.getElementById("pmCancelEditBtn");
  const birthYearInput = document.getElementById("pmBirthYear");
  const dobInput = document.getElementById("pmDateOfBirth");

  if (saveBtn) {
    saveBtn.addEventListener("click", savePlayerManagementForm);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", resetPlayerManagementForm);
  }

  if (birthYearInput && dobInput) {
    birthYearInput.addEventListener("change", () => {
      if (!dobInput.value && birthYearInput.value) {
        dobInput.value = `${birthYearInput.value}-01-01`;
      }
    });
  }

  if (playerManagementMode !== "edit") {
  resetPlayerManagementForm(false);
}
}

function setPlayerManagementMessage(text, isError = false) {
  const message = document.getElementById("pmPlayerMessage");

  if (message) {
    message.textContent = text;
    message.style.color = isError ? "#c62828" : "#2e7d32";
  }

  if (addPlayerMessage) {
    addPlayerMessage.textContent = text;
    addPlayerMessage.style.color = isError ? "#c62828" : "#2e7d32";
  }
}

function getPlayerFormPayload() {
  const playerNumberInput = document.getElementById("pmPlayerNumber");
  const firstNameInput = document.getElementById("pmFirstName");
  const lastNameInput = document.getElementById("pmLastName");
  const birthYearInput = document.getElementById("pmBirthYear");
  const dateOfBirthInput = document.getElementById("pmDateOfBirth");
  const genderInput = document.getElementById("pmGender");
  const parentNameInput = document.getElementById("pmParentName");
  const parentPhoneInput = document.getElementById("pmParentPhone");
  const parentEmailInput = document.getElementById("pmParentEmail");
  const parent2NameInput = document.getElementById("pmParent2Name");
  const parent2PhoneInput = document.getElementById("pmParent2Phone");
  const streetAddressInput = document.getElementById("pmStreetAddress");
  const cityInput = document.getElementById("pmCity");
  const stateInput = document.getElementById("pmState");
  const zipCodeInput = document.getElementById("pmZipCode");
  const emergencyContactNameInput = document.getElementById("pmEmergencyContactName");
  const emergencyContactRelationshipInput = document.getElementById("pmEmergencyContactRelationship");
  const emergencyContactPhoneInput = document.getElementById("pmEmergencyContactPhone");
  const emergencyContactAltPhoneInput = document.getElementById("pmEmergencyContactAltPhone");
  const emergencyNotesInput = document.getElementById("pmEmergencyNotes");
  const snackPreferenceInput = document.getElementById("pmSnackPreference");
  const paperworkStatusInput = document.getElementById("pmPaperworkStatus");
  const photoReleaseStatusInput = document.getElementById("pmPhotoReleaseStatus");
  const photoReleaseFormReceivedInput = document.getElementById("pmPhotoReleaseFormReceived");
  const startDateInput = document.getElementById("pmStartDate");
  const endDateInput = document.getElementById("pmEndDate");
  const isActiveInput = document.getElementById("pmIsActive");

  const birthYear = birthYearInput ? birthYearInput.value : "";

  const dateOfBirth =
    dateOfBirthInput && dateOfBirthInput.value
      ? dateOfBirthInput.value
      : birthYear
        ? `${birthYear}-01-01`
        : "";

  return {
    playerNumber:
      playerNumberInput && playerNumberInput.value !== ""
        ? Number(playerNumberInput.value)
        : null,

    firstName: firstNameInput ? firstNameInput.value.trim() : "",
    lastName: lastNameInput ? lastNameInput.value.trim() : "",
    birthYear: birthYear ? Number(birthYear) : null,
    dateOfBirth,
    gender: genderInput ? genderInput.value : "",

    parentName: parentNameInput ? parentNameInput.value.trim() : "",
    parentPhone: parentPhoneInput ? parentPhoneInput.value.trim() : "",
    parentEmail: parentEmailInput ? parentEmailInput.value.trim() : "",
    parent2Name: parent2NameInput ? parent2NameInput.value.trim() : "",
    parent2Phone: parent2PhoneInput ? parent2PhoneInput.value.trim() : "",

    streetAddress: streetAddressInput ? streetAddressInput.value.trim() : "",
    city: cityInput ? cityInput.value.trim() : "",
    state: stateInput ? stateInput.value.trim() : "",
    zipCode: zipCodeInput ? zipCodeInput.value.trim() : "",
    emergencyContactName: emergencyContactNameInput ? emergencyContactNameInput.value.trim() : "",
    emergencyContactRelationship: emergencyContactRelationshipInput ? emergencyContactRelationshipInput.value.trim() : "",
    emergencyContactPhone: emergencyContactPhoneInput ? emergencyContactPhoneInput.value.trim() : "",
    emergencyContactAltPhone: emergencyContactAltPhoneInput ? emergencyContactAltPhoneInput.value.trim() : "",
    emergencyNotes: emergencyNotesInput ? emergencyNotesInput.value.trim() : "",

    snackPreference: snackPreferenceInput ? snackPreferenceInput.value : "Bring Snack",
    paperworkStatus: paperworkStatusInput ? paperworkStatusInput.value : "Not Received",
    photoReleaseStatus: photoReleaseStatusInput ? photoReleaseStatusInput.value : "Not Received",
    photoReleaseFormReceived: photoReleaseFormReceivedInput ? photoReleaseFormReceivedInput.value === "1" : false,

    startDate: startDateInput ? startDateInput.value || null : null,
    endDate: endDateInput ? endDateInput.value || null : null,

    isActive: isActiveInput ? isActiveInput.value === "1" : true
  };
}

function validatePlayerPayload(payload) {
  if (!payload.firstName || !payload.lastName || !payload.birthYear) {
    return "First name, last name, and birth year are required.";
  }

  if (payload.birthYear < 2012 || payload.birthYear > 2021) {
    return "Birth year must be between 2012 and 2021.";
  }

  return "";
}

async function savePlayerManagementForm() {
  if (!canManagePlayers()) {
    setPlayerManagementMessage(
      "Access denied. Only Admin and Team Mom can manage players.",
      true
    );
    return;
  }

  const payload = getPlayerFormPayload();
  const validationMessage = validatePlayerPayload(payload);

  if (validationMessage) {
    setPlayerManagementMessage(validationMessage, true);
    return;
  }

  const isEditMode = playerManagementMode === "edit" && editingPlayerId;

  const url = isEditMode
    ? `${API_BASE}/players/${editingPlayerId}`
    : `${API_BASE}/players`;

  const method = isEditMode ? "PUT" : "POST";

  try {
    setPlayerManagementMessage(
      isEditMode ? "Saving player changes..." : "Adding player...",
      false
    );

    setPlayerManagementSavingState(true);

    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      if (res.status === 401) {
        setPlayerManagementMessage("Session expired. Please login again.", true);
      } else if (res.status === 403) {
        setPlayerManagementMessage("Access denied.", true);
      } else {
        setPlayerManagementMessage(data.message || "Could not save player.", true);
      }

      return;
    }

    setPlayerManagementMessage(
      isEditMode ? "✅ Player updated successfully." : "✅ Player added successfully.",
      false
    );

    resetPlayerManagementForm(false);
    await loadPlayerManagementList();

    if (currentTab !== "Player Management") {
      await loadPlayers();
    }

  } catch (err) {
    console.error("Save player error:", err);
    setPlayerManagementMessage("Server error saving player.", true);
  } finally {
    setPlayerManagementSavingState(false);
  }
}

function resetPlayerManagementForm(clearMessage = true) {
  playerManagementMode = "add";
  editingPlayerId = null;
  isPlayerManagementFormExpanded = false;

  const title = document.getElementById("playerFormTitle");
  const saveBtn = document.getElementById("pmSavePlayerBtn");
  const cancelBtn = document.getElementById("pmCancelEditBtn");

  if (title) title.textContent = "Add New Player";
  if (saveBtn) saveBtn.textContent = "Add Player";
  if (cancelBtn) cancelBtn.classList.add("hidden");

  const today = new Date().toISOString().split("T")[0];

  const fieldDefaults = {
    pmPlayerNumber: "",
    pmBirthYear: "",
    pmGender: "",
    pmFirstName: "",
    pmLastName: "",
    pmDateOfBirth: "",
    pmStartDate: today,
    pmParentName: "",
    pmParentPhone: "",
    pmParentEmail: "",
    pmParent2Name: "",
    pmParent2Phone: "",
    pmStreetAddress: "",
    pmCity: "",
    pmState: "",
    pmZipCode: "",
    pmEmergencyContactName: "",
    pmEmergencyContactRelationship: "",
    pmEmergencyContactPhone: "",
    pmEmergencyContactAltPhone: "",
    pmEmergencyNotes: "",
    pmSnackPreference: "Bring Snack",
    pmPaperworkStatus: "Not Received",
    pmPhotoReleaseStatus: "Not Received",
    pmPhotoReleaseFormReceived: "0",
    pmIsActive: "1",
    pmEndDate: ""
  };

  Object.entries(fieldDefaults).forEach(([id, value]) => {
    const element = document.getElementById(id);

    if (element) {
      element.value = value;
    }
  });

  if (clearMessage) {
    setPlayerManagementMessage("", false);
    ensurePlayerManagementForm();
  }
}

function editPlayer(playerId) {
  const player = latestManagedPlayers.find(
    item => Number(item.PlayerID) === Number(playerId)
  );

  if (!player) {
    alert("Player not found in current list.");
    return;
  }

  playerManagementMode = "edit";
editingPlayerId = player.PlayerID;
isPlayerManagementFormExpanded = true;

ensurePlayerManagementForm();

/*
  Safety reset:
  ensurePlayerManagementForm() rebuilds the form, so keep edit mode locked
  after the form exists.
*/
playerManagementMode = "edit";
editingPlayerId = player.PlayerID;

  const title = document.getElementById("playerFormTitle");
  const saveBtn = document.getElementById("pmSavePlayerBtn");
  const cancelBtn = document.getElementById("pmCancelEditBtn");

  if (title) title.textContent = `Edit Player: ${player.FirstName} ${player.LastName}`;
  if (saveBtn) saveBtn.textContent = "Save Changes";
  if (cancelBtn) cancelBtn.classList.remove("hidden");

  const values = {
    pmPlayerNumber: safeValue(player.PlayerNumber),
    pmBirthYear: safeValue(player.BirthYear || player.GroupCode || ""),
    pmGender: safeValue(player.Gender || ""),
    pmFirstName: safeValue(player.FirstName),
    pmLastName: safeValue(player.LastName),
    pmDateOfBirth: formatDateForInput(player.DateOfBirth),
    pmStartDate: formatDateForInput(player.StartDate),
    pmParentName: safeValue(player.ParentName),
    pmParentPhone: safeValue(player.ParentPhone),
    pmParentEmail: safeValue(player.ParentEmail),
    pmParent2Name: safeValue(player.Parent2Name),
    pmParent2Phone: safeValue(player.Parent2Phone),
    pmStreetAddress: safeValue(player.StreetAddress),
    pmCity: safeValue(player.City),
    pmState: safeValue(player.State),
    pmZipCode: safeValue(player.ZipCode),
    pmEmergencyContactName: safeValue(player.EmergencyContactName),
    pmEmergencyContactRelationship: safeValue(player.EmergencyContactRelationship),
    pmEmergencyContactPhone: safeValue(player.EmergencyContactPhone),
    pmEmergencyContactAltPhone: safeValue(player.EmergencyContactAltPhone),
    pmEmergencyNotes: safeValue(player.EmergencyNotes),
    pmSnackPreference: player.SnackPreference === "Paid Out" ? "Paid Out" : "Bring Snack",
    pmPaperworkStatus:
      player.PaperworkStatus === "Complete" ||
      player.PaperworkStatus === "Missing" ||
      player.PaperworkStatus === "Not Received"
        ? player.PaperworkStatus
        : "Not Received",
    pmPhotoReleaseStatus:
      player.PhotoReleaseStatus === "Opt In" ||
      player.PhotoReleaseStatus === "Opt Out" ||
      player.PhotoReleaseStatus === "Not Received"
        ? player.PhotoReleaseStatus
        : "Not Received",
    pmPhotoReleaseFormReceived: player.PhotoReleaseFormReceived ? "1" : "0",
    pmIsActive: player.IsActive ? "1" : "0",
    pmEndDate: formatDateForInput(player.EndDate)
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);

    if (element) {
      element.value = value;
    }
  });

  setPlayerManagementMessage(
    "Editing player. Make changes, then click Save Changes.",
    false
  );

  if (addPlayerSection) {
    addPlayerSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function loadPlayerManagementList() {
  if (!playerManagementList) return;

  ensurePlayerManagementForm();
  ensurePlayerManagementFilters();

  const searchText = playerSearchInput ? playerSearchInput.value.trim() : "";
  const includeInactive =
    showInactivePlayersToggle && showInactivePlayersToggle.checked;

  const params = new URLSearchParams();

  if (searchText) {
    params.set("search", searchText);
  }

  if (includeInactive) {
    params.set("includeInactive", "1");
  }

  const url = params.toString()
    ? `${API_BASE}/players/manage?${params.toString()}`
    : `${API_BASE}/players/manage`;

  try {
    playerManagementList.innerHTML = `
      <div class="roster-empty-message">Loading players...</div>
    `;

    const res = await fetch(url, {
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      playerManagementList.innerHTML = `
        <div class="roster-empty-message">Could not load players.</div>
      `;
      return;
    }

    latestManagedPlayers = data.players || [];
    playerManagementPageIndex = 0;
    updatePlayerManagementQuickCounts();
    renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));

  } catch (err) {
    console.error("Player management load error:", err);

    playerManagementList.innerHTML = `
      <div class="roster-empty-message">Could not load players.</div>
    `;
  }
}

function renderPlayerManagementList(players) {
  if (!playerManagementList) return;

  const activeCount = players.filter(player => player.IsActive).length;
  const inactiveCount = players.filter(player => !player.IsActive).length;
  const totalPlayers = players.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalPlayers / PLAYER_MANAGEMENT_PAGE_SIZE)
  );

  if (playerManagementPageIndex < 0) {
    playerManagementPageIndex = 0;
  }

  if (playerManagementPageIndex > totalPages - 1) {
    playerManagementPageIndex = totalPages - 1;
  }

  const startIndex = playerManagementPageIndex * PLAYER_MANAGEMENT_PAGE_SIZE;
  const endIndex = Math.min(startIndex + PLAYER_MANAGEMENT_PAGE_SIZE, totalPlayers);
  const visiblePlayers = players.slice(startIndex, endIndex);

  if (playerManagementSummary) {
    const filteredCount = players.length;
    const totalRosterCount = latestManagedPlayers.length;
    const filterDescription = getPlayerManagementFilterDescription();

    playerManagementSummary.textContent =
      `Active: ${activeCount} | Inactive: ${inactiveCount} | Showing ${totalPlayers ? startIndex + 1 : 0}-${endIndex} of ${filteredCount} filtered / ${totalRosterCount} total${filterDescription}`;
  }

  playerManagementList.innerHTML = "";

  if (!players.length) {
    playerManagementList.innerHTML = `
      <div class="roster-empty-message">No players found.</div>
    `;
    return;
  }

  const nav = document.createElement("div");
  nav.className = "player-card-scroll-nav";

  nav.innerHTML = `
    <button type="button" class="btn btn-secondary" id="playerCardsPrevBtn" ${playerManagementPageIndex === 0 ? "disabled" : ""}>
      ← Previous 10
    </button>

    <span class="player-card-page-label">
      Showing ${startIndex + 1}-${endIndex} of ${totalPlayers}
    </span>

    <button type="button" class="btn btn-secondary" id="playerCardsNextBtn" ${playerManagementPageIndex >= totalPages - 1 ? "disabled" : ""}>
      Next 10 →
    </button>
  `;

  playerManagementList.appendChild(nav);

  const scrollRow = document.createElement("div");
  scrollRow.className = "player-card-scroll-row";

  visiblePlayers.forEach(player => {
    const card = document.createElement("div");

    card.className =
      `player-management-row player-management-card-scroll-item ${player.IsActive ? "" : "inactive-player"}`;

    const groupLabel = player.GroupName || player.GroupCode || "No Group";

    const playerNumber =
      player.PlayerNumber === 0 || player.PlayerNumber
        ? `#${player.PlayerNumber}`
        : "No #";

    const statusLabel = getPlayerStatusLabel(player);
    const canToggle = canManagePlayers();
    const genderLabel = formatGenderShort(player.Gender);
    const parent1Name = player.ParentName || "No parent name entered";
    const parent1Phone = player.ParentPhone || "No phone entered";
    const parentEmail = player.ParentEmail || "No email entered";
    const parent2Name = player.Parent2Name || "";
    const parent2Phone = player.Parent2Phone || "";

    card.dataset.playerId = player.PlayerID;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `View details for ${player.FirstName} ${player.LastName}`);

    card.innerHTML = `
      <div class="player-management-info">
        <div class="player-card-header-row">
          <div class="player-card-title-block">
            <div class="player-management-name">${player.FirstName} ${player.LastName}</div>
            <div class="player-card-badge-row" aria-label="Player quick identifiers">
              <span class="player-card-badge player-number-badge">${playerNumber}</span>
              <span class="player-card-badge">${player.BirthYear || "-"}</span>
              <span class="player-card-badge">${genderLabel}</span>
            </div>
          </div>
          <div class="player-management-status ${player.IsActive ? "active-status" : "inactive-status"}">${statusLabel}</div>
        </div>

        <div class="player-card-contact-block">
          <div class="player-management-card-line"><span>Parent 1:</span> <strong>${parent1Name}</strong></div>
          <div class="player-management-card-line"><span>Phone:</span> <strong>${parent1Phone}</strong></div>
          <div class="player-management-card-line"><span>Email:</span> <strong>${parentEmail}</strong></div>
          ${parent2Name || parent2Phone
            ? `<div class="player-management-card-line"><span>Parent 2:</span> <strong>${parent2Name || "-"}${parent2Phone ? ` | ${parent2Phone}` : ""}</strong></div>`
            : ""}
        </div>
      </div>

      <div class="player-management-actions">
        <button type="button" class="btn btn-secondary player-view-details-btn" data-player-id="${player.PlayerID}">
          View Details
        </button>

        ${canToggle
          ? `
            <button type="button" class="btn btn-secondary player-edit-btn" data-player-id="${player.PlayerID}">
              Edit
            </button>

            <button type="button" class="btn btn-secondary player-status-toggle" data-player-id="${player.PlayerID}" data-is-active="${player.IsActive ? "1" : "0"}">
              ${player.IsActive ? "Make Inactive" : "Make Active"}
            </button>
          `
          : ""}
      </div>
    `;

    card.addEventListener("click", event => {
      if (event.target.closest("button")) return;
      showPlayerDetails(player.PlayerID);
    });

    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showPlayerDetails(player.PlayerID);
      }
    });

    scrollRow.appendChild(card);
  });

  playerManagementList.appendChild(scrollRow);

  const prevBtn = document.getElementById("playerCardsPrevBtn");
  const nextBtn = document.getElementById("playerCardsNextBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      playerManagementPageIndex -= 1;
      renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      playerManagementPageIndex += 1;
      renderPlayerManagementList(getFilteredManagedPlayers(latestManagedPlayers));
    });
  }

  playerManagementList.querySelectorAll(".player-view-details-btn").forEach(button => {
    button.addEventListener("click", () => {
      showPlayerDetails(Number(button.dataset.playerId));
    });
  });

  playerManagementList.querySelectorAll(".player-edit-btn").forEach(button => {
    button.addEventListener("click", () => {
      editPlayer(Number(button.dataset.playerId));
    });
  });

  playerManagementList.querySelectorAll(".player-status-toggle").forEach(button => {
    button.addEventListener("click", async () => {
      const playerId = Number(button.dataset.playerId);
      const isCurrentlyActive = button.dataset.isActive === "1";

      await updatePlayerActiveStatus(playerId, !isCurrentlyActive);
    });
  });
}

async function updatePlayerActiveStatus(playerId, makeActive) {
  if (!playerId) return;

  const confirmed = confirm(
    makeActive
      ? "Make this player active again?"
      : "Make this player inactive? They will no longer appear in attendance lists."
  );

  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE}/players/${playerId}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        isActive: makeActive
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.message || "Could not update player status.");
      return;
    }

    await loadPlayerManagementList();

  } catch (err) {
    console.error("Update player status error:", err);
    alert("Could not update player status.");
  }
}

/* =========================
   ADD PLAYER

   This wrapper keeps the existing Add Player button compatible.
   The new Player Management form uses savePlayerManagementForm().
   ========================= */
async function addPlayer() {
  await savePlayerManagementForm();
}
