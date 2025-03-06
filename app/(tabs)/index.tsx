// d:\WebDev Projects\bssb\index.tsx

import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  FlatList,
  SafeAreaView,
  ImageBackground,
} from 'react-native'
import * as Notifications from 'expo-notifications'
import MainScreen from '../../components/MainScreen'
import EventForm from '../../components/EventForm'
import EventList from '../../components/EventList'
import EventCard from '../../components/EventCard'
import EventDetailsModal from '../../components/EventDetailsModal'
import { Event, EventComment, EventAttendee } from '../../types/event'

// Restore the default event image
const DEFAULT_EVENT_IMAGE =
  'https://www.sunderlandecho.com/webimg/b25lY21zOmI3MGJlOTU0LWYzZWYtNDdjOC04ZjQwLTE4NDlhOWM2MmQ1YTo3MmI1NjBkOS01NDM5LTQzOGEtOWFkNy1kYmZkZmViNjUyYmI=.jpg?width=1200&enable=upscale'

// New background image from assets
const BACKGROUND_IMAGE = require('../../assets/images/index-background.jpg')

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

export default function App() {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [currentUser, setCurrentUser] = useState({
    userId: 'user3',
    userName: 'Alice Brown',
  })

  const addEvent = (
    eventData: Omit<
      Event,
      'id' | 'likes' | 'comments' | 'attendees' | 'createdBy'
    >
  ) => {
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString(),
      likes: [],
      comments: [],
      attendees: [],
      createdBy: {
        userId: currentUser.userId,
        userName: currentUser.userName,
      },
    }
    setEvents([...events, newEvent])
  }

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event)
  }

  const handleCloseModal = () => {
    setSelectedEvent(null)
  }

  const toggleLike = (eventId: string) => {
    setEvents(
      events.map(event => {
        if (event.id === eventId) {
          const userIdIndex = event.likes.indexOf(currentUser.userId)
          if (userIdIndex === -1) {
            return { ...event, likes: [...event.likes, currentUser.userId] }
          } else {
            return {
              ...event,
              likes: event.likes.filter(id => id !== currentUser.userId),
            }
          }
        }
        return event
      })
    )
  }

  const addComment = (eventId: string, commentText: string) => {
    if (commentText.trim() === '') return
    const newComment: EventComment = {
      id: Date.now().toString(),
      userId: currentUser.userId,
      userName: currentUser.userName,
      text: commentText,
      timestamp: new Date(),
    }
    setEvents(
      events.map(event => {
        if (event.id === eventId) {
          return { ...event, comments: [...event.comments, newComment] }
        }
        return event
      })
    )
  }

  const updateAttendanceStatus = (
    eventId: string,
    status: 'going' | 'maybe' | 'not going'
  ) => {
    setEvents(
      events.map(event => {
        if (event.id === eventId) {
          const existingAttendeeIndex = event.attendees.findIndex(
            a => a.userId === currentUser.userId
          )
          let updatedAttendees: EventAttendee[]
          if (existingAttendeeIndex !== -1) {
            updatedAttendees = [...event.attendees]
            updatedAttendees[existingAttendeeIndex] = {
              ...updatedAttendees[existingAttendeeIndex],
              status,
            }
          } else {
            updatedAttendees = [
              ...event.attendees,
              {
                userId: currentUser.userId,
                userName: currentUser.userName,
                status,
              },
            ]
          }
          return { ...event, attendees: updatedAttendees }
        }
        return event
      })
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={BACKGROUND_IMAGE} // Use the new background image
        defaultSource={{ uri: DEFAULT_EVENT_IMAGE }} // Fallback to default image
        style={styles.backgroundImage}
        resizeMode='cover'
      >
        <View style={styles.overlay}>
          <MainScreen onAddEvent={addEvent} />
          <FlatList
            data={events}
            renderItem={({ item }) => (
              <EventCard event={item} onPress={handleEventPress} />
            )}
            keyExtractor={item => item.id}
          />
          <EventDetailsModal
            event={selectedEvent}
            onClose={handleCloseModal}
            currentUser={currentUser}
            toggleLike={toggleLike}
            addComment={addComment}
            updateAttendanceStatus={updateAttendanceStatus}
          />
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
})
