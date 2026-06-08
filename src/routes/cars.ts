import { Router, Request, Response } from 'express'
import { prisma } from '../db'

type CarParams = { token: string; carId: string }

const router = Router({ mergeParams: true })

const SERVICE_ALERT_TYPES = [
  'SERVICE_DATE_30D', 'SERVICE_DATE_14D', 'SERVICE_DATE_OVERDUE',
  'SERVICE_KM_1000', 'SERVICE_KM_300',
]
const TEST_ALERT_TYPES = ['TEST_30D', 'TEST_14D', 'TEST_OVERDUE']

async function dashboardOwnsCar(token: string, carId: string): Promise<boolean> {
  const car = await prisma.car.findFirst({ where: { id: carId, dashboard: { token } } })
  return car !== null
}

const ALLOWED_CAR_FIELDS = [
  'label', 'licensePlate', 'lastServiceDate', 'lastServiceKm',
  'currentKm', 'serviceIntervalMonths', 'serviceIntervalKm', 'nextTestDate', 'photoUrl',
]

function parseCarData(body: Record<string, any>) {
  const result: Record<string, any> = {}
  for (const key of ALLOWED_CAR_FIELDS) {
    if (key in body) result[key] = body[key]
  }
  if (result.lastServiceDate) result.lastServiceDate = new Date(result.lastServiceDate)
  if (result.nextTestDate) result.nextTestDate = new Date(result.nextTestDate)
  return result
}

router.post('/', async (req: Request<CarParams>, res: Response) => {
  const dashboard = await prisma.dashboard.findUnique({ where: { token: req.params.token } })
  if (!dashboard) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const car = await prisma.car.create({ data: { ...parseCarData(req.body), dashboardId: dashboard.id } as any })
  res.json(car)
})

router.put('/:carId', async (req: Request<CarParams>, res: Response) => {
  if (!await dashboardOwnsCar(req.params.token, req.params.carId)) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const car = await prisma.car.update({ where: { id: req.params.carId }, data: parseCarData(req.body) as any })
  res.json(car)
})

router.post('/:carId/service-done', async (req: Request<CarParams>, res: Response) => {
  if (!await dashboardOwnsCar(req.params.token, req.params.carId)) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const car = await prisma.car.findUnique({ where: { id: req.params.carId } })
  if (!car) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await prisma.notificationLog.deleteMany({
    where: { carId: car.id, alertType: { in: SERVICE_ALERT_TYPES as any } },
  })
  const updated = await prisma.car.update({
    where: { id: car.id },
    data: { lastServiceDate: new Date(), lastServiceKm: car.currentKm },
  })
  res.json(updated)
})

router.post('/:carId/test-done', async (req: Request<CarParams>, res: Response) => {
  if (!await dashboardOwnsCar(req.params.token, req.params.carId)) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await prisma.notificationLog.deleteMany({
    where: { carId: req.params.carId, alertType: { in: TEST_ALERT_TYPES as any } },
  })
  const nextTest = new Date()
  nextTest.setFullYear(nextTest.getFullYear() + 1)
  const updated = await prisma.car.update({
    where: { id: req.params.carId },
    data: { nextTestDate: nextTest },
  })
  res.json(updated)
})

router.delete('/:carId', async (req: Request<CarParams>, res: Response) => {
  if (!await dashboardOwnsCar(req.params.token, req.params.carId)) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await prisma.car.delete({ where: { id: req.params.carId } })
  res.json({ ok: true })
})

export default router
