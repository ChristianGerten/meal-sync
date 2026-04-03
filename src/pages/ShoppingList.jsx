import { useEffect, useState } from 'react'
import { RefreshCw, Plus, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useShoppingStore } from '../store/useShoppingStore'
import { usePlanStore } from '../store/usePlanStore'
import { useAuthStore } from '../store/useAuthStore'
import { supabase } from '../lib/supabase'

// Basis-Zutaten die ausgeblendet werden
const BASIC_INGREDIENTS = [
  'salz', 'pfeffer', 'zucker', 'wasser', 'öl', 'olivenöl', 'butter',
  'mehl', 'essig', 'backpulver', 'natron', 'speisestärke', 'senf',
  'schwarzer pfeffer', 'weißer pfeffer', 'salz und pfeffer', 'speiseöl',
  'sonnenblumenöl', 'rapsöl', 'pflanzenöl', 'margarine'
]

const isBasicIngredient = (name) =>
  BASIC_INGREDIENTS.some(b => name.toLowerCase().trim() === b ||
    name.toLowerCase().trim().startsWith(b + ' '))

export default function ShoppingList() {
  const household = useAuthStore(s => s.household)
  const { currentPlan } = usePlanStore()
  const {
    fetchList, generateFromPlan, addManualItem,
    toggleItem, deleteItem, getGroupedItems, loading
  } = useShoppingStore()
  const [newItem, setNewItem] = useState('')
  const [generating, setGenerating] = useState(false)
  const [showBasics, setShowBasics] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState({})

  useEffect(() => {
    if (household && currentPlan) {
      fetchList(household.id, currentPlan.id)
    }
  }, [household, currentPlan])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const { data } = await supabase
        .from('meal_plan_entries')
        .select('*, recipes(id, name, servings, ingredients(*))')
        .eq('plan_id', currentPlan.id)
      await generateFromPlan(data || [], household.id, currentPlan.id)
    } finally { setGenerating(false) }
  }

  const handleAddManual = async (e) => {
    e.preventDefault()
    if (!newItem.trim()) return
    await addManualItem(newItem.trim(), null, null, 'Sonstiges')
    setNewItem('')
  }

  const toggleGroup = (category) => {
    setCollapsedGroups(prev => ({ ...prev, [category]: !prev[category] }))
  }

  const allGroups = getGroupedItems()

  // Basis-Zutaten filtern
  const filteredGroups = allGroups.map(group => ({
    ...group,
    items: group.items.filter(item =>
      showBasics || !isBasicIngredient(item.name)
    ),
    hiddenCount: group.items.filter(item => isBasicIngredient(item.name)).length
  })).filter(group => group.items.length > 0 || group.hiddenCount > 0)

  const totalItems = useShoppingStore(s => s.items.filter(i =>
    showBasics || !isBasicIngredient(i.name)
  ).length)
  const checkedItems = useShoppingStore(s => s.items.filter(i =>
    i.is_checked && (showBasics || !isBasicIngredient(i.name))
  ).length)
  const hiddenBasicsCount = useShoppingStore(s =>
    s.items.filter(i => isBasicIngredient(i.name)).length
  )

  const progressPercent = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0

  return (
    <div style={{padding: '16px', paddingBottom: '80px'}}>

      {/* Header */}
      <div style={{marginBottom: '16px'}}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '8px'
        }}>
          <div>
            <h2 style={{
              fontSize: '20px', fontWeight: '700',
              color: 'var(--color-text)', margin: 0
            }}>
              Einkaufsliste
            </h2>
            {totalItems > 0 && (
              <p style={{
                fontSize: '12px', color: 'var(--color-text-muted)',
                margin: '2px 0 0'
              }}>
                {checkedItems} von {totalItems} erledigt
              </p>
            )}
          </div>
          <button onClick={handleGenerate} disabled={generating || !currentPlan} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 14px',
            background: generating ? 'var(--color-surface-2)' : 'var(--color-accent)',
            color: generating ? 'var(--color-text-muted)' : '#fff',
            border: 'none', borderRadius: '12px',
            cursor: generating || !currentPlan ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontWeight: '500'
          }}>
            <RefreshCw size={14} style={{
              animation: generating ? 'spin 1s linear infinite' : 'none'
            }} />
            {generating ? 'Generiere...' : 'Neu laden'}
          </button>
        </div>

        {/* Progress Bar */}
        {totalItems > 0 && (
          <div style={{
            height: '4px', background: 'var(--color-surface-2)',
            borderRadius: '2px', overflow: 'hidden'
          }}>
            <div style={{
              height: '100%', background: 'var(--color-accent)',
              width: `${progressPercent}%`,
              borderRadius: '2px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}
      </div>

      {/* Manuell hinzufügen */}
      <form onSubmit={handleAddManual} style={{
        display: 'flex', gap: '8px', marginBottom: '16px'
      }}>
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          placeholder="Artikel hinzufügen..."
          style={{
            flex: 1, padding: '11px 14px',
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '12px', fontSize: '14px',
            color: 'var(--color-text)', outline: 'none'
          }}
        />
        <button type="submit" style={{
          width: '44px', height: '44px',
          background: 'var(--color-accent)',
          border: 'none', borderRadius: '12px',
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <Plus size={20} color="#fff" />
        </button>
      </form>

      {/* Basis-Zutaten Toggle */}
      {hiddenBasicsCount > 0 && (
        <button onClick={() => setShowBasics(s => !s)} style={{
          width: '100%', padding: '9px',
          background: 'var(--color-surface-2)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '10px', cursor: 'pointer',
          fontSize: '12px', color: 'var(--color-text-muted)',
          marginBottom: '12px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '6px'
        }}>
          {showBasics ? '🙈' : '👁️'}
          {showBasics
            ? `Basis-Zutaten ausblenden (${hiddenBasicsCount})`
            : `${hiddenBasicsCount} Basis-Zutaten einblenden (Salz, Pfeffer...)`
          }
        </button>
      )}

      {/* Liste */}
      {loading ? (
        <div style={{textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)'}}>
          Lade Liste...
        </div>
      ) : filteredGroups.length === 0 ? (
        <div style={{textAlign: 'center', padding: '48px'}}>
          <div style={{fontSize: '48px', marginBottom: '12px'}}>🛒</div>
          <p style={{fontWeight: '600', color: 'var(--color-text)', marginBottom: '6px'}}>
            Liste ist leer
          </p>
          <p style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>
            Plane Gerichte für die Woche und lade die Liste neu
          </p>
        </div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {filteredGroups.map(({ category, items, hiddenCount }) => {
            if (items.length === 0) return null
            const isCollapsed = collapsedGroups[category]
            const checkedInGroup = items.filter(i => i.is_checked).length
            return (
              <div key={category} style={{
                background: 'var(--color-surface)',
                borderRadius: '16px',
                border: '0.5px solid var(--color-border)',
                overflow: 'hidden'
              }}>
                {/* Kategorie Header */}
                <button onClick={() => toggleGroup(category)} style={{
                  width: '100%', padding: '11px 14px',
                  background: 'none', border: 'none',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: isCollapsed ? 'none' : '0.5px solid var(--color-border)'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <span style={{
                      fontSize: '11px', fontWeight: '700',
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>
                      {category}
                    </span>
                    {checkedInGroup > 0 && (
                      <span style={{
                        fontSize: '10px', padding: '1px 6px',
                        background: 'var(--color-accent-soft)',
                        color: 'var(--color-accent-text)',
                        borderRadius: '20px'
                      }}>
                        {checkedInGroup}/{items.length}
                      </span>
                    )}
                  </div>
                  {isCollapsed
                    ? <ChevronDown size={14} color="var(--color-text-muted)" />
                    : <ChevronUp size={14} color="var(--color-text-muted)" />
                  }
                </button>

                {/* Items */}
                {!isCollapsed && (
                  <div>
                    {items.map((item, idx) => (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center',
                        gap: '12px', padding: '11px 14px',
                        borderTop: idx > 0 ? '0.5px solid var(--color-border)' : 'none',
                        opacity: item.is_checked ? 0.5 : 1,
                        transition: 'opacity 0.2s'
                      }}>
                        <button onClick={() => toggleItem(item.id, !item.is_checked)} style={{
                          width: '22px', height: '22px',
                          borderRadius: '6px', flexShrink: 0,
                          border: item.is_checked
                            ? 'none'
                            : '1.5px solid var(--color-border)',
                          background: item.is_checked ? 'var(--color-accent)' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s'
                        }}>
                          {item.is_checked && <Check size={13} color="#fff" strokeWidth={3} />}
                        </button>

                        <span style={{
                          flex: 1, fontSize: '14px',
                          color: 'var(--color-text)',
                          textDecoration: item.is_checked ? 'line-through' : 'none'
                        }}>
                          {item.amount && (
                            <span style={{color: 'var(--color-text-muted)', marginRight: '4px'}}>
                              {Number(item.amount) % 1 === 0
                                ? Number(item.amount)
                                : Number(item.amount).toFixed(1)}
                              {item.unit && ` ${item.unit}`}
                            </span>
                          )}
                          {item.name}
                        </span>

                        {item.is_manual && (
                          <button onClick={() => deleteItem(item.id)} style={{
                            background: 'none', border: 'none',
                            cursor: 'pointer', padding: '4px',
                            color: 'var(--color-text-muted)',
                            display: 'flex', alignItems: 'center'
                          }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}