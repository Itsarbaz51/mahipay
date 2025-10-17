import type { Request, Response, NextFunction } from "express";
import { RateLimiterRedis } from "rate-limiter-flexible";
import redis from "../db/redis.js";
import logger from "../utils/WinstonLogger.js";

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "middleware:rateLimiter",
  points: Number(process.env.RATE_LIMIT_MAX), // requests
  duration: Number(process.env.RATE_LIMIT_WINDOW), // per N seconds
});

export async function rateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const identifier = req.ip ?? "unknown-ip";
    await rateLimiter.consume(identifier); // track by IP (could use userId/JWT sub)
    next();
  } catch (rejRes) {
    logger.warn("Rate limit exceeded for %s", req.ip);
    res.status(429).json({ error: "Too many requests, try again later" });
  }
}
