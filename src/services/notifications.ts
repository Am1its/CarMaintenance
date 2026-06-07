import { nextServiceDate, kmRemaining, daysUntil } from './calculations'

type AlertType = string

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

export function getAlertsForCar(car: CarWithLogs, today: Date = new Date()): string[] {
  const alerts: string[] = []
  const logs = car.notificationLogs

  // Test alerts
  const daysToTest = daysUntil(car.nextTestDate, today)
  if (daysToTest < 0) {
    if (!alreadySent(logs, 'TEST_OVERDUE', 7)) alerts.push('TEST_OVERDUE')
  } else if (daysToTest <= 14) {
    if (!alreadySent(logs, 'TEST_14D')) alerts.push('TEST_14D')
  } else if (daysToTest <= 30) {
    if (!alreadySent(logs, 'TEST_30D')) alerts.push('TEST_30D')
  }

  // Service date alerts
  const svcDate = nextServiceDate(car.lastServiceDate, car.serviceIntervalMonths)
  const daysToService = daysUntil(svcDate, today)
  if (daysToService < 0) {
    if (!alreadySent(logs, 'SERVICE_DATE_OVERDUE', 7)) alerts.push('SERVICE_DATE_OVERDUE')
  } else if (daysToService <= 14) {
    if (!alreadySent(logs, 'SERVICE_DATE_14D')) alerts.push('SERVICE_DATE_14D')
  } else if (daysToService <= 30) {
    if (!alreadySent(logs, 'SERVICE_DATE_30D')) alerts.push('SERVICE_DATE_30D')
  }

  // Service KM alerts
  const kmLeft = kmRemaining(car.lastServiceKm, car.serviceIntervalKm, car.currentKm)
  if (kmLeft <= 300) {
    if (!alreadySent(logs, 'SERVICE_KM_300')) alerts.push('SERVICE_KM_300')
  } else if (kmLeft <= 1000) {
    if (!alreadySent(logs, 'SERVICE_KM_1000')) alerts.push('SERVICE_KM_1000')
  }

  return alerts
}
