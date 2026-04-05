import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'
import { supabase } from '../lib/supabase'
import { Refrigerator, ChefHat, Clock, Star, ArrowLeft, X } from 'lucide-react'

const QUICK_INGREDIENTS = [
  'Eier', 'Milch', 'Butter', 'Käse', 'Joghurt', 'Sahne',
  'Hähnchenbrust', 'Hackfleisch', 'Speck',
  'Tomaten', 'Zwiebeln', 'Knoblauch', 'Kartoffeln', 'Paprika', 'Karotten', 'Zucchini',
  'Spaghetti', 'Penne', 'Reis', 'Kartoffeln',
  'Dosentomaten', 'Kokosmilch', 'Kichererbsen',
  'Lachs', 'Thunfisch (Dose)',
]

const MATCH_CONFIG = {
  voll: { label: 'Kann ich kochen', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  fast: { label: 'Fast vollständig', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  halb: { label: 'Teilweise möglich', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

export default function FridgeCheck() {
  const navigate = useNavigate()
  const household = useAuthStore(s => s.household)
  const { recipes, fetchRecipes } = useRecipeStore()

  const [input, setInput] = useState('')
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (household) fetchRecipes(household.id)
  }, [household])

  const addIngredient = (name) => {
    const trimmed = name.trim()
    if (!trimmed || selected.includes(trimmed)) return
    setSelected(prev => [...prev, trimmed])
    setInput('')
  }

  const removeIngredient = (name) => {
    setSelected(prev => prev.filter(i => i !== name))
  }

  const handleCheck = async () => {
    if (selected.length === 0) return
    setLoading(true)
    setError('')
    setResults(null)

    try {
      // Rezepte mit Zutaten laden
      const recipesWithIngredients = await Promise.all(
        recipes.slice(0, 30).map(async (r) => {
          if (r.ingredients) return r
          const { data } = await supabase
            .from('recipes')
            .select('*, ingredients(*)')
            .eq('id', r.id)
            .single()
          return data || r
        })
      )

      const { data, error: fnError } = await supabase.functions.invoke('fridge-check', {
        body: {
          ingredients: selected.join(', '),
          recipes: recipesWithIngredients
        }
      })

      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)
      if (!Array.isArray(data) || data.length === 0) {
        setResults([])
        return
      }

      setResults(data)
    } catch (err) {
      setError('Fehler: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResults(null)
    setSelected([])
    setInput('')
    setError('')
  }

  return (
    <div style={{paddingBottom: '80px', minHeight: '100dvh', background: 'var(--color-bg)'}}>

      {/* Header */}
      <div style={{
        padding: '16px',
        display: 'flex', alignItems: 'center', gap: '12px',
        borderBottom: '0.5px solid var(--color-border)',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-bg)'
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)',
          display: 'flex', alignItems: 'center'
        }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{flex: 1}}>
          <h1 style={{
            fontSize: '18px', fontWeight: '600',
            color: 'var(--color-text)', letterSpacing: '-0.3px'
          }}>
            Kühlschrankcheck
          </h1>
          <p style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '1px'}}>
            Was habt ihr zuhause?
          </p>
        </div>
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px',
          background: 'var(--color-accent-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Refrigerator size={20} color="var(--color-accent)" />
        </div>
      </div>

      <div style={{padding: '16px'}}>

        {!results ? (
          <>
            {/* Eingabe */}
            <div style={{marginBottom: '14px'}}>
              <div style={{
                display: 'flex', gap: '8px', marginBottom: '10px'
              }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && input.trim()) addIngredient(input)
                  }}
                  placeholder="Zutat eingeben + Enter..."
                  style={{
                    flex: 1, padding: '11px 14px',
                    background: 'var(--color-surface)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '10px', fontSize: '14px',
                    color: 'var(--color-text)', outline: 'none'
                  }}
                />
                <button
                  onClick={() => addIngredient(input)}
                  disabled={!input.trim()}
                  style={{
                    padding: '11px 14px',
                    background: input.trim() ? 'var(--color-accent)' : 'var(--color-surface-2)',
                    color: input.trim() ? '#fff' : 'var(--color-text-muted)',
                    border: 'none', borderRadius: '10px',
                    cursor: input.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '13px', fontWeight: '500'
                  }}
                >
                  + Hinzufügen
                </button>
              </div>

              {/* Ausgewählte Zutaten */}
              {selected.length > 0 && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: '6px',
                  padding: '12px', marginBottom: '10px',
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '12px'
                }}>
                  {selected.map(ing => (
                    <div key={ing} style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '5px 10px',
                      background: 'var(--color-accent-soft)',
                      border: '0.5px solid var(--color-accent)',
                      borderRadius: '20px'
                    }}>
                      <span style={{
                        fontSize: '13px', color: 'var(--color-accent-text)',
                        fontWeight: '500'
                      }}>
                        {ing}
                      </span>
                      <button
                        onClick={() => removeIngredient(ing)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--color-accent)', padding: '0',
                          display: 'flex', alignItems: 'center'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Schnellauswahl */}
            <div style={{marginBottom: '20px'}}>
              <div style={{
                fontSize: '11px', fontWeight: '500',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                Schnell hinzufügen
              </div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
                {QUICK_INGREDIENTS
                  .filter(i => !selected.includes(i))
                  .map(ing => (
                    <button
                      key={ing}
                      onClick={() => addIngredient(ing)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--color-surface)',
                        border: '0.5px solid var(--color-border)',
                        borderRadius: '20px', cursor: 'pointer',
                        fontSize: '12px', color: 'var(--color-text-muted)',
                        transition: 'all 0.15s'
                      }}
                    >
                      + {ing}
                    </button>
                  ))
                }
              </div>
            </div>

            {error && (
              <div style={{
                padding: '11px 13px', marginBottom: '14px',
                background: 'var(--color-danger-soft)',
                border: '0.5px solid var(--color-danger)',
                borderRadius: '10px', fontSize: '13px',
                color: 'var(--color-danger)'
              }}>
                {error}
              </div>
            )}

            {/* Check Button */}
            <button
              onClick={handleCheck}
              disabled={loading || selected.length === 0 || recipes.length === 0}
              style={{
                width: '100%', padding: '15px',
                background: loading || selected.length === 0
                  ? 'var(--color-surface-2)'
                  : 'var(--color-accent)',
                color: loading || selected.length === 0
                  ? 'var(--color-text-muted)' : '#fff',
                border: 'none', borderRadius: '12px',
                cursor: loading || selected.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '15px', fontWeight: '500',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  KI analysiert {selected.length} Zutaten...
                </>
              ) : (
                <>
                  <ChefHat size={18} />
                  {selected.length === 0
                    ? 'Zutaten hinzufügen'
                    : 'Was kann ich kochen? (' + selected.length + ' Zutaten)'
                  }
                </>
              )}
            </button>

            {recipes.length === 0 && (
              <p style={{
                textAlign: 'center', fontSize: '12px',
                color: 'var(--color-text-muted)', marginTop: '10px'
              }}>
                Füge zuerst Rezepte hinzu damit der Check funktioniert.
              </p>
            )}
          </>
        ) : (
          <>
            {/* Ergebnisse */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: '14px'
            }}>
              <div>
                <div style={{
                  fontSize: '15px', fontWeight: '600', color: 'var(--color-text)'
                }}>
                  {results.length > 0
                    ? results.length + ' Rezepte gefunden'
                    : 'Keine passenden Rezepte'
                  }
                </div>
                <div style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px'}}>
                  Basierend auf: {selected.join(', ')}
                </div>
              </div>
              <button
                onClick={handleReset}
                style={{
                  padding: '7px 12px',
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '9px', cursor: 'pointer',
                  fontSize: '12px', color: 'var(--color-text-muted)'
                }}
              >
                Neu prüfen
              </button>
            </div>

            {results.length === 0 ? (
              <div style={{textAlign: 'center', padding: '40px 24px'}}>
                <div style={{fontSize: '48px', marginBottom: '12px'}}>🤔</div>
                <p style={{
                  fontWeight: '500', fontSize: '15px',
                  color: 'var(--color-text)', marginBottom: '6px'
                }}>
                  Noch zu wenig im Kühlschrank
                </p>
                <p style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>
                  Füge mehr Zutaten hinzu oder schau in die Einkaufsliste.
                </p>
              </div>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {results.map((result, idx) => {
                  const config = MATCH_CONFIG[result.match] || MATCH_CONFIG.halb
                  const recipe = result.recipe
                  if (!recipe) return null

                  return (
                    <div
                      key={idx}
                      onClick={() => navigate('/recipes/' + recipe.id)}
                      style={{
                        background: 'var(--color-surface)',
                        border: '0.5px solid ' + config.border,
                        borderRadius: '14px', overflow: 'hidden',
                        cursor: 'pointer', transition: 'opacity 0.15s'
                      }}
                    >
                      {/* Match Badge */}
                      <div style={{
                        padding: '7px 12px',
                        background: config.bg,
                        borderBottom: '0.5px solid ' + config.border,
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{
                          fontSize: '11px', fontWeight: '600',
                          color: config.color,
                          display: 'flex', alignItems: 'center', gap: '5px'
                        }}>
                          {result.match === 'voll' && '✓ '}
                          {result.match === 'fast' && '~ '}
                          {result.match === 'halb' && '◑ '}
                          {config.label}
                        </span>
                        {result.missing?.length > 0 && (
                          <span style={{fontSize: '11px', color: config.color, opacity: 0.8}}>
                            Fehlt: {result.missing.slice(0, 2).join(', ')}
                            {result.missing.length > 2 ? ' +' + (result.missing.length - 2) : ''}
                          </span>
                        )}
                      </div>

                      {/* Rezept Info */}
                      <div style={{
                        display: 'flex', gap: '12px', padding: '12px'
                      }}>
                        {/* Bild */}
                        <div style={{
                          width: '60px', height: '60px', borderRadius: '10px',
                          background: 'var(--color-surface-2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '26px', flexShrink: 0, overflow: 'hidden'
                        }}>
                          {recipe.image_url
                            ? <img src={recipe.image_url}
                                style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                            : '🍳'
                          }
                        </div>

                        <div style={{flex: 1, minWidth: 0}}>
                          <div style={{
                            fontSize: '15px', fontWeight: '500',
                            color: 'var(--color-text)', marginBottom: '3px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {recipe.name}
                          </div>

                          {/* Meta */}
                          <div style={{
                            display: 'flex', gap: '8px', marginBottom: '5px',
                            flexWrap: 'wrap'
                          }}>
                            {recipe.category && (
                              <span style={{fontSize: '11px', color: 'var(--color-text-muted)'}}>
                                {recipe.category}
                              </span>
                            )}
                            {(recipe.prep_time || recipe.cook_time) && (
                              <span style={{
                                fontSize: '11px', color: 'var(--color-text-muted)',
                                display: 'flex', alignItems: 'center', gap: '3px'
                              }}>
                                <Clock size={10} />
                                {(recipe.prep_time || 0) + (recipe.cook_time || 0)} Min
                              </span>
                            )}
                            {recipe.rating && (
                              <span style={{
                                fontSize: '11px', color: '#f59e0b',
                                display: 'flex', alignItems: 'center', gap: '2px'
                              }}>
                                <Star size={10} fill="#f59e0b" />
                                {recipe.rating}
                              </span>
                            )}
                          </div>

                          {/* KI Kommentar */}
                          {result.comment && (
                            <div style={{
                              fontSize: '12px', color: config.color,
                              fontStyle: 'italic', lineHeight: '1.4'
                            }}>
                              {result.comment}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Einkaufsliste Tipp */}
                {results.some(r => r.missing?.length > 0) && (
                  <div style={{
                    padding: '12px 14px',
                    background: 'var(--color-surface)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '12px',
                    fontSize: '13px', color: 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center', gap: '10px'
                  }}>
                    <span style={{fontSize: '20px'}}>💡</span>
                    <span>
                      Fehlende Zutaten einfach manuell zur Einkaufsliste hinzufügen.
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
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