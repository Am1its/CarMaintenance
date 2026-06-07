import { Router } from 'express'
import { prisma } from '../db'
import crypto from 'crypto'

const router = Router()

router.use((req, res, next) => {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized' })
    return
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
