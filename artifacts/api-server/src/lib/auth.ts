import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "healthcare_jwt_secret_dev";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "healthcare_refresh_secret_dev";

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateAccessToken = (userId: number, role: string): string => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: number): string => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string): { userId: number; role: string } => {
  return jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
};

export const verifyRefreshToken = (token: string): { userId: number } => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: number };
};

// Account lockout: 5 failed logins → 15-min cooldown
const failedAttempts = new Map<string, { count: number; lockUntil: number }>();

export const checkLoginAttempts = (email: string): boolean => {
  const attempts = failedAttempts.get(email);
  if (!attempts) return true;
  if (attempts.lockUntil > Date.now()) return false;
  return true;
};

export const recordFailedLogin = (email: string): void => {
  const attempts = failedAttempts.get(email) || { count: 0, lockUntil: 0 };
  attempts.count++;
  if (attempts.count >= 5) {
    attempts.lockUntil = Date.now() + 15 * 60 * 1000;
    attempts.count = 0;
  }
  failedAttempts.set(email, attempts);
};

export const clearFailedLogins = (email: string): void => {
  failedAttempts.delete(email);
};
