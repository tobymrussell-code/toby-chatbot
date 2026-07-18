const isDev = (process.env.NODE_ENV || "development") !== "production";

function devLog(req, res, next) {
  if (isDev) {
    const isBinaryUpload = req.method === "PUT" && /\/upload$/.test(req.path);
    console.log(`[dev] ${req.method} ${req.path}${isBinaryUpload ? " (binary body)" : ""}`);
  }
  next();
}

module.exports = { devLog, isDev };
