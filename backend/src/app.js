const express = require("express");
const cors = require("cors");

const anonymousSessions = require("./routes/anonymousSessions");
const planningSessions = require("./routes/planningSessions");
const photoIntake = require("./routes/photoIntake");
const reports = require("./routes/reports");
const leads = require("./routes/leads");
const { UPLOAD_DIR } = require("./services/storage");
const { devLog } = require("./middleware/devLog");

const app = express();

app.use(cors());
app.use(devLog);

// JSON body parsing for everything except the raw binary upload route.
app.use((req, res, next) => {
  if (req.method === "PUT" && /\/photo-intake\/assets\/[^/]+\/upload$/.test(req.path)) {
    return next();
  }
  express.json({ limit: "2mb" })(req, res, next);
});

app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/v1/anonymous-sessions", anonymousSessions);
app.use("/api/v1/planning-sessions", planningSessions);
app.use("/api/v1/photo-intake", photoIntake);
app.use("/api/v1/reports", reports);
app.use("/api/v1/leads", leads);

app.use((req, res) => {
  res.status(404).json({ error: { message: "not found" } });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[unhandled error]", err);
  res.status(500).json({ error: { message: "internal server error" } });
});

module.exports = app;
