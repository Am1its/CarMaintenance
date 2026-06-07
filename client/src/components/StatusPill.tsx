type Props = { status: 'ok' | 'approaching' | 'due' }

const config = {
  ok:          { label: 'בסדר',       dot: 'bg-green-500',  className: 'bg-green-50 text-green-700 border border-green-200' },
  approaching: { label: 'מתקרב',      dot: 'bg-amber-500',  className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  due:         { label: 'דרוש טיפול', dot: 'bg-red-500',    className: 'bg-red-50 text-red-700 border border-red-200' },
}

export default function StatusPill({ status }: Props) {
  const { label, dot, className } = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
