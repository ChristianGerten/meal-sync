import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCookHistoryStore } from '../store/useCookHistoryStore'
import { useAuthStore } from '../store/useAuthStore'
import { Trash2, ChefHat, TrendingUp } from 'lucide-react'
import { format, isToday, isYesterday, isThisWeek } from 'date-fns'
import { de } from 'date-fns/locale'

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Heute'
  if (isYesterday(d)) return 'Gestern'
  if (isThisWeek(d)) return format(d, 'EEEE', { locale: de })
  return format(d, 'd. MMMM yyyy', { locale: de })
}

const groupByDate = (history) => {
  const groups = {}
  history.forEach(entry => {
    const label = formatDate(entry.cooked_at)
    if (!groups[label]) groups[label] = []
    groups[label].push(entry)
  })
  return Object.entries(groups)
}

export default function History() {
  const navigate = useNavigate()
  const household = useAuthStore(s => s.household)
  const { history, loading, fetchHistory, deleteEntry, getStats } = useCookHistoryStore()
  const [showStats, setShowStats] = useState(true)

  useEffect(() => {
    if (household) fetchHistory(household.id)
  }, [household])

  const stats = getStats()
  const groups = groupByDate(history)

  return (
    <div style={{padding: '16px', paddingBottom: '80px'}}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '16px'
      }}>
        <div>
          <h2 style={{
            fontSize: '22px', fontWeight: '700',
            color: 'var(--color-text)', margin: 0, letterSpacing: '-0.5px'
          }}>
            Kochhistorie
          </h2>
          <p style={{fontSize: '12px', color: 'var(--color-text-muted)', margin: '2px 0 0'}}>
            {history.length} Gerichte gekocht
          </p>
        </div>
        {stats && (
          <button onClick={() => setShowStats(s => !s)} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '7px 12px', borderRadius: '10px',
            background: showStats ? 'var(--color-accent-soft)' : 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            cursor: 'pointer', fontSize: '12px',
            color: showStats ? 'var(--color-accent-text)' : 'var(--color-text-muted)'
          }}>
            <TrendingUp size={13} />
            Statistik
          </button>
        )}
      </div>

      {/* Statistik Cards */}
      {showStats && stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '8px', marginBottom: '16px'
        }}>
          <div style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '14px', padding: '14px'
          }}>
            <div style={{fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: '500'}}>
              GESAMT GEKOCHT
            </div>
            <div style={{fontSize: '28px', fontWeight: '700', color: 'var(--color-text)'}}>
              {stats.total}
            </div>
            <div style={{fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px'}}>
              {stats.uniqueRecipes} verschiedene Gerichte
            </div>
          </div>

          <div style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '14px', padding: '14px'
          }}>
            <div style={{fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: '500'}}>
              DIESE WOCHE
            </div>
            <div style={{fontSize: '28px', fontWeight: '700', color: 'var(--color-accent)'}}>
              {stats.thisWeek}
            </div>
            <div style={{fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px'}}>
              Gerichte gekocht
            </div>
          </div>

          {stats.mostCooked && (
            <div style={{
              gridColumn: '1 / -1',
              background: 'var(--color-accent-soft)',
              border: '0.5px solid var(--color-accent)',
              borderRadius: '14px', padding: '14px',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--color-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <ChefHat size={18} color="#fff" />
              </div>
              <div>
                <div style={{fontSize: '11px', color: 'var(--color-accent-text)', fontWeight: '600', marginBottom: '2px'}}>
                  LIEBLINGSGERICHT
                </div>
                <div style={{fontSize: '14px', fontWeight: '600', color: 'var(--color-accent-text)'}}>
                  {stats.mostCooked.name}
                </div>
                <div style={{fontSize: '12px', color: 'var(--color-accent-text)', opacity: 0.7}}>
                  {stats.mostCooked.count}× gekocht
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historie */}
      {loading ? (
        <div style={{textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)'}}>
          Lädt...
        </div>
      ) : history.length === 0 ? (
        <div style={{textAlign: 'center', padding: '48px'}}>
          <div style={{fontSize: '48px', marginBottom: '12px'}}>👨‍🍳</div>
          <p style={{fontWeight: '600', color: 'var(--color-text)', marginBottom: '6px'}}>
            Noch nichts gekocht
          </p>
          <p style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>
            Koche ein Rezept — es wird hier automatisch gespeichert
          </p>
        </div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          {groups.map(([dateLabel, entries]) => (
            <div key={dateLabel}>
              <div style={{
                fontSize: '12px', fontWeight: '700',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                {dateLabel}
              </div>
              <div style={{
                background: 'var(--color-surface)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '16px', overflow: 'hidden'
              }}>
                {entries.map((entry, idx) => (
                  <div key={entry.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px',
                    borderTop: idx > 0 ? '0.5px solid var(--color-border)' : 'none',
                    cursor: entry.recipe_id ? 'pointer' : 'default'
                  }}
                  onClick={() => entry.recipe_id && navigate(`/recipes/${entry.recipe_id}`)}
                  >
                    {/* Bild */}
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '10px',
                      background: 'var(--color-accent-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px', flexShrink: 0, overflow: 'hidden'
                    }}>
                      {entry.recipes?.image_url
                        ? <img src={entry.recipes.image_url}
                            style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        : '🍳'
                      }
                    </div>

                    {/* Info */}
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={{
                        fontSize: '14px', fontWeight: '500',
                        color: 'var(--color-text)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {entry.recipe_name}
                      </div>
                      <div style={{
                        fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px',
                        display: 'flex', gap: '8px'
                      }}>
                        <span>
                          {format(new Date(entry.cooked_at), 'HH:mm')} Uhr
                        </span>
                        {entry.servings && (
                          <span>{entry.servings} Portionen</span>
                        )}
                      </div>
                      {entry.notes && (
                        <div style={{
                          fontSize: '12px', color: 'var(--color-text-muted)',
                          marginTop: '3px', fontStyle: 'italic'
                        }}>
                          {entry.notes}
                        </div>
                      )}
                    </div>

                    {/* Löschen */}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id) }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '4px', color: 'var(--color-text-muted)',
                        display: 'flex', alignItems: 'center', flexShrink: 0
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
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