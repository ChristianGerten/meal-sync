import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function Login() {
  const [email, setEmail] = useState('')
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
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError('E-Mail oder Passwort falsch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{background: 'var(--color-bg)'}}>
      <div style={{
        background: 'var(--color-surface)',
        border: '0.5px solid var(--color-border)',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '360px'
      }}>
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <div style={{fontSize: '48px', marginBottom: '12px'}}>🍽️</div>
          <h1 style={{fontSize: '22px', fontWeight: '500', color: 'var(--color-text)'}}>
            MealSync
          </h1>
          <p style={{fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px'}}>
            Gemeinsam kochen planen
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          <div>
            <label style={{display: 'block', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '6px'}}>
              E-Mail
            </label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required placeholder="name@beispiel.de"
              style={{
                width: '100%', padding: '10px 14px',
                background: 'var(--color-input)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '10px', fontSize: '14px',
                color: 'var(--color-text)', outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{display: 'block', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '6px'}}>
              Passwort
            </label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 14px',
                background: 'var(--color-input)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '10px', fontSize: '14px',
                color: 'var(--color-text)', outline: 'none'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              padding: '10px 14px', borderRadius: '10px', fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            marginTop: '8px', padding: '12px',
            background: '#6c63ff', color: '#fff',
            border: 'none', borderRadius: '10px',
            fontSize: '14px', fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  )
}