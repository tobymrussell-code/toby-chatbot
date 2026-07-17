const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MIME_EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
};

function extensionFor(mimeType) {
  return MIME_EXT[mimeType] || "jpg";
}

function storagePathForAsset(assetId, mimeType) {
  const filename = `${assetId}.${extensionFor(mimeType)}`;
  return path.join(UPLOAD_DIR, filename);
}

function publicFilenameFromPath(storagePath) {
  return path.basename(storagePath);
}

function writeAssetFile(storagePath, buffer) {
  fs.writeFileSync(storagePath, buffer);
}

function assetFileExists(storagePath) {
  return fs.existsSync(storagePath);
}

module.exports = {
  UPLOAD_DIR,
  storagePathForAsset,
  publicFilenameFromPath,
  writeAssetFile,
  assetFileExists,
};
