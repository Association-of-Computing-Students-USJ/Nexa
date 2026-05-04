// Auth service: validates credentials and issues JWTs.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../prisma/client.js";
import { HttpError } from "../utils/httpError.js";

async function ensureDemoAdmin() {
  // For a starter scaffold: create a default admin if none exists.
  // Replace with a proper user management flow in production.
  const email = "admin@nexa.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash("admin123", 10);
  return prisma.user.create({
    data: { email, passwordHash, role: "ADMIN" }
  });
}

export async function login(email, password) {
  await ensureDemoAdmin();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new HttpError(401, "Invalid credentials");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid credentials");

  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return { token };
}

