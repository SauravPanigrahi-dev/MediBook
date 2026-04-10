import { type Request, type Response, type NextFunction } from "express";
import { verifyAccessToken } from "./auth";

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "No token provided" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const { userId, role } = verifyAccessToken(token);
    req.userId = userId;
    req.userRole = role;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const allowRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }
    next();
  };
};
