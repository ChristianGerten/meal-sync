import { useEffect, useState, useRef } from 'react'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useShoppingStore, isBasicIngredient } from '../store/useShoppingStore'
import { usePlanStore } from '../store/usePlanStore'
import { useAuthStore } from '../store/useAuthStore'
import { supabase } from '../lib/supabase'
import { SkeletonShoppingGroup, SkeletonStyles } from '../components/Skeleton'

const SUPERMARKET_CATS = [
  'Obst & Gemüse', 'Fleisch & Fisch', 'Kühlregal', 'Milchprodukte',
  'Brot & Backwaren', 'Nudeln', 'Reis & Getreide', 'Konserven',
  'Gewürze', 'Backen', 'Getränke', 'Tiefkühl', 'Sonstiges'
]

const DRUGSTORE_CATS = [
  'Körperpflege', 'Haushalt', 'Gesundheit', 'Baby', 'Sonstiges (Drogerie)'
]

function SwipeItem({ item, onToggle, onDelete }) {
  const startX = useRef(null)
  const [offsetX, setOffsetX] = useState(0)
  const isDragging = useRef(false)

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    isDragging.current = true
  }

  const handleTouchMove = (e) => {
    if (!isDragging.current) return
    const dx = e.touches[0].clientX - startX.current
    setOffsetX(Math.max(-80, Math.min(80, dx)))
  }

  const handleTouchEnd = () => {
    isDragging.current = false
    if (offsetX > 60) onToggle(!item.is_checked)
    else if (offsetX < -60 && item.is_manual) onDelete()
    setOffsetX(0)
  }

  const formatAmount = (amount) => {
    if (!amount) return ''
    const n = Number(amount)
    return n % 1 === 0 ? String(n) : n.toFixed(1)
  }

  return (
    <div style={{position: 'relative', overflow: 'hidden'}}>
      {offsetX > 20 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: item.is_checked ? '#fef3c7' : '#f0fdf4',
          display: 'flex', alignItems: 'center', paddingLeft: '16px'
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <polyline points="3,9 7,13 15,5" stroke={item.is_checked ? '#d97706' : '#16a34a'} strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
      )}
      {offsetX < -20 && item.is_manual && (
        <div style={{
          position: 'absolute', inset: 0, background: '#fef2f2',
          display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end', paddingRight: '16px'
        }}>
          <Trash2 size={16} color="#dc2626" />
        </div>
      )}

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '13px 14px',
          background: 'var(--color-surface)',
          transform: 'translateX(' + offsetX + 'px)',
          transition: isDragging.current ? 'none' : 'transform 0.2s ease',
          userSelect: 'none'
        }}
      >
        <button
          onClick={() => onToggle(!item.is_checked)}
          style={{
            width: '24px', height: '24px', borderRadius: '50%',
            border: item.is_checked ? 'none' : '1.5px solid var(--color-border)',
            background: item.is_checked ? 'var(--color-accent)' : 'transparent',
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s'
          }}
        >
          {item.is_checked && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          )}
        </button>

        <span style={{
          flex: 1, fontSize: '15px',
          color: item.is_checked ? 'var(--color-text-muted)' : 'var(--color-text)',
          textDecoration: item.is_checked ? 'line-through' : 'none',
          transition: 'all 0.15s'
        }}>
          {item.name}
        </span>

        {(item.amount || item.unit) && (
          <span style={{
            fontSize: '13px', fontWeight: '500',
            color: 'var(--color-text-muted)', flexShrink: 0
          }}>
            {formatAmount(item.amount)}{item.unit ? ' ' + item.unit : ''}
          </span>
        )}

        {item.is_manual && (
          <button
            onClick={() => onDelete()}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px', color: 'var(--color-text-muted)',
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
    toggleItem, deleteItem, clearChecked,
    getGroupedItems, loading, items, drugstoreItems
  } = useShoppingStore()

  const [activeStore, setActiveStore] = useState('supermarket')
  const [newItem, setNewItem] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [generating, setGenerating] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBasics, setShowBasics] = useState(false)

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

  const handleAddItem = async () => {
    if (!newItem.trim()) return
    const defaultCat = activeStore === 'drugstore' ? 'Körperpflege' : 'Sonstiges'
    await addManualItem(newItem.trim(), null, null, newCategory || defaultCat, activeStore)
    setNewItem('')
    setNewCategory('')
    setShowAddForm(false)
  }

  const groups = getGroupedItems(activeStore, showBasics)

  const allItems = activeStore === 'drugstore' ? drugstoreItems : items.filter(i => showBasics || !isBasicIngredient(i.name))
  const totalItems = allItems.length
  const checkedItems = allItems.filter(i => i.is_checked).length
  const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0
  const allDone = totalItems > 0 && checkedItems === totalItems
  const hiddenBasicsCount = activeStore === 'supermarket'
    ? items.filter(i => isBasicIngredient(i.name)).length
    : 0

  const accentColor = activeStore === 'drugstore' ? '#5F5E5A' : 'var(--color-accent)'

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
          justifyContent: 'space-between', marginBottom: '12px'
        }}>
          <div>
            <h1 style={{
              fontSize: '20px', fontWeight: '600',
              color: 'var(--color-text)', letterSpacing: '-0.3px'
            }}>
              Einkauf
            </h1>
            <p style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '1px'}}>
              {totalItems === 0
                ? 'Leer'
                : allDone
                  ? 'Alles erledigt'
                  : checkedItems + ' von ' + totalItems + ' · ' + progressPercent + '%'
              }
            </p>
          </div>
          {activeStore === 'supermarket' && (
            <button
              onClick={handleGenerate}
              disabled={generating || !currentPlan}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '8px 12px',
                background: generating ? 'var(--color-surface-2)' : 'var(--color-accent)',
                color: generating ? 'var(--color-text-muted)' : '#fff',
                border: 'none', borderRadius: '10px',
                cursor: generating || !currentPlan ? 'not-allowed' : 'pointer',
                fontSize: '12px', fontWeight: '500'
              }}
            >
              <RefreshCw
                size={13}
                style={{animation: generating ? 'spin 1s linear infinite' : 'none'}}
              />
              {generating ? 'Lädt...' : 'Neu laden'}
            </button>
          )}
        </div>

        {/* Store Tabs */}
        <div style={{
          display: 'flex', gap: '6px', marginBottom: '10px'
        }}>
          <button
            onClick={() => setActiveStore('supermarket')}
            style={{
              flex: 1, padding: '9px',
              borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: activeStore === 'supermarket'
                ? 'var(--color-accent)'
                : 'var(--color-surface)',
              color: activeStore === 'supermarket' ? '#fff' : 'var(--color-text-muted)',
              fontSize: '13px', fontWeight: activeStore === 'supermarket' ? '500' : '400',
              border: activeStore === 'supermarket'
                ? 'none'
                : '0.5px solid var(--color-border)',
              transition: 'all 0.15s'
            }}
          >
            Supermarkt
            {items.filter(i => !i.is_checked).length > 0 && (
              <span style={{
                marginLeft: '6px', fontSize: '11px',
                background: activeStore === 'supermarket'
                  ? 'rgba(255,255,255,0.25)'
                  : 'var(--color-surface-2)',
                padding: '1px 6px', borderRadius: '20px'
              }}>
                {items.filter(i => !i.is_checked && (showBasics || !isBasicIngredient(i.name))).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveStore('drugstore')}
            style={{
              flex: 1, padding: '9px',
              borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: activeStore === 'drugstore'
                ? '#5F5E5A'
                : 'var(--color-surface)',
              color: activeStore === 'drugstore' ? '#fff' : 'var(--color-text-muted)',
              fontSize: '13px', fontWeight: activeStore === 'drugstore' ? '500' : '400',
              border: activeStore === 'drugstore'
                ? 'none'
                : '0.5px solid var(--color-border)',
              transition: 'all 0.15s'
            }}
          >
            Drogerie
            {drugstoreItems.filter(i => !i.is_checked).length > 0 && (
              <span style={{
                marginLeft: '6px', fontSize: '11px',
                background: activeStore === 'drugstore'
                  ? 'rgba(255,255,255,0.25)'
                  : 'var(--color-surface-2)',
                padding: '1px 6px', borderRadius: '20px'
              }}>
                {drugstoreItems.filter(i => !i.is_checked).length}
              </span>
            )}
          </button>
        </div>

        {/* Fortschrittsbalken */}
        {totalItems > 0 && (
          <div style={{
            height: '3px', background: 'var(--color-surface-2)',
            borderRadius: '2px', overflow: 'hidden', marginBottom: '10px'
          }}>
            <div style={{
              height: '100%',
              background: allDone ? '#22c55e' : accentColor,
              width: progressPercent + '%',
              borderRadius: '2px', transition: 'width 0.4s ease'
            }} />
          </div>
        )}

        {/* Artikel hinzufügen */}
        {showAddForm ? (
          <div style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '12px', padding: '10px',
            marginBottom: '10px',
            display: 'flex', flexDirection: 'column', gap: '7px'
          }}>
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddItem()}
              placeholder="Artikel eingeben..."
              autoFocus
              style={{
                padding: '9px 12px',
                background: 'var(--color-surface-2)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '9px', fontSize: '14px',
                color: 'var(--color-text)', outline: 'none'
              }}
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              style={{
                padding: '8px 10px',
                background: 'var(--color-surface-2)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '9px', fontSize: '13px',
                color: 'var(--color-text)', outline: 'none'
              }}
            >
              <option value="">Kategorie wählen...</option>
              {(activeStore === 'drugstore' ? DRUGSTORE_CATS : SUPERMARKET_CATS).map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div style={{display: 'flex', gap: '7px'}}>
              <button onClick={handleAddItem} style={{
                flex: 1, padding: '9px',
                background: accentColor, color: '#fff',
                border: 'none', borderRadius: '9px',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500'
              }}>
                Hinzufügen
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewItem('') }}
                style={{
                  padding: '9px 12px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '9px', cursor: 'pointer',
                  fontSize: '13px', color: 'var(--color-text-muted)'
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              width: '100%', padding: '10px',
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '10px', cursor: 'pointer',
              fontSize: '13px', color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '10px'
            }}
          >
            <div style={{
              width: '20px', height: '20px', borderRadius: '5px',
              background: activeStore === 'drugstore'
                ? 'rgba(95,94,90,0.1)'
                : 'var(--color-accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Plus size={13} color={accentColor} />
            </div>
            Artikel hinzufügen...
          </button>
        )}

        {/* Basis-Zutaten Toggle — nur Supermarkt */}
        {activeStore === 'supermarket' && hiddenBasicsCount > 0 && (
          <button
            onClick={() => setShowBasics(s => !s)}
            style={{
              width: '100%', padding: '7px',
              background: 'none',
              border: '0.5px solid var(--color-border)',
              borderRadius: '9px', cursor: 'pointer',
              fontSize: '11px', color: 'var(--color-text-muted)',
              marginBottom: '10px'
            }}
          >
            {showBasics
              ? 'Basis-Zutaten ausblenden (' + hiddenBasicsCount + ')'
              : hiddenBasicsCount + ' Basis-Zutaten ausgeblendet (Öl, Gewürze...)'
            }
          </button>
        )}
      </div>

      {/* Liste */}
      <div style={{padding: '0 16px'}}>
        {loading ? (
          <>
            <SkeletonStyles />
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <SkeletonShoppingGroup />
              <SkeletonShoppingGroup />
            </div>
          </>
        ) : groups.length === 0 ? (
          <div style={{textAlign: 'center', padding: '48px 24px'}}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'var(--color-surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', fontSize: '24px'
            }}>
              🛒
            </div>
            <p style={{
              fontWeight: '500', fontSize: '15px',
              color: 'var(--color-text)', marginBottom: '6px'
            }}>
              {activeStore === 'drugstore' ? 'Drogerie-Liste leer' : 'Liste ist leer'}
            </p>
            <p style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>
              {activeStore === 'drugstore'
                ? 'Füge Artikel manuell hinzu'
                : 'Plane Gerichte und lade die Liste neu'
              }
            </p>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {groups.map(({ category, items: groupItems }) => {
              const checkedInGroup = groupItems.filter(i => i.is_checked).length
              const allGroupDone = checkedInGroup === groupItems.length && groupItems.length > 0
              const openItems = groupItems.filter(i => !i.is_checked)
              const doneItems = groupItems.filter(i => i.is_checked)

              return (
                <div key={category}>
                  {/* Kategorie Label */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px', padding: '0 2px'
                  }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '500',
                      color: allGroupDone
                        ? 'var(--color-text-muted)'
                        : 'var(--color-text)',
                      textTransform: 'uppercase', letterSpacing: '0.4px'
                    }}>
                      {category}
                    </span>
                    <span style={{
                      fontSize: '11px', color: 'var(--color-text-muted)'
                    }}>
                      {checkedInGroup}/{groupItems.length}
                    </span>
                  </div>

                  {/* Items */}
                  <div style={{
                    background: 'var(--color-surface)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '12px', overflow: 'hidden',
                    opacity: allGroupDone ? 0.6 : 1,
                    transition: 'opacity 0.3s'
                  }}>
                    {/* Offene Items zuerst */}
                    {openItems.map((item, idx) => (
                      <div key={item.id} style={{
                        borderTop: idx > 0 ? '0.5px solid var(--color-border)' : 'none'
                      }}>
                        <SwipeItem
                          item={item}
                          onToggle={(checked) => toggleItem(item.id, checked, activeStore)}
                          onDelete={() => deleteItem(item.id, activeStore)}
                        />
                      </div>
                    ))}

                    {/* Erledigte Items darunter mit Trenner */}
                    {doneItems.length > 0 && openItems.length > 0 && (
                      <div style={{height: '0.5px', background: 'var(--color-border)'}} />
                    )}
                    {doneItems.map((item, idx) => (
                      <div key={item.id} style={{
                        borderTop: idx > 0 ? '0.5px solid var(--color-border)' : 'none'
                      }}>
                        <SwipeItem
                          item={item}
                          onToggle={(checked) => toggleItem(item.id, checked, activeStore)}
                          onDelete={() => deleteItem(item.id, activeStore)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Erledigte löschen */}
            {checkedItems > 0 && (
              <button
                onClick={() => clearChecked(activeStore)}
                style={{
                  width: '100%', padding: '10px',
                  background: 'none',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '10px', cursor: 'pointer',
                  fontSize: '13px', color: 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '6px'
                }}
              >
                <Trash2 size={13} />
                {checkedItems} erledigte Artikel entfernen
              </button>
            )}

            {/* Alles erledigt */}
            {allDone && (
              <div style={{
                padding: '20px',
                background: 'var(--color-accent-soft)',
                border: '0.5px solid var(--color-accent)',
                borderRadius: '14px', textAlign: 'center'
              }}>
                <div style={{fontSize: '28px', marginBottom: '8px'}}>🎉</div>
                <p style={{
                  fontWeight: '500', fontSize: '14px',
                  color: 'var(--color-accent-text)', marginBottom: '3px'
                }}>
                  Einkauf erledigt!
                </p>
                <p style={{fontSize: '12px', color: 'var(--color-accent-text)', opacity: 0.7}}>
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