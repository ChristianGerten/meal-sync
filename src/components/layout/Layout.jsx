import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

const navItems = [
  { to: '/planner', label: 'Planer', icon: (active) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="2" stroke={active ? '#6c63ff' : 'currentColor'} strokeWidth="1.5"/>
      <rect x="11" y="2" width="7" height="7" rx="2" stroke={active ? '#6c63ff' : 'currentColor'} strokeWidth="1.5"/>
      <rect x="2" y="11" width="7" height="7" rx="2" stroke={active ? '#6c63ff' : 'currentColor'} strokeWidth="1.5"/>
      <rect x="11" y="11" width="7" height="7" rx="2" stroke={active ? '#6c63ff' : 'currentColor'} strokeWidth="1.5"/>
    </svg>
  )},
  { to: '/recipes', label: 'Rezepte', icon: (active) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L3 7v11h14V7L10 2z" stroke={active ? '#6c63ff' : 'currentColor'} strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="7" y="11" width="6" height="7" rx="0.5" stroke={active ? '#6c63ff' : 'currentColor'} strokeWidth="1.5"/>
    </svg>
  )},
  { to: '/shopping', label: 'Einkauf', icon: (active) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 5h10l1.5 9H3.5L5 5z" stroke={active ? '#6c63ff' : 'currentColor'} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="8" cy="17" r="1" fill={active ? '#6c63ff' : 'currentColor'}/>
      <circle cx="13" cy="17" r="1" fill={active ? '#6c63ff' : 'currentColor'}/>
    </svg>
  )},
]

export default function Layout({ children }) {
  const { signOut, household } = useAuthStore()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  // Theme beim ersten Laden setzen
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', saved)
    setDark(saved === 'dark')
  }, [])

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--color-bg)'}}>
      {/* Top Bar */}
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: '0.5px solid var(--color-border)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <span style={{fontSize: '20px'}}>🍽️</span>
          <span style={{fontWeight: '500', fontSize: '16px', color: 'var(--color-text)'}}>MealSync</span>
          {household && (
            <span style={{
              fontSize: '11px', color: 'var(--color-accent-text)',
              background: 'var(--color-accent-soft)',
              padding: '2px 8px', borderRadius: '20px'
            }}>
              {household.name}
            </span>
          )}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDark(d => !d)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '5px 10px', borderRadius: '20px',
              background: 'var(--color-surface-2)',
              border: '0.5px solid var(--color-border)',
              cursor: 'pointer', fontSize: '11px',
              color: 'var(--color-text-muted)'
            }}
          >
            <span>{dark ? '☀️' : '🌙'}</span>
            <span>{dark ? 'Hell' : 'Dunkel'}</span>
          </button>
          <button onClick={signOut} style={{
            padding: '5px 10px', borderRadius: '20px',
            background: 'var(--color-surface-2)',
            border: '0.5px solid var(--color-border)',
            cursor: 'pointer', fontSize: '11px',
            color: 'var(--color-text-muted)'
          }}>
            Abmelden
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{flex: 1, overflowY: 'auto', paddingBottom: '70px'}}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--color-nav)',
        borderTop: '0.5px solid var(--color-nav-border)',
        display: 'flex', zIndex: 50
      }}>
        {navItems.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} style={{flex: 1, textDecoration: 'none'}}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', padding: '10px 4px 8px', gap: '3px',
                color: isActive ? '#6c63ff' : 'var(--color-text-muted)'
              }}>
                {icon(isActive)}
                <span style={{fontSize: '10px', fontWeight: isActive ? '500' : '400'}}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}