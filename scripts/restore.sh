#!/bin/bash
# ═══════════════════════════════════════════════════════════
# XpertClass Server Restore Script
# Run on a fresh Ubuntu 22.04 server after provisioning
# Usage: ssh root@NEW_IP 'bash -s' < restore.sh
# ═══════════════════════════════════════════════════════════
set -euo pipefail

echo "═══════════════════════════════════════"
echo "  XpertClass Restore — Starting"
echo "═══════════════════════════════════════"

# ─── 1. System deps ───
echo "[1/8] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq git curl ufw fail2ban

# ─── 2. Docker ───
echo "[2/8] Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable docker

echo "[3/8] Installing Docker Compose plugin..."
if ! docker compose version &>/dev/null; then
  mkdir -p /usr/local/lib/docker/cli-plugins
  curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

# ─── 4. SSH key ───
echo "[4/8] Setting up SSH..."
mkdir -p /home/fayelldev/.ssh
cat >> /home/fayelldev/.ssh/authorized_keys << 'EOF'
# Add your public key here
EOF
chown -R fayelldev:fayelldev /home/fayelldev/.ssh
chmod 700 /home/fayelldev/.ssh
chmod 600 /home/fayelldev/.ssh/authorized_keys 2>/dev/null || true

# ─── 5. Clone repo ───
echo "[5/8] Cloning repository..."
cd /home/fayelldev
if [ ! -d aeroacademy ]; then
  git clone https://github.com/Fayello/aeroacademy.git
fi
cd aeroacademy

# ─── 6. Environment ───
echo "[6/8] Setting up environment..."
if [ ! -f .env ]; then
  cat > .env << 'ENVEOF'
POSTGRES_USER=aeroacademy
POSTGRES_PASSWORD=CHANGE_ME_TO_A_STRONG_PASSWORD
JWT_SECRET=CHANGE_ME_TO_A_RANDOM_64_CHAR_STRING
LAB_ENCRYPTION_KEY=CHANGE_ME_TO_BASE64_32_BYTES
NODE_ENV=production
FRONTEND_URL=https://xpertclass.academy
ENVEOF
  echo "  ⚠️  Edit .env with real values before starting services!"
fi

# ─── 7. Pull images ───
echo "[7/8] Pulling Docker images..."
docker pull ghcr.io/fayello/aeroacademy-frontend:latest
docker pull ghcr.io/fayello/aeroacademy-backend:latest
docker pull postgres:15-alpine

# ─── 8. Start services ───
echo "[8/8] Starting services..."
docker compose up -d db
sleep 10
docker compose up -d backend
sleep 15
docker compose up -d frontend

# ─── 9. Seed database ───
echo "═══════════════════════════════════════"
echo "  Seeding database..."
echo "═══════════════════════════════════════"
docker compose exec -T backend npx prisma migrate deploy 2>/dev/null || true
docker compose exec -T backend node dist/prisma/seed.js 2>/dev/null || echo "  Seed via npm run seed"
docker compose exec -T backend npm run seed 2>/dev/null || true

# ─── 10. Firewall ───
echo "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ─── Done ───
echo ""
echo "═══════════════════════════════════════"
echo "  ✅ Restore complete!"
echo ""
echo "  Next steps:"
echo "  1. Edit .env with real secrets"
echo "  2. Update DNS to point to this server"
echo "  3. Install SSL: sudo certbot --nginx -d xpertclass.academy"
echo "  4. Set up backup cron: /root/backups/backup.sh"
echo "═══════════════════════════════════════"
