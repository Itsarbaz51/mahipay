import { v4 as uuidv4 } from "uuid";

export function requestId(req, res, next) {
  req.requestId = uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}