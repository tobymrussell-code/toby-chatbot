const express = require("express");
const { randomUUID } = require("crypto");
const models = require("../db/models");
const storage = require("../services/storage");
const { detectRoomType, ROOM_TYPES } = require("../services/claude");
const { isDev } = require("../middleware/devLog");

const router = express.Router();

function baseUrl(req) {
  return process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
}

// POST /api/v1/photo-intake/upload-authorizations
router.post("/upload-authorizations", (req, res) => {
  const { planningSessionId, mimeType, byteSize, width, height } = req.body || {};
  if (!planningSessionId) {
    return res.status(400).json({ error: { message: "planningSessionId is required" } });
  }
  const session = models.getPlanningSession(planningSessionId);
  if (!session) return res.status(404).json({ error: { message: "planning session not found" } });

  const allowedMime = ["image/jpeg", "image/jpg", "image/png"];
  const mime = allowedMime.includes(mimeType) ? mimeType : "image/jpeg";

  const id = randomUUID();
  const storagePath = storage.storagePathForAsset(id, mime);

  const asset = models.createPhotoAsset({
    id,
    planningSessionId,
    mimeType: mime,
    byteSize,
    width,
    height,
    storagePath,
  });

  const responseBody = {
    assetId: asset.id,
    uploadUrl: `${baseUrl(req)}/api/v1/photo-intake/assets/${asset.id}/upload`,
    method: "PUT",
    headers: { "Content-Type": mime },
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
  if (isDev) console.log("[dev] upload-authorizations response:", responseBody);
  res.status(201).json(responseBody);
});

// PUT /api/v1/photo-intake/assets/:assetId/upload  (raw binary body)
router.put(
  "/assets/:assetId/upload",
  express.raw({ type: () => true, limit: "30mb" }),
  (req, res) => {
    const asset = models.getPhotoAsset(req.params.assetId);
    if (!asset) return res.status(404).json({ error: { message: "asset not found" } });
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: { message: "empty upload body" } });
    }

    storage.writeAssetFile(asset.storagePath, req.body);
    const updated = models.updatePhotoAssetStatus(asset.id, "uploaded", { byteSize: req.body.length });
    const responseBody = { assetId: updated.id, uploadStatus: updated.uploadStatus, byteSize: updated.byteSize };
    if (isDev) console.log("[dev] upload completion response:", responseBody);
    res.json(responseBody);
  }
);

// POST /api/v1/photo-intake/assets/:assetId/complete
router.post("/assets/:assetId/complete", async (req, res) => {
  const asset = models.getPhotoAsset(req.params.assetId);
  if (!asset) return res.status(404).json({ error: { message: "asset not found" } });
  if (!storage.assetFileExists(asset.storagePath)) {
    return res.status(409).json({ error: { message: "asset file has not been uploaded yet" } });
  }

  models.updatePhotoAssetStatus(asset.id, "processing");
  models.setPlanningSessionOriginalAsset(asset.planningSessionId, asset.id);

  try {
    const detectedRoomType = await detectRoomType(asset.storagePath, asset.mimeType);
    const updated = models.updatePhotoAssetStatus(asset.id, "processed", { detectedRoomType });
    res.json({
      assetId: updated.id,
      uploadStatus: updated.uploadStatus,
      detectedRoomType: updated.detectedRoomType,
      roomTypeOptions: ROOM_TYPES,
    });
  } catch (err) {
    models.updatePhotoAssetStatus(asset.id, "failed");
    console.error("[photo-intake] room detection failed:", err.message);
    res.status(502).json({
      error: { message: "We could not analyze that photo right now. Please try again." },
      assetId: asset.id,
      uploadStatus: "failed",
      roomTypeOptions: ROOM_TYPES,
    });
  }
});

// POST /api/v1/photo-intake/assets/:assetId/download-authorizations
router.post("/assets/:assetId/download-authorizations", (req, res) => {
  const asset = models.getPhotoAsset(req.params.assetId);
  if (!asset) return res.status(404).json({ error: { message: "asset not found" } });
  const filename = storage.publicFilenameFromPath(asset.storagePath);
  res.json({
    assetId: asset.id,
    downloadUrl: `${baseUrl(req)}/uploads/${filename}`,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });
});

// POST /api/v1/photo-intake/room-confirmations
router.post("/room-confirmations", (req, res) => {
  const { planningSessionId, confirmedRoomType } = req.body || {};
  if (!planningSessionId || !confirmedRoomType) {
    return res.status(400).json({ error: { message: "planningSessionId and confirmedRoomType are required" } });
  }
  if (!ROOM_TYPES.includes(confirmedRoomType)) {
    return res.status(400).json({ error: { message: `invalid confirmedRoomType: ${confirmedRoomType}` } });
  }
  const session = models.getPlanningSession(planningSessionId);
  if (!session) return res.status(404).json({ error: { message: "planning session not found" } });

  const updated = models.setPlanningSessionRoomType(planningSessionId, confirmedRoomType);
  res.status(201).json(updated);
});

module.exports = router;
