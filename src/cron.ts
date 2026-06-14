import cron from 'node-cron'
import { prisma } from './db'
import { getAlertsForCar } from './services/notifications'
import { sendMaintenanceAlert } from './services/email'

async function runDailyCheck(): Promise<void> {
  const dashboards = await prisma.dashboard.findMany({
    where: { ownerEmail: { not: null } },
    include: {
      cars: { include: { notificationLogs: true } },
    },
  })

  for (const dashboard of dashboards) {
    if (!dashboard.ownerEmail) continue

    const carAlerts: { label: string; licensePlate: string | null; alerts: string[]; carId: string }[] = []

    for (const car of dashboard.cars) {
      const alerts = getAlertsForCar(car)
      if (alerts.length === 0) continue
      carAlerts.push({ label: car.label, licensePlate: car.licensePlate ?? null, alerts, carId: car.id })
    }

    if (carAlerts.length > 0) {
      const dashboardUrl = `${process.env.APP_URL}/d/${dashboard.token}`
      await sendMaintenanceAlert(dashboard.ownerEmail, dashboardUrl, carAlerts)
      for (const { carId, alerts } of carAlerts) {
        await prisma.notificationLog.createMany({
          data: alerts.map(alertType => ({ carId, alertType: alertType as any })),
        })
      }
    }
  }
}

cron.schedule('0 8 * * *', () => {
  runDailyCheck().catch(console.error)
})

export { runDailyCheck }
