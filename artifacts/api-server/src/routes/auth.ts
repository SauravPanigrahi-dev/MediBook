import { Router } from "express";
import { db, usersTable, patientsTable, doctorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  checkLoginAttempts,
  recordFailedLogin,
  clearFailedLogins,
} from "../lib/auth";

const router = Router();

const DOCTOR_INVITE_CODES = (process.env.DOCTOR_INVITE_CODES || "INVITE2024,MEDINVITE,HEALTHPRO").split(",");

router.post("/auth/register", async (req, res): Promise<void> => {
  const { name, email, password, role, inviteCode } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ success: false, message: "Missing required fields" });
    return;
  }

  if (role === "doctor") {
    if (!inviteCode || !DOCTOR_INVITE_CODES.includes(inviteCode)) {
      res.status(400).json({ success: false, message: "Invalid invite code for doctor registration" });
      return;
    }
  }

  if (!["patient", "doctor"].includes(role)) {
    res.status(400).json({ success: false, message: "Invalid role" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ success: false, message: "Email already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash,
    role: role as "patient" | "doctor" | "admin",
  }).returning();

  if (role === "patient") {
    await db.insert(patientsTable).values({ userId: user.id });
  } else if (role === "doctor") {
    await db.insert(doctorsTable).values({
      userId: user.id,
      specialization: "General",
      qualification: "MBBS",
      licenseNumber: `LIC${Date.now()}`,
    });
  }

  const [patientRow] = await db.select().from(patientsTable).where(eq(patientsTable.userId, user.id));
  const [doctorRow] = await db.select().from(doctorsTable).where(eq(doctorsTable.userId, user.id));

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      patientId: patientRow?.id ?? null,
      doctorId: doctorRow?.id ?? null,
    },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: "Missing email or password" });
    return;
  }

  if (!checkLoginAttempts(email)) {
    res.status(429).json({ success: false, message: "Account locked due to too many failed attempts. Try again in 15 minutes." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    recordFailedLogin(email);
    res.status(401).json({ success: false, message: "Invalid email or password" });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ success: false, message: "Account is deactivated" });
    return;
  }

  clearFailedLogins(email);

  const [patientRow] = await db.select().from(patientsTable).where(eq(patientsTable.userId, user.id));
  const [doctorRow] = await db.select().from(doctorsTable).where(eq(doctorsTable.userId, user.id));

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      patientId: patientRow?.id ?? null,
      doctorId: doctorRow?.id ?? null,
    },
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Logged out" });
});

router.post("/auth/refresh", async (req, res): Promise<void> => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ success: false, message: "No refresh token" });
    return;
  }

  try {
    const { userId } = verifyRefreshToken(token);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    const [patientRow] = await db.select().from(patientsTable).where(eq(patientsTable.userId, user.id));
    const [doctorRow] = await db.select().from(doctorsTable).where(eq(doctorsTable.userId, user.id));

    const accessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        patientId: patientRow?.id ?? null,
        doctorId: doctorRow?.id ?? null,
      },
    });
  } catch {
    res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "No token provided" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const { userId } = verifyAccessToken(token);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    const [patientRow] = await db.select().from(patientsTable).where(eq(patientsTable.userId, user.id));
    const [doctorRow] = await db.select().from(doctorsTable).where(eq(doctorsTable.userId, user.id));

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      patientId: patientRow?.id ?? null,
      doctorId: doctorRow?.id ?? null,
    });
  } catch {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

export default router;
