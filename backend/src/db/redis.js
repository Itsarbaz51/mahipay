import { Redis } from "ioredis";

const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
  retryStrategy(times) {
    const delay = 5000;
    console.log(`Redis reconnect attempt #${times}, retrying in ${delay}ms`);
    return delay;
  },
};

const redis = new Redis(redisConfig);

export const redisConnection = () => {
  return new Promise((resolve, reject) => {
    redis.once("ready", () => {
      console.log("🚀 Redis ready to use");
      resolve();
    });

    redis.once("error", (err) => {
      console.log(`❌ Redis error: ${err.message}`, err);
      reject(err);
    });

    redis.on("connect", () => {
      console.log("✅ Redis connecting...");
    });

    redis.on("close", () => {
      console.log      ("Redis connection closed");
    });

    redis.on("reconnecting", (delay) => {
      console.log      (`Redis reconnecting in ${delay}ms`);
    });

    redis.on("end", () => {
      console.log      ("Redis connection ended");
    });
  });
};

export default redis;