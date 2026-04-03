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
import Layout from './components/layout/Layout'

function AppRoutes() {
  const { user, household } = useAuthStore()
  useRealtime(household?.id)

  if (!user) return <Navigate to="/login" replace />

  if (!household) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100dvh', background: 'var(--color-bg)'
    }}>
      <div style={{textAlign: 'center'}}>
        <div style={{fontSize: '40px', marginBottom: '12px'}}>🍽️</div>
        <p style={{color: 'var(--color-text-muted)', fontSize: '14px'}}>Lade Haushalt...</p>
      </div>
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
      </Routes>
    </Layout>
  )
}

export default function App() {
  const init = useAuthStore(s => s.init)
  const loading = useAuthStore(s => s.loading)

  useEffect(() => { init() }, [])

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100dvh', background: 'var(--color-bg)'
    }}>
      <div style={{textAlign: 'center'}}>
        <div style={{fontSize: '40px', marginBottom: '12px'}}>🍽️</div>
        <p style={{color: 'var(--color-text-muted)', fontSize: '14px'}}>MealSync lädt...</p>
      </div>
    </div>
  )

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
    </BrowserRouter>
  )
}