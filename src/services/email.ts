import nodemailer from 'nodemailer'

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

type CarAlert = {
  label: string
  licensePlate: string | null
  alerts: string[]
}

function alertToHebrew(type: string): string {
  const map: Record<string, string> = {
    TEST_30D: 'הטסט מתקרב — נותרו פחות מ-30 יום',
    TEST_14D: 'הטסט מתקרב — נותרו פחות מ-14 יום',
    TEST_OVERDUE: 'הטסט עבר את תאריכו — יש לבצע טסט בדחיפות',
    SERVICE_DATE_30D: 'הטיפול מתקרב — נותרו פחות מ-30 יום',
    SERVICE_DATE_14D: 'הטיפול מתקרב — נותרו פחות מ-14 יום',
    SERVICE_DATE_OVERDUE: 'הטיפול עבר את תאריכו — יש לבצע טיפול בדחיפות',
    SERVICE_KM_1000: 'הטיפול מתקרב — נותרו פחות מ-1,000 ק"מ',
    SERVICE_KM_300: 'הטיפול קרוב מאוד — נותרו פחות מ-300 ק"מ',
  }
  return map[type] ?? type
}

// Severity drives the "dashboard warning light" treatment: urgent = red telltale,
// approaching = amber telltale. Each maps to a strip color and a faint tint.
function isUrgent(type: string): boolean {
  return ['TEST_OVERDUE', 'SERVICE_DATE_OVERDUE', 'SERVICE_KM_300'].includes(type)
}

function alertRow(type: string): string {
  const color = isUrgent(type) ? '#DC2626' : '#D97706'
  const tint = isUrgent(type) ? '#FEF2F2' : '#FFFBEB'
  return `
    <div style="background:${tint};border-right:4px solid ${color};border-radius:6px;padding:10px 13px;margin-top:8px;font-size:14px;line-height:1.45;color:#1E293B;text-align:right;">
      ${alertToHebrew(type)}
    </div>`
}

function plateBadge(licensePlate: string): string {
  // Israeli yellow plate, rendered as a small badge.
  return `<span style="display:inline-block;background:#F5D300;border:1px solid #C9A800;border-radius:4px;padding:3px 9px;font-size:13px;font-weight:700;letter-spacing:1px;color:#1A1A1A;">${licensePlate}</span>`
}

function carCard({ label, licensePlate, alerts }: CarAlert): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:12px;margin-bottom:14px;background:#FFFFFF;">
      <tr>
        <td style="padding:15px 18px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="direction:rtl;">
            <tr>
              <td align="right" style="font-size:16px;font-weight:700;color:#0F172A;">${label}</td>
              <td align="left">${licensePlate ? plateBadge(licensePlate) : ''}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 18px 16px;">${alerts.map(alertRow).join('')}</td>
      </tr>
    </table>`
}

export async function sendMaintenanceAlert(
  toEmail: string,
  dashboardUrl: string,
  carAlerts: CarAlert[]
): Promise<void> {
  const carCount = carAlerts.length
  const headline =
    carCount === 1 ? 'רכב אחד דורש את תשומת לבך' : `${carCount} רכבים דורשים את תשומת לבך`

  const html = `
  <!DOCTYPE html>
  <html lang="he" dir="rtl">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#F1F5F9;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${headline} — תזכורת תחזוקת רכב</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;direction:rtl;">
              <!-- header -->
              <tr>
                <td style="background:#0F172A;padding:26px 28px;text-align:right;">
                  <div style="color:#FFFFFF;font-size:21px;font-weight:700;">תזכורת תחזוקת רכב</div>
                  <div style="color:#94A3B8;font-size:13px;margin-top:6px;">${headline}</div>
                </td>
              </tr>
              <!-- signal bar: red / amber, echoes the alert language -->
              <tr>
                <td style="padding:0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td style="height:4px;background:#DC2626;"></td>
                    <td style="height:4px;background:#D97706;"></td>
                  </tr></table>
                </td>
              </tr>
              <!-- cars -->
              <tr>
                <td style="padding:22px 22px 6px;">${carAlerts.map(carCard).join('')}</td>
              </tr>
              <!-- cta -->
              <tr>
                <td style="padding:6px 22px 28px;text-align:center;">
                  <a href="${dashboardUrl}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;padding:13px 34px;border-radius:9px;">מעבר ללוח שלי</a>
                </td>
              </tr>
              <!-- footer -->
              <tr>
                <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:18px 24px;text-align:center;">
                  <div style="font-size:12px;color:#94A3B8;line-height:1.7;">קיבלת הודעה זו מכיוון שאתה עוקב אחר רכבים בתזכורת רכב.<br>זוהי הודעה אוטומטית — אין צורך להשיב.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`

  await getTransporter().sendMail({
    from: `תזכורת רכב <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `תזכורת תחזוקת רכב — ${headline}`,
    html,
  })
}
