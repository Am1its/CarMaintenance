# Car Maintenance Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Hebrew RTL mobile-web app where a single admin generates unique dashboard URLs for car owners to track vehicle maintenance and receive automated email alerts.

**Architecture:** Express API backend with Prisma/PostgreSQL, a React + Tailwind CSS frontend served from the same server, and a daily cron job that checks all cars and sends bundled Resend emails when alert thresholds are crossed. The URL token is the sole identity mechanism — no authentication layer.

**Tech Stack:** Node.js + Express, TypeScript, PostgreSQL, Prisma ORM, React 18, Tailwind CSS v3, Resend (email), Vite (frontend build), node-cron (scheduler), Vitest (tests)

---

## File Map

```
/
├── prisma/
│   └── schema.prisma                  # DB schema (Dashboard, Car, NotificationLog)
├── src/
│   ├── index.ts                       # Express app + Vite dev middleware wiring
│   ├── db.ts                          # Prisma client singleton
│   ├── routes/
│   │   ├── admin.ts                   # POST /api/admin/dashboards
│   │   ├── dashboard.ts               # GET /api/d/:token, PUT /api/d/:token/email
│   │   └── cars.ts                    # POST/PUT/DELETE /api/d/:token/cars/:id
│   ├── services/
│   │   ├── calculations.ts            # Pure functions: next service date, KM remaining, status
│   │   ├── notifications.ts           # Threshold checking + email payload building
│   │   └── email.ts                   # Resend wrapper
│   └── cron.ts                        # Daily job: load all cars, run notifications
├── client/
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                    # React Router setup
│       ├── api.ts                     # Typed fetch helpers
│       ├── pages/
│       │   ├── SetEmail.tsx           # First-visit email capture
│       │   ├── Dashboard.tsx          # Car list + status cards
│       │   └── Admin.tsx              # Admin URL generator
│       └── components/
│           ├── CarCard.tsx            # Per-car status card
│           ├── CarForm.tsx            # Add/edit car form (modal)
│           └── StatusPill.tsx         # Green/yellow/red badge
├── tests/
│   ├── calculations.test.ts
│   └── notifications.test.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `.env.example`

- [ ] **Step 1: Init project**

```bash
mkdir -p src/routes src/services client/src/pages client/src/components tests
npm init -y
```

- [ ] **Step 2: Install backend deps**

```bash
npm install express @prisma/client node-cron resend dotenv
npm install -D typescript @types/express @types/node @types/node-cron ts-node nodemon prisma vitest
```

- [ ] **Step 3: Install frontend deps**

```bash
npm install react react-dom react-router-dom
npm install -D @types/react @types/react-dom vite @vitejs/plugin-react tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src", "tests"],
  "exclude": ["node_modules", "client"]
}
```

- [ ] **Step 5: Write `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'client',
  plugins: [react()],
  build: { outDir: '../dist/client' },
  server: { proxy: { '/api': 'http://localhost:3000' } }
})
```

- [ ] **Step 6: Write `.env.example`**

```
DATABASE_URL=postgresql://user:password@localhost:5432/carmaintenance
RESEND_API_KEY=re_xxxx
ADMIN_SECRET=change-me
PORT=3000
APP_URL=http://localhost:3000
```

- [ ] **Step 7: Add scripts to `package.json`**

Add under `"scripts"`:
```json
{
  "dev:server": "nodemon --exec ts-node src/index.ts",
  "dev:client": "vite",
  "build": "tsc && vite build",
  "test": "vitest run",
  "db:migrate": "prisma migrate dev",
  "db:studio": "prisma studio"
}
```

- [ ] **Step 8: Configure Tailwind for RTL in `client/src/main.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

In `tailwind.config.js`:
```js
module.exports = {
  content: ['./client/**/*.{html,tsx,ts}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "chore: project scaffold"
```

---

## Task 2: Database Schema

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Write schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Dashboard {
  id          String   @id @default(uuid())
  token       String   @unique
  ownerEmail  String?
  createdAt   DateTime @default(now())
  cars        Car[]
}

model Car {
  id                    String            @id @default(uuid())
  dashboardId           String
  dashboard             Dashboard         @relation(fields: [dashboardId], references: [id])
  label                 String
  licensePlate          String
  lastServiceDate       DateTime
  lastServiceKm         Int
  currentKm             Int
  serviceIntervalMonths Int
  serviceIntervalKm     Int
  nextTestDate          DateTime
  updatedAt             DateTime          @updatedAt
  notificationLogs      NotificationLog[]
}

enum AlertType {
  TEST_30D
  TEST_14D
  TEST_OVERDUE
  SERVICE_DATE_30D
  SERVICE_DATE_14D
  SERVICE_DATE_OVERDUE
  SERVICE_KM_1000
  SERVICE_KM_300
}

model NotificationLog {
  id        String    @id @default(uuid())
  carId     String
  car       Car       @relation(fields: [carId], references: [id], onDelete: Cascade)
  alertType AlertType
  sentAt    DateTime  @default(now())
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name init
```

Expected: Migration created and applied, `prisma/migrations/` folder created.

- [ ] **Step 3: Write `src/db.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 4: Commit**

```bash
git add prisma/ src/db.ts
git commit -m "feat: database schema and Prisma client"
```

---

## Task 3: Calculation Service (Pure Functions)

**Files:**
- Create: `src/services/calculations.ts`
- Create: `tests/calculations.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/calculations.test.ts
import { describe, it, expect } from 'vitest'
import {
  nextServiceDate,
  kmRemaining,
  daysUntil,
  carStatus,
} from '../src/services/calculations'

describe('nextServiceDate', () => {
  it('adds 6 months to last service date', () => {
    const last = new Date('2026-01-01')
    const result = nextServiceDate(last, 6)
    expect(result).toEqual(new Date('2026-07-01'))
  })

  it('adds 12 months to last service date', () => {
    const last = new Date('2026-01-01')
    const result = nextServiceDate(last, 12)
    expect(result).toEqual(new Date('2027-01-01'))
  })
})

describe('kmRemaining', () => {
  it('returns km left until service', () => {
    expect(kmRemaining(50000, 10000, 55000)).toBe(5000)
  })

  it('returns negative when overdue', () => {
    expect(kmRemaining(50000, 10000, 61000)).toBe(-1000)
  })
})

describe('daysUntil', () => {
  it('returns positive days for future date', () => {
    const today = new Date('2026-06-08')
    const future = new Date('2026-06-18')
    expect(daysUntil(future, today)).toBe(10)
  })

  it('returns negative for past date', () => {
    const today = new Date('2026-06-08')
    const past = new Date('2026-06-01')
    expect(daysUntil(past, today)).toBe(-7)
  })
})

describe('carStatus', () => {
  it('returns OK when all thresholds are far away', () => {
    expect(carStatus({ daysUntilServiceDate: 60, kmRemainingService: 5000, daysUntilTest: 60 })).toBe('ok')
  })

  it('returns APPROACHING when any threshold is within warning window', () => {
    expect(carStatus({ daysUntilServiceDate: 60, kmRemainingService: 5000, daysUntilTest: 14 })).toBe('approaching')
  })

  it('returns DUE when any countdown is at or past zero', () => {
    expect(carStatus({ daysUntilServiceDate: -1, kmRemainingService: 5000, daysUntilTest: 60 })).toBe('due')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: All tests fail with "Cannot find module" or similar.

- [ ] **Step 3: Implement `src/services/calculations.ts`**

```typescript
export function nextServiceDate(lastServiceDate: Date, intervalMonths: number): Date {
  const result = new Date(lastServiceDate)
  result.setMonth(result.getMonth() + intervalMonths)
  return result
}

export function kmRemaining(lastServiceKm: number, intervalKm: number, currentKm: number): number {
  return lastServiceKm + intervalKm - currentKm
}

export function daysUntil(targetDate: Date, today: Date = new Date()): number {
  const todayMidnight = new Date(today)
  todayMidnight.setHours(0, 0, 0, 0)
  const targetMidnight = new Date(targetDate)
  targetMidnight.setHours(0, 0, 0, 0)
  return Math.round((targetMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))
}

type StatusInput = {
  daysUntilServiceDate: number
  kmRemainingService: number
  daysUntilTest: number
}

export type CarStatusResult = 'ok' | 'approaching' | 'due'

export function carStatus({ daysUntilServiceDate, kmRemainingService, daysUntilTest }: StatusInput): CarStatusResult {
  if (daysUntilServiceDate <= 0 || kmRemainingService <= 0 || daysUntilTest <= 0) return 'due'
  if (daysUntilServiceDate <= 30 || kmRemainingService <= 1000 || daysUntilTest <= 30) return 'approaching'
  return 'ok'
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/calculations.ts tests/calculations.test.ts
git commit -m "feat: calculation service with tests"
```

---

## Task 4: Notification Service

**Files:**
- Create: `src/services/notifications.ts`
- Create: `tests/notifications.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/notifications.test.ts
import { describe, it, expect } from 'vitest'
import { getAlertsForCar } from '../src/services/notifications'
import { AlertType } from '@prisma/client'

const baseCar = {
  id: 'car-1',
  label: 'טסטה לבנה',
  licensePlate: '123-456',
  lastServiceDate: new Date('2025-12-01'),
  lastServiceKm: 50000,
  currentKm: 55000,
  serviceIntervalMonths: 6,
  serviceIntervalKm: 10000,
  nextTestDate: new Date('2026-07-08'),
  notificationLogs: [] as { alertType: AlertType; sentAt: Date }[],
}

describe('getAlertsForCar', () => {
  it('returns no alerts when everything is fine', () => {
    const car = { ...baseCar, currentKm: 51000, nextTestDate: new Date('2026-12-01') }
    const alerts = getAlertsForCar(car, new Date('2026-06-08'))
    expect(alerts).toHaveLength(0)
  })

  it('returns TEST_30D when test is within 30 days', () => {
    const car = { ...baseCar, nextTestDate: new Date('2026-07-01'), currentKm: 51000 }
    const alerts = getAlertsForCar(car, new Date('2026-06-08'))
    expect(alerts).toContain(AlertType.TEST_30D)
  })

  it('returns TEST_14D when test is within 14 days', () => {
    const car = { ...baseCar, nextTestDate: new Date('2026-06-15'), currentKm: 51000 }
    const alerts = getAlertsForCar(car, new Date('2026-06-08'))
    expect(alerts).toContain(AlertType.TEST_14D)
  })

  it('returns TEST_OVERDUE when test date has passed', () => {
    const car = { ...baseCar, nextTestDate: new Date('2026-06-01'), currentKm: 51000 }
    const alerts = getAlertsForCar(car, new Date('2026-06-08'))
    expect(alerts).toContain(AlertType.TEST_OVERDUE)
  })

  it('returns SERVICE_KM_1000 when 1000 km or fewer remain', () => {
    const car = { ...baseCar, currentKm: 59200, nextTestDate: new Date('2026-12-01') }
    const alerts = getAlertsForCar(car, new Date('2026-06-08'))
    expect(alerts).toContain(AlertType.SERVICE_KM_1000)
  })

  it('returns SERVICE_KM_300 when 300 km or fewer remain', () => {
    const car = { ...baseCar, currentKm: 59800, nextTestDate: new Date('2026-12-01') }
    const alerts = getAlertsForCar(car, new Date('2026-06-08'))
    expect(alerts).toContain(AlertType.SERVICE_KM_300)
  })

  it('skips alert already sent this cycle', () => {
    const car = {
      ...baseCar,
      nextTestDate: new Date('2026-07-01'),
      currentKm: 51000,
      notificationLogs: [{ alertType: AlertType.TEST_30D, sentAt: new Date() }],
    }
    const alerts = getAlertsForCar(car, new Date('2026-06-08'))
    expect(alerts).not.toContain(AlertType.TEST_30D)
  })

  it('re-fires overdue alert if last sent more than 7 days ago', () => {
    const eightDaysAgo = new Date('2026-05-31')
    const car = {
      ...baseCar,
      nextTestDate: new Date('2026-06-01'),
      currentKm: 51000,
      notificationLogs: [{ alertType: AlertType.TEST_OVERDUE, sentAt: eightDaysAgo }],
    }
    const alerts = getAlertsForCar(car, new Date('2026-06-08'))
    expect(alerts).toContain(AlertType.TEST_OVERDUE)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: All tests fail.

- [ ] **Step 3: Implement `src/services/notifications.ts`**

```typescript
import { AlertType } from '@prisma/client'
import { nextServiceDate, kmRemaining, daysUntil } from './calculations'

type CarWithLogs = {
  id: string
  lastServiceDate: Date
  lastServiceKm: number
  currentKm: number
  serviceIntervalMonths: number
  serviceIntervalKm: number
  nextTestDate: Date
  notificationLogs: { alertType: AlertType; sentAt: Date }[]
}

function alreadySent(logs: { alertType: AlertType; sentAt: Date }[], type: AlertType, overdueWindowDays = 0): boolean {
  const existing = logs.filter(l => l.alertType === type)
  if (existing.length === 0) return false
  if (overdueWindowDays === 0) return true
  const mostRecent = existing.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())[0]
  return daysUntil(new Date(), mostRecent.sentAt) < overdueWindowDays
}

export function getAlertsForCar(car: CarWithLogs, today: Date = new Date()): AlertType[] {
  const alerts: AlertType[] = []
  const logs = car.notificationLogs

  // Test alerts
  const daysToTest = daysUntil(car.nextTestDate, today)
  if (daysToTest < 0) {
    if (!alreadySent(logs, AlertType.TEST_OVERDUE, 7)) alerts.push(AlertType.TEST_OVERDUE)
  } else if (daysToTest <= 14) {
    if (!alreadySent(logs, AlertType.TEST_14D)) alerts.push(AlertType.TEST_14D)
  } else if (daysToTest <= 30) {
    if (!alreadySent(logs, AlertType.TEST_30D)) alerts.push(AlertType.TEST_30D)
  }

  // Service date alerts
  const svcDate = nextServiceDate(car.lastServiceDate, car.serviceIntervalMonths)
  const daysToService = daysUntil(svcDate, today)
  if (daysToService < 0) {
    if (!alreadySent(logs, AlertType.SERVICE_DATE_OVERDUE, 7)) alerts.push(AlertType.SERVICE_DATE_OVERDUE)
  } else if (daysToService <= 14) {
    if (!alreadySent(logs, AlertType.SERVICE_DATE_14D)) alerts.push(AlertType.SERVICE_DATE_14D)
  } else if (daysToService <= 30) {
    if (!alreadySent(logs, AlertType.SERVICE_DATE_30D)) alerts.push(AlertType.SERVICE_DATE_30D)
  }

  // Service KM alerts
  const kmLeft = kmRemaining(car.lastServiceKm, car.serviceIntervalKm, car.currentKm)
  if (kmLeft <= 300) {
    if (!alreadySent(logs, AlertType.SERVICE_KM_300)) alerts.push(AlertType.SERVICE_KM_300)
  } else if (kmLeft <= 1000) {
    if (!alreadySent(logs, AlertType.SERVICE_KM_1000)) alerts.push(AlertType.SERVICE_KM_1000)
  }

  return alerts
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/notifications.ts tests/notifications.test.ts
git commit -m "feat: notification threshold service with tests"
```

---

## Task 5: Email Service

**Files:**
- Create: `src/services/email.ts`

- [ ] **Step 1: Write `src/services/email.ts`**

```typescript
import { Resend } from 'resend'
import { AlertType } from '@prisma/client'

const resend = new Resend(process.env.RESEND_API_KEY)

type CarAlert = {
  label: string
  licensePlate: string
  alerts: AlertType[]
}

function alertToHebrew(type: AlertType): string {
  const map: Record<AlertType, string> = {
    TEST_30D: 'הטסט מתקרב — נותרו פחות מ-30 יום',
    TEST_14D: 'הטסט מתקרב — נותרו פחות מ-14 יום',
    TEST_OVERDUE: 'הטסט עבר את תאריכו — יש לבצע טסט בדחיפות',
    SERVICE_DATE_30D: 'הטיפול מתקרב — נותרו פחות מ-30 יום',
    SERVICE_DATE_14D: 'הטיפול מתקרב — נותרו פחות מ-14 יום',
    SERVICE_DATE_OVERDUE: 'הטיפול עבר את תאריכו — יש לבצע טיפול בדחיפות',
    SERVICE_KM_1000: 'הטיפול מתקרב — נותרו פחות מ-1,000 ק"מ',
    SERVICE_KM_300: 'הטיפול קרוב מאוד — נותרו פחות מ-300 ק"מ',
  }
  return map[type]
}

export async function sendMaintenanceAlert(
  toEmail: string,
  dashboardUrl: string,
  carAlerts: CarAlert[]
): Promise<void> {
  const carSections = carAlerts
    .map(
      ({ label, licensePlate, alerts }) => `
      <div style="margin-bottom:20px;padding:16px;border:1px solid #e5e7eb;border-radius:8px;direction:rtl;text-align:right;">
        <strong>${label} (${licensePlate})</strong>
        <ul style="margin-top:8px;">
          ${alerts.map(a => `<li>${alertToHebrew(a)}</li>`).join('')}
        </ul>
      </div>`
    )
    .join('')

  await resend.emails.send({
    from: 'תזכורת רכב <no-reply@yourdomain.com>',
    to: toEmail,
    subject: 'תזכורת תחזוקת רכב',
    html: `
      <div style="font-family:Arial,sans-serif;direction:rtl;text-align:right;max-width:600px;margin:0 auto;">
        <h2>תזכורת תחזוקת רכב</h2>
        <p>להלן עדכון על הרכבים הדורשים תשומת לבך:</p>
        ${carSections}
        <a href="${dashboardUrl}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">עדכן פרטים</a>
      </div>
    `,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/email.ts
git commit -m "feat: Resend email service with Hebrew templates"
```

---

## Task 6: Express API

**Files:**
- Create: `src/index.ts`
- Create: `src/routes/admin.ts`
- Create: `src/routes/dashboard.ts`
- Create: `src/routes/cars.ts`

- [ ] **Step 1: Write `src/routes/admin.ts`**

```typescript
import { Router } from 'express'
import { prisma } from '../db'
import crypto from 'crypto'

const router = Router()

// Simple secret check — add ADMIN_SECRET to .env
router.use((req, res, next) => {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
})

router.post('/dashboards', async (req, res) => {
  const token = crypto.randomBytes(16).toString('hex')
  const dashboard = await prisma.dashboard.create({ data: { token } })
  const url = `${process.env.APP_URL}/d/${dashboard.token}`
  res.json({ token: dashboard.token, url })
})

export default router
```

- [ ] **Step 2: Write `src/routes/dashboard.ts`**

```typescript
import { Router } from 'express'
import { prisma } from '../db'
import { nextServiceDate, kmRemaining, daysUntil, carStatus } from '../services/calculations'

const router = Router()

router.get('/:token', async (req, res) => {
  const dashboard = await prisma.dashboard.findUnique({
    where: { token: req.params.token },
    include: { cars: true },
  })
  if (!dashboard) return res.status(404).json({ error: 'Not found' })

  const today = new Date()
  const carsWithStatus = dashboard.cars.map(car => {
    const svcDate = nextServiceDate(car.lastServiceDate, car.serviceIntervalMonths)
    const kmLeft = kmRemaining(car.lastServiceKm, car.serviceIntervalKm, car.currentKm)
    const daysToService = daysUntil(svcDate, today)
    const daysToTest = daysUntil(car.nextTestDate, today)
    return {
      ...car,
      nextServiceDate: svcDate,
      kmRemainingService: kmLeft,
      daysUntilServiceDate: daysToService,
      daysUntilTest: daysToTest,
      status: carStatus({ daysUntilServiceDate: daysToService, kmRemainingService: kmLeft, daysUntilTest: daysToTest }),
    }
  })

  res.json({ ...dashboard, cars: carsWithStatus })
})

router.put('/:token/email', async (req, res) => {
  const { email } = req.body
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' })
  const dashboard = await prisma.dashboard.findUnique({ where: { token: req.params.token } })
  if (!dashboard) return res.status(404).json({ error: 'Not found' })
  await prisma.dashboard.update({ where: { token: req.params.token }, data: { ownerEmail: email } })
  res.json({ ok: true })
})

export default router
```

- [ ] **Step 3: Write `src/routes/cars.ts`**

```typescript
import { Router } from 'express'
import { prisma } from '../db'
import { AlertType } from '@prisma/client'

const router = Router({ mergeParams: true })

const SERVICE_ALERT_TYPES: AlertType[] = [
  AlertType.SERVICE_DATE_30D, AlertType.SERVICE_DATE_14D, AlertType.SERVICE_DATE_OVERDUE,
  AlertType.SERVICE_KM_1000, AlertType.SERVICE_KM_300,
]
const TEST_ALERT_TYPES: AlertType[] = [
  AlertType.TEST_30D, AlertType.TEST_14D, AlertType.TEST_OVERDUE,
]

async function dashboardOwnscar(token: string, carId: string): Promise<boolean> {
  const car = await prisma.car.findFirst({ where: { id: carId, dashboard: { token } } })
  return car !== null
}

router.post('/', async (req, res) => {
  const dashboard = await prisma.dashboard.findUnique({ where: { token: req.params.token } })
  if (!dashboard) return res.status(404).json({ error: 'Not found' })
  const car = await prisma.car.create({ data: { ...req.body, dashboardId: dashboard.id } })
  res.json(car)
})

router.put('/:carId', async (req, res) => {
  if (!await dashboardOwnscar(req.params.token, req.params.carId)) return res.status(404).json({ error: 'Not found' })
  const car = await prisma.car.update({ where: { id: req.params.carId }, data: req.body })
  res.json(car)
})

router.post('/:carId/service-done', async (req, res) => {
  if (!await dashboardOwnscar(req.params.token, req.params.carId)) return res.status(404).json({ error: 'Not found' })
  const car = await prisma.car.findUnique({ where: { id: req.params.carId } })
  if (!car) return res.status(404).json({ error: 'Not found' })
  await prisma.notificationLog.deleteMany({ where: { carId: car.id, alertType: { in: SERVICE_ALERT_TYPES } } })
  const updated = await prisma.car.update({
    where: { id: car.id },
    data: { lastServiceDate: new Date(), lastServiceKm: car.currentKm },
  })
  res.json(updated)
})

router.post('/:carId/test-done', async (req, res) => {
  if (!await dashboardOwnscar(req.params.token, req.params.carId)) return res.status(404).json({ error: 'Not found' })
  await prisma.notificationLog.deleteMany({ where: { carId: req.params.carId, alertType: { in: TEST_ALERT_TYPES } } })
  const nextTest = new Date()
  nextTest.setFullYear(nextTest.getFullYear() + 1)
  const updated = await prisma.car.update({ where: { id: req.params.carId }, data: { nextTestDate: nextTest } })
  res.json(updated)
})

router.delete('/:carId', async (req, res) => {
  if (!await dashboardOwnscar(req.params.token, req.params.carId)) return res.status(404).json({ error: 'Not found' })
  await prisma.car.delete({ where: { id: req.params.carId } })
  res.json({ ok: true })
})

export default router
```

- [ ] **Step 4: Write `src/index.ts`**

```typescript
import express from 'express'
import path from 'path'
import dotenv from 'dotenv'
import adminRoutes from './routes/admin'
import dashboardRoutes from './routes/dashboard'
import carRoutes from './routes/cars'

dotenv.config()

const app = express()
app.use(express.json())

app.use('/api/admin', adminRoutes)
app.use('/api/d', dashboardRoutes)
app.use('/api/d/:token/cars', carRoutes)

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client')))
  app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'client', 'index.html')))
}

const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

export default app
```

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: Express API routes (admin, dashboard, cars)"
```

---

## Task 7: Cron Job

**Files:**
- Create: `src/cron.ts`

- [ ] **Step 1: Write `src/cron.ts`**

```typescript
import cron from 'node-cron'
import { prisma } from './db'
import { getAlertsForCar } from './services/notifications'
import { sendMaintenanceAlert } from './services/email'

async function runDailyCheck(): Promise<void> {
  const dashboards = await prisma.dashboard.findMany({
    where: { ownerEmail: { not: null } },
    include: {
      cars: { include: { notificationLogs: true } },
    },
  })

  for (const dashboard of dashboards) {
    if (!dashboard.ownerEmail) continue

    const carAlerts: { label: string; licensePlate: string; alerts: AlertType[] }[] = []

    for (const car of dashboard.cars) {
      const alerts = getAlertsForCar(car)
      if (alerts.length === 0) continue

      await prisma.notificationLog.createMany({
        data: alerts.map(alertType => ({ carId: car.id, alertType })),
      })

      carAlerts.push({ label: car.label, licensePlate: car.licensePlate, alerts })
    }

    if (carAlerts.length > 0) {
      const dashboardUrl = `${process.env.APP_URL}/d/${dashboard.token}`
      await sendMaintenanceAlert(dashboard.ownerEmail, dashboardUrl, carAlerts)
    }
  }
}

// Runs every day at 8:00 AM
cron.schedule('0 8 * * *', () => {
  runDailyCheck().catch(console.error)
})

export { runDailyCheck }
```

- [ ] **Step 2: Import cron in `src/index.ts`**

Add this line after the dotenv import:
```typescript
import './cron'
```

- [ ] **Step 3: Commit**

```bash
git add src/cron.ts src/index.ts
git commit -m "feat: daily cron job for maintenance alerts"
```

---

## Task 8: React Frontend Shell

**Files:**
- Create: `client/index.html`
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `client/src/api.ts`

- [ ] **Step 1: Write `client/index.html`**

```html
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>תחזוקת רכב</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 2: Write `client/src/main.tsx`**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './main.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 3: Write `client/src/App.tsx`**

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/d/:token" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: Write `client/src/api.ts`**

```typescript
const base = '/api'

export async function getDashboard(token: string) {
  const res = await fetch(`${base}/d/${token}`)
  if (!res.ok) throw new Error('Dashboard not found')
  return res.json()
}

export async function setEmail(token: string, email: string) {
  const res = await fetch(`${base}/d/${token}/email`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error('Failed to save email')
  return res.json()
}

export async function addCar(token: string, data: Record<string, unknown>) {
  const res = await fetch(`${base}/d/${token}/cars`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to add car')
  return res.json()
}

export async function updateCar(token: string, carId: string, data: Record<string, unknown>) {
  const res = await fetch(`${base}/d/${token}/cars/${carId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update car')
  return res.json()
}

export async function markServiceDone(token: string, carId: string) {
  const res = await fetch(`${base}/d/${token}/cars/${carId}/service-done`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to mark service done')
  return res.json()
}

export async function markTestDone(token: string, carId: string) {
  const res = await fetch(`${base}/d/${token}/cars/${carId}/test-done`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to mark test done')
  return res.json()
}

export async function deleteCar(token: string, carId: string) {
  const res = await fetch(`${base}/d/${token}/cars/${carId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete car')
  return res.json()
}

export async function createDashboard(adminSecret: string) {
  const res = await fetch(`${base}/admin/dashboards`, {
    method: 'POST',
    headers: { 'x-admin-secret': adminSecret },
  })
  if (!res.ok) throw new Error('Failed to create dashboard')
  return res.json()
}
```

- [ ] **Step 5: Commit**

```bash
git add client/
git commit -m "feat: React frontend shell with routing and API client"
```

---

## Task 9: StatusPill + CarCard Components

**Files:**
- Create: `client/src/components/StatusPill.tsx`
- Create: `client/src/components/CarCard.tsx`

- [ ] **Step 1: Write `client/src/components/StatusPill.tsx`**

```typescript
type Props = { status: 'ok' | 'approaching' | 'due' }

const config = {
  ok:         { label: 'בסדר',        className: 'bg-green-100 text-green-800' },
  approaching:{ label: 'מתקרב',       className: 'bg-yellow-100 text-yellow-800' },
  due:        { label: 'דרוש טיפול',  className: 'bg-red-100 text-red-800' },
}

export default function StatusPill({ status }: Props) {
  const { label, className } = config[status]
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${className}`}>
      {label}
    </span>
  )
}
```

- [ ] **Step 2: Write `client/src/components/CarCard.tsx`**

```typescript
import StatusPill from './StatusPill'
import { markServiceDone, markTestDone } from '../api'

type Car = {
  id: string
  label: string
  licensePlate: string
  status: 'ok' | 'approaching' | 'due'
  daysUntilTest: number
  kmRemainingService: number
  daysUntilServiceDate: number
  nextServiceDate: string
}

type Props = {
  car: Car
  token: string
  onRefresh: () => void
  onEdit: (car: Car) => void
}

export default function CarCard({ car, token, onRefresh, onEdit }: Props) {
  const handleServiceDone = async () => {
    await markServiceDone(token, car.id)
    onRefresh()
  }

  const handleTestDone = async () => {
    await markTestDone(token, car.id)
    onRefresh()
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-bold text-lg">{car.label}</p>
          <p className="text-gray-500 text-sm">{car.licensePlate}</p>
        </div>
        <StatusPill status={car.status} />
      </div>

      <div className="text-sm text-gray-700 space-y-1 mb-4">
        <p>טסט: בעוד <strong>{car.daysUntilTest}</strong> ימים</p>
        <p>טיפול (תאריך): בעוד <strong>{car.daysUntilServiceDate}</strong> ימים</p>
        <p>טיפול (ק"מ): נותרו <strong>{car.kmRemainingService.toLocaleString()}</strong> ק"מ</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onEdit(car)}
          className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
        >
          עריכה
        </button>
        <button
          onClick={handleServiceDone}
          className="text-sm px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-800"
        >
          בצעתי טיפול
        </button>
        <button
          onClick={handleTestDone}
          className="text-sm px-3 py-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-800"
        >
          בצעתי טסט
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/
git commit -m "feat: StatusPill and CarCard components"
```

---

## Task 10: CarForm Component

**Files:**
- Create: `client/src/components/CarForm.tsx`

- [ ] **Step 1: Write `client/src/components/CarForm.tsx`**

```typescript
import { useState } from 'react'
import { addCar, updateCar } from '../api'

type CarInput = {
  id?: string
  label: string
  licensePlate: string
  lastServiceDate: string
  lastServiceKm: number
  currentKm: number
  serviceIntervalMonths: number
  serviceIntervalKm: number
  nextTestDate: string
}

type Props = {
  token: string
  initial?: CarInput
  onSave: () => void
  onCancel: () => void
}

const empty: CarInput = {
  label: '', licensePlate: '', lastServiceDate: '', lastServiceKm: 0,
  currentKm: 0, serviceIntervalMonths: 6, serviceIntervalKm: 6000, nextTestDate: '',
}

export default function CarForm({ token, initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<CarInput>(initial ?? empty)

  const set = (key: keyof CarInput, value: string | number) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.id) {
      await updateCar(token, form.id, form)
    } else {
      await addCar(token, form)
    }
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-10" dir="rtl">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-t-2xl w-full max-w-lg p-6 space-y-4"
      >
        <h2 className="text-xl font-bold">{form.id ? 'עריכת רכב' : 'הוספת רכב'}</h2>

        <div><label className="block text-sm mb-1">סוג / תיאור רכב</label>
          <input className="input" value={form.label} onChange={e => set('label', e.target.value)} required /></div>

        <div><label className="block text-sm mb-1">לוחית רישוי</label>
          <input className="input" value={form.licensePlate} onChange={e => set('licensePlate', e.target.value)} required /></div>

        <div><label className="block text-sm mb-1">תאריך טיפול אחרון</label>
          <input type="date" className="input" value={form.lastServiceDate} onChange={e => set('lastServiceDate', e.target.value)} required /></div>

        <div><label className="block text-sm mb-1">ק"מ בטיפול האחרון</label>
          <input type="number" className="input" value={form.lastServiceKm} onChange={e => set('lastServiceKm', +e.target.value)} required /></div>

        <div><label className="block text-sm mb-1">ק"מ עדכני</label>
          <input type="number" className="input" value={form.currentKm} onChange={e => set('currentKm', +e.target.value)} required /></div>

        <div><label className="block text-sm mb-1">מרווח טיפול — זמן</label>
          <select className="input" value={form.serviceIntervalMonths} onChange={e => set('serviceIntervalMonths', +e.target.value)}>
            <option value={6}>6 חודשים</option>
            <option value={12}>שנה</option>
          </select></div>

        <div><label className="block text-sm mb-1">מרווח טיפול — מרחק</label>
          <select className="input" value={form.serviceIntervalKm} onChange={e => set('serviceIntervalKm', +e.target.value)}>
            <option value={6000}>6,000 ק"מ</option>
            <option value={10000}>10,000 ק"מ</option>
          </select></div>

        <div><label className="block text-sm mb-1">תאריך טסט הבא</label>
          <input type="date" className="input" value={form.nextTestDate} onChange={e => set('nextTestDate', e.target.value)} required /></div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium">שמור רכב</button>
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 py-2 rounded-lg">ביטול</button>
        </div>
      </form>
    </div>
  )
}
```

Add to `client/src/main.css` (Tailwind component shortcut used above):
```css
@layer components {
  .input {
    @apply w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/CarForm.tsx client/src/main.css
git commit -m "feat: CarForm component with all fields"
```

---

## Task 11: Dashboard Page

**Files:**
- Create: `client/src/pages/Dashboard.tsx`

- [ ] **Step 1: Write `client/src/pages/Dashboard.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getDashboard, setEmail } from '../api'
import CarCard from '../components/CarCard'
import CarForm from '../components/CarForm'

type DashboardData = {
  token: string
  ownerEmail: string | null
  cars: any[]
}

export default function Dashboard() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<DashboardData | null>(null)
  const [email, setEmailInput] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCar, setEditingCar] = useState<any>(null)
  const [error, setError] = useState('')

  const load = async () => {
    if (!token) return
    const d = await getDashboard(token)
    setData(d)
  }

  useEffect(() => { load() }, [token])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    await setEmail(token, email)
    load()
  }

  if (!data) return <div className="flex items-center justify-center h-screen text-gray-500">טוען...</div>

  // First-visit: no email set
  if (!data.ownerEmail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold mb-2">ברוך הבא</h1>
          <p className="text-gray-500 mb-6">מה כתובת האימייל שלך?</p>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              className="input"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmailInput(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium">
              אישור
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">הרכבים שלי</h1>
        <button
          onClick={() => { setEditingCar(null); setShowForm(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + הוסף רכב
        </button>
      </div>

      {data.cars.length === 0 && (
        <div className="text-center text-gray-400 mt-16">
          <p className="text-lg">אין רכבים עדיין</p>
          <p className="text-sm mt-1">לחץ על "הוסף רכב" כדי להתחיל</p>
        </div>
      )}

      {data.cars.map(car => (
        <CarCard
          key={car.id}
          car={car}
          token={token!}
          onRefresh={load}
          onEdit={car => { setEditingCar(car); setShowForm(true) }}
        />
      ))}

      {showForm && (
        <CarForm
          token={token!}
          initial={editingCar}
          onSave={() => { setShowForm(false); load() }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Dashboard.tsx
git commit -m "feat: Dashboard page with email capture and car list"
```

---

## Task 12: Admin Page

**Files:**
- Create: `client/src/pages/Admin.tsx`

- [ ] **Step 1: Write `client/src/pages/Admin.tsx`**

```typescript
import { useState } from 'react'
import { createDashboard } from '../api'

export default function Admin() {
  const [secret, setSecret] = useState('')
  const [result, setResult] = useState<{ url: string } | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    try {
      const data = await createDashboard(secret)
      setResult(data)
    } catch {
      setError('סיסמה שגויה או שגיאת שרת')
    }
  }

  const copyUrl = () => {
    if (!result) return
    navigator.clipboard.writeText(result.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6">ניהול — יצירת קישור</h1>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">סיסמת מנהל</label>
            <input
              type="password"
              className="input"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium">
            צור קישור חדש
          </button>
        </form>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        {result && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-2">קישור נוצר בהצלחה:</p>
            <div className="bg-gray-100 rounded-lg p-3 text-sm break-all mb-3">{result.url}</div>
            <button
              onClick={copyUrl}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-medium"
            >
              {copied ? 'הועתק!' : 'העתק קישור'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Admin.tsx
git commit -m "feat: Admin page for generating dashboard URLs"
```

---

## Task 13: Environment & Final Wiring

**Files:**
- Create: `.env` (from `.env.example`)

- [ ] **Step 1: Copy and fill `.env`**

```bash
cp .env.example .env
```

Fill in:
```
DATABASE_URL=postgresql://localhost:5432/carmaintenance
RESEND_API_KEY=re_your_actual_key
ADMIN_SECRET=pick-a-strong-secret
PORT=3000
APP_URL=http://localhost:3000
```

- [ ] **Step 2: Create the database**

```bash
createdb carmaintenance
npx prisma migrate dev
```

Expected: `✓ Generated Prisma Client`

- [ ] **Step 3: Start dev servers**

Terminal 1:
```bash
npm run dev:server
```

Terminal 2:
```bash
npm run dev:client
```

- [ ] **Step 4: Smoke test the admin flow**

```bash
curl -X POST http://localhost:3000/api/admin/dashboards \
  -H "x-admin-secret: pick-a-strong-secret"
```

Expected: `{"token":"...","url":"http://localhost:3000/d/..."}`

- [ ] **Step 5: Open the dashboard URL in a mobile browser**

Open the returned URL. Verify:
- Email prompt appears
- After entering email, car list appears (empty)
- "+ הוסף רכב" button opens form
- All form fields are present with Hebrew labels
- After saving, car card appears with status pill
- "בצעתי טיפול" resets service countdown
- "בצעתי טסט" resets test countdown

- [ ] **Step 6: Run full test suite**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 7: Final commit**

```bash
git add .env.example
git commit -m "chore: final wiring and smoke test verified"
```
