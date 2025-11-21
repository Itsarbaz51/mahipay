import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // load env first

import sequelize from "./db/db.js";
import app from "./app.js";

(async function main() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // 🔥 Auto Sync All Models
    await sequelize.sync({ alter: true });
    console.log("🔄 Models synchronized with database");

    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Startup error:", error);
    process.exit(1);
  }
})();
