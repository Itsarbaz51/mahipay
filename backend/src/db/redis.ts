import { Redis } from "ioredis";
import type { RedisOptions } from "ioredis";
import logger from "../utils/WinstonLogger.js";

const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
  retryStrategy(times) {
    const delay = 5000;
    logger.warn(`Redis reconnect attempt #${times}, retrying in ${delay}ms`);
    return delay;
  },
};

const redis = new Redis(redisConfig);

export const redisConnection = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    redis.once("ready", () => {
      logger.info("🚀 Redis ready to use");
      resolve();
    });

    redis.once("error", (err: Error) => {
      logger.error(`❌ Redis error: ${err.message}`, err);
      reject(err);
    });

    redis.on("connect", () => {
      logger.info("✅ Redis connecting...");
    });

    redis.on("close", () => {
      logger.warn("Redis connection closed");
    });

    redis.on("reconnecting", (delay: number) => {
      logger.warn(`Redis reconnecting in ${delay}ms`);
    });

    redis.on("end", () => {
      logger.warn("Redis connection ended");
    });
  });
};

export default redis;
