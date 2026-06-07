export function nextServiceDate(lastServiceDate: Date, intervalMonths: number): Date {
  const result = new Date(lastServiceDate)
  result.setUTCMonth(result.getUTCMonth() + intervalMonths)
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
