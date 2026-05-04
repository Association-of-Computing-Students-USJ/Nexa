// JWT auth middleware for admin-only endpoints.
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new HttpError(401, "Missing token"));

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload?.role !== "ADMIN") return next(new HttpError(403, "Forbidden"));
    req.user = payload;
    return next();
  } catch {
    return next(new HttpError(401, "Invalid token"));
  }
}

