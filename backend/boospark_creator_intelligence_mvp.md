# BOOSPARK — CREATOR INTELLIGENCE (MVP) + AGENT SYSTEM

---

## 🎯 CORE

Others measure influence.  
We measure revenue.

---

# 📊 CREATOR INTELLIGENCE — MVP

## Included Metrics

### CORE
- commerce_score

### ENGAGEMENT
- follower_count
- avg_likes (last N posts)
- avg_comments (last N posts)
- avg_views (last N posts)
- engagement_rate = (avg_likes + avg_comments) / followers

### CONTENT
- content_topics (caption + hashtag NLP)

### CONTEXT
- recent_posts

---

## ❌ NOT INCLUDED (PHASE 2+)

- audience demographics
- revenue
- conversion
- fraud
- prediction

---

# 🧮 COMMERCE SCORE (MVP)

engagement_rate = (avg_likes + avg_comments) / followers

engagement_score =
0.5 * engagement_rate +
0.5 * normalize(avg_views)

IF connected:
    intent_score = intent_comments / total_comments
ELSE:
    intent_score = 0

final_score =
0.6 * engagement_score +
0.4 * intent_score

---

# 🧠 AI SYSTEM

## Layers

1. Data Layer
- IG API
- TikTok API
- Screenshot (fallback)

2. Processing
- metric calculation
- NLP (topics)
- intent detection

3. Output
- commerce_score
- creator ranking

---

# ⚙️ ENGINEERING SYSTEM

## Services
- ingestion-service
- scoring-service
- campaign-service
- matching-service

## Flow
API → ingestion → DB → scoring → frontend

---

# 🤖 AGENT SYSTEM

## Product
- Sprint Prioritizer
- Project Shipper

## Engineering
- Backend Architect
- AI Engineer
- Frontend Developer
- DevOps Automator
- API Tester
- Workflow Optimizer
- Test Results Analyzer

---

# 🧠 AGENT MEMORY

/agent-memory/
- errors/
- learnings/
- decisions/

Rules:
- log errors
- log learnings
- read before task

---

# 🧠 AGENT WORKING RULES

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)  
- If something goes sideways, STOP and re-plan immediately - don't keep pushing  
- Use plan mode for verification steps, not just building  
- Write detailed specs upfront to reduce ambiguity  

---

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean  
- Offload research, exploration, and parallel analysis to subagents  
- For complex problems, throw more compute at it via subagents  
- One task per subagent for focused execution  

---

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern  
- Write rules for yourself that prevent the same mistake  
- Ruthlessly iterate on these lessons until mistake rate drops  
- Review lessons at session start for relevant project  

---

### 4. Verification Before Done
- Never mark a task complete without proving it works  
- Diff behavior between main and your changes when relevant  
- Ask yourself: "Would a staff engineer approve this?"  
- Run tests, check logs, demonstrate correctness  

---

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"  
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"  
- Skip this for simple, obvious fixes - don't over-engineer  
- Challenge your own work before presenting it  

---

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding  
- Point at logs, errors, failing tests - then resolve them  
- Zero context switching required from the user  
- Go fix failing CI tests without being told how  

---

## Core Principles
- Simplicity First  
- No Laziness  
