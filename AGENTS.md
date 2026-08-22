# AeroAcademy / XpertClass — Project Rules

## CRITICAL RULES

### NEVER Delete Lab Docker Images
These images are used by the lab platform. They must NEVER be pruned, removed, or deleted.

```
kalilinux/kali-rolling
postgres:15-alpine
bkimminich/juice-shop
quay.io/centos/centos:stream9
debian:12
ubuntu:22.04
parrotsec/security
mongo:4.4
webgoat/webgoat
roottusk/vapi
vulnerables/web-dvwa
1njected/nodegoat
```

When cleaning Docker disk space, ONLY prune:
- Build cache (`docker builder prune`)
- Dangling images (not the above list)
- Stopped containers
- Unused volumes (except lab volumes)

### NEVER Run `prisma db push --accept-data-loss` in Production
This command wipes the database. Use `prisma migrate deploy` or manual schema changes only.

### Production Deployment
- Server: `169.58.158.83`
- SSH: `fayelldev` key `~/.ssh/fayelldev_ed25519`
- Deploy: `sudo git pull` → `docker compose build --no-cache <service>` → `sudo docker compose up -d --force-recreate <service>`
- Database backups: `/root/backups/backup.sh` runs daily at 2 AM, keeps 7 days
- `sudo` required for all docker/git commands on server

### Brand Colors
- Navy: `#0F203A`
- Green: `#229C62`
- Lime: `#7AD62A`
- Pale green: `#E9F8EE`

### SMTP
- Host: `smtp.hostinger.com:465`
- Auth user: `contact@xpertclass.academy`
- Sender aliases: `auth@`, `labs@`, `noreply@`, `info@`
- Welcome emails use `info@xpertclass.academy`

### Code Architecture
- Welcome emails: handled by `OnboardingService` via `USER_REGISTERED` event (NOT auth)
- Auth owns: OTP verification, password reset emails only
- JWT strategy uses `payload.sub` → mapped to `req.user.id` in `jwt.strategy.ts validate()`
- `NODE_ENV=production` blocks `prisma db seed` in `seed.ts`
