# Upcreate Backend — Lessons

## Session: 2026-03-21 — Initial Setup
- AWS CLI commands to CloudFront require `--cli-read-timeout` and `--cli-connect-timeout` flags; default timeouts hang
- CloudFront API calls always go through us-east-1 regardless of origin region
- EC2 server (eu-west-1): 34.255.131.113, user: ubuntu, key: creator-commerce-key.pem
- PM2 process name: creator-commerce (landing), backend: upcreate-backend
