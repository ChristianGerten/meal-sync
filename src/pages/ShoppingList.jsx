import { useEffect, useState, useRef } from 'react'
import { RefreshCw, Trash2, EyeOff, Eye, Plus } from 'lucide-react'
import { useShoppingStore, isBasicIngredient } from '../store/useShoppingStore'
import { usePlanStore } from '../store/usePlanStore'
import { useAuthStore } from '../store/useAuthStore'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { SkeletonShoppingGroup, SkeletonStyles } from '../components/Skeleton'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { useShoppingRealtime } from '../hooks/useShoppingRealtime'
import { useWakeLock } from '../hooks/useWakeLock'
import { CATEGORY_ICONS, DAYS_SHORT } from '../data/shoppingData'
import ReloadModal from '../components/shopping/ReloadModal'
import AddItemModal from '../components/shopping/AddItemModal'

function SwipeItem({ item, onToggle, onDelete, accentColor }) {
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
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <polyline points="3,9 7,13 15,5"
              stroke={item.is_checked ? '#d97706' : '#16a34a'}
              strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
      )}
      {offsetX < -20 && item.is_manual && (
        <div style={{
          position: 'absolute', inset: 0, background: '#fef2f2',
          display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end', paddingRight: '16px'
        }}>
          <Trash2 size={18} color="#dc2626" />
        </div>
      )}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '15px 14px',
          background: 'var(--color-surface)',
          transform: 'translateX(' + offsetX + 'px)',
          transition: isDragging.current ? 'none' : 'transform 0.2s ease',
          userSelect: 'none'
        }}
      >
        {/* 36px Checkbox — großes Ziel */}
        <button
          onClick={() => onToggle(!item.is_checked)}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: item.is_checked ? 'none' : '2px solid var(--color-border)',
            background: item.is_checked ? accentColor : 'transparent',
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s'
          }}
        >
          {item.is_checked && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <polyline points="2,8 6,12 14,4"
                stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          )}
        </button>

        <span style={{
          flex: 1, fontSize: '16px',
          color: item.is_checked ? 'var(--color-text-muted)' : 'var(--color-text)',
          textDecoration: item.is_checked ? 'line-through' : 'none',
          transition: 'all 0.15s', lineHeight: '1.3'
        }}>
          {item.name}
        </span>

        {(item.amount || item.unit) && (
          <span style={{
            fontSize: '14px', fontWeight: '500',
            color: 'var(--color-text-muted)', flexShrink: 0
          }}>
            {formatAmount(item.amount)}{item.unit ? ' ' + item.unit : ''}
          </span>
        )}

        {item.is_manual && (
          <button onClick={() => onDelete()} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px', color: 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center', flexShrink: 0
          }}>
            <Trash2 size={16} />
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
    getGroupedItems, loading, items, drugstoreItems,
    list, drugList
  } = useShoppingStore()

  useOfflineSync()
  const isOffline = useShoppingStore(s => s.isOffline)
  useWakeLock(true)
  useShoppingRealtime(list?.id, drugList?.id)

  const [activeStore, setActiveStore] = useState('supermarket')
  const [generating, setGenerating] = useState(false)
  const [showReloadModal, setShowReloadModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBasics, setShowBasics] = useState(false)
  const [hideDone, setHideDone] = useState(false)

  useEffect(() => {
    if (household && currentPlan) {
      fetchList(household.id, currentPlan.id)
    }
  }, [household, currentPlan])

  const handleGenerate = async (filteredEntries) => {
    setGenerating(true)
    try {
      await generateFromPlan(filteredEntries, household.id, currentPlan.id)
      toast.success(
        filteredEntries.reduce((sum, e) => sum + e.recipes.ingredients.length, 0)
        + ' Zutaten zur Liste hinzugefügt'
      )
      setShowReloadModal(false)
    } finally {
      setGenerating(false)
    }
  }

  const handleAddItem = async (name, amount, unit, category) => {
    await addManualItem(name, amount, unit, category, activeStore)
  }

  const groups = getGroupedItems(activeStore, showBasics)
  const allItems = activeStore === 'drugstore'
    ? drugstoreItems
    : items.filter(i => showBasics || !isBasicIngredient(i.name))

  const totalItems = allItems.length
  const checkedItems = allItems.filter(i => i.is_checked).length
  const openItems = allItems.filter(i => !i.is_checked).length
  const progressPercent = totalItems > 0
    ? Math.round((checkedItems / totalItems) * 100) : 0
  const allDone = totalItems > 0 && checkedItems === totalItems
  const hiddenBasicsCount = activeStore === 'supermarket'
    ? items.filter(i => isBasicIngredient(i.name)).length : 0
  const drugstoreOpen = drugstoreItems.filter(i => !i.is_checked).length
  const accentColor = activeStore === 'drugstore' ? '#5F5E5A' : '#c1522a'

  return (
    <div style={{paddingBottom: '100px', minHeight: '100dvh'}}>

      {/* Kompakter Header */}
      <div style={{
        padding: '14px 16px',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-bg)',
        borderBottom: '0.5px solid var(--color-border)'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '10px'
        }}>
          <div>
            <h1 style={{
              fontSize: '20px', fontWeight: '600',
              color: 'var(--color-text)', letterSpacing: '-0.3px'
            }}>
              {activeStore === 'drugstore' ? 'Drogerie' : 'Supermarkt'}
            </h1>
            <p style={{
              fontSize: '12px', color: 'var(--color-text-muted)',
              marginTop: '1px'
            }}>
              {totalItems === 0 ? 'Leer'
                : allDone ? 'Alles erledigt 🎉'
                : openItems + ' offen · ' + checkedItems + ' erledigt'
              }
            </p>
          </div>

          <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
            {/* Drogerie Badge */}
            {activeStore === 'supermarket' ? (
              <button
                onClick={() => setActiveStore('drugstore')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '7px 11px',
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '10px', cursor: 'pointer',
                  fontSize: '12px', color: 'var(--color-text-muted)'
                }}
              >
                Drogerie
                {drugstoreOpen > 0 && (
                  <span style={{
                    background: '#5F5E5A', color: '#fff',
                    fontSize: '10px', fontWeight: '600',
                    padding: '1px 6px', borderRadius: '20px'
                  }}>
                    {drugstoreOpen}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setActiveStore('supermarket')}
                style={{
                  padding: '7px 11px',
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '10px', cursor: 'pointer',
                  fontSize: '12px', color: 'var(--color-text-muted)'
                }}
              >
                ← Markt
              </button>
            )}

            {/* Erledigte ausblenden */}
            {checkedItems > 0 && (
              <button
                onClick={() => setHideDone(h => !h)}
                style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: hideDone
                    ? 'var(--color-accent-soft)'
                    : 'var(--color-surface)',
                  border: hideDone
                    ? '0.5px solid var(--color-accent)'
                    : '0.5px solid var(--color-border)',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: hideDone
                    ? 'var(--color-accent)'
                    : 'var(--color-text-muted)'
                }}
              >
                {hideDone ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            )}

            {/* Neu laden */}
            {activeStore === 'supermarket' && (
              <button
                onClick={() => setShowReloadModal(true)}
                disabled={!currentPlan}
                style={{
                  width: '36px', height: '36px',
                  background: '#c1522a', border: 'none',
                  borderRadius: '10px',
                  cursor: !currentPlan ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: !currentPlan ? 0.5 : 1
                }}
              >
                <RefreshCw size={16} color="#fff" />
              </button>
            )}
          </div>
        </div>

        {/* Fortschrittsbalken */}
        {totalItems > 0 && (
          <div style={{
            height: '4px', background: 'var(--color-surface-2)',
            borderRadius: '2px', overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: allDone ? '#22c55e' : accentColor,
              width: progressPercent + '%',
              borderRadius: '2px', transition: 'width 0.4s ease'
            }} />
          </div>
        )}
      </div>

      {/* Basis-Toggle */}
      {activeStore === 'supermarket' && hiddenBasicsCount > 0 && (
        <div style={{padding: '8px 16px 0'}}>
          <button
            onClick={() => setShowBasics(s => !s)}
            style={{
              width: '100%', padding: '8px',
              background: 'none',
              border: '0.5px solid var(--color-border)',
              borderRadius: '9px', cursor: 'pointer',
              fontSize: '12px', color: 'var(--color-text-muted)'
            }}
          >
            {showBasics
              ? 'Basis-Zutaten ausblenden (' + hiddenBasicsCount + ')'
              : hiddenBasicsCount + ' Basis-Zutaten ausgeblendet'
            }
          </button>
        </div>
      )}

      {/* Offline Banner */}
      {isOffline && (
        <div style={{
          margin: '8px 16px 0', padding: '10px 14px',
          background: '#fef3c7', border: '0.5px solid #f59e0b',
          borderRadius: '10px', display: 'flex', alignItems: 'center',
          gap: '8px', fontSize: '13px', color: '#92400e'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#92400e" strokeWidth="2" strokeLinecap="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
          </svg>
          <span>Offline — Änderungen werden synchronisiert</span>
        </div>
      )}

      {/* Liste */}
      <div style={{padding: '12px 16px 0'}}>
        {loading ? (
          <>
            <SkeletonStyles />
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <SkeletonShoppingGroup />
              <SkeletonShoppingGroup />
            </div>
          </>
        ) : groups.length === 0 ? (
          <div style={{textAlign: 'center', padding: '60px 24px'}}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '18px',
              background: 'var(--color-surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '28px'
            }}>🛒</div>
            <p style={{
              fontWeight: '500', fontSize: '16px',
              color: 'var(--color-text)', marginBottom: '8px'
            }}>
              {activeStore === 'drugstore' ? 'Drogerie-Liste leer' : 'Liste ist leer'}
            </p>
            <p style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>
              {activeStore === 'drugstore'
                ? 'Tippe + um Artikel hinzuzufügen'
                : 'Tippe ↺ um Zutaten aus dem Wochenplan zu laden'
              }
            </p>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            {groups.map(({ category, items: groupItems }) => {
              const openGroupItems = groupItems.filter(i => !i.is_checked)
              const doneGroupItems = groupItems.filter(i => i.is_checked)
              const allGroupDone = doneGroupItems.length === groupItems.length
                && groupItems.length > 0
              const visibleDone = hideDone ? [] : doneGroupItems

              if (hideDone && openGroupItems.length === 0) return null

              const icon = CATEGORY_ICONS[category] || '🛒'

              return (
                <div key={category}>
                  {/* Kategorie-Header mit Icon */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: '8px', marginBottom: '8px', padding: '0 2px'
                  }}>
                    <span style={{fontSize: '16px', lineHeight: 1}}>
                      {icon}
                    </span>
                    <span style={{
                      fontSize: '13px', fontWeight: '500',
                      color: allGroupDone
                        ? 'var(--color-text-muted)'
                        : 'var(--color-text)',
                      flex: 1
                    }}>
                      {category}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      background: allGroupDone ? '#f0fdf4' : 'var(--color-surface-2)',
                      color: allGroupDone ? '#16a34a' : 'var(--color-text-muted)',
                      padding: '2px 8px', borderRadius: '20px',
                      fontWeight: allGroupDone ? '500' : '400'
                    }}>
                      {allGroupDone ? '✓ ' : ''}{doneGroupItems.length}/{groupItems.length}
                    </span>
                  </div>

                  <div style={{
                    background: 'var(--color-surface)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '16px', overflow: 'hidden',
                    opacity: allGroupDone ? 0.55 : 1,
                    transition: 'opacity 0.3s'
                  }}>
                    {openGroupItems.map((item, idx) => (
                      <div key={item.id} style={{
                        borderTop: idx > 0
                          ? '0.5px solid var(--color-border)' : 'none'
                      }}>
                        <SwipeItem
                          item={item}
                          accentColor={accentColor}
                          onToggle={(checked) =>
                            toggleItem(item.id, checked, activeStore)
                          }
                          onDelete={() => deleteItem(item.id, activeStore)}
                        />
                      </div>
                    ))}

                    {visibleDone.length > 0 && openGroupItems.length > 0 && (
                      <div style={{
                        height: '0.5px',
                        background: 'var(--color-border)'
                      }} />
                    )}

                    {visibleDone.map((item, idx) => (
                      <div key={item.id} style={{
                        borderTop: idx > 0
                          ? '0.5px solid var(--color-border)' : 'none'
                      }}>
                        <SwipeItem
                          item={item}
                          accentColor={accentColor}
                          onToggle={(checked) =>
                            toggleItem(item.id, checked, activeStore)
                          }
                          onDelete={() => deleteItem(item.id, activeStore)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {checkedItems > 0 && (
              <button
                onClick={() => clearChecked(activeStore)}
                style={{
                  width: '100%', padding: '12px',
                  background: 'none',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '12px', cursor: 'pointer',
                  fontSize: '13px', color: 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '6px'
                }}
              >
                <Trash2 size={14} />
                {checkedItems} erledigte Artikel entfernen
              </button>
            )}

            {allDone && (
              <div style={{
                padding: '28px 20px',
                background: 'var(--color-accent-soft)',
                border: '0.5px solid var(--color-accent)',
                borderRadius: '16px', textAlign: 'center'
              }}>
                <div style={{fontSize: '36px', marginBottom: '10px'}}>🎉</div>
                <p style={{
                  fontWeight: '600', fontSize: '17px',
                  color: 'var(--color-accent-text)', marginBottom: '4px'
                }}>
                  Einkauf erledigt!
                </p>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--color-accent-text)', opacity: 0.7
                }}>
                  Alle {totalItems} Artikel eingekauft
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        style={{
          position: 'fixed', bottom: '90px', right: '20px',
          width: '56px', height: '56px', borderRadius: '50%',
          background: accentColor, border: 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 40, transition: 'transform 0.15s'
        }}
      >
        <Plus size={26} color="#fff" strokeWidth={2.5} />
      </button>

      {/* Modals */}
      {showReloadModal && (
        <ReloadModal
          onClose={() => setShowReloadModal(false)}
          onGenerate={handleGenerate}
          generating={generating}
          planId={currentPlan?.id}
        />
      )}

      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddItem}
          activeStore={activeStore}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}