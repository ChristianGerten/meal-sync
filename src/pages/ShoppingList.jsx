import { useEffect, useState, useRef } from 'react'
import { RefreshCw, Plus, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useShoppingStore, isBasicIngredient } from '../store/useShoppingStore'
import { usePlanStore } from '../store/usePlanStore'
import { useAuthStore } from '../store/useAuthStore'
import { supabase } from '../lib/supabase'

const CATEGORIES_ING = [
  'Obst & Gemüse', 'Fleisch & Fisch', 'Kühlregal', 'Milchprodukte',
  'Brot & Backwaren', 'Nudeln', 'Reis & Getreide', 'Konserven',
  'Gewürze', 'Backen', 'Getränke', 'Tiefkühl', 'Sonstiges'
]

// Swipe-to-check Hook
function useSwipe(onSwipeRight, onSwipeLeft) {
  const startX = useRef(null)
  const startY = useRef(null)

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
  }

  const onTouchEnd = (e) => {
    if (startX.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    const dy = e.changedTouches[0].clientY - startY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx > 0) onSwipeRight?.()
      else onSwipeLeft?.()
    }
    startX.current = null
    startY.current = null
  }

  return { onTouchStart, onTouchEnd }
}

function ShoppingItemRow({ item, onToggle, onDelete }) {
  const [swiping, setSwiping] = useState(0) // -1 links, 0 neutral, 1 rechts
  const [offsetX, setOffsetX] = useState(0)
  const startX = useRef(null)
  const isDragging = useRef(false)

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    isDragging.current = true
  }

  const handleTouchMove = (e) => {
    if (!isDragging.current) return
    const dx = e.touches[0].clientX - startX.current
    setOffsetX(Math.max(-80, Math.min(80, dx)))
    setSwiping(dx > 20 ? 1 : dx < -20 ? -1 : 0)
  }

  const handleTouchEnd = () => {
    isDragging.current = false
    if (offsetX > 60) {
      onToggle(!item.is_checked)
    } else if (offsetX < -60 && item.is_manual) {
      onDelete()
    }
    setOffsetX(0)
    setSwiping(0)
  }

  const formatAmount = (amount) => {
    if (!amount) return ''
    const n = Number(amount)
    return n % 1 === 0 ? String(n) : n.toFixed(1)
  }

  return (
    <div style={{position: 'relative', overflow: 'hidden'}}>
      {/* Hintergrund-Feedback beim Swipen */}
      {swiping === 1 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: item.is_checked ? '#fef3c7' : '#dcfce7',
          display: 'flex', alignItems: 'center', paddingLeft: '16px',
          transition: 'background 0.1s'
        }}>
          <Check size={18} color={item.is_checked ? '#d97706' : '#16a34a'} strokeWidth={2.5} />
        </div>
      )}
      {swiping === -1 && item.is_manual && (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#fee2e2',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          paddingRight: '16px'
        }}>
          <Trash2 size={18} color="#dc2626" />
        </div>
      )}

      {/* Item */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '13px 14px',
          background: 'var(--color-surface)',
          transform: `translateX(${offsetX}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.2s ease',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        {/* Checkbox */}
        <button
          onClick={() => onToggle(!item.is_checked)}
          style={{
            width: '24px', height: '24px', borderRadius: '7px',
            border: item.is_checked ? 'none' : '1.5px solid var(--color-border)',
            background: item.is_checked ? 'var(--color-accent)' : 'transparent',
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s'
          }}
        >
          {item.is_checked && <Check size={14} color="#fff" strokeWidth={3} />}
        </button>

        {/* Name & Menge */}
        <div style={{flex: 1, minWidth: 0}}>
          <span style={{
            fontSize: '15px',
            color: item.is_checked ? 'var(--color-text-muted)' : 'var(--color-text)',
            textDecoration: item.is_checked ? 'line-through' : 'none',
            transition: 'all 0.15s'
          }}>
            {item.name}
          </span>
        </div>

        {/* Menge */}
        {(item.amount || item.unit) && (
          <span style={{
            fontSize: '13px', fontWeight: '500',
            color: item.is_checked ? 'var(--color-text-muted)' : 'var(--color-text-muted)',
            flexShrink: 0
          }}>
            {formatAmount(item.amount)}{item.unit ? ` ${item.unit}` : ''}
          </span>
        )}

        {/* Löschen (nur manuell, Desktop) */}
        {item.is_manual && (
          <button
            onClick={onDelete}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px', color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', flexShrink: 0
            }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function ShoppingList() {
  const household = useAuthStore(s => s.household)
  const { currentPlan } = usePlanStore()
  const {
    fetchList, generateFromPlan, addManualItem,
    toggleItem, deleteItem, getGroupedItems, loading, items
  } = useShoppingStore()

  const [newItem, setNewItem] = useState('')
  const [newCategory, setNewCategory] = useState('Sonstiges')
  const [generating, setGenerating] = useState(false)
  const [showBasics, setShowBasics] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState({})
  const [showAddForm, setShowAddForm] = useState(false)

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
    await addManualItem(newItem.trim(), null, null, newCategory)
    setNewItem('')
    setShowAddForm(false)
  }

  const toggleGroup = (cat) =>
    setCollapsedGroups(prev => ({ ...prev, [cat]: !prev[cat] }))

  const groups = getGroupedItems(showBasics)

  const totalItems = items.filter(i => showBasics || !isBasicIngredient(i.name)).length
  const checkedItems = items.filter(i =>
    i.is_checked && (showBasics || !isBasicIngredient(i.name))
  ).length
  const hiddenBasicsCount = items.filter(i => isBasicIngredient(i.name)).length
  const progressPercent = totalItems > 0
    ? Math.round((checkedItems / totalItems) * 100)
    : 0

  const allDone = totalItems > 0 && checkedItems === totalItems

  return (
    <div style={{paddingBottom: '80px'}}>

      {/* Header */}
      <div style={{
        padding: '16px 16px 0',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-bg)'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '10px'
        }}>
          <div>
            <h2 style={{
              fontSize: '22px', fontWeight: '700',
              color: 'var(--color-text)', margin: 0,
              letterSpacing: '-0.5px'
            }}>
              Einkaufsliste
            </h2>
            <p style={{
              fontSize: '12px', color: 'var(--color-text-muted)',
              margin: '2px 0 0'
            }}>
              {totalItems === 0
                ? 'Leer'
                : allDone
                  ? '✓ Alles eingekauft!'
                  : `${checkedItems} von ${totalItems} · ${progressPercent}%`
              }
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !currentPlan}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 14px',
              background: generating ? 'var(--color-surface-2)' : 'var(--color-accent)',
              color: generating ? 'var(--color-text-muted)' : '#fff',
              border: 'none', borderRadius: '12px',
              cursor: generating || !currentPlan ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: '500'
            }}
          >
            <RefreshCw
              size={14}
              style={{animation: generating ? 'spin 1s linear infinite' : 'none'}}
            />
            {generating ? 'Lädt...' : 'Neu laden'}
          </button>
        </div>

        {/* Progress Bar */}
        {totalItems > 0 && (
          <div style={{
            height: '4px', background: 'var(--color-surface-2)',
            borderRadius: '2px', overflow: 'hidden', marginBottom: '12px'
          }}>
            <div style={{
              height: '100%',
              background: allDone ? '#22c55e' : 'var(--color-accent)',
              width: `${progressPercent}%`,
              borderRadius: '2px', transition: 'width 0.4s ease'
            }} />
          </div>
        )}

        {/* Artikel hinzufügen */}
        {showAddForm ? (
          <form onSubmit={handleAddManual} style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '14px', padding: '12px',
            marginBottom: '10px',
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              placeholder="Artikel eingeben..."
              autoFocus
              style={{
                padding: '10px 14px',
                background: 'var(--color-surface-2)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '10px', fontSize: '15px',
                color: 'var(--color-text)', outline: 'none'
              }}
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              style={{
                padding: '9px 12px',
                background: 'var(--color-surface-2)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '10px', fontSize: '14px',
                color: 'var(--color-text)', outline: 'none'
              }}
            >
              {CATEGORIES_ING.map(c => <option key={c}>{c}</option>)}
            </select>
            <div style={{display: 'flex', gap: '8px'}}>
              <button type="submit" style={{
                flex: 1, padding: '10px',
                background: 'var(--color-accent)', color: '#fff',
                border: 'none', borderRadius: '10px',
                cursor: 'pointer', fontSize: '14px', fontWeight: '500'
              }}>
                Hinzufügen
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setNewItem('') }}
                style={{
                  padding: '10px 14px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '10px', cursor: 'pointer',
                  fontSize: '14px', color: 'var(--color-text-muted)'
                }}
              >
                Abbrechen
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              width: '100%', padding: '11px',
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '12px', cursor: 'pointer',
              fontSize: '14px', color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '10px'
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '6px',
              background: 'var(--color-accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Plus size={14} color="var(--color-accent)" />
            </div>
            Artikel hinzufügen...
          </button>
        )}

        {/* Basis-Zutaten Toggle */}
        {hiddenBasicsCount > 0 && (
          <button
            onClick={() => setShowBasics(s => !s)}
            style={{
              width: '100%', padding: '8px',
              background: 'none',
              border: '0.5px solid var(--color-border)',
              borderRadius: '10px', cursor: 'pointer',
              fontSize: '12px', color: 'var(--color-text-muted)',
              marginBottom: '10px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '5px'
            }}
          >
            {showBasics
              ? `Basis-Zutaten ausblenden`
              : `${hiddenBasicsCount} Basis-Zutaten ausgeblendet (Salz, Pfeffer...)`
            }
          </button>
        )}
      </div>

      {/* Liste */}
      <div style={{padding: '0 16px'}}>
        {loading ? (
          <div style={{
            textAlign: 'center', padding: '48px',
            color: 'var(--color-text-muted)'
          }}>
            Lade Liste...
          </div>
        ) : groups.length === 0 ? (
          <div style={{textAlign: 'center', padding: '48px'}}>
            <div style={{fontSize: '48px', marginBottom: '12px'}}>🛒</div>
            <p style={{
              fontWeight: '600', fontSize: '16px',
              color: 'var(--color-text)', marginBottom: '6px'
            }}>
              Liste ist leer
            </p>
            <p style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>
              Plane Gerichte und lade die Liste neu
            </p>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            {groups.map(({ category, items: groupItems }) => {
              const isCollapsed = collapsedGroups[category]
              const checkedInGroup = groupItems.filter(i => i.is_checked).length
              const allGroupDone = checkedInGroup === groupItems.length && groupItems.length > 0

              return (
                <div key={category} style={{
                  background: 'var(--color-surface)',
                  borderRadius: '16px',
                  border: '0.5px solid var(--color-border)',
                  overflow: 'hidden',
                  opacity: allGroupDone ? 0.6 : 1,
                  transition: 'opacity 0.3s'
                }}>
                  {/* Kategorie Header */}
                  <button
                    onClick={() => toggleGroup(category)}
                    style={{
                      width: '100%', padding: '11px 14px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: isCollapsed
                        ? 'none'
                        : '0.5px solid var(--color-border)'
                    }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                      <span style={{
                        fontSize: '12px', fontWeight: '700',
                        color: allGroupDone
                          ? 'var(--color-text-muted)'
                          : 'var(--color-text)',
                        textTransform: 'uppercase', letterSpacing: '0.4px'
                      }}>
                        {category}
                      </span>
                      <span style={{
                        fontSize: '11px', padding: '1px 7px',
                        background: allGroupDone
                          ? 'var(--color-surface-2)'
                          : 'var(--color-accent-soft)',
                        color: allGroupDone
                          ? 'var(--color-text-muted)'
                          : 'var(--color-accent-text)',
                        borderRadius: '20px', fontWeight: '500'
                      }}>
                        {checkedInGroup}/{groupItems.length}
                      </span>
                    </div>
                    {isCollapsed
                      ? <ChevronDown size={15} color="var(--color-text-muted)" />
                      : <ChevronUp size={15} color="var(--color-text-muted)" />
                    }
                  </button>

                  {/* Items */}
                  {!isCollapsed && (
                    <div>
                      {groupItems.map((item, idx) => (
                        <div key={item.id} style={{
                          borderTop: idx > 0
                            ? '0.5px solid var(--color-border)'
                            : 'none'
                        }}>
                          <ShoppingItemRow
                            item={item}
                            onToggle={(checked) => toggleItem(item.id, checked)}
                            onDelete={() => deleteItem(item.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Alles erledigt Banner */}
            {allDone && (
              <div style={{
                padding: '20px',
                background: 'var(--color-accent-soft)',
                borderRadius: '16px',
                border: '0.5px solid var(--color-accent)',
                textAlign: 'center', marginTop: '4px'
              }}>
                <div style={{fontSize: '32px', marginBottom: '8px'}}>🎉</div>
                <p style={{
                  fontWeight: '600', fontSize: '15px',
                  color: 'var(--color-accent-text)', marginBottom: '4px'
                }}>
                  Einkauf erledigt!
                </p>
                <p style={{
                  fontSize: '13px', color: 'var(--color-accent-text)',
                  opacity: 0.8
                }}>
                  Alle {totalItems} Artikel eingekauft
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}