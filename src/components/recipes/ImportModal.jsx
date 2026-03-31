import { useState } from 'react'
import { useRecipeStore } from '../../store/useRecipeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { supabase } from '../../lib/supabase'
import Papa from 'papaparse'

const KNOWN_SITES = [
  { name: 'lecker.de', example: 'https://www.lecker.de/rezepte/...' },
  { name: 'essen.de', example: 'https://www.essen.de/rezepte/...' },
  { name: 'bbcgoodfood.com', example: 'https://www.bbcgoodfood.com/recipes/...' },
  { name: 'allrecipes.com', example: 'https://www.allrecipes.com/recipe/...' },
  { name: 'küchengötter.de', example: 'https://www.kuechengoetter.de/rezepte/...' },
]

export default function ImportModal({ onClose }) {
  const [tab, setTab] = useState('foto')
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const household = useAuthStore(s => s.household)
  const { addRecipe } = useRecipeStore()

  const tabs = [
    { key: 'foto', label: '📷 Foto' },
    { key: 'url', label: '🌐 URL' },
    { key: 'json', label: '📄 JSON' },
    { key: 'csv', label: '📊 CSV' },
  ]

  // ── Foto Import ──────────────────────────────────────────────
  const handleFotoImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    setResult(null)
    setPreview(null)

    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result.split(',')[1])
        reader.onerror = () => rej(new Error('Bild konnte nicht gelesen werden'))
        reader.readAsDataURL(file)
      })

      const { data, error } = await supabase.functions.invoke('analyze-recipe-image', {
        body: { base64, mediaType: file.type }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      setPreview(data)
    } catch (err) {
      setResult(`❌ Fehler: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ── URL Import ───────────────────────────────────────────────
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
      if (data?.error) throw new Error(data.error)
      setPreview(data)
    } catch (err) {
      setResult(`❌ Fehler: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ── Vorschau speichern ───────────────────────────────────────
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

  // ── JSON Import ──────────────────────────────────────────────
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

  // ── CSV Import ───────────────────────────────────────────────
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
              ingredients: []
            }, household.id)
            count++
          }
          setResult(`✅ ${count} Rezept(e) importiert`)
        } catch (err) {
          setResult(`❌ ${err.message}`)
        } finally { setLoading(false) }
      }
    })
  }

  const PreviewCard = () => (
    <div style={{
      background: 'var(--color-surface-2)',
      borderRadius: '14px', overflow: 'hidden',
      border: '0.5px solid var(--color-border)',
      marginTop: '12px'
    }}>
      {preview.image_url && (
        <img src={preview.image_url} alt=""
          style={{width: '100%', height: '140px', objectFit: 'cover'}} />
      )}
      <div style={{padding: '12px'}}>
        <div style={{
          fontSize: '11px', fontWeight: '500',
          color: 'var(--color-accent-text)',
          background: 'var(--color-accent-soft)',
          padding: '2px 8px', borderRadius: '20px',
          display: 'inline-block', marginBottom: '8px'
        }}>
          ✨ Erkannt
        </div>
        <div style={{
          fontWeight: '500', fontSize: '15px',
          color: 'var(--color-text)', marginBottom: '4px'
        }}>
          {preview.name}
        </div>
        {(preview.category || preview.cook_time) && (
          <div style={{fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px'}}>
            {preview.category}{preview.cook_time && ` · ${preview.cook_time} min`}
            {preview.servings && ` · ${preview.servings} Portionen`}
          </div>
        )}
        {preview.ingredients?.length > 0 && (
          <div style={{marginBottom: '10px'}}>
            <div style={{fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '5px'}}>
              {preview.ingredients.length} Zutaten erkannt
            </div>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px'}}>
              {preview.ingredients.slice(0, 6).map((ing, i) => (
                <span key={i} style={{
                  fontSize: '11px', padding: '2px 8px',
                  background: 'var(--color-surface)',
                  borderRadius: '20px', color: 'var(--color-text-muted)',
                  border: '0.5px solid var(--color-border)'
                }}>
                  {ing.amount && `${ing.amount} `}{ing.unit && `${ing.unit} `}{ing.name}
                </span>
              ))}
              {preview.ingredients.length > 6 && (
                <span style={{fontSize: '11px', color: 'var(--color-text-muted)', padding: '2px 4px'}}>
                  +{preview.ingredients.length - 6} weitere
                </span>
              )}
            </div>
          </div>
        )}
        <div style={{display: 'flex', gap: '8px'}}>
          <button onClick={handleSavePreview} disabled={loading} style={{
            flex: 1, padding: '10px',
            background: '#6c63ff', color: '#fff',
            border: 'none', borderRadius: '10px',
            cursor: 'pointer', fontSize: '13px', fontWeight: '500',
            opacity: loading ? 0.6 : 1
          }}>
            {loading ? 'Speichere...' : 'Rezept speichern'}
          </button>
          <button onClick={() => { setPreview(null); setUrl('') }} style={{
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
  )

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.6)', zIndex: 100,
      display: 'flex', alignItems: 'flex-end'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        width: '100%', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column'
      }}>

        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '0.5px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{fontWeight: '500', fontSize: '16px', color: 'var(--color-text)'}}>
            Rezept importieren
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            cursor: 'pointer', fontSize: '22px',
            color: 'var(--color-text-muted)'
          }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '6px',
          padding: '12px 16px',
          borderBottom: '0.5px solid var(--color-border)'
        }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => {
              setTab(t.key)
              setPreview(null)
              setResult(null)
            }} style={{
              flex: 1, padding: '8px 4px',
              borderRadius: '10px', border: 'none',
              cursor: 'pointer', fontSize: '11px', fontWeight: '500',
              background: tab === t.key ? 'var(--color-accent-soft)' : 'var(--color-surface-2)',
              color: tab === t.key ? 'var(--color-accent-text)' : 'var(--color-text-muted)'
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{flex: 1, overflowY: 'auto', padding: '16px'}}>

          {/* ── FOTO TAB ── */}
          {tab === 'foto' && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <p style={{fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.5', margin: 0}}>
                Fotografiere ein Rezept aus einem Kochbuch oder Screenshot — KI erkennt automatisch alle Zutaten.
              </p>

              {!preview && (
                <label style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '10px', padding: '36px 20px',
                  border: '1.5px dashed var(--color-border)',
                  borderRadius: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}>
                  <span style={{fontSize: '44px'}}>{loading ? '⏳' : '📷'}</span>
                  <span style={{
                    fontSize: '14px', fontWeight: '500', color: 'var(--color-text)'
                  }}>
                    {loading ? 'KI analysiert Foto...' : 'Foto auswählen'}
                  </span>
                  <span style={{fontSize: '12px', color: 'var(--color-text-muted)'}}>
                    Kochbuch · Rezeptkarte · Screenshot
                  </span>
                  <input
                    type="file" accept="image/*"
                    onChange={handleFotoImport}
                    style={{display: 'none'}}
                    disabled={loading}
                  />
                </label>
              )}

              {preview && <PreviewCard />}
            </div>
          )}

          {/* ── URL TAB ── */}
          {tab === 'url' && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <div>
                <p style={{
                  fontSize: '13px', color: 'var(--color-text-muted)',
                  marginBottom: '8px', lineHeight: '1.5'
                }}>
                  Funktioniert zuverlässig mit diesen Seiten:
                </p>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px'}}>
                  {KNOWN_SITES.map(site => (
                    <span key={site.name} style={{
                      fontSize: '11px', padding: '3px 8px',
                      background: 'var(--color-accent-soft)',
                      color: 'var(--color-accent-text)',
                      borderRadius: '20px'
                    }}>
                      {site.name}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{display: 'flex', gap: '8px'}}>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://www.lecker.de/rezepte/..."
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

              {preview && <PreviewCard />}
            </div>
          )}

          {/* ── JSON TAB ── */}
          {tab === 'json' && (
            <div>
              <p style={{
                fontSize: '13px', color: 'var(--color-text-muted)',
                marginBottom: '12px'
              }}>
                JSON-Datei im MealSync-Format importieren.
              </p>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '8px', padding: '28px',
                border: '1.5px dashed var(--color-border)',
                borderRadius: '14px', cursor: 'pointer'
              }}>
                <span style={{fontSize: '36px'}}>📄</span>
                <span style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>
                  {loading ? 'Importiere...' : 'JSON-Datei auswählen'}
                </span>
                <input type="file" accept=".json"
                  onChange={handleJSON}
                  style={{display: 'none'}} disabled={loading} />
              </label>
            </div>
          )}

          {/* ── CSV TAB ── */}
          {tab === 'csv' && (
            <div>
              <p style={{
                fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px'
              }}>
                CSV mit Spalten: name, category, description, tags, servings
              </p>
              <p style={{
                fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '12px'
              }}>
                Tags mit Semikolon trennen: vegetarisch;schnell
              </p>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '8px', padding: '28px',
                border: '1.5px dashed var(--color-border)',
                borderRadius: '14px', cursor: 'pointer'
              }}>
                <span style={{fontSize: '36px'}}>📊</span>
                <span style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>
                  {loading ? 'Importiere...' : 'CSV-Datei auswählen'}
                </span>
                <input type="file" accept=".csv"
                  onChange={handleCSV}
                  style={{display: 'none'}} disabled={loading} />
              </label>
            </div>
          )}

          {/* Ergebnis */}
          {result && (
            <div style={{
              marginTop: '12px', padding: '12px 14px',
              borderRadius: '10px', fontSize: '13px',
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
              borderRadius: '10px', cursor: 'pointer',
              fontSize: '14px', fontWeight: '500'
            }}>
              Fertig
            </button>
          )}

        </div>
      </div>
    </div>
  )
}