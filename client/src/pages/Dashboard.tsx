import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getDashboard } from '../api'
import CarCard from '../components/CarCard'
import CarForm from '../components/CarForm'

type CarTask = {
  id: string
  text: string
  isDone: boolean
  createdAt: string
}

type Car = {
  id: string
  label: string
  licensePlate: string | null
  status: 'ok' | 'approaching' | 'due'
  daysUntilTest: number | null
  kmRemainingService: number | null
  daysUntilServiceDate: number | null
  lastServiceDate: string | null
  lastServiceKm: number | null
  currentKm: number | null
  serviceIntervalMonths: number
  serviceIntervalKm: number
  nextTestDate: string | null
  trackBattery: boolean
  lastBatteryDate: string | null
  lastBatteryKm: number | null
  daysUntilBattery: number | null
  kmRemainingBattery: number | null
  notes: string | null
  photoUrl?: string | null
  serviceLogs?: { id: string; type: 'SERVICE_DONE' | 'TEST_DONE' | 'BATTERY_DONE'; km: number | null; createdAt: string }[]
  carTasks?: CarTask[]
}

type DashboardData = {
  token: string
  ownerEmail: string | null
  cars: Car[]
}

export default function Dashboard() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<DashboardData | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)

  const load = async () => {
    if (!token) return
    const d = await getDashboard(token)
    setData(d)
  }

  useEffect(() => { load() }, [token])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">טוען...</p>
        </div>
      </div>
    )
  }

  const carForForm = editingCar ? {
    ...editingCar,
    lastServiceDate: editingCar.lastServiceDate?.slice(0, 10) ?? '',
    nextTestDate: editingCar.nextTestDate?.slice(0, 10) ?? '',
    lastBatteryDate: editingCar.lastBatteryDate?.slice(0, 10) ?? '',
  } : undefined

  const dueCount = data.cars.filter(c => c.status === 'due').length
  const approachingCount = data.cars.filter(c => c.status === 'approaching').length

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }} dir="rtl">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 pt-10 pb-6">
        <div className="max-w-lg mx-auto">
          <p className="text-gray-400 text-xs font-medium mb-1 tracking-widest uppercase">מעקב תחזוקה</p>
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setEditingCar(null); setShowForm(true) }}
              className="flex items-center gap-2 bg-white text-gray-900 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg leading-none">+</span>
              הוסף רכב
            </button>
            <h1 className="text-2xl font-bold">הרכבים שלי</h1>
          </div>

          {/* Summary chips */}
          {data.cars.length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap justify-end">
              <span className="text-xs px-3 py-1 rounded-full bg-gray-800 text-gray-300">
                {data.cars.length} רכבים
              </span>
              {dueCount > 0 && (
                <span className="text-xs px-3 py-1 rounded-full bg-red-900/60 text-red-300">
                  {dueCount} דורשים טיפול
                </span>
              )}
              {approachingCount > 0 && (
                <span className="text-xs px-3 py-1 rounded-full bg-amber-900/60 text-amber-300">
                  {approachingCount} מתקרבים
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Car list */}
      <div className="max-w-lg mx-auto px-4 py-5">
        {data.cars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🚗</div>
            <p className="text-gray-700 font-semibold text-lg">אין רכבים עדיין</p>
            <p className="text-gray-400 text-sm mt-1">לחץ על "הוסף רכב" כדי להתחיל</p>
          </div>
        ) : (
          data.cars.map(car => (
            <CarCard
              key={car.id}
              car={car}
              token={token!}
              onRefresh={load}
              onEdit={c => { setEditingCar(c); setShowForm(true) }}
            />
          ))
        )}
      </div>

      {showForm && (
        <CarForm
          token={token!}
          initial={carForForm}
          onSave={() => { setShowForm(false); setEditingCar(null); load() }}
          onCancel={() => { setShowForm(false); setEditingCar(null) }}
        />
      )}
    </div>
  )
}
