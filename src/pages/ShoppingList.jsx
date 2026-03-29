import { useEffect, useState } from 'react'
import { RefreshCw, Plus, Check, Trash2 } from 'lucide-react'
import { useShoppingStore } from '../store/useShoppingStore'
import { usePlanStore } from '../store/usePlanStore'
import { useAuthStore } from '../store/useAuthStore'

export default function ShoppingList() {
  const household = useAuthStore(s => s.household)
  const { currentPlan, entries } = usePlanStore()
  const { fetchList, generateFromPlan, addManualItem, toggleItem, deleteItem, getGroupedItems, loading } = useShoppingStore()
  const [newItem, setNewItem] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (household && currentPlan) {
      fetchList(household.id, currentPlan.id)
    }
  }, [household, currentPlan])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      // Entries mit Zutaten laden
      const { data } = await import('../lib/supabase').then(async m => {
        return m.supabase.from('meal_plan_entries')
          .select('*, recipes(id, name, servings, ingredients(*))')
          .eq('plan_id', currentPlan.id)
      })
      await generateFromPlan(data || [], household.id, currentPlan.id)
    } finally { setGenerating(false) }
  }

  const handleAddManual = async (e) => {
    e.preventDefault()
    if (!newItem.trim()) return
    await addManualItem(newItem.trim(), null, null, 'Sonstiges')
    setNewItem('')
  }

  const groups = getGroupedItems()
  const checkedCount = useShoppingStore(s => s.items.filter(i => i.is_checked).length)
  const totalCount = useShoppingStore(s => s.items.length)

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-xl text-gray-900">Einkaufsliste</h2>
          {totalCount > 0 && (
            <p className="text-xs text-gray-400">{checkedCount} von {totalCount} erledigt</p>
          )}
        </div>
        <button onClick={handleGenerate} disabled={generating || !currentPlan}
          className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
          <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generiere...' : 'Neu generieren'}
        </button>
      </div>

      {/* Manuell hinzufügen */}
      <form onSubmit={handleAddManual} className="flex gap-2 mb-5">
        <input value={newItem} onChange={e => setNewItem(e.target.value)}
          placeholder="Artikel manuell hinzufügen..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        <button type="submit" className="bg-green-600 text-white p-2.5 rounded-xl">
          <Plus size={18} />
        </button>
      </form>

      {loading ? (
        <p className="text-center text-gray-400 py-8">Lade Liste...</p>
      ) : groups.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-gray-500 font-medium">Liste ist leer</p>
          <p className="text-gray-400 text-sm mt-1">Generiere die Liste aus dem Wochenplan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(({ category, items }) => (
            <div key={category}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                {category}
              </h3>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {items.map((item, i) => (
                  <div key={item.id}
                    className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                    <button onClick={() => toggleItem(item.id, !item.is_checked)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                        ${item.is_checked ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'}`}>
                      {item.is_checked && <Check size={12} className="text-white" />}
                    </button>
                    <span className={`flex-1 text-sm ${item.is_checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.amount && `${Number(item.amount) % 1 === 0 ? Number(item.amount) : Number(item.amount).toFixed(1)} `}
                      {item.unit && `${item.unit} `}
                      {item.name}
                    </span>
                    {item.is_manual && (
                      <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-400">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}