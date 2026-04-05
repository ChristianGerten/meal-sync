import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'
import { toast } from '../components/Toast'
import {
  ChevronLeft, Heart, Star, Edit2, Save, X, Plus, Trash2,
  Clock, ChefHat, Users, Minus
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['Pasta', 'Suppe', 'Salat', 'Fleisch', 'Fisch', 'Vegetarisch', 'Vegan', 'Backen', 'Dessert', 'Frühstück', 'Sonstiges']
const DIFFICULTIES = ['Einfach', 'Mittel', 'Anspruchsvoll']
const INGREDIENT_CATS = ['Gemüse', 'Obst', 'Fleisch', 'Fisch', 'Kühlregal', 'Milchprodukte', 'Nudeln', 'Reis & Getreide', 'Konserven', 'Gewürze', 'Backen', 'Sonstiges']
const UNITS = ['g', 'kg', 'ml', 'l', 'Stück', 'EL', 'TL', 'Prise', 'Bund', 'Packung', 'Dose', 'Flasche', 'Zehe', 'Scheibe']

const DIFFICULTY_COLORS = {
  'Einfach': { bg: '#EAF3DE', text: '#27500A' },
  'Mittel': { bg: '#FAEEDA', text: '#633806' },
  'Anspruchsvoll': { bg: '#FCEBEB', text: '#A32D2D' }
}

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const household = useAuthStore(s => s.household)
  const { recipes, fetchRecipeDetails, updateRecipe, deleteRecipe, toggleFavorite, uploadImage } = useRecipeStore()
  const user = useAuthStore(s => s.user)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState(null)
  const [servings, setServings] = useState(null)

  const recipe = recipes.find(r => r.id === id)

  useEffect(() => {
    if (id) fetchRecipeDetails(id)
  }, [id])

  useEffect(() => {
    if (recipe) {
      setServings(recipe.servings || 2)
    }
  }, [recipe?.id])

  const startEdit = () => {
    setForm({
      name: recipe.name || '',
      description: recipe.description || '',
      category: recipe.category || '',
      servings: recipe.servings || 2,
      prep_time: recipe.prep_time || '',
      cook_time: recipe.cook_time || '',
      difficulty: recipe.difficulty || '',
      source_url: recipe.source_url || '',
      tags: recipe.tags || [],
      ingredients: recipe.ingredients?.map(i => ({ ...i })) || [],
      steps: recipe.recipe_steps?.map(s => s.description) || []
    })
    setEditing(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name fehlt'); return }
    setSaving(true)
    try {
      await updateRecipe(id, {
        ...form,
        prep_time: form.prep_time ? parseInt(form.prep_time) : null,
        cook_time: form.cook_time ? parseInt(form.cook_time) : null,
        recipe_steps: form.steps.filter(s => s.trim()).map((s, i) => ({
          step_number: i + 1, description: s
        }))
      }, household.id)
      setEditing(false)
      setForm(null)
    } finally { setSaving(false) }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, user.id)
      await supabase.from('recipes').update({ image_url: url }).eq('id', id)
      await fetchRecipeDetails(id)
      toast.success('Bild hochgeladen')
    } catch { toast.error('Upload fehlgeschlagen') }
    finally { setUploading(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm('Rezept wirklich löschen?')) return
    await deleteRecipe(id, household.id)
    navigate('/recipes')
  }

  // Portionsrechner — skaliert Mengen
  const scaleAmount = (amount) => {
    if (!amount || !recipe?.servings) return amount
    const factor = servings / recipe.servings
    const scaled = amount * factor
    return scaled % 1 === 0 ? scaled : Math.round(scaled * 10) / 10
  }

  if (!recipe) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', color: 'var(--color-text-muted)', fontSize: '14px'
    }}>
      Lädt...
    </div>
  )

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)

  return (
    <div style={{paddingBottom: '80px'}}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-bg)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '0.5px solid var(--color-border)'
      }}>
        <button onClick={() => navigate('/recipes')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '4px',
          color: 'var(--color-accent)', fontSize: '14px'
        }}>
          <ChevronLeft size={18} /> Rezepte
        </button>
        <div style={{display: 'flex', gap: '8px'}}>
          {!editing ? (
            <>
              <button onClick={() => toggleFavorite(id, household.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: recipe.is_favorite ? '#c1522a' : 'var(--color-text-muted)'
              }}>
                <Heart size={20} fill={recipe.is_favorite ? '#c1522a' : 'none'} />
              </button>
              <button onClick={startEdit} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)'
              }}>
                <Edit2 size={18} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setEditing(false); setForm(null) }} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)'
              }}>
                <X size={20} />
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                padding: '7px 14px', background: 'var(--color-accent)', color: '#fff',
                border: 'none', borderRadius: '9px', cursor: 'pointer',
                fontSize: '13px', fontWeight: '500',
                display: 'flex', alignItems: 'center', gap: '5px'
              }}>
                <Save size={14} /> {saving ? 'Speichert...' : 'Speichern'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bild */}
      <div style={{
        aspectRatio: '16/9', background: 'var(--color-surface-2)',
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.name}
            style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        ) : (
          <span style={{fontSize: '48px', opacity: 0.3}}>🍽️</span>
        )}
        <label style={{
          position: 'absolute', bottom: '10px', right: '10px',
          background: 'rgba(0,0,0,0.5)', color: '#fff',
          padding: '6px 12px', borderRadius: '20px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontSize: '12px', fontWeight: '500'
        }}>
          {uploading ? 'Lädt...' : '📷 Foto'}
          <input type="file" accept="image/*" onChange={handleImageUpload}
            style={{display: 'none'}} disabled={uploading} />
        </label>
      </div>

      <div style={{padding: '16px'}}>

        {!editing ? (
          <>
            {/* Titel & Meta */}
            <h1 style={{
              fontSize: '22px', fontWeight: '600',
              color: 'var(--color-text)', letterSpacing: '-0.3px',
              marginBottom: '8px'
            }}>
              {recipe.name}
            </h1>

            {/* Badges */}
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px'}}>
              {recipe.difficulty && (
                <span style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '500',
                  background: DIFFICULTY_COLORS[recipe.difficulty]?.bg,
                  color: DIFFICULTY_COLORS[recipe.difficulty]?.text
                }}>
                  {recipe.difficulty}
                </span>
              )}
              {recipe.category && (
                <span style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                  background: 'var(--color-surface-2)', color: 'var(--color-text-muted)'
                }}>
                  {recipe.category}
                </span>
              )}
              {recipe.rating && (
                <span style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                  background: 'var(--color-accent-soft)', color: 'var(--color-accent-text)',
                  display: 'flex', alignItems: 'center', gap: '3px'
                }}>
                  <Star size={10} fill="currentColor" /> {recipe.rating}
                </span>
              )}
            </div>

            {/* Zeit & Portionen Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: recipe.prep_time || recipe.cook_time
                ? 'repeat(3, 1fr)'
                : '1fr',
              gap: '8px', marginBottom: '16px'
            }}>
              {recipe.prep_time && (
                <div style={{
                  background: 'var(--color-surface-2)',
                  borderRadius: '10px', padding: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '3px'}}>
                    Vorbereitung
                  </div>
                  <div style={{fontSize: '15px', fontWeight: '600', color: 'var(--color-text)'}}>
                    {recipe.prep_time} Min
                  </div>
                </div>
              )}
              {recipe.cook_time && (
                <div style={{
                  background: 'var(--color-surface-2)',
                  borderRadius: '10px', padding: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '3px'}}>
                    Kochzeit
                  </div>
                  <div style={{fontSize: '15px', fontWeight: '600', color: 'var(--color-text)'}}>
                    {recipe.cook_time} Min
                  </div>
                </div>
              )}
              {totalTime > 0 && (
                <div style={{
                  background: 'var(--color-accent-soft)',
                  borderRadius: '10px', padding: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{fontSize: '10px', color: 'var(--color-accent-text)', marginBottom: '3px', opacity: 0.7}}>
                    Gesamt
                  </div>
                  <div style={{fontSize: '15px', fontWeight: '600', color: 'var(--color-accent-text)'}}>
                    {totalTime} Min
                  </div>
                </div>
              )}
            </div>

            {/* Portionsrechner */}
            {recipe.ingredients?.length > 0 && (
              <div style={{
                background: 'var(--color-surface)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '14px', padding: '12px 14px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '13px', color: 'var(--color-text-muted)'
                  }}>
                    <Users size={14} /> Portionen
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <button
                      onClick={() => setServings(s => Math.max(1, s - 1))}
                      style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: 'var(--color-surface-2)',
                        border: '0.5px solid var(--color-border)',
                        cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-text)'
                      }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{
                      fontSize: '16px', fontWeight: '600',
                      color: 'var(--color-text)', minWidth: '20px',
                      textAlign: 'center'
                    }}>
                      {servings}
                    </span>
                    <button
                      onClick={() => setServings(s => s + 1)}
                      style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: 'var(--color-surface-2)',
                        border: '0.5px solid var(--color-border)',
                        cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-text)'
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                {servings !== recipe.servings && (
                  <div style={{
                    marginTop: '8px', fontSize: '11px',
                    color: 'var(--color-accent)', textAlign: 'right'
                  }}>
                    Original: {recipe.servings} Portionen — Mengen angepasst
                  </div>
                )}
              </div>
            )}

            {/* Beschreibung */}
            {recipe.description && (
              <p style={{
                fontSize: '14px', color: 'var(--color-text-muted)',
                lineHeight: '1.6', marginBottom: '20px'
              }}>
                {recipe.description}
              </p>
            )}

            {/* Zutaten */}
            {recipe.ingredients?.length > 0 && (
              <div style={{marginBottom: '20px'}}>
                <h2 style={{
                  fontSize: '16px', fontWeight: '600',
                  color: 'var(--color-text)', marginBottom: '10px'
                }}>
                  Zutaten
                </h2>
                <div style={{
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '12px', overflow: 'hidden'
                }}>
                  {recipe.ingredients.map((ing, i) => (
                    <div key={ing.id || i} style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 14px',
                      borderTop: i > 0 ? '0.5px solid var(--color-border)' : 'none'
                    }}>
                      <span style={{fontSize: '14px', color: 'var(--color-text)'}}>
                        {ing.name}
                      </span>
                      {(ing.amount || ing.unit) && (
                        <span style={{
                          fontSize: '13px', fontWeight: '500',
                          color: servings !== recipe.servings
                            ? 'var(--color-accent)'
                            : 'var(--color-text-muted)',
                          transition: 'color 0.2s'
                        }}>
                          {scaleAmount(ing.amount)
                            ? scaleAmount(ing.amount) + ' '
                            : ''
                          }{ing.unit || ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schritte */}
            {recipe.recipe_steps?.length > 0 && (
              <div style={{marginBottom: '20px'}}>
                <h2 style={{
                  fontSize: '16px', fontWeight: '600',
                  color: 'var(--color-text)', marginBottom: '10px'
                }}>
                  Zubereitung
                </h2>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {recipe.recipe_steps
                    .sort((a, b) => a.step_number - b.step_number)
                    .map((step, i) => (
                      <div key={step.id || i} style={{
                        display: 'flex', gap: '12px', alignItems: 'flex-start',
                        padding: '12px 14px',
                        background: 'var(--color-surface)',
                        border: '0.5px solid var(--color-border)',
                        borderRadius: '12px'
                      }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: 'var(--color-accent)', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: '600', flexShrink: 0
                        }}>
                          {i + 1}
                        </div>
                        <p style={{
                          fontSize: '14px', color: 'var(--color-text)',
                          lineHeight: '1.6', margin: 0, flex: 1
                        }}>
                          {step.description}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Kochen Button */}
            <button
              onClick={() => navigate('/cook/' + id)}
              style={{
                width: '100%', padding: '14px',
                background: 'var(--color-accent)', color: '#fff',
                border: 'none', borderRadius: '12px', cursor: 'pointer',
                fontSize: '15px', fontWeight: '500',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px',
                marginBottom: '12px'
              }}
            >
              <ChefHat size={18} /> Jetzt kochen
            </button>

            {/* Löschen */}
            <button onClick={handleDelete} style={{
              width: '100%', padding: '12px',
              background: 'none',
              border: '0.5px solid var(--color-border)',
              borderRadius: '12px', cursor: 'pointer',
              fontSize: '13px', color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px'
            }}>
              <Trash2 size={14} /> Rezept löschen
            </button>
          </>
        ) : (
          /* Edit-Modus */
          <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>

            {/* Name */}
            <div>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: '500',
                color: 'var(--color-text-muted)', marginBottom: '5px',
                textTransform: 'uppercase', letterSpacing: '0.4px'
              }}>
                Name *
              </label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{
                  width: '100%', padding: '11px 13px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '10px', fontSize: '14px',
                  color: 'var(--color-text)', outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Kategorie + Schwierigkeit */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
              <div>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: '500',
                  color: 'var(--color-text-muted)', marginBottom: '5px',
                  textTransform: 'uppercase', letterSpacing: '0.4px'
                }}>
                  Kategorie
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{
                    width: '100%', padding: '11px 10px',
                    background: 'var(--color-surface-2)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '10px', fontSize: '13px',
                    color: 'var(--color-text)', outline: 'none'
                  }}
                >
                  <option value="">Wählen...</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: '500',
                  color: 'var(--color-text-muted)', marginBottom: '5px',
                  textTransform: 'uppercase', letterSpacing: '0.4px'
                }}>
                  Schwierigkeit
                </label>
                <select
                  value={form.difficulty}
                  onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                  style={{
                    width: '100%', padding: '11px 10px',
                    background: 'var(--color-surface-2)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '10px', fontSize: '13px',
                    color: 'var(--color-text)', outline: 'none'
                  }}
                >
                  <option value="">Wählen...</option>
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Zeiten + Portionen */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px'}}>
              <div>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: '500',
                  color: 'var(--color-text-muted)', marginBottom: '5px',
                  textTransform: 'uppercase', letterSpacing: '0.4px'
                }}>
                  Vorbereitung (Min)
                </label>
                <input
                  type="number" min="0"
                  value={form.prep_time}
                  onChange={e => setForm(f => ({ ...f, prep_time: e.target.value }))}
                  placeholder="0"
                  style={{
                    width: '100%', padding: '11px 10px',
                    background: 'var(--color-surface-2)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '10px', fontSize: '13px',
                    color: 'var(--color-text)', outline: 'none',
                    boxSizing: 'border-box', textAlign: 'center'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: '500',
                  color: 'var(--color-text-muted)', marginBottom: '5px',
                  textTransform: 'uppercase', letterSpacing: '0.4px'
                }}>
                  Kochzeit (Min)
                </label>
                <input
                  type="number" min="0"
                  value={form.cook_time}
                  onChange={e => setForm(f => ({ ...f, cook_time: e.target.value }))}
                  placeholder="0"
                  style={{
                    width: '100%', padding: '11px 10px',
                    background: 'var(--color-surface-2)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '10px', fontSize: '13px',
                    color: 'var(--color-text)', outline: 'none',
                    boxSizing: 'border-box', textAlign: 'center'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: '500',
                  color: 'var(--color-text-muted)', marginBottom: '5px',
                  textTransform: 'uppercase', letterSpacing: '0.4px'
                }}>
                  Portionen
                </label>
                <input
                  type="number" min="1"
                  value={form.servings}
                  onChange={e => setForm(f => ({ ...f, servings: parseInt(e.target.value) || 2 }))}
                  style={{
                    width: '100%', padding: '11px 10px',
                    background: 'var(--color-surface-2)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '10px', fontSize: '13px',
                    color: 'var(--color-text)', outline: 'none',
                    boxSizing: 'border-box', textAlign: 'center'
                  }}
                />
              </div>
            </div>

            {/* Beschreibung */}
            <div>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: '500',
                color: 'var(--color-text-muted)', marginBottom: '5px',
                textTransform: 'uppercase', letterSpacing: '0.4px'
              }}>
                Beschreibung
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                style={{
                  width: '100%', padding: '11px 13px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '10px', fontSize: '14px',
                  color: 'var(--color-text)', outline: 'none',
                  resize: 'none', boxSizing: 'border-box', lineHeight: '1.5'
                }}
              />
            </div>

            {/* Zutaten */}
            <div>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: '500',
                color: 'var(--color-text-muted)', marginBottom: '8px',
                textTransform: 'uppercase', letterSpacing: '0.4px'
              }}>
                Zutaten
              </label>
              <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                {form.ingredients.map((ing, i) => (
                  <div key={i} style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                    <input
                      value={ing.name}
                      onChange={e => {
                        const updated = [...form.ingredients]
                        updated[i] = { ...updated[i], name: e.target.value }
                        setForm(f => ({ ...f, ingredients: updated }))
                      }}
                      placeholder="Zutat"
                      style={{
                        flex: 2, padding: '9px 10px',
                        background: 'var(--color-surface-2)',
                        border: '0.5px solid var(--color-border)',
                        borderRadius: '9px', fontSize: '13px',
                        color: 'var(--color-text)', outline: 'none'
                      }}
                    />
                    <input
                      value={ing.amount || ''}
                      onChange={e => {
                        const updated = [...form.ingredients]
                        updated[i] = { ...updated[i], amount: e.target.value }
                        setForm(f => ({ ...f, ingredients: updated }))
                      }}
                      placeholder="Menge"
                      type="number" min="0"
                      style={{
                        width: '60px', padding: '9px 6px',
                        background: 'var(--color-surface-2)',
                        border: '0.5px solid var(--color-border)',
                        borderRadius: '9px', fontSize: '13px',
                        color: 'var(--color-text)', outline: 'none',
                        textAlign: 'center', flexShrink: 0
                      }}
                    />
                    <select
                      value={ing.unit || ''}
                      onChange={e => {
                        const updated = [...form.ingredients]
                        updated[i] = { ...updated[i], unit: e.target.value }
                        setForm(f => ({ ...f, ingredients: updated }))
                      }}
                      style={{
                        width: '62px', padding: '9px 4px',
                        background: 'var(--color-surface-2)',
                        border: '0.5px solid var(--color-border)',
                        borderRadius: '9px', fontSize: '12px',
                        color: 'var(--color-text)', outline: 'none',
                        flexShrink: 0
                      }}
                    >
                      <option value="">—</option>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                    <button
                      onClick={() => setForm(f => ({
                        ...f,
                        ingredients: f.ingredients.filter((_, j) => j !== i)
                      }))}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text-muted)', flexShrink: 0, padding: '4px'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setForm(f => ({
                    ...f,
                    ingredients: [...f.ingredients, { name: '', amount: '', unit: '' }]
                  }))}
                  style={{
                    padding: '9px', background: 'none',
                    border: '0.5px dashed var(--color-border)',
                    borderRadius: '9px', cursor: 'pointer',
                    fontSize: '13px', color: 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '5px'
                  }}
                >
                  <Plus size={13} /> Zutat hinzufügen
                </button>
              </div>
            </div>

            {/* Schritte */}
            <div>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: '500',
                color: 'var(--color-text-muted)', marginBottom: '8px',
                textTransform: 'uppercase', letterSpacing: '0.4px'
              }}>
                Zubereitung
              </label>
              <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                {form.steps.map((step, i) => (
                  <div key={i} style={{display: 'flex', gap: '8px', alignItems: 'flex-start'}}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: 'var(--color-accent)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: '600', flexShrink: 0, marginTop: '9px'
                    }}>
                      {i + 1}
                    </div>
                    <textarea
                      value={step}
                      onChange={e => {
                        const updated = [...form.steps]
                        updated[i] = e.target.value
                        setForm(f => ({ ...f, steps: updated }))
                      }}
                      rows={2}
                      style={{
                        flex: 1, padding: '9px 10px',
                        background: 'var(--color-surface-2)',
                        border: '0.5px solid var(--color-border)',
                        borderRadius: '9px', fontSize: '13px',
                        color: 'var(--color-text)', outline: 'none',
                        resize: 'none', lineHeight: '1.5'
                      }}
                    />
                    <button
                      onClick={() => setForm(f => ({
                        ...f, steps: f.steps.filter((_, j) => j !== i)
                      }))}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text-muted)', flexShrink: 0,
                        padding: '4px', marginTop: '7px'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setForm(f => ({ ...f, steps: [...f.steps, ''] }))}
                  style={{
                    padding: '9px', background: 'none',
                    border: '0.5px dashed var(--color-border)',
                    borderRadius: '9px', cursor: 'pointer',
                    fontSize: '13px', color: 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '5px'
                  }}
                >
                  <Plus size={13} /> Schritt hinzufügen
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}