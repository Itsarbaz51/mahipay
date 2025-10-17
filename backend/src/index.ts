import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // Always load env first

import Prisma from "./db/db.js";
import app from "./app.js";
import { envConfig } from "./config/env.config.js";
import logger from "./utils/WinstonLogger.js";
import { redisConnection } from "./db/redis.js";

(async function main() {
  try {
    logger.info("Connecting to database...");
    await Prisma.$connect();
    logger.info("✅ Database connected");

    logger.info("Connecting to Redis...");
    await redisConnection();
    logger.info("✅ Redis is ready");

    const PORT = envConfig.PORT || 8000;
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Startup error:", error);
    logger.error(
      `❌ Startup error: ${error instanceof Error ? error.message : error}`
    );
    process.exit(1);
  }
})();
