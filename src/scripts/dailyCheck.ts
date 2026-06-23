import dotenv from 'dotenv'
import { runDailyCheck } from '../cron'
import { prisma } from '../db'

// Standalone entry point for the daily maintenance check.
// Run by the GitHub Actions workflow (.github/workflows/daily-email.yml) so the
// email trigger does not depend on the Render free-tier instance being awake.
//
// Importing ../cron registers a node-cron schedule that keeps the event loop
// alive, so we exit the process explicitly once the check is done.

dotenv.config()

async function main(): Promise<void> {
  console.log(`[daily-check] starting at ${new Date().toISOString()}`)
  await runDailyCheck()
  console.log('[daily-check] completed successfully')
}

main()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (err) => {
    console.error('[daily-check] failed:', err)
    await prisma.$disconnect()
    process.exit(1)
  })
