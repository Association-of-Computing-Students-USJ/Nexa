// Single PrismaClient instance to be reused across the app.
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

