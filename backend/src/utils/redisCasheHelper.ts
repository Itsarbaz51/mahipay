// utils/cache.ts
import redis from "../db/redis.js";
import logger from "./WinstonLogger.js";

export async function setCache(
  key: string,
  value: any,
  ttlSeconds = 60
): Promise<void> {
  try {
    const serializedValue = typeof value === "string" ? value : JSON.stringify(value);
    await redis.set(key, serializedValue, "EX", ttlSeconds);
    logger.debug("Cache set", { key, ttlSeconds });
  } catch (error) {
    logger.error("Failed to set cache", {
      key,
      error: (error as Error).message,
    });
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const start = Date.now();
    const raw = await redis.get(key);
    const duration = Date.now() - start;

    if (raw) {
      logger.debug("Cache hit", { key, duration });
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as T;
      }
    }

    logger.debug("Cache miss", { key, duration });
    return null;
  } catch (error) {
    logger.error("Failed to get cache", {
      key,
      error: (error as Error).message,
    });
    return null;
  }
}

export async function delCache(key: string): Promise<void> {
  try {
    await redis.del(key);
    logger.debug("Cache deleted", { key });
  } catch (error) {
    logger.error("Failed to delete cache", {
      key,
      error: (error as Error).message,
    });
  }
}

export async function setCacheWithPrefix(
  prefix: string,
  key: string,
  value: any,
  ttlSeconds = 60
): Promise<void> {
  const fullKey = `${prefix}:${key}`;
  return setCache(fullKey, value, ttlSeconds);
}

export async function getCacheWithPrefix<T>(
  prefix: string,
  key: string
): Promise<T | null> {
  const fullKey = `${prefix}:${key}`;
  return getCache<T>(fullKey);
}

export async function delCacheWithPrefix(
  prefix: string,
  key: string
): Promise<void> {
  const fullKey = `${prefix}:${key}`;
  return delCache(fullKey);
}

export async function clearPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
      logger.debug("Pattern cache cleared", {
        pattern,
        keysCount: keys.length,
      });
    }
  } catch (error) {
    logger.error("Failed to clear pattern cache", {
      pattern,
      error: (error as Error).message,
    });
  }
}

export async function cacheUser(
  userId: string,
  userData: any,
  ttlSeconds = 300
): Promise<void> {
  await setCacheWithPrefix("user", userId, userData, ttlSeconds);
}

export async function getCachedUser<T>(userId: string): Promise<T | null> {
  return getCacheWithPrefix<T>("user", userId);
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await delCacheWithPrefix("user", userId);
  // Also clear any user-related cache patterns
  await clearPattern(`user:${userId}:*`);
}
