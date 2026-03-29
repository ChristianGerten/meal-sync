import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { Home, Users } from 'lucide-react'

export default function Onboarding() {
  const [mode, setMode] = useState(null) // 'create' | 'join'
  const [householdName, setHouseholdName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { createHousehold, joinHousehold, household } = useAuthStore()
  const navigate = useNavigate()

  if (household) { navigate('/'); return null }

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await createHousehold(householdName)
      navigate('/')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await joinHousehold(joinCode)
      navigate('/')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏠</div>
          <h2 className="text-xl font-bold text-gray-900">Euer Haushalt</h2>
          <p className="text-gray-500 text-sm mt-1">Erstelle einen neuen Haushalt oder tritt einem bestehenden bei</p>
        </div>

        {!mode && (
          <div className="space-y-3">
            <button onClick={() => setMode('create')}
              className="w-full flex items-center gap-3 p-4 border-2 border-green-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all">
              <div className="bg-green-100 p-2 rounded-lg"><Home className="text-green-600" size={20} /></div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Haushalt erstellen</p>
                <p className="text-xs text-gray-500">Neue Gruppe anlegen</p>
              </div>
            </button>
            <button onClick={() => setMode('join')}
              className="w-full flex items-center gap-3 p-4 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all">
              <div className="bg-blue-100 p-2 rounded-lg"><Users className="text-blue-600" size={20} /></div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Haushalt beitreten</p>
                <p className="text-xs text-gray-500">Code eingeben</p>
              </div>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <button onClick={() => setMode(null)} className="text-sm text-gray-500 hover:text-gray-700">← Zurück</button>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name des Haushalts</label>
              <input type="text" value={householdName} onChange={e => setHouseholdName(e.target.value)}
                required placeholder="z.B. Familie Müller"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Erstelle...' : 'Haushalt erstellen'}
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <button onClick={() => setMode(null)} className="text-sm text-gray-500 hover:text-gray-700">← Zurück</button>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Einladungscode</label>
              <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value)}
                required placeholder="z.B. AB12CD" maxLength={6}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">Den Code bekommst du von Person 1</p>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Suche...' : 'Beitreten'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}