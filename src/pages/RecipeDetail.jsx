import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, Plus, X, Camera, ChefHat } from 'lucide-react'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'

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
      name: isUnit ? match[3].trim() : `${unitCandidate} ${match[3]}`.trim(),
      category: 'Sonstiges'
    }
  }
  return { name: clean, amount: null, unit: '', category: 'Sonstiges' }
}

export default function RecipeDetail() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const household = useAuthStore(s => s.household)
  const user = useAuthStore(s => s.user)
  const { recipes, addRecipe, updateRecipe, deleteRecipe, uploadImage } = useRecipeStore()

  const existing = recipes.find(r => r.id === id)

  const [form, setForm] = useState({
    name: '', category: '', description: '',
    servings: 2, tags: [], image_url: '', source_url: ''
  })
  const [ingredients, setIngredients] = useState([emptyIngredient()])
  const [steps, setSteps] = useState([''])
  const [quickInput, setQuickInput] = useState('')
  const [quickMode, setQuickMode] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        category: existing.category || '',
        description: existing.description || '',
        servings: existing.servings || 2,
        tags: existing.tags || [],
        image_url: existing.image_url || '',
        source_url: existing.source_url || ''
      })
      setIngredients(
        existing.ingredients?.length ? existing.ingredients : [emptyIngredient()]
      )
      const sorted = [...(existing.recipe_steps || [])]
        .sort((a, b) => a.step_number - b.step_number)
      setSteps(sorted.length ? sorted.map(s => s.description) : [''])
    }
  }, [existing])

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Name ist Pflichtfeld')
    setSaving(true)
    try {
      const data = {
        ...form,
        ingredients: ingredients.filter(i => i.name.trim()),
        steps: steps
          .filter(s => s.trim())
          .map((s, i) => ({ step_number: i + 1, description: s }))
      }
      if (isNew) await addRecipe(data, household.id)
      else await updateRecipe(id, data, household.id)
      navigate('/recipes')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Rezept wirklich löschen?')) return
    await deleteRecipe(id, household.id)
    navigate('/recipes')
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, user.id)
      setForm(f => ({ ...f, image_url: url }))
    } finally {
      setUploading(false)
    }
  }

  const handleQuickInput = () => {
    const lines = quickInput.split('\n').filter(l => l.trim())
    const parsed = lines.map(parseIngredientLine).filter(Boolean)
    if (parsed.length) {
      setIngredients(prev => {
        const existing = prev.filter(i => i.name.trim())
        return [...existing, ...parsed]
      })
      setQuickInput('')
      setQuickMode(false)
    }
  }

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter(t => t !== tag)
        : [...f.tags, tag]
    }))
  }

  const updateIng = (i, field, val) => {
    const copy = [...ingredients]
    copy[i] = { ...copy[i], [field]: val }
    setIngredients(copy)
  }

  const updateStep = (i, val) => {
    const copy = [...steps]
    copy[i] = val
    setSteps(copy)
  }

  const inputStyle = {
    background: 'var(--color-surface)',
    border: '0.5px solid var(--color-border)',
    borderRadius: '10px',
    color: 'var(--color-text)',
    outline: 'none',
    fontSize: '13px',
    padding: '9px 12px',
    boxSizing: 'border-box'
  }

  return (
    <div style={{paddingBottom: '80px'}}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-surface)',
        borderBottom: '0.5px solid var(--color-border)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--color-text-muted)',
          display: 'flex', alignItems: 'center', padding: '4px'
        }}>
          <ArrowLeft size={20} />
        </button>

        <span style={{
          fontWeight: '500', fontSize: '16px',
          color: 'var(--color-text)', flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {isNew ? 'Neues Rezept' : (form.name || 'Rezept bearbeiten')}
        </span>

        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          {!isNew && (
            <button onClick={handleDelete} style={{
              background: 'none', border: 'none',
              cursor: 'pointer', padding: '4px',
              color: 'var(--color-danger, #e53e3e)',
              display: 'flex', alignItems: 'center'
            }}>
              <Trash2 size={18} />
            </button>
          )}
          <button onClick={handleSave} disabled={saving} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', background: '#6c63ff', color: '#fff',
            border: 'none', borderRadius: '10px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontWeight: '500',
            opacity: saving ? 0.7 : 1
          }}>
            <Save size={14} />
            {saving ? '...' : 'Speichern'}
          </button>
        </div>
      </div>

      <div style={{padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px'}}>

        {/* Kochen Button — nur bei bestehendem Rezept mit Schritten */}
        {!isNew && existing?.recipe_steps?.length > 0 && (
          <button onClick={() => navigate(`/cook/${id}`)} style={{
            width: '100%', padding: '13px',
            background: '#6c63ff',
            color: '#fff', border: 'none', borderRadius: '12px',
            cursor: 'pointer', fontSize: '15px', fontWeight: '500',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}>
            <ChefHat size={18} /> Jetzt kochen
          </button>
        )}

        {/* Bild */}
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
          <input
            type="file" accept="image/*"
            onChange={handleImageUpload}
            style={{display: 'none'}}
          />
        </label>

        {/* Name */}
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Rezeptname *"
          style={{
            ...inputStyle,
            fontSize: '16px', fontWeight: '500',
            padding: '13px 16px', borderRadius: '12px'
          }}
        />

        {/* Portionen */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '12px', padding: '10px 16px'
        }}>
          <span style={{
            fontSize: '13px', color: 'var(--color-text-muted)', flex: 1
          }}>
            Portionen
          </span>
          <button
            onClick={() => setForm(f => ({ ...f, servings: Math.max(1, f.servings - 1) }))}
            style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'var(--color-surface-2)',
              border: '0.5px solid var(--color-border)',
              cursor: 'pointer', fontSize: '18px',
              color: 'var(--color-text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >−</button>
          <span style={{
            fontSize: '16px', fontWeight: '500',
            color: 'var(--color-text)', minWidth: '24px', textAlign: 'center'
          }}>
            {form.servings}
          </span>
          <button
            onClick={() => setForm(f => ({ ...f, servings: f.servings + 1 }))}
            style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'var(--color-surface-2)',
              border: '0.5px solid var(--color-border)',
              cursor: 'pointer', fontSize: '18px',
              color: 'var(--color-text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >+</button>
        </div>

        {/* Kategorie Chips */}
        <div>
          <div style={{
            fontSize: '12px', fontWeight: '500',
            color: 'var(--color-text-muted)', marginBottom: '8px',
            textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            Kategorie
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setForm(f => ({
                ...f, category: f.category === cat ? '' : cat
              }))} style={{
                padding: '7px 14px', borderRadius: '20px',
                border: 'none', cursor: 'pointer', fontSize: '12px',
                fontWeight: form.category === cat ? '500' : '400',
                background: form.category === cat ? '#6c63ff' : 'var(--color-surface)',
                color: form.category === cat ? '#fff' : 'var(--color-text-muted)',
                border: form.category === cat
                  ? 'none'
                  : '0.5px solid var(--color-border)',
                transition: 'all 0.15s'
              }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tags Chips */}
        <div>
          <div style={{
            fontSize: '12px', fontWeight: '500',
            color: 'var(--color-text-muted)', marginBottom: '8px',
            textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            Tags
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
            {TAGS.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)} style={{
                padding: '7px 14px', borderRadius: '20px',
                cursor: 'pointer', fontSize: '12px',
                background: form.tags.includes(tag)
                  ? 'var(--color-accent-soft)'
                  : 'var(--color-surface)',
                color: form.tags.includes(tag)
                  ? 'var(--color-accent-text)'
                  : 'var(--color-text-muted)',
                border: form.tags.includes(tag)
                  ? '1.5px solid #6c63ff'
                  : '0.5px solid var(--color-border)',
                transition: 'all 0.15s'
              }}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Trennlinie */}
        <div style={{height: '0.5px', background: 'var(--color-border)'}} />

        {/* Zutaten */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: '10px'
          }}>
            <span style={{
              fontSize: '14px', fontWeight: '500', color: 'var(--color-text)'
            }}>
              Zutaten
            </span>
            <button onClick={() => setQuickMode(q => !q)} style={{
              fontSize: '11px', padding: '5px 10px',
              background: quickMode ? 'var(--color-accent-soft)' : 'var(--color-surface-2)',
              color: quickMode ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '20px', cursor: 'pointer'
            }}>
              ⚡ Schnelleingabe
            </button>
          </div>

          {/* Schnelleingabe Box */}
          {quickMode && (
            <div style={{
              background: 'var(--color-accent-soft)',
              borderRadius: '12px', padding: '12px',
              marginBottom: '12px',
              border: '0.5px solid var(--color-border)'
            }}>
              <p style={{
                fontSize: '11px', color: 'var(--color-accent-text)',
                marginBottom: '8px', lineHeight: '1.5'
              }}>
                Eine Zutat pro Zeile — z.B. "200g Spaghetti", "3 Eier", "Salz"
              </p>
              <textarea
                value={quickInput}
                onChange={e => setQuickInput(e.target.value)}
                placeholder={'200g Spaghetti\n3 Eier\n100g Speck\nSalz\n1 Zwiebel'}
                rows={5}
                style={{
                  width: '100%', padding: '10px',
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '8px', fontSize: '13px',
                  color: 'var(--color-text)', outline: 'none',
                  resize: 'none', boxSizing: 'border-box',
                  fontFamily: 'monospace', lineHeight: '1.6'
                }}
              />
              <div style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
                <button onClick={handleQuickInput} style={{
                  flex: 1, padding: '10px',
                  background: '#6c63ff', color: '#fff',
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

          {/* Zutaten Liste */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
            {ingredients.map((ing, i) => (
              <div key={i} style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                <input
                  value={ing.amount || ''}
                  onChange={e => updateIng(i, 'amount', e.target.value)}
                  placeholder="Menge"
                  type="number"
                  style={{...inputStyle, width: '58px', padding: '9px 6px', textAlign: 'center'}}
                />
                <select
                  value={ing.unit || ''}
                  onChange={e => updateIng(i, 'unit', e.target.value)}
                  style={{...inputStyle, width: '68px', padding: '9px 4px'}}
                >
                  <option value="">—</option>
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
                  onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}
                  style={{
                    background: 'none', border: 'none',
                    cursor: 'pointer', padding: '6px',
                    color: 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center'
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => setIngredients([...ingredients, emptyIngredient()])}
            style={{
              marginTop: '10px',
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '13px', color: '#6c63ff', padding: '4px 0'
            }}
          >
            <Plus size={14} /> Zutat hinzufügen
          </button>
        </div>

        {/* Trennlinie */}
        <div style={{height: '0.5px', background: 'var(--color-border)'}} />

        {/* Zubereitungsschritte */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'
          }}>
            <ChefHat size={16} color="#6c63ff" />
            <span style={{
              fontSize: '14px', fontWeight: '500', color: 'var(--color-text)'
            }}>
              Zubereitungsschritte
            </span>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            {steps.map((step, i) => (
              <div key={i} style={{display: 'flex', gap: '10px', alignItems: 'flex-start'}}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: step.trim() ? '#6c63ff' : 'var(--color-surface-2)',
                  border: step.trim() ? 'none' : '0.5px solid var(--color-border)',
                  color: step.trim() ? '#fff' : 'var(--color-text-muted)',