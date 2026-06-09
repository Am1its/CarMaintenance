# CarMaintenance 🚗

A Hebrew RTL mobile-web app for tracking car maintenance — service intervals, battery health, annual tests (טסט), and email reminders. Built for Israeli car owners.

**Live:** https://carmaintenance-kkfz.onrender.com

---

## Features

- Enter your email to get your personal dashboard — no passwords, no sign-up
- Track multiple cars per dashboard
- **Dual-trigger service alerts** — by date interval or KM, whichever comes first
- **Battery tracking** — 15,000 km / 1 year intervals, logs each replacement
- **Annual test (טסט) reminders**
- **Color-coded status** — green (בסדר) / amber (מתקרב) / red (דרוש טיפול)
- **KM progress bars** per car
- **Car photos** — upload from camera or gallery, compressed automatically
- **Notes & tasks** — per-car notepad and checklist with done/active sections
- **Event history** — log of every service, test, and battery replacement
- **Partial data** — save a car with just its name, fill details later
- **Daily email alerts** at 8:00 AM — sent to every registered user
- Log service / test / battery done with one tap

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express v5 + TypeScript |
| Database | PostgreSQL via [Prisma v5](https://www.prisma.io/) |
| Frontend | React + Vite + Tailwind CSS v3 |
| Email | Nodemailer + Gmail SMTP |
| Hosting | [Render](https://render.com) (free tier) |
| DB hosting | [Neon](https://neon.tech) (serverless Postgres) |
| Tests | Vitest |

---

## Running Locally

### Prerequisites

- Node.js 18+
- PostgreSQL running locally

### Setup

```bash
git clone https://github.com/Am1its/CarMaintenance.git
cd CarMaintenance
npm install
```

Create a `.env` file (copy from `.env.example`):

```env
DATABASE_URL=postgresql://user@localhost:5432/carmaintenance
GMAIL_USER=your-sender@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
ADMIN_SECRET=your_admin_secret
PORT=3000
APP_URL=http://localhost:3000
```

> **Gmail App Password:** Go to Google Account → Security → 2-Step Verification (enable) → App passwords → create one for this app.

Run the database migration:

```bash
npx prisma migrate dev
```

Start development servers (two terminals):

```bash
# Terminal 1 — backend (auto-restarts on .ts changes)
npm run dev:server

# Terminal 2 — frontend
npm run dev:client
```

Open http://localhost:5173

### Build for production

```bash
npm run build
npm start
```

---

## Project Structure

```
├── src/
│   ├── index.ts              # Express app entry
│   ├── cron.ts               # Daily 8am notification job
│   ├── db.ts                 # Prisma singleton
│   ├── routes/
│   │   ├── dashboard.ts      # Email find-or-create, dashboard data + computed stats
│   │   └── cars.ts           # CRUD, service/test/battery done, task CRUD
│   └── services/
│       ├── calculations.ts   # Pure date/KM logic (UTC-safe), carStatus
│       ├── notifications.ts  # Alert rule engine
│       └── email.ts          # Gmail SMTP via Nodemailer, Hebrew templates
├── client/
│   └── src/
│       ├── pages/
│       │   ├── Landing.tsx       # Email login
│       │   └── Dashboard.tsx     # Main car list
│       └── components/
│           ├── CarCard.tsx        # Card with stats, history, actions
│           ├── CarForm.tsx        # Add/edit modal
│           ├── CarTasksModal.tsx  # Notes + tasks modal
│           └── StatusPill.tsx     # Status badge
├── prisma/schema.prisma      # DB schema
└── tests/                    # Vitest unit tests
```

---

## Deployment

Deployed on Render (free tier) + Neon PostgreSQL.

Since Render free services sleep after inactivity, [cron-job.org](https://cron-job.org) pings `https://carmaintenance-kkfz.onrender.com/api/health` at **07:55** every day to wake it before the 8:00 AM email cron fires.

### Required env vars in Render

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `GMAIL_USER` | Gmail address to send alerts from |
| `GMAIL_APP_PASSWORD` | 16-char App Password for that Gmail account |
| `ADMIN_SECRET` | Secret for the `/admin` route |
| `APP_URL` | `https://carmaintenance-kkfz.onrender.com` |
