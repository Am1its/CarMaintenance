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
  it('returns ok when all thresholds are far away', () => {
    expect(carStatus({ daysUntilServiceDate: 60, kmRemainingService: 5000, daysUntilTest: 60 })).toBe('ok')
  })

  it('returns approaching when any threshold is within warning window', () => {
    expect(carStatus({ daysUntilServiceDate: 60, kmRemainingService: 5000, daysUntilTest: 14 })).toBe('approaching')
  })

  it('returns due when any countdown is at or past zero', () => {
    expect(carStatus({ daysUntilServiceDate: -1, kmRemainingService: 5000, daysUntilTest: 60 })).toBe('due')
  })
})
