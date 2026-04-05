import { useState } from 'react'
import { useRecipeStore } from '../../store/useRecipeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { supabase } from '../../lib/supabase'
import { toast } from '../Toast'
import { X, Check, ChefHat } from 'lucide-react'

const TABS = [
  { id: 'foto', label: 'Foto & Kamera' },
  { id: 'text', label: 'Text einfügen' },
  { id: 'json', label: 'JSON' },
]

export default function ImportModal({ onClose }) {
  const { addRecipe } = useRecipeStore()
  const household = useAuthStore(s => s.household)
  const [tab, setTab] = useState('foto')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [textInput, setTextInput] = useState('')
  const [jsonInput, setJsonInput] = useState('')
  const [imagePreview, setImagePreview] = useState(null)

  const reset = () => {
    setPreview(null)
    setError('')
    setTextInput('')
    setJsonInput('')
    setImagePreview(null)
  }

  // Foto / Kamera Import
  const handleFotoImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    setError('')
    setPreview(null)
    setImagePreview(URL.createObjectURL(file))

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

  // Text-Import via Edge Function
  const handleTextImport = async () => {
    if (!textInput.trim()) return
    setLoading(true)
    setError('')
    setPreview(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('parse-recipe-text', {
        body: { text: textInput }
      })

      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)
      if (!data?.name && !data?.ingredients?.length) {
        throw new Error('Kein Rezept im Text gefunden')
      }

      setPreview(data)
    } catch (err) {
      setError('Fehler: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // JSON Import
  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      setPreview(parsed)
      setError('')
    } catch {
      setError('Ungültiges JSON Format')
    }
  }

  // Speichern
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
      background: 'rgba(0,0,0,0.4)', zIndex: 200,
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
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexShrink: 0
        }}>
          <span style={{fontWeight: '600', fontSize: '16px', color: 'var(--color-text)'}}>
            Rezept importieren
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', padding: '10px 14px', gap: '6px',
          borderBottom: '0.5px solid var(--color-border)', flexShrink: 0
        }}>
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => { setTab(id); reset() }} style={{
              flex: 1, padding: '8px 4px', borderRadius: '9px',
              border: 'none', cursor: 'pointer', fontSize: '12px',
              fontWeight: tab === id ? '500' : '400',
              background: tab === id ? 'var(--color-accent)' : 'var(--color-surface-2)',
              color: tab === id ? '#fff' : 'var(--color-text-muted)',
              transition: 'all 0.15s'
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{flex: 1, overflowY: 'auto', padding: '16px'}}>

          {/* Foto Tab */}
          {tab === 'foto' && !preview && (
            <div>
              <p style={{
                fontSize: '13px', color: 'var(--color-text-muted)',
                marginBottom: '14px', lineHeight: '1.6'
              }}>
                Fotografiere ein Rezept aus einem Kochbuch, mach einen Screenshot von
                Pinterest oder einer Rezeptseite — die KI erkennt Zutaten und Schritte automatisch.
              </p>

              <div style={{display: 'flex', gap: '10px', marginBottom: '14px'}}>
                {/* Kamera */}
                <label style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '22px 12px', borderRadius: '14px',
                  border: '0.5px solid var(--color-accent)',
                  background: 'var(--color-accent-soft)',
                  cursor: loading ? 'not-allowed' : 'pointer', gap: '8px'
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'var(--color-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{
                      fontSize: '13px', fontWeight: '500',
                      color: 'var(--color-accent-text)', marginBottom: '2px'
                    }}>
                      Foto aufnehmen
                    </div>
                    <div style={{fontSize: '11px', color: 'var(--color-accent-text)', opacity: 0.7}}>
                      Kamera öffnen
                    </div>
                  </div>
                  <input
                    type="file" accept="image/*" capture="environment"
                    onChange={handleFotoImport}
                    style={{display: 'none'}} disabled={loading}
                  />
                </label>

                {/* Galerie */}
                <label style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '22px 12px', borderRadius: '14px',
                  border: '0.5px solid var(--color-border)',
                  background: 'var(--color-surface-2)',
                  cursor: loading ? 'not-allowed' : 'pointer', gap: '8px'
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'var(--color-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '0.5px solid var(--color-border)'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="var(--color-text-muted)" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{
                      fontSize: '13px', fontWeight: '500',
                      color: 'var(--color-text)', marginBottom: '2px'
                    }}>
                      Aus Galerie
                    </div>
                    <div style={{fontSize: '11px', color: 'var(--color-text-muted)'}}>
                      Screenshot wählen
                    </div>
                  </div>
                  <input
                    type="file" accept="image/*"
                    onChange={handleFotoImport}
                    style={{display: 'none'}} disabled={loading}
                  />
                </label>
              </div>

              {/* Tipp */}
              <div style={{
                padding: '10px 13px',
                background: 'var(--color-surface-2)',
                borderRadius: '10px',
                border: '0.5px solid var(--color-border)'
              }}>
                <div style={{
                  fontSize: '12px', fontWeight: '500',
                  color: 'var(--color-text)', marginBottom: '4px'
                }}>
                  Tipp für Pinterest & Chefkoch
                </div>
                <div style={{fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.5'}}>
                  Rezeptseite öffnen → Screenshot machen → hier als Foto importieren.
                  Funktioniert mit jeder Seite die ein Rezept zeigt.
                </div>
              </div>

              {imagePreview && loading && (
                <div style={{marginTop: '12px'}}>
                  <div style={{
                    borderRadius: '12px', overflow: 'hidden',
                    marginBottom: '10px', position: 'relative'
                  }}>
                    <img src={imagePreview} alt="" style={{
                      width: '100%', height: '160px',
                      objectFit: 'cover', display: 'block'
                    }} />
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.45)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                      <div style={{fontSize: '13px', fontWeight: '500', color: '#fff'}}>
                        KI analysiert das Bild...
                      </div>
                      <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.7)'}}>
                        Erkennt Zutaten und Schritte
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text Tab */}
          {tab === 'text' && !preview && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <p style={{fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.6'}}>
                Kopiere den Rezepttext von einer Website, Pinterest, einer E-Mail oder
                tippe ihn ein — die KI extrahiert automatisch alle Zutaten und Schritte.
              </p>
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder={'Beispiel:\n\nSpaghetti Carbonara\n\nZutaten:\n200g Spaghetti\n100g Speck\n2 Eier\n...\n\nZubereitung:\n1. Wasser aufkochen...'}
                rows={10}
                style={{
                  width: '100%', padding: '12px 13px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '12px', fontSize: '13px',
                  color: 'var(--color-text)', outline: 'none',
                  resize: 'none', boxSizing: 'border-box', lineHeight: '1.6'
                }}
              />
              <button
                onClick={handleTextImport}
                disabled={loading || !textInput.trim()}
                style={{
                  padding: '13px',
                  background: 'var(--color-accent)', color: '#fff',
                  border: 'none', borderRadius: '12px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '500',
                  opacity: loading || !textInput.trim() ? 0.6 : 1
                }}
              >
                {loading ? 'KI analysiert...' : 'Rezept erkennen'}
              </button>

              <div style={{
                padding: '10px 13px',
                background: 'var(--color-surface-2)',
                borderRadius: '10px',
                border: '0.5px solid var(--color-border)'
              }}>
                <div style={{
                  fontSize: '12px', fontWeight: '500',
                  color: 'var(--color-text)', marginBottom: '3px'
                }}>
                  Funktioniert mit
                </div>
                <div style={{fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.5'}}>
                  Pinterest · Chefkoch · lecker.de · Instagram · Kochbücher · eigene Notizen · und vielem mehr
                </div>
              </div>
            </div>
          )}

          {/* JSON Tab */}
          {tab === 'json' && !preview && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <p style={{fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.5'}}>
                Rezept als JSON einfügen — für Exporte und technische Nutzer.
              </p>
              <textarea
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder='{"name": "Rezeptname", "ingredients": [...], "steps": [...]}'
                rows={10}
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
              <button
                onClick={handleJsonImport}
                disabled={!jsonInput.trim()}
                style={{
                  padding: '13px',
                  background: 'var(--color-accent)', color: '#fff',
                  border: 'none', borderRadius: '12px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '500',
                  opacity: !jsonInput.trim() ? 0.6 : 1
                }}
              >
                Vorschau anzeigen
              </button>
            </div>
          )}

          {/* Fehler */}
          {error && (
            <div style={{
              marginTop: '12px', padding: '11px 13px',
              background: 'var(--color-danger-soft)',
              border: '0.5px solid var(--color-danger)',
              borderRadius: '10px', fontSize: '13px',
              color: 'var(--color-danger)'
            }}>
              {error}
            </div>
          )}

          {/* Vorschau */}
          {preview && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 13px',
                background: 'var(--color-success-soft)',
                border: '0.5px solid var(--color-success)',
                borderRadius: '10px'
              }}>
                <Check size={16} color="var(--color-success)" strokeWidth={2.5} />
                <div>
                  <div style={{fontSize: '13px', fontWeight: '500', color: 'var(--color-success)'}}>
                    Rezept erkannt
                  </div>
                  <div style={{fontSize: '11px', color: 'var(--color-success)', opacity: 0.8}}>
                    Prüfe und speichere
                  </div>
                </div>
              </div>

              {/* Name */}
              <div style={{
                background: 'var(--color-surface-2)',
                borderRadius: '12px', padding: '11px 13px',
                border: '0.5px solid var(--color-border)'
              }}>
                <div style={{
                  fontSize: '10px', fontWeight: '500',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  marginBottom: '4px'
                }}>
                  Name
                </div>
                <div style={{fontSize: '15px', fontWeight: '500', color: 'var(--color-text)'}}>
                  {preview.name || 'Unbekanntes Rezept'}
                </div>
                {preview.category && (
                  <div style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '3px'}}>
                    {preview.category}
                    {preview.servings ? ' · ' + preview.servings + ' Portionen' : ''}
                  </div>
                )}
              </div>

              {/* Zutaten */}
              {preview.ingredients && preview.ingredients.length > 0 && (
                <div style={{
                  background: 'var(--color-surface-2)',
                  borderRadius: '12px', padding: '11px 13px',
                  border: '0.5px solid var(--color-border)'
                }}>
                  <div style={{
                    fontSize: '10px', fontWeight: '500',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    marginBottom: '8px'
                  }}>
                    Zutaten ({preview.ingredients.length})
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                    {preview.ingredients.map((ing, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{fontSize: '13px', color: 'var(--color-text)'}}>
                          {ing.name}
                        </span>
                        {(ing.amount || ing.unit) && (
                          <span style={{fontSize: '12px', color: 'var(--color-text-muted)'}}>
                            {ing.amount ? ing.amount + ' ' : ''}{ing.unit || ''}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schritte */}
              {preview.steps && preview.steps.length > 0 && (
                <div style={{
                  background: 'var(--color-surface-2)',
                  borderRadius: '12px', padding: '11px 13px',
                  border: '0.5px solid var(--color-border)'
                }}>
                  <div style={{
                    fontSize: '10px', fontWeight: '500',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    marginBottom: '8px',
                    display: 'flex', alignItems: 'center', gap: '5px'
                  }}>
                    <ChefHat size={11} />
                    Schritte ({preview.steps.length})
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '7px'}}>
                    {preview.steps.map((step, i) => (
                      <div key={i} style={{display: 'flex', gap: '8px', alignItems: 'flex-start'}}>
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '50%',
                          background: 'var(--color-accent)', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: '600',
                          flexShrink: 0, marginTop: '1px'
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

              {(!preview.steps || preview.steps.length === 0) && (
                <div style={{
                  padding: '10px 13px',
                  background: 'var(--color-warning-soft)',
                  border: '0.5px solid var(--color-warning)',
                  borderRadius: '10px', fontSize: '12px',
                  color: 'var(--color-warning)'
                }}>
                  Keine Schritte erkannt — nach dem Import manuell hinzufügen.
                </div>
              )}

              {/* Buttons */}
              <div style={{display: 'flex', gap: '8px', paddingBottom: '16px'}}>
                <button onClick={reset} style={{
                  flex: 1, padding: '13px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '12px', cursor: 'pointer',
                  fontSize: '13px', color: 'var(--color-text-muted)'
                }}>
                  Neu versuchen
                </button>
                <button onClick={handleSave} disabled={loading} style={{
                  flex: 2, padding: '13px',
                  background: 'var(--color-accent)', color: '#fff',
                  border: 'none', borderRadius: '12px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '500',
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