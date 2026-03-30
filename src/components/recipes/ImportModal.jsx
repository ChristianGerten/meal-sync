import { useState } from 'react'
import { useRecipeStore } from '../../store/useRecipeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { supabase } from '../../lib/supabase'
import Papa from 'papaparse'

export default function ImportModal({ onClose }) {
  const [tab, setTab] = useState('url')
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const household = useAuthStore(s => s.household)
  const { addRecipe } = useRecipeStore()

  const handleScrape = async () => {
    if (!url.trim()) return
    setLoading(true)
    setPreview(null)
    setResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('scrape-recipe', {
        body: { url: url.trim() }
      })
      if (error) throw error
      if (data.error) throw new Error(data.error)
      setPreview(data)
    } catch (err) {
      setResult(`❌ Fehler: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePreview = async () => {
    if (!preview) return
    setLoading(true)
    try {
      await addRecipe(preview, household.id)
      setResult('✅ Rezept erfolgreich importiert')
      setPreview(null)
      setUrl('')
    } catch (err) {
      setResult(`❌ Fehler: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleJSON = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const recipes = parsed.recipes || (Array.isArray(parsed) ? parsed : [parsed])
      for (const recipe of recipes) await addRecipe(recipe, household.id)
      setResult(`✅ ${recipes.length} Rezept(e) importiert`)
    } catch (err) {
      setResult(`❌ ${err.message}`)
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
          let count = 0
          for (const row of results.data) {
            if (!row.name) continue
            await addRecipe({
              name: row.name, category: row.category || '',
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
          setResult(`❌ ${err.message}`)
        } finally { setLoading(false) }
      }
    })
  }

  const tabs = ['url', 'json', 'csv']

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.6)', zIndex: 100,
      display: 'flex', alignItems: 'flex-end'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        width: '100%', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{padding: '16px', borderBottom: '0.5px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <span style={{fontWeight: '500', color: 'var(--color-text)'}}>Rezept importieren</span>
          <button onClick={onClose} style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--color-text-muted)'}}>×</button>
        </div>

        {/* Tabs */}
        <div style={{display: 'flex', gap: '6px', padding: '12px 16px', borderBottom: '0.5px solid var(--color-border)'}}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
              cursor: 'pointer', fontSize: '12px', fontWeight: '500',
              background: tab === t ? 'var(--color-accent-soft)' : 'var(--color-surface-2)',
              color: tab === t ? 'var(--color-accent-text)' : 'var(--color-text-muted)'
            }}>
              {t === 'url' ? '🌐 URL' : t === 'json' ? '📄 JSON' : '📊 CSV'}
            </button>
          ))}
        </div>

        <div style={{flex: 1, overflowY: 'auto', padding: '16px'}}>
          {/* URL Tab */}
          {tab === 'url' && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <p style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>
                Füge einen Link zu einem Rezept ein — z.B. von Chefkoch, essen.de oder anderen Seiten.
              </p>
              <div style={{display: 'flex', gap: '8px'}}>
                <input
                  value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://www.chefkoch.de/rezepte/..."
                  style={{
                    flex: 1, padding: '10px 14px',
                    background: 'var(--color-input)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '10px', fontSize: '13px',
                    color: 'var(--color-text)', outline: 'none'
                  }}
                />
                <button onClick={handleScrape} disabled={loading || !url.trim()} style={{
                  padding: '10px 16px', background: '#6c63ff',
                  color: '#fff', border: 'none', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                  opacity: loading || !url.trim() ? 0.6 : 1
                }}>
                  {loading ? '...' : 'Laden'}
                </button>
              </div>

              {/* Vorschau */}
              {preview && (
                <div style={{
                  background: 'var(--color-surface-2)',
                  borderRadius: '14px', overflow: 'hidden',
                  border: '0.5px solid var(--color-border)'
                }}>
                  {preview.image_url && (
                    <img src={preview.image_url} alt="" style={{width: '100%', height: '140px', objectFit: 'cover'}}/>
                  )}
                  <div style={{padding: '12px'}}>
                    <div style={{fontWeight: '500', fontSize: '15px', color: 'var(--color-text)', marginBottom: '4px'}}>
                      {preview.name}
                    </div>
                    {preview.category && (
                      <div style={{fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px'}}>
                        {preview.category}
                        {preview.cook_time && ` · ${preview.cook_time} min`}
                      </div>
                    )}
                    {preview.ingredients?.length > 0 && (
                      <div style={{fontSize: '12px', color: 'var(--color-text-muted)'}}>
                        {preview.ingredients.length} Zutaten erkannt
                      </div>
                    )}
                    <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                      <button onClick={handleSavePreview} disabled={loading} style={{
                        flex: 1, padding: '10px',
                        background: '#6c63ff', color: '#fff',
                        border: 'none', borderRadius: '10px',
                        cursor: 'pointer', fontSize: '13px', fontWeight: '500'
                      }}>
                        Rezept speichern
                      </button>
                      <button onClick={() => setPreview(null)} style={{
                        padding: '10px 14px',
                        background: 'var(--color-surface)',
                        border: '0.5px solid var(--color-border)',
                        borderRadius: '10px', cursor: 'pointer',
                        fontSize: '13px', color: 'var(--color-text-muted)'
                      }}>
                        Verwerfen
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* JSON Tab */}
          {tab === 'json' && (
            <div>
              <p style={{fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px'}}>
                JSON-Datei im MealSync-Format importieren.
              </p>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '8px', padding: '24px',
                border: '1.5px dashed var(--color-border)',
                borderRadius: '14px', cursor: 'pointer'
              }}>
                <span style={{fontSize: '32px'}}>📄</span>
                <span style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>
                  {loading ? 'Importiere...' : 'JSON-Datei auswählen'}
                </span>
                <input type="file" accept=".json" onChange={handleJSON} style={{display: 'none'}} disabled={loading}/>
              </label>
            </div>
          )}

          {/* CSV Tab */}
          {tab === 'csv' && (
            <div>
              <p style={{fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px'}}>
                CSV mit Spalten: name, category, description, tags, servings, prep_time, cook_time
              </p>
              <p style={{fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '12px'}}>
                Tags mit Semikolon trennen: vegetarisch;schnell
              </p>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '8px', padding: '24px',
                border: '1.5px dashed var(--color-border)',
                borderRadius: '14px', cursor: 'pointer'
              }}>
                <span style={{fontSize: '32px'}}>📊</span>
                <span style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>
                  {loading ? 'Importiere...' : 'CSV-Datei auswählen'}
                </span>
                <input type="file" accept=".csv" onChange={handleCSV} style={{display: 'none'}} disabled={loading}/>
              </label>
            </div>
          )}

          {result && (
            <div style={{
              marginTop: '12px', padding: '12px 14px', borderRadius: '10px', fontSize: '13px',
              background: result.startsWith('✅') ? 'var(--color-accent-soft)' : '#2d1515',
              color: result.startsWith('✅') ? 'var(--color-accent-text)' : '#fc8181'
            }}>
              {result}
            </div>
          )}

          {result?.startsWith('✅') && (
            <button onClick={onClose} style={{
              marginTop: '8px', width: '100%', padding: '12px',
              background: '#6c63ff', color: '#fff', border: 'none',
              borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '500'
            }}>
              Fertig
            </button>
          )}
        </div>
      </div>
    </div>
  )
}