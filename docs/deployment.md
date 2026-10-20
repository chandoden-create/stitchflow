# StitchFlow Deployment Guide

## Option 1: Local Development (Docker Compose)

### Prerequisites
- Docker Desktop 4.x+
- Node.js 18+
- Expo Go (iOS/Android) or simulator

### Steps
```bash
# 1. Clone and navigate
cd stitchflow

# 2. Start all services
docker compose up -d

# 3. Run migrations + seed
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed

# 4. Start mobile app
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://localhost:3000 npx expo start
```

---

## Option 2: Production Deployment (Railway.app — Recommended for Solo Founders)

Railway provides managed PostgreSQL + Redis + web hosting.

### Backend on Railway
1. Push backend to GitHub
2. Create new Railway project → Deploy from GitHub
3. Add PostgreSQL plugin
4. Add Redis plugin
5. Set environment variables in Railway dashboard
6. Railway auto-generates a public HTTPS URL

### Environment Variables for Railway
```env
DATABASE_URL=<from Railway PostgreSQL plugin>
REDIS_URL=<from Railway Redis plugin>
JWT_SECRET=<generate with: openssl rand -base64 48>
S3_BUCKET=stitchflow-photos
S3_REGION=ap-south-1
S3_ACCESS_KEY=<AWS IAM key>
S3_SECRET_KEY=<AWS IAM secret>
WHATSAPP_PHONE_NUMBER_ID=<from Meta>
WHATSAPP_ACCESS_TOKEN=<from Meta>
WHATSAPP_VERIFY_TOKEN=<custom string>
WHATSAPP_SANDBOX_MODE=false
NODE_ENV=production
PORT=3000
```

### Mobile App — Expo EAS Build
```bash
cd mobile
npm install -g eas-cli
eas login
eas build:configure
# Set EXPO_PUBLIC_API_URL to your Railway backend URL
eas build --platform android  # or ios
eas submit                     # to app stores
```

---

## Option 3: Self-Hosted VPS (DigitalOcean / Hetzner)

### Server Setup (Ubuntu 22.04)
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Install nginx for reverse proxy
sudo apt install nginx certbot python3-certbot-nginx

# Clone project
git clone https://github.com/your-org/stitchflow.git /opt/stitchflow

# Set environment
cp backend/.env.example backend/.env
# Edit .env with production values

# Start with Docker Compose
docker compose -f docker-compose.prod.yml up -d

# Run migrations
docker compose exec backend npx prisma migrate deploy

# Setup nginx reverse proxy
sudo certbot --nginx -d api.yourdomain.com
```

### Nginx Config
```nginx
server {
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Database Backups

### Automated Daily Backup (cron)
```bash
# Add to crontab: crontab -e
0 2 * * * docker exec stitchflow-postgres-1 pg_dump -U stitchflow stitchflow | gzip > /backups/stitchflow-$(date +\%Y\%m\%d).sql.gz
```

### Restore from Backup
```bash
gunzip -c backup.sql.gz | docker exec -i stitchflow-postgres-1 psql -U stitchflow stitchflow
```

---

## Health Checks

Backend exposes `/health` endpoint:
```bash
curl https://api.yourdomain.com/health
# Expected: {"status":"ok","database":"connected","redis":"connected"}
```

---

## Monitoring
- Use **Better Uptime** or **UptimeRobot** to monitor `/health`
- Set up alerts for downtime
- Backend logs to stdout — capture with Docker logging driver
- For error tracking: integrate Sentry (`SENTRY_DSN` env var)

---

## Scaling Considerations
- The backend is stateless — can run multiple instances behind a load balancer
- Redis is required for the Bull job queue when running multiple instances
- Use `REDIS_URL` environment variable for managed Redis (Upstash, etc.)
- MinIO can be replaced with AWS S3 by removing `S3_ENDPOINT` env var
