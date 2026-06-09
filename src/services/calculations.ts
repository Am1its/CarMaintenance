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
  daysUntilServiceDate: number | null
  kmRemainingService: number | null
  daysUntilTest: number | null
  daysUntilBattery?: number | null
  kmRemainingBattery?: number | null
}

export type CarStatusResult = 'ok' | 'approaching' | 'due'

export function carStatus(input: StatusInput): CarStatusResult {
  const dayValues = [
    input.daysUntilServiceDate,
    input.daysUntilTest,
    input.daysUntilBattery ?? null,
  ].filter((v): v is number => v !== null && v !== undefined)

  const kmValues = [
    input.kmRemainingService,
    input.kmRemainingBattery ?? null,
  ].filter((v): v is number => v !== null && v !== undefined)

  if (dayValues.some(d => d <= 0) || kmValues.some(k => k <= 0)) return 'due'
  if (dayValues.some(d => d <= 30) || kmValues.some(k => k <= 1000)) return 'approaching'
  return 'ok'
}
