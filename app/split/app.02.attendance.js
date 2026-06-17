const express = require("express");
const router = express.Router();
const { getConnection, sql } = require("../db");
const { requireLogin } = require("../middleware/auth");

/* =========================================================
FONTANA FIRE FC ATTENDANCE API
ATTENDANCE ROUTES

Frontend expectations:
- GET /api/attendance/:eventId returns an ARRAY.
- POST /api/attendance returns { success: true/false }.

Auth note:
- By default, routes require login.
- For emergency troubleshooting, set env ALLOW_NOAUTH=1 to bypass requireLogin.
  (Do NOT use in production.)
========================================================= */

const requireLoginOrBypass = (req, res, next) => {
  if (process.env.ALLOW_NOAUTH === "1") return next();
  return requireLogin(req, res, next);
};

const VALID_STATUSES = new Set(["Present", "Absent", "Excused", "Cancelled"]);

async function loadSelectedEvent(pool, eventId) {
  const result = await pool
    .request()
    .input("EventID", sql.Int, Number(eventId))
    .query(`
      SELECT EventID, GroupID, EventDate, EventType, EventName
      FROM dbo.Events
      WHERE EventID = @EventID
    `);

  return result.recordset && result.recordset.length ? result.recordset[0] : null;
}

async function resolveTargetEventId(pool, selectedEvent, playerId) {
  if (!selectedEvent) return null;

  // Practice is group-based — UNLESS the event has no GroupID (all-group practice).
  // For NULL GroupID events, save attendance directly against the selected EventID.
  if (selectedEvent.EventType === "Practice") {
    if (!selectedEvent.GroupID) {
      return selectedEvent.EventID;
    }

    const practiceResult = await pool
      .request()
      .input("PlayerID", sql.Int, Number(playerId))
      .input("EventDate", sql.Date, selectedEvent.EventDate)
      .input("EventType", sql.VarChar(20), selectedEvent.EventType)
      .input("EventName", sql.VarChar(150), selectedEvent.EventName || "")
      .query(`
        SELECT TOP 1 e.EventID
        FROM dbo.Players p
        INNER JOIN dbo.Events e ON e.GroupID = p.GroupID
        WHERE p.PlayerID = @PlayerID
          AND e.EventDate = @EventDate
          AND e.EventType = @EventType
          AND ISNULL(e.EventName, '') = @EventName
        ORDER BY e.EventID
      `);

    return practiceResult.recordset && practiceResult.recordset.length
      ? practiceResult.recordset[0].EventID
      : null;
  }

  // Games and Team Events are roster-based.
  const rosterResult = await pool
    .request()
    .input("PlayerID", sql.Int, Number(playerId))
    .input("EventDate", sql.Date, selectedEvent.EventDate)
    .input("EventType", sql.VarChar(20), selectedEvent.EventType)
    .input("EventName", sql.VarChar(150), selectedEvent.EventName || "")
    .query(`
      SELECT TOP 1 e.EventID
      FROM dbo.Events e
      INNER JOIN dbo.EventPlayers ep ON e.EventID = ep.EventID
      WHERE ep.PlayerID = @PlayerID
        AND ep.IsExpected = 1
        AND e.EventDate = @EventDate
        AND e.EventType = @EventType
        AND ISNULL(e.EventName, '') = @EventName
      ORDER BY e.EventID
    `);

  return rosterResult.recordset && rosterResult.recordset.length
    ? rosterResult.recordset[0].EventID
    : null;
}

/* =========================================================
GET ATTENDANCE BY EVENT
Returns ARRAY.
========================================================= */
router.get("/:eventId", requireLoginOrBypass, async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    const allMatching = req.query.allMatching === "1";
    const pool = await getConnection();

    if (!allMatching) {
      const result = await pool
        .request()
        .input("EventID", sql.Int, eventId)
        .query(`
          SELECT EventID, PlayerID, AttendanceStatus
          FROM dbo.Attendance
          WHERE EventID = @EventID
        `);
      return res.json(result.recordset || []);
    }

    const selectedEvent = await loadSelectedEvent(pool, eventId);
    if (!selectedEvent) return res.json([]);

    const result = await pool
      .request()
      .input("EventDate", sql.Date, selectedEvent.EventDate)
      .input("EventType", sql.VarChar(20), selectedEvent.EventType)
      .input("EventName", sql.VarChar(150), selectedEvent.EventName || "")
      .query(`
        SELECT a.EventID, a.PlayerID, a.AttendanceStatus
        FROM dbo.Attendance a
        INNER JOIN dbo.Events e ON e.EventID = a.EventID
        WHERE e.EventDate = @EventDate
          AND e.EventType = @EventType
          AND ISNULL(e.EventName, '') = @EventName
      `);

    return res.json(result.recordset || []);
  } catch (err) {
    console.error("Error loading attendance:", err);
    return res.status(500).json([]);
  }
});

/* =========================================================
SAVE / UPDATE / CLEAR ATTENDANCE
Returns { success: true/false }.
========================================================= */
router.post("/", requireLoginOrBypass, async (req, res) => {
  try {
    const { eventId, attendance } = req.body || {};
    const allMatching = req.query.allMatching === "1";

    if (!eventId || !Array.isArray(attendance)) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const pool = await getConnection();
    const selectedEvent = await loadSelectedEvent(pool, eventId);

    if (!selectedEvent) {
      return res.status(400).json({ success: false, message: "Event not found" });
    }

    let savedCount = 0;
    let deletedCount = 0;
    let skippedCount = 0;

    for (const item of attendance) {
      const playerId = Number(item && item.playerId);
      const status = String(item && item.status ? item.status : "").trim();

      if (!playerId) {
        skippedCount++;
        continue;
      }

      let targetEventId = Number(eventId);

      if (allMatching) {
        const resolved = await resolveTargetEventId(pool, selectedEvent, playerId);
        if (!resolved) {
          skippedCount++;
          continue;
        }
        targetEventId = resolved;
      }

      if (status === "Clear" || status === "") {
        const del = await pool
          .request()
          .input("EventID", sql.Int, targetEventId)
          .input("PlayerID", sql.Int, playerId)
          .query(`
            DELETE FROM dbo.Attendance
            WHERE EventID = @EventID AND PlayerID = @PlayerID
          `);

        if (del.rowsAffected && del.rowsAffected[0] > 0) {
          deletedCount += del.rowsAffected[0];
        }
        continue;
      }

      if (!VALID_STATUSES.has(status)) {
        skippedCount++;
        continue;
      }

      await pool
        .request()
        .input("EventID", sql.Int, targetEventId)
        .input("PlayerID", sql.Int, playerId)
        .input("AttendanceStatus", sql.VarChar(20), status)
        .query(`
          MERGE dbo.Attendance AS target
          USING (SELECT @EventID AS EventID, @PlayerID AS PlayerID) AS source
            ON target.EventID = source.EventID AND target.PlayerID = source.PlayerID
          WHEN MATCHED THEN
            UPDATE SET AttendanceStatus = @AttendanceStatus, UpdatedAt = SYSDATETIME()
          WHEN NOT MATCHED THEN
            INSERT (EventID, PlayerID, AttendanceStatus, CreatedAt)
            VALUES (@EventID, @PlayerID, @AttendanceStatus, SYSDATETIME());
        `);

      savedCount++;
    }

    return res.json({ success: true, savedCount, deletedCount, skippedCount });
  } catch (err) {
    console.error("Error saving attendance:", err);
    return res.status(500).json({ success: false, message: "Error saving attendance" });
  }
});

module.exports = router;