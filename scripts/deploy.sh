#!/usr/bin/env bash
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

info "Starting Phew HRMS deployment..."
info "Project root: $PROJECT_DIR"

# ── 1. Ensure .env.production exists ──
if [ ! -f .env.production ]; then
  warn ".env.production not found — copying from template"
  cp .env.production.template .env.production 2>/dev/null || \
    cp .env.production .env.production 2>/dev/null || \
    error "No .env.production found. Create one first (see .env.production)"
fi

# ── 2. Generate JWT secret if not set ──
if grep -q "change_me" .env.production 2>/dev/null; then
  warn "JWT_SECRET contains placeholder — generating random secret..."
  if command -v openssl &>/dev/null; then
    NEW_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$NEW_SECRET|" .env.production
    else
      sed -i "s|JWT_SECRET=.*|JWT_SECRET=$NEW_SECRET|" .env.production
    fi
    info "JWT_SECRET generated and saved to .env.production"
  else
    warn "openssl not available. Set JWT_SECRET manually in .env.production"
  fi
fi

# ── 3. Generate DB password if not set ──
if grep -q "change_me_in_production" .env.production 2>/dev/null; then
  warn "DB_PASSWORD contains placeholder — generating..."
  NEW_PASS=$(openssl rand -base64 24 | tr -d '\n' | tr -d '/+=' | cut -c1-20)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|DB_PASSWORD=.*|DB_PASSWORD=$NEW_PASS|" .env.production
    sed -i '' "s|DATABASE_URL=postgresql://phew:.*@postgres|DATABASE_URL=postgresql://phew:$NEW_PASS@postgres|" .env.production
  else
    sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$NEW_PASS|" .env.production
    sed -i "s|DATABASE_URL=postgresql://phew:.*@postgres|DATABASE_URL=postgresql://phew:$NEW_PASS@postgres|" .env.production
  fi
  info "DB_PASSWORD generated"
fi

# ── 4. Pull images & build ──
info "Building Docker images..."
docker compose --env-file .env.production build --pull

# ── 5. Start services ──
info "Starting services..."
docker compose --env-file .env.production up -d

# ── 6. Wait for health ──
info "Waiting for backend health check..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:${BACKEND_PORT:-4000}/api/health >/dev/null 2>&1; then
    info "Backend is healthy!"
    break
  fi
  if [ "$i" -eq 30 ]; then
    error "Backend failed to start within 30s. Check logs: docker compose logs backend"
  fi
  sleep 2
done

# ── 7. Run migrations & seed ──
info "Running database migrations..."
docker compose --env-file .env.production exec -T backend npx prisma db push --accept-data-loss 2>&1
docker compose --env-file .env.production exec -T backend sh -c "cd /app && npx tsx src/seed.ts" 2>&1 || \
  warn "Seed may have already run (ignore if data exists)."

info ""
info "────────────────────────────────────────────"
info "  ${BOLD}Phew HRMS is live!${NC}"
info "  Frontend: http://localhost:${FRONTEND_PORT:-3000}"
info "  Backend:  http://localhost:${BACKEND_PORT:-4000}/api/health"
info "────────────────────────────────────────────"
info ""
info "Default login (change on first use):"
info "  Admin:    admin@phew.com / Admin@123"
info "  HR:       hr@phew.com    / Admin@123"
info "  Employee: john@phew.com  / Admin@123"
info ""
info "View logs:  docker compose logs -f"
info "Stop:       docker compose down"
