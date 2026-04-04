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
      padding: '24px', background: 'var(--color-bg)'
    }}>
      <div style={{width: '100%', maxWidth: '320px'}}>

        {/* Logo */}
        <div style={{textAlign: 'center', marginBottom: '40px'}}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'var(--color-accent-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px'
          }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '6px',
              background: 'var(--color-accent)'
            }} />
          </div>
          <h1 style={{
            fontSize: '22px', fontWeight: '600',
            color: 'var(--color-text)', letterSpacing: '-0.3px',
            marginBottom: '5px'
          }}>
            MealSync
          </h1>
          <p style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>
            Wer bist du?
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>

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
                    ? '1.5px solid var(--color-accent)'
                    : '0.5px solid var(--color-border)',
                  background: selectedUser.email === user.email
                    ? 'var(--color-accent-soft)'
                    : 'var(--color-surface)',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: selectedUser.email === user.email
                    ? 'var(--color-accent)'
                    : 'var(--color-surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 8px'
                }}>
                  <span style={{
                    fontSize: '15px', fontWeight: '600',
                    color: selectedUser.email === user.email
                      ? '#fff'
                      : 'var(--color-text-muted)'
                  }}>
                    {user.label.charAt(0)}
                  </span>
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
              display: 'block', fontSize: '12px', fontWeight: '500',
              color: 'var(--color-text-muted)', marginBottom: '6px',
              textTransform: 'uppercase', letterSpacing: '0.4px'
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
                width: '100%', padding: '12px 14px',
                background: 'var(--color-surface)',
                border: error
                  ? '0.5px solid var(--color-danger)'
                  : '0.5px solid var(--color-border)',
                borderRadius: '10px', fontSize: '15px',
                color: 'var(--color-text)', outline: 'none',
                boxSizing: 'border-box', letterSpacing: '0.05em'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 13px', borderRadius: '10px',
              background: 'var(--color-danger-soft)',
              color: 'var(--color-danger)', fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              marginTop: '4px', padding: '13px',
              background: 'var(--color-accent)', color: '#fff',
              border: 'none', borderRadius: '12px',
              fontSize: '14px', fontWeight: '500',
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              opacity: !password ? 0.6 : 1,
              transition: 'opacity 0.15s'
            }}
          >
            {loading ? 'Anmelden...' : 'Als ' + selectedUser.label + ' anmelden'}
          </button>

        </form>

        <p style={{
          marginTop: '32px', fontSize: '12px',
          color: 'var(--color-text-muted)', textAlign: 'center'
        }}>
          MealSync · Gemeinsam kochen & planen
        </p>

      </div>
    </div>
  )
}