# MVP requirement screenshots

Source exports from product planning (Mar 2026). Filenames are normalized for the repo.

| File | Contents |
|------|----------|
| `mvp-layers-workflow.png` | AUTH, Creator data, Intelligence, Matching, Campaign, Campaign WMS (admin → creator → brand → match → content). |
| `mvp-content-tracking-admin.png` | Content flow, Tracking (affiliate), Earnings, Admin panel scope. |

## WMS model (backend)

**pairing_first**: Campaign-level status is high-level only (`DRAFT`, `ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED`). Per-pair workflow lives on `CampaignCreator.status` (admin recommendation → creator decision → brand decision → `MATCHED` → content states).

See [prisma/schema.prisma](../../prisma/schema.prisma) enums `CampaignStatus` and `CampaignCreatorStatus`.

## Quick API notes (after `npm install`, `prisma db push`, `npm run db:seed`)

- **Auth**: `POST /api/v1/auth/login` — seed admin `admin@upcreate.demo` / `demo12345`. Use `Authorization: Bearer <token>` for protected routes.
- **Admin recommend**: `POST /api/v1/campaigns/:id/recommend` { `creatorId` } (campaign must be `ACTIVE`).
- **Pairing WMS**: `PATCH /api/v1/campaign-creators/:id/creator-response` | `brand-response` { `accept`: boolean } (creator/brand JWT or admin).
- **Content**: `POST .../campaign-creators/:id/contents` → `PATCH .../campaign-contents/:id/review` { `action`: `approve` \| `reject` \| `revision` }.
- **Affiliate redirect**: `GET /r/:code` records click and 302s to `destinationUrl`.
- **Matching**: `GET /api/v1/matching/campaigns/:campaignId/suggestions`.
