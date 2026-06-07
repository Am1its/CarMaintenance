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
}

type Props = {
  car: Car
  token: string
  onRefresh: () => void
  onEdit: (car: Car) => void
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
    <div className="bg-white rounded-xl shadow p-4 mb-4" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-bold text-lg">{car.label}</p>
          <p className="text-gray-500 text-sm">{car.licensePlate}</p>
        </div>
        <StatusPill status={car.status} />
      </div>

      <div className="text-sm text-gray-700 space-y-1 mb-4">
        <p>טסט: בעוד <strong>{car.daysUntilTest}</strong> ימים</p>
        <p>טיפול (תאריך): בעוד <strong>{car.daysUntilServiceDate}</strong> ימים</p>
        <p>טיפול (ק"מ): נותרו <strong>{car.kmRemainingService.toLocaleString()}</strong> ק"מ</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onEdit(car)}
          className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
        >
          עריכה
        </button>
        <button
          onClick={handleServiceDone}
          className="text-sm px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-800"
        >
          בצעתי טיפול
        </button>
        <button
          onClick={handleTestDone}
          className="text-sm px-3 py-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-800"
        >
          בצעתי טסט
        </button>
      </div>
    </div>
  )
}
