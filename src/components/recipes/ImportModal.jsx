import { useState } from 'react'
import { useRecipeStore } from '../../store/useRecipeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { supabase } from '../../lib/supabase'
import { toast } from '../Toast'
import { X, Camera, Link, FileJson, Check, ChefHat } from 'lucide-react'

const TABS = [
  { id: 'foto', label: 'Foto', icon: Camera },
  { id: 'url', label: 'URL', icon: Link },
  { id: 'json', label: 'JSON', icon: FileJson },
]

export default function ImportModal({ onClose }) {
  const { addRecipe } = useRecipeStore()
  const household = useAuthStore(s => s.household)
  const [tab, setTab] = useState('foto')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [jsonInput, setJsonInput] = useState('')
  const [imagePreview, setImagePreview] = useState(null)

  const reset = () => {
    setPreview(null)
    setError('')
    setUrlInput('')
    setJsonInput('')
    setImagePreview(null)
  }

  const handleFotoImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    setError('')
    setPreview(null)

    const imgUrl = URL.createObjectURL(file)
    setImagePreview(imgUrl)

    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result.split(',')[1])
        reader.onerror = () => rej(new Error('Bild konnte nicht gelesen werden'))
        reader.readAsDataURL(file)
      })

      const { data, error: fnError } = await supabase.functions.invoke('analyze-recipe-image', {
        body: { base64, mediaType: file.type }
      })

      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)
      if (!data?.name && !data?.ingredients?.length) throw new Error('Kein Rezept erkannt')

      setPreview(data)
    } catch (err) {
      setError('Fehler: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return
    setLoading(true)
    setError('')
    setPreview(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('scrape-recipe', {
        body: { url: urlInput.trim() }
      })
      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)
      setPreview(data)
    } catch (err) {
      setError('Fehler: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      setPreview(parsed)
      setError('')
    } catch {
      setError('Ungültiges JSON Format')
    }
  }

  const handleSave = async () => {
    if (!preview) return
    setLoading(true)
    try {
      await addRecipe(preview, household.id)
      toast.success('Rezept importiert')
      onClose()
    } catch (err) {
      setError('Fehler beim Speichern: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 200,
      display: 'flex', alignItems: 'flex-end'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        width: '100%', maxHeight: '92vh',
        display: 'flex', flexDirection: 'column'
      }}>

        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '0.5px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <span style={{fontWeight: '600', fontSize: '16px', color: 'var(--color-text)'}}>
            Rezept importieren
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center'
          }}>
            <X size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', padding: '12px 16px', gap: '8px',
          borderBottom: '0.5px solid var(--color-border)', flexShrink: 0
        }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setTab(id); reset() }} style={{
              flex: 1, padding: '9px 4px', borderRadius: '10px',
              border: 'none', cursor: 'pointer', fontSize: '13px',
              fontWeight: tab === id ? '600' : '400',
              background: tab === id ? 'var(--color-accent)' : 'var(--color-surface-2)',
              color: tab === id ? '#fff' : 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              transition: 'all 0.15s'
            }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{flex: 1, overflowY: 'auto', padding: '16px'}}>

          {/* Foto Tab */}
          {tab === 'foto' && !preview && (
            <div>
              <label style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '180px', borderRadius: '16px',
                border: '1.5px dashed var(--color-border)',
                background: 'var(--color-surface-2)',
                cursor: 'pointer', gap: '10px'
              }}>
                {imagePreview ? (
                  <img src={imagePreview} alt="" style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', borderRadius: '16px'
                  }} />
                ) : (
                  <>
                    <Camera size={32} color="var(--color-text-muted)" />
                    <span style={{fontSize: '14px', color: 'var(--color-text-muted)'}}>
                      {loading ? 'KI analysiert...' : 'Foto auswählen'}
                    </span>
                    {loading && (
                      <span style={{fontSize: '12px', color: 'var(--color-accent)'}}>
                        Das kann 10-20 Sekunden dauern
                      </span>
                    )}
                  </>
                )}
                <input
                  type="file" accept="image/*"
                  onChange={handleFotoImport}
                  style={{display: 'none'}}
                  disabled={loading}
                />
              </label>
              {loading && imagePreview && (
                <div style={{
                  marginTop: '12px', padding: '12px',
                  background: 'var(--color-accent-soft)',
                  borderRadius: '12px', textAlign: 'center'
                }}>
                  <div style={{fontSize: '13px', color: 'var(--color-accent-text)', fontWeight: '500'}}>
                    KI analysiert das Bild...
                  </div>
                  <div style={{fontSize: '12px', color: 'var(--color-accent-text)', marginTop: '4px', opacity: 0.8}}>
                    Erkennt Zutaten und Zubereitungsschritte
                  </div>
                </div>
              )}
            </div>
          )}

          {/* URL Tab */}
          {tab === 'url' && !preview && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <p style={{fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.5'}}>
                Rezept-URL eingeben — funktioniert mit lecker.de, essen.de, bbcgoodfood.com und anderen.
              </p>
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUrlImport()}
                placeholder="https://www.lecker.de/rezept/..."
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '12px', fontSize: '14px',
                  color: 'var(--color-text)', outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button onClick={handleUrlImport} disabled={loading || !urlInput.trim()} style={{
                padding: '13px', background: 'var(--color-accent)', color: '#fff',
                border: 'none', borderRadius: '12px', cursor: 'pointer',
                fontSize: '14px', fontWeight: '500',
                opacity: loading || !urlInput.trim() ? 0.6 : 1
              }}>
                {loading ? 'Lädt...' : 'Rezept laden'}
              </button>
            </div>
          )}

          {/* JSON Tab */}
          {tab === 'json' && !preview && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <p style={{fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.5'}}>
                Rezept als JSON einfügen — z.B. aus einem Export.
              </p>
              <textarea
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder='{"name": "Rezeptname", "ingredients": [...], "steps": [...]}'
                rows={8}
                style={{
                  width: '100%', padding: '12px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '12px', fontSize: '12px',
                  color: 'var(--color-text)', outline: 'none',
                  resize: 'none', boxSizing: 'border-box',
                  fontFamily: 'monospace', lineHeight: '1.5'
                }}
              />
              <button onClick={handleJsonImport} disabled={!jsonInput.trim()} style={{
                padding: '13px', background: 'var(--color-accent)', color: '#fff',
                border: 'none', borderRadius: '12px', cursor: 'pointer',
                fontSize: '14px', fontWeight: '500',
                opacity: !jsonInput.trim() ? 0.6 : 1
              }}>
                Vorschau anzeigen
              </button>
            </div>
          )}

          {/* Fehler */}
          {error && (
            <div style={{
              marginTop: '12px', padding: '12px 14px',
              background: '#fef2f2', border: '0.5px solid #fecaca',
              borderRadius: '12px', fontSize: '13px', color: '#991b1b'
            }}>
              {error}
            </div>
          )}

          {/* Vorschau */}
          {preview && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>

              {/* Erfolgs-Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 14px',
                background: '#f0fdf4', border: '0.5px solid #bbf7d0',
                borderRadius: '12px'
              }}>
                <Check size={18} color="#22c55e" strokeWidth={2.5} />
                <div>
                  <div style={{fontSize: '13px', fontWeight: '600', color: '#166534'}}>
                    Rezept erkannt
                  </div>
                  <div style={{fontSize: '11px', color: '#166534', opacity: 0.8, marginTop: '1px'}}>
                    Prüfe die Daten und speichere das Rezept
                  </div>
                </div>
              </div>

              {/* Name */}
              <div style={{
                background: 'var(--color-surface-2)',
                borderRadius: '12px', padding: '12px 14px',
                border: '0.5px solid var(--color-border)'
              }}>
                <div style={{
                  fontSize: '11px', fontWeight: '600',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px'
                }}>
                  Name
                </div>
                <div style={{fontSize: '15px', fontWeight: '600', color: 'var(--color-text)'}}>
                  {preview.name || 'Unbekanntes Rezept'}
                </div>
                {preview.category && (
                  <div style={{
                    fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px'
                  }}>
                    {preview.category}
                    {preview.servings ? ' · ' + preview.servings + ' Portionen' : ''}
                  </div>
                )}
              </div>

              {/* Zutaten */}
              {preview.ingredients && preview.ingredients.length > 0 && (
                <div style={{
                  background: 'var(--color-surface-2)',
                  borderRadius: '12px', padding: '12px 14px',
                  border: '0.5px solid var(--color-border)'
                }}>
                  <div style={{
                    fontSize: '11px', fontWeight: '600',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px'
                  }}>
                    Zutaten ({preview.ingredients.length})
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                    {preview.ingredients.map((ing, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', fontSize: '13px'
                      }}>
                        <span style={{color: 'var(--color-text)'}}>{ing.name}</span>
                        {(ing.amount || ing.unit) && (
                          <span style={{
                            color: 'var(--color-text-muted)', fontSize: '12px'
                          }}>
                            {ing.amount ? ing.amount + ' ' : ''}{ing.unit || ''}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Zubereitungsschritte */}
              {preview.steps && preview.steps.length > 0 && (
                <div style={{
                  background: 'var(--color-surface-2)',
                  borderRadius: '12px', padding: '12px 14px',
                  border: '0.5px solid var(--color-border)'
                }}>
                  <div style={{
                    fontSize: '11px', fontWeight: '600',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px',
                    display: 'flex', alignItems: 'center', gap: '5px'
                  }}>
                    <ChefHat size={12} />
                    Zubereitungsschritte ({preview.steps.length})
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    {preview.steps.map((step, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: '10px', alignItems: 'flex-start'
                      }}>
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '50%',
                          background: 'var(--color-accent)', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: '700', flexShrink: 0, marginTop: '1px'
                        }}>
                          {i + 1}
                        </div>
                        <p style={{
                          fontSize: '13px', color: 'var(--color-text)',
                          lineHeight: '1.5', margin: 0, flex: 1
                        }}>
                          {typeof step === 'string' ? step : step.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keine Schritte Warnung */}
              {(!preview.steps || preview.steps.length === 0) && (
                <div style={{
                  padding: '10px 14px',
                  background: '#fef3c7', border: '0.5px solid #fde68a',
                  borderRadius: '12px', fontSize: '12px', color: '#92400e'
                }}>
                  ⚠️ Keine Zubereitungsschritte erkannt — du kannst sie nach dem Import manuell hinzufügen.
                </div>
              )}

              {/* Buttons */}
              <div style={{display: 'flex', gap: '8px', paddingBottom: '16px'}}>
                <button onClick={reset} style={{
                  flex: 1, padding: '13px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '12px', cursor: 'pointer',
                  fontSize: '14px', color: 'var(--color-text-muted)'
                }}>
                  Neu versuchen
                </button>
                <button onClick={handleSave} disabled={loading} style={{
                  flex: 2, padding: '13px',
                  background: 'var(--color-accent)', color: '#fff',
                  border: 'none', borderRadius: '12px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '600',
                  opacity: loading ? 0.7 : 1
                }}>
                  {loading ? 'Speichert...' : 'Rezept speichern'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}