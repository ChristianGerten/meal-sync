import { useEffect, useState } from 'react'
import { format, addDays, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { usePlanStore } from '../store/usePlanStore'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'
import { exportWeekPlanAsPDF } from '../lib/exportPDF'

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const DAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export default function WeekPlanner() {
  const household = useAuthStore(s => s.household)
  const { currentWeekStart, entries, fetchPlan, setWeek, addEntry, removeEntry, loading } = usePlanStore()
  const { recipes, fetchRecipes } = useRecipeStore()
  const [modal, setModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [search, setSearch] = useState('')
  const [activeDay, setActiveDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)

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

  const filtered = recipes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.category?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelectRecipe = async (recipe) => {
    await addEntry(selectedDay + 1, 'dinner', recipe.id, recipe.name)
    setModal(false)
    setSearch('')
  }

// handleExportPDF Funktion ersetzen:
const handleExportPDF = () => {
  const weekLabel = `${format(weekStart, 'd. MMM', { locale: de })} – ${format(addDays(weekStart, 6), 'd. MMM yyyy', { locale: de })}`
  const days = weekDays.map(d => format(d, 'd. MMM', { locale: de }))
  exportWeekPlanAsPDF(weekLabel, days, entries, recipes)
}

  return (
    <div style={{padding: '16px'}}>
      {/* Wochennavigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <button onClick={() => setWeek(addDays(weekStart, -7))} style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-muted)', fontSize: '16px'
        }}>‹</button>

        <div style={{textAlign: 'center'}}>
          <div style={{fontWeight: '500', fontSize: '14px', color: 'var(--color-text)'}}>
            {format(weekStart, 'd. MMM', { locale: de })} – {format(addDays(weekStart, 6), 'd. MMM yyyy', { locale: de })}
          </div>
          <button onClick={() => setWeek(new Date())} style={{
            fontSize: '11px', color: 'var(--color-accent)',
            background: 'none', border: 'none', cursor: 'pointer', marginTop: '2px'
          }}>
            Heute
          </button>
        </div>

        <button onClick={() => setWeek(addDays(weekStart, 7))} style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: 'var(--color-surface)', border: '0.5px solid var(--color-border)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-muted)', fontSize: '16px'
        }}>›</button>
      </div>

      {/* Tag-Chips */}
      <div style={{display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px'}}>
        {weekDays.map((day, i) => {
          const hasEntry = !!getEntry(i)
          const isActive = activeDay === i
          return (
            <button key={i} onClick={() => setActiveDay(i)} style={{
              minWidth: '42px', padding: '8px 4px',
              borderRadius: '10px', border: 'none', cursor: 'pointer',
              textAlign: 'center', flexShrink: 0,
              background: isActive ? '#6c63ff' : 'var(--color-surface)',
              transition: 'background 0.15s'
            }}>
              <span style={{display: 'block', fontSize: '10px', color: isActive ? '#d4d1ff' : 'var(--color-text-muted)'}}>
                {DAYS_SHORT[i]}
              </span>
              <span style={{display: 'block', fontSize: '14px', fontWeight: '500', color: isActive ? '#fff' : 'var(--color-text)', marginTop: '2px'}}>
                {format(day, 'd')}
              </span>
              <div style={{
                width: '4px', height: '4px', borderRadius: '50%',
                background: isActive ? '#d4d1ff' : '#6c63ff',
                margin: '3px auto 0', opacity: hasEntry ? 1 : 0
              }}/>
            </button>
          )
        })}
      </div>

      {/* Aktiver Tag Detail */}
      {loading ? (
        <p style={{color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px'}}>Lädt...</p>
      ) : (
        <div>
          <div style={{
            fontSize: '13px', fontWeight: '500',
            color: 'var(--color-text-muted)', marginBottom: '10px'
          }}>
            {DAYS[activeDay]}, {format(weekDays[activeDay], 'd. MMMM', { locale: de })}
          </div>

          {getEntry(activeDay) ? (
            <div style={{
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '14px', padding: '14px',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '10px',
                background: 'var(--color-accent-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', flexShrink: 0
              }}>
                {getEntry(activeDay).recipes?.image_url
                  ? <img src={getEntry(activeDay).recipes.image_url} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px'}} />
                  : '🍳'}
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontWeight: '500', color: 'var(--color-text)', fontSize: '15px'}}>
                  {getEntry(activeDay).recipes?.name || getEntry(activeDay).custom_name}
                </div>
                {getEntry(activeDay).recipes?.category && (
                  <div style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px'}}>
                    {getEntry(activeDay).recipes.category}
                  </div>
                )}
              </div>
              <button onClick={() => removeEntry(getEntry(activeDay).id)} style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'var(--color-surface-2)',
                border: '0.5px solid var(--color-border)',
                cursor: 'pointer', color: 'var(--color-text-muted)',
                fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>×</button>
            </div>
          ) : (
            <button onClick={() => { setSelectedDay(activeDay); setModal(true) }} style={{
              width: '100%', padding: '20px',
              background: 'none',
              border: '1.5px dashed var(--color-border)',
              borderRadius: '14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              color: 'var(--color-text-muted)', fontSize: '14px'
            }}>
              <span style={{fontSize: '20px'}}>+</span>
              Gericht hinzufügen
            </button>
          )}

          {/* Alle Tage Übersicht */}
          <div style={{marginTop: '20px'}}>
            <div style={{fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
              Wochenübersicht
            </div>
            {weekDays.map((day, i) => {
              const entry = getEntry(i)
              return (
                <div key={i} onClick={() => setActiveDay(i)} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px',
                  background: activeDay === i ? 'var(--color-accent-soft)' : 'var(--color-surface)',
                  borderRadius: '10px', marginBottom: '4px',
                  cursor: 'pointer',
                  border: activeDay === i ? '0.5px solid var(--color-accent)' : '0.5px solid var(--color-border)'
                }}>
                  <span style={{fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)', width: '24px'}}>
                    {DAYS_SHORT[i]}
                  </span>
                  <span style={{fontSize: '13px', color: entry ? 'var(--color-text)' : 'var(--color-text-muted)', flex: 1}}>
                    {entry ? (entry.recipes?.name || entry.custom_name) : '—'}
                  </span>
                  {!entry && (
                    <span style={{fontSize: '11px', color: 'var(--color-accent)'}}>+ hinzufügen</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* PDF Export */}
          <button onClick={handleExportPDF} style={{
            marginTop: '16px', width: '100%', padding: '12px',
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '12px', cursor: 'pointer',
            fontSize: '13px', color: 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}>
            📄 Wochenplan als PDF exportieren
          </button>
        </div>
      )}

      {/* Rezept-Auswahl Modal */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 100,
          display: 'flex', alignItems: 'flex-end'
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: '20px 20px 0 0',
            width: '100%', maxHeight: '80vh',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{padding: '16px', borderBottom: '0.5px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <span style={{fontWeight: '500', color: 'var(--color-text)'}}>
                Gericht für {DAYS[selectedDay]}
              </span>
              <button onClick={() => { setModal(false); setSearch('') }} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '20px', color: 'var(--color-text-muted)'
              }}>×</button>
            </div>
            <div style={{padding: '12px 16px', borderBottom: '0.5px solid var(--color-border)'}}>
              <input
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rezept suchen..."
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'var(--color-input)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '10px', fontSize: '14px',
                  color: 'var(--color-text)', outline: 'none'
                }}
              />
            </div>
            <div style={{overflowY: 'auto', flex: 1, padding: '8px'}}>
              {filtered.map(recipe => (
                <button key={recipe.id} onClick={() => handleSelectRecipe(recipe)} style={{
                  width: '100%', textAlign: 'left',
                  padding: '12px', borderRadius: '12px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'var(--color-surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', flexShrink: 0, overflow: 'hidden'
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
                <p style={{textAlign: 'center', color: 'var(--color-text-muted)', padding: '32px', fontSize: '14px'}}>
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