# StitchFlow 🪡

**Premium Tailoring Business Management App**

A complete mobile application for boutique tailoring businesses to manage customers, orders, garment photos, stitching charges, and WhatsApp notifications.

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ and npm 9+
- Docker Desktop (running)
- Expo Go app on your phone (or iOS/Android simulator)

### 1. Start Infrastructure
```bash
# From project root
docker compose up postgres redis minio -d
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your settings (defaults work for local dev)
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

Backend runs on http://localhost:3000
Swagger docs: http://localhost:3000/api/docs

### 3. Mobile App Setup
```bash
cd mobile
cp .env.example .env
# Set EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000
npm install
npx expo start
```

Scan the QR code with Expo Go app.

---

## Demo Credentials
- Email: `admin@stitchflow.app`
- Password: `Demo@1234`

---

## Architecture

```
┌─────────────────┐     REST API      ┌──────────────────┐
│   Expo Mobile   │ ◄──────────────► │  NestJS Backend  │
│  React Native   │                   │  (Node.js 18)    │
└─────────────────┘                   └────────┬─────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          │                    │                    │
                   ┌──────┴───────┐   ┌────────┴───────┐   ┌───────┴──────┐
                   │  PostgreSQL  │   │    Redis +     │   │  MinIO / S3  │
                   │  (Prisma)    │   │  Bull Queue    │   │  (Photos)    │
                   └──────────────┘   └────────────────┘   └──────────────┘
                                               │
                                      ┌────────┴───────┐
                                      │  WhatsApp      │
                                      │  Cloud API     │
                                      │  (Meta)        │
                                      └────────────────┘
```

---

## Features

| Feature | Status |
|---------|--------|
| Designer registration & login | ✅ |
| Customer management | ✅ |
| Order creation with garment items | ✅ |
| Camera & photo upload | ✅ |
| Live order total calculation | ✅ |
| Order status lifecycle | ✅ |
| Payment tracking | ✅ |
| WhatsApp notifications (sandbox) | ✅ |
| WhatsApp notifications (live) | ⚙️ Requires Meta credentials |
| Search & filters | ✅ |
| Dashboard with stats | ✅ |

---

## WhatsApp Configuration

### Sandbox Mode (Default)
Works out of the box — messages are logged instead of sent.
Toggle: Settings → WhatsApp → Sandbox Mode ON

### Live Mode
Requires:
1. Meta Business Account
2. WhatsApp Business App approval
3. `WHATSAPP_PHONE_NUMBER_ID` from Meta developer console
4. `WHATSAPP_ACCESS_TOKEN` (permanent system user token)
5. Approved message templates

See [docs/whatsapp-setup.md](docs/whatsapp-setup.md) for step-by-step guide.

---

## External Accounts Needed (Production)

| Service | Purpose | Free Tier? |
|---------|---------|-----------|
| Meta for Developers | WhatsApp Cloud API | Yes (1000 msgs/month free) |
| AWS S3 / Cloudflare R2 | Garment photo storage | Pay per use |
| Cloud hosting (Railway / Render / VPS) | Backend deployment | Free tiers available |
| PostgreSQL (Supabase / Neon) | Database | Free tiers available |
| Redis (Upstash) | Job queue | Free tier available |

---

## Running Tests
```bash
cd backend
npm test              # Unit tests
npm run test:e2e      # End-to-end API tests
npm run test:cov      # Coverage report
```

---

## Project Structure
```
stitchflow/
├── backend/           # NestJS + Prisma API
│   ├── src/
│   │   ├── auth/      # Authentication
│   │   ├── customers/ # Customer management
│   │   ├── orders/    # Order lifecycle
│   │   ├── uploads/   # Photo storage
│   │   └── whatsapp/  # Messaging
│   └── prisma/        # Schema & migrations
├── mobile/            # Expo React Native app
│   ├── app/           # Expo Router screens
│   ├── components/    # Reusable UI components
│   ├── lib/           # API client, hooks, utils
│   └── theme/         # Design system
├── docker-compose.yml
└── README.md
```

---

Built with ❤️ for boutique tailoring businesses.
