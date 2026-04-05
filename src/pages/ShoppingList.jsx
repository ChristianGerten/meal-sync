import { useEffect, useState, useRef } from 'react'
import { Plus, RefreshCw, Trash2, EyeOff, Eye, X, Check } from 'lucide-react'
import { useShoppingStore, isBasicIngredient } from '../store/useShoppingStore'
import { usePlanStore } from '../store/usePlanStore'
import { useAuthStore } from '../store/useAuthStore'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { SkeletonShoppingGroup, SkeletonStyles } from '../components/Skeleton'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { useShoppingRealtime } from '../hooks/useShoppingRealtime'
import { useWakeLock } from '../hooks/useWakeLock'

const SUGGESTIONS_SUPERMARKET = [
  'Äpfel', 'Bananen', 'Orangen', 'Zitronen', 'Limetten', 'Erdbeeren', 'Himbeeren',
  'Blaubeeren', 'Brombeeren', 'Trauben', 'Wassermelone', 'Melone', 'Mango',
  'Ananas', 'Kiwi', 'Pfirsich', 'Nektarine', 'Pflaumen', 'Kirschen', 'Birnen',
  'Grapefruit', 'Clementinen', 'Mandarine', 'Feigen', 'Datteln', 'Granatapfel',
  'Tomaten', 'Cherrytomaten', 'Paprika', 'Zucchini', 'Gurke', 'Karotten',
  'Zwiebeln', 'Rote Zwiebeln', 'Frühlingszwiebeln', 'Knoblauch', 'Kartoffeln',
  'Süßkartoffeln', 'Brokkoli', 'Blumenkohl', 'Spinat', 'Salat', 'Rucola',
  'Feldsalat', 'Eisbergsalat', 'Champignons', 'Avocado', 'Aubergine',
  'Lauch', 'Staudensellerie', 'Fenchel', 'Rote Bete', 'Radieschen',
  'Rettich', 'Kohlrabi', 'Rosenkohl', 'Weißkohl', 'Rotkohl', 'Spitzkohl',
  'Wirsing', 'Chinakohl', 'Pak Choi', 'Mais', 'Erbsen', 'Bohnen',
  'Spargel', 'Artischocken', 'Ingwer', 'Chili', 'Jalapeños',
  'Petersilie', 'Basilikum', 'Schnittlauch', 'Koriander', 'Thymian', 'Rosmarin',
  'Minze', 'Salbei', 'Dill',
  'Hähnchenbrust', 'Hähnchenkeule', 'Hähnchenschenkel', 'Ganzes Hähnchen',
  'Hackfleisch (gemischt)', 'Rinderhack', 'Schweinehack',
  'Rindersteak', 'Schweinefilet', 'Schweinekotelett', 'Schweinebauch',
  'Rinderfilet', 'Rinderbraten', 'Lammkotelett', 'Lammhack',
  'Speck', 'Bauchspeck', 'Schinken', 'Kochschinken', 'Serranoschinken',
  'Parmaschinken', 'Salami', 'Chorizo', 'Bratwurst', 'Weißwurst',
  'Wiener Würstchen', 'Leberwurst',
  'Lachs', 'Lachsfilet', 'Räucherlachs', 'Thunfisch', 'Thunfisch (Dose)',
  'Kabeljau', 'Seelachs', 'Forelle', 'Dorade', 'Wolfsbarsch',
  'Sardinen', 'Sardinen (Dose)', 'Hering', 'Makrele', 'Garnelen',
  'Milch', 'Vollmilch', 'Fettarme Milch', 'Laktosefreie Milch', 'Hafermilch',
  'Mandelmilch', 'Sojamilch', 'Joghurt', 'Naturjoghurt',
  'Griechischer Joghurt', 'Fruchtjoghurt', 'Quark', 'Magerquark', 'Sahne',
  'Schlagsahne', 'Saure Sahne', 'Schmand', 'Butter', 'Eier', 'Bio-Eier',
  'Käse', 'Gouda', 'Emmentaler', 'Cheddar', 'Mozzarella', 'Büffelmozzarella',
  'Parmesan', 'Pecorino', 'Feta', 'Brie', 'Camembert', 'Ricotta',
  'Mascarpone', 'Frischkäse', 'Hüttenkäse', 'Skyr', 'Kefir', 'Buttermilch',
  'Brot', 'Vollkornbrot', 'Weißbrot', 'Sauerteigbrot', 'Dinkelbrot',
  'Brötchen', 'Vollkornbrötchen', 'Toastbrot', 'Vollkorntoast',
  'Baguette', 'Ciabatta', 'Laugenbrezeln', 'Croissants', 'Bagels',
  'Pita-Brot', 'Tortillas', 'Wraps', 'Knäckebrot',
  'Spaghetti', 'Penne', 'Fusilli', 'Rigatoni', 'Tagliatelle', 'Linguine',
  'Farfalle', 'Tortellini', 'Lasagneplatten', 'Gnocchi',
  'Vollkornnudeln', 'Reis', 'Basmati-Reis', 'Jasmin-Reis', 'Risotto-Reis',
  'Vollkornreis', 'Wildreis', 'Couscous', 'Bulgur', 'Quinoa', 'Hirse',
  'Polenta', 'Haferflocken', 'Müsli', 'Granola', 'Cornflakes',
  'Tomaten (Dose)', 'Geschälte Tomaten', 'Tomatenmark', 'Passata',
  'Kichererbsen (Dose)', 'Linsen (Dose)', 'Kidneybohnen (Dose)',
  'Weiße Bohnen (Dose)', 'Mais (Dose)', 'Erbsen (Dose)',
  'Kokosmilch (Dose)', 'Artischockenherzen', 'Oliven', 'Kapern',
  'Pesto', 'Tomatensauce', 'Hummus', 'Erdnussbutter', 'Mandelmus',
  'Marmelade', 'Senf', 'Ketchup', 'Mayonnaise', 'Sojasauce',
  'Mineralwasser', 'Stilles Wasser', 'Orangensaft', 'Apfelsaft',
  'Multivitaminsaft', 'Limonade', 'Cola', 'Eistee',
  'Kaffee', 'Kaffeebohnen', 'Filterkaffee', 'Espresso',
  'Tee', 'Grüntee', 'Schwarztee', 'Kräutertee',
  'Tiefkühlpizza', 'Tiefkühlgemüse', 'Erbsen (TK)', 'Spinat (TK)',
  'Brokkoli (TK)', 'Garnelen (TK)', 'Fischstäbchen', 'Pommes frites',
  'Eis', 'Eiscreme', 'Tiefkühlbeeren',
  'Schokolade', 'Vollmilchschokolade', 'Zartbitterschokolade',
  'Kekse', 'Chips', 'Salzstangen', 'Nüsse', 'Mandeln', 'Cashews',
  'Walnüsse', 'Erdnüsse', 'Pistazien', 'Trockenfrüchte', 'Rosinen',
]

const SUGGESTIONS_DRUGSTORE = [
  'Shampoo', 'Conditioner', 'Haarmaske', 'Trockenshampoo', 'Haarspray',
  'Duschgel', 'Badeschaum', 'Seife', 'Flüssigseife', 'Handseife',
  'Körperlotion', 'Bodylotion', 'Handcreme', 'Fußcreme', 'Peeling',
  'Gesichtscreme', 'Tagescreme', 'Nachtcreme', 'Augencreme', 'Serum',
  'Mizellenwasser', 'Gesichtsmaske', 'Make-up Entferner', 'Wattepads',
  'Foundation', 'Concealer', 'Mascara', 'Lippenstift', 'Lippenpflege',
  'Nagellack', 'Nagellackentferner', 'Sonnencreme LSF 30', 'Sonnencreme LSF 50',
  'Deo', 'Deo-Spray', 'Deo-Roll-on', 'Parfüm', 'Aftershave',
  'Rasierschaum', 'Rasierer', 'Rasierklinge',
  'Zahnpasta', 'Zahnbürste', 'Zahnseide', 'Mundspülung',
  'Tampons', 'Binden', 'Slipeinlagen', 'Windeln', 'Feuchttücher',
  'Babynahrung', 'Babyshampoo', 'Babycreme',
  'Waschmittel', 'Weichspüler', 'Spülmittel', 'Geschirrspültabs',
  'WC-Reiniger', 'Allzweckreiniger', 'Glasreiniger', 'Desinfektionsmittel',
  'Toilettenpapier', 'Küchenrolle', 'Taschentücher', 'Müllbeutel',
  'Alufolie', 'Frischhaltefolie', 'Backpapier', 'Schwämme',
  'Ibuprofen', 'Paracetamol', 'Hustensaft', 'Nasenspray', 'Pflaster',
  'Vitamin C', 'Vitamin D', 'Magnesium', 'Omega-3',
]

const SUPERMARKET_CATS = [
  'Obst & Gemüse', 'Fleisch & Fisch', 'Kühlregal', 'Milchprodukte',
  'Brot & Backwaren', 'Nudeln', 'Reis & Getreide', 'Konserven',
  'Gewürze', 'Backen', 'Getränke', 'Tiefkühl', 'Sonstiges'
]

const DRUGSTORE_CATS = [
  'Körperpflege', 'Haushalt', 'Gesundheit', 'Baby', 'Sonstiges (Drogerie)'
]

const UNITS = ['g', 'kg', 'ml', 'l', 'Stück', 'Packung', 'Dose', 'Flasche', 'Bund', 'EL', 'TL', 'Prise']
const DAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function SwipeItem({ item, onToggle, onDelete }) {
  const startX = useRef(null)
  const [offsetX, setOffsetX] = useState(0)
  const isDragging = useRef(false)

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    isDragging.current = true
  }

  const handleTouchMove = (e) => {
    if (!isDragging.current) return
    const dx = e.touches[0].clientX - startX.current
    setOffsetX(Math.max(-80, Math.min(80, dx)))
  }

  const handleTouchEnd = () => {
    isDragging.current = false
    if (offsetX > 60) onToggle(!item.is_checked)
    else if (offsetX < -60 && item.is_manual) onDelete()
    setOffsetX(0)
  }

  const formatAmount = (amount) => {
    if (!amount) return ''
    const n = Number(amount)
    return n % 1 === 0 ? String(n) : n.toFixed(1)
  }

  return (
    <div style={{position: 'relative', overflow: 'hidden'}}>
      {offsetX > 20 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: item.is_checked ? '#fef3c7' : '#f0fdf4',
          display: 'flex', alignItems: 'center', paddingLeft: '16px'
        }}>
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <polyline points="3,9 7,13 15,5"
              stroke={item.is_checked ? '#d97706' : '#16a34a'}
              strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
      )}
      {offsetX < -20 && item.is_manual && (
        <div style={{
          position: 'absolute', inset: 0, background: '#fef2f2',
          display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end', paddingRight: '16px'
        }}>
          <Trash2 size={18} color="#dc2626" />
        </div>
      )}

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '14px 14px',
          background: 'var(--color-surface)',
          transform: 'translateX(' + offsetX + 'px)',
          transition: isDragging.current ? 'none' : 'transform 0.2s ease',
          userSelect: 'none'
        }}
      >
        {/* 32px Checkbox */}
        <button
          onClick={() => onToggle(!item.is_checked)}
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: item.is_checked ? 'none' : '1.5px solid var(--color-border)',
            background: item.is_checked ? '#c1522a' : 'transparent',
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s'
          }}
        >
          {item.is_checked && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polyline points="2,7 6,11 12,3"
                stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          )}
        </button>

        <span style={{
          flex: 1, fontSize: '16px',
          color: item.is_checked ? 'var(--color-text-muted)' : 'var(--color-text)',
          textDecoration: item.is_checked ? 'line-through' : 'none',
          transition: 'all 0.15s'
        }}>
          {item.name}
        </span>

        {(item.amount || item.unit) && (
          <span style={{
            fontSize: '14px', fontWeight: '500',
            color: 'var(--color-text-muted)', flexShrink: 0
          }}>
            {formatAmount(item.amount)}{item.unit ? ' ' + item.unit : ''}
          </span>
        )}

        {item.is_manual && (
          <button onClick={() => onDelete()} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px', color: 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center', flexShrink: 0
          }}>
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  )
}

// Neu-laden Modal mit Tagesauswahl
function ReloadModal({ onClose, onGenerate, generating }) {
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)', zIndex: 200,
      display: 'flex', alignItems: 'flex-end'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        width: '100%', padding: '20px'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '16px'
        }}>
          <div>
            <div style={{fontSize: '16px', fontWeight: '600', color: 'var(--color-text)'}}>
              Liste neu laden
            </div>
            <div style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px'}}>
              Für welche Tage sollen Zutaten geladen werden?
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Tages-Chips */}
        <div style={{display: 'flex', gap: '6px', marginBottom: '16px'}}>
          {DAYS_SHORT.map((day, i) => (
            <button
              key={i}
              onClick={() => setSelectedDays(prev =>
                prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]
              )}
              style={{
                flex: 1, padding: '10px 4px',
                borderRadius: '10px', border: 'none',
                cursor: 'pointer', fontSize: '12px',
                fontWeight: selectedDays.includes(i) ? '600' : '400',
                background: selectedDays.includes(i)
                  ? '#c1522a' : 'var(--color-surface-2)',
                color: selectedDays.includes(i) ? '#fff' : 'var(--color-text-muted)',
                transition: 'all 0.15s'
              }}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Schnellauswahl */}
        <div style={{display: 'flex', gap: '8px', marginBottom: '16px'}}>
          {[
            { label: 'Mo–Mi', days: [0, 1, 2] },
            { label: 'Do–So', days: [3, 4, 5, 6] },
            { label: 'Ganze Woche', days: [0,1,2,3,4,5,6] },
          ].map(({ label, days }) => (
            <button
              key={label}
              onClick={() => setSelectedDays(days)}
              style={{
                flex: 1, padding: '8px 6px',
                borderRadius: '9px', border: '0.5px solid var(--color-border)',
                cursor: 'pointer', fontSize: '11px',
                background: 'var(--color-surface-2)',
                color: 'var(--color-text-muted)',
                transition: 'all 0.15s'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => onGenerate(selectedDays)}
          disabled={generating || selectedDays.length === 0}
          style={{
            width: '100%', padding: '14px',
            background: generating || selectedDays.length === 0
              ? 'var(--color-surface-2)' : '#c1522a',
            color: generating || selectedDays.length === 0
              ? 'var(--color-text-muted)' : '#fff',
            border: 'none', borderRadius: '12px', cursor: 'pointer',
            fontSize: '15px', fontWeight: '500',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px'
          }}
        >
          <RefreshCw size={15}
            style={{animation: generating ? 'spin 1s linear infinite' : 'none'}} />
          {generating ? 'Lädt...' : 'Liste generieren für ' + selectedDays.length + ' Tage'}
        </button>
      </div>
    </div>
  )
}

// Artikel hinzufügen Modal (FAB)
function AddItemModal({ onClose, onAdd, activeStore }) {
  const [newItem, setNewItem] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const computeSuggestions = (value) => {
    if (!value.trim()) { setSuggestions([]); setShowSuggestions(false); return }
    const lower = value.toLowerCase()
    const baseList = activeStore === 'drugstore' ? SUGGESTIONS_DRUGSTORE : SUGGESTIONS_SUPERMARKET
    const filtered = baseList
      .filter(s => s.toLowerCase().includes(lower) && s.toLowerCase() !== lower)
      .slice(0, 6)
    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
  }

  const handleSelectSuggestion = (suggestion) => {
    setNewItem(suggestion)
    setShowSuggestions(false)
    const lower = suggestion.toLowerCase()
    if (activeStore === 'supermarket') {
      if (['äpfel','bananen','tomaten','paprika','zucchini','gurke','karotten',
           'zwiebeln','knoblauch','kartoffeln','brokkoli','spinat','salat',
           'champignons','avocado','erdbeeren'
          ].some(v => lower.includes(v))) setNewCategory('Obst & Gemüse')
      else if (['hähnchen','hackfleisch','lachs','thunfisch','speck','schinken',
                'steak','filet','garnelen'
               ].some(v => lower.includes(v))) setNewCategory('Fleisch & Fisch')
      else if (['milch','joghurt','quark','sahne','eier','käse','mozzarella',
                'parmesan','frischkäse','schmand','butter'
               ].some(v => lower.includes(v))) setNewCategory('Kühlregal')
      else if (['spaghetti','penne','nudel','fusilli'].some(v => lower.includes(v))) setNewCategory('Nudeln')
      else if (['reis','couscous','quinoa','haferflocken'].some(v => lower.includes(v))) setNewCategory('Reis & Getreide')
      else if (['brot','brötchen','toast','baguette'].some(v => lower.includes(v))) setNewCategory('Brot & Backwaren')
      else if (['dose','kichererbsen','linsen','kokosmilch'].some(v => lower.includes(v))) setNewCategory('Konserven')
      else if (['saft','wasser','cola','tee','kaffee'].some(v => lower.includes(v))) setNewCategory('Getränke')
    } else {
      if (['shampoo','duschgel','seife','zahnpasta','deo','bodylotion','creme','parfüm'
          ].some(v => lower.includes(v))) setNewCategory('Körperpflege')
      else if (['waschmittel','spülmittel','reiniger','müllbeutel','toilettenpapier'
               ].some(v => lower.includes(v))) setNewCategory('Haushalt')
      else if (['ibuprofen','paracetamol','pflaster','nasenspray','vitamin'
               ].some(v => lower.includes(v))) setNewCategory('Gesundheit')
      else if (['windeln','feuchttücher','babynahrung'].some(v => lower.includes(v))) setNewCategory('Baby')
    }
  }

  const handleAdd = async () => {
    if (!newItem.trim()) return
    const defaultCat = activeStore === 'drugstore' ? 'Körperpflege' : 'Sonstiges'
    await onAdd(
      newItem.trim(),
      newAmount ? parseFloat(newAmount) : null,
      newUnit || null,
      newCategory || defaultCat
    )
    setNewItem('')
    setNewAmount('')
    setNewUnit('')
    setNewCategory('')
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
        width: '100%', padding: '16px'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '12px'
        }}>
          <span style={{fontSize: '15px', fontWeight: '600', color: 'var(--color-text)'}}>
            Artikel hinzufügen
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Name + Autocomplete */}
        <div style={{position: 'relative', marginBottom: '8px'}}>
          <input
            value={newItem}
            onChange={e => { setNewItem(e.target.value); computeSuggestions(e.target.value) }}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Artikel eingeben..."
            autoFocus
            style={{
              width: '100%', padding: '13px 14px',
              background: 'var(--color-surface-2)',
              border: '0.5px solid var(--color-border)',
              borderRadius: showSuggestions ? '12px 12px 0 0' : '12px',
              fontSize: '16px', color: 'var(--color-text)',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
          {showSuggestions && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderTop: 'none', borderRadius: '0 0 12px 12px',
              overflow: 'hidden'
            }}>
              {suggestions.map((suggestion, idx) => {
                const lower = newItem.toLowerCase()
                const matchIdx = suggestion.toLowerCase().indexOf(lower)
                return (
                  <button
                    key={suggestion}
                    onMouseDown={() => handleSelectSuggestion(suggestion)}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '12px 14px', background: 'none', border: 'none',
                      borderTop: idx > 0 ? '0.5px solid var(--color-border)' : 'none',
                      cursor: 'pointer', fontSize: '15px', color: 'var(--color-text)',
                      display: 'flex', alignItems: 'center', gap: '10px'
                    }}
                  >
                    <div style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: '#c1522a', flexShrink: 0, opacity: 0.5
                    }} />
                    <span>
                      {matchIdx >= 0 ? (
                        <>
                          {suggestion.slice(0, matchIdx)}
                          <span style={{fontWeight: '600', color: '#c1522a'}}>
                            {suggestion.slice(matchIdx, matchIdx + newItem.length)}
                          </span>
                          {suggestion.slice(matchIdx + newItem.length)}
                        </>
                      ) : suggestion}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Menge + Einheit + Kategorie */}
        <div style={{display: 'flex', gap: '8px', marginBottom: '12px'}}>
          <input
            value={newAmount}
            onChange={e => setNewAmount(e.target.value)}
            placeholder="Menge"
            type="number" min="0" step="0.1"
            style={{
              width: '80px', padding: '11px 10px',
              background: 'var(--color-surface-2)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '10px', fontSize: '14px',
              color: 'var(--color-text)', outline: 'none',
              textAlign: 'center', flexShrink: 0, boxSizing: 'border-box'
            }}
          />
          <select
            value={newUnit}
            onChange={e => setNewUnit(e.target.value)}
            style={{
              flex: 1, padding: '11px 8px',
              background: 'var(--color-surface-2)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '10px', fontSize: '13px',
              color: newUnit ? 'var(--color-text)' : 'var(--color-text-muted)',
              outline: 'none'
            }}
          >
            <option value="">Einheit</option>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            style={{
              flex: 1, padding: '11px 8px',
              background: 'var(--color-surface-2)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '10px', fontSize: '13px',
              color: newCategory ? 'var(--color-text)' : 'var(--color-text-muted)',
              outline: 'none'
            }}
          >
            <option value="">Kategorie</option>
            {(activeStore === 'drugstore' ? DRUGSTORE_CATS : SUPERMARKET_CATS).map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={{display: 'flex', gap: '8px'}}>
          <button
            onClick={handleAdd}
            disabled={!newItem.trim()}
            style={{
              flex: 1, padding: '14px',
              background: !newItem.trim() ? 'var(--color-surface-2)' : '#c1522a',
              color: !newItem.trim() ? 'var(--color-text-muted)' : '#fff',
              border: 'none', borderRadius: '12px',
              cursor: !newItem.trim() ? 'not-allowed' : 'pointer',
              fontSize: '15px', fontWeight: '500'
            }}
          >
            Hinzufügen
          </button>
          <button
            onClick={() => { handleAdd(); onClose() }}
            disabled={!newItem.trim()}
            style={{
              padding: '14px 16px',
              background: 'var(--color-surface-2)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '12px', cursor: 'pointer',
              fontSize: '13px', color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <Check size={14} /> Fertig
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ShoppingList() {
  const household = useAuthStore(s => s.household)
  const { currentPlan } = usePlanStore()
  const {
    fetchList, generateFromPlan, addManualItem,
    toggleItem, deleteItem, clearChecked,
    getGroupedItems, loading, items, drugstoreItems,
    list, drugList
  } = useShoppingStore()

  useOfflineSync()
  const isOffline = useShoppingStore(s => s.isOffline)
  useWakeLock(true)
  useShoppingRealtime(list?.id, drugList?.id)

  const [activeStore, setActiveStore] = useState('supermarket')
  const [generating, setGenerating] = useState(false)
  const [showReloadModal, setShowReloadModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBasics, setShowBasics] = useState(false)
  const [hideDone, setHideDone] = useState(false)

  useEffect(() => {
    if (household && currentPlan) {
      fetchList(household.id, currentPlan.id)
    }
  }, [household, currentPlan])

  const handleGenerate = async (selectedDays) => {
    setGenerating(true)
    try {
      const { data } = await supabase
        .from('meal_plan_entries')
        .select('*, recipes(id, name, servings, ingredients(*))')
        .eq('plan_id', currentPlan.id)

      const filtered = (data || []).filter(e =>
        e.meal_type === 'dinner' && selectedDays.includes(e.day_of_week - 1)
      )

      await generateFromPlan(filtered, household.id, currentPlan.id)
      toast.success('Liste für ' + selectedDays.sort().map(d => DAYS_SHORT[d]).join(', ') + ' generiert')
      setShowReloadModal(false)
    } finally {
      setGenerating(false)
    }
  }

  const handleAddItem = async (name, amount, unit, category) => {
    await addManualItem(name, amount, unit, category, activeStore)
  }

  const groups = getGroupedItems(activeStore, showBasics)

  const allItems = activeStore === 'drugstore'
    ? drugstoreItems
    : items.filter(i => showBasics || !isBasicIngredient(i.name))

  const totalItems = allItems.length
  const checkedItems = allItems.filter(i => i.is_checked).length
  const openItems = allItems.filter(i => !i.is_checked).length
  const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0
  const allDone = totalItems > 0 && checkedItems === totalItems
  const hiddenBasicsCount = activeStore === 'supermarket'
    ? items.filter(i => isBasicIngredient(i.name)).length : 0

  const drugstoreOpen = drugstoreItems.filter(i => !i.is_checked).length

  return (
    <div style={{paddingBottom: '100px', position: 'relative', minHeight: '100dvh'}}>

      {/* Header — kompakt */}
      <div style={{
        padding: '14px 16px',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-bg)',
        borderBottom: '0.5px solid var(--color-border)'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '10px'
        }}>
          {/* Titel + Status */}
          <div>
            <h1 style={{
              fontSize: '20px', fontWeight: '600',
              color: 'var(--color-text)', letterSpacing: '-0.3px'
            }}>
              {activeStore === 'drugstore' ? 'Drogerie' : 'Supermarkt'}
            </h1>
            <p style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '1px'}}>
              {totalItems === 0
                ? 'Leer'
                : allDone
                  ? 'Alles erledigt 🎉'
                  : openItems + ' offen · ' + checkedItems + ' erledigt'
              }
            </p>
          </div>

          {/* Rechte Aktionen */}
          <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>

            {/* Drogerie Badge-Button */}
            {activeStore === 'supermarket' ? (
              <button
                onClick={() => setActiveStore('drugstore')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '7px 10px',
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '10px', cursor: 'pointer',
                  fontSize: '12px', color: 'var(--color-text-muted)',
                  position: 'relative'
                }}
              >
                Drogerie
                {drugstoreOpen > 0 && (
                  <span style={{
                    background: '#5F5E5A', color: '#fff',
                    fontSize: '10px', fontWeight: '600',
                    padding: '1px 6px', borderRadius: '20px'
                  }}>
                    {drugstoreOpen}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setActiveStore('supermarket')}
                style={{
                  padding: '7px 10px',
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '10px', cursor: 'pointer',
                  fontSize: '12px', color: 'var(--color-text-muted)'
                }}
              >
                ← Supermarkt
              </button>
            )}

            {/* Erledigte ausblenden */}
            {checkedItems > 0 && (
              <button
                onClick={() => setHideDone(h => !h)}
                style={{
                  width: '34px', height: '34px', borderRadius: '9px',
                  background: hideDone ? 'var(--color-accent-soft)' : 'var(--color-surface)',
                  border: hideDone
                    ? '0.5px solid var(--color-accent)'
                    : '0.5px solid var(--color-border)',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: hideDone ? 'var(--color-accent)' : 'var(--color-text-muted)'
                }}
              >
                {hideDone ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            )}

            {/* Neu laden */}
            {activeStore === 'supermarket' && (
              <button
                onClick={() => setShowReloadModal(true)}
                disabled={!currentPlan}
                style={{
                  width: '34px', height: '34px',
                  background: 'var(--color-accent)',
                  border: 'none', borderRadius: '9px',
                  cursor: !currentPlan ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: !currentPlan ? 0.5 : 1
                }}
              >
                <RefreshCw size={15} color="#fff" />
              </button>
            )}
          </div>
        </div>

        {/* Fortschrittsbalken */}
        {totalItems > 0 && (
          <div style={{
            height: '3px', background: 'var(--color-surface-2)',
            borderRadius: '2px', overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: allDone ? '#22c55e' : activeStore === 'drugstore' ? '#5F5E5A' : '#c1522a',
              width: progressPercent + '%',
              borderRadius: '2px', transition: 'width 0.4s ease'
            }} />
          </div>
        )}
      </div>

      {/* Basis-Zutaten Toggle */}
      {activeStore === 'supermarket' && hiddenBasicsCount > 0 && (
        <div style={{padding: '8px 16px 0'}}>
          <button
            onClick={() => setShowBasics(s => !s)}
            style={{
              width: '100%', padding: '7px', background: 'none',
              border: '0.5px solid var(--color-border)',
              borderRadius: '9px', cursor: 'pointer',
              fontSize: '11px', color: 'var(--color-text-muted)'
            }}
          >
            {showBasics
              ? 'Basis-Zutaten ausblenden (' + hiddenBasicsCount + ')'
              : hiddenBasicsCount + ' Basis-Zutaten ausgeblendet (Öl, Gewürze...)'
            }
          </button>
        </div>
      )}

      {/* Offline Banner */}
      {isOffline && (
        <div style={{
          margin: '8px 16px 0', padding: '10px 14px',
          background: '#fef3c7', border: '0.5px solid #f59e0b',
          borderRadius: '10px', display: 'flex', alignItems: 'center',
          gap: '8px', fontSize: '13px', color: '#92400e'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#92400e" strokeWidth="2" strokeLinecap="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
          </svg>
          <span>Offline — Änderungen werden synchronisiert</span>
        </div>
      )}

      {/* Liste */}
      <div style={{padding: '12px 16px 0'}}>
        {loading ? (
          <>
            <SkeletonStyles />
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <SkeletonShoppingGroup />
              <SkeletonShoppingGroup />
            </div>
          </>
        ) : groups.length === 0 ? (
          <div style={{textAlign: 'center', padding: '48px 24px'}}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'var(--color-surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', fontSize: '24px'
            }}>🛒</div>
            <p style={{
              fontWeight: '500', fontSize: '15px',
              color: 'var(--color-text)', marginBottom: '6px'
            }}>
              {activeStore === 'drugstore' ? 'Drogerie-Liste leer' : 'Liste ist leer'}
            </p>
            <p style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>
              {activeStore === 'drugstore'
                ? 'Tippe + um Artikel hinzuzufügen'
                : 'Tippe ↺ um Zutaten aus dem Wochenplan zu laden'
              }
            </p>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            {groups.map(({ category, items: groupItems }) => {
              const openGroupItems = groupItems.filter(i => !i.is_checked)
              const doneGroupItems = groupItems.filter(i => i.is_checked)
              const allGroupDone = doneGroupItems.length === groupItems.length && groupItems.length > 0
              const visibleDone = hideDone ? [] : doneGroupItems

              if (hideDone && openGroupItems.length === 0) return null

              return (
                <div key={category}>
                  {/* Kategorie-Header mit Akzentbalken */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: '8px', marginBottom: '7px', padding: '0 2px'
                  }}>
                    <div style={{
                      width: '3px', height: '14px', borderRadius: '2px',
                      background: allGroupDone
                        ? 'var(--color-border)'
                        : activeStore === 'drugstore' ? '#5F5E5A' : '#c1522a',
                      flexShrink: 0,
                      transition: 'background 0.3s'
                    }} />
                    <span style={{
                      fontSize: '12px', fontWeight: '500',
                      color: allGroupDone
                        ? 'var(--color-text-muted)'
                        : 'var(--color-text)',
                      flex: 1
                    }}>
                      {category}
                    </span>
                    <span style={{
                      fontSize: '11px', color: 'var(--color-text-muted)',
                      background: allGroupDone ? '#f0fdf4' : 'var(--color-surface-2)',
                      padding: '1px 7px', borderRadius: '20px',
                      color: allGroupDone ? '#16a34a' : 'var(--color-text-muted)',
                      fontWeight: allGroupDone ? '500' : '400'
                    }}>
                      {allGroupDone ? '✓ ' : ''}{doneGroupItems.length}/{groupItems.length}
                    </span>
                  </div>

                  <div style={{
                    background: 'var(--color-surface)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '14px', overflow: 'hidden',
                    opacity: allGroupDone ? 0.55 : 1,
                    transition: 'opacity 0.3s'
                  }}>
                    {openGroupItems.map((item, idx) => (
                      <div key={item.id} style={{
                        borderTop: idx > 0 ? '0.5px solid var(--color-border)' : 'none'
                      }}>
                        <SwipeItem
                          item={item}
                          onToggle={(checked) => toggleItem(item.id, checked, activeStore)}
                          onDelete={() => deleteItem(item.id, activeStore)}
                        />
                      </div>
                    ))}

                    {visibleDone.length > 0 && openGroupItems.length > 0 && (
                      <div style={{height: '0.5px', background: 'var(--color-border)'}} />
                    )}

                    {visibleDone.map((item, idx) => (
                      <div key={item.id} style={{
                        borderTop: idx > 0 ? '0.5px solid var(--color-border)' : 'none'
                      }}>
                        <SwipeItem
                          item={item}
                          onToggle={(checked) => toggleItem(item.id, checked, activeStore)}
                          onDelete={() => deleteItem(item.id, activeStore)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {checkedItems > 0 && (
              <button
                onClick={() => clearChecked(activeStore)}
                style={{
                  width: '100%', padding: '11px', background: 'none',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '12px', cursor: 'pointer',
                  fontSize: '13px', color: 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '6px'
                }}
              >
                <Trash2 size={13} />
                {checkedItems} erledigte Artikel entfernen
              </button>
            )}

            {allDone && (
              <div style={{
                padding: '24px 20px',
                background: 'var(--color-accent-soft)',
                border: '0.5px solid var(--color-accent)',
                borderRadius: '14px', textAlign: 'center'
              }}>
                <div style={{fontSize: '32px', marginBottom: '10px'}}>🎉</div>
                <p style={{
                  fontWeight: '500', fontSize: '16px',
                  color: 'var(--color-accent-text)', marginBottom: '4px'
                }}>
                  Einkauf erledigt!
                </p>
                <p style={{fontSize: '13px', color: 'var(--color-accent-text)', opacity: 0.7}}>
                  Alle {totalItems} Artikel eingekauft
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB — Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        style={{
          position: 'fixed',
          bottom: '88px',
          right: '20px',
          width: '52px', height: '52px',
          borderRadius: '50%',
          background: activeStore === 'drugstore' ? '#5F5E5A' : '#c1522a',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 40,
          transition: 'transform 0.15s',
        }}
      >
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </button>

      {/* Modals */}
      {showReloadModal && (
        <ReloadModal
          onClose={() => setShowReloadModal(false)}
          onGenerate={handleGenerate}
          generating={generating}
        />
      )}

      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddItem}
          activeStore={activeStore}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}