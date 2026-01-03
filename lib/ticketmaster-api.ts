/**
 * Ticketmaster API Integration
 * Documentation: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */

export interface TicketmasterEvent {
  id: string
  name: string
  date: string // ISO 8601
  venue: string
  city: string
  country: string
  url: string
  imageUrl?: string
  lat?: number
  lng?: number
  priceMin?: number
  priceMax?: number
  currency?: string
}

/**
 * Rechercher les concerts d'un artiste près d'une ville
 */
export async function fetchConcertsNearby(
  artistName: string,
  city: string,
  radiusKm: number = 50,
  countryCode?: string
): Promise<TicketmasterEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY
  
  if (!apiKey) {
    console.warn('⚠️ TICKETMASTER_API_KEY non configurée')
    return []
  }

  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      keyword: artistName,
      city: city,
      radius: radiusKm.toString(),
      unit: 'km',
      classificationName: 'Music', // Seulement les concerts
      sort: 'date,asc',
      size: '20' // Max 20 concerts
    })

    if (countryCode) {
      params.append('countryCode', countryCode)
    }

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`
    
    console.log(`🎫 Recherche concerts Ticketmaster: ${artistName} près de ${city}`)
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`❌ Erreur Ticketmaster API: ${response.status}`)
      return []
    }

    const data = await response.json()
    
    if (!data._embedded?.events) {
      console.log(`📭 Aucun concert trouvé pour ${artistName} près de ${city}`)
      return []
    }

    const events: TicketmasterEvent[] = data._embedded.events.map((event: any) => {
      const venue = event._embedded?.venues?.[0]
      const priceRange = event.priceRanges?.[0]
      const image = event.images?.find((img: any) => img.ratio === '16_9' && img.width > 1000)

      return {
        id: event.id,
        name: event.name,
        date: event.dates?.start?.dateTime || event.dates?.start?.localDate,
        venue: venue?.name || 'Lieu inconnu',
        city: venue?.city?.name || city,
        country: venue?.country?.countryCode || countryCode || '',
        url: event.url,
        imageUrl: image?.url,
        priceMin: priceRange?.min,
        priceMax: priceRange?.max,
        currency: priceRange?.currency
      }
    })

    console.log(`✅ ${events.length} concerts trouvés pour ${artistName}`)
    
    return events

  } catch (error) {
    console.error(`❌ Erreur lors de la recherche de concerts:`, error)
    return []
  }
}

/**
 * Rechercher tous les concerts d'un artiste en France (6 prochains mois)
 * Optimisé pour réduire le nombre d'appels API
 */
export async function fetchArtistConcertsInFrance(
  artistName: string,
  ticketmasterArtistId?: string
): Promise<TicketmasterEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY
  
  if (!apiKey) {
    console.warn('⚠️ TICKETMASTER_API_KEY non configurée')
    return []
  }

  try {
    // Dates : aujourd'hui → +6 mois
    const startDate = new Date().toISOString().split('T')[0] + 'T00:00:00Z'
    const endDate = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T23:59:59Z'

    const params = new URLSearchParams({
      apikey: apiKey,
      countryCode: 'FR', // France uniquement
      classificationName: 'Music',
      sort: 'date,asc',
      size: '50', // Max 50 concerts par artiste
      startDateTime: startDate,
      endDateTime: endDate
    })

    // Recherche par ID artiste si disponible (plus précis)
    if (ticketmasterArtistId) {
      params.append('attractionId', ticketmasterArtistId)
    } else {
      // Sinon par nom (peut être moins précis)
      params.append('keyword', artistName)
    }

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`
    
    console.log(`🎫 Recherche concerts Ticketmaster FR: ${artistName}`)
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`❌ Erreur Ticketmaster API: ${response.status}`)
      return []
    }

    const data = await response.json()
    
    if (!data._embedded?.events) {
      console.log(`📭 Aucun concert trouvé pour ${artistName} en France`)
      return []
    }

    const events: TicketmasterEvent[] = data._embedded.events.map((event: any) => {
      const venue = event._embedded?.venues?.[0]
      const image = event.images?.find((img: any) => img.ratio === '16_9' && img.width > 1000)

      return {
        id: event.id, // ID unique Ticketmaster
        name: event.name,
        date: event.dates?.start?.dateTime || event.dates?.start?.localDate,
        venue: venue?.name || 'Lieu inconnu',
        city: venue?.city?.name || '',
        country: venue?.country?.countryCode || 'FR',
        url: event.url,
        imageUrl: image?.url,
        lat: venue?.location?.latitude ? parseFloat(venue.location.latitude) : undefined,
        lng: venue?.location?.longitude ? parseFloat(venue.location.longitude) : undefined
      }
    })

    console.log(`✅ ${events.length} concerts trouvés pour ${artistName} en France`)
    
    return events

  } catch (error) {
    console.error(`❌ Erreur lors de la recherche de concerts:`, error)
    return []
  }
}

/**
 * Rechercher l'ID Ticketmaster d'un artiste
 */
export async function findTicketmasterArtistId(artistName: string): Promise<string | null> {
  const apiKey = process.env.TICKETMASTER_API_KEY
  
  if (!apiKey) {
    return null
  }

  try {
    const params = new URLSearchParams({
      apikey: apiKey,
      keyword: artistName,
      classificationName: 'Music',
      size: '1'
    })

    const url = `https://app.ticketmaster.com/discovery/v2/attractions.json?${params.toString()}`
    
    const response = await fetch(url)

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (!data._embedded?.attractions?.[0]) {
      return null
    }

    return data._embedded.attractions[0].id

  } catch (error) {
    console.error(`❌ Erreur recherche artiste Ticketmaster:`, error)
    return null
  }
}

