import { useState } from 'react'
import StatusPill from './StatusPill'
import { markServiceDone, markTestDone, deleteCar } from '../api'

type ServiceLog = {
  id: string
  type: 'SERVICE_DONE' | 'TEST_DONE'
  km: number | null
  createdAt: string
}

type Car = {
  id: string
  label: string
  licensePlate: string
  status: 'ok' | 'approaching' | 'due'
  daysUntilTest: number
  kmRemainingService: number
  daysUntilServiceDate: number
  serviceIntervalKm: number
  photoUrl?: string | null
  serviceLogs?: ServiceLog[]
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

export default function CarCard({ car, token, onRefresh, onEdit }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const handleServiceDone = async () => {
    await markServiceDone(token, car.id)
    onRefresh()
  }

  const handleTestDone = async () => {
    await markTestDone(token, car.id)
    onRefresh()
  }

  const handleDelete = async () => {
    await deleteCar(token, car.id)
    onRefresh()
  }

  const logs = car.serviceLogs ?? []

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-r-4 ${borderColor[car.status]} mb-3 overflow-hidden`} dir="rtl">
      {/* Photo banner */}
      {car.photoUrl && (
        <img src={car.photoUrl} alt={car.label} className="w-full h-36 object-cover" />
      )}

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
        <DaysBadge days={car.daysUntilTest} label="טסט שנתי" />
        <DaysBadge days={car.daysUntilServiceDate} label="טיפול (תאריך)" />
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

      {/* History toggle */}
      {logs.length > 0 && (
        <>
          <div className="h-px bg-gray-50 mx-4 mt-3" />
          <button
            onClick={() => setShowHistory(h => !h)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-400 active:bg-gray-50"
          >
            <span>{showHistory ? '▲' : '▼'}</span>
            <span>היסטוריה ({logs.length})</span>
          </button>

          {showHistory && (
            <div className="px-4 pb-3 space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                  <span className="text-gray-400">{formatDate(log.createdAt)}</span>
                  <span className="text-gray-700">
                    {log.type === 'SERVICE_DONE'
                      ? `🔧 טיפול בוצע${log.km ? ` — ${log.km.toLocaleString()} ק״מ` : ''}`
                      : '✓ טסט עבר'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Actions */}
      {confirmDelete ? (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-50">
          <span className="text-sm text-gray-600 flex-1 text-right">בטוח למחוק?</span>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold"
          >
            מחק
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs"
          >
            ביטול
          </button>
        </div>
      ) : (
        <div className="flex gap-2 px-4 py-3 border-t border-gray-50">
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
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors text-xs"
          >
            מחק
          </button>
        </div>
      )}
    </div>
  )
}
