// utils/securityCache.ts
import redis from "../db/redis.js";

export async function addRevokedToken(jti: string, expSeconds: number) {
  await redis.set(`revoked:${jti}`, "1", "EX", expSeconds);
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  return (await redis.exists(`revoked:${jti}`)) === 1;
}

export async function recordLoginAttempt(identifier: string) {
  const key = `login_attempts:${identifier}`;
  const attempts = await redis.incr(key);
  if (attempts === 1) {
    await redis.expire(key, 300); // 5m window
  }
  return attempts;
}

export async function resetLoginAttempts(identifier: string) {
  await redis.del(`login_attempts:${identifier}`);
}
