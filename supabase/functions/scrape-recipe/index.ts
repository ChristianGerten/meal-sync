import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const parseDuration = (iso: string) => {
  if (!iso) return null
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return null
  return (parseInt(match[1] || '0') * 60) + parseInt(match[2] || '0')
}

const extractFromJsonLd = (html: string) => {
  const blocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
  for (const block of blocks) {
    try {
      const content = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim()
      const parsed = JSON.parse(content)
      const items = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of items) {
        if (item['@type'] === 'Recipe') return item
        if (item['@graph']) {
          const found = item['@graph'].find((x: any) => x['@type'] === 'Recipe')
          if (found) return found
        }
      }
    } catch {}
  }
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url) throw new Error('URL fehlt')

    // Mehrere Fetch-Strategien versuchen
    let html = ''
    const strategies = [
      // Strategie 1: Direkt mit Browser-Headers
      async () => {
        const r = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'de-DE,de;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.google.de/',
            'Cache-Control': 'no-cache',
          },
          signal: AbortSignal.timeout(8000)
        })
        return await r.text()
      },
      // Strategie 2: Als Googlebot
      async () => {
        const r = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': 'text/html',
          },
          signal: AbortSignal.timeout(8000)
        })
        return await r.text()
      }
    ]

    for (const strategy of strategies) {
      try {
        html = await strategy()
        if (html.length > 500) break
      } catch {}
    }

    if (html.length < 500) {
      throw new Error('Seite konnte nicht geladen werden. Versuche eine andere URL.')
    }

    // JSON-LD Schema.org parsen
    const recipe = extractFromJsonLd(html)

    if (recipe) {
      const rawIngredients: string[] = recipe.recipeIngredient || []
      const ingredients = rawIngredients.map((ing: string) => {
        const clean = ing.trim()
        const match = clean.match(/^([\d,./½¼¾]+)?\s*([a-zA-ZäöüÄÖÜ]+(?:\s[a-zA-ZäöüÄÖÜ]+)?)?\s+(.+)$/)
        if (match && match[3]) {
          return {
            amount: match[1] ? parseFloat(match[1].replace(',', '.')) : null,
            unit: match[2]?.trim() || '',
            name: match[3].trim(),
            category: 'Sonstiges'
          }
        }
        return { name: clean, amount: null, unit: '', category: 'Sonstiges' }
      })

      let imageUrl: string | null = null
      if (recipe.image) {
        if (typeof recipe.image === 'string') imageUrl = recipe.image
        else if (recipe.image.url) imageUrl = recipe.image.url
        else if (Array.isArray(recipe.image)) {
          imageUrl = typeof recipe.image[0] === 'string' ? recipe.image[0] : recipe.image[0]?.url
        }
      }

      return new Response(JSON.stringify({
        name: recipe.name || 'Importiertes Rezept',
        description: typeof recipe.description === 'string'
          ? recipe.description.replace(/<[^>]+>/g, '').trim()
          : '',
        image_url: imageUrl,
        servings: parseInt(recipe.recipeYield) || 2,
        prep_time: parseDuration(recipe.prepTime),
        cook_time: parseDuration(recipe.cookTime),
        category: Array.isArray(recipe.recipeCategory)
          ? recipe.recipeCategory[0]
          : recipe.recipeCategory || '',
        tags: recipe.keywords
          ? recipe.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
          : [],
        ingredients,
        source_url: url,
        method: 'schema'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Fallback: Meta-Tags
    const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)
      || html.match(/<title[^>]*>([^<]+)</i)
    const imageMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i)
      || html.match(/content="([^"]+)"[^>]*property="og:image"/i)
    const descMatch = html.match(/property="og:description"[^>]*content="([^"]+)"/i)

    const ingMatches = html.match(/itemprop="recipeIngredient"[^>]*>([^<]+)</gi) || []
    const ingredients = ingMatches.map((m: string) => ({
      name: m.replace(/itemprop="recipeIngredient"[^>]*>/i, '').replace(/<[^>]+>/g, '').trim(),
      amount: null, unit: '', category: 'Sonstiges'
    })).filter((i: any) => i.name)

    return new Response(JSON.stringify({
      name: titleMatch ? titleMatch[1].replace(/\s*[-|].*$/, '').trim() : 'Importiertes Rezept',
      description: descMatch ? descMatch[1] : '',
      image_url: imageMatch ? imageMatch[1] : null,
      ingredients,
      source_url: url,
      method: ingredients.length > 0 ? 'microdata' : 'meta'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})