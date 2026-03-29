import { UserRole } from "@prisma/client";
import { authService } from "../business/AuthService";
import { AppError } from "./errorHandler";

/** Attach `req.user` when a valid Bearer JWT is sent; otherwise continue unauthenticated. */
export function authenticateOptional(req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return next();
  try {
    const token = h.slice(7);
    req.user = authService.verifyToken(token);
    next();
  } catch (e) {
    next(e);
  }
}

export function requireAuth(req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) {
  if (!req.user) return next(new AppError(401, "Unauthorized"));
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) => {
    if (!req.user) return next(new AppError(401, "Unauthorized"));
    if (!roles.includes(req.user.role)) return next(new AppError(403, "Forbidden"));
    next();
  };
}
