import path from "path";
import fs from "fs";
import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

const specPath = path.join(__dirname, "..", "..", "openapi.json");
const openapiSpec = JSON.parse(fs.readFileSync(specPath, "utf8")) as Record<string, unknown>;

export function mountSwagger(app: Express): void {
  app.get("/api/v1/docs/openapi.json", (_req, res) => {
    res.json(openapiSpec);
  });

  app.use(
    "/api/v1/docs",
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, {
      customSiteTitle: "Upcreate API",
      swaggerOptions: {
        persistAuthorization: true,
        tryItOutEnabled: true,
      },
    })
  );
}
