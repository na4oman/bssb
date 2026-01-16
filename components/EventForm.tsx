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
} from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { Event } from '@/types/event'
import { uploadImage } from '@/utils/imageService'

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
    description: '',
    imageUrl: '',
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState<
    boolean | null
  >(null)

  const DateTimeInput = () => {
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
          accentColor='#e21d38'
          buttonTextColorIOS='#e21d38'
          themeVariant='light'
        />
      </View>
    )
  }

  const pickImage = async () => {
    if (mediaLibraryPermission === false) {
      Alert.alert(
        'Permission Required',
        'Please grant media library access in your device settings.'
      )
      return
    }

    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permissionResult.granted) {
        setMediaLibraryPermission(false)
        Alert.alert(
          'Permission Denied',
          'Sorry, we need camera roll permissions to make this work!'
        )
        return
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
        'Unable to select image. Please try again.'
      )
    }
  }

  const handleAddEvent = async () => {
    try {
      let uploadedImageUrl = newEvent.imageUrl

      // Upload image to Cloudinary if a local image was selected
      if (newEvent.imageUrl && newEvent.imageUrl.startsWith('file://')) {
        Alert.alert('Uploading', 'Uploading image...')
        uploadedImageUrl = await uploadImage(newEvent.imageUrl, 'bssb-events')
      }

      // Create event with uploaded image URL
      onAddEvent({
        ...newEvent,
        imageUrl: uploadedImageUrl,
      })

      // Reset form
      setNewEvent({
        title: '',
        date: new Date(),
        location: '',
        description: '',
        imageUrl: '',
      })
      onClose()
    } catch (error) {
      console.error('Error creating event:', error)
      Alert.alert('Error', 'Failed to upload image. Please try again.')
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
          <Ionicons name='close' size={24} color='#e21d38' />
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
        <TextInput
          style={styles.input}
          placeholder='Enter event location'
          placeholderTextColor='rgba(92, 87, 87, 0.6)'
          value={newEvent.location}
          onChangeText={text =>
            setNewEvent(prev => ({
              ...prev,
              location: text,
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
          style={styles.createEventButton}
          onPress={handleAddEvent}
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
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    alignSelf: 'center',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e21d38', // Sunderland red for title
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#333', // Dark gray for labels
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
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
    borderColor: '#e21d38', // Sunderland red border
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9', // Light background
  },
  imagePickerText: {
    fontSize: 16,
    color: '#e21d38', // Sunderland red text
    marginLeft: 10,
  },
  selectedImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 20,
  },
  createEventButton: {
    backgroundColor: '#e21d38', // Sunderland red
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  createEventButtonText: {
    fontSize: 16,
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
    fontSize: 16,
    color: '#333',
  },
})

export default EventForm
