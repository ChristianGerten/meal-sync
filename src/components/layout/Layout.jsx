import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { CalendarDays, BookOpen, ShoppingCart, Sun, Moon, LogOut } from 'lucide-react'
import { CalendarDays, BookOpen, ShoppingCart, Clock, Sun, Moon, LogOut } from 'lucide-react'


const navItems = [
  { to: '/planner', label: 'Planer', icon: CalendarDays },
  { to: '/recipes', label: 'Rezepte', icon: BookOpen },
  { to: '/shopping', label: 'Einkauf', icon: ShoppingCart },
  { to: '/history', label: 'Historie', icon: Clock },
]

export default function Layout({ children }) {
  const { signOut, household } = useAuthStore()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

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
      {/* Top Bar */}
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: '0.5px solid var(--color-border)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'var(--color-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px'
          }}>
            🍽️
          </div>
          <div>
            <span style={{
              fontWeight: '700', fontSize: '15px',
              color: 'var(--color-text)', letterSpacing: '-0.3px'
            }}>
              MealSync
            </span>
            {household && (
              <span style={{
                fontSize: '11px', color: 'var(--color-text-muted)',
                marginLeft: '6px'
              }}>
                {household.name}
              </span>
            )}
          </div>
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
          <button onClick={() => setDark(d => !d)} style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'var(--color-surface-2)',
            border: '0.5px solid var(--color-border)',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)'
          }}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button onClick={signOut} style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'var(--color-surface-2)',
            border: '0.5px solid var(--color-border)',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)'
          }}>
            <LogOut size={15} />
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
        display: 'flex', zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} style={{flex: 1, textDecoration: 'none'}}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', padding: '10px 4px 8px',
                gap: '3px',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)'
              }}>
                <Icon size={21} strokeWidth={isActive ? 2 : 1.5} />
                <span style={{
                  fontSize: '10px',
                  fontWeight: isActive ? '600' : '400',
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