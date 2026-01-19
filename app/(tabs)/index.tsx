import React, { useState, useEffect } from 'react'
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
  Alert,
} from 'react-native'
import * as Notifications from 'expo-notifications'
import Modal from 'react-native-modal'
import { format } from 'date-fns'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentUser } from '../../utils/userUtils'

import MainScreen from '../../components/MainScreen'
import EventCard from '../../components/EventCard'
import EventForm from '../../components/EventForm'
import { Event, EventComment } from '../../types/event'
import {
  createEvent,
  subscribeToEvents,
  toggleEventLike,
  addEventComment,
  updateEventAttendance,
} from '../../utils/eventService'
import { uploadImage } from '../../utils/imageService'
import { markEventAsSeen } from '../../utils/seenEventsService'
import * as ImagePicker from 'expo-image-picker'

// Constants
const DEFAULT_EVENT_IMAGE =
  'https://www.sunderlandecho.com/webimg/b25lY21zOmI3MGJlOTU0LWYzZWYtNDdjOC04ZjQwLTE4NDlhOWM2MmQ1YTo3MmI1NjBkOS01NDM5LTQzOGEtOWFkNy1kYmZkZmViNjUyYmI=.jpg?width=1200&enable=upscale'
const BACKGROUND_IMAGE = require('../../assets/images/index-background.jpg')

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
  const { user } = useAuth()
  const currentUser = getCurrentUser(user)

  // State
  const [events, setEvents] = useState<Event[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [commentText, setCommentText] = useState('')
  const [commentImage, setCommentImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Subscribe to events from Firebase
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToEvents((eventsData) => {
        setEvents(eventsData)
        setLoading(false)
      })

      return () => unsubscribe()
    } else {
      setLoading(false)
    }
  }, [user])

  // --- addEvent function ---
  const addEvent = async (
    eventData: Omit<
      Event,
      'id' | 'likes' | 'comments' | 'attendees' | 'createdBy'
    >
  ) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create events.')
      return
    }

    try {
      const eventWithCreator = {
        ...eventData,
        createdBy: {
          userId: user.uid,
          userName: currentUser.userName,
        },
      }

      // Create event in Firebase
      await createEvent(eventWithCreator)

      // Close modal
      setModalVisible(false)

      // Send push notifications (optional - implement if needed)
      // try {
      //   const tokens = await getAllPushTokens()
      //   if (tokens.length > 0) {
      //     await sendPushNotifications(
      //       tokens,
      //       'New Event Created',
      //       `${eventData.title} on ${format(eventData.date, 'MMM dd, yyyy HH:mm')}`
      //     )
      //   }
      // } catch (e) {
      //   console.error('Error sending push notifications:', e)
      // }
    } catch (error) {
      console.error('Error creating event:', error)
      Alert.alert('Error', 'Failed to create event. Please try again.')
    }
  }

  const handleModalClose = () => {
    setModalVisible(false)
  }

  const toggleLike = async (eventId: string) => {
    if (!user) return

    try {
      const event = events.find(e => e.id === eventId)
      if (!event) return

      const isLiked = event.likes.includes(user.uid)
      await toggleEventLike(eventId, user.uid, isLiked)
    } catch (error) {
      console.error('Error toggling like:', error)
      Alert.alert('Error', 'Failed to update like. Please try again.')
    }
  }

  const pickCommentImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Denied',
          'Sorry, we need camera roll permissions to attach images!'
        )
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      })

      if (!result.canceled) {
        setCommentImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Unable to select image. Please try again.')
    }
  }

  const addComment = async (eventId: string) => {
    console.log('addComment called with eventId:', eventId)
    console.log('commentText:', commentText)
    console.log('commentImage:', commentImage)
    console.log('user:', user)
    
    if ((!commentText.trim() && !commentImage) || !user) {
      console.log('Validation failed - missing text/image or user not logged in')
      return
    }

    try {
      let uploadedImageUrl: string | undefined

      // Upload image if one was selected
      if (commentImage) {
        try {
          console.log('Attempting to upload image to Cloudinary...')
          uploadedImageUrl = await uploadImage(commentImage, 'bssb-comments')
          console.log('Image uploaded successfully:', uploadedImageUrl)
        } catch (imageError) {
          console.error('Image upload failed, posting comment without image:', imageError)
          // Continue without image if upload fails
          uploadedImageUrl = undefined
        }
      }

      console.log('Adding comment to event:', eventId)
      console.log('User info:', { uid: user.uid, userName: currentUser.userName })
      
      await addEventComment(eventId, {
        userId: user.uid,
        userName: currentUser.userName,
        text: commentText,
        imageUrl: uploadedImageUrl,
      })

      console.log('Comment added successfully')
      setCommentText('')
      setCommentImage(null)
    } catch (error) {
      console.error('Error adding comment:', error)
      Alert.alert('Error', `Failed to add comment: ${error.message || error}`)
    }
  }

  const updateAttendanceStatus = async (
    eventId: string,
    status: 'going' | 'maybe' | 'not going'
  ) => {
    if (!user) return

    try {
      await updateEventAttendance(eventId, {
        userId: user.uid,
        userName: currentUser.userName,
        status,
      })
    } catch (error) {
      console.error('Error updating attendance:', error)
      Alert.alert('Error', 'Failed to update attendance. Please try again.')
    }
  }

  const renderEventDetails = () => {
    if (!selectedEvent) return null

    // Mark event as seen when opened
    if (user) {
      markEventAsSeen(user.uid, selectedEvent.id)
    }

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
                    a => a.userId === user?.uid && a.status === 'going'
                  ) && styles.attendanceButtonActive,
                ]}
                onPress={() => updateAttendanceStatus(currentEvent.id, 'going')}
              >
                <Text
                  style={[
                    styles.attendanceButtonText,
                    currentEvent.attendees.some(
                      a => a.userId === user?.uid && a.status === 'going'
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
                    a => a.userId === user?.uid && a.status === 'maybe'
                  ) && styles.attendanceButtonActive,
                ]}
                onPress={() => updateAttendanceStatus(currentEvent.id, 'maybe')}
              >
                <Text
                  style={[
                    styles.attendanceButtonText,
                    currentEvent.attendees.some(
                      a => a.userId === user?.uid && a.status === 'maybe'
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
                    a => a.userId === user?.uid && a.status === 'not going'
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
                      a => a.userId === user?.uid && a.status === 'not going'
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
                    currentEvent.likes.includes(user?.uid || '')
                      ? 'heart'
                      : 'heart-outline'
                  }
                  size={24}
                  color={
                    currentEvent.likes.includes(user?.uid || '')
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
                  {comment.text ? (
                    <Text style={styles.commentText}>{comment.text}</Text>
                  ) : null}
                  {comment.imageUrl && (
                    <Image
                      source={{ uri: comment.imageUrl }}
                      style={styles.commentImage}
                      resizeMode='cover'
                    />
                  )}
                  <Text style={styles.commentTimestamp}>
                    {format(comment.timestamp, 'MMM dd, HH:mm')}
                  </Text>
                </View>
              ))}
            </View>

            {/* Add Comment */}
            <View style={styles.addCommentContainer}>
              <View style={styles.commentInputWrapper}>
                {commentImage && (
                  <View style={styles.commentImagePreview}>
                    <Image
                      source={{ uri: commentImage }}
                      style={styles.commentImagePreviewImage}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setCommentImage(null)}
                    >
                      <Ionicons name='close-circle' size={24} color='#e21d38' />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.commentInputRow}>
                  <TouchableOpacity
                    style={styles.attachImageButton}
                    onPress={pickCommentImage}
                  >
                    <Ionicons name='image-outline' size={24} color='#666' />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.commentInput}
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder='Add a comment...'
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.sendCommentButton}
                    onPress={() => addComment(selectedEvent.id)}
                  >
                    <Ionicons name='send' size={20} color='#fff' />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </Modal>
    )
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
              <EventCard event={item} onPress={() => setSelectedEvent(item)} />
            )}
            keyExtractor={item => item.id}
            refreshing={loading}
            onRefresh={() => {
              // Events are automatically updated via subscription
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {loading ? 'Loading events...' : user ? 'No events yet' : 'Please log in to see events'}
                </Text>
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
    paddingHorizontal: 10,
  },
  attendeesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e21d38',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  attendeeStatusTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    fontWeight: '600',
    paddingHorizontal: 10,
  },
  attendeeItem: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    marginBottom: 5,
  },
  commentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 5,
  },
  commentTimestamp: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
  addCommentContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: 'white',
    paddingBottom: 10,
  },
  commentInputWrapper: {
    padding: 15,
  },
  commentImagePreview: {
    position: 'relative',
    marginBottom: 10,
  },
  commentImagePreviewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachImageButton: {
    padding: 8,
    marginRight: 5,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
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