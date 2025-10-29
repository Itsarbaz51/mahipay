import { RateLimiterRedis } from "rate-limiter-flexible";
import redis from "../db/redis.js";

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "middleware:rateLimiter",
  points: Number(process.env.RATE_LIMIT_MAX),
  duration: Number(process.env.RATE_LIMIT_WINDOW),
});

export async function rateLimiterMiddleware(req, res, next) {
  try {
    const identifier = req.ip ?? "unknown-ip";
    await rateLimiter.consume(identifier);
    next();
  } catch (rejRes) {
    console.log("Rate limit exceeded for %s", req.ip);
    res.status(429).json({ error: "Too many requests, try again later" });
  }
}