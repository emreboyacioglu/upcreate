import { Router } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { validate } from "../middleware/validate";
import { authService } from "../business/AuthService";
import { authenticateOptional, requireAuth } from "../middleware/auth";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole),
  brandName: z.string().min(1).max(200).optional(),
  creatorName: z.string().min(1).max(200).optional(),
  adminRegisterSecret: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { user, token } = await authService.register(req.body);
    const { passwordHash: _p, ...safe } = user;
    res.status(201).json({ user: safe, token });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body.email, req.body.password);
    const { passwordHash: _p, ...safe } = user;
    res.json({ user: safe, token });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", authenticateOptional, requireAuth, async (req, res, next) => {
  try {
    const me = await authService.getMe(req.user!.sub);
    res.json({ user: me, claims: req.user });
  } catch (err) {
    next(err);
  }
});
