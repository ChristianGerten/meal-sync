import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url) throw new Error('URL fehlt')

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MealSync/1.0)' }
    })
    const html = await response.text()

    // JSON-LD Schema.org Rezept extrahieren
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
    let recipe = null

    if (jsonLdMatch) {
      for (const block of jsonLdMatch) {
        try {
          const content = block.replace(/<script[^>]*>/, '').replace('</script>', '').trim()
          const parsed = JSON.parse(content)
          const data = Array.isArray(parsed) ? parsed[0] : parsed
          const recipeData = data['@graph']
            ? data['@graph'].find((x: any) => x['@type'] === 'Recipe')
            : data['@type'] === 'Recipe' ? data : null

          if (recipeData) {
            recipe = recipeData
            break
          }
        } catch {}
      }
    }

    if (!recipe) {
      // Fallback: Meta-Tags auslesen
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
      const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
        || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i)
      const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i)

      return new Response(JSON.stringify({
        name: titleMatch ? titleMatch[1].replace(/\s*[-|].*$/, '').trim() : 'Importiertes Rezept',
        description: descMatch ? descMatch[1] : '',
        image_url: imageMatch ? imageMatch[1] : null,
        ingredients: [],
        source_url: url,
        imported: true,
        method: 'meta'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Zutaten parsen
    const rawIngredients = recipe.recipeIngredient || []
    const ingredients = rawIngredients.map((ing: string) => {
      const match = ing.trim().match(/^([\d,.\/]+)?\s*([a-zA-ZäöüÄÖÜ]+)?\s+(.+)$/)
      if (match) {
        return {
          amount: match[1] ? parseFloat(match[1].replace(',', '.')) : null,
          unit: match[2] || '',
          name: match[3]?.trim() || ing.trim(),
          category: 'Sonstiges'
        }
      }
      return { name: ing.trim(), amount: null, unit: '', category: 'Sonstiges' }
    })

    // Bild URL
    let imageUrl = null
    if (recipe.image) {
      if (typeof recipe.image === 'string') imageUrl = recipe.image
      else if (recipe.image.url) imageUrl = recipe.image.url
      else if (Array.isArray(recipe.image)) imageUrl = recipe.image[0]?.url || recipe.image[0]
    }

    // Kochzeit parsen (ISO 8601: PT30M)
    const parseDuration = (iso: string) => {
      if (!iso) return null
      const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
      if (!match) return null
      return (parseInt(match[1] || '0') * 60) + parseInt(match[2] || '0')
    }

    return new Response(JSON.stringify({
      name: recipe.name || 'Importiertes Rezept',
      description: recipe.description || '',
      image_url: imageUrl,
      servings: parseInt(recipe.recipeYield) || 2,
      prep_time: parseDuration(recipe.prepTime),
      cook_time: parseDuration(recipe.cookTime),
      category: recipe.recipeCategory || '',
      tags: recipe.keywords ? recipe.keywords.split(',').map((k: string) => k.trim()) : [],
      ingredients,
      source_url: url,
      imported: true,
      method: 'schema'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})