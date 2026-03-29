import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, Plus, X, Camera } from 'lucide-react'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'

const UNITS = ['g', 'kg', 'ml', 'l', 'EL', 'TL', 'Stück', 'Prise', 'Bund', 'Dose', 'Packung']
const CATEGORIES_ING = ['Gemüse', 'Obst', 'Fleisch', 'Fisch', 'Kühlregal', 'Milchprodukte', 'Nudeln', 'Reis & Getreide', 'Konserven', 'Gewürze', 'Backen', 'Sonstiges']

const emptyIngredient = () => ({ name: '', amount: '', unit: 'g', category: 'Sonstiges' })

export default function RecipeDetail() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const household = useAuthStore(s => s.household)
  const { recipes, addRecipe, updateRecipe, deleteRecipe, uploadImage } = useRecipeStore()

  const existing = recipes.find(r => r.id === id)
  const [form, setForm] = useState({
    name: '', category: '', description: '', servings: 2,
    prep_time: '', cook_time: '', tags: '', image_url: '', source_url: ''
  })
  const [ingredients, setIngredients] = useState([emptyIngredient()])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '', category: existing.category || '',
        description: existing.description || '', servings: existing.servings || 2,
        prep_time: existing.prep_time || '', cook_time: existing.cook_time || '',
        tags: existing.tags?.join(', ') || '', image_url: existing.image_url || '',
        source_url: existing.source_url || ''
      })
      setIngredients(existing.ingredients?.length ? existing.ingredients : [emptyIngredient()])
    }
  }, [existing])

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Name ist Pflichtfeld')
    setSaving(true)
    try {
      const data = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        prep_time: form.prep_time ? Number(form.prep_time) : null,
        cook_time: form.cook_time ? Number(form.cook_time) : null,
        ingredients: ingredients.filter(i => i.name.trim())
      }
      if (isNew) await addRecipe(data, household.id)
      else await updateRecipe(id, data, household.id)
      navigate('/recipes')
    } finally { setSaving(false) }
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
      const { data: { user } } = await import('../lib/supabase').then(m => m.supabase.auth.getUser())
      const url = await uploadImage(file, user.id)
      setForm(f => ({ ...f, image_url: url }))
    } finally { setUploading(false) }
  }

  const updateIng = (i, field, val) => {
    const copy = [...ingredients]
    copy[i] = { ...copy[i], [field]: val }
    setIngredients(copy)
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={20} /></button>
        <h2 className="font-bold text-lg flex-1">{isNew ? 'Neues Rezept' : 'Rezept bearbeiten'}</h2>
        {!isNew && (
          <button onClick={handleDelete} className="text-red-500 p-1"><Trash2 size={20} /></button>
        )}
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          <Save size={16} /> {saving ? '...' : 'Speichern'}
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Bild */}
        <label className="block">
          <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors">
            {form.image_url
              ? <img src={form.image_url} alt="" className="w-full h-full object-cover" />
              : <div className="text-center text-gray-400">
                  <Camera size={32} className="mx-auto mb-2" />
                  <p className="text-sm">{uploading ? 'Lädt hoch...' : 'Foto hinzufügen'}</p>
                </div>
            }
          </div>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>

        {/* Grunddaten */}
        <div className="space-y-3">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Rezeptname *" required
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-medium" />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              placeholder="Kategorie (z.B. Pasta)"
              className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input type="number" value={form.servings} onChange={e => setForm(f => ({ ...f, servings: Number(e.target.value) }))}
              placeholder="Portionen" min="1"
              className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={form.prep_time} onChange={e => setForm(f => ({ ...f, prep_time: e.target.value }))}
              placeholder="Zubereitung (min)"
              className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input type="number" value={form.cook_time} onChange={e => setForm(f => ({ ...f, cook_time: e.target.value }))}
              placeholder="Kochzeit (min)"
              className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Beschreibung / Zubereitung..."
            rows={4}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="Tags: vegetarisch, schnell, klassiker (kommagetrennt)"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>

        {/* Zutaten */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Zutaten</h3>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={ing.amount} onChange={e => updateIng(i, 'amount', e.target.value)}
                  placeholder="Menge" type="number"
                  className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <select value={ing.unit} onChange={e => updateIng(i, 'unit', e.target.value)}
                  className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500">
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
                <input value={ing.name} onChange={e => updateIng(i, 'name', e.target.value)}
                  placeholder="Zutat *"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <select value={ing.category} onChange={e => updateIng(i, 'category', e.target.value)}
                  className="w-24 border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500">
                  {CATEGORIES_ING.map(c => <option key={c}>{c}</option>)}
                </select>
                <button onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}
                  className="text-gray-300 hover:text-red-400">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => setIngredients([...ingredients, emptyIngredient()])}
            className="mt-2 flex items-center gap-1 text-green-600 text-sm hover:text-green-700">
            <Plus size={16} /> Zutat hinzufügen
          </button>
        </div>
      </div>
    </div>
  )
}