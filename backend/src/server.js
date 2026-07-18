require("dotenv").config();

const app = require("./app");

const PORT = parseInt(process.env.PORT || "3000", 10);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Design on a Dime API listening on http://0.0.0.0:${PORT}`);
  console.log(`For a physical phone on the same Wi-Fi, use your computer's LAN IP, e.g. http://192.168.x.x:${PORT}/api/v1`);
});
