import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'

const USERS = [
  { email: 'person1@mealsync.local', password: 'mealsync2024', name: 'Person 1' },
  { email: 'person2@mealsync.local', password: 'mealsync2024', name: 'Person 2' },
]

export default function Login() {
  const { signIn, loading } = useAuthStore()
  const [error, setError] = useState('')
  const [signingIn, setSigningIn] = useState(null)

  const handleLogin = async (user) => {
    setSigningIn(user.email)
    setError('')
    try {
      await signIn(user.email, user.password)
    } catch (err) {
      setError('Anmeldung fehlgeschlagen')
    } finally {
      setSigningIn(null)
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
          Wähle dein Profil
        </p>
      </div>

      {/* User Auswahl */}
      <div style={{
        width: '100%', maxWidth: '320px',
        display: 'flex', flexDirection: 'column', gap: '10px'
      }}>
        {USERS.map(user => (
          <button
            key={user.email}
            onClick={() => handleLogin(user)}
            disabled={loading || signingIn !== null}
            style={{
              width: '100%', padding: '16px 20px',
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '14px',
              transition: 'all 0.15s',
              opacity: signingIn && signingIn !== user.email ? 0.5 : 1
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
              <div style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px'}}>
                {signingIn === user.email ? 'Wird angemeldet...' : 'Anmelden'}
              </div>
            </div>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: signingIn === user.email
                ? 'var(--color-accent)'
                : 'var(--color-surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s'
            }}>
              <span style={{
                fontSize: '14px',
                color: signingIn === user.email ? '#fff' : 'var(--color-text-muted)'
              }}>
                →
              </span>
            </div>
          </button>
        ))}
      </div>

      {error && (
        <p style={{
          marginTop: '16px', fontSize: '13px',
          color: 'var(--color-danger)', textAlign: 'center'
        }}>
          {error}
        </p>
      )}

      <p style={{
        marginTop: '48px', fontSize: '12px',
        color: 'var(--color-text-muted)', textAlign: 'center'
      }}>
        MealSync · Gemeinsam kochen & planen
      </p>
    </div>
  )
}