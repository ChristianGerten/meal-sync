import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, Plus, X, Camera, ChefHat, Edit2 } from 'lucide-react'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'
import { toast } from '../components/Toast'

const UNITS = ['g', 'kg', 'ml', 'l', 'EL', 'TL', 'Stück', 'Prise', 'Bund', 'Dose', 'Packung']

const CATEGORIES = [
  'Pasta', 'Suppe', 'Salat', 'Fleisch', 'Fisch', 'Vegetarisch',
  'Vegan', 'Backen', 'Dessert', 'Frühstück', 'Snack', 'Sonstiges'
]

const TAGS = [
  'schnell', 'einfach', 'vegetarisch', 'vegan', 'glutenfrei',
  'laktosefrei', 'scharf', 'klassiker', 'saisonal', 'meal-prep'
]

const CATEGORIES_ING = [
  'Gemüse', 'Obst', 'Fleisch', 'Fisch', 'Kühlregal',
  'Milchprodukte', 'Nudeln', 'Reis & Getreide',
  'Konserven', 'Gewürze', 'Backen', 'Sonstiges'
]

const emptyIngredient = () => ({ name: '', amount: '', unit: 'g', category: 'Sonstiges' })

const parseIngredientLine = (line) => {
  const clean = line.trim()
  if (!clean) return null
  const match = clean.match(/^([\d,.]+)?\s*([a-zA-ZäöüÄÖÜ]+)?\s+(.+)$/)
  if (match && match[3]) {
    const unitCandidate = match[2] || ''
    const isUnit = UNITS.includes(unitCandidate)
    return {
      amount: match[1] ? parseFloat(match[1].replace(',', '.')) : null,
      unit: isUnit ? unitCandidate : '',
      name: isUnit ? match[3].trim() : (unitCandidate + ' ' + match[3]).trim(),
      category: 'Sonstiges'
    }
  }
  return { name: clean, amount: null, unit: '', category: 'Sonstiges' }
}

function RecipeView({ recipe, onEdit, onDelete, onCook, navigate }) {
  const steps = [...(recipe.recipe_steps || [])].sort((a, b) => a.step_number - b.step_number)
  const sourceUrl = recipe.source_url || ''

  return (
    <div style={{paddingBottom: '80px'}}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-surface)',
        borderBottom: '0.5px solid var(--color-border)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center'
        }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{
          fontWeight: '600', fontSize: '16px', color: 'var(--color-text)',
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {recipe.name}
        </span>
        <button onClick={onDelete} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#e53e3e', display: 'flex', alignItems: 'center', padding: '4px'
        }}>
          <Trash2 size={18} />
        </button>
        <button onClick={onEdit} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 14px',
          background: 'var(--color-surface-2)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '10px', cursor: 'pointer',
          fontSize: '13px', color: 'var(--color-text-muted)'
        }}>
          <Edit2 size={14} /> Bearbeiten
        </button>
      </div>

      <div style={{padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px'}}>

        {steps.length > 0 && (
          <button onClick={onCook} style={{
            width: '100%', padding: '14px',
            background: 'var(--color-accent)', color: '#fff',
            border: 'none', borderRadius: '14px', cursor: 'pointer',
            fontSize: '15px', fontWeight: '600',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}>
            <ChefHat size={18} /> Jetzt kochen
          </button>
        )}

        {recipe.image_url && (
          <img
            src={recipe.image_url}
            alt={recipe.name}
            loading="lazy"
            decoding="async"
            style={{
              width: '100%', height: '200px', objectFit: 'cover',
              borderRadius: '16px', border: '0.5px solid var(--color-border)'
            }}
          />
        )}

        <div style={{
          background: 'var(--color-surface)',
          borderRadius: '16px', padding: '16px',
          border: '0.5px solid var(--color-border)',
          display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
            {recipe.category && (
              <span style={{
                fontSize: '13px', padding: '4px 12px',
                background: 'var(--color-accent-soft)',
                color: 'var(--color-accent-text)',
                borderRadius: '20px', fontWeight: '500'
              }}>
                {recipe.category}
              </span>
            )}
            {recipe.servings && (
              <span style={{
                fontSize: '13px', padding: '4px 12px',
                background: 'var(--color-surface-2)',
                color: 'var(--color-text-muted)',
                borderRadius: '20px'
              }}>
                {recipe.servings} Portionen
              </span>
            )}
            {recipe.rating && (
              <span style={{
                fontSize: '13px', padding: '4px 12px',
                background: '#fef3c7', color: '#d97706',
                borderRadius: '20px', fontWeight: '500'
              }}>
                {'⭐'.repeat(recipe.rating)}
              </span>
            )}
          </div>

          {recipe.tags && recipe.tags.length > 0 && (
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px'}}>
              {recipe.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: '12px', padding: '3px 8px',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text-muted)',
                  borderRadius: '20px',
                  border: '0.5px solid var(--color-border)'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {recipe.description && (
            <p style={{
              fontSize: '14px', color: 'var(--color-text)',
              lineHeight: '1.6', margin: 0
            }}>
              {recipe.description}
            </p>
          )}
        </div>

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: '16px', padding: '16px',
            border: '0.5px solid var(--color-border)'
          }}>
            <div style={{
              fontSize: '12px', fontWeight: '700',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              marginBottom: '12px'
            }}>
              Zutaten · {recipe.servings} Portionen
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
              {recipe.ingredients.map((ing, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'var(--color-surface-2)',
                  borderRadius: '8px'
                }}>
                  <span style={{fontSize: '14px', color: 'var(--color-text)'}}>
                    {ing.name}
                  </span>
                  {(ing.amount || ing.unit) && (
                    <span style={{
                      fontSize: '14px', fontWeight: '700',
                      color: 'var(--color-text)', marginLeft: '8px'
                    }}>
                      {ing.amount
                        ? Number(ing.amount) % 1 === 0
                          ? Number(ing.amount)
                          : Number(ing.amount).toFixed(1)
                        : ''
                      }
                      {ing.unit ? ' ' + ing.unit : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {steps.length > 0 && (
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: '16px', padding: '16px',
            border: '0.5px solid var(--color-border)'
          }}>
            <div style={{
              fontSize: '12px', fontWeight: '700',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              marginBottom: '12px',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <ChefHat size={13} /> Zubereitung
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {steps.map((step, i) => (
                <div key={i} style={{display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: 'var(--color-accent)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '700', flexShrink: 0, marginTop: '1px'
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

        {sourceUrl.length > 0 && (
        <a  
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', padding: '10px 14px',
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '12px', fontSize: '13px',
              color: 'var(--color-accent)', textDecoration: 'none'
            }}
          >
            🔗 Originalrezept öffnen
          </a>
        )}

      </div>
    </div>
  )
}

function RecipeEdit({ recipe, isNew, onSave, onCancel, household, user, uploadImage }) {
  const [form, setForm] = useState({
    name: recipe ? recipe.name || '' : '',
    category: recipe ? recipe.category || '' : '',
    description: recipe ? recipe.description || '' : '',
    servings: recipe ? recipe.servings || 2 : 2,
    tags: recipe ? recipe.tags || [] : [],
    image_url: recipe ? recipe.image_url || '' : '',
    source_url: recipe ? recipe.source_url || '' : ''
  })
  const [ingredients, setIngredients] = useState(
    recipe && recipe.ingredients && recipe.ingredients.length
      ? recipe.ingredients
      : [emptyIngredient()]
  )
  const [steps, setSteps] = useState(() => {
    if (!recipe || !recipe.recipe_steps || !recipe.recipe_steps.length) return ['']
    return [...recipe.recipe_steps]
      .sort((a, b) => a.step_number - b.step_number)
      .map(s => s.description)
  })
  const [quickInput, setQuickInput] = useState('')
  const [quickMode, setQuickMode] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Änderungen tracken
  const updateForm = (updater) => {
    setForm(updater)
    setIsDirty(true)
  }
  const updateIngredients = (val) => {
    setIngredients(val)
    setIsDirty(true)
  }
  const updateSteps = (val) => {
    setSteps(val)
    setIsDirty(true)
  }

  const handleCancel = () => {
    if (isDirty) {
      if (!window.confirm('Änderungen verwerfen?')) return
    }
    onCancel()
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name ist Pflichtfeld')
      return
    }
    setSaving(true)
    try {
      await onSave({
        name: form.name,
        category: form.category,
        description: form.description,
        servings: form.servings,
        tags: form.tags,
        image_url: form.image_url,
        source_url: form.source_url,
        ingredients: ingredients.filter(i => i.name.trim()),
        steps: steps.filter(s => s.trim()).map((s, i) => ({
          step_number: i + 1,
          description: s
        }))
      })
      setIsDirty(false)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, user.id)
      updateForm(f => ({ ...f, image_url: url }))
    } finally {
      setUploading(false)
    }
  }

  const handleQuickInput = () => {
    const lines = quickInput.split('\n').filter(l => l.trim())
    const parsed = lines.map(parseIngredientLine).filter(Boolean)
    if (parsed.length) {
      updateIngredients(prev => [...prev.filter(i => i.name.trim()), ...parsed])
      setQuickInput('')
      setQuickMode(false)
    }
  }

  const toggleTag = (tag) => {
    updateForm(f => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter(t => t !== tag)
        : [...f.tags, tag]
    }))
  }

  const updateIng = (i, field, val) => {
    const copy = [...ingredients]
    copy[i] = { ...copy[i], [field]: val }
    updateIngredients(copy)
  }

  const inputStyle = {
    background: 'var(--color-surface)',
    border: '0.5px solid var(--color-border)',
    borderRadius: '10px', color: 'var(--color-text)',
    outline: 'none', fontSize: '13px',
    padding: '9px 12px', boxSizing: 'border-box'
  }

  return (
    <div style={{paddingBottom: '80px'}}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-surface)',
        borderBottom: '0.5px solid var(--color-border)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <button onClick={handleCancel} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center'
        }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{
          fontWeight: '600', fontSize: '16px', color: 'var(--color-text)', flex: 1
        }}>
          {isNew ? 'Neues Rezept' : 'Bearbeiten'}
          {isDirty && (
            <span style={{
              marginLeft: '8px', fontSize: '11px',
              color: '#f59e0b', fontWeight: '400'
            }}>
              · ungespeichert
            </span>
          )}
        </span>
        <button onClick={handleSave} disabled={saving} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 14px', background: 'var(--color-accent)', color: '#fff',
          border: 'none', borderRadius: '10px',
          cursor: saving ? 'not-allowed' : 'pointer',
          fontSize: '13px', fontWeight: '500', opacity: saving ? 0.7 : 1
        }}>
          <Save size={14} /> {saving ? '...' : 'Speichern'}
        </button>
      </div>

      <div style={{padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px'}}>

        <label style={{cursor: 'pointer', display: 'block'}}>
          <div style={{
            height: '160px', borderRadius: '16px',
            background: 'var(--color-surface-2)',
            border: '0.5px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', position: 'relative'
          }}>
            {form.image_url ? (
              <>
                <img
                  src={form.image_url} alt=""
                  loading="lazy" decoding="async"
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
                <div style={{
                  position: 'absolute', bottom: '8px', right: '8px',
                  background: 'rgba(0,0,0,0.5)', borderRadius: '8px',
                  padding: '4px 10px', fontSize: '11px', color: '#fff'
                }}>
                  ändern
                </div>
              </>
            ) : (
              <div style={{textAlign: 'center', color: 'var(--color-text-muted)'}}>
                <Camera size={28} style={{margin: '0 auto 6px', display: 'block'}} />
                <p style={{fontSize: '12px', margin: 0}}>
                  {uploading ? 'Lädt hoch...' : 'Foto hinzufügen'}
                </p>
              </div>
            )}
          </div>
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{display: 'none'}} />
        </label>

        <input
          value={form.name}
          onChange={e => updateForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Rezeptname *"
          style={{
            ...inputStyle,
            fontSize: '16px', fontWeight: '500',
            padding: '13px 16px', borderRadius: '12px'
          }}
        />

        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '12px', padding: '10px 16px'
        }}>
          <span style={{fontSize: '13px', color: 'var(--color-text-muted)', flex: 1}}>
            Portionen
          </span>
          <button
            onClick={() => updateForm(f => ({ ...f, servings: Math.max(1, f.servings - 1) }))}
            style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'var(--color-surface-2)',
              border: '0.5px solid var(--color-border)',
              cursor: 'pointer', fontSize: '18px', color: 'var(--color-text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >-</button>
          <span style={{
            fontSize: '16px', fontWeight: '600', color: 'var(--color-text)',
            minWidth: '24px', textAlign: 'center'
          }}>
            {form.servings}
          </span>
          <button
            onClick={() => updateForm(f => ({ ...f, servings: f.servings + 1 }))}
            style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'var(--color-surface-2)',
              border: '0.5px solid var(--color-border)',
              cursor: 'pointer', fontSize: '18px', color: 'var(--color-text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >+</button>
        </div>

        <div>
          <div style={{
            fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)',
            marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            Kategorie
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => updateForm(f => ({
                ...f, category: f.category === cat ? '' : cat
              }))} style={{
                padding: '7px 14px', borderRadius: '20px', cursor: 'pointer',
                fontSize: '12px',
                background: form.category === cat ? 'var(--color-accent)' : 'var(--color-surface)',
                color: form.category === cat ? '#fff' : 'var(--color-text-muted)',
                border: form.category === cat
                  ? '2px solid var(--color-accent)'
                  : '0.5px solid var(--color-border)',
                transition: 'all 0.15s'
              }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{
            fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)',
            marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            Tags
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
            {TAGS.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)} style={{
                padding: '7px 14px', borderRadius: '20px', cursor: 'pointer',
                fontSize: '12px',
                background: form.tags.includes(tag) ? 'var(--color-accent-soft)' : 'var(--color-surface)',
                color: form.tags.includes(tag) ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
                border: form.tags.includes(tag)
                  ? '1.5px solid var(--color-accent)'
                  : '0.5px solid var(--color-border)',
                transition: 'all 0.15s'
              }}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div style={{height: '0.5px', background: 'var(--color-border)'}} />

        <div>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: '10px'
          }}>
            <span style={{fontSize: '14px', fontWeight: '600', color: 'var(--color-text)'}}>
              Zutaten
            </span>
            <button onClick={() => setQuickMode(q => !q)} style={{
              fontSize: '11px', padding: '5px 10px',
              background: quickMode ? 'var(--color-accent-soft)' : 'var(--color-surface-2)',
              color: quickMode ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '20px', cursor: 'pointer'
            }}>
              Schnelleingabe
            </button>
          </div>

          {quickMode && (
            <div style={{
              background: 'var(--color-accent-soft)', borderRadius: '12px',
              padding: '12px', marginBottom: '12px',
              border: '0.5px solid var(--color-border)'
            }}>
              <p style={{
                fontSize: '11px', color: 'var(--color-accent-text)',
                marginBottom: '8px', lineHeight: '1.5'
              }}>
                Eine Zutat pro Zeile
              </p>
              <textarea
                value={quickInput}
                onChange={e => setQuickInput(e.target.value)}
                placeholder={'200g Spaghetti\n3 Eier\n100g Speck'}
                rows={4}
                style={{
                  width: '100%', padding: '10px',
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '8px', fontSize: '13px',
                  color: 'var(--color-text)', outline: 'none',
                  resize: 'none', boxSizing: 'border-box',
                  fontFamily: 'monospace'
                }}
              />
              <div style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
                <button onClick={handleQuickInput} style={{
                  flex: 1, padding: '10px',
                  background: 'var(--color-accent)', color: '#fff',
                  border: 'none', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '500'
                }}>
                  Übernehmen
                </button>
                <button onClick={() => { setQuickMode(false); setQuickInput('') }} style={{
                  padding: '10px 14px',
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '8px', cursor: 'pointer',
                  fontSize: '13px', color: 'var(--color-text-muted)'
                }}>
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
            {ingredients.map((ing, i) => (
              <div key={i} style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                <input
                  value={ing.amount || ''}
                  onChange={e => updateIng(i, 'amount', e.target.value)}
                  placeholder="Menge" type="number"
                  style={{...inputStyle, width: '58px', padding: '9px 6px', textAlign: 'center'}}
                />
                <select
                  value={ing.unit || ''}
                  onChange={e => updateIng(i, 'unit', e.target.value)}
                  style={{...inputStyle, width: '68px', padding: '9px 4px'}}
                >
                  <option value="">-</option>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
                <input
                  value={ing.name}
                  onChange={e => updateIng(i, 'name', e.target.value)}
                  placeholder="Zutat *"
                  style={{...inputStyle, flex: 1}}
                />
                <select
                  value={ing.category || 'Sonstiges'}
                  onChange={e => updateIng(i, 'category', e.target.value)}
                  style={{...inputStyle, width: '88px', padding: '9px 4px', fontSize: '11px'}}
                >
                  {CATEGORIES_ING.map(c => <option key={c}>{c}</option>)}
                </select>
                <button
                  onClick={() => updateIngredients(ingredients.filter((_, j) => j !== i))}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '6px', color: 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center'
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => updateIngredients([...ingredients, emptyIngredient()])}
            style={{
              marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '13px', color: 'var(--color-accent)', padding: '4px 0'
            }}
          >
            <Plus size={14} /> Zutat hinzufügen
          </button>
        </div>

        <div style={{height: '0.5px', background: 'var(--color-border)'}} />

        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'
          }}>
            <ChefHat size={16} color="var(--color-accent)" />
            <span style={{fontSize: '14px', fontWeight: '600', color: 'var(--color-text)'}}>
              Zubereitungsschritte
            </span>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            {steps.map((step, i) => (
              <div key={i} style={{display: 'flex', gap: '10px', alignItems: 'flex-start'}}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: step.trim() ? 'var(--color-accent)' : 'var(--color-surface-2)',
                  border: step.trim() ? 'none' : '0.5px solid var(--color-border)',
                  color: step.trim() ? '#fff' : 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: '600', flexShrink: 0,
                  marginTop: '9px', transition: 'background 0.2s'
                }}>
                  {i + 1}
                </div>
                <textarea
                  value={step}
                  onChange={e => {
                    const copy = [...steps]
                    copy[i] = e.target.value
                    updateSteps(copy)
                  }}
                  placeholder={'Schritt ' + (i + 1) + '...'}
                  rows={2}
                  style={{
                    flex: 1, padding: '10px 12px',
                    background: 'var(--color-surface)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '10px', fontSize: '13px',
                    color: 'var(--color-text)', outline: 'none',
                    resize: 'none', lineHeight: '1.5', boxSizing: 'border-box'
                  }}
                />
                {steps.length > 1 && (
                  <button
                    onClick={() => updateSteps(steps.filter((_, j) => j !== i))}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '6px', color: 'var(--color-text-muted)',
                      marginTop: '6px', display: 'flex', alignItems: 'center'
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => updateSteps([...steps, ''])}
            style={{
              marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '13px', color: 'var(--color-accent)', padding: '4px 0'
            }}
          >
            <Plus size={14} /> Schritt hinzufügen
          </button>
        </div>

        <div style={{height: '0.5px', background: 'var(--color-border)'}} />

        <div>
          <div style={{
            fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)',
            marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            Notizen & Tipps
          </div>
          <textarea
            value={form.description}
            onChange={e => updateForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Variationen, Tipps, Hinweise..."
            rows={3}
            style={{
              width: '100%', padding: '12px 14px',
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '12px', fontSize: '13px',
              color: 'var(--color-text)', outline: 'none',
              resize: 'none', boxSizing: 'border-box', lineHeight: '1.5'
            }}
          />
        </div>

      </div>
    </div>
  )
}

export default function RecipeDetail() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const household = useAuthStore(s => s.household)
  const user = useAuthStore(s => s.user)
  const { recipes, addRecipe, updateRecipe, deleteRecipe, uploadImage, fetchRecipeDetails } = useRecipeStore()

  const existing = recipes.find(r => r.id === id)
  const [editMode, setEditMode] = useState(isNew)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    if (!isNew && id && existing && !existing.ingredients) {
      setDetailsLoading(true)
      fetchRecipeDetails(id).finally(() => setDetailsLoading(false))
    }
  }, [id, isNew])

  const handleSave = async (data) => {
    if (isNew) {
      await addRecipe(data, household.id)
      navigate('/recipes')
    } else {
      await updateRecipe(id, data, household.id)
      setEditMode(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Rezept wirklich löschen?')) return
    await deleteRecipe(id, household.id)
    navigate('/recipes')
  }

  if (!isNew && !existing) return (
    <div style={{
      padding: '32px', textAlign: 'center',
      color: 'var(--color-text-muted)'
    }}>
      Rezept nicht gefunden
    </div>
  )

  if (detailsLoading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', flexDirection: 'column', gap: '12px'
    }}>
      <div style={{fontSize: '32px'}}>🍳</div>
      <p style={{color: 'var(--color-text-muted)', fontSize: '14px'}}>
        Lade Rezept...
      </p>
    </div>
  )

  if (editMode) {
    return (
      <RecipeEdit
        recipe={existing}
        isNew={isNew}
        onSave={handleSave}
        onCancel={() => isNew ? navigate(-1) : setEditMode(false)}
        household={household}
        user={user}
        uploadImage={uploadImage}
      />
    )
  }

  return (
    <RecipeView
      recipe={existing}
      onEdit={() => setEditMode(true)}
      onDelete={handleDelete}
      onCook={() => navigate('/cook/' + id)}
      navigate={navigate}
    />
  )
}