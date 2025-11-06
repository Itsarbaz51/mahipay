import Prisma from "../db/db.js";

export async function auditLogger(req, res, next) {
  // Record start time
  const start = process.hrtime.bigint();

  res.on("finish", async () => {
    try {
      // Calculate duration in milliseconds
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1_000_000;

      const userId = req.user?.id || null;
      const action = `${req.method} ${req.originalUrl}`;
      const metadata = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        durationMs: duration.toFixed(2),
        clientIp: req.ip,
        httpVersion: req.httpVersion,
        requestId: req.requestId,
        headers: req.headers,
        params: req.params,
        query: req.query,
        body: req.body,
        cookies: req.cookies,
      };

      await Prisma.auditLog.create({
        data: {
          userId,
          ipAddress: req.ip,
          action,
          metadata,
        },
      });
    } catch (error) {
      console.error("Audit log failed:", error);
    }
  });

  next();
}
