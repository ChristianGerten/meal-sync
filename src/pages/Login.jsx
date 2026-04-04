import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'

const USERS = [
  { email: 'person1@mealsync.local', name: 'Person 1' },
  { email: 'person2@mealsync.local', name: 'Person 2' },
]

export default function Login() {
  const { signIn, loading } = useAuthStore()
  const [selected, setSelected] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  const handleSelect = (user) => {
    setSelected(user)
    setPassword('')
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!selected || !password) return
    setSigningIn(true)
    setError('')
    try {
      await signIn(selected.email, password)
    } catch (err) {
      setError('Falsches Passwort')
    } finally {
      setSigningIn(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--color-bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px'
    }}>

      {/* Logo */}
      <div style={{marginBottom: '48px', textAlign: 'center'}}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'var(--color-accent-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '7px',
            background: 'var(--color-accent)'
          }} />
        </div>
        <h1 style={{
          fontSize: '24px', fontWeight: '600',
          color: 'var(--color-text)', letterSpacing: '-0.5px',
          marginBottom: '6px'
        }}>
          MealSync
        </h1>
        <p style={{fontSize: '14px', color: 'var(--color-text-muted)'}}>
          {selected ? 'Passwort eingeben' : 'Wähle dein Profil'}
        </p>
      </div>

      <div style={{width: '100%', maxWidth: '320px'}}>

        {/* Schritt 1 — Person wählen */}
        {!selected && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            {USERS.map(user => (
              <button
                key={user.email}
                onClick={() => handleSelect(user)}
                style={{
                  width: '100%', padding: '16px 20px',
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'var(--color-accent-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span style={{
                    fontSize: '16px', fontWeight: '600',
                    color: 'var(--color-accent)'
                  }}>
                    {user.name.charAt(user.name.length - 1)}
                  </span>
                </div>
                <div style={{flex: 1, textAlign: 'left'}}>
                  <div style={{
                    fontSize: '15px', fontWeight: '500',
                    color: 'var(--color-text)'
                  }}>
                    {user.name}
                  </div>
                  <div style={{
                    fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px'
                  }}>
                    {user.email}
                  </div>
                </div>
                <span style={{color: 'var(--color-text-muted)', fontSize: '18px'}}>›</span>
              </button>
            ))}
          </div>
        )}

        {/* Schritt 2 — Passwort */}
        {selected && (
          <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>

            {/* Gewählter User */}
            <div style={{
              padding: '14px 16px',
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'var(--color-accent-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{
                  fontSize: '15px', fontWeight: '600', color: 'var(--color-accent)'
                }}>
                  {selected.name.charAt(selected.name.length - 1)}
                </span>
              </div>
              <div style={{flex: 1}}>
                <div style={{fontSize: '14px', fontWeight: '500', color: 'var(--color-text)'}}>
                  {selected.name}
                </div>
                <div style={{fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '1px'}}>
                  {selected.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSelected(null); setPassword(''); setError('') }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '12px', color: 'var(--color-accent)', fontWeight: '500'
                }}
              >
                Wechseln
              </button>
            </div>

            {/* Passwort */}
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Passwort"
              autoFocus
              style={{
                width: '100%', padding: '14px 16px',
                background: 'var(--color-surface)',
                border: error
                  ? '0.5px solid var(--color-danger)'
                  : '0.5px solid var(--color-border)',
                borderRadius: '12px', fontSize: '15px',
                color: 'var(--color-text)', outline: 'none',
                boxSizing: 'border-box', letterSpacing: '0.1px'
              }}
            />

            {error && (
              <p style={{
                fontSize: '13px', color: 'var(--color-danger)',
                textAlign: 'center', margin: 0
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={signingIn || !password}
              style={{
                width: '100%', padding: '14px',
                background: 'var(--color-accent)', color: '#fff',
                border: 'none', borderRadius: '12px',
                cursor: signingIn || !password ? 'not-allowed' : 'pointer',
                fontSize: '15px', fontWeight: '500',
                opacity: !password ? 0.6 : 1,
                transition: 'opacity 0.15s'
              }}
            >
              {signingIn ? 'Anmelden...' : 'Anmelden'}
            </button>

          </form>
        )}

      </div>

      <p style={{
        marginTop: '48px', fontSize: '12px',
        color: 'var(--color-text-muted)', textAlign: 'center'
      }}>
        MealSync · Gemeinsam kochen & planen
      </p>

    </div>
  )
}