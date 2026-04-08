import { useState, useEffect } from 'react'
import { X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { DAYS_SHORT } from '../../data/shoppingData'

export default function ReloadModal({ onClose, onGenerate, generating, planId }) {
  const [entries, setEntries] = useState([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  // selectedIngredients: { [entryId_ingName]: bool }
  const [selectedIngredients, setSelectedIngredients] = useState({})
  const [expandedEntries, setExpandedEntries] = useState({})

  useEffect(() => {
    if (!planId) return
    loadEntries()
  }, [planId])

  const loadEntries = async () => {
    setLoadingEntries(true)
    const { data } = await supabase
      .from('meal_plan_entries')
      .select('*, recipes(id, name, servings, category, ingredients(*))')
      .eq('plan_id', planId)
      .eq('meal_type', 'dinner')
      .order('day_of_week')

    const valid = (data || []).filter(e => e.recipes?.ingredients?.length > 0)
    setEntries(valid)

    // Alle Zutaten standardmäßig ausgewählt
    const initial = {}
    valid.forEach(entry => {
      entry.recipes.ingredients.forEach(ing => {
        initial[entry.id + '_' + ing.id] = true
      })
    })
    setSelectedIngredients(initial)

    // Alle Einträge aufgeklappt
    const expanded = {}
    valid.forEach(e => { expanded[e.id] = true })
    setExpandedEntries(expanded)

    setLoadingEntries(false)
  }

  const toggleIngredient = (key) => {
    setSelectedIngredients(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleEntry = (entryId) => {
    const entryIngKeys = Object.keys(selectedIngredients)
      .filter(k => k.startsWith(entryId + '_'))
    const allSelected = entryIngKeys.every(k => selectedIngredients[k])
    const next = {}
    entryIngKeys.forEach(k => { next[k] = !allSelected })
    setSelectedIngredients(prev => ({ ...prev, ...next }))
  }

  const toggleExpand = (entryId) => {
    setExpandedEntries(prev => ({ ...prev, [entryId]: !prev[entryId] }))
  }

  const handleGenerate = () => {
    // Nur ausgewählte Zutaten pro Entry weitergeben
    const filteredEntries = entries.map(entry => ({
      ...entry,
      recipes: {
        ...entry.recipes,
        ingredients: entry.recipes.ingredients.filter(ing =>
          selectedIngredients[entry.id + '_' + ing.id]
        )
      }
    })).filter(e => e.recipes.ingredients.length > 0)

    onGenerate(filteredEntries)
  }

  const totalSelected = Object.values(selectedIngredients).filter(Boolean).length
  const totalIngredients = Object.keys(selectedIngredients).length

  const formatAmount = (amount) => {
    if (!amount) return ''
    const n = Number(amount)
    return (n % 1 === 0 ? String(n) : n.toFixed(1))
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 200,
      display: 'flex', alignItems: 'flex-end'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        width: '100%', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column'
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 16px 12px',
          borderBottom: '0.5px solid var(--color-border)',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: '4px'
          }}>
            <div style={{
              fontSize: '16px', fontWeight: '600',
              color: 'var(--color-text)'
            }}>
              Zutaten wählen
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--color-text-muted)'
            }}>
              <X size={20} />
            </button>
          </div>
          <div style={{fontSize: '12px', color: 'var(--color-text-muted)'}}>
            {totalSelected} von {totalIngredients} Zutaten ausgewählt
          </div>

          {/* Fortschrittsbalken */}
          <div style={{
            height: '3px', background: 'var(--color-surface-2)',
            borderRadius: '2px', overflow: 'hidden', marginTop: '10px'
          }}>
            <div style={{
              height: '100%', background: 'var(--color-accent)',
              width: (totalIngredients > 0
                ? Math.round(totalSelected / totalIngredients * 100)
                : 0) + '%',
              borderRadius: '2px', transition: 'width 0.2s ease'
            }} />
          </div>
        </div>

        {/* Zutaten-Liste */}
        <div style={{flex: 1, overflowY: 'auto', padding: '10px 16px'}}>
          {loadingEntries ? (
            <div style={{
              textAlign: 'center', padding: '32px',
              color: 'var(--color-text-muted)', fontSize: '14px'
            }}>
              Lade Gerichte...
            </div>
          ) : entries.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px',
              color: 'var(--color-text-muted)', fontSize: '14px'
            }}>
              Keine Gerichte mit Zutaten geplant.
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {entries.map(entry => {
                const entryIngKeys = entry.recipes.ingredients.map(
                  ing => entry.id + '_' + ing.id
                )
                const selectedCount = entryIngKeys.filter(k => selectedIngredients[k]).length
                const allSelected = selectedCount === entryIngKeys.length
                const isExpanded = expandedEntries[entry.id]
                const dayLabel = DAYS_SHORT[entry.day_of_week - 1] || ''

                return (
                  <div key={entry.id} style={{
                    background: 'var(--color-surface)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '14px', overflow: 'hidden'
                  }}>

                    {/* Gericht Header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 14px',
                      background: allSelected
                        ? 'var(--color-accent-soft)'
                        : 'var(--color-surface)',
                      borderBottom: isExpanded
                        ? '0.5px solid var(--color-border)'
                        : 'none'
                    }}>
                      {/* Gericht Checkbox */}
                      <button
                        onClick={() => toggleEntry(entry.id)}
                        style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          border: allSelected
                            ? 'none'
                            : '1.5px solid var(--color-border)',
                          background: allSelected
                            ? 'var(--color-accent)'
                            : 'transparent',
                          cursor: 'pointer', flexShrink: 0,
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', transition: 'all 0.15s'
                        }}
                      >
                        {allSelected && (
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <polyline points="2,7 5,10 11,3"
                              stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                          </svg>
                        )}
                        {!allSelected && selectedCount > 0 && (
                          <div style={{
                            width: '10px', height: '2px',
                            background: 'var(--color-accent)',
                            borderRadius: '1px'
                          }} />
                        )}
                      </button>

                      <div style={{flex: 1, minWidth: 0}}>
                        <div style={{
                          fontSize: '14px', fontWeight: '500',
                          color: 'var(--color-text)',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {entry.recipes.name}
                        </div>
                        <div style={{
                          fontSize: '11px', color: 'var(--color-text-muted)',
                          marginTop: '1px'
                        }}>
                          {dayLabel} · {selectedCount}/{entryIngKeys.length} Zutaten
                        </div>
                      </div>

                      {/* Expand Toggle */}
                      <button
                        onClick={() => toggleExpand(entry.id)}
                        style={{
                          background: 'none', border: 'none',
                          cursor: 'pointer', color: 'var(--color-text-muted)',
                          display: 'flex', alignItems: 'center',
                          padding: '4px'
                        }}
                      >
                        {isExpanded
                          ? <ChevronUp size={16} />
                          : <ChevronDown size={16} />
                        }
                      </button>
                    </div>

                    {/* Zutaten */}
                    {isExpanded && (
                      <div>
                        {entry.recipes.ingredients.map((ing, idx) => {
                          const key = entry.id + '_' + ing.id
                          const isSelected = selectedIngredients[key]
                          return (
                            <div
                              key={ing.id}
                              onClick={() => toggleIngredient(key)}
                              style={{
                                display: 'flex', alignItems: 'center',
                                gap: '12px', padding: '11px 14px',
                                borderTop: idx > 0
                                  ? '0.5px solid var(--color-border)'
                                  : 'none',
                                cursor: 'pointer',
                                background: isSelected
                                  ? 'transparent'
                                  : 'var(--color-surface-2)',
                                transition: 'background 0.1s'
                              }}
                            >
                              {/* Zutat Checkbox */}
                              <div style={{
                                width: '24px', height: '24px',
                                borderRadius: '6px',
                                border: isSelected
                                  ? 'none'
                                  : '1.5px solid var(--color-border)',
                                background: isSelected
                                  ? 'var(--color-accent)'
                                  : 'transparent',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', flexShrink: 0,
                                transition: 'all 0.15s'
                              }}>
                                {isSelected && (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <polyline points="2,6 5,9 10,3"
                                      stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                                  </svg>
                                )}
                              </div>

                              <span style={{
                                flex: 1, fontSize: '14px',
                                color: isSelected
                                  ? 'var(--color-text)'
                                  : 'var(--color-text-muted)',
                                textDecoration: isSelected ? 'none' : 'line-through',
                                transition: 'all 0.15s'
                              }}>
                                {ing.name}
                              </span>

                              {(ing.amount || ing.unit) && (
                                <span style={{
                                  fontSize: '13px', fontWeight: '500',
                                  color: 'var(--color-text-muted)',
                                  flexShrink: 0
                                }}>
                                  {formatAmount(ing.amount)}
                                  {ing.unit ? ' ' + ing.unit : ''}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '0.5px solid var(--color-border)',
          flexShrink: 0,
          display: 'flex', gap: '8px'
        }}>
          <button onClick={onClose} style={{
            padding: '13px 16px',
            background: 'var(--color-surface-2)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '12px', cursor: 'pointer',
            fontSize: '14px', color: 'var(--color-text-muted)'
          }}>
            Abbrechen
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || totalSelected === 0}
            style={{
              flex: 1, padding: '13px',
              background: generating || totalSelected === 0
                ? 'var(--color-surface-2)'
                : 'var(--color-accent)',
              color: generating || totalSelected === 0
                ? 'var(--color-text-muted)' : '#fff',
              border: 'none', borderRadius: '12px',
              cursor: generating || totalSelected === 0
                ? 'not-allowed' : 'pointer',
              fontSize: '15px', fontWeight: '500',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px'
            }}
          >
            <RefreshCw size={15}
              style={{animation: generating ? 'spin 1s linear infinite' : 'none'}} />
            {generating
              ? 'Generiere...'
              : totalSelected + ' Zutaten übertragen'
            }
          </button>
        </div>
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