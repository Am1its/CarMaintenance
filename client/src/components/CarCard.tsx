import StatusPill from './StatusPill'
import { markServiceDone, markTestDone } from '../api'

type Car = {
  id: string
  label: string
  licensePlate: string
  status: 'ok' | 'approaching' | 'due'
  daysUntilTest: number
  kmRemainingService: number
  daysUntilServiceDate: number
  serviceIntervalKm: number
}

type Props = {
  car: Car
  token: string
  onRefresh: () => void
  onEdit: (car: Car) => void
}

const borderColor = { ok: 'border-r-green-400', approaching: 'border-r-amber-400', due: 'border-r-red-400' }

function KmBar({ remaining, total }: { remaining: number; total: number }) {
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100))
  const color = remaining <= 300 ? 'bg-red-500' : remaining <= 1000 ? 'bg-amber-400' : 'bg-green-500'
  return (
    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function DaysBadge({ days, label }: { days: number; label: string }) {
  const overdue = days < 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`text-xs font-semibold ${overdue ? 'text-red-600' : days <= 14 ? 'text-amber-600' : 'text-gray-700'}`}>
          {overdue ? `עבר לפני ${Math.abs(days)} ימים` : `${days} ימים`}
        </span>
      </div>
    </div>
  )
}

export default function CarCard({ car, token, onRefresh, onEdit }: Props) {
  const handleServiceDone = async () => {
    await markServiceDone(token, car.id)
    onRefresh()
  }

  const handleTestDone = async () => {
    await markTestDone(token, car.id)
    onRefresh()
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-r-4 ${borderColor[car.status]} mb-3 overflow-hidden`} dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <StatusPill status={car.status} />
        <div className="text-right">
          <p className="font-bold text-gray-900 text-lg leading-tight">{car.label}</p>
          <p className="text-gray-400 text-sm font-mono">{car.licensePlate}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-50 mx-4" />

      {/* Stats */}
      <div className="px-4 pt-3 pb-1 space-y-3">
        {/* Test */}
        <DaysBadge days={car.daysUntilTest} label="טסט שנתי" />

        {/* Service by date */}
        <DaysBadge days={car.daysUntilServiceDate} label="טיפול (תאריך)" />

        {/* Service by KM */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">טיפול (ק"מ)</span>
            <span className={`text-xs font-semibold ${car.kmRemainingService < 0 ? 'text-red-600' : car.kmRemainingService <= 300 ? 'text-red-600' : car.kmRemainingService <= 1000 ? 'text-amber-600' : 'text-gray-700'}`}>
              {car.kmRemainingService < 0
                ? `עבר ב-${Math.abs(car.kmRemainingService).toLocaleString()} ק"מ`
                : `נותרו ${car.kmRemainingService.toLocaleString()} ק"מ`}
            </span>
          </div>
          <KmBar remaining={car.kmRemainingService} total={car.serviceIntervalKm} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3">
        <button
          onClick={handleServiceDone}
          className="flex-1 bg-blue-600 text-white text-xs font-semibold py-2 rounded-xl hover:bg-blue-700 transition-colors"
        >
          ✓ טיפול בוצע
        </button>
        <button
          onClick={handleTestDone}
          className="flex-1 bg-gray-800 text-white text-xs font-semibold py-2 rounded-xl hover:bg-gray-700 transition-colors"
        >
          ✓ טסט בוצע
        </button>
        <button
          onClick={() => onEdit(car)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors text-xs"
        >
          עריכה
        </button>
      </div>
    </div>
  )
}
