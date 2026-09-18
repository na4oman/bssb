import { EventLocation } from '../types/event'

export type PlaceResult = {
  placeId: string
  name: string
  latitude: number
  longitude: number
}

export type ReverseGeocodeResult = {
  displayName: string
  shortName: string
  address: Record<string, string>
}

export type NearbyPlace = {
  id: number
  name: string
  category: string
  latitude: number
  longitude: number
}

const NOMINATIM_SEARCH =
  'https://nominatim.openstreetmap.org/search?format=json&limit=5'
const NOMINATIM_REVERSE =
  'https://nominatim.openstreetmap.org/reverse?format=json'
const OVERPASS_API = 'https://overpass-api.de/api/interpreter'

/**
 * Search for places by name using OpenStreetMap's Nominatim geocoder
 * (free, no API key). Returns up to 5 matches.
 */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []

  try {
    const res = await fetch(
      `${NOMINATIM_SEARCH}&q=${encodeURIComponent(trimmed)}&accept-language=en`,
    )
    if (!res.ok) return []
    const data: any[] = await res.json()
    return data.map(item => ({
      placeId: item.place_id,
      name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }))
  } catch (error) {
    console.warn('Location search failed:', error)
    return []
  }
}

/**
 * Reverse-geocode coordinates to a structured address (street, house
 * number, city, country...). Returns null when the lookup fails.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult | null> {
  try {
    const res = await fetch(
      `${NOMINATIM_REVERSE}&lat=${latitude}&lon=${longitude}&accept-language=en&addressdetails=1`,
    )
    if (!res.ok) return null
    const data: any = await res.json()
    if (!data || !data.display_name) return null
    const address: Record<string, string> = data.address || {}
    return {
      displayName: data.display_name,
      shortName: formatShortAddress(address) || data.display_name,
      address,
    }
  } catch (error) {
    console.warn('Reverse geocoding failed:', error)
    return null
  }
}

/** "Vitosha Blvd 12, Sofia" — street + house number + city, nothing else. */
function formatShortAddress(address: Record<string, string>): string {
  const parts: string[] = []
  const street =
    address.road || address.pedestrian || address.footway || address.street
  if (street) {
    parts.push(address.house_number ? `${street} ${address.house_number}` : street)
  }
  const city =
    address.city || address.town || address.village || address.municipality
  if (city) parts.push(city)
  return parts.join(', ')
}

const CATEGORY_LABELS: Record<string, string> = {
  pub: 'Pub',
  bar: 'Bar',
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  fast_food: 'Fast food',
  stadium: 'Stadium',
  sports_centre: 'Sports centre',
  pitch: 'Sports pitch',
  hotel: 'Hotel',
  hostel: 'Hostel',
  cinema: 'Cinema',
  theatre: 'Theatre',
  museum: 'Museum',
  gallery: 'Gallery',
  park: 'Park',
  attraction: 'Attraction',
  viewpoint: 'Viewpoint',
  supermarket: 'Supermarket',
  mall: 'Mall',
  pharmacy: 'Pharmacy',
  bank: 'Bank',
  atm: 'ATM',
  fuel: 'Fuel station',
  parking: 'Parking',
  school: 'School',
  hospital: 'Hospital',
  place_of_worship: 'Place of worship',
  gym: 'Gym',
  fitness_centre: 'Gym',
  library: 'Library',
  post_office: 'Post office',
  shop: 'Shop',
}

function friendlyCategory(raw: string): string {
  if (CATEGORY_LABELS[raw]) return CATEGORY_LABELS[raw]
  return raw
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Fetch nearby "objects from the map" (POIs: pubs, restaurants, stadiums,
 * shops...) around a point using the Overpass API. Returns up to 8 named
 * places within the radius.
 */
export async function searchNearby(
  latitude: number,
  longitude: number,
  radius = 800,
): Promise<NearbyPlace[]> {
  const query = `[out:json][timeout:10];(node["amenity"](around:${radius},${latitude},${longitude});node["tourism"](around:${radius},${latitude},${longitude});node["leisure"](around:${radius},${latitude},${longitude});node["shop"](around:${radius},${latitude},${longitude}););out center tags 30;`

  try {
    const res = await fetch(OVERPASS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    })
    if (!res.ok) return []
    const data: any = await res.json()
    const places: NearbyPlace[] = []
    for (const el of data.elements || []) {
      const tags = el.tags || {}
      const name = tags.name
      if (!name) continue
      const lat = el.lat ?? el.center?.lat
      const lon = el.lon ?? el.center?.lon
      if (lat == null || lon == null) continue
      const rawCategory =
        tags.amenity || tags.tourism || tags.leisure || tags.shop || 'place'
      places.push({
        id: el.id,
        name,
        category: friendlyCategory(rawCategory),
        latitude: lat,
        longitude: lon,
      })
    }
    return places.slice(0, 8)
  } catch (error) {
    console.warn('Nearby search failed:', error)
    return []
  }
}

export type { EventLocation }