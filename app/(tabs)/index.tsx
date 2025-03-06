// d:\WebDev Projects\bssb\app\(tabs)\index.tsx

import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  FlatList,
  SafeAreaView,
  ImageBackground,
  TouchableOpacity,
  Text,
} from 'react-native'
import * as Notifications from 'expo-notifications'
import Modal from 'react-native-modal'

import MainScreen from '../../components/MainScreen'
import EventCard from '../../components/EventCard'
import EventForm from '../../components/EventForm' // Import EventForm
import { Event, EventComment, EventAttendee } from '../../types/event'

// Constants
const DEFAULT_EVENT_IMAGE =
  'https://www.sunderlandecho.com/webimg/b25lY21zOmI3MGJlOTU0LWYzZWYtNDdjOC04ZjQwLTE4NDlhOWM2MmQ1YTo3MmI1NjBkOS01NDM5LTQzOGEtOWFkNy1kYmZkZmViNjUyYmI=.jpg?width=1200&enable=upscale'
const BACKGROUND_IMAGE = require('../../assets/images/index-background.jpg')

// Simulated current user
const currentUser = {
  userId: 'user123',
  userName: 'John Doe',
}

// Mock data for testing
const initialEvents: Event[] = [
  {
    id: '1',
    title: 'Beach Cleanup',
    date: new Date(2024, 6, 15, 10, 0),
    location: 'Santa Monica Beach',
    description: 'Help us clean up the beach!',
    createdBy: { userId: 'user1', userName: 'John Doe' },
    likes: ['user1', 'user2'],
    comments: [
      {
        id: 'comment1',
        userId: 'user2',
        userName: 'Jane Smith',
        text: 'Sounds great!',
        timestamp: new Date(),
      },
    ],
    attendees: [
      { userId: 'user1', userName: 'John Doe', status: 'going' },
      { userId: 'user2', userName: 'Jane Smith', status: 'maybe' },
    ],
  },
  {
    id: '2',
    title: 'Community Picnic',
    date: new Date(2024, 7, 2, 12, 0),
    location: 'Central Park',
    description: 'Join us for a fun picnic!',
    createdBy: { userId: 'user2', userName: 'Jane Smith' },
    likes: ['user2'],
    comments: [],
    attendees: [{ userId: 'user2', userName: 'Jane Smith', status: 'going' }],
  },
]

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

// --- App Component ---
export default function App() {
  // State
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [modalVisible, setModalVisible] = useState(false)

  // --- addEvent function ---
  const addEvent = (
    eventData: Omit<
      Event,
      'id' | 'likes' | 'comments' | 'attendees' | 'createdBy'
    >
  ) => {
    const event: Event = {
      ...eventData,
      id: Date.now().toString(),
      likes: [],
      comments: [],
      attendees: [],
      createdBy: currentUser,
    }

    // Add event to events list (newest first)
    setEvents([event, ...events])

    // Close modal
    setModalVisible(false)
  }

  const handleModalClose = () => {
    setModalVisible(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={BACKGROUND_IMAGE}
        defaultSource={{ uri: DEFAULT_EVENT_IMAGE }}
        style={styles.backgroundImage}
        resizeMode='cover'
      >
        <View style={styles.overlay}>
          {/* --- MainScreen Component --- */}
          <MainScreen onModalPress={() => setModalVisible(true)} />
          {/* --- End of MainScreen Component --- */}

          <FlatList
            data={events}
            renderItem={({ item }) => (
              <EventCard event={item} onPress={() => console.log(item)} />
            )}
            keyExtractor={item => item.id}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No events yet</Text>
              </View>
            }
          />
          <Modal
            isVisible={modalVisible}
            onBackdropPress={handleModalClose}
            style={styles.createEventModal}
            backdropOpacity={0.5}
            animationIn='slideInUp'
            animationOut='slideOutDown'
          >
            <EventForm onAddEvent={addEvent} onClose={handleModalClose} />
          </Modal>
        </View>
      </ImageBackground>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  createEventModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
})
