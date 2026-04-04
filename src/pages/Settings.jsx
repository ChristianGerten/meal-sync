import { useState } from 'react'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { Download, Upload, Database, ChevronRight } from 'lucide-react'

export default function Settings() {
  const household = useAuthStore(s => s.household)
  const { fetchRecipes } = useRecipeStore()
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [lastBackup, setLastBackup] = useState(
    localStorage.getItem('mealsync-last-backup') || null
  )

  const handleExport = async () => {
    setExporting(true)
    try {
      // Alle Rezepte mit Details laden
      const { data: recipes } = await supabase
        .from('recipes')
        .select('*, ingredients(*), recipe_steps(*)')
        .eq('household_id', household.id)
        .order('name')

      const backup = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        household: household.name,
        recipes: recipes || []
      }

      // Als JSON herunterladen
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mealsync-backup-' + new Date().toISOString().slice(0, 10) + '.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const now = new Date().toLocaleString('de-DE')
      localStorage.setItem('mealsync-last-backup', now)
      setLastBackup(now)
      toast.success(recipes.length + ' Rezepte exportiert')
    } catch (err) {
      toast.error('Export fehlgeschlagen: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)

    try {
      const text = await file.text()
      const backup = JSON.parse(text)

      if (!backup.recipes || !Array.isArray(backup.recipes)) {
        throw new Error('Ungültiges Backup-Format')
      }

      let imported = 0
      let skipped = 0

      for (const recipe of backup.recipes) {
        const { ingredients, recipe_steps, id, household_id, created_at, ...recipeData } = recipe

        // Prüfen ob Rezept bereits existiert
        const { data: existing } = await supabase
          .from('recipes')
          .select('id')
          .eq('household_id', household.id)
          .eq('name', recipeData.name)
          .single()

        if (existing) {
          skipped++
          continue
        }

        const { data: newRecipe, error } = await supabase
          .from('recipes')
          .insert({ ...recipeData, household_id: household.id })
          .select()
          .single()

        if (error || !newRecipe) continue

        if (ingredients?.length) {
          await supabase.from('ingredients').insert(
            ingredients
              .filter(i => i.name?.trim())
              .map(({ id, recipe_id, ...ing }) => ({
                ...ing, recipe_id: newRecipe.id
              }))
          )
        }

        if (recipe_steps?.length) {
          await supabase.from('recipe_steps').insert(
            recipe_steps
              .filter(s => s.description?.trim())
              .map(({ id, recipe_id, ...step }) => ({
                ...step, recipe_id: newRecipe.id
              }))
          )
        }

        imported++
      }

      await fetchRecipes(household.id, true)
      toast.success(imported + ' Rezepte importiert' + (skipped > 0 ? ', ' + skipped + ' übersprungen' : ''))
    } catch (err) {
      toast.error('Import fehlgeschlagen: ' + err.message)
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  return (
    <div style={{padding: '16px', paddingBottom: '80px'}}>

      <div style={{marginBottom: '24px'}}>
        <h1 style={{
          fontSize: '20px', fontWeight: '600',
          color: 'var(--color-text)', letterSpacing: '-0.3px'
        }}>
          Einstellungen
        </h1>
        <p style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '1px'}}>
          {household?.name}
        </p>
      </div>

      {/* Backup & Restore */}
      <div style={{marginBottom: '8px'}}>
        <div style={{
          fontSize: '11px', fontWeight: '500',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.5px',
          marginBottom: '8px', padding: '0 2px'
        }}>
          Backup & Wiederherstellung
        </div>

        <div style={{
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '14px', overflow: 'hidden'
        }}>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              width: '100%', padding: '14px 16px',
              background: 'none', border: 'none',
              borderBottom: '0.5px solid var(--color-border)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '12px', textAlign: 'left'
            }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '9px',
              background: 'var(--color-accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <Download size={17} color="var(--color-accent)" />
            </div>
            <div style={{flex: 1}}>
              <div style={{
                fontSize: '14px', fontWeight: '500',
                color: exporting ? 'var(--color-text-muted)' : 'var(--color-text)'
              }}>
                {exporting ? 'Exportiere...' : 'Rezepte exportieren'}
              </div>
              <div style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px'}}>
                {lastBackup
                  ? 'Letztes Backup: ' + lastBackup
                  : 'Alle Rezepte als JSON-Datei herunterladen'
                }
              </div>
            </div>
            <ChevronRight size={16} color="var(--color-text-muted)" />
          </button>

          {/* Import */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 16px', cursor: 'pointer',
            borderBottom: '0.5px solid var(--color-border)'
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '9px',
              background: 'var(--color-surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <Upload size={17} color="var(--color-text-muted)" />
            </div>
            <div style={{flex: 1}}>
              <div style={{
                fontSize: '14px', fontWeight: '500',
                color: importing ? 'var(--color-text-muted)' : 'var(--color-text)'
              }}>
                {importing ? 'Importiere...' : 'Backup wiederherstellen'}
              </div>
              <div style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px'}}>
                JSON-Backup-Datei laden
              </div>
            </div>
            <ChevronRight size={16} color="var(--color-text-muted)" />
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{display: 'none'}}
              disabled={importing}
            />
          </label>

          {/* Info */}
          <div style={{
            padding: '12px 16px',
            display: 'flex', alignItems: 'flex-start', gap: '10px'
          }}>
            <Database size={15} color="var(--color-text-muted)" style={{marginTop: '1px', flexShrink: 0}} />
            <p style={{
              fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.5'
            }}>
              Das Backup enthält alle Rezepte, Zutaten und Zubereitungsschritte.
              Bilder sind nicht enthalten. Beim Import werden bereits vorhandene
              Rezepte übersprungen.
            </p>
          </div>
        </div>
      </div>

      {/* App-Info */}
      <div style={{marginTop: '24px'}}>
        <div style={{
          fontSize: '11px', fontWeight: '500',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.5px',
          marginBottom: '8px', padding: '0 2px'
        }}>
          App-Info
        </div>
        <div style={{
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '14px', padding: '14px 16px'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>Version</span>
            <span style={{fontSize: '13px', color: 'var(--color-text)'}}>1.0.0</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>Haushalt</span>
            <span style={{fontSize: '13px', color: 'var(--color-text)'}}>{household?.name}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <span style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>Stack</span>
            <span style={{fontSize: '13px', color: 'var(--color-text)'}}>React + Supabase</span>
          </div>
        </div>
      </div>

    </div>
  )
}