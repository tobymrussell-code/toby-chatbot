const { randomUUID } = require("crypto");
const db = require("./index");

function now() {
  return new Date().toISOString();
}

// ---- anonymous_sessions ----

function createAnonymousSession(deviceInfo) {
  const id = randomUUID();
  const ts = now();
  db.prepare(
    `INSERT INTO anonymous_sessions (id, device_info, created_at, updated_at) VALUES (?, ?, ?, ?)`
  ).run(id, deviceInfo ? JSON.stringify(deviceInfo) : null, ts, ts);
  return getAnonymousSession(id);
}

function getAnonymousSession(id) {
  const row = db.prepare(`SELECT * FROM anonymous_sessions WHERE id = ?`).get(id);
  if (!row) return null;
  return {
    id: row.id,
    deviceInfo: row.device_info ? JSON.parse(row.device_info) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---- planning_sessions ----

function createPlanningSession(anonymousSessionId) {
  const id = randomUUID();
  const ts = now();
  db.prepare(
    `INSERT INTO planning_sessions (id, anonymous_session_id, created_at, updated_at)
     VALUES (?, ?, ?, ?)`
  ).run(id, anonymousSessionId, ts, ts);
  return getPlanningSession(id);
}

function mapPlanningSession(row) {
  if (!row) return null;
  return {
    id: row.id,
    anonymousSessionId: row.anonymous_session_id,
    confirmedRoomType: row.confirmed_room_type,
    goalPath: row.goal_path,
    investorStrategy: row.investor_strategy,
    styleDirection: row.style_direction,
    originalImageAssetId: row.original_image_asset_id,
    enhancedImageAssetId: row.enhanced_image_asset_id,
    reportId: row.report_id,
    setupCompletedAt: row.setup_completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getPlanningSession(id) {
  const row = db.prepare(`SELECT * FROM planning_sessions WHERE id = ?`).get(id);
  return mapPlanningSession(row);
}

function updatePlanningSessionSetup(id, { goalPath, investorStrategy, styleDirection }) {
  const existing = getPlanningSession(id);
  if (!existing) return null;
  const ts = now();
  const nextGoal = goalPath !== undefined ? goalPath : existing.goalPath;
  const nextInvestor = investorStrategy !== undefined ? investorStrategy : existing.investorStrategy;
  const nextStyle = styleDirection !== undefined ? styleDirection : existing.styleDirection;
  const setupCompletedAt = nextGoal && nextStyle ? ts : existing.setupCompletedAt;
  db.prepare(
    `UPDATE planning_sessions
     SET goal_path = ?, investor_strategy = ?, style_direction = ?, setup_completed_at = ?, updated_at = ?
     WHERE id = ?`
  ).run(nextGoal, nextInvestor, nextStyle, setupCompletedAt, ts, id);
  return getPlanningSession(id);
}

function updatePlanningSessionField(id, field, value) {
  const ts = now();
  db.prepare(`UPDATE planning_sessions SET ${field} = ?, updated_at = ? WHERE id = ?`).run(value, ts, id);
  return getPlanningSession(id);
}

function setPlanningSessionRoomType(id, confirmedRoomType) {
  return updatePlanningSessionField(id, "confirmed_room_type", confirmedRoomType);
}

function setPlanningSessionOriginalAsset(id, assetId) {
  return updatePlanningSessionField(id, "original_image_asset_id", assetId);
}

function setPlanningSessionReport(id, reportId) {
  return updatePlanningSessionField(id, "report_id", reportId);
}

// ---- photo_assets ----

function createPhotoAsset({ id, planningSessionId, mimeType, byteSize, width, height, storagePath }) {
  id = id || randomUUID();
  const ts = now();
  db.prepare(
    `INSERT INTO photo_assets
      (id, planning_session_id, mime_type, byte_size, width, height, storage_path, upload_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
  ).run(id, planningSessionId, mimeType || null, byteSize || null, width || null, height || null, storagePath, ts, ts);
  return getPhotoAsset(id);
}

function mapPhotoAsset(row) {
  if (!row) return null;
  return {
    id: row.id,
    planningSessionId: row.planning_session_id,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    width: row.width,
    height: row.height,
    storagePath: row.storage_path,
    uploadStatus: row.upload_status,
    detectedRoomType: row.detected_room_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getPhotoAsset(id) {
  const row = db.prepare(`SELECT * FROM photo_assets WHERE id = ?`).get(id);
  return mapPhotoAsset(row);
}

function updatePhotoAssetStatus(id, uploadStatus, extra = {}) {
  const ts = now();
  const fields = ["upload_status = ?", "updated_at = ?"];
  const values = [uploadStatus, ts];
  if (extra.byteSize !== undefined) {
    fields.push("byte_size = ?");
    values.push(extra.byteSize);
  }
  if (extra.detectedRoomType !== undefined) {
    fields.push("detected_room_type = ?");
    values.push(extra.detectedRoomType);
  }
  values.push(id);
  db.prepare(`UPDATE photo_assets SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getPhotoAsset(id);
}

// ---- reports ----

function createReport({ planningSessionId, reportJson, summary }) {
  const id = randomUUID();
  const ts = now();
  db.prepare(
    `INSERT INTO reports (id, planning_session_id, report_json, summary, generated_at, version)
     VALUES (?, ?, ?, ?, ?, 1)`
  ).run(id, planningSessionId, JSON.stringify(reportJson), summary || null, ts);
  return getReport(id);
}

function mapReport(row) {
  if (!row) return null;
  return {
    id: row.id,
    planningSessionId: row.planning_session_id,
    reportJson: JSON.parse(row.report_json),
    summary: row.summary,
    generatedAt: row.generated_at,
    version: row.version,
  };
}

function getReport(id) {
  const row = db.prepare(`SELECT * FROM reports WHERE id = ?`).get(id);
  return mapReport(row);
}

// ---- leads ----

function createLead({ planningSessionId, name, email, phone, propertyAddress, intent }) {
  const id = randomUUID();
  const ts = now();
  db.prepare(
    `INSERT INTO leads (id, planning_session_id, name, email, phone, property_address, intent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, planningSessionId, name || null, email || null, phone || null, propertyAddress || null, intent || null, ts);
  return getLead(id);
}

function mapLead(row) {
  if (!row) return null;
  return {
    id: row.id,
    planningSessionId: row.planning_session_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    propertyAddress: row.property_address,
    intent: row.intent,
    createdAt: row.created_at,
  };
}

function getLead(id) {
  const row = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(id);
  return mapLead(row);
}

module.exports = {
  createAnonymousSession,
  getAnonymousSession,
  createPlanningSession,
  getPlanningSession,
  updatePlanningSessionSetup,
  setPlanningSessionRoomType,
  setPlanningSessionOriginalAsset,
  setPlanningSessionReport,
  createPhotoAsset,
  getPhotoAsset,
  updatePhotoAssetStatus,
  createReport,
  getReport,
  createLead,
  getLead,
};
