const express = require("express");
const models = require("../db/models");

const router = express.Router();

// POST /api/v1/anonymous-sessions
router.post("/", (req, res) => {
  const deviceInfo = req.body && req.body.deviceInfo ? req.body.deviceInfo : null;
  const session = models.createAnonymousSession(deviceInfo);
  res.status(201).json(session);
});

module.exports = router;
