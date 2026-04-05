import { useEffect, useState } from 'react'
import { format, addDays, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { usePlanStore } from '../store/usePlanStore'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { SkeletonPlanDay, SkeletonStyles } from '../components/Skeleton'
import { toast } from '../components/Toast'
import { ChevronLeft, ChevronRight, Plus, X, ChefHat, FileText, Users, Shuffle, Refrigerator } from 'lucide-react'
import { Refrigerator } from 'lucide-react'   

const navigate = useNavigate()
const DAYS = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag']
const DAYS_SHORT = ['Mo','Di','Mi','Do','Fr','Sa','So']
const CATEGORIES = ['Alle', 'Pasta', 'Suppe', 'Salat', 'Fleisch', 'Fisch', 'Vegetarisch', 'Vegan', 'Backen', 'Dessert']

export default function WeekPlanner() {
  const navigate = useNavigate()
  const household = useAuthStore(s => s.household)
  const {
    currentWeekStart, entries, fetchPlan, setWeek,
    addEntry, removeEntry, updateServings, loading
  } = usePlanStore()
  const { recipes, fetchRecipes } = useRecipeStore()

  const [modal, setModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [activeDay, setActiveDay] = useState(
    new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  )
  const [search, setSearch] = useState('')
  const [noteMode, setNoteMode] = useState(false)
  const [noteText, setNoteText] = useState('')

  // Zufallsgericht
  const [showRandomPreview, setShowRandomPreview] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [randomCategory, setRandomCategory] = useState('Alle')

  useEffect(() => {
    if (household) {
      fetchPlan(household.id)
      fetchRecipes(household.id)
    }
  }, [household])

  const weekStart = parseISO(currentWeekStart)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getEntry = (i) =>
    entries.find(e => e.day_of_week === i + 1 && e.meal_type === 'dinner')
  const getNoteEntry = (i) =>
    entries.find(e => e.day_of_week === i + 1 && e.meal_type === 'note')

  const filtered = recipes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.category?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelectRecipe = async (recipe) => {
    await addEntry(selectedDay + 1, 'dinner', recipe.id, recipe.name, recipe.servings || 2)
    setModal(false)
    setSearch('')
  }

  const handleSaveNote = async () => {
    const existing = getNoteEntry(activeDay)
    if (existing) await removeEntry(existing.id)
    if (noteText.trim()) await addEntry(activeDay + 1, 'note', null, noteText.trim())
    setNoteMode(false)
    setNoteText('')
  }

  const handleRandomRecipe = () => {
    const pool = randomCategory === 'Alle'
      ? recipes
      : recipes.filter(r =>
          r.category?.toLowerCase() === randomCategory.toLowerCase() ||
          r.tags?.some(t => t.toLowerCase() === randomCategory.toLowerCase())
        )

    const available = pool.filter(r =>
      !entries.find(e => e.recipe_id === r.id && e.meal_type === 'dinner')
    )

    if (!available.length) {
      toast.info('Keine passenden Rezepte verfügbar')
      return
    }

    const random = available[Math.floor(Math.random() * available.length)]
    setSelectedRecipe(random)
    setShowRandomPreview(true)
  }

  const handleConfirmRandom = async () => {
    if (!selectedRecipe) return
    await addEntry(activeDay + 1, 'dinner', selectedRecipe.id, selectedRecipe.name, selectedRecipe.servings || 2)
    setShowRandomPreview(false)
    setSelectedRecipe(null)
    toast.success(selectedRecipe.name + ' eingeplant')
  }

  const entry = getEntry(activeDay)
  const noteEntry = getNoteEntry(activeDay)

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
          justifyContent: 'space-between', marginBottom: '14px'
        }}>
          <div>
            <h1 style={{
              fontSize: '20px', fontWeight: '600',
              color: 'var(--color-text)', letterSpacing: '-0.3px'
            }}>
              Wochenplan
            </h1>
            <p style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '1px'}}>
              {format(weekStart, 'd. MMM', { locale: de })} –{' '}
              {format(addDays(weekStart, 6), 'd. MMM', { locale: de })}
            </p>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
            <button onClick={() => setWeek(addDays(weekStart, -7))} style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-muted)'
            }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => {
              setWeek(new Date())
              setActiveDay(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
            }} style={{
              padding: '5px 10px', borderRadius: '8px',
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              cursor: 'pointer', fontSize: '11px',
              color: 'var(--color-text-muted)', fontWeight: '500'
            }}>
              Heute
            </button>
            <button onClick={() => setWeek(addDays(weekStart, 7))} style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-muted)'
            }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Tag-Chips */}
        <div style={{
          display: 'flex', gap: '5px',
          marginBottom: '14px', overflowX: 'auto',
          scrollbarWidth: 'none', paddingBottom: '2px'
        }}>
          {weekDays.map((day, i) => {
            const hasEntry = !!getEntry(i)
            const hasNote = !!getNoteEntry(i)
            const isActive = activeDay === i
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
            return (
              <button key={i} onClick={() => setActiveDay(i)} style={{
                minWidth: '44px', padding: '7px 5px',
                borderRadius: '10px', cursor: 'pointer',
                textAlign: 'center', flexShrink: 0,
                background: isActive ? 'var(--color-accent)' : 'var(--color-surface)',
                border: isActive ? 'none' : '0.5px solid var(--color-border)',
                transition: 'all 0.15s'
              }}>
                <span style={{
                  display: 'block', fontSize: '9px', fontWeight: '500',
                  color: isActive ? 'rgba(255,255,255,0.65)' : 'var(--color-text-muted)',
                  letterSpacing: '0.3px', textTransform: 'uppercase'
                }}>
                  {DAYS_SHORT[i]}
                </span>
                <span style={{
                  display: 'block', fontSize: '15px', fontWeight: '600',
                  color: isActive ? '#fff' : isToday ? 'var(--color-accent)' : 'var(--color-text)',
                  marginTop: '1px'
                }}>
                  {format(day, 'd')}
                </span>
                <div style={{
                  display: 'flex', justifyContent: 'center',
                  gap: '2px', marginTop: '4px', minHeight: '4px'
                }}>
                  {hasEntry && (
                    <div style={{
                      width: '4px', height: '4px', borderRadius: '50%',
                      background: isActive ? 'rgba(255,255,255,0.7)' : 'var(--color-accent)'
                    }} />
                  )}
                  {hasNote && (
                    <div style={{
                      width: '4px', height: '4px', borderRadius: '50%',
                      background: isActive ? 'rgba(255,255,255,0.5)' : '#d97706'
                    }} />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px'}}>

        {loading ? (
          <>
            <SkeletonStyles />
            <SkeletonPlanDay />
            <SkeletonPlanDay />
          </>
        ) : (
          <>
            <div style={{
              fontSize: '12px', fontWeight: '500',
              color: 'var(--color-text-muted)', letterSpacing: '0.3px'
            }}>
              {DAYS[activeDay]}, {format(weekDays[activeDay], 'd. MMMM', { locale: de })}
            </div>

            {/* Gericht Card */}
            <div style={{
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '14px', overflow: 'hidden'
            }}>
              <div style={{
                padding: '9px 13px',
                borderBottom: '0.5px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span style={{
                  fontSize: '11px', fontWeight: '500',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>
                  Gericht
                </span>
                {!entry && (
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button
                      onClick={() => { setSelectedDay(activeDay); setModal(true) }}
                      style={{
                        fontSize: '11px', color: 'var(--color-accent)',
                        background: 'none', border: 'none',
                        cursor: 'pointer', fontWeight: '500'
                      }}
                    >
                      + Wählen
                    </button>
                  </div>
                )}
              </div>

              {entry ? (
                <>
                  <div style={{
                    padding: '12px 13px',
                    display: 'flex', alignItems: 'center', gap: '10px'
                  }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '10px',
                      background: 'var(--color-accent-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, overflow: 'hidden', fontSize: '20px'
                    }}>
                      {entry.recipes?.image_url ? (
                        <img src={entry.recipes.image_url}
                          style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      ) : '🍳'}
                    </div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={{
                        fontWeight: '500', fontSize: '14px', color: 'var(--color-text)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {entry.recipes?.name || entry.custom_name}
                      </div>
                      {entry.recipes?.category && (
                        <div style={{fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px'}}>
                          {entry.recipes.category}
                        </div>
                      )}
                    </div>
                    <div style={{display: 'flex', gap: '5px', flexShrink: 0}}>
                      <button
                        onClick={() => navigate('/cook/' + entry.recipe_id)}
                        style={{
                          padding: '6px 10px',
                          background: 'var(--color-accent)', color: '#fff',
                          border: 'none', borderRadius: '8px', cursor: 'pointer',
                          fontSize: '12px', fontWeight: '500',
                          display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                      // Button neben den Navigations-Buttons:
<button
  onClick={() => navigate('/fridge')}
  style={{
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '5px 10px', borderRadius: '8px',
    background: 'var(--color-accent-soft)',
    border: '0.5px solid var(--color-accent)',
    cursor: 'pointer', fontSize: '11px',
    color: 'var(--color-accent-text)', fontWeight: '500'
  }}
>
  <Refrigerator size={13} />
  Kühlschrank
</button>
                        <ChefHat size={12} /> Kochen
                      </button>
                      <button onClick={() => removeEntry(entry.id)} style={{
                        width: '30px', height: '30px',
                        background: 'var(--color-surface-2)',
                        border: '0.5px solid var(--color-border)',
                        borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-text-muted)'
                      }}>
                        <X size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Portionen */}
                  <div style={{
                    padding: '9px 13px',
                    borderTop: '0.5px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div style={{
                      fontSize: '12px', color: 'var(--color-text-muted)',
                      display: 'flex', alignItems: 'center', gap: '5px'
                    }}>
                      <Users size={12} /> Portionen
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <button
                        onClick={() => updateServings(entry.id, Math.max(1, (entry.servings || 2) - 1))}
                        style={{
                          width: '24px', height: '24px', borderRadius: '6px',
                          background: 'var(--color-surface-2)',
                          border: '0.5px solid var(--color-border)',
                          cursor: 'pointer', fontSize: '15px', color: 'var(--color-text)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >−</button>
                      <span style={{
                        fontSize: '14px', fontWeight: '600',
                        color: 'var(--color-text)', minWidth: '16px', textAlign: 'center'
                      }}>
                        {entry.servings || 2}
                      </span>
                      <button
                        onClick={() => updateServings(entry.id, (entry.servings || 2) + 1)}
                        style={{
                          width: '24px', height: '24px', borderRadius: '6px',
                          background: 'var(--color-surface-2)',
                          border: '0.5px solid var(--color-border)',
                          cursor: 'pointer', fontSize: '15px', color: 'var(--color-text)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >+</button>
                    </div>
                  </div>
                </>
              ) : (
                /* Kein Gericht — Zufallsgericht Button */
                <div style={{padding: '14px 13px', display: 'flex', flexDirection: 'column', gap: '10px'}}>

                  {/* Kategorie-Filter für Zufall */}
                  <div style={{display: 'flex', gap: '5px', overflowX: 'auto', scrollbarWidth: 'none'}}>
                    {CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => setRandomCategory(cat)} style={{
                        padding: '4px 10px', borderRadius: '20px', border: 'none',
                        cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0,
                        background: randomCategory === cat ? 'var(--color-accent-soft)' : 'var(--color-surface-2)',
                        color: randomCategory === cat ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
                        fontWeight: randomCategory === cat ? '500' : '400',
                        transition: 'all 0.15s'
                      }}>
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div style={{display: 'flex', gap: '8px'}}>
                    {/* Zufallsgericht */}
                    <button
                      onClick={handleRandomRecipe}
                      style={{
                        flex: 1, padding: '11px',
                        background: 'var(--color-accent-soft)',
                        border: '0.5px solid var(--color-accent)',
                        borderRadius: '10px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '6px',
                        fontSize: '13px', fontWeight: '500',
                        color: 'var(--color-accent-text)'
                      }}
                    >
                      <Shuffle size={14} />
                      Überrasch mich
                    </button>

                    {/* Manuell wählen */}
                    <button
                      onClick={() => { setSelectedDay(activeDay); setModal(true) }}
                      style={{
                        flex: 1, padding: '11px',
                        background: 'var(--color-surface-2)',
                        border: '0.5px solid var(--color-border)',
                        borderRadius: '10px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '6px',
                        fontSize: '13px', color: 'var(--color-text-muted)'
                      }}
                    >
                      <Plus size={14} />
                      Selbst wählen
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Anmerkung */}
            <div style={{
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '14px', overflow: 'hidden'
            }}>
              <div style={{
                padding: '9px 13px',
                borderBottom: noteEntry || noteMode ? '0.5px solid var(--color-border)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span style={{
                  fontSize: '11px', fontWeight: '500',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                  <FileText size={11} /> Anmerkungen
                </span>
                {!noteMode && (
                  <button
                    onClick={() => {
                      setNoteText(noteEntry?.custom_name || '')
                      setNoteMode(true)
                    }}
                    style={{
                      fontSize: '11px', color: 'var(--color-accent)',
                      background: 'none', border: 'none',
                      cursor: 'pointer', fontWeight: '500'
                    }}
                  >
                    {noteEntry ? 'Bearbeiten' : '+ Hinzufügen'}
                  </button>
                )}
              </div>

              {noteMode ? (
                <div style={{padding: '10px 13px'}}>
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="z.B. Beilage: Baguette, ohne Knoblauch..."
                    rows={2} autoFocus
                    style={{
                      width: '100%', padding: '8px 10px',
                      background: 'var(--color-surface-2)',
                      border: '0.5px solid var(--color-border)',
                      borderRadius: '8px', fontSize: '13px',
                      color: 'var(--color-text)', outline: 'none',
                      resize: 'none', boxSizing: 'border-box', lineHeight: '1.5'
                    }}
                  />
                  <div style={{display: 'flex', gap: '6px', marginTop: '7px'}}>
                    <button onClick={handleSaveNote} style={{
                      flex: 1, padding: '8px',
                      background: 'var(--color-accent)', color: '#fff',
                      border: 'none', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '12px', fontWeight: '500'
                    }}>
                      Speichern
                    </button>
                    <button onClick={() => { setNoteMode(false); setNoteText('') }} style={{
                      padding: '8px 12px',
                      background: 'var(--color-surface-2)',
                      border: '0.5px solid var(--color-border)',
                      borderRadius: '8px', cursor: 'pointer',
                      fontSize: '12px', color: 'var(--color-text-muted)'
                    }}>
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : noteEntry ? (
                <div style={{padding: '10px 13px'}}>
                  <p style={{
                    fontSize: '13px', color: 'var(--color-text)',
                    lineHeight: '1.5', margin: 0
                  }}>
                    {noteEntry.custom_name}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Wochenübersicht */}
            <div style={{marginTop: '4px'}}>
              <div style={{
                fontSize: '11px', fontWeight: '500',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                marginBottom: '7px', padding: '0 2px'
              }}>
                Diese Woche
              </div>
              <div style={{
                background: 'var(--color-surface)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '14px', overflow: 'hidden'
              }}>
                {weekDays.map((day, i) => {
                  const e = getEntry(i)
                  const n = getNoteEntry(i)
                  const isActive = activeDay === i
                  return (
                    <div
                      key={i}
                      onClick={() => setActiveDay(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 13px',
                        background: isActive ? 'var(--color-accent-soft)' : 'transparent',
                        borderTop: i > 0 ? '0.5px solid var(--color-border)' : 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{
                        fontSize: '11px', fontWeight: '500',
                        color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                        width: '22px', flexShrink: 0
                      }}>
                        {DAYS_SHORT[i]}
                      </span>
                      <div style={{flex: 1, minWidth: 0}}>
                        <div style={{
                          fontSize: '13px',
                          color: e ? 'var(--color-text)' : 'var(--color-text-muted)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {e ? (e.recipes?.name || e.custom_name) : '—'}
                        </div>
                        {n && (
                          <div style={{
                            fontSize: '11px', color: '#d97706',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap', marginTop: '1px'
                          }}>
                            {n.custom_name}
                          </div>
                        )}
                      </div>
                      {e ? (
                        <span style={{fontSize: '11px', color: 'var(--color-text-muted)', flexShrink: 0}}>
                          {e.servings || 2} P.
                        </span>
                      ) : (
                        <span style={{fontSize: '11px', color: 'var(--color-accent)', flexShrink: 0}}>+</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Zufallsgericht Vorschau Modal */}
      {showRandomPreview && selectedRecipe && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 100,
          display: 'flex', alignItems: 'flex-end'
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: '20px 20px 0 0',
            width: '100%', padding: '20px'
          }}>
            <div style={{
              fontSize: '11px', fontWeight: '500',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              marginBottom: '14px', textAlign: 'center'
            }}>
              Vorschlag für {DAYS[activeDay]}
            </div>

            <div style={{
              display: 'flex', gap: '14px', alignItems: 'center',
              padding: '14px', background: 'var(--color-surface-2)',
              borderRadius: '14px', marginBottom: '16px'
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '12px',
                background: 'var(--color-accent-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '26px', flexShrink: 0, overflow: 'hidden'
              }}>
                {selectedRecipe.image_url
                  ? <img src={selectedRecipe.image_url} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  : '🍳'
                }
              </div>
              <div style={{flex: 1}}>
                <div style={{fontSize: '16px', fontWeight: '600', color: 'var(--color-text)'}}>
                  {selectedRecipe.name}
                </div>
                {selectedRecipe.category && (
                  <div style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '3px'}}>
                    {selectedRecipe.category}
                    {selectedRecipe.rating ? ' · ' + '⭐'.repeat(selectedRecipe.rating) : ''}
                  </div>
                )}
              </div>
            </div>

            <div style={{display: 'flex', gap: '8px'}}>
              <button
                onClick={handleRandomRecipe}
                style={{
                  flex: 1, padding: '13px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '12px', cursor: 'pointer',
                  fontSize: '13px', color: 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Shuffle size={14} /> Anderes
              </button>
              <button
                onClick={handleConfirmRandom}
                style={{
                  flex: 2, padding: '13px',
                  background: 'var(--color-accent)', color: '#fff',
                  border: 'none', borderRadius: '12px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '500'
                }}
              >
                Einplanen
              </button>
              <button
                onClick={() => { setShowRandomPreview(false); setSelectedRecipe(null) }}
                style={{
                  width: '46px', padding: '13px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '12px', cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rezept-Modal */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 100,
          display: 'flex', alignItems: 'flex-end'
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: '20px 20px 0 0',
            width: '100%', maxHeight: '80vh',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '14px 16px',
              borderBottom: '0.5px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{fontWeight: '500', fontSize: '15px', color: 'var(--color-text)'}}>
                {DAYS[selectedDay]}
              </span>
              <button onClick={() => { setModal(false); setSearch('') }} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)', fontSize: '20px', lineHeight: 1
              }}>×</button>
            </div>
            <div style={{padding: '10px 14px', borderBottom: '0.5px solid var(--color-border)'}}>
              <input
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rezept suchen..." autoFocus
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '9px', fontSize: '14px',
                  color: 'var(--color-text)', outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{overflowY: 'auto', flex: 1}}>
              {filtered.map(recipe => (
                <button
                  key={recipe.id}
                  onClick={() => handleSelectRecipe(recipe)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '11px 16px',
                    background: 'none', border: 'none',
                    borderBottom: '0.5px solid var(--color-border)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px'
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: 'var(--color-surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', flexShrink: 0, overflow: 'hidden'
                  }}>
                    {recipe.image_url
                      ? <img src={recipe.image_url} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      : '🍳'
                    }
                  </div>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: '14px', color: 'var(--color-text)'}}>
                      {recipe.name}
                    </div>
                    {recipe.category && (
                      <div style={{fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '1px'}}>
                        {recipe.category}
                      </div>
                    )}
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <p style={{
                  textAlign: 'center', color: 'var(--color-text-muted)',
                  padding: '32px', fontSize: '14px'
                }}>
                  Keine Rezepte gefunden
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}