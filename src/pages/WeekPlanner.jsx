import { useEffect, useState } from 'react'
import { format, addDays, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { usePlanStore } from '../store/usePlanStore'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MEALS = [
  { key: 'breakfast', label: '☀️ Früh' },
  { key: 'lunch', label: '🌤️ Mittag' },
  { key: 'dinner', label: '🌙 Abend' },
]

export default function WeekPlanner() {
  const household = useAuthStore(s => s.household)
  const { currentWeekStart, entries, fetchPlan, setWeek, addEntry, removeEntry, loading } = usePlanStore()
  const { recipes, fetchRecipes } = useRecipeStore()
  const [modal, setModal] = useState(null) // { day, mealType }
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (household) {
      fetchPlan(household.id)
      fetchRecipes(household.id)
    }
  }, [household])

  const weekStart = parseISO(currentWeekStart)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getEntry = (day, mealType) =>
    entries.find(e => e.day_of_week === day + 1 && e.meal_type === mealType)

  const filtered = recipes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.category?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelectRecipe = async (recipe) => {
    await addEntry(modal.day + 1, modal.mealType, recipe.id, recipe.name)
    setModal(null); setSearch('')
  }

  return (
    <div className="p-4">
      {/* Wochennavigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeek(addDays(weekStart, -7))}
          className="p-2 rounded-lg hover:bg-gray-200">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-semibold text-gray-900">
            {format(weekStart, 'd. MMM', { locale: de })} –{' '}
            {format(addDays(weekStart, 6), 'd. MMM yyyy', { locale: de })}
          </p>
          <button onClick={() => setWeek(new Date())}
            className="text-xs text-green-600 hover:underline">
            Heute
          </button>
        </div>
        <button onClick={() => setWeek(addDays(weekStart, 7))}
          className="p-2 rounded-lg hover:bg-gray-200">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Wochengitter */}
      {loading ? (
        <p className="text-center text-gray-400 py-8">Lade Wochenplan...</p>
      ) : (
        <div className="space-y-3">
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-green-600 px-3 py-2 flex items-center gap-2">
                <span className="text-white font-bold text-sm">{DAYS[dayIndex]}</span>
                <span className="text-green-200 text-xs">
                  {format(day, 'd. MMM', { locale: de })}
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {MEALS.map(({ key, label }) => {
                  const entry = getEntry(dayIndex, key)
                  return (
                    <div key={key} className="flex items-center px-3 py-2 gap-2">
                      <span className="text-xs text-gray-400 w-16 shrink-0">{label}</span>
                      {entry ? (
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">
                            {entry.recipes?.name || entry.custom_name}
                          </span>
                          <button onClick={() => removeEntry(entry.id)}
                            className="text-gray-300 hover:text-red-500 ml-2">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setModal({ day: dayIndex, mealType: key })}
                          className="flex-1 flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg px-2 py-1 transition-colors">
                          <Plus size={14} /> Gericht wählen
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rezept-Auswahl Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Gericht wählen</h3>
              <button onClick={() => { setModal(null); setSearch('') }}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="px-4 py-2 border-b">
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Suchen..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {filtered.map(recipe => (
                <button key={recipe.id} onClick={() => handleSelectRecipe(recipe)}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-green-50 flex items-center gap-3">
                  <div className="text-2xl">🍳</div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{recipe.name}</p>
                    {recipe.category && (
                      <p className="text-xs text-gray-400">{recipe.category}</p>
                    )}
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">Keine Rezepte gefunden</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}