import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Upload } from 'lucide-react'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'
import ImportModal from '../components/recipes/ImportModal'

export default function Recipes() {
  const household = useAuthStore(s => s.household)
  const { recipes, fetchRecipes, loading } = useRecipeStore()
  const [search, setSearch] = useState('')
  const [showImport, setShowImport] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (household) fetchRecipes(household.id)
  }, [household])

  const filtered = recipes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.category?.toLowerCase().includes(search.toLowerCase()) ||
    r.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rezepte suchen..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button onClick={() => setShowImport(true)}
          className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50">
          <Upload size={18} className="text-gray-600" />
        </button>
        <button onClick={() => navigate('/recipes/new')}
          className="p-2.5 bg-green-600 rounded-xl">
          <Plus size={18} className="text-white" />
        </button>
      </div>

      {/* Rezept-Grid */}
      {loading ? (
        <p className="text-center text-gray-400 py-8">Lade Rezepte...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">👨‍🍳</div>
          <p className="text-gray-500 font-medium">Noch keine Rezepte</p>
          <p className="text-gray-400 text-sm mt-1">Füge dein erstes Rezept hinzu!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(recipe => (
            <button key={recipe.id} onClick={() => navigate(`/recipes/${recipe.id}`)}
              className="bg-white rounded-xl shadow-sm overflow-hidden text-left hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 flex items-center justify-center text-3xl">
                {recipe.image_url
                  ? <img src={recipe.image_url} alt={recipe.name} className="w-full h-full object-cover" />
                  : '🍽️'
                }
              </div>
              <div className="p-2.5">
                <p className="font-semibold text-sm text-gray-900 line-clamp-2">{recipe.name}</p>
                {recipe.category && (
                  <p className="text-xs text-gray-400 mt-0.5">{recipe.category}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-1">
                  {recipe.tags?.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showImport && (
        <ImportModal onClose={() => { setShowImport(false); fetchRecipes(household.id) }} />
      )}
    </div>
  )
}