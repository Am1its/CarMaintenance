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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-2">מעקב תחזוקת רכב</h1>
        <p className="text-gray-500 mb-6">הכנס את האימייל שלך כדי להמשיך</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            className="input"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'טוען...' : 'כניסה'}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </div>
    </div>
  )
}
