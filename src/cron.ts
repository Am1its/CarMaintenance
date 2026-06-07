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

    const carAlerts: { label: string; licensePlate: string; alerts: string[] }[] = []

    for (const car of dashboard.cars) {
      const alerts = getAlertsForCar(car)
      if (alerts.length === 0) continue

      await prisma.notificationLog.createMany({
        data: alerts.map(alertType => ({ carId: car.id, alertType: alertType as any })),
      })

      carAlerts.push({ label: car.label, licensePlate: car.licensePlate, alerts })
    }

    if (carAlerts.length > 0) {
      const dashboardUrl = `${process.env.APP_URL}/d/${dashboard.token}`
      await sendMaintenanceAlert(dashboard.ownerEmail, dashboardUrl, carAlerts)
    }
  }
}

cron.schedule('0 8 * * *', () => {
  runDailyCheck().catch(console.error)
})

export { runDailyCheck }
