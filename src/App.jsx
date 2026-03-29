import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { useRealtime } from './hooks/useRealtime'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Recipes from './pages/Recipes'
import RecipeDetail from './pages/RecipeDetail'
import WeekPlanner from './pages/WeekPlanner'
import ShoppingList from './pages/ShoppingList'
import Layout from './components/layout/Layout'

function AppRoutes() {
  const { user, household } = useAuthStore()
  useRealtime(household?.id)

  if (!user) return <Navigate to="/login" replace />
  if (!household) return <Navigate to="/onboarding" replace />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/planner" replace />} />
        <Route path="/planner" element={<WeekPlanner />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="/shopping" element={<ShoppingList />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  const init = useAuthStore(s => s.init)
  const loading = useAuthStore(s => s.loading)

  useEffect(() => { init() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-4">🍽️</div>
        <p className="text-gray-500">MealSync lädt...</p>
      </div>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
    </BrowserRouter>
  )
}