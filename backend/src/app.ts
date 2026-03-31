import "dotenv/config";
import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health";
import { creatorsRouter } from "./routes/creators";
import { brandsRouter } from "./routes/brands";
import { campaignsRouter } from "./routes/campaigns";
import { transactionsRouter } from "./routes/transactions";
import { analyticsRouter } from "./routes/analytics";
import { authRouter } from "./routes/auth";
import { campaignCreatorsRouter } from "./routes/campaignCreators";
import { campaignContentsRouter } from "./routes/campaignContents";
import { matchingRouter } from "./routes/matching";
import { trackingRouter } from "./routes/tracking";
import { intelligenceRouter } from "./routes/intelligence";
import { redirectRouter } from "./routes/redirect";
import { meRouter } from "./routes/me";
import { adminRouter } from "./routes/admin";
import { errorHandler } from "./middleware/errorHandler";
import { mountSwagger } from "./docs/swagger";

export const app = express();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["*"];
app.use(cors({ origin: corsOrigins.length === 1 && corsOrigins[0] === "*" ? "*" : corsOrigins, credentials: true }));
app.use(express.json());

mountSwagger(app);

app.use("/r", redirectRouter);

app.use("/api/v1", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/me", meRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/creators", creatorsRouter);
app.use("/api/v1/brands", brandsRouter);
app.use("/api/v1/campaigns", campaignsRouter);
app.use("/api/v1/campaign-creators", campaignCreatorsRouter);
app.use("/api/v1/campaign-contents", campaignContentsRouter);
app.use("/api/v1/matching", matchingRouter);
app.use("/api/v1/transactions", transactionsRouter);
app.use("/api/v1/tracking", trackingRouter);
app.use("/api/v1/intelligence", intelligenceRouter);
app.use("/api/v1/analytics", analyticsRouter);

app.use(errorHandler);
