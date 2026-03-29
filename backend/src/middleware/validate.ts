import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema, source: "body" | "query" = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const raw = source === "query" ? req.query : req.body;
      const parsed = schema.parse(raw);
      if (source === "query") {
        (req as Request & { validatedQuery?: unknown }).validatedQuery = parsed;
      } else {
        req.body = parsed;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: err.issues.map((e) => ({ path: e.path.join("."), message: e.message })),
        });
      }
      next(err);
    }
  };
}
