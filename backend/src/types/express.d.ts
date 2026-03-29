import type { UserRole } from "@prisma/client";

export type AuthUserPayload = {
  sub: string;
  role: UserRole;
  brandId: string | null;
  creatorId: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export {};
