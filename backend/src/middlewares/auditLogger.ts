import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function auditLogger(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.on("finish", async () => {
    try {
      const userId = (req as any).user?.id || null; 
      const action = `${req.method} ${req.originalUrl}`;
      const metadata = {
        body: req.body,
        params: req.params,
        query: req.query,
        headers: req.headers,
        cookies: req.cookies,
        statusCode: res.statusCode,
        requestId: (req as any).requestId,
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
