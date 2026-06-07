import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getDashboard } from '../api'
import CarCard from '../components/CarCard'
import CarForm from '../components/CarForm'

type Car = {
  id: string
  label: string
  licensePlate: string
  status: 'ok' | 'approaching' | 'due'
  daysUntilTest: number
  kmRemainingService: number
  daysUntilServiceDate: number
  lastServiceDate: string
  lastServiceKm: number
  currentKm: number
  serviceIntervalMonths: number
  serviceIntervalKm: number
  nextTestDate: string
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
      <div className="flex items-center justify-center h-screen text-gray-500">
        טוען...
      </div>
    )
  }

  const carForForm = editingCar ? {
    ...editingCar,
    lastServiceDate: editingCar.lastServiceDate.slice(0, 10),
    nextTestDate: editingCar.nextTestDate.slice(0, 10),
  } : undefined

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">הרכבים שלי</h1>
        <button
          onClick={() => { setEditingCar(null); setShowForm(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + הוסף רכב
        </button>
      </div>

      {data.cars.length === 0 && (
        <div className="text-center text-gray-400 mt-16">
          <p className="text-lg">אין רכבים עדיין</p>
          <p className="text-sm mt-1">לחץ על "הוסף רכב" כדי להתחיל</p>
        </div>
      )}

      {data.cars.map(car => (
        <CarCard
          key={car.id}
          car={car}
          token={token!}
          onRefresh={load}
          onEdit={c => { setEditingCar(c); setShowForm(true) }}
        />
      ))}

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
