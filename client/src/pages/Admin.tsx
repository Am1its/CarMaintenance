import { useState } from 'react'
import { createDashboard } from '../api'

export default function Admin() {
  const [secret, setSecret] = useState('')
  const [result, setResult] = useState<{ url: string } | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    try {
      const data = await createDashboard(secret)
      setResult(data)
    } catch {
      setError('סיסמה שגויה או שגיאת שרת')
    }
  }

  const copyUrl = () => {
    if (!result) return
    navigator.clipboard.writeText(result.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6">ניהול — יצירת קישור</h1>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">סיסמת מנהל</label>
            <input
              type="password"
              className="input"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium">
            צור קישור חדש
          </button>
        </form>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        {result && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-2">קישור נוצר בהצלחה:</p>
            <div className="bg-gray-100 rounded-lg p-3 text-sm break-all mb-3">{result.url}</div>
            <button
              onClick={copyUrl}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-medium"
            >
              {copied ? 'הועתק!' : 'העתק קישור'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
