// app.11.search.js — Shared player search utilities used across the app
// Supports comma-separated terms, searches: name, first name, last name, player number

/**
 * Normalize search input — lowercase, strip special chars except commas
 */
function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/#/g, " ")
    .replace(/[^a-z0-9,]+/g, " ")  // preserve commas
    .replace(/\s*,\s*/g, ",")       // clean spaces around commas
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse comma-separated search into array of terms
 * e.g. "john, 21, garcia" -> ["john", "21", "garcia"]
 */
function parseSearchTerms(searchText) {
  if (!searchText) return [];
  return searchText
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);
}

/**
 * Build a searchable string from a player row (player data only, no parent/contact info)
 * Searches: first name, last name, full name, player number, birth year, gender
 */
function buildPlayerSearchText(player) {
  return [
    player.FirstName || player.firstName || "",
    player.LastName  || player.lastName  || "",
    player.PlayerNumber != null ? String(player.PlayerNumber) : "",
    player.BirthYear  || player.birthYear  || "",
    player.Gender     || player.gender     || "",
    player.GroupCode  || "",
    player.GroupName  || ""
  ].join(" ").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Check if a single term matches a player's search text
 */
function searchTermMatchesPlayer(term, playerSearchText) {
  if (!term) return true;
  const tokens = playerSearchText.split(" ");
  return tokens.includes(term) || playerSearchText.includes(term);
}

/**
 * Check if ALL search terms match a player (AND logic between terms)
 * Exception: if ALL terms are numeric, use OR logic (e.g. "21, 99, 10" shows any of those numbers)
 */
function playerMatchesSearch(player, searchTerms) {
  if (!searchTerms || searchTerms.length === 0) return true;
  const text = buildPlayerSearchText(player);
  const allNumeric = searchTerms.every(t => /^\d+$/.test(t));
  if (allNumeric) {
    // OR logic: player matches if ANY term matches
    return searchTerms.some(term => searchTermMatchesPlayer(term, text));
  }
  // AND logic: player must match ALL terms
  return searchTerms.every(term => searchTermMatchesPlayer(term, text));
}

/**
 * Filter a player array by a raw search string
 * Used by attendance, player management, etc.
 */
function filterPlayersBySearch(players, rawSearch) {
  if (!rawSearch || !rawSearch.trim()) return players;
  const terms = parseSearchTerms(normalizeSearchText(rawSearch));
  if (terms.length === 0) return players;
  return players.filter(p => playerMatchesSearch(p, terms));
}

// Expose globally
window.normalizeSearchText     = normalizeSearchText;
window.parseSearchTerms        = parseSearchTerms;
window.buildPlayerSearchText   = buildPlayerSearchText;
window.playerMatchesSearch     = playerMatchesSearch;
window.filterPlayersBySearch   = filterPlayersBySearch;