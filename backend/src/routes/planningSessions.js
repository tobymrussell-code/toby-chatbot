const express = require("express");
const models = require("../db/models");
const { GOAL_LABELS, INVESTOR_LABELS, STYLE_LABELS } = require("../services/claude");

const router = express.Router();

// POST /api/v1/planning-sessions
router.post("/", (req, res) => {
  const { anonymousSessionId } = req.body || {};
  if (!anonymousSessionId) {
    return res.status(400).json({ error: { message: "anonymousSessionId is required" } });
  }
  const anon = models.getAnonymousSession(anonymousSessionId);
  if (!anon) {
    return res.status(404).json({ error: { message: "anonymous session not found" } });
  }
  const session = models.createPlanningSession(anonymousSessionId);
  res.status(201).json(session);
});

// GET /api/v1/planning-sessions/:id
router.get("/:id", (req, res) => {
  const session = models.getPlanningSession(req.params.id);
  if (!session) return res.status(404).json({ error: { message: "planning session not found" } });
  res.json(session);
});

// PATCH /api/v1/planning-sessions/:id/setup
router.patch("/:id/setup", (req, res) => {
  const existing = models.getPlanningSession(req.params.id);
  if (!existing) return res.status(404).json({ error: { message: "planning session not found" } });

  const { goalPath, investorStrategy, styleDirection } = req.body || {};

  if (goalPath !== undefined && goalPath !== null && !GOAL_LABELS[goalPath]) {
    return res.status(400).json({ error: { message: `invalid goalPath: ${goalPath}` } });
  }
  if (investorStrategy !== undefined && investorStrategy !== null && !INVESTOR_LABELS[investorStrategy]) {
    return res.status(400).json({ error: { message: `invalid investorStrategy: ${investorStrategy}` } });
  }
  if (styleDirection !== undefined && styleDirection !== null && !STYLE_LABELS[styleDirection]) {
    return res.status(400).json({ error: { message: `invalid styleDirection: ${styleDirection}` } });
  }

  const updated = models.updatePlanningSessionSetup(req.params.id, {
    goalPath,
    investorStrategy,
    styleDirection,
  });
  res.json(updated);
});

module.exports = router;
