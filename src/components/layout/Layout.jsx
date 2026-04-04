import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { CalendarDays, BookOpen, ShoppingCart, Clock, Sun, Moon, LogOut } from 'lucide-react'

const navItems = [
  { to: '/planner', label: 'Planer', icon: CalendarDays },
  { to: '/recipes', label: 'Rezepte', icon: BookOpen },
  { to: '/shopping', label: 'Einkauf', icon: ShoppingCart },
  { to: '/history', label: 'Historie', icon: Clock },
]

export default function Layout({ children }) {
  const { signOut, household } = useAuthStore()
  const [dark, setDark] = useState(() =>
    localStorage.getItem('theme') === 'dark'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', saved)
    setDark(saved === 'dark')
  }, [])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', background: 'var(--color-bg)'
    }}>

      {/* Top Bar — sehr dezent */}
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: '0.5px solid var(--color-border)',
        padding: '13px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '7px',
            background: 'var(--color-accent-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              width: '12px', height: '12px', borderRadius: '3px',
              background: 'var(--color-accent)', opacity: 0.9
            }} />
          </div>
          <span style={{
            fontWeight: '600', fontSize: '15px',
            color: 'var(--color-text)', letterSpacing: '-0.2px'
          }}>
            MealSync
          </span>
          {household && (
            <span style={{
              fontSize: '11px', color: 'var(--color-text-muted)',
              background: 'var(--color-surface-2)',
              padding: '2px 7px', borderRadius: '20px',
              border: '0.5px solid var(--color-border)'
            }}>
              {household.name}
            </span>
          )}
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
          <button onClick={() => setDark(d => !d)} style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'none', border: 'none',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)'
          }}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button onClick={signOut} style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'none', border: 'none',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)'
          }}>
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{flex: 1, overflowY: 'auto', paddingBottom: '72px'}}>
        {children}
      </main>

      {/* Bottom Nav — Pill Style */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--color-nav)',
        borderTop: '0.5px solid var(--color-nav-border)',
        padding: '8px 12px',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
        display: 'flex', gap: '4px', zIndex: 50
      }}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} style={{flex: 1, textDecoration: 'none'}}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '3px',
                padding: '7px 6px', borderRadius: '10px',
                background: isActive ? 'var(--color-accent-nav)' : 'transparent',
                transition: 'background 0.15s'
              }}>
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2 : 1.5}
                  color={isActive ? 'var(--color-accent)' : 'var(--color-text-muted)'}
                />
                <span style={{
                  fontSize: '10px',
                  fontWeight: isActive ? '600' : '400',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  letterSpacing: '0.1px'
                }}>
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