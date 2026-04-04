import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

const USERS = [
  { label: 'Christian', email: 'person1@mealsync.local' },
  { label: 'Sophie', email: 'person2@mealsync.local' },
]

export default function Login() {
  const [selectedUser, setSelectedUser] = useState(USERS[0])
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(selectedUser.email, password)
      navigate('/')
    } catch (err) {
      setError('Falsches Passwort')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', background: 'var(--color-bg)'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '0.5px solid var(--color-border)',
        borderRadius: '20px', padding: '32px',
        width: '100%', maxWidth: '340px'
      }}>
        {/* Logo */}
        <div style={{textAlign: 'center', marginBottom: '32px'}}>
          <div style={{fontSize: '48px', marginBottom: '12px'}}>🍽️</div>
          <h1 style={{fontSize: '22px', fontWeight: '500', color: 'var(--color-text)'}}>
            MealSync
          </h1>
          <p style={{fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px'}}>
            Wer bist du?
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>

          {/* Nutzer Auswahl */}
          <div style={{display: 'flex', gap: '8px', marginBottom: '4px'}}>
            {USERS.map(user => (
              <button
                key={user.email}
                type="button"
                onClick={() => setSelectedUser(user)}
                style={{
                  flex: 1, padding: '14px 8px',
                  borderRadius: '14px', cursor: 'pointer',
                  border: selectedUser.email === user.email
                    ? '2px solid #6c63ff'
                    : '0.5px solid var(--color-border)',
                  background: selectedUser.email === user.email
                    ? 'var(--color-accent-soft)'
                    : 'var(--color-surface-2)',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{fontSize: '28px', marginBottom: '6px'}}>
                  {user.label === 'Person 1' ? '👤' : '👤'}
                </div>
                <div style={{
                  fontSize: '13px', fontWeight: '500',
                  color: selectedUser.email === user.email
                    ? 'var(--color-accent-text)'
                    : 'var(--color-text)'
                }}>
                  {user.label}
                </div>
              </button>
            ))}
          </div>

          {/* Passwort */}
          <div>
            <label style={{
              display: 'block', fontSize: '13px',
              color: 'var(--color-text-muted)', marginBottom: '6px'
            }}>
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoFocus
              style={{
                width: '100%', padding: '11px 14px',
                background: 'var(--color-input)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '10px', fontSize: '14px',
                color: 'var(--color-text)', outline: 'none'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '10px',
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)', fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px', padding: '13px',
              background: '#6c63ff', color: '#fff',
              border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Anmelden...' : `Als ${selectedUser.label} anmelden`}
          </button>
        </form>
      </div>
    </div>
  )
}