// utils/logger.ts
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import CloudWatchTransport from "./CloudWatchTransport.js";
import stringify from "safe-stable-stringify";

const { combine, timestamp, errors, printf, colorize } = winston.format;

const isProd = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL || (isProd ? "info" : "debug");

// Flatten metadata formatter
const flattenMetadata = winston.format((info) => {
  if (info.metadata) {
    Object.assign(info, info.metadata);
    delete info.metadata;
  }
  return info;
});

// Dev-friendly format
const devFormat = printf(({ timestamp, level, message, stack, ...meta }) => {
  const msg =
    typeof message === "object" ? stringify(message, null, 2) : message;
  const metaStr = Object.keys(meta).length
    ? `\n${stringify(meta, null, 2)}`
    : "";
  return `${timestamp} [${level}] ${stack || msg}${metaStr}`;
});

// Prod-friendly format
const prodFormat = printf(({ timestamp, level, message, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? stringify(meta) : "";
  return `${timestamp} [${level.toUpperCase()}] ${stack || message} ${metaStr}`;
});

// Filter for specific levels
const filterOnly = (levelToKeep: string) =>
  winston.format((info) => (info.level === levelToKeep ? info : false))();

const transports: winston.transport[] = [
  new winston.transports.Console({
    level,
    format: isProd
      ? combine(
          timestamp(),
          errors({ stack: true }),
          flattenMetadata(),
          prodFormat
        )
      : combine(
          colorize(),
          timestamp(),
          errors({ stack: true }),
          flattenMetadata(),
          devFormat
        ),
  }),
];

// File logging in development
if (!isProd) {
  transports.push(
    new DailyRotateFile({
      level: "error",
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      zippedArchive: true,
      format: combine(
        filterOnly("error"),
        timestamp(),
        errors({ stack: true }),
        flattenMetadata(),
        prodFormat
      ),
    }),
    new DailyRotateFile({
      level: "info",
      filename: "logs/info-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      zippedArchive: true,
      format: combine(
        filterOnly("info"),
        timestamp(),
        errors({ stack: true }),
        flattenMetadata(),
        prodFormat
      ),
    }),
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      zippedArchive: true,
      format: combine(
        timestamp(),
        errors({ stack: true }),
        flattenMetadata(),
        prodFormat
      ),
    })
  );
}

// CloudWatch in production
if (isProd) {
  transports.push(
    new CloudWatchTransport({
      logGroupName: process.env.CLOUDWATCH_GROUP_NAME || "fintech-logs",
      logStreamName: `app-${new Date().toISOString().split("T")[0]}`,
      region: process.env.AWS_REGION || "ap-south-1",
      level: "info",
    })
  );
}

// Main logger
const logger = winston.createLogger({
  level,
  format: combine(timestamp(), errors({ stack: true }), flattenMetadata()),
  transports,
  exitOnError: false,
});

// Morgan integration
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
