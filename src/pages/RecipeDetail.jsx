import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import {
  ArrowLeft, Heart, Star, Clock, ChefHat,
  Users, Edit2, Trash2, Check, X, Plus, Minus
} from 'lucide-react'

const CATEGORIES = [
  'Pasta', 'Suppe', 'Salat', 'Fleisch', 'Fisch',
  'Vegetarisch', 'Vegan', 'Backen', 'Dessert', 'Frühstück', 'Sonstiges'
]

const DIFFICULTIES = ['Einfach', 'Mittel', 'Anspruchsvoll']

const DIFFICULTY_COLORS = {
  'Einfach': { bg: '#f0fdf4', text: '#166534' },
  'Mittel': { bg: '#fef3c7', text: '#92400e' },
  'Anspruchsvoll': { bg: '#fef2f2', text: '#991b1b' },
}

const INGREDIENT_CATEGORIES = [
  'Gemüse', 'Obst', 'Fleisch', 'Fisch', 'Kühlregal',
  'Milchprodukte', 'Nudeln', 'Reis & Getreide',
  'Konserven', 'Gewürze', 'Backen', 'Sonstiges'
]

function StarRating({ rating, onRate }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{display: 'flex', gap: '2px'}}>
      {[1,2,3,4,5].map(star => (
        <button
          key={star}
          onClick={() => onRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '3px',
            color: star <= (hover || rating || 0) ? '#c1522a' : 'var(--color-border)',
          }}
        >
          <Star
            size={18}
            fill={star <= (hover || rating || 0) ? '#c1522a' : 'none'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  )
}

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const household = useAuthStore(s => s.household)
  const { recipes, fetchRecipeDetails, updateRecipe, deleteRecipe, toggleFavorite, setRating } = useRecipeStore()

  const [editing, setEditing] = useState(id === 'new')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Portionsrechner
  const [servingsOverride, setServingsOverride] = useState(null)

  const recipe = id === 'new' ? null : recipes.find(r => r.id === id)

  const [form, setForm] = useState({
    name: '', description: '', category: '', tags: [],
    servings: 2, prep_time: null, cook_time: null, difficulty: '',
    source_url: '', image_url: '',
    ingredients: [{ name: '', amount: '', unit: '', category: 'Sonstiges' }],
    steps: ['']
  })

  useEffect(() => {
    if (id !== 'new' && recipe && !recipe.ingredients) {
      fetchRecipeDetails(id)
    }
    if (recipe) {
      setForm({
        name: recipe.name || '',
        description: recipe.description || '',
        category: recipe.category || '',
        tags: recipe.tags || [],
        servings: recipe.servings || 2,
        prep_time: recipe.prep_time || null,
        cook_time: recipe.cook_time || null,
        difficulty: recipe.difficulty || '',
        source_url: recipe.source_url || '',
        image_url: recipe.image_url || '',
        ingredients: recipe.ingredients?.length
          ? recipe.ingredients
          : [{ name: '', amount: '', unit: '', category: 'Sonstiges' }],
        steps: recipe.recipe_steps?.length
          ? recipe.recipe_steps.map(s => s.description)
          : recipe.steps?.length
            ? recipe.steps
            : ['']
      })
      setServingsOverride(recipe.servings || 2)
    }
  }, [recipe?.id, recipe?.ingredients])

  useEffect(() => {
    if (!recipe && id !== 'new') {
      fetchRecipeDetails(id)
    }
  }, [id])

  const scaleFactor = servingsOverride && form.servings
    ? servingsOverride / form.servings
    : 1

  const formatAmount = (amount) => {
    if (!amount) return ''
    const scaled = Number(amount) * scaleFactor
    return scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = household.id + '/' + Date.now() + '.' + ext
      const { error } = await supabase.storage
        .from('recipe-images')
        .upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(path)
      setForm(f => ({ ...f, image_url: publicUrl }))
      toast.success('Bild hochgeladen')
    } catch (err) {
      toast.error('Upload fehlgeschlagen: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name fehlt'); return }
    setSaving(true)
    try {
      const recipeData = {
        ...form,
        tags: typeof form.tags === 'string'
          ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
          : form.tags,
        ingredients: form.ingredients.filter(i => i.name?.trim()),
        steps: form.steps.filter(s => s?.trim())
      }
      if (id === 'new') {
        const newRecipe = await useRecipeStore.getState().addRecipe(recipeData, household.id)
        navigate('/recipes/' + newRecipe.id, { replace: true })
      } else {
        await updateRecipe(id, recipeData, household.id)
        setEditing(false)
      }
    } catch (err) {
      toast.error('Fehler: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Rezept wirklich löschen?')) return
    setDeleting(true)
    await deleteRecipe(id, household.id)
    navigate('/recipes', { replace: true })
  }

  if (!recipe && id !== 'new') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vh', color: 'var(--color-text-muted)'
      }}>
        Lädt...
      </div>
    )
  }

  // ANSICHT
  if (!editing && recipe) {
    const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)
    return (
      <div style={{paddingBottom: '100px'}}>

        {/* Header Bild */}
        <div style={{
          position: 'relative', height: '240px',
          background: 'var(--color-surface-2)',
          overflow: 'hidden'
        }}>
          {recipe.image_url ? (
            <img src={recipe.image_url} alt={recipe.name}
              style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '64px', opacity: 0.3
            }}>🍽️</div>
          )}

          {/* Zurück */}
          <button onClick={() => navigate(-1)} style={{
            position: 'absolute', top: '16px', left: '16px',
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.4)', border: 'none',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#fff'
          }}>
            <ArrowLeft size={18} />
          </button>

          {/* Aktionen */}
          <div style={{
            position: 'absolute', top: '16px', right: '16px',
            display: 'flex', gap: '8px'
          }}>
            <button onClick={() => toggleFavorite(id, household.id)} style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(0,0,0,0.4)', border: 'none',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Heart
                size={16}
                color={recipe.is_favorite ? '#c1522a' : '#fff'}
                fill={recipe.is_favorite ? '#c1522a' : 'none'}
              />
            </button>
            <button onClick={() => setEditing(true)} style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(0,0,0,0.4)', border: 'none',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Edit2 size={16} color="#fff" />
            </button>
          </div>
        </div>

        <div style={{padding: '16px'}}>

          {/* Name + Meta */}
          <h1 style={{
            fontSize: '22px', fontWeight: '600',
            color: 'var(--color-text)', letterSpacing: '-0.3px',
            marginBottom: '8px'
          }}>
            {recipe.name}
          </h1>

          {/* Zeit + Schwierigkeit + Portionen */}
          <div style={{
            display: 'flex', gap: '8px', flexWrap: 'wrap',
            marginBottom: '12px'
          }}>
            {totalTime > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px',
                background: 'var(--color-surface-2)',
                borderRadius: '20px', fontSize: '12px',
                color: 'var(--color-text-muted)'
              }}>
                <Clock size={12} />
                {totalTime} Min
                {recipe.prep_time && recipe.cook_time && (
                  <span style={{fontSize: '10px'}}>
                    ({recipe.prep_time}+{recipe.cook_time})
                  </span>
                )}
              </div>
            )}
            {recipe.difficulty && (
              <div style={{
                padding: '4px 10px',
                background: DIFFICULTY_COLORS[recipe.difficulty]?.bg || 'var(--color-surface-2)',
                borderRadius: '20px', fontSize: '12px',
                color: DIFFICULTY_COLORS[recipe.difficulty]?.text || 'var(--color-text-muted)',
                fontWeight: '500'
              }}>
                {recipe.difficulty}
              </div>
            )}
            {recipe.category && (
              <div style={{
                padding: '4px 10px',
                background: 'var(--color-surface-2)',
                borderRadius: '20px', fontSize: '12px',
                color: 'var(--color-text-muted)'
              }}>
                {recipe.category}
              </div>
            )}
          </div>

          {/* Bewertung */}
          <div style={{marginBottom: '16px'}}>
            <StarRating
              rating={recipe.rating}
              onRate={star => setRating(id, star, household.id)}
            />
          </div>

          {recipe.description && (
            <p style={{
              fontSize: '14px', color: 'var(--color-text-muted)',
              lineHeight: '1.6', marginBottom: '20px'
            }}>
              {recipe.description}
            </p>
          )}

          {/* Portionsrechner */}
          {recipe.ingredients?.length > 0 && (
            <div style={{
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '14px', overflow: 'hidden',
              marginBottom: '16px'
            }}>
              <div style={{
                padding: '11px 14px',
                borderBottom: '0.5px solid var(--color-border)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{
                  fontSize: '11px', fontWeight: '500',
                  color: 'var(--color-text)',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                  <Users size={12} /> Zutaten
                </span>

                {/* Portionen Schieberegler */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <button
                    onClick={() => setServingsOverride(s => Math.max(1, (s || form.servings) - 1))}
                    style={{
                      width: '24px', height: '24px', borderRadius: '6px',
                      background: 'var(--color-surface-2)',
                      border: '0.5px solid var(--color-border)',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-text)'
                    }}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{
                    fontSize: '13px', fontWeight: '600',
                    color: 'var(--color-text)', minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {servingsOverride || form.servings} Portionen
                  </span>
                  <button
                    onClick={() => setServingsOverride(s => (s || form.servings) + 1)}
                    style={{
                      width: '24px', height: '24px', borderRadius: '6px',
                      background: 'var(--color-surface-2)',
                      border: '0.5px solid var(--color-border)',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-text)'
                    }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {recipe.ingredients.map((ing, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderTop: i > 0 ? '0.5px solid var(--color-border)' : 'none'
                }}>
                  <span style={{fontSize: '14px', color: 'var(--color-text)'}}>
                    {ing.name}
                  </span>
                  {(ing.amount || ing.unit) && (
                    <span style={{
                      fontSize: '13px', fontWeight: '500',
                      color: scaleFactor !== 1 ? 'var(--color-accent)' : 'var(--color-text-muted)'
                    }}>
                      {formatAmount(ing.amount)}{ing.unit ? ' ' + ing.unit : ''}
                    </span>
                  )}
                </div>
              ))}

              {scaleFactor !== 1 && (
                <div style={{
                  padding: '8px 14px',
                  borderTop: '0.5px solid var(--color-border)',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{fontSize: '11px', color: 'var(--color-text-muted)'}}>
                    Original: {form.servings} Portionen
                  </span>
                  <button
                    onClick={() => setServingsOverride(form.servings)}
                    style={{
                      fontSize: '11px', color: 'var(--color-accent)',
                      background: 'none', border: 'none', cursor: 'pointer'
                    }}
                  >
                    Zurücksetzen
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Zubereitung */}
          {recipe.recipe_steps?.length > 0 && (
            <div style={{marginBottom: '20px'}}>
              <div style={{
                fontSize: '11px', fontWeight: '500',
                color: 'var(--color-text)',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                marginBottom: '10px',
                display: 'flex', alignItems: 'center', gap: '5px'
              }}>
                <ChefHat size={12} /> Zubereitung
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {recipe.recipe_steps.map((step, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start'
                  }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: 'var(--color-accent)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: '600', flexShrink: 0, marginTop: '1px'
                    }}>
                      {i + 1}
                    </div>
                    <p style={{
                      fontSize: '14px', color: 'var(--color-text)',
                      lineHeight: '1.6', margin: 0, flex: 1
                    }}>
                      {step.description || step}
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
              border: 'none', borderRadius: '12px',
              cursor: 'pointer', fontSize: '15px', fontWeight: '500',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px'
            }}
          >
            <ChefHat size={18} /> Jetzt kochen
          </button>

          {/* Löschen */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              width: '100%', marginTop: '10px', padding: '12px',
              background: 'none', color: 'var(--color-danger)',
              border: '0.5px solid var(--color-danger)',
              borderRadius: '12px', cursor: 'pointer',
              fontSize: '14px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <Trash2 size={15} />
            {deleting ? 'Wird gelöscht...' : 'Rezept löschen'}
          </button>
        </div>
      </div>
    )
  }

  // BEARBEITEN / NEU
  return (
    <div style={{paddingBottom: '100px'}}>
      <div style={{
        padding: '16px',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-bg)',
        borderBottom: '0.5px solid var(--color-border)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button onClick={() => id === 'new' ? navigate(-1) : setEditing(false)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '14px'
        }}>
          <X size={16} /> Abbrechen
        </button>
        <span style={{fontWeight: '600', fontSize: '15px', color: 'var(--color-text)'}}>
          {id === 'new' ? 'Neues Rezept' : 'Bearbeiten'}
        </span>
        <button onClick={handleSave} disabled={saving} style={{
          background: 'var(--color-accent)', color: '#fff',
          border: 'none', borderRadius: '9px',
          padding: '7px 14px', cursor: 'pointer',
          fontSize: '13px', fontWeight: '500',
          display: 'flex', alignItems: 'center', gap: '5px',
          opacity: saving ? 0.7 : 1
        }}>
          <Check size={14} />
          {saving ? 'Speichert...' : 'Speichern'}
        </button>
      </div>

      <div style={{padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px'}}>

        {/* Bild */}
        <label style={{
          display: 'block', aspectRatio: '16/9',
          background: form.image_url ? 'transparent' : 'var(--color-surface-2)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '14px', overflow: 'hidden',
          cursor: 'pointer', position: 'relative'
        }}>
          {form.image_url ? (
            <img src={form.image_url} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          ) : (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
              <span style={{fontSize: '32px', opacity: 0.3}}>📷</span>
              <span style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>
                {uploading ? 'Lädt hoch...' : 'Foto hinzufügen'}
              </span>
            </div>
          )}
          <input type="file" accept="image/*"
            onChange={handleImageUpload} style={{display: 'none'}} />
        </label>

        {/* Name */}
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Rezeptname *"
          style={{
            width: '100%', padding: '12px 14px',
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '10px', fontSize: '16px',
            fontWeight: '500', color: 'var(--color-text)',
            outline: 'none', boxSizing: 'border-box'
          }}
        />

        {/* Beschreibung */}
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Kurze Beschreibung..."
          rows={2}
          style={{
            width: '100%', padding: '11px 14px',
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '10px', fontSize: '14px',
            color: 'var(--color-text)', outline: 'none',
            resize: 'none', boxSizing: 'border-box', lineHeight: '1.5'
          }}
        />

        {/* Kategorie + Schwierigkeit */}
        <div style={{display: 'flex', gap: '8px'}}>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            style={{
              flex: 1, padding: '11px 10px',
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '10px', fontSize: '13px',
              color: form.category ? 'var(--color-text)' : 'var(--color-text-muted)',
              outline: 'none'
            }}
          >
            <option value="">Kategorie...</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select
            value={form.difficulty}
            onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
            style={{
              flex: 1, padding: '11px 10px',
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '10px', fontSize: '13px',
              color: form.difficulty ? 'var(--color-text)' : 'var(--color-text-muted)',
              outline: 'none'
            }}
          >
            <option value="">Schwierigkeit...</option>
            {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        {/* Zeiten + Portionen */}
        <div style={{display: 'flex', gap: '8px'}}>
          <div style={{flex: 1}}>
            <label style={{
              fontSize: '11px', color: 'var(--color-text-muted)',
              display: 'block', marginBottom: '4px'
            }}>
              Vorbereitungszeit (Min)
            </label>
            <input
              type="number" min="0"
              value={form.prep_time || ''}
              onChange={e => setForm(f => ({ ...f, prep_time: e.target.value ? parseInt(e.target.value) : null }))}
              placeholder="z.B. 15"
              style={{
                width: '100%', padding: '10px 12px',
                background: 'var(--color-surface)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '10px', fontSize: '13px',
                color: 'var(--color-text)', outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{flex: 1}}>
            <label style={{
              fontSize: '11px', color: 'var(--color-text-muted)',
              display: 'block', marginBottom: '4px'
            }}>
              Kochzeit (Min)
            </label>
            <input
              type="number" min="0"
              value={form.cook_time || ''}
              onChange={e => setForm(f => ({ ...f, cook_time: e.target.value ? parseInt(e.target.value) : null }))}
              placeholder="z.B. 30"
              style={{
                width: '100%', padding: '10px 12px',
                background: 'var(--color-surface)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '10px', fontSize: '13px',
                color: 'var(--color-text)', outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{flex: 1}}>
            <label style={{
              fontSize: '11px', color: 'var(--color-text-muted)',
              display: 'block', marginBottom: '4px'
            }}>
              Portionen
            </label>
            <input
              type="number" min="1"
              value={form.servings}
              onChange={e => setForm(f => ({ ...f, servings: parseInt(e.target.value) || 2 }))}
              style={{
                width: '100%', padding: '10px 12px',
                background: 'var(--color-surface)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '10px', fontSize: '13px',
                color: 'var(--color-text)', outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Tags */}
        <input
          value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags}
          onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
          placeholder="Tags (kommagetrennt: vegetarisch, schnell...)"
          style={{
            width: '100%', padding: '11px 14px',
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '10px', fontSize: '13px',
            color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box'
          }}
        />

        {/* Zutaten */}
        <div>
          <div style={{
            fontSize: '13px', fontWeight: '500',
            color: 'var(--color-text)', marginBottom: '8px'
          }}>
            Zutaten
          </div>
          {form.ingredients.map((ing, i) => (
            <div key={i} style={{
              display: 'flex', gap: '6px', marginBottom: '7px',
              alignItems: 'center'
            }}>
              <input
                value={ing.name}
                onChange={e => {
                  const ingredients = [...form.ingredients]
                  ingredients[i] = { ...ingredients[i], name: e.target.value }
                  setForm(f => ({ ...f, ingredients }))
                }}
                placeholder="Zutat"
                style={{
                  flex: 2, padding: '9px 10px',
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '8px', fontSize: '13px',
                  color: 'var(--color-text)', outline: 'none'
                }}
              />
              <input
                value={ing.amount || ''}
                onChange={e => {
                  const ingredients = [...form.ingredients]
                  ingredients[i] = { ...ingredients[i], amount: e.target.value }
                  setForm(f => ({ ...f, ingredients }))
                }}
                placeholder="Menge"
                type="number" min="0"
                style={{
                  width: '64px', padding: '9px 6px',
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '8px', fontSize: '13px',
                  color: 'var(--color-text)', outline: 'none',
                  textAlign: 'center'
                }}
              />
              <input
                value={ing.unit || ''}
                onChange={e => {
                  const ingredients = [...form.ingredients]
                  ingredients[i] = { ...ingredients[i], unit: e.target.value }
                  setForm(f => ({ ...f, ingredients }))
                }}
                placeholder="Einheit"
                style={{
                  width: '64px', padding: '9px 6px',
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '8px', fontSize: '13px',
                  color: 'var(--color-text)', outline: 'none'
                }}
              />
              <button
                onClick={() => setForm(f => ({
                  ...f,
                  ingredients: f.ingredients.filter((_, j) => j !== i)
                }))}
                style={{
                  width: '28px', height: '28px', flexShrink: 0,
                  background: 'none', border: '0.5px solid var(--color-border)',
                  borderRadius: '7px', cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setForm(f => ({
              ...f,
              ingredients: [...f.ingredients, { name: '', amount: '', unit: '', category: 'Sonstiges' }]
            }))}
            style={{
              width: '100%', padding: '9px',
              background: 'var(--color-surface)',
              border: '0.5px dashed var(--color-border)',
              borderRadius: '9px', cursor: 'pointer',
              fontSize: '13px', color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
            }}
          >
            <Plus size={13} /> Zutat hinzufügen
          </button>
        </div>

        {/* Schritte */}
        <div>
          <div style={{
            fontSize: '13px', fontWeight: '500',
            color: 'var(--color-text)', marginBottom: '8px'
          }}>
            Zubereitung
          </div>
          {form.steps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: '8px',
              marginBottom: '8px', alignItems: 'flex-start'
            }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: 'var(--color-accent)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: '600', flexShrink: 0, marginTop: '8px'
              }}>
                {i + 1}
              </div>
              <textarea
                value={step}
                onChange={e => {
                  const steps = [...form.steps]
                  steps[i] = e.target.value
                  setForm(f => ({ ...f, steps }))
                }}
                placeholder={'Schritt ' + (i + 1) + '...'}
                rows={2}
                style={{
                  flex: 1, padding: '9px 12px',
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '9px', fontSize: '13px',
                  color: 'var(--color-text)', outline: 'none',
                  resize: 'none', boxSizing: 'border-box', lineHeight: '1.5'
                }}
              />
              <button
                onClick={() => setForm(f => ({
                  ...f,
                  steps: f.steps.filter((_, j) => j !== i)
                }))}
                style={{
                  background: 'none', border: '0.5px solid var(--color-border)',
                  borderRadius: '7px', cursor: 'pointer',
                  width: '28px', height: '28px', marginTop: '6px',
                  color: 'var(--color-text-muted)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setForm(f => ({ ...f, steps: [...f.steps, ''] }))}
            style={{
              width: '100%', padding: '9px',
              background: 'var(--color-surface)',
              border: '0.5px dashed var(--color-border)',
              borderRadius: '9px', cursor: 'pointer',
              fontSize: '13px', color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
            }}
          >
            <Plus size={13} /> Schritt hinzufügen
          </button>
        </div>

      </div>
    </div>
  )
}