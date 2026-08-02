# VPS production deployment

This deployment runs the Spring Boot backend behind Caddy with automatic HTTPS.
The database remains on Supabase; PostgreSQL is not exposed from the VPS.

## Required server files

Create these ignored files on the VPS:

- `deploy/.env.production`, copied from `.env.production.example`
- `deploy/secrets/firebase-service-account.json`, using a newly rotated Firebase key

Never commit either file.

## Deploy

From `Sources/Backend`:

```bash
docker compose -f deploy/compose.production.yaml up -d --build
docker compose -f deploy/compose.production.yaml ps
docker compose -f deploy/compose.production.yaml logs --tail=200 backend
```

Health check:

```bash
curl -fsS https://api.danangketnoi.io.vn/actuator/health
```
