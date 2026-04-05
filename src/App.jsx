import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { useRealtime } from './hooks/useRealtime'
import { ToastContainer } from './components/Toast'
import Login from './pages/Login'
import Recipes from './pages/Recipes'
import RecipeDetail from './pages/RecipeDetail'
import WeekPlanner from './pages/WeekPlanner'
import ShoppingList from './pages/ShoppingList'
import CookingMode from './pages/CookingMode'
import History from './pages/History'
import Settings from './pages/Settings'
import Layout from './components/layout/Layout'
import FridgeCheck from './pages/FridgeCheck'

function AppRoutes() {
  const { user, household } = useAuthStore()
  useRealtime(household?.id)

  if (!user) return <Navigate to="/login" replace />

  // Haushalt noch nicht geladen — nur kurz warten
  if (!household) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100dvh', background: 'var(--color-bg)'
    }}>
      <div style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: 'var(--color-accent)',
        animation: 'pulse 1s ease-in-out infinite'
      }} />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/planner" replace />} />
        <Route path="/planner" element={<WeekPlanner />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="/shopping" element={<ShoppingList />} />
        <Route path="/cook/:id" element={<CookingMode />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  const init = useAuthStore(s => s.init)
  const loading = useAuthStore(s => s.loading)

  useEffect(() => {
    init()
  }, [])

  // Nur ganz kurz loading zeigen — max 300ms spürbar
  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100dvh', background: 'var(--color-bg)'
    }}>
      <div style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: 'var(--color-accent)',
        animation: 'pulse 1s ease-in-out infinite'
      }} />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppRoutes />} />
        <Route path="/fridge" element={<FridgeCheck />} />
      </Routes>
    </BrowserRouter>
  )
}