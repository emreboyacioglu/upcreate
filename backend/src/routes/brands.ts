import { Router } from "express";
import { z } from "zod";
import { UserRole, BrandStatus } from "@prisma/client";
import { validate } from "../middleware/validate";
import { brandService, analyticsService } from "../business";
import { authenticateOptional, requireAuth, requireRole } from "../middleware/auth";
import { logAudit } from "../middleware/auditLog";

export const brandsRouter = Router();
brandsRouter.use(authenticateOptional);
brandsRouter.use(requireAuth);
brandsRouter.use(requireRole(UserRole.ADMIN));

const createBrandSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  website: z.string().url().optional(),
  category: z.string().optional(),
  industry: z.string().optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(BrandStatus).optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  contactPhone: z.string().optional(),
  billingAddress: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateBrandSchema = createBrandSchema.partial();

brandsRouter.get("/", async (req, res, next) => {
  try {
    const result = await brandService.list({
      page: parseInt(req.query.page as string) || undefined,
      limit: parseInt(req.query.limit as string) || undefined,
      search: req.query.search as string,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

brandsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const brand = await brandService.getById(id);
    res.json(brand);
  } catch (err) {
    next(err);
  }
});

brandsRouter.post("/", validate(createBrandSchema), async (req, res, next) => {
  try {
    const brand = await brandService.create(req.body);
    await logAudit(req, "brand.create", "Brand", brand.id, { name: brand.name });
    res.status(201).json(brand);
  } catch (err) {
    next(err);
  }
});

brandsRouter.put("/:id", validate(updateBrandSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const updated = await brandService.update(id, req.body);
    await logAudit(req, "brand.update", "Brand", id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

const brandStatusSchema = z.object({
  status: z.nativeEnum(BrandStatus),
});

brandsRouter.patch("/:id/status", validate(brandStatusSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const updated = await brandService.transitionStatus(id, req.body.status);
    await logAudit(req, "brand.status.transition", "Brand", id, { status: req.body.status });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

brandsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const result = await brandService.delete(id);
    await logAudit(req, "brand.delete", "Brand", id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

brandsRouter.get("/:id/spending", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const result = await analyticsService.brandSpending(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
