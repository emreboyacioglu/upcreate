# Upcreate Backend — TODO

## Sprint 1 (MVP Foundation)
- [x] Repository + dependency setup
- [x] Prisma schema (creators, content_posts, creator_metrics, commerce_scores, brands, campaigns)
- [x] Express app skeleton (health, error middleware, CORS, routes)
- [x] Creator CRUD endpoints + ingestion service skeleton
- [x] Commerce score MVP hesaplama servisi
- [x] tasks/ ve agent-memory/ klasor yapisi
- [ ] EC2 deploy: PostgreSQL, PM2, nginx config

## Sprint 2 (Intelligence Layer)
- [ ] Instagram open data ingestion (real API)
- [ ] TikTok open data ingestion (real API)
- [ ] Metric aggregation pipeline
- [ ] Content topic extraction (NLP)
- [ ] Creator card MVP frontend

## Sprint 3 (Campaign Workflow)
- [ ] Campaign workflow state machine (full)
- [ ] Invite / accept / submit / approve flow
- [ ] Ranking + matching view
- [ ] Brand dashboard

## Sprint 4 (Connected Accounts)
- [ ] OAuth flow (Instagram, TikTok)
- [ ] Comment ingestion
- [ ] Intent score calculation
- [ ] Connect incentive behavior
