import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'
import ImportModal from '../components/recipes/ImportModal'

const CATEGORIES = ['Alle', 'Pasta', 'Suppe', 'Salat', 'Fleisch', 'Fisch', 'Vegetarisch', 'Backen', 'Dessert']

export default function Recipes() {
  const household = useAuthStore(s => s.household)
  const { recipes, fetchRecipes, loading } = useRecipeStore()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Alle')
  const [showImport, setShowImport] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (household) fetchRecipes(household.id)
  }, [household])

  const filtered = recipes.filter(r => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase()) ||
      r.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchCategory =
      activeCategory === 'Alle' ||
      r.category?.toLowerCase() === activeCategory.toLowerCase() ||
      r.tags?.some(t => t.toLowerCase() === activeCategory.toLowerCase())
    return matchSearch && matchCategory
  })

  return (
    <div style={{padding: '16px'}}>

      {/* Suchleiste + Buttons */}
      <div style={{display: 'flex', gap: '8px', marginBottom: '12px'}}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '12px', padding: '0 12px'
        }}>
          <span style={{fontSize: '14px', color: 'var(--color-text-muted)'}}>🔍</span>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rezepte suchen..."
            style={{
              flex: 1, padding: '10px 0',
              background: 'none', border: 'none',
              fontSize: '14px', color: 'var(--color-text)',
              outline: 'none'
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'none', border: 'none',
              cursor: 'pointer', fontSize: '16px',
              color: 'var(--color-text-muted)'
            }}>×</button>
          )}
        </div>

        <button
          onClick={() => setShowImport(true)}
          title="Rezept importieren"
          style={{
            width: '42px', height: '42px',
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '12px', cursor: 'pointer',
            fontSize: '18px', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}
        >
          📥
        </button>

        <button
          onClick={() => navigate('/recipes/new')}
          title="Neues Rezept"
          style={{
            width: '42px', height: '42px',
            background: '#6c63ff', border: 'none',
            borderRadius: '12px', cursor: 'pointer',
            fontSize: '20px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#fff'
          }}
        >
          +
        </button>
      </div>

      {/* Kategorie-Filter */}
      <div style={{
        display: 'flex', gap: '6px',
        overflowX: 'auto', paddingBottom: '8px',
        marginBottom: '12px'
      }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            padding: '6px 12px', borderRadius: '20px',
            border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: '500',
            whiteSpace: 'nowrap', flexShrink: 0,
            background: activeCategory === cat ? '#6c63ff' : 'var(--color-surface)',
            color: activeCategory === cat ? '#fff' : 'var(--color-text-muted)',
            transition: 'all 0.15s'
          }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Anzahl */}
      {!loading && (
        <div style={{
          fontSize: '12px', color: 'var(--color-text-muted)',
          marginBottom: '12px'
        }}>
          {filtered.length} {filtered.length === 1 ? 'Rezept' : 'Rezepte'}
          {activeCategory !== 'Alle' && ` in ${activeCategory}`}
        </div>
      )}

      {/* Rezept Grid */}
      {loading ? (
        <div style={{textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)'}}>
          Lade Rezepte...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{textAlign: 'center', padding: '48px'}}>
          <div style={{fontSize: '48px', marginBottom: '12px'}}>👨‍🍳</div>
          <p style={{fontWeight: '500', color: 'var(--color-text)', marginBottom: '6px'}}>
            Noch keine Rezepte
          </p>
          <p style={{fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px'}}>
            Importiere dein erstes Rezept per Foto oder füge es manuell hinzu
          </p>
          <button onClick={() => setShowImport(true)} style={{
            padding: '10px 20px', background: '#6c63ff',
            color: '#fff', border: 'none', borderRadius: '10px',
            cursor: 'pointer', fontSize: '13px', fontWeight: '500'
          }}>
            📷 Rezept importieren
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px'
        }}>
          {filtered.map(recipe => (
            <button
              key={recipe.id}
              onClick={() => navigate(`/recipes/${recipe.id}`)}
              style={{
                background: 'var(--color-surface)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '14px', overflow: 'hidden',
                textAlign: 'left', cursor: 'pointer',
                transition: 'transform 0.1s'
              }}
            >
              {/* Bild */}
              <div style={{
                aspectRatio: '16/9',
                background: 'var(--color-surface-2)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '32px',
                overflow: 'hidden'
              }}>
                {recipe.image_url
                  ? <img
                      src={recipe.image_url} alt={recipe.name}
                      style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                  : '🍽️'
                }
              </div>

              {/* Info */}
              <div style={{padding: '10px'}}>
                <div style={{
                  fontWeight: '500', fontSize: '13px',
                  color: 'var(--color-text)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '1.3',
                  marginBottom: '4px'
                }}>
                  {recipe.name}
                </div>
                {recipe.category && (
                  <div style={{fontSize: '11px', color: 'var(--color-text-muted)'}}>
                    {recipe.category}
                    {recipe.cook_time && ` · ${recipe.cook_time} min`}
                  </div>
                )}
                {recipe.tags?.length > 0 && (
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '5px'}}>
                    {recipe.tags.slice(0, 2).map(tag => (
                      <span key={tag} style={{
                        fontSize: '10px', padding: '2px 6px',
                        background: 'var(--color-accent-soft)',
                        color: 'var(--color-accent-text)',
                        borderRadius: '20px'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showImport && (
        <ImportModal onClose={() => {
          setShowImport(false)
          if (household) fetchRecipes(household.id)
        }} />
      )}
    </div>
  )
}