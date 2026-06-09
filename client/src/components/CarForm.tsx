import { useState } from 'react'
import { addCar, updateCar } from '../api'

type CarInput = {
  id?: string
  label: string
  licensePlate: string
  lastServiceDate: string
  lastServiceKm: number | null
  currentKm: number | null
  serviceIntervalMonths: number
  serviceIntervalKm: number
  nextTestDate: string
  lastBatteryDate: string
  lastBatteryKm: number | null
  photoUrl?: string | null
}

type Props = {
  token: string
  initial?: Partial<CarInput>
  onSave: () => void
  onCancel: () => void
}

const empty: CarInput = {
  label: '', licensePlate: '', lastServiceDate: '', lastServiceKm: null,
  currentKm: null, serviceIntervalMonths: 6, serviceIntervalKm: 10000, nextTestDate: '',
  lastBatteryDate: '', lastBatteryKm: null, photoUrl: null,
}

async function compressImage(file: File): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 600
      let { width, height } = img
      if (width > height && width > MAX) { height = Math.round(height * MAX / width); width = MAX }
      else if (height > MAX) { width = Math.round(width * MAX / height); height = MAX }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.src = url
  })
}

export default function CarForm({ token, initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<CarInput>({ ...empty, ...initial })

  const set = (key: keyof CarInput, value: string | number | null) =>
    setForm(f => ({ ...f, [key]: value }))

  const numInput = (key: keyof CarInput) => ({
    type: 'number' as const,
    className: 'input',
    value: (form[key] as number | null) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      set(key, e.target.value === '' ? null : +e.target.value),
  })

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    set('photoUrl', compressed)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      label: form.label,
      licensePlate: form.licensePlate || null,
      lastServiceDate: form.lastServiceDate || null,
      lastServiceKm: form.lastServiceKm,
      currentKm: form.currentKm,
      serviceIntervalMonths: form.serviceIntervalMonths,
      serviceIntervalKm: form.serviceIntervalKm,
      nextTestDate: form.nextTestDate || null,
      lastBatteryDate: form.lastBatteryDate || null,
      lastBatteryKm: form.lastBatteryKm,
      photoUrl: form.photoUrl ?? null,
    }
    if (form.id) {
      await updateCar(token, form.id, payload)
    } else {
      await addCar(token, payload)
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

        {/* Photo */}
        <div>
          <label className="block text-sm mb-1">תמונת רכב</label>
          <label className="block cursor-pointer">
            {form.photoUrl ? (
              <div className="relative">
                <img src={form.photoUrl} alt="" className="w-full h-40 object-cover rounded-xl" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl opacity-0 hover:opacity-100 active:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">החלף תמונה</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-28 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-gray-400 gap-2 active:bg-gray-50">
                <span className="text-2xl">📷</span>
                <span className="text-xs">הוסף תמונה</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
          {form.photoUrl && (
            <button type="button" onClick={() => set('photoUrl', null)} className="mt-1 text-xs text-red-500">
              הסר תמונה
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">סוג / תיאור רכב <span className="text-red-500">*</span></label>
          <input className="input" value={form.label} onChange={e => set('label', e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm mb-1">לוחית רישוי</label>
          <input className="input" value={form.licensePlate} onChange={e => set('licensePlate', e.target.value)} />
        </div>

        <div className="h-px bg-gray-100" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">טיפול</p>

        <div>
          <label className="block text-sm mb-1">תאריך טיפול אחרון</label>
          <input type="date" className="input" value={form.lastServiceDate} onChange={e => set('lastServiceDate', e.target.value)} />
        </div>

        <div>
          <label className="block text-sm mb-1">ק"מ בטיפול האחרון</label>
          <input {...numInput('lastServiceKm')} />
        </div>

        <div>
          <label className="block text-sm mb-1">ק"מ עדכני</label>
          <input {...numInput('currentKm')} />
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
            <option value={5000}>5,000 ק"מ</option>
            <option value={6000}>6,000 ק"מ</option>
            <option value={10000}>10,000 ק"מ</option>
          </select>
        </div>

        <div className="h-px bg-gray-100" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">טסט שנתי</p>

        <div>
          <label className="block text-sm mb-1">תאריך טסט הבא</label>
          <input type="date" className="input" value={form.nextTestDate} onChange={e => set('nextTestDate', e.target.value)} />
        </div>

        <div className="h-px bg-gray-100" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">🔋 ביטוח בטרייה</p>

        <div>
          <label className="block text-sm mb-1">תאריך החלפת בטרייה אחרונה</label>
          <input type="date" className="input" value={form.lastBatteryDate} onChange={e => set('lastBatteryDate', e.target.value)} />
        </div>

        <div>
          <label className="block text-sm mb-1">ק"מ בהחלפת בטרייה אחרונה</label>
          <input {...numInput('lastBatteryKm')} />
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
