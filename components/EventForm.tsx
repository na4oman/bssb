import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { Event } from '@/types/event'
import { EventLocation } from '@/types/event'
import { uploadImage } from '@/utils/imageService'
import LocationPicker from './LocationPicker'
import { COLORS, RADIUS, SHADOW, FONT } from '../constants/theme'

interface EventFormProps {
  onAddEvent: (
    eventData: Omit<
      Event,
      'id' | 'likes' | 'comments' | 'attendees' | 'createdBy'
    >
  ) => void
  onClose: () => void
}

const EventForm = ({ onAddEvent, onClose }: EventFormProps) => {
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date(),
    location: '',
    locationCoordinates: undefined as EventLocation | undefined,
    description: '',
    imageUrl: '',
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState<
    boolean | null
  >(null)
  const [hovered, setHovered] = useState(false)

  // Convert a Date to the value format expected by <input type="datetime-local">
  const toDateTimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`
  }

  const DateTimeInput = () => {
    // On web, react-native-modal-datetime-picker / the native datetime picker
    // are unsupported, so fall back to the browser's datetime-local input.
    if (Platform.OS === 'web') {
      return (
        <input
          type='datetime-local'
          value={toDateTimeLocal(newEvent.date)}
          onChange={e => {
            const val = e.target.value
            if (val) {
              setNewEvent(prev => ({ ...prev, date: new Date(val) }))
            }
          }}
          style={{
            width: '100%',
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 10,
            padding: 10,
            marginBottom: 15,
            fontSize: FONT.size.md,
            color: '#000',
            backgroundColor: '#f9f9f9',
            boxSizing: 'border-box',
          }}
        />
      )
    }

    return (
      <View>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {format(newEvent.date, 'MMMM dd, yyyy HH:mm')}
          </Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode='datetime'
          onConfirm={date => {
            setNewEvent(prev => ({ ...prev, date }))
            setShowDatePicker(false)
          }}
          onCancel={() => setShowDatePicker(false)}
          date={newEvent.date}
          accentColor={COLORS.primary}
          buttonTextColorIOS={COLORS.primary}
          themeVariant='light'
        />
      </View>
    )
  }

  const pickImage = async () => {
    // expo-image-picker supports web: skip native permission on the browser.
    if (Platform.OS !== 'web' && mediaLibraryPermission === false) {
      Alert.alert(
        'Permission Required',
        'Please grant media library access in your device settings.',
      )
      return
    }

    try {
      if (Platform.OS !== 'web') {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync()

        if (!permissionResult.granted) {
          setMediaLibraryPermission(false)
          Alert.alert(
            'Permission Denied',
            'Sorry, we need camera roll permissions to make this work!',
          )
          return
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      })

      if (!result.canceled) {
        const selectedAsset = result.assets[0]
        setNewEvent(prevEvent => ({
          ...prevEvent,
          imageUrl: selectedAsset.uri,
        }))
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert(
        'Image Selection Error',
        'Unable to select image. Please try again.',
      )
    }
  }

  const handleAddEvent = async () => {
    try {
      let uploadedImageUrl = newEvent.imageUrl

      // Show creating event message
      Alert.alert('Creating Event', 'Please wait...')

      // Upload image to Cloudinary if a local image was selected
      if (
        newEvent.imageUrl &&
        (newEvent.imageUrl.startsWith('file://') ||
          newEvent.imageUrl.startsWith('data:'))
      ) {
        console.log('Uploading image to Cloudinary...')
        uploadedImageUrl = await uploadImage(newEvent.imageUrl, 'bssb-events')
        console.log('Image uploaded successfully:', uploadedImageUrl)
      }

      // Create event with uploaded image URL
      await onAddEvent({
        ...newEvent,
        imageUrl: uploadedImageUrl,
      })

      console.log('Event created successfully')

      // Reset form
      setNewEvent({
        title: '',
        date: new Date(),
        location: '',
        locationCoordinates: undefined,
        description: '',
        imageUrl: '',
      })

      // The modal will be closed by the parent component after successful creation
    } catch (error) {
      console.error('Error creating event:', error)
      Alert.alert('Error', 'Failed to create event. Please try again.')
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.modalScrollContent}
      keyboardShouldPersistTaps='handled'
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.modalContent}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name='close' size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.modalTitle}>Create New Event</Text>

        <Text style={styles.label}>Event Title</Text>
        <TextInput
          style={styles.input}
          placeholder='Enter event title'
          placeholderTextColor='rgba(92, 87, 87, 0.6)'
          value={newEvent.title}
          onChangeText={text =>
            setNewEvent(prev => ({
              ...prev,
              title: text,
            }))
          }
        />

        <Text style={styles.label}>Date and Time</Text>
        <DateTimeInput />

        <Text style={styles.label}>Location</Text>
        <LocationPicker
          location={newEvent.location}
          coordinates={newEvent.locationCoordinates ?? null}
          onChange={(location, locationCoordinates) =>
            setNewEvent(prev => ({
              ...prev,
              location,
              locationCoordinates: locationCoordinates ?? undefined,
            }))
          }
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder='Enter event description'
          placeholderTextColor='rgba(92, 87, 87, 0.6)'
          multiline={true}
          numberOfLines={4}
          value={newEvent.description}
          onChangeText={text =>
            setNewEvent(prev => ({
              ...prev,
              description: text,
            }))
          }
        />

        <Text style={styles.label}>Event Image</Text>
        <View style={styles.imagePickerContainer}>
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={pickImage}
          >
            <Ionicons name='image-outline' size={24} color='rgba(92, 87, 87, 0.6)' />
            <Text style={styles.imagePickerText}>
              {newEvent.imageUrl ? 'Change Image' : 'Select Image'}
            </Text>
          </TouchableOpacity>

          {newEvent.imageUrl && (
            <Image
              source={{ uri: newEvent.imageUrl }}
              style={styles.selectedImage}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.createEventButton, hovered && styles.createEventButtonHovered]}
          onPress={handleAddEvent}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <Text style={styles.createEventButtonText}>Create Event</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: 20,
    width: '90%',
    alignSelf: 'center',
    maxWidth: 500,
    ...SHADOW.heavy,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(226, 29, 56, 0.1)',
    borderRadius: 20,
    padding: 8,
  },
  closeIcon: {
    color: '#e21d38', // Sunderland red for close icon
  },
  modalTitle: {
    fontSize: FONT.size.xxl,
    fontWeight: 'bold',
    color: COLORS.primary, // Sunderland red for title
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: FONT.size.md,
    color: COLORS.text, // Dark gray for labels
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    fontSize: FONT.size.md,
    color: '#000',
    backgroundColor: '#f9f9f9', // Light background for inputs
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePickerContainer: {
    marginBottom: 20,
  },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: COLORS.primary, // Sunderland red border
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9', // Light background
  },
  imagePickerText: {
    fontSize: FONT.size.md,
    color: COLORS.primary, // Sunderland red text
    marginLeft: 10,
  },
  selectedImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 20,
  },
  createEventButton: {
    backgroundColor: COLORS.primary, // Sunderland red
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    transition: 'background-color 0.15s ease, transform 0.15s ease',
  },
  createEventButtonHovered: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 1.02 }],
  },
  createEventButtonText: {
    fontSize: FONT.size.md,
    color: '#fff',
    fontWeight: 'bold',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  dateButtonText: {
    fontSize: FONT.size.md,
    color: COLORS.text,
  },
})

export default EventForm
