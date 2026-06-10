import express from 'express'
import path from 'path'
import dotenv from 'dotenv'
import adminRoutes from './routes/admin'
import dashboardRoutes from './routes/dashboard'
import carRoutes from './routes/cars'
import './cron'

dotenv.config()

const app = express()
app.use(express.json({ limit: '10mb' }))

app.get('/api/health', (_req, res) => res.send('ok'))

app.use('/api/admin', adminRoutes)
app.use('/api/d', dashboardRoutes)
app.use('/api/d/:token/cars', carRoutes)

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client')))
  app.use((_req, res) => res.sendFile(path.join(__dirname, 'client', 'index.html')))
}

const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

export default app
