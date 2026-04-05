import { useEffect, useState, useRef } from 'react'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useShoppingStore, isBasicIngredient } from '../store/useShoppingStore'
import { usePlanStore } from '../store/usePlanStore'
import { useAuthStore } from '../store/useAuthStore'
import { supabase } from '../lib/supabase'
import { toast } from '../components/Toast'
import { SkeletonShoppingGroup, SkeletonStyles } from '../components/Skeleton'
import { useOfflineSync } from '../hooks/useOfflineSync'

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
  'Shampoo', 'Conditioner', 'Haarmaske', 'Haarkur', 'Trockenshampoo',
  'Haarspülung', 'Haaröl', 'Haargel', 'Haarspray', 'Haarbürste',
  'Anti-Schuppen-Shampoo', 'Pflegeshampoo', 'Volumen-Shampoo',
  'Duschgel', 'Duschcreme', 'Badeschaum', 'Badeöl', 'Seife',
  'Flüssigseife', 'Handseife', 'Körperlotion', 'Bodylotion',
  'Körpercreme', 'Körperöl', 'Handcreme', 'Fußcreme', 'Peeling',
  'Gesichtscreme', 'Tagescreme', 'Nachtcreme', 'Augencreme', 'Serum',
  'Gesichtsserum', 'Mizellenwasser', 'Gesichtsmaske', 'Reinigungsmilch',
  'Gesichtsreinigung', 'Make-up Entferner', 'Abschminkpads', 'Wattepads',
  'Feuchtigkeitscreme', 'Foundation', 'Concealer', 'Puder', 'Rouge',
  'Lidschatten', 'Eyeliner', 'Mascara', 'Lippenstift', 'Lipgloss',
  'Lippenpflege', 'Nagellack', 'Nagellackentferner',
  'Sonnencreme', 'Sonnencreme LSF 30', 'Sonnencreme LSF 50',
  'After Sun Lotion', 'Selbstbräuner',
  'Deo', 'Deodorant', 'Deo-Spray', 'Deo-Roll-on', 'Deo-Stick',
  'Antitranspirant', 'Parfüm', 'Eau de Toilette', 'Bodyspray',
  'Aftershave', 'Rasierschaum', 'Rasiergel', 'Rasierer', 'Rasierklinge',
  'Zahnpasta', 'Kinderzahnpasta', 'Whitening Zahnpasta',
  'Zahnbürste', 'Elektrische Zahnbürste', 'Zahnbürstenköpfe',
  'Zahnseide', 'Interdentalbürsten', 'Mundspülung', 'Mundwasser',
  'Tampons', 'Binden', 'Slipeinlagen', 'Menstruationstasse',
  'Windeln', 'Feuchttücher', 'Babyfeuchttücher',
  'Babynahrung', 'Babyshampoo', 'Babyöl', 'Babycreme', 'Wundschutzcreme',
  'Waschmittel', 'Vollwaschmittel', 'Colorwaschmittel', 'Feinwaschmittel',
  'Flüssigwaschmittel', 'Waschmittelpods', 'Weichspüler', 'Fleckentferner',
  'Spülmittel', 'Geschirrspültabs', 'Spülmaschinentabs', 'Klarspüler',
  'WC-Reiniger', 'WC-Steine', 'Badreiniger', 'Scheuermilch',
  'Allzweckreiniger', 'Küchenreiniger', 'Glasreiniger',
  'Desinfektionsmittel', 'Desinfektionsspray', 'Handdesinfektionsmittel',
  'Entkalker', 'Backofenreiniger', 'Rohrreiniger',
  'Toilettenpapier', 'Küchenrolle', 'Taschentücher', 'Servietten',
  'Müllbeutel', 'Müllsäcke', 'Biomüllbeutel', 'Frischhaltebeutel',
  'Gefrierbeutel', 'Alufolie', 'Frischhaltefolie', 'Backpapier',
  'Haushaltshandschuhe', 'Schwämme', 'Mikrofasertücher', 'Putztücher',
  'Ibuprofen', 'Paracetamol', 'Aspirin', 'Hustensaft', 'Hustendrops',
  'Halstabletten', 'Nasenspray', 'Augentropfen', 'Magentabletten',
  'Vitamin C', 'Vitamin D', 'Multivitamin', 'Zink', 'Magnesium', 'Omega-3',
  'Pflaster', 'Wundverband', 'Mullbinden', 'Wundsalbe', 'Bepanthen',
  'Thermometer', 'Kondome', 'Schwangerschaftstest',
  'Kontaktlinsen', 'Kontaktlinsenpflegemittel',
  'Hundefutter', 'Katzenfutter', 'Tiersnacks', 'Katzenstreu',
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

function SwipeItem({ item, onToggle, onDelete, accentColor }) {
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
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <polyline
              points="3,9 7,13 15,5"
              stroke={item.is_checked ? '#d97706' : '#16a34a'}
              strokeWidth="2.5" strokeLinecap="round"
            />
          </svg>
        </div>
      )}
      {offsetX < -20 && item.is_manual && (
        <div style={{
          position: 'absolute', inset: 0, background: '#fef2f2',
          display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end', paddingRight: '16px'
        }}>
          <Trash2 size={16} color="#dc2626" />
        </div>
      )}

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '13px 14px',
          background: 'var(--color-surface)',
          transform: 'translateX(' + offsetX + 'px)',
          transition: isDragging.current ? 'none' : 'transform 0.2s ease',
          userSelect: 'none'
        }}
      >
        <button
          onClick={() => onToggle(!item.is_checked)}
          style={{
            width: '24px', height: '24px', borderRadius: '50%',
            border: item.is_checked ? 'none' : '1.5px solid var(--color-border)',
            background: item.is_checked ? accentColor : 'transparent',
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s'
          }}
        >
          {item.is_checked && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <polyline
                points="2,6 5,9 10,3"
                stroke="#fff" strokeWidth="2.5" strokeLinecap="round"
              />
            </svg>
          )}
        </button>

        <span style={{
          flex: 1, fontSize: '15px',
          color: item.is_checked ? 'var(--color-text-muted)' : 'var(--color-text)',
          textDecoration: item.is_checked ? 'line-through' : 'none',
          transition: 'all 0.15s'
        }}>
          {item.name}
        </span>

        {(item.amount || item.unit) && (
          <span style={{
            fontSize: '13px', fontWeight: '500',
            color: 'var(--color-text-muted)', flexShrink: 0
          }}>
            {formatAmount(item.amount)}{item.unit ? ' ' + item.unit : ''}
          </span>
        )}

        {item.is_manual && (
          <button
            onClick={() => onDelete()}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px', color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', flexShrink: 0
            }}
          >
            <Trash2 size={14} />
          </button>
        )}
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
    getGroupedItems, loading, items, drugstoreItems
  } = useShoppingStore()

  useOfflineSync()
  const isOffline = useShoppingStore(s => s.isOffline)

  const [activeStore, setActiveStore] = useState('supermarket')
  const [newItem, setNewItem] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [generating, setGenerating] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBasics, setShowBasics] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6])

  useEffect(() => {
    if (household && currentPlan) {
      fetchList(household.id, currentPlan.id)
    }
  }, [household, currentPlan])

  const handleGenerate = async () => {
  setGenerating(true)
  try {
    const { data } = await supabase
      .from('meal_plan_entries')
      .select('*, recipes(id, name, servings, ingredients(*))')
      .eq('plan_id', currentPlan.id)

    // Nur gewählte Tage — day_of_week ist 1-basiert
    const filtered = (data || []).filter(e =>
      e.meal_type === 'dinner' && selectedDays.includes(e.day_of_week - 1)
    )

    await generateFromPlan(filtered, household.id, currentPlan.id)

    const dayLabels = selectedDays.sort().map(d => DAYS_SHORT[d]).join(', ')
    toast.success('Liste für ' + dayLabels + ' generiert')
  } finally {
    setGenerating(false)
  }
}

  const computeSuggestions = (value) => {
    if (!value.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const lower = value.toLowerCase()
    const baseList = activeStore === 'drugstore'
      ? SUGGESTIONS_DRUGSTORE
      : SUGGESTIONS_SUPERMARKET

    const existingNames = (activeStore === 'drugstore' ? drugstoreItems : items)
      .map(i => i.name)

    const allSuggestions = [...new Set([...baseList, ...existingNames])]
    const filtered = allSuggestions
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
      if (['äpfel','bananen','orangen','tomaten','paprika','zucchini','gurke',
           'karotten','zwiebeln','knoblauch','kartoffeln','brokkoli','spinat',
           'salat','champignons','avocado','erdbeeren','trauben','zitronen'
          ].some(v => lower.includes(v))) {
        setNewCategory('Obst & Gemüse')
      } else if (['hähnchen','hackfleisch','lachs','thunfisch','speck','schinken',
                  'steak','filet','garnelen','fisch'
          ].some(v => lower.includes(v))) {
        setNewCategory('Fleisch & Fisch')
      } else if (['milch','joghurt','quark','sahne','eier','käse','mozzarella',
                  'parmesan','frischkäse','schmand','butter','skyr'
          ].some(v => lower.includes(v))) {
        setNewCategory('Kühlregal')
      } else if (['spaghetti','penne','nudel','fusilli','rigatoni','tagliatelle'
          ].some(v => lower.includes(v))) {
        setNewCategory('Nudeln')
      } else if (['reis','couscous','quinoa','haferflocken','bulgur','hirse'
          ].some(v => lower.includes(v))) {
        setNewCategory('Reis & Getreide')
      } else if (['brot','brötchen','toast','baguette','ciabatta'
          ].some(v => lower.includes(v))) {
        setNewCategory('Brot & Backwaren')
      } else if (['dose','kichererbsen','linsen','kidney','kokosmilch','passata'
          ].some(v => lower.includes(v))) {
        setNewCategory('Konserven')
      } else if (['saft','wasser','mineralwasser','cola','tee','kaffee'
          ].some(v => lower.includes(v))) {
        setNewCategory('Getränke')
      } else if (['tk','tiefkühl','eis','eiscreme','pommes'
          ].some(v => lower.includes(v))) {
        setNewCategory('Tiefkühl')
      }
    } else {
      if (['shampoo','conditioner','duschgel','seife','zahnpasta','deo',
           'bodylotion','gesichtscreme','sonnencreme','rasierschaum','parfüm'
          ].some(v => lower.includes(v))) {
        setNewCategory('Körperpflege')
      } else if (['waschmittel','weichspüler','spülmittel','reiniger',
                  'müllbeutel','küchenrolle','toilettenpapier','taschentücher'
          ].some(v => lower.includes(v))) {
        setNewCategory('Haushalt')
      } else if (['ibuprofen','paracetamol','pflaster','nasenspray','vitamin'
          ].some(v => lower.includes(v))) {
        setNewCategory('Gesundheit')
      } else if (['windeln','feuchttücher','babynahrung','babyshampoo'
          ].some(v => lower.includes(v))) {
        setNewCategory('Baby')
      }
    }
  }

  const handleAddItem = async () => {
    if (!newItem.trim()) return
    const defaultCat = activeStore === 'drugstore' ? 'Körperpflege' : 'Sonstiges'
    await addManualItem(
      newItem.trim(),
      newAmount ? parseFloat(newAmount) : null,
      newUnit || null,
      newCategory || defaultCat,
      activeStore
    )
    setNewItem('')
    setNewAmount('')
    setNewUnit('')
    setNewCategory('')
    setShowAddForm(false)
    setShowSuggestions(false)
  }

  const groups = getGroupedItems(activeStore, showBasics)

  const allItems = activeStore === 'drugstore'
    ? drugstoreItems
    : items.filter(i => showBasics || !isBasicIngredient(i.name))

  const totalItems = allItems.length
  const checkedItems = allItems.filter(i => i.is_checked).length
  const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0
  const allDone = totalItems > 0 && checkedItems === totalItems
  const hiddenBasicsCount = activeStore === 'supermarket'
    ? items.filter(i => isBasicIngredient(i.name)).length
    : 0

  const accentColor = activeStore === 'drugstore' ? '#5F5E5A' : 'var(--color-accent)'

  return (
    <div style={{paddingBottom: '80px'}}>

      {/* Header */}
      <div style={{
        padding: '16px 16px 0',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-bg)'
      }}>

        {/* Titel + Neu laden */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '10px'
        }}>
          <div>
            <h1 style={{
              fontSize: '20px', fontWeight: '600',
              color: 'var(--color-text)', letterSpacing: '-0.3px'
            }}>
              Einkauf
            </h1>
            <p style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '1px'}}>
              {totalItems === 0
                ? 'Leer'
                : allDone
                  ? 'Alles erledigt'
                  : checkedItems + ' von ' + totalItems + ' · ' + progressPercent + '%'
              }
            </p>
          </div>
          {activeStore === 'supermarket' && (
            <button
              onClick={handleGenerate}
              disabled={generating || !currentPlan}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '8px 12px',
                background: generating ? 'var(--color-surface-2)' : 'var(--color-accent)',
                color: generating ? 'var(--color-text-muted)' : '#fff',
                border: 'none', borderRadius: '10px',
                cursor: generating || !currentPlan ? 'not-allowed' : 'pointer',
                fontSize: '12px', fontWeight: '500'
              }}
            >
              <RefreshCw
                size={13}
                style={{animation: generating ? 'spin 1s linear infinite' : 'none'}}
              />
              {generating ? 'Lädt...' : 'Neu laden'}
            </button>
          )}
        </div>

        {/* Tagesauswahl — nur Supermarkt */}
{activeStore === 'supermarket' && (
  <div style={{
    background: 'var(--color-surface)',
    border: '0.5px solid var(--color-border)',
    borderRadius: '12px', padding: '10px 14px',
    marginBottom: '10px'
  }}>
    <div style={{
      fontSize: '12px', color: 'var(--color-text-muted)',
      marginBottom: '8px'
    }}>
      Für welche Tage einkaufen?
    </div>
    <div style={{display: 'flex', gap: '5px'}}>
      {DAYS_SHORT.map((day, i) => (
        <button
          key={i}
          onClick={() => {
            setSelectedDays(prev =>
              prev.includes(i)
                ? prev.filter(d => d !== i)
                : [...prev, i]
            )
          }}
          style={{
            flex: 1, padding: '6px 2px',
            borderRadius: '8px', border: 'none',
            cursor: 'pointer', fontSize: '11px',
            fontWeight: selectedDays.includes(i) ? '600' : '400',
            background: selectedDays.includes(i)
              ? 'var(--color-accent)'
              : 'var(--color-surface-2)',
            color: selectedDays.includes(i) ? '#fff' : 'var(--color-text-muted)',
            transition: 'all 0.15s'
          }}
        >
          {day}
        </button>
      ))}
    </div>
  </div>
)}

        {/* Store Tabs */}
        <div style={{display: 'flex', gap: '6px', marginBottom: '10px'}}>
          <button
            onClick={() => setActiveStore('supermarket')}
            style={{
              flex: 1, padding: '9px', borderRadius: '10px', cursor: 'pointer',
              background: activeStore === 'supermarket' ? 'var(--color-accent)' : 'var(--color-surface)',
              color: activeStore === 'supermarket' ? '#fff' : 'var(--color-text-muted)',
              fontSize: '13px', fontWeight: activeStore === 'supermarket' ? '500' : '400',
              border: activeStore === 'supermarket' ? 'none' : '0.5px solid var(--color-border)',
              transition: 'all 0.15s'
            }}
          >
            Supermarkt
            {items.filter(i => !i.is_checked && (showBasics || !isBasicIngredient(i.name))).length > 0 && (
              <span style={{
                marginLeft: '6px', fontSize: '11px',
                background: activeStore === 'supermarket' ? 'rgba(255,255,255,0.25)' : 'var(--color-surface-2)',
                padding: '1px 6px', borderRadius: '20px'
              }}>
                {items.filter(i => !i.is_checked && (showBasics || !isBasicIngredient(i.name))).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveStore('drugstore')}
            style={{
              flex: 1, padding: '9px', borderRadius: '10px', cursor: 'pointer',
              background: activeStore === 'drugstore' ? '#5F5E5A' : 'var(--color-surface)',
              color: activeStore === 'drugstore' ? '#fff' : 'var(--color-text-muted)',
              fontSize: '13px', fontWeight: activeStore === 'drugstore' ? '500' : '400',
              border: activeStore === 'drugstore' ? 'none' : '0.5px solid var(--color-border)',
              transition: 'all 0.15s'
            }}
          >
            Drogerie
            {drugstoreItems.filter(i => !i.is_checked).length > 0 && (
              <span style={{
                marginLeft: '6px', fontSize: '11px',
                background: activeStore === 'drugstore' ? 'rgba(255,255,255,0.25)' : 'var(--color-surface-2)',
                padding: '1px 6px', borderRadius: '20px'
              }}>
                {drugstoreItems.filter(i => !i.is_checked).length}
              </span>
            )}
          </button>
        </div>

        {/* Fortschrittsbalken */}
        {totalItems > 0 && (
          <div style={{
            height: '3px', background: 'var(--color-surface-2)',
            borderRadius: '2px', overflow: 'hidden', marginBottom: '10px'
          }}>
            <div style={{
              height: '100%',
              background: allDone ? '#22c55e' : accentColor,
              width: progressPercent + '%',
              borderRadius: '2px', transition: 'width 0.4s ease'
            }} />
          </div>
        )}

        {/* Artikel hinzufügen */}
        {showAddForm ? (
          <div style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '12px', padding: '10px',
            marginBottom: '10px',
            display: 'flex', flexDirection: 'column', gap: '7px'
          }}>

            {/* Name + Autocomplete */}
            <div style={{position: 'relative'}}>
              <input
                value={newItem}
                onChange={e => {
                  setNewItem(e.target.value)
                  computeSuggestions(e.target.value)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { handleAddItem(); setShowSuggestions(false) }
                  if (e.key === 'Escape') setShowSuggestions(false)
                }}
                onFocus={() => newItem.length > 0 && computeSuggestions(newItem)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Artikel eingeben..."
                autoFocus
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: showSuggestions ? '9px 9px 0 0' : '9px',
                  fontSize: '14px', color: 'var(--color-text)',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
              {showSuggestions && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderTop: 'none', borderRadius: '0 0 9px 9px',
                  overflow: 'hidden'
                }}>
                  {suggestions.map((suggestion, idx) => {
                    const lower = newItem.toLowerCase()
                    const sLower = suggestion.toLowerCase()
                    const matchIdx = sLower.indexOf(lower)
                    return (
                      <button
                        key={suggestion}
                        onMouseDown={() => handleSelectSuggestion(suggestion)}
                        style={{
                          width: '100%', textAlign: 'left',
                          padding: '10px 12px', background: 'none', border: 'none',
                          borderTop: idx > 0 ? '0.5px solid var(--color-border)' : 'none',
                          cursor: 'pointer', fontSize: '14px', color: 'var(--color-text)',
                          display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                      >
                        <div style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: accentColor, flexShrink: 0, opacity: 0.6
                        }} />
                        <span>
                          {matchIdx >= 0 ? (
                            <>
                              {suggestion.slice(0, matchIdx)}
                              <span style={{fontWeight: '600', color: accentColor}}>
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

            {/* Menge + Einheit */}
            <div style={{display: 'flex', gap: '7px'}}>
              <input
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
                placeholder="Menge"
                type="number"
                min="0"
                step="0.1"
                style={{
                  width: '80px', padding: '9px 10px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '9px', fontSize: '13px',
                  color: 'var(--color-text)', outline: 'none',
                  textAlign: 'center', flexShrink: 0,
                  boxSizing: 'border-box'
                }}
              />
              <select
                value={newUnit}
                onChange={e => setNewUnit(e.target.value)}
                style={{
                  flex: 1, padding: '9px 8px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '9px', fontSize: '13px',
                  color: newUnit ? 'var(--color-text)' : 'var(--color-text-muted)',
                  outline: 'none'
                }}
              >
                <option value="">Einheit (optional)</option>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {/* Kategorie */}
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              style={{
                padding: '8px 10px',
                background: 'var(--color-surface-2)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '9px', fontSize: '13px',
                color: newCategory ? 'var(--color-text)' : 'var(--color-text-muted)',
                outline: 'none'
              }}
            >
              <option value="">Kategorie wählen...</option>
              {(activeStore === 'drugstore' ? DRUGSTORE_CATS : SUPERMARKET_CATS).map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <div style={{display: 'flex', gap: '7px'}}>
              <button
                onClick={() => { handleAddItem(); setShowSuggestions(false) }}
                style={{
                  flex: 1, padding: '9px',
                  background: accentColor, color: '#fff',
                  border: 'none', borderRadius: '9px',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '500'
                }}
              >
                Hinzufügen
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewItem('')
                  setNewAmount('')
                  setNewUnit('')
                  setShowSuggestions(false)
                }}
                style={{
                  padding: '9px 12px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '9px', cursor: 'pointer',
                  fontSize: '13px', color: 'var(--color-text-muted)'
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              width: '100%', padding: '10px',
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '10px', cursor: 'pointer',
              fontSize: '13px', color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '10px'
            }}
          >
            <div style={{
              width: '20px', height: '20px', borderRadius: '5px',
              background: activeStore === 'drugstore'
                ? 'rgba(95,94,90,0.1)'
                : 'var(--color-accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Plus size={13} color={accentColor} />
            </div>
            Artikel hinzufügen...
          </button>
        )}

        {/* Basis-Zutaten Toggle */}
        {activeStore === 'supermarket' && hiddenBasicsCount > 0 && (
          <button
            onClick={() => setShowBasics(s => !s)}
            style={{
              width: '100%', padding: '7px',
              background: 'none',
              border: '0.5px solid var(--color-border)',
              borderRadius: '9px', cursor: 'pointer',
              fontSize: '11px', color: 'var(--color-text-muted)',
              marginBottom: '10px'
            }}
          >
            {showBasics
              ? 'Basis-Zutaten ausblenden (' + hiddenBasicsCount + ')'
              : hiddenBasicsCount + ' Basis-Zutaten ausgeblendet (Öl, Gewürze...)'
            }
          </button>
        )}
      </div>

      {/* Offline Banner */}
      {isOffline && (
        <div style={{
          margin: '0 16px 10px',
          padding: '10px 14px',
          background: '#fef3c7',
          border: '0.5px solid #f59e0b',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '13px', color: '#92400e'
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
      <div style={{padding: '0 16px'}}>
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
            }}>
              🛒
            </div>
            <p style={{
              fontWeight: '500', fontSize: '15px',
              color: 'var(--color-text)', marginBottom: '6px'
            }}>
              {activeStore === 'drugstore' ? 'Drogerie-Liste leer' : 'Liste ist leer'}
            </p>
            <p style={{fontSize: '13px', color: 'var(--color-text-muted)'}}>
              {activeStore === 'drugstore'
                ? 'Füge Artikel manuell hinzu'
                : 'Plane Gerichte und lade die Liste neu'
              }
            </p>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {groups.map(({ category, items: groupItems }) => {
              const checkedInGroup = groupItems.filter(i => i.is_checked).length
              const allGroupDone = checkedInGroup === groupItems.length && groupItems.length > 0
              const openItems = groupItems.filter(i => !i.is_checked)
              const doneItems = groupItems.filter(i => i.is_checked)

              return (
                <div key={category}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px', padding: '0 2px'
                  }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '500',
                      color: allGroupDone ? 'var(--color-text-muted)' : 'var(--color-text)',
                      textTransform: 'uppercase', letterSpacing: '0.4px'
                    }}>
                      {category}
                    </span>
                    <span style={{fontSize: '11px', color: 'var(--color-text-muted)'}}>
                      {checkedInGroup}/{groupItems.length}
                    </span>
                  </div>

                  <div style={{
                    background: 'var(--color-surface)',
                    border: '0.5px solid var(--color-border)',
                    borderRadius: '12px', overflow: 'hidden',
                    opacity: allGroupDone ? 0.6 : 1,
                    transition: 'opacity 0.3s'
                  }}>
                    {openItems.map((item, idx) => (
                      <div key={item.id} style={{
                        borderTop: idx > 0 ? '0.5px solid var(--color-border)' : 'none'
                      }}>
                        <SwipeItem
                          item={item}
                          accentColor={accentColor}
                          onToggle={(checked) => toggleItem(item.id, checked, activeStore)}
                          onDelete={() => deleteItem(item.id, activeStore)}
                        />
                      </div>
                    ))}

                    {doneItems.length > 0 && openItems.length > 0 && (
                      <div style={{height: '0.5px', background: 'var(--color-border)'}} />
                    )}

                    {doneItems.map((item, idx) => (
                      <div key={item.id} style={{
                        borderTop: idx > 0 ? '0.5px solid var(--color-border)' : 'none'
                      }}>
                        <SwipeItem
                          item={item}
                          accentColor={accentColor}
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
                  width: '100%', padding: '10px',
                  background: 'none',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '10px', cursor: 'pointer',
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
                padding: '20px',
                background: 'var(--color-accent-soft)',
                border: '0.5px solid var(--color-accent)',
                borderRadius: '14px', textAlign: 'center'
              }}>
                <div style={{fontSize: '28px', marginBottom: '8px'}}>🎉</div>
                <p style={{
                  fontWeight: '500', fontSize: '14px',
                  color: 'var(--color-accent-text)', marginBottom: '3px'
                }}>
                  Einkauf erledigt!
                </p>
                <p style={{fontSize: '12px', color: 'var(--color-accent-text)', opacity: 0.7}}>
                  Alle {totalItems} Artikel eingekauft
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}