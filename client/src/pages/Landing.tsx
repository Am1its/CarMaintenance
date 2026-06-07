import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startByEmail } from '../api'

export default function Landing() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token } = await startByEmail(email)
      navigate(`/d/${token}`)
    } catch {
      setError('משהו השתבש, נסה שוב')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--bg)' }} dir="rtl">
      {/* Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 w-full max-w-sm overflow-hidden">
        {/* Top banner */}
        <div className="bg-gray-900 px-6 py-8 text-center">
          <div className="text-5xl mb-3">🚗</div>
          <h1 className="text-white text-xl font-bold">מעקב תחזוקת רכב</h1>
          <p className="text-gray-400 text-sm mt-1">עקוב אחרי הטיפולים והטסטים שלך</p>
        </div>

        {/* Form */}
        <div className="px-6 py-7">
          <p className="text-gray-500 text-sm text-center mb-5">הכנס את האימייל שלך כדי להמשיך</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              className="input text-right"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              dir="ltr"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  טוען...
                </span>
              ) : 'כניסה לדשבורד'}
            </button>
          </form>
          {error && <p className="text-red-500 text-xs text-center mt-3">{error}</p>}
        </div>
      </div>

      <p className="text-gray-400 text-xs mt-6">אימייל זהה = אותם רכבים תמיד</p>
    </div>
  )
}
