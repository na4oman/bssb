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
import MapView, { Marker } from 'react-native-maps'
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

// Default view: Sofia, Bulgaria (home of the supporters branch)
const DEFAULT_REGION = {
  latitude: 42.6977,
  longitude: 23.3219,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
}

const INITIAL_REGION = {
  latitude: 42.6977,
  longitude: 23.3219,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
}

/**
 * Native location picker: react-native-maps (Apple Maps on iOS, Google Maps
 * on Android) with Nominatim search. Tap the map or pick a search result to
 * set the event location.
 */
const LocationPicker = ({
  location,
  coordinates,
  onChange,
}: LocationPickerProps) => {
  const mapRef = useRef<MapView | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [nearby, setNearby] = useState<NearbyPlace[]>([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate
    setGeocoding(true)
    const result = await reverseGeocode(latitude, longitude)
    setGeocoding(false)
    onChange(
      result?.displayName ||
        `Location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
      { latitude, longitude },
    )
  }

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
    mapRef.current?.animateToRegion(
      {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      500,
    )
    onChange(place.name, {
      latitude: place.latitude,
      longitude: place.longitude,
    })
  }

  const selectNearby = (place: NearbyPlace) => {
    mapRef.current?.animateToRegion(
      {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500,
    )
    onChange(place.name, {
      latitude: place.latitude,
      longitude: place.longitude,
    })
  }

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

  const clearLocation = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
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
          <TouchableOpacity
            onPress={clearLocation}
            accessibilityLabel='Clear location'
          >
            <Ionicons name='close-circle' size={18} color='#999' />
          </TouchableOpacity>
        )}
      </View>

      {showResults && (
        <View style={styles.results}>
          {searching ? (
            <ActivityIndicator
              size='small'
              color='#e21d38'
              style={styles.resultsLoading}
            />
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

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        onPress={handleMapPress}
      >
        {coordinates && (
          <Marker coordinate={coordinates} pinColor='#e21d38' />
        )}
      </MapView>

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
              Tap the map or search to set the location
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
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
    maxHeight: 200,
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
  map: {
    height: 240,
    borderRadius: 10,
    overflow: 'hidden',
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