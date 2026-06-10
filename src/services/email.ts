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

function alertColor(type: string): string {
  const red = ['TEST_OVERDUE', 'SERVICE_DATE_OVERDUE', 'SERVICE_KM_300']
  return red.includes(type) ? '#dc2626' : '#d97706'
}

export async function sendMaintenanceAlert(
  toEmail: string,
  dashboardUrl: string,
  carAlerts: CarAlert[]
): Promise<void> {
  const carSections = carAlerts
    .map(
      ({ label, licensePlate, alerts }) => `
      <div style="margin-bottom:16px;padding:16px;border:1px solid #e5e7eb;border-radius:8px;direction:rtl;text-align:right;">
        <div style="font-weight:600;margin-bottom:10px;">${label}${licensePlate ? ` (${licensePlate})` : ''}</div>
        ${alerts.map(a => `
          <div style="padding:3px 0;font-size:14px;">
            <span style="color:${alertColor(a)};margin-left:6px;">●</span>${alertToHebrew(a)}
          </div>`).join('')}
      </div>`
    )
    .join('')

  await getTransporter().sendMail({
    from: `תזכורת רכב <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'תזכורת תחזוקת רכב',
    html: `
      <div style="font-family:Arial,sans-serif;direction:rtl;text-align:right;max-width:600px;margin:0 auto;color:#111827;">
        <h2 style="margin-bottom:4px;">תזכורת תחזוקת רכב</h2>
        <p style="margin-top:0;margin-bottom:20px;color:#6b7280;">להלן עדכון על הרכבים הדורשים תשומת לבך:</p>
        ${carSections}
        <a href="${dashboardUrl}" style="display:inline-block;margin-top:8px;padding:10px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;">עדכן פרטים</a>
      </div>
    `,
  })
}
