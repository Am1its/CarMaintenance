import { Router } from 'express'
import { prisma } from '../db'
import { nextServiceDate, kmRemaining, daysUntil, carStatus } from '../services/calculations'
import crypto from 'crypto'

const router = Router()

router.post('/start', async (req, res) => {
  const { email } = req.body
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Invalid email' })
    return
  }
  let dashboard = await prisma.dashboard.findFirst({ where: { ownerEmail: email } })
  if (!dashboard) {
    const token = crypto.randomBytes(16).toString('hex')
    dashboard = await prisma.dashboard.create({ data: { token, ownerEmail: email } })
  }
  res.json({ token: dashboard.token })
})

router.get('/:token', async (req, res) => {
  const dashboard = await prisma.dashboard.findUnique({
    where: { token: req.params.token },
    include: {
      cars: {
        include: {
          serviceLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      },
    },
  })
  if (!dashboard) {
    res.status(404).json({ error: 'Not found' })
    return
  }

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
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Invalid email' })
    return
  }
  const dashboard = await prisma.dashboard.findUnique({ where: { token: req.params.token } })
  if (!dashboard) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await prisma.dashboard.update({ where: { token: req.params.token }, data: { ownerEmail: email } })
  res.json({ ok: true })
})

export default router
