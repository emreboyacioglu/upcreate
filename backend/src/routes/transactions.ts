import { Router } from "express";
import { z } from "zod";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { validate } from "../middleware/validate";
import { transactionService } from "../business";

export const transactionsRouter = Router();

const createTransactionSchema = z.object({
  campaignCreatorId: z.string().min(1),
  type: z.nativeEnum(TransactionType).optional(),
  amount: z.number().positive(),
  currency: z.string().min(1).max(10).optional(),
  description: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(TransactionStatus),
  paidAt: z.string().datetime().optional(),
});

transactionsRouter.get("/", async (req, res, next) => {
  try {
    const result = await transactionService.list({
      page: parseInt(req.query.page as string) || undefined,
      limit: parseInt(req.query.limit as string) || undefined,
      campaignId: req.query.campaignId as string,
      creatorId: req.query.creatorId as string,
      status: req.query.status as TransactionStatus | undefined,
      type: req.query.type as TransactionType | undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

transactionsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const tx = await transactionService.getById(id);
    res.json(tx);
  } catch (err) {
    next(err);
  }
});

transactionsRouter.post("/", validate(createTransactionSchema), async (req, res, next) => {
  try {
    const tx = await transactionService.create(req.body);
    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
});

transactionsRouter.patch("/:id/status", validate(updateStatusSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const tx = await transactionService.updateStatus(id, {
      status: req.body.status,
      paidAt: req.body.paidAt ? new Date(req.body.paidAt) : undefined,
    });
    res.json(tx);
  } catch (err) {
    next(err);
  }
});

transactionsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const result = await transactionService.delete(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
