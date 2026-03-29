import { useState, useRef } from 'react'
import { X, Upload, FileText } from 'lucide-react'
import { useRecipeStore } from '../../store/useRecipeStore'
import { useAuthStore } from '../../store/useAuthStore'
import Papa from 'papaparse'

export default function ImportModal({ onClose }) {
  const [tab, setTab] = useState('json') // 'json' | 'csv'
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const household = useAuthStore(s => s.household)
  const { addRecipe } = useRecipeStore()
  const fileRef = useRef()

  const handleJSON = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const recipes = parsed.recipes || (Array.isArray(parsed) ? parsed : [parsed])
      let count = 0
      for (const recipe of recipes) {
        await addRecipe(recipe, household.id)
        count++
      }
      setResult(`✅ ${count} Rezept(e) erfolgreich importiert`)
    } catch (err) {
      setResult(`❌ Fehler: ${err.message}`)
    } finally { setLoading(false) }
  }

  const handleCSV = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          // CSV-Format: name, category, description, tags, servings, prep_time, cook_time
          let count = 0
          for (const row of results.data) {
            if (!row.name) continue
            await addRecipe({
              name: row.name,
              category: row.category || '',
              description: row.description || '',
              tags: row.tags ? row.tags.split(';').map(t => t.trim()) : [],
              servings: Number(row.servings) || 2,
              prep_time: Number(row.prep_time) || null,
              cook_time: Number(row.cook_time) || null,
              ingredients: []
            }, household.id)
            count++
          }
          setResult(`✅ ${count} Rezept(e) aus CSV importiert`)
        } catch (err) {
          setResult(`❌ Fehler: ${err.message}`)
        } finally { setLoading(false) }
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">Rezepte importieren</h3>
          <button onClick={onClose}><X size={20} className="text-gray-500" /></button>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1 mb-5">
          {['json', 'csv'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all
                ${tab === t ? 'bg-white shadow text-green-700' : 'text-gray-500'}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {tab === 'json' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Importiere eine JSON-Datei im MealSync-Format oder Chefkoch-Export.
            </p>
            <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
              <FileText size={32} className="text-gray-400" />
              <span className="text-sm text-gray-600">{loading ? 'Importiere...' : 'JSON-Datei auswählen'}</span>
              <input type="file" accept=".json" onChange={handleJSON} className="hidden" disabled={loading} />
            </label>
          </div>
        )}

        {tab === 'csv' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              CSV mit Spalten: <code className="bg-gray-100 px-1 rounded">name, category, description, tags, servings, prep_time, cook_time</code>
            </p>
            <p className="text-xs text-gray-400">Tags werden mit Semikolon getrennt (z.B. vegetarisch;schnell)</p>
            <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
              <Upload size={32} className="text-gray-400" />
              <span className="text-sm text-gray-600">{loading ? 'Importiere...' : 'CSV-Datei auswählen'}</span>
              <input type="file" accept=".csv" onChange={handleCSV} className="hidden" disabled={loading} />
            </label>
          </div>
        )}

        {result && (
          <div className={`mt-4 p-3 rounded-xl text-sm ${result.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {result}
          </div>
        )}

        {result?.startsWith('✅') && (
          <button onClick={onClose}
            className="w-full mt-3 bg-green-600 text-white py-3 rounded-xl font-medium">
            Fertig
          </button>
        )}
      </div>
    </div>
  )
}