// Kategorie-Icons für bessere Scanbarkeit
export const CATEGORY_ICONS = {
  'Obst & Gemüse': '🥦',
  'Fleisch & Fisch': '🥩',
  'Kühlregal': '🧀',
  'Milchprodukte': '🥛',
  'Brot & Backwaren': '🍞',
  'Nudeln': '🍝',
  'Reis & Getreide': '🌾',
  'Konserven': '🥫',
  'Gewürze': '🧂',
  'Backen': '🧁',
  'Getränke': '🥤',
  'Tiefkühl': '❄️',
  'Sonstiges': '🛒',
  'Körperpflege': '🧴',
  'Haushalt': '🧹',
  'Gesundheit': '💊',
  'Baby': '👶',
  'Sonstiges (Drogerie)': '🛒',
}

export const SUPERMARKET_CATS = [
  'Obst & Gemüse', 'Fleisch & Fisch', 'Kühlregal', 'Milchprodukte',
  'Brot & Backwaren', 'Nudeln', 'Reis & Getreide', 'Konserven',
  'Gewürze', 'Backen', 'Getränke', 'Tiefkühl', 'Sonstiges'
]

export const DRUGSTORE_CATS = [
  'Körperpflege', 'Haushalt', 'Gesundheit', 'Baby', 'Sonstiges (Drogerie)'
]

export const UNITS = [
  'g', 'kg', 'ml', 'l', 'Stück', 'Packung', 'Dose',
  'Flasche', 'Bund', 'EL', 'TL', 'Prise'
]

export const DAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

// Automatische Kategoriezuweisung anhand des Namens
export const guessCategory = (name, store = 'supermarket') => {
  const lower = name.toLowerCase()
  if (store === 'drugstore') {
    if (['shampoo','duschgel','seife','zahnpasta','deo','bodylotion',
         'creme','parfüm','rasierschaum','mascara','lippenstift'
        ].some(v => lower.includes(v))) return 'Körperpflege'
    if (['waschmittel','spülmittel','reiniger','müllbeutel',
         'toilettenpapier','küchenrolle','schwämme'
        ].some(v => lower.includes(v))) return 'Haushalt'
    if (['ibuprofen','paracetamol','pflaster','nasenspray','vitamin'
        ].some(v => lower.includes(v))) return 'Gesundheit'
    if (['windeln','feuchttücher','babynahrung'
        ].some(v => lower.includes(v))) return 'Baby'
    return 'Körperpflege'
  }
  if (['äpfel','bananen','orangen','tomaten','paprika','zucchini','gurke',
       'karotten','zwiebeln','knoblauch','kartoffeln','brokkoli','spinat',
       'salat','champignons','avocado','erdbeeren','trauben','zitronen',
       'möhren','lauch','fenchel','aubergine','zucchetti','rucola',
       'feldsalat','eisberg','kohlrabi','rosenkohl','blumenkohl'
      ].some(v => lower.includes(v))) return 'Obst & Gemüse'
  if (['hähnchen','hackfleisch','lachs','thunfisch','speck','schinken',
       'steak','filet','garnelen','fisch','rind','schwein','lamm',
       'wurst','salami','chorizo','putenbrust'
      ].some(v => lower.includes(v))) return 'Fleisch & Fisch'
  if (['milch','joghurt','quark','sahne','eier','käse','mozzarella',
       'parmesan','frischkäse','schmand','butter','skyr','kefir',
       'buttermilch','ricotta','mascarpone','feta','brie','gouda'
      ].some(v => lower.includes(v))) return 'Kühlregal'
  if (['spaghetti','penne','nudel','fusilli','rigatoni','tagliatelle',
       'linguine','farfalle','tortellini','lasagne','gnocchi'
      ].some(v => lower.includes(v))) return 'Nudeln'
  if (['reis','couscous','quinoa','haferflocken','bulgur','hirse',
       'polenta','müsli','granola','cornflakes'
      ].some(v => lower.includes(v))) return 'Reis & Getreide'
  if (['brot','brötchen','toast','baguette','ciabatta','laugenbrezeln',
       'croissant','bagel','pita','tortilla','wrap','knäckebrot'
      ].some(v => lower.includes(v))) return 'Brot & Backwaren'
  if (['dose','kichererbsen','linsen','kidney','kokosmilch','passata',
       'tomatenmark','oliven','kapern','pesto','hummus'
      ].some(v => lower.includes(v))) return 'Konserven'
  if (['saft','wasser','mineralwasser','cola','tee','kaffee','limonade',
       'bier','wein','espresso','eistee'
      ].some(v => lower.includes(v))) return 'Getränke'
  if (['tiefkühl','tk','eis','eiscreme','pommes','fischstäbchen'
      ].some(v => lower.includes(v))) return 'Tiefkühl'
  if (['mehl','backpulver','zucker','puderzucker','vanille','kakao',
       'schokolade','hefe','natron'
      ].some(v => lower.includes(v))) return 'Backen'
  return 'Sonstiges'
}

export const SUGGESTIONS_SUPERMARKET = [
  // Obst
  'Äpfel', 'Bananen', 'Orangen', 'Zitronen', 'Limetten', 'Erdbeeren',
  'Himbeeren', 'Blaubeeren', 'Brombeeren', 'Trauben', 'Wassermelone',
  'Melone', 'Mango', 'Ananas', 'Kiwi', 'Pfirsich', 'Nektarine',
  'Pflaumen', 'Kirschen', 'Birnen', 'Grapefruit', 'Clementinen',
  'Mandarine', 'Feigen', 'Datteln', 'Granatapfel', 'Papaya', 'Kokos',
  // Gemüse
  'Tomaten', 'Cherrytomaten', 'Paprika', 'Rote Paprika', 'Gelbe Paprika',
  'Zucchini', 'Gurke', 'Karotten', 'Möhren', 'Zwiebeln', 'Rote Zwiebeln',
  'Frühlingszwiebeln', 'Schalotten', 'Knoblauch', 'Kartoffeln',
  'Süßkartoffeln', 'Brokkoli', 'Blumenkohl', 'Spinat', 'Blattspinat',
  'Salat', 'Eisbergsalat', 'Rucola', 'Feldsalat', 'Romanasalat',
  'Champignons', 'Avocado', 'Aubergine', 'Lauch', 'Porree',
  'Staudensellerie', 'Fenchel', 'Rote Bete', 'Radieschen', 'Rettich',
  'Kohlrabi', 'Rosenkohl', 'Weißkohl', 'Rotkohl', 'Spitzkohl',
  'Wirsing', 'Chinakohl', 'Pak Choi', 'Mais', 'Erbsen', 'Bohnen',
  'Spargel', 'Artischocken', 'Ingwer', 'Chili', 'Jalapeños',
  'Petersilie', 'Basilikum', 'Schnittlauch', 'Koriander', 'Thymian',
  'Rosmarin', 'Minze', 'Salbei', 'Dill', 'Estragon', 'Bärlauch',
  // Fleisch
  'Hähnchenbrust', 'Hähnchenkeule', 'Hähnchenschenkel', 'Ganzes Hähnchen',
  'Hackfleisch gemischt', 'Rinderhack', 'Schweinehack', 'Putenhack',
  'Rindersteak', 'Schweinefilet', 'Schweinekotelett', 'Schweinebauch',
  'Rinderfilet', 'Rinderbraten', 'Lammkotelett', 'Lammhack', 'Lammkeule',
  'Speck', 'Bauchspeck', 'Schinken', 'Kochschinken', 'Serranoschinken',
  'Parmaschinken', 'Salami', 'Chorizo', 'Bratwurst', 'Weißwurst',
  'Wiener Würstchen', 'Leberwurst', 'Putenbrust', 'Entenkeule',
  'Gyros', 'Schnitzel', 'Cordon Bleu',
  // Fisch
  'Lachs', 'Lachsfilet', 'Räucherlachs', 'Thunfisch', 'Thunfisch Dose',
  'Kabeljau', 'Seelachs', 'Forelle', 'Dorade', 'Wolfsbarsch', 'Tilapia',
  'Sardinen', 'Sardinen Dose', 'Hering', 'Makrele', 'Garnelen',
  'Krabben', 'Muscheln', 'Tintenfisch', 'Jakobsmuscheln', 'Pangasius',
  'Matjes', 'Fischstäbchen', 'Räucherforelle',
  // Milchprodukte & Kühlregal
  'Milch', 'Vollmilch', 'Fettarme Milch', 'Laktosefreie Milch',
  'Hafermilch', 'Mandelmilch', 'Sojamilch', 'Hafermilch Barista',
  'Joghurt', 'Naturjoghurt', 'Griechischer Joghurt', 'Fruchtjoghurt',
  'Quark', 'Magerquark', 'Sahne', 'Schlagsahne', 'Saure Sahne',
  'Crème fraîche', 'Schmand', 'Butter', 'Süßrahmbutter', 'Margarine',
  'Eier', 'Bio-Eier', 'Freilandeier', 'Käse', 'Gouda', 'Emmentaler',
  'Cheddar', 'Mozzarella', 'Büffelmozzarella', 'Parmesan', 'Pecorino',
  'Feta', 'Brie', 'Camembert', 'Ricotta', 'Mascarpone', 'Frischkäse',
  'Philadelphia', 'Hüttenkäse', 'Skyr', 'Kefir', 'Buttermilch',
  'Pudding', 'Grießbrei', 'Crème Dessert', 'Quark Dessert',
  'Tofu', 'Räuchertofu', 'Tempeh', 'Seitan',
  // Brot
  'Brot', 'Vollkornbrot', 'Weißbrot', 'Sauerteigbrot', 'Dinkelbrot',
  'Roggenbrot', 'Mehrkornbrot', 'Brötchen', 'Vollkornbrötchen',
  'Toastbrot', 'Vollkorntoast', 'Baguette', 'Ciabatta', 'Laugenbrezeln',
  'Croissants', 'Bagels', 'Pita-Brot', 'Tortillas', 'Wraps',
  'Knäckebrot', 'Zwieback', 'Laugenbrötchen',
  // Nudeln & Getreide
  'Spaghetti', 'Spaghetti Vollkorn', 'Penne', 'Fusilli', 'Rigatoni',
  'Tagliatelle', 'Linguine', 'Farfalle', 'Tortellini', 'Lasagneplatten',
  'Gnocchi', 'Nudeln', 'Vollkornnudeln', 'Reisnudeln', 'Glasnudeln',
  'Reis', 'Basmati-Reis', 'Jasmin-Reis', 'Risotto-Reis', 'Vollkornreis',
  'Wildreis', 'Parboiled Reis', 'Couscous', 'Bulgur', 'Quinoa',
  'Hirse', 'Polenta', 'Haferflocken', 'Zarte Haferflocken', 'Müsli',
  'Granola', 'Cornflakes', 'Paniermehl', 'Semmelbrösel',
  // Konserven & Gläser
  'Tomaten Dose', 'Geschälte Tomaten', 'Tomatenmark', 'Passata',
  'Kichererbsen Dose', 'Linsen Dose', 'Kidneybohnen Dose',
  'Weiße Bohnen Dose', 'Mais Dose', 'Erbsen Dose', 'Thunfisch Dose',
  'Sardinen Dose', 'Kokosmilch Dose', 'Artischockenherzen', 'Oliven',
  'Kapern', 'Gürkchen', 'Pesto', 'Pesto Rosso', 'Tomatensauce',
  'Arrabiata', 'Bolognese Glas', 'Hummus', 'Erdnussbutter',
  'Mandelmus', 'Cashewmus', 'Marmelade', 'Erdbeermarmelade',
  'Aprikosenmarmelade', 'Honig', 'Ahornsirup', 'Agavensirup',
  'Nutella', 'Senf', 'Dijonsenf', 'Ketchup', 'Mayonnaise',
  'Sojasauce', 'Worcestersauce', 'Tabasco', 'Sriracha', 'Sambal Oelek',
  'Fischsauce', 'Teriyaki Sauce', 'Hoisin Sauce',
  'Olivenöl', 'Sonnenblumenöl', 'Rapsöl', 'Kokosöl', 'Sesamöl',
  'Weißweinessig', 'Rotweinessig', 'Balsamico', 'Apfelessig',
  // Getränke
  'Mineralwasser', 'Stilles Wasser', 'Sprudel', 'Orangensaft',
  'Apfelsaft', 'Multivitaminsaft', 'Traubensaft', 'Tomatensaft',
  'Limonade', 'Cola', 'Fanta', 'Sprite', 'Eistee', 'Eistee Pfirsich',
  'Kaffee', 'Kaffeebohnen', 'Filterkaffee', 'Espresso', 'Cappuccino',
  'Tee', 'Grüntee', 'Schwarztee', 'Kräutertee', 'Kamillentee',
  'Pfefferminztee', 'Ingwertee', 'Bier', 'Wein', 'Rotwein',
  'Weißwein', 'Sekt', 'Prosecco', 'Apfelschorle', 'Orangenschorle',
  // Tiefkühl
  'Tiefkühlpizza', 'Tiefkühlgemüse', 'Erbsen TK', 'Spinat TK',
  'Brokkoli TK', 'Blumenkohl TK', 'Mais TK', 'Bohnen TK',
  'Garnelen TK', 'Fischstäbchen', 'Pommes frites', 'Kroketten',
  'Eis', 'Vanilleeis', 'Schokoladeneis', 'Tiefkühlbeeren',
  'Tiefkühlobst', 'Maultaschen TK', 'Schupfnudeln TK',
  // Süßes & Snacks
  'Schokolade', 'Vollmilchschokolade', 'Zartbitterschokolade',
  'Weiße Schokolade', 'Kinder Riegel', 'Duplo', 'Bounty', 'Snickers',
  'Kekse', 'Butterkekse', 'Schokokekse', 'Leibniz', 'Oreo',
  'Chips', 'Paprika Chips', 'Salzstangen', 'Brezel', 'Popcorn',
  'Nüsse', 'Mandeln', 'Cashews', 'Walnüsse', 'Erdnüsse', 'Pistazien',
  'Haselnüsse', 'Gemischte Nüsse', 'Trockenfrüchte', 'Rosinen',
  'Cranberries', 'Müsliriegel', 'Gummibärchen', 'Weingummi',
  // Backen
  'Mehl', 'Weizenmehl Type 405', 'Weizenmehl Type 550', 'Dinkelmehl',
  'Vollkornmehl', 'Backpulver', 'Natron', 'Vanilleextrakt',
  'Vanillezucker', 'Hefe', 'Trockenhefe', 'Zucker', 'Puderzucker',
  'Brauner Zucker', 'Rohrzucker', 'Kakaopulver', 'Backschokolade',
  'Schokoladenraspeln', 'Speisestärke', 'Gelatine', 'Backpapier',
  // Sonstiges / Haushalt Lebensmittel
  'Alufolie', 'Frischhaltefolie', 'Gefrierbeutel',
]

export const SUGGESTIONS_DRUGSTORE = [
  // Haarpflege
  'Shampoo', 'Shampoo Normal', 'Shampoo Fettig', 'Shampoo Trockenes Haar',
  'Shampoo Anti-Schuppen', 'Shampoo Volumen', 'Shampoo Repair',
  'Conditioner', 'Haarspülung', 'Haarmaske', 'Haarkur', 'Haarpflegekur',
  'Trockenshampoo', 'Haaröl', 'Haargel', 'Haarspray', 'Haarschaum',
  'Haarcreme', 'Haarwachs', 'Haarpomade', 'Haarbürste', 'Kamm',
  'Haarnadeln', 'Haargummis', 'Haarklammern', 'Haarfarbe', 'Blondiermittel',
  'Pflegespülung', 'Leave-In Conditioner', 'Hitzeschutzspray',
  // Körperpflege
  'Duschgel', 'Duschgel Frisch', 'Duschgel Sensitiv', 'Duschcreme',
  'Duschschaum', 'Badeschaum', 'Badeöl', 'Badezusatz', 'Badekugel',
  'Seife', 'Handseife', 'Flüssigseife', 'Seifenstück', 'Duschseife',
  'Körperlotion', 'Bodylotion', 'Körpercreme', 'Körperöl', 'Körperbutter',
  'Handcreme', 'Handlotion', 'Handpflege', 'Nagelpflege',
  'Fußcreme', 'Fußlotion', 'Fußbalsam', 'Fußbad', 'Hornhautentferner',
  'Peeling', 'Körperpeeling', 'Gesichtspeeling', 'Zuckerpeeling',
  'Waschlappen', 'Badeschwamm', 'Luffa', 'Körperbürste',
  // Gesichtspflege
  'Gesichtscreme', 'Tagescreme', 'Tagescreme LSF', 'Nachtcreme',
  'Augencreme', 'Augenkonturencreme', 'Serum', 'Gesichtsserum',
  'Hyaluron Serum', 'Vitamin C Serum', 'Retinol Serum',
  'Gesichtswasser', 'Toner', 'Mizellenwasser', 'Gesichtsöl',
  'Gesichtsmaske', 'Tuchmaske', 'Tonmaske', 'Schlafmaske',
  'Reinigungsmilch', 'Gesichtsreinigung', 'Reinigungsgel', 'Reinigungsschaum',
  'Make-up Entferner', 'Abschminkpads', 'Wattepads', 'Wattestäbchen',
  'Feuchtigkeitscreme', 'Feuchtigkeitslotion', 'BB Cream', 'CC Cream',
  'Primer', 'Foundation', 'Concealer', 'Puder', 'Kompaktpuder',
  'Rouge', 'Bronzer', 'Highlighter', 'Contouring', 'Lidschatten',
  'Eyeliner', 'Kajal', 'Mascara', 'Lippenstift', 'Lipgloss',
  'Lippenpflege', 'Lipliner', 'Lip Balm', 'Chapstick',
  'Nagellack', 'Nagellackentferner', 'Nagelfeile', 'Nagelschere',
  // Sonnenschutz
  'Sonnencreme LSF 30', 'Sonnencreme LSF 50', 'Sonnencreme LSF 50+',
  'Sonnencreme Kinder', 'Sonnencreme Gesicht', 'Sonnencreme Sport',
  'Sonnenspray', 'Sonnenmilch', 'After Sun', 'After Sun Lotion',
  'After Sun Gel', 'Selbstbräuner', 'Bräunungslotion',
  // Deodorant & Duft
  'Deo', 'Deodorant', 'Deo-Spray', 'Deo-Roll-on', 'Deo-Stick',
  'Deo-Creme', 'Antitranspirant', 'Deo Sensitiv', 'Deo Männer',
  'Parfüm', 'Eau de Toilette', 'Eau de Parfum', 'Bodyspray',
  'Aftershave', 'Aftershave Balsam', 'Rasierwasser',
  // Rasur & Epilation
  'Rasierschaum', 'Rasiergel', 'Rasiercreme', 'Rasierer',
  'Nassrasierer', 'Rasierklinge', 'Rasierklingen', 'Elektrorasierer',
  'Enthaarungscreme', 'Wachsstreifen', 'Epiliergerät', 'Epilierer',
  // Mundpflege
  'Zahnpasta', 'Zahncreme', 'Kinderzahnpasta', 'Whitening Zahnpasta',
  'Sensitive Zahnpasta', 'Zahnpasta Repair', 'Zahnpasta Frisch',
  'Zahnbürste', 'Elektrische Zahnbürste', 'Zahnbürstenköpfe',
  'Zahnseide', 'Interdentalbürsten', 'Mundspülung', 'Mundwasser',
  'Zungenschaber', 'Zahnbleaching', 'Zahnweiß Streifen',
  // Damenhygiene
  'Tampons Normal', 'Tampons Super', 'Tampons Mini',
  'Binden', 'Ultra Binden', 'Damenbinden Nacht', 'Slipeinlagen',
  'Menstruationstasse', 'Periodenunterwäsche', 'Intimwaschlotion',
  // Baby & Kind
  'Windeln Größe 1', 'Windeln Größe 2', 'Windeln Größe 3',
  'Windeln Größe 4', 'Windeln Größe 5', 'Windeln Größe 6',
  'Windelhosen', 'Feuchttücher', 'Babyfeuchttücher', 'Pflegetücher',
  'Babynahrung', 'Babygläschen', 'Anfangsmilch', 'Folgemiilch',
  'Babybrei', 'Babyshampoo', 'Babyöl', 'Babycreme', 'Wundschutzcreme',
  'Bepanthen', 'Babypuder', 'Schnuller', 'Babyflaschen',
  // Haushalt & Reinigung
  'Waschmittel', 'Vollwaschmittel', 'Colorwaschmittel', 'Feinwaschmittel',
  'Wollwaschmittel', 'Flüssigwaschmittel', 'Waschmittelpulver',
  'Waschmittelpods', 'Weichspüler', 'Fleckentferner', 'Bleichmittel',
  'Spülmittel', 'Spülmittel Sensitiv', 'Geschirrspültabs',
  'Spülmaschinentabs', 'Klarspüler', 'Maschinenpfleger', 'Entfetter',
  'WC-Reiniger', 'WC-Steine', 'WC-Ente', 'Badreiniger', 'Scheuermilch',
  'Allzweckreiniger', 'Küchenreiniger', 'Glasreiniger', 'Fensterreiniger',
  'Desinfektionsmittel', 'Desinfektionsspray', 'Handdesinfektionsmittel',
  'Schimmelentferner', 'Rohrreiniger', 'Kalklöser', 'Entkalker',
  'Backofenreiniger', 'Grillreiniger', 'Edelstahlreiniger',
  'Möbelpolitur', 'Bodenpflegemittel', 'Parkettpflege', 'Teppichreiniger',
  // Papierwaren
  'Toilettenpapier', 'Toilettenpapier 3-lagig', 'Toilettenpapier 4-lagig',
  'Küchenrolle', 'Taschentücher', 'Papiertaschentücher', 'Servietten',
  'Papierhandtücher', 'Müllbeutel', 'Müllsäcke 10L', 'Müllsäcke 20L',
  'Müllsäcke 35L', 'Müllsäcke 60L', 'Müllsäcke 120L', 'Biomüllbeutel',
  'Gefrierbeutel', 'Frischhaltebeutel', 'Zip-Beutel',
  'Alufolie', 'Frischhaltefolie', 'Backpapier', 'Bratfolie',
  'Haushaltshandschuhe', 'Einweghandschuhe', 'Schwämme', 'Topflappen',
  'Geschirrtücher', 'Putztücher', 'Mikrofasertücher', 'Schrubber',
  'Wischmopp', 'Besen', 'Handfeger', 'Staubsaugerbeutel',
  'Lufterfrischer', 'Raumspray', 'Duftkerzen', 'Mottenschutz',
  // Gesundheit & Medizin
  'Ibuprofen 200', 'Ibuprofen 400', 'Ibuprofen 600', 'Paracetamol 500',
  'Paracetamol 1000', 'Aspirin', 'Aspirin Complex', 'Diclofenac',
  'Hustensaft', 'Hustensaft Kinder', 'Hustendrops', 'Halstabletten',
  'Nasenspray', 'Meerwasser Nasenspray', 'Nasentropfen',
  'Augentropfen', 'Ohrentropfen', 'Magentabletten', 'Antazida',
  'Abführmittel', 'Durchfallmittel', 'Kohletabletten', 'Elektrolyte',
  'Vitamin C 1000', 'Vitamin D 1000', 'Vitamin D 2000', 'Vitamin B12',
  'Multivitamin', 'Zink', 'Magnesium', 'Magnesium 400', 'Omega-3',
  'Probiotika', 'Melatonin', 'Baldrian', 'Schlaftabletten',
  'Wärmepflaster', 'Kühlpads', 'Kühlspray', 'Wärmflasche',
  'Pflaster', 'Pflaster Mix', 'Wundpflaster', 'Wundverband',
  'Mullbinden', 'Verbandsmull', 'Elastische Binde', 'Druckverband',
  'Wundsalbe', 'Betaisodona', 'Bepanthen Wundsalbe', 'Zinksalbe',
  'Fußpilzmittel', 'Nagelpilzmittel', 'Läusemittel',
  'Mückenschutz Spray', 'Mückenschutz Creme', 'Mückenarmbänder',
  'Thermometer', 'Fieberthermometer', 'Kondome', 'Schwangerschaftstest',
  // Optik
  'Kontaktlinsen', 'Kontaktlinsenlösung', 'Kontaktlinsenbehälter',
  'Brillenputztuch', 'Brillenreiniger',
  // Haustier
  'Hundefutter Trocken', 'Hundefutter Nass', 'Katzenfutter Trocken',
  'Katzenfutter Nass', 'Tiersnacks', 'Katzenstreu', 'Hundeshampoo',
  'Floh- und Zeckenmittel', 'Wurmmittel',
]