import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
// Type-only import: erased at compile time, so leaflet's JS never runs during
// server-side rendering (leaflet accesses `window` at module scope).
import type {
  Map as LeafletMap,
  Marker as LeafletMarker,
  DivIcon,
  LeafletMouseEvent,
} from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  searchPlaces,
  reverseGeocode,
  searchNearby,
  PlaceResult,
  NearbyPlace,
} from '../utils/geocoding'
import { EventLocation } from '../types/event'

export type LocationPickerProps = {
  location: string
  coordinates: EventLocation | null
  onChange: (location: string, coordinates: EventLocation | null) => void
}

type LeafletModule = typeof import('leaflet')

// Default view: Sofia, Bulgaria (home of the supporters branch)
const DEFAULT_CENTER: [number, number] = [42.6977, 23.3219]
const DEFAULT_ZOOM = 12

// Lazy-initialized once leaflet is loaded client-side. The icon is a simple
// red circle (matches the app's brand color).
let pinIcon: DivIcon | null = null
function getPinIcon(L: LeafletModule): DivIcon {
  if (!pinIcon) {
    pinIcon = L.divIcon({
      className: '',
      html: '<div style="width:26px;height:26px;background:#e21d38;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    })
  }
  return pinIcon
}

/**
 * Web location picker: Leaflet map (OpenStreetMap tiles, no API key) with
 * Nominatim search. Click the map or pick a search result to set the
 * event location; the coordinates are stored alongside the place name.
 *
 * Leaflet is loaded via dynamic import so the module never executes during
 * server-side rendering (it references `window` at module scope).
 */
const LocationPicker = ({
  location,
  coordinates,
  onChange,
}: LocationPickerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const leafletRef = useRef<LeafletModule | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [leafletReady, setLeafletReady] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [nearby, setNearby] = useState<NearbyPlace[]>([])
  const [nearbyLoading, setNearbyLoading] = useState(false)

  // Load leaflet client-side only (SSR-safe)
  useEffect(() => {
    let cancelled = false
    import('leaflet').then(mod => {
      if (cancelled) return
      leafletRef.current = mod
      setLeafletReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const setMarker = (lat: number, lng: number) => {
    const L = leafletRef.current
    if (!L || !mapRef.current) return
    markerRef.current?.remove()
    markerRef.current = L.marker([lat, lng], { icon: getPinIcon(L) }).addTo(
      mapRef.current,
    )
  }

  // Initialize the map once leaflet is loaded
  useEffect(() => {
    const L = leafletRef.current
    if (!leafletReady || !L || !containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    map.on('click', async (e: LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      setMarker(lat, lng)
      setGeocoding(true)
      const result = await reverseGeocode(lat, lng)
      setGeocoding(false)
      onChange(
        result?.displayName || `Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
        { latitude: lat, longitude: lng },
      )
    })

    mapRef.current = map

    // The modal animates in, so the container may have zero size at init —
    // refresh the map once the layout settles.
    const t = setTimeout(() => map.invalidateSize(), 150)

    return () => {
      clearTimeout(t)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [leafletReady])

  // Keep the marker in sync with external changes (e.g. form reset)
  useEffect(() => {
    if (!mapRef.current) return
    if (coordinates) {
      setMarker(coordinates.latitude, coordinates.longitude)
    } else {
      markerRef.current?.remove()
      markerRef.current = null
    }
  }, [coordinates])

  // Fetch nearby places ("objects from the map") around the pinned point
  useEffect(() => {
    if (!coordinates) {
      setNearby([])
      return
    }
    let cancelled = false
    setNearbyLoading(true)
    searchNearby(coordinates.latitude, coordinates.longitude).then(places => {
      if (cancelled) return
      setNearby(places)
      setNearbyLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [coordinates])

  const handleSearch = (text: string) => {
    setQuery(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (text.trim().length < 3) {
      setResults([])
      setShowResults(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const res = await searchPlaces(text)
      setResults(res)
      setSearching(false)
      setShowResults(true)
    }, 400)
  }

  const selectPlace = (place: PlaceResult) => {
    setQuery(place.name)
    setShowResults(false)
    setMarker(place.latitude, place.longitude)
    mapRef.current?.setView([place.latitude, place.longitude], 15)
    onChange(place.name, {
      latitude: place.latitude,
      longitude: place.longitude,
    })
  }

  const selectNearby = (place: NearbyPlace) => {
    setMarker(place.latitude, place.longitude)
    mapRef.current?.setView([place.latitude, place.longitude], 16)
    onChange(place.name, {
      latitude: place.latitude,
      longitude: place.longitude,
    })
  }

  const clearLocation = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
    markerRef.current?.remove()
    markerRef.current = null
    onChange('', null)
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.searchBox}>
        <Ionicons name='search' size={18} color='#999' />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={handleSearch}
          placeholder='Search for a location...'
          placeholderTextColor='#999'
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearLocation} accessibilityLabel='Clear location'>
            <Ionicons name='close-circle' size={18} color='#999' />
          </TouchableOpacity>
        )}
      </View>

      {showResults && (
        <View style={styles.results}>
          {searching ? (
            <ActivityIndicator size='small' color='#e21d38' style={styles.resultsLoading} />
          ) : results.length === 0 ? (
            <Text style={styles.noResults}>No results found</Text>
          ) : (
            results.map(place => (
              <TouchableOpacity
                key={place.placeId}
                style={styles.resultItem}
                onPress={() => selectPlace(place)}
              >
                <Ionicons name='location-outline' size={16} color='#e21d38' />
                <Text style={styles.resultText} numberOfLines={2}>
                  {place.name}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      <div
        ref={containerRef}
        style={{ height: 240, borderRadius: 10, overflow: 'hidden', zIndex: 0 }}
      />

      {(nearbyLoading || nearby.length > 0) && (
        <View style={styles.nearbySection}>
          <Text style={styles.nearbyTitle}>Nearby places</Text>
          {nearbyLoading ? (
            <ActivityIndicator
              size='small'
              color='#e21d38'
              style={styles.nearbyLoading}
            />
          ) : nearby.length === 0 ? (
            <Text style={styles.nearbyEmpty}>No nearby places found</Text>
          ) : (
            nearby.map(place => (
              <TouchableOpacity
                key={place.id}
                style={styles.nearbyItem}
                onPress={() => selectNearby(place)}
              >
                <Ionicons name='business-outline' size={16} color='#e21d38' />
                <View style={styles.nearbyTextWrap}>
                  <Text style={styles.nearbyName} numberOfLines={1}>
                    {place.name}
                  </Text>
                  <Text style={styles.nearbyCategory}>{place.category}</Text>
                </View>
                <Ionicons name='chevron-forward' size={14} color='#ccc' />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      <View style={styles.captionRow}>
        {geocoding ? (
          <>
            <ActivityIndicator size='small' color='#e21d38' />
            <Text style={styles.caption}>Getting address...</Text>
          </>
        ) : location ? (
          <>
            <Ionicons name='checkmark-circle' size={18} color='#2e7d32' />
            <View style={styles.captionTextWrap}>
              <Text style={[styles.caption, styles.captionSet]} numberOfLines={2}>
                Selected: {location}
              </Text>
              {coordinates && (
                <Text style={styles.coordsText}>
                  {coordinates.latitude.toFixed(5)},{' '}
                  {coordinates.longitude.toFixed(5)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={clearLocation}
              accessibilityLabel='Remove location'
              style={styles.removeBtn}
            >
              <Ionicons name='close' size={16} color='#999' />
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Ionicons name='location-outline' size={16} color='#999' />
            <Text style={styles.caption}>
              Click the map or search to set the location
            </Text>
          </>
        )}
      </View>
    </View>
  )
}

export default LocationPicker

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 15,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000',
  },
  results: {
    position: 'absolute' as any,
    top: 44,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  resultsLoading: {
    paddingVertical: 14,
  },
  noResults: {
    padding: 14,
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  resultText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  captionTextWrap: {
    flex: 1,
  },
  caption: {
    flex: 1,
    fontSize: 13,
    color: '#999',
  },
  captionSet: {
    color: '#333',
    fontWeight: '600',
  },
  coordsText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  nearbySection: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  nearbyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  nearbyLoading: {
    paddingVertical: 12,
  },
  nearbyEmpty: {
    padding: 12,
    color: '#999',
    fontSize: 13,
  },
  nearbyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    gap: 8,
  },
  nearbyTextWrap: {
    flex: 1,
  },
  nearbyName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  nearbyCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeText: {
    fontSize: 12,
    color: '#999',
  },
})