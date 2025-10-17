import type { Request, Response, NextFunction } from "express";
import logger from "../utils/WinstonLogger.js";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info("Request completed", {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      clientIp: req.ip,
      headers: req.headers,
      httpVersion: req.httpVersion,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      params: req.params,
      query: req.query,
      body: req.body,
      cookies: req.cookies,
    });
  });

  next();
}
