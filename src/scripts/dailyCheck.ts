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

  // TEMP diagnostic — verify what the runner actually receives. Never prints
  // the password itself, only its length and a whitespace check. Remove once
  // the Gmail auth is confirmed working.
  const user = process.env.GMAIL_USER ?? ''
  const pass = process.env.GMAIL_APP_PASSWORD ?? ''
  console.log(`[daily-check] GMAIL_USER="${user}" (len ${user.length})`)
  console.log(
    `[daily-check] GMAIL_APP_PASSWORD len=${pass.length}, ` +
      `hasWhitespace=${/\s/.test(pass)}, trimmedLen=${pass.trim().length}`,
  )

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
