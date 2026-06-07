import { useState } from 'react'
import { addCar, updateCar } from '../api'

type CarInput = {
  id?: string
  label: string
  licensePlate: string
  lastServiceDate: string
  lastServiceKm: number
  currentKm: number
  serviceIntervalMonths: number
  serviceIntervalKm: number
  nextTestDate: string
}

type Props = {
  token: string
  initial?: CarInput
  onSave: () => void
  onCancel: () => void
}

const empty: CarInput = {
  label: '', licensePlate: '', lastServiceDate: '', lastServiceKm: 0,
  currentKm: 0, serviceIntervalMonths: 6, serviceIntervalKm: 6000, nextTestDate: '',
}

export default function CarForm({ token, initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<CarInput>(initial ?? empty)

  const set = (key: keyof CarInput, value: string | number) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.id) {
      await updateCar(token, form.id, form as unknown as Record<string, unknown>)
    } else {
      await addCar(token, form as unknown as Record<string, unknown>)
    }
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-10" dir="rtl">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-t-2xl w-full max-w-lg p-6 space-y-4 overflow-y-auto max-h-[90vh]"
      >
        <h2 className="text-xl font-bold">{form.id ? 'עריכת רכב' : 'הוספת רכב'}</h2>

        <div>
          <label className="block text-sm mb-1">סוג / תיאור רכב</label>
          <input className="input" value={form.label} onChange={e => set('label', e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm mb-1">לוחית רישוי</label>
          <input className="input" value={form.licensePlate} onChange={e => set('licensePlate', e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm mb-1">תאריך טיפול אחרון</label>
          <input type="date" className="input" value={form.lastServiceDate} onChange={e => set('lastServiceDate', e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm mb-1">ק"מ בטיפול האחרון</label>
          <input type="number" className="input" value={form.lastServiceKm} onChange={e => set('lastServiceKm', +e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm mb-1">ק"מ עדכני</label>
          <input type="number" className="input" value={form.currentKm} onChange={e => set('currentKm', +e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm mb-1">מרווח טיפול — זמן</label>
          <select className="input" value={form.serviceIntervalMonths} onChange={e => set('serviceIntervalMonths', +e.target.value)}>
            <option value={6}>6 חודשים</option>
            <option value={12}>שנה</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">מרווח טיפול — מרחק</label>
          <select className="input" value={form.serviceIntervalKm} onChange={e => set('serviceIntervalKm', +e.target.value)}>
            <option value={6000}>6,000 ק"מ</option>
            <option value={10000}>10,000 ק"מ</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">תאריך טסט הבא</label>
          <input type="date" className="input" value={form.nextTestDate} onChange={e => set('nextTestDate', e.target.value)} required />
        </div>

        <div className="flex gap-3 pt-2 pb-2">
          <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium">
            שמור רכב
          </button>
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 py-2 rounded-lg">
            ביטול
          </button>
        </div>
      </form>
    </div>
  )
}
