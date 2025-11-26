import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import sequelize from "./db/db.js";
import app from "./app.js";

import "./models/index.js";

(async function main() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Sync all models for deployement add (force: false)
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
