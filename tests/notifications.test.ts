import { describe, it, expect } from 'vitest'
import { getAlertsForCar } from '../src/services/notifications'

enum AlertType {
  TEST_30D = 'TEST_30D',
  TEST_14D = 'TEST_14D',
  TEST_OVERDUE = 'TEST_OVERDUE',
  SERVICE_DATE_30D = 'SERVICE_DATE_30D',
  SERVICE_DATE_14D = 'SERVICE_DATE_14D',
  SERVICE_DATE_OVERDUE = 'SERVICE_DATE_OVERDUE',
  SERVICE_KM_1000 = 'SERVICE_KM_1000',
  SERVICE_KM_300 = 'SERVICE_KM_300',
}

const baseCar = {
  id: 'car-1',
  label: 'טסטה לבנה',
  licensePlate: '123-456',
  lastServiceDate: new Date('2026-04-01'), // next service: 2026-10-01 — well in future
  lastServiceKm: 50000,
  currentKm: 55000,
  serviceIntervalMonths: 6,
  serviceIntervalKm: 10000,
  nextTestDate: new Date('2026-07-08'),
  notificationLogs: [] as { alertType: string; sentAt: Date }[],
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
