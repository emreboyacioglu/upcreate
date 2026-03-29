# Decision: Tech Stack Selection

**Date:** 2026-03-21
**Context:** Backend MVP tech stack for Upcreate Creator Intelligence platform

## Decision
- Runtime: Node.js + TypeScript
- Framework: Express.js
- ORM: Prisma
- Database: PostgreSQL (same EC2)
- Validation: Zod

## Reasoning
- Same language as landing (Next.js) — reduced context switching
- PostgreSQL: relational data fits creator-brand-campaign relationships
- Free: all runs on existing EC2 (eu-west-1)
- Prisma: type-safe, migration management, great DX
- User has .NET background but prefers lightweight for MVP

## Alternatives Considered
- Python + FastAPI (good for AI, but adds language complexity)
- Hybrid Node + Python microservices (premature for MVP)
- MongoDB (flexible schema but weaker for relational queries)
