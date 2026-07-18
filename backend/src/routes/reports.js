const express = require("express");
const models = require("../db/models");
const { generateReport, DISCLAIMER } = require("../services/claude");
const { isDev } = require("../middleware/devLog");

const router = express.Router();

// POST /api/v1/reports
router.post("/", async (req, res) => {
  const { planningSessionId } = req.body || {};
  if (!planningSessionId) {
    return res.status(400).json({ error: { message: "planningSessionId is required" } });
  }
  const session = models.getPlanningSession(planningSessionId);
  if (!session) return res.status(404).json({ error: { message: "planning session not found" } });
  if (!session.confirmedRoomType) {
    return res.status(400).json({ error: { message: "room type has not been confirmed for this session" } });
  }
  if (!session.goalPath) {
    return res.status(400).json({ error: { message: "goal path has not been selected for this session" } });
  }
  if (!session.styleDirection) {
    return res.status(400).json({ error: { message: "style direction has not been selected for this session" } });
  }
  if (!session.originalImageAssetId) {
    return res.status(400).json({ error: { message: "no photo has been uploaded for this session" } });
  }

  const asset = models.getPhotoAsset(session.originalImageAssetId);
  if (!asset) return res.status(404).json({ error: { message: "photo asset not found" } });

  try {
    const reportJson = await generateReport({
      filePath: asset.storagePath,
      mimeType: asset.mimeType,
      roomType: session.confirmedRoomType,
      goalPath: session.goalPath,
      investorStrategy: session.investorStrategy,
      styleDirection: session.styleDirection,
    });
    reportJson.disclaimer = DISCLAIMER;

    const summary = reportJson && reportJson.summary ? reportJson.summary.bestNextMove : null;
    const report = models.createReport({ planningSessionId, reportJson, summary });
    models.setPlanningSessionReport(planningSessionId, report.id);

    if (isDev) console.log("[dev] report generation response:", JSON.stringify(report).slice(0, 2000));
    res.status(201).json(report);
  } catch (err) {
    console.error("[reports] generation failed:", err.message);
    res.status(502).json({
      error: {
        message: "We could not build your renovation plan right now. Please try again.",
      },
    });
  }
});

// GET /api/v1/reports/:id
router.get("/:id", (req, res) => {
  const report = models.getReport(req.params.id);
  if (!report) return res.status(404).json({ error: { message: "report not found" } });
  res.json(report);
});

module.exports = router;
