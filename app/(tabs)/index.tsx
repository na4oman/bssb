import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  FlatList,
  SafeAreaView,
  ImageBackground,
  TouchableOpacity,
  Text,
  Image,
  ScrollView,
  TextInput,
} from 'react-native'
import * as Notifications from 'expo-notifications'
import Modal from 'react-native-modal'
import { format } from 'date-fns'
import { Ionicons } from '@expo/vector-icons'

import MainScreen from '../../components/MainScreen'
import EventCard from '../../components/EventCard'
import EventForm from '../../components/EventForm'
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
  // ... (your initial events data)
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
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: false,
//     shouldSetBadge: false,
//   }),
// })

// --- App Component ---
export default function App() {
  // State
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [commentText, setCommentText] = useState('')

  // ... (rest of the component will be added in the next chunks)
  // ... (previous code)

  // ... (previous state variables)

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

  // ... (rest of the component will be added in the next chunks)
  // ... (previous code)

  const toggleLike = (eventId: string) => {
    setEvents(
      events.map(event => {
        if (event.id === eventId) {
          const isLiked = event.likes.includes(currentUser.userId)
          return {
            ...event,
            likes: isLiked
              ? event.likes.filter(id => id !== currentUser.userId)
              : [...event.likes, currentUser.userId],
          }
        }
        return event
      })
    )
  }

  const addComment = (eventId: string) => {
    if (!commentText.trim()) return

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
          return {
            ...event,
            comments: [...event.comments, newComment],
          }
        }
        return event
      })
    )

    setCommentText('')
  }

  const updateAttendanceStatus = (
    eventId: string,
    status: 'going' | 'maybe' | 'not going'
  ) => {
    setEvents(
      events.map(event => {
        if (event.id === eventId) {
          // Remove existing attendance if user already has one
          const filteredAttendees = event.attendees.filter(
            attendee => attendee.userId !== currentUser.userId
          )

          // Add new attendance status
          return {
            ...event,
            attendees: [
              ...filteredAttendees,
              {
                userId: currentUser.userId,
                userName: currentUser.userName,
                status,
              },
            ],
          }
        }
        return event
      })
    )
  }

  // ... (rest of the component will be added in the next chunks)
  // ... (previous code)

  const renderEventDetails = () => {
    if (!selectedEvent) return null

    // Find the most up-to-date event data from the events array
    const currentEvent = events.find(event => event.id === selectedEvent.id)
    if (!currentEvent) return null // Event might have been deleted

    return (
      <Modal
        isVisible={!!selectedEvent}
        onBackdropPress={() => setSelectedEvent(null)}
        style={styles.eventDetailsModal}
        backdropOpacity={0.5}
        animationIn='slideInUp'
        animationOut='slideOutDown'
      >
        <ScrollView style={styles.eventDetailsModalContent}>
          {/* Event Header */}
          <View style={styles.eventDetailsHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedEvent(null)}
            >
              <Ionicons name='close' size={24} color='#e21d38' />
            </TouchableOpacity>
          </View>

          {/* Event Image */}
          <Image
            source={{ uri: currentEvent.imageUrl || DEFAULT_EVENT_IMAGE }}
            style={styles.eventDetailImage}
            resizeMode='cover'
          />

          {/* Event Basic Info */}
          <View style={styles.eventDetailsContent}>
            <Text style={styles.eventDetailsTitle}>{currentEvent.title}</Text>
            <Text style={styles.eventDetailsDate}>
              {format(currentEvent.date, 'MMMM dd, yyyy HH:mm')}
            </Text>
            <Text style={styles.eventDetailsLocation}>
              {currentEvent.location}
            </Text>
            <Text style={styles.eventDetailsDescription}>
              {currentEvent.description}
            </Text>

            {/* Attendance Buttons */}
            <View style={styles.attendanceButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.attendanceButton,
                  currentEvent.attendees.some(
                    a => a.userId === currentUser.userId && a.status === 'going'
                  ) && styles.attendanceButtonActive,
                ]}
                onPress={() => updateAttendanceStatus(currentEvent.id, 'going')}
              >
                <Text
                  style={[
                    styles.attendanceButtonText,
                    currentEvent.attendees.some(
                      a =>
                        a.userId === currentUser.userId && a.status === 'going'
                    ) && { color: '#fff' },
                  ]}
                >
                  Going
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.attendanceButton,
                  currentEvent.attendees.some(
                    a => a.userId === currentUser.userId && a.status === 'maybe'
                  ) && styles.attendanceButtonActive,
                ]}
                onPress={() => updateAttendanceStatus(currentEvent.id, 'maybe')}
              >
                <Text
                  style={[
                    styles.attendanceButtonText,
                    currentEvent.attendees.some(
                      a =>
                        a.userId === currentUser.userId && a.status === 'maybe'
                    ) && { color: '#fff' },
                  ]}
                >
                  Maybe
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.attendanceButton,
                  currentEvent.attendees.some(
                    a =>
                      a.userId === currentUser.userId &&
                      a.status === 'not going'
                  ) && styles.attendanceButtonActive,
                ]}
                onPress={() =>
                  updateAttendanceStatus(currentEvent.id, 'not going')
                }
              >
                <Text
                  style={[
                    styles.attendanceButtonText,
                    currentEvent.attendees.some(
                      a =>
                        a.userId === currentUser.userId &&
                        a.status === 'not going'
                    ) && { color: '#fff' },
                  ]}
                >
                  Not Going
                </Text>
              </TouchableOpacity>
            </View>

            {/* Likes */}
            <View style={styles.likesContainer}>
              <TouchableOpacity onPress={() => toggleLike(currentEvent.id)}>
                <Ionicons
                  name={
                    currentEvent.likes.includes(currentUser.userId)
                      ? 'heart'
                      : 'heart-outline'
                  }
                  size={24}
                  color={
                    currentEvent.likes.includes(currentUser.userId)
                      ? 'red'
                      : 'black'
                  }
                />
              </TouchableOpacity>
              <Text style={styles.likesText}>
                {currentEvent.likes.length} Likes
              </Text>
            </View>

            {/* Attendees */}
            <View style={styles.attendeesContainer}>
              <Text style={styles.attendeesTitle}>Attendees</Text>
              {['going', 'maybe', 'not going'].map(status => {
                const statusAttendees = currentEvent.attendees.filter(
                  a => a.status === status
                )
                return statusAttendees.length > 0 ? (
                  <View key={status}>
                    <Text style={styles.attendeeStatusTitle}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}:{' '}
                      {statusAttendees.length}
                    </Text>
                    {statusAttendees.map(attendee => (
                      <Text key={attendee.userId} style={styles.attendeeItem}>
                        {attendee.userName}
                      </Text>
                    ))}
                  </View>
                ) : null
              })}
            </View>

            {/* Comments Section */}
            <View style={styles.commentsContainer}>
              <Text style={styles.commentsTitle}>Comments</Text>
              {currentEvent.comments.map(comment => (
                <View key={comment.id} style={styles.commentItem}>
                  <Text style={styles.commentUserName}>{comment.userName}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <Text style={styles.commentTimestamp}>
                    {format(comment.timestamp, 'MMM dd, HH:mm')}
                  </Text>
                </View>
              ))}
            </View>

            {/* Add Comment */}
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder='Add a comment...'
                multiline
              />
              <TouchableOpacity
                style={styles.sendCommentButton}
                onPress={() => addComment(currentEvent.id)}
              >
                <Ionicons name='send' size={20} color='#fff' />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Modal>
    )
  }

  // ... (rest of the component will be added in the next chunks)
  // ... (previous code)

  // ... (previous code from Chunk 4: renderEventDetails function)

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
              <EventCard event={item} onPress={() => setSelectedEvent(item)} />
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
          {selectedEvent && renderEventDetails()}
        </View>
      </ImageBackground>
    </SafeAreaView>
  )
}

// ... (previous code)

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
  eventDetailsModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  eventDetailsModalContent: {
    backgroundColor: 'white',
    maxHeight: '90%',
  },
  eventDetailsHeader: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
    padding: 15,
  },
  closeButton: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 20,
  },
  eventDetailImage: {
    width: '100%',
    height: 250,
  },
  eventDetailsContent: {
    padding: 20,
  },
  eventDetailsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  eventDetailsDate: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    fontWeight: '500',
  },
  eventDetailsLocation: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    fontWeight: '500',
  },
  eventDetailsDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    lineHeight: 24,
  },
  attendanceButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 5,
  },
  attendanceButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 3,
  },
  attendanceButtonActive: {
    backgroundColor: '#e21d38',
  },
  attendanceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  likesText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  attendeesContainer: {
    marginBottom: 20,
    paddingHorizontal: 10, // Add some horizontal padding
  },
  attendeesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e21d38',
    marginBottom: 10,
    paddingHorizontal: 10, // Add some horizontal padding
  },
  attendeeStatusTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    fontWeight: '600', // Make the status title a bit bolder
    paddingHorizontal: 10, // Add some horizontal padding
  },
  attendeeItem: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    paddingVertical: 5, // Add some vertical padding
    paddingHorizontal: 20, // Add more horizontal padding for indentation
    borderBottomWidth: 1, // Add a subtle border between attendees
    borderBottomColor: '#eee', // Light gray border color
  },
  commentsContainer: {
    marginTop: 10,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  commentItem: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 10,
  },
  commentUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  commentText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  commentTimestamp: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  commentInput: {
    flex: 1,
    height: 40,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    marginRight: 10,
    paddingHorizontal: 15,
  },
  sendCommentButton: {
    backgroundColor: '#e21d38',
    padding: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
})
