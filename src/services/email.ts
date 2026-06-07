import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type CarAlert = {
  label: string
  licensePlate: string
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

export async function sendMaintenanceAlert(
  toEmail: string,
  dashboardUrl: string,
  carAlerts: CarAlert[]
): Promise<void> {
  const carSections = carAlerts
    .map(
      ({ label, licensePlate, alerts }) => `
      <div style="margin-bottom:20px;padding:16px;border:1px solid #e5e7eb;border-radius:8px;direction:rtl;text-align:right;">
        <strong>${label} (${licensePlate})</strong>
        <ul style="margin-top:8px;">
          ${alerts.map(a => `<li>${alertToHebrew(a)}</li>`).join('')}
        </ul>
      </div>`
    )
    .join('')

  await resend.emails.send({
    from: 'תזכורת רכב <no-reply@yourdomain.com>',
    to: toEmail,
    subject: 'תזכורת תחזוקת רכב',
    html: `
      <div style="font-family:Arial,sans-serif;direction:rtl;text-align:right;max-width:600px;margin:0 auto;">
        <h2>תזכורת תחזוקת רכב</h2>
        <p>להלן עדכון על הרכבים הדורשים תשומת לבך:</p>
        ${carSections}
        <a href="${dashboardUrl}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">עדכן פרטים</a>
      </div>
    `,
  })
}
