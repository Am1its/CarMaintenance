# Car Maintenance Tracker — Product Design Spec

**Date:** 2026-06-08  
**Status:** Approved  
**Language:** Hebrew (RTL)  
**Platform:** Mobile-web (URL-based, no login)

---

## 1. Overview

A mobile-web application that allows a single admin to generate unique dashboard URLs and send them to car owners. Each car owner opens their URL, enters their email, and manages all their vehicles in one place. The system tracks service and annual test due dates/mileage and sends automated email alerts when any event is approaching.

---

## 2. Roles & Actors

| Actor | Surface | Purpose |
|---|---|---|
| **Admin** | Private admin page | Generates unique dashboard URLs, assigns them to users |
| **Car Owner** | Mobile dashboard (URL-based) | Enters and manages their car data, updates odometer readings |
| **Notification Engine** | Cron job (daily) | Checks all cars daily, sends email alerts when thresholds are crossed |

---

## 3. Data Model

### Dashboard
One per car owner. Created by the admin.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `token` | String (unique) | URL-safe token, forms the unique URL |
| `owner_email` | String | Set by the car owner on first visit |
| `created_at` | Timestamp | |

### Car
Belongs to a Dashboard. One dashboard can have many cars.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `dashboard_id` | FK → Dashboard | |
| `label` | String | Free text, e.g. "פריוס לבן" |
| `license_plate` | String | |
| `last_service_date` | Date | Date of most recent service |
| `last_service_km` | Integer | Odometer at most recent service |
| `current_km` | Integer | Latest odometer reading entered by user |
| `service_interval_months` | Integer | 6 or 12 |
| `service_interval_km` | Integer | 6000 or 10000 |
| `next_test_date` | Date | Next annual test (טסט) due date |
| `updated_at` | Timestamp | |

### Notification Log
Prevents duplicate alerts.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `car_id` | FK → Car | |
| `alert_type` | Enum | `test_30d`, `test_14d`, `test_overdue`, `service_date_30d`, `service_date_14d`, `service_date_overdue`, `service_km_1000`, `service_km_300` |
| `sent_at` | Timestamp | |

When a user logs **"בצעתי טיפול"**, all service-related notification log entries for that car are deleted so the alert cycle can restart fresh from the new service date/mileage. When a user logs **"בצעתי טסט"**, all test-related entries are deleted similarly.

---

## 4. User Flow

### 4.1 Admin Flow

1. Admin navigates to the private admin page.
2. Enters a name or identifier for the new user.
3. Clicks **"צור קישור"** — the system generates a unique dashboard URL.
4. Admin copies the URL and sends it to the car owner (via WhatsApp, SMS, or email).

### 4.2 Car Owner — First Visit

1. Owner opens the URL on their mobile phone.
2. Sees a welcome screen with a single prompt: **"מה כתובת האימייל שלך?"**
3. Enters their email and confirms.
4. Lands on their dashboard — empty state with a **"+ הוסף רכב"** button.

### 4.3 Car Owner — Adding a Car

The user taps **"+ הוסף רכב"**. A form appears with the following fields:

| Field | Input Type |
|---|---|
| סוג / תיאור רכב | Free text |
| לוחית רישוי | Text input |
| תאריך טיפול אחרון | Date picker |
| ק"מ בטיפול האחרון | Number input |
| ק"מ עדכני | Number input |
| מרווח טיפול — זמן | Toggle: 6 חודשים / שנה |
| מרווח טיפול — מרחק | Toggle: 6,000 ק"מ / 10,000 ק"מ |
| תאריך טסט הבא | Date picker |

User taps **"שמור רכב"** — the car appears as a card on the dashboard.

### 4.4 Car Owner — Dashboard (Ongoing Use)

Each car card displays:
- Car label + license plate
- Status pill: `בסדר` (green) / `מתקרב` (yellow) / `דרוש טיפול` (red)
- Days until next annual test
- KM remaining until next service
- Date of next service

Tapping a car card exposes three actions:
- **עדכן ק"מ** — update current odometer reading (primary recurring action)
- **בצעתי טיפול** — log a completed service (resets `last_service_date` to today, `last_service_km` to current KM)
- **בצעתי טסט** — log a completed annual test (sets `next_test_date` to today + 1 year)
- Edit any field

---

## 5. Calculation Logic

All calculations run at display time (dashboard) and at alert-check time (cron job).

### 5.1 Time-Based Service Countdown

```
Next Service Date = last_service_date + service_interval_months
Days Remaining    = Next Service Date − Today
```

### 5.2 Distance-Based Service Countdown

```
KM Threshold  = last_service_km + service_interval_km
KM Remaining  = KM Threshold − current_km
```

No mileage projection or estimation. The system works only with the odometer values the user enters.

### 5.3 Annual Test Countdown

```
Days Until Test = next_test_date − Today
```

No mileage component.

### 5.4 "Whichever Comes First" Rule

Both the time countdown and distance countdown are evaluated independently. Either can trigger an alert regardless of the other. There is no conversion between them — they fire on their own thresholds.

### 5.5 Dashboard Status Logic

| Status | Condition |
|---|---|
| `בסדר` (green) | All countdowns are beyond their alert thresholds |
| `מתקרב` (yellow) | Any countdown has entered its warning window |
| `דרוש טיפול` (red) | Any countdown is at zero or past due |

---

## 6. Notification Rules

### 6.1 Guiding Principles

- One email per day maximum per user, regardless of how many cars or alerts are pending.
- If multiple cars need attention, bundle all alerts into one email.
- Each threshold fires **once per service cycle** — it does not re-fire until the user logs a service (which resets the countdown).
- **Exception:** Overdue alerts re-fire once per week as a persistent nudge until resolved.

### 6.2 Annual Test Alert Schedule

| Trigger | Type | Tone |
|---|---|---|
| 30 days before `next_test_date` | `test_30d` | Friendly reminder |
| 14 days before `next_test_date` | `test_14d` | Stronger nudge |
| 1 day after `next_test_date` (overdue) | `test_overdue` | Urgent — re-fires weekly |

### 6.3 Service — Date-Based Alert Schedule

| Trigger | Type | Tone |
|---|---|---|
| 30 days before Next Service Date | `service_date_30d` | Friendly reminder |
| 14 days before Next Service Date | `service_date_14d` | Stronger nudge |
| 1 day after Next Service Date (overdue) | `service_date_overdue` | Urgent — re-fires weekly |

### 6.4 Service — Distance-Based Alert Schedule

| Trigger | Type | Tone |
|---|---|---|
| 1,000 KM remaining | `service_km_1000` | Friendly reminder |
| 300 KM remaining | `service_km_300` | Urgent nudge |

*(Thresholds apply to both the 6,000 km and 10,000 km intervals.)*

### 6.5 Duplicate Prevention

Before sending any alert, the cron job checks the `Notification Log` for that car + alert type. If a record exists, the alert is skipped. Overdue alerts (`test_overdue`, `service_date_overdue`) are the exception — they re-fire if the most recent record for that alert type is older than 7 days.

---

## 7. Out of Scope (v1)

- Push notifications / SMS
- Mileage estimation or projection
- Multi-language support
- Authentication / passwords
- Sharing a car between multiple dashboards
- Service history log beyond the most recent service
