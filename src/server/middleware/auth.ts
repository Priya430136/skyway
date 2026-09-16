import { Request, Response, NextFunction } from "express";
import { AuthService, AuthPayload } from "../services/authService";

// Augment Express Request type to carry user payload
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

/**
 * Optional token extraction middleware (attaches user to req if valid token is provided)
 */
export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return next();
  }

  const user = AuthService.verifyToken(token);
  if (user) {
    req.user = user;
  }

  next();
}

/**
 * Strict authentication guard middleware
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Please provide a valid Bearer token.",
    });
  }

  const token = authHeader.split(" ")[1];
  const user = AuthService.verifyToken(token);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired authentication token. Please sign in again.",
    });
  }

  req.user = user;
  next();
}

/**
 * Role-Based Access Control (RBAC) guard middleware
 */
export function requireRole(allowedRoles: Array<"ADMIN" | "OPERATIONS" | "AGENT" | "PASSENGER">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required before accessing this role-restricted route.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden. You do not have sufficient permissions. Required roles: ${allowedRoles.join(", ")}`,
        currentRole: req.user.role,
      });
    }

    next();
  };
}
