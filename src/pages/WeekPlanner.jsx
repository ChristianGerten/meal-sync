import { useEffect, useState } from 'react'
import { format, addDays, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { usePlanStore } from '../store/usePlanStore'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, X, ChefHat, FileText } from 'lucide-react'

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const DAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export default function WeekPlanner() {
  const navigate = useNavigate()
  const household = useAuthStore(s => s.household)
  const { currentWeekStart, entries, fetchPlan, setWeek, addEntry, removeEntry, loading } = usePlanStore()
  const { recipes, fetchRecipes } = useRecipeStore()
  const [modal, setModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [activeDay, setActiveDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
  const [search, setSearch] = useState('')
  const [noteMode, setNoteMode] = useState(false)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    if (household) {
      fetchPlan(household.id)
      fetchRecipes(household.id)
    }
  }, [household])

  const weekStart = parseISO(currentWeekStart)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getEntry = (dayIndex) =>
    entries.find(e => e.day_of_week === dayIndex + 1 && e.meal_type === 'dinner')

  const getNoteEntry = (dayIndex) =>
    entries.find(e => e.day_of_week === dayIndex + 1 && e.meal_type === 'note')

  const filtered = recipes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.category?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelectRecipe = async (recipe) => {
    await addEntry(selectedDay + 1, 'dinner', recipe.id, recipe.name)
    setModal(false)
    setSearch('')
  }

  const handleSaveNote = async () => {
    const existing = getNoteEntry(activeDay)
    if (existing) await removeEntry(existing.id)
    if (noteText.trim()) {
      await addEntry(activeDay + 1, 'note', null, noteText.trim())
    }
    setNoteMode(false)
    setNoteText('')
  }

  const openNoteMode = () => {
    const existing = getNoteEntry(activeDay)
    setNoteText(existing?.custom_name || '')
    setNoteMode(true)
  }

  const entry = getEntry(activeDay)
  const noteEntry = getNoteEntry(activeDay)
  const hasSteps = entry?.recipes?.recipe_steps?.length > 0 ||
    recipes.find(r => r.id === entry?.recipe_id)?.recipe_steps?.length > 0

  return (
    <div style={{padding: '16px', paddingBottom: '80px'}}>

      {/* Wochennavigation */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '16px'
      }}>
        <button onClick={() => setWeek(addDays(weekStart, -7))} style={{
          width: '36px', height: '36px', borderRadius: '12px',
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-muted)'
        }}>
          <ChevronLeft size={18} />
        </button>

        <div style={{textAlign: 'center'}}>
          <div style={{
            fontSize: '14px', fontWeight: '500',
            color: 'var(--color-text)'
          }}>
            {format(weekStart, 'd. MMM', { locale: de })} –{' '}
            {format(addDays(weekStart, 6), 'd. MMM yyyy', { locale: de })}
          </div>
          <button onClick={() => { setWeek(new Date()); setActiveDay(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1) }} style={{
            fontSize: '11px', color: 'var(--color-accent)',
            background: 'none', border: 'none',
            cursor: 'pointer', marginTop: '2px'
          }}>
            Heute
          </button>
        </div>

        <button onClick={() => setWeek(addDays(weekStart, 7))} style={{
          width: '36px', height: '36px', borderRadius: '12px',
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-muted)'
        }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Tag-Chips */}
      <div style={{
        display: 'flex', gap: '6px',
        marginBottom: '20px', overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {weekDays.map((day, i) => {
          const hasEntry = !!getEntry(i)
          const hasNote = !!getNoteEntry(i)
          const isActive = activeDay === i
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          return (
            <button key={i} onClick={() => setActiveDay(i)} style={{
              minWidth: '44px', padding: '8px 4px',
              borderRadius: '14px', border: 'none',
              cursor: 'pointer', textAlign: 'center',
              flexShrink: 0,
              background: isActive ? 'var(--color-accent)' : 'var(--color-surface)',
              boxShadow: isActive ? '0 2px 8px rgba(108,99,255,0.3)' : 'none',
              transition: 'all 0.15s'
            }}>
              <span style={{
                display: 'block', fontSize: '10px', fontWeight: '500',
                color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)'
              }}>
                {DAYS_SHORT[i]}
              </span>
              <span style={{
                display: 'block', fontSize: '15px', fontWeight: '600',
                color: isActive ? '#fff' : isToday ? 'var(--color-accent)' : 'var(--color-text)',
                marginTop: '2px'
              }}>
                {format(day, 'd')}
              </span>
              <div style={{display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '4px'}}>
                {hasEntry && <div style={{
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: isActive ? 'rgba(255,255,255,0.8)' : 'var(--color-accent)'
                }} />}
                {hasNote && <div style={{
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: isActive ? 'rgba(255,255,255,0.6)' : '#f59e0b'
                }} />}
              </div>
            </button>
          )
        })}
      </div>

      {/* Aktiver Tag */}
      {loading ? (
        <p style={{color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px'}}>
          Lädt...
        </p>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>

          {/* Tagesname */}
          <div style={{
            fontSize: '13px', fontWeight: '600',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            {DAYS[activeDay]}, {format(weekDays[activeDay], 'd. MMMM', { locale: de })}
          </div>

          {/* Gericht */}
          <div style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '16px', overflow: 'hidden'
          }}>
            <div style={{
              padding: '10px 14px',
              borderBottom: '0.5px solid var(--color-border)',
              fontSize: '11px', fontWeight: '600',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <ChefHat size={12} />
              Gericht
            </div>

            {entry ? (
              <div style={{padding: '14px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'var(--color-accent-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', flexShrink: 0, overflow: 'hidden'
                }}>
                  {entry.recipes?.image_url
                    ? <img src={entry.recipes.image_url} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    : '🍳'}
                </div>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{
                    fontWeight: '600', fontSize: '15px',
                    color: 'var(--color-text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {entry.recipes?.name || entry.custom_name}
                  </div>
                  {entry.recipes?.category && (
                    <div style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px'}}>
                      {entry.recipes.category}
                    </div>
                  )}
                </div>
                <div style={{display: 'flex', gap: '6px'}}>
                  {/* Kochen Button */}
                  <button
                    onClick={() => navigate(`/cook/${entry.recipe_id}`)}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--color-accent)',
                      color: '#fff', border: 'none',
                      borderRadius: '10px', cursor: 'pointer',
                      fontSize: '12px', fontWeight: '500',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <ChefHat size={13} />
                    Kochen
                  </button>
                  <button onClick={() => removeEntry(entry.id)} style={{
                    width: '32px', height: '32px',
                    background: 'var(--color-surface-2)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-text-muted)'
                  }}>
                    <X size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setSelectedDay(activeDay); setModal(true) }} style={{
                width: '100%', padding: '16px',
                background: 'none', border: 'none',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                gap: '8px', color: 'var(--color-text-muted)',
                fontSize: '14px'
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'var(--color-accent-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Plus size={16} color="var(--color-accent)" />
                </div>
                Gericht hinzufügen
              </button>
            )}
          </div>

          {/* Zusatz / Anmerkungen */}
          <div style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '16px', overflow: 'hidden'
          }}>
            <div style={{
              padding: '10px 14px',
              borderBottom: noteEntry || noteMode ? '0.5px solid var(--color-border)' : 'none',
              fontSize: '11px', fontWeight: '600',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                <FileText size={12} />
                Zusatz & Anmerkungen
              </div>
              {!noteMode && (
                <button onClick={openNoteMode} style={{
                  fontSize: '11px', color: 'var(--color-accent)',
                  background: 'none', border: 'none', cursor: 'pointer'
                }}>
                  {noteEntry ? 'Bearbeiten' : '+ Hinzufügen'}
                </button>
              )}
            </div>

            {noteMode ? (
              <div style={{padding: '12px'}}>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="z.B. Beilage: Baguette, ohne Knoblauch, extra scharf..."
                  rows={3}
                  autoFocus
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: 'var(--color-surface-2)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '10px', fontSize: '13px',
                    color: 'var(--color-text)', outline: 'none',
                    resize: 'none', boxSizing: 'border-box',
                    lineHeight: '1.5'
                  }}
                />
                <div style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
                  <button onClick={handleSaveNote} style={{
                    flex: 1, padding: '9px',
                    background: 'var(--color-accent)', color: '#fff',
                    border: 'none', borderRadius: '10px',
                    cursor: 'pointer', fontSize: '13px', fontWeight: '500'
                  }}>
                    Speichern
                  </button>
                  <button onClick={() => { setNoteMode(false); setNoteText('') }} style={{
                    padding: '9px 14px',
                    background: 'var(--color-surface-2)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '10px', cursor: 'pointer',
                    fontSize: '13px', color: 'var(--color-text-muted)'
                  }}>
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : noteEntry ? (
              <div style={{padding: '12px 14px'}}>
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
          <div style={{marginTop: '8px'}}>
            <div style={{
              fontSize: '11px', fontWeight: '600',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Wochenübersicht
            </div>
            {weekDays.map((day, i) => {
              const e = getEntry(i)
              const n = getNoteEntry(i)
              const isActive = activeDay === i
              return (
                <div key={i} onClick={() => setActiveDay(i)} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', marginBottom: '4px',
                  background: isActive ? 'var(--color-accent-soft)' : 'var(--color-surface)',
                  borderRadius: '12px', cursor: 'pointer',
                  border: isActive
                    ? '0.5px solid var(--color-accent)'
                    : '0.5px solid var(--color-border)',
                  transition: 'all 0.1s'
                }}>
                  <span style={{
                    fontSize: '12px', fontWeight: '600',
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    width: '26px', flexShrink: 0
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
                        fontSize: '11px', color: '#f59e0b',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        marginTop: '1px'
                      }}>
                        📝 {n.custom_name}
                      </div>
                    )}
                  </div>
                  {!e && (
                    <span style={{fontSize: '11px', color: 'var(--color-accent)', flexShrink: 0}}>
                      + hinzufügen
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* PDF Export */}
          <button onClick={() => window.print()} style={{
            marginTop: '4px', width: '100%', padding: '11px',
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '12px', cursor: 'pointer',
            fontSize: '13px', color: 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px'
          }}>
            📄 Wochenplan exportieren
          </button>
        </div>
      )}

      {/* Rezept-Auswahl Modal */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'flex-end'
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: '20px 20px 0 0',
            width: '100%', maxHeight: '80vh',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '0.5px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{fontWeight: '600', color: 'var(--color-text)'}}>
                {DAYS[selectedDay]} — Gericht wählen
              </span>
              <button onClick={() => { setModal(false); setSearch('') }} style={{
                background: 'none', border: 'none',
                cursor: 'pointer', fontSize: '22px',
                color: 'var(--color-text-muted)'
              }}>×</button>
            </div>
            <div style={{padding: '12px 16px', borderBottom: '0.5px solid var(--color-border)'}}>
              <input
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Suchen..."
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '10px', fontSize: '14px',
                  color: 'var(--color-text)', outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{overflowY: 'auto', flex: 1, padding: '8px'}}>
              {filtered.map(recipe => (
                <button key={recipe.id} onClick={() => handleSelectRecipe(recipe)} style={{
                  width: '100%', textAlign: 'left',
                  padding: '12px', borderRadius: '12px',
                  background: 'none', border: 'none',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '12px'
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'var(--color-surface-2)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '20px',
                    flexShrink: 0, overflow: 'hidden'
                  }}>
                    {recipe.image_url
                      ? <img src={recipe.image_url} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      : '🍳'}
                  </div>
                  <div>
                    <div style={{fontSize: '14px', fontWeight: '500', color: 'var(--color-text)'}}>
                      {recipe.name}
                    </div>
                    {recipe.category && (
                      <div style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px'}}>
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