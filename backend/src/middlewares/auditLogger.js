import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function auditLogger(req, res, next) {
  res.on("finish", async () => {
    try {
      const userId = req.user?.id || null; 
      const action = `${req.method} ${req.originalUrl}`;
      const metadata = {
         method: req.method,
         url: req.originalUrl,
         statusCode: res.statusCode,
         statusMessage: res.statusMessage,
         durationMs: duration,
         clientIp: req.ip,
         httpVersion: req.httpVersion,
         requestId: req.requestId,
         headers: req.headers,
         params: req.params,
         query: req.query,
         body: req.body,
         cookies: req.cookies
      };

      await prisma.auditLog.create({
        data: {
          userId,
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