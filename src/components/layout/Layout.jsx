import { NavLink, useNavigate } from 'react-router-dom'
import { CalendarDays, BookOpen, ShoppingCart, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'

const navItems = [
  { to: '/planner', icon: CalendarDays, label: 'Wochenplan' },
  { to: '/recipes', icon: BookOpen, label: 'Rezepte' },
  { to: '/shopping', icon: ShoppingCart, label: 'Einkauf' },
]

export default function Layout({ children }) {
  const signOut = useAuthStore(s => s.signOut)
  const household = useAuthStore(s => s.household)

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-green-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍽️</span>
          <span className="font-bold text-lg">MealSync</span>
          {household && (
            <span className="text-green-200 text-sm ml-2">· {household.name}</span>
          )}
        </div>
        <button onClick={signOut} className="text-green-200 hover:text-white">
          <LogOut size={20} />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex shadow-lg">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors
              ${isActive ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`
            }
          >
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}