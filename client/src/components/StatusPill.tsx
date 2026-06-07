type Props = { status: 'ok' | 'approaching' | 'due' }

const config = {
  ok:          { label: 'בסדר',       className: 'bg-green-100 text-green-800' },
  approaching: { label: 'מתקרב',      className: 'bg-yellow-100 text-yellow-800' },
  due:         { label: 'דרוש טיפול', className: 'bg-red-100 text-red-800' },
}

export default function StatusPill({ status }: Props) {
  const { label, className } = config[status]
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${className}`}>
      {label}
    </span>
  )
}
