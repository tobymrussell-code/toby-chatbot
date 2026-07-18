const express = require("express");
const models = require("../db/models");

const router = express.Router();

const VALID_INTENTS = ["selling", "buying", "investing", "improving"];

// POST /api/v1/leads
router.post("/", (req, res) => {
  const { planningSessionId, name, email, phone, propertyAddress, intent } = req.body || {};
  if (!planningSessionId) {
    return res.status(400).json({ error: { message: "planningSessionId is required" } });
  }
  if (!email) {
    return res.status(400).json({ error: { message: "email is required" } });
  }
  if (intent && !VALID_INTENTS.includes(intent)) {
    return res.status(400).json({ error: { message: `invalid intent: ${intent}` } });
  }
  const session = models.getPlanningSession(planningSessionId);
  if (!session) return res.status(404).json({ error: { message: "planning session not found" } });

  const lead = models.createLead({ planningSessionId, name, email, phone, propertyAddress, intent });
  console.log(`[LEAD] ${lead.name || "unknown"} <${lead.email}> (${lead.intent || "unspecified"})`);
  res.status(201).json(lead);
});

module.exports = router;
