import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Image,
  ImageBackground,
  Dimensions,
  Alert,
  Modal as RNModal,
  Button,
} from 'react-native'
import { format } from 'date-fns'
import { Ionicons } from '@expo/vector-icons'
import Modal from 'react-native-modal'
import * as ImagePicker from 'expo-image-picker'

// Custom type definition for location
type Location = {
  latitude: number
  longitude: number
  placeName?: string
}

// Fallback location
const DEFAULT_LOCATION = {
  latitude: 54.9146,
  longitude: -1.3882,
  placeName: 'Stadium of Light, Sunderland',
}

// Restore the default event image
const DEFAULT_EVENT_IMAGE =
  'https://www.sunderlandecho.com/webimg/b25lY21zOmI3MGJlOTU0LWYzZWYtNDdjOC04ZjQwLTE4NDlhOWM2MmQ1YTo3MmI1NjBkOS01NDM5LTQzOGEtOWFkNy1kYmZkZmViNjUyYmI=.jpg?width=1200&enable=upscale'

// New background image from assets
const BACKGROUND_IMAGE = require('../../assets/images/index-background.jpg')

// Simulated current user (in a real app, this would come from authentication)
const currentUser = {
  userId: 'user123',
  userName: 'John Doe',
}

// Define type for Firebase messaging payload
interface NotificationPayload {
  notification?: {
    title?: string
    body?: string
  }
  data?: Record<string, string>
}

// Request media library permissions
const requestMediaLibraryPermission = async () => {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    const isGranted = status === 'granted'
    return isGranted
  }
  return true
}

// Main component
export default function IndexScreen(): React.ReactElement | any {
  // State definitions
  const [events, setEvents] = useState<Event[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [commentText, setCommentText] = useState('')
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date(),
    location: '',
    description: '',
    imageUrl: '',
    locationCoordinates: undefined as Location | undefined,
  })
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState<
    boolean | null
  >(null)
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [mode, setMode] = useState<'date' | 'time'>('date')
  const [tempDate, setTempDate] = useState(new Date())
  const [selectedHour, setSelectedHour] = useState(new Date().getHours())
  const [selectedMinute, setSelectedMinute] = useState(new Date().getMinutes())
  const [timeSubMode, setTimeSubMode] = useState<'hours' | 'minutes'>('hours')

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const renderCalendar = () => {
    const firstDayOfMonth = new Date(
      tempDate.getFullYear(),
      tempDate.getMonth(),
      1
    )
    const lastDayOfMonth = new Date(
      tempDate.getFullYear(),
      tempDate.getMonth() + 1,
      0
    )
    const startingDay = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(tempDate.getFullYear(), tempDate.getMonth(), day)
      const isSelected = date.toDateString() === selectedDate.toDateString()

      days.push(
        <TouchableOpacity
          key={day}
          style={[styles.dayCell, isSelected && styles.selectedDayCell]}
          onPress={() => {
            const newDate = new Date(selectedDate)
            newDate.setFullYear(tempDate.getFullYear())
            newDate.setMonth(tempDate.getMonth())
            newDate.setDate(day)
            setSelectedDate(newDate)
          }}
        >
          <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
            {day}
          </Text>
        </TouchableOpacity>
      )
    }

    return <View style={styles.calendarGrid}>{days}</View>
  }

  const renderAnalogClock = () => {
    const numbers =
      timeSubMode === 'hours'
        ? Array.from({ length: 12 }, (_, i) => i + 1)
        : Array.from({ length: 12 }, (_, i) => i * 5)

    return (
      <View style={styles.timePickerContainer}>
        <View style={styles.timeTabs}>
          <TouchableOpacity
            style={[
              styles.timeTab,
              timeSubMode === 'hours' && styles.activeTimeTab,
            ]}
            onPress={() => setTimeSubMode('hours')}
          >
            <Text
              style={[
                styles.timeTabText,
                timeSubMode === 'hours' && styles.activeTimeTabText,
              ]}
            >
              {String(selectedHour).padStart(2, '0')}
            </Text>
          </TouchableOpacity>
          <Text style={styles.timeTabSeparator}>:</Text>
          <TouchableOpacity
            style={[
              styles.timeTab,
              timeSubMode === 'minutes' && styles.activeTimeTab,
            ]}
            onPress={() => setTimeSubMode('minutes')}
          >
            <Text
              style={[
                styles.timeTabText,
                timeSubMode === 'minutes' && styles.activeTimeTabText,
              ]}
            >
              {String(selectedMinute).padStart(2, '0')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.clockContainer}>
          <View style={styles.clockFace}>
            {numbers.map(num => {
              const angle =
                (num * (timeSubMode === 'hours' ? 30 : 6) - 90) *
                (Math.PI / 180)
              const x = Math.cos(angle) * 80 + 100
              const y = Math.sin(angle) * 80 + 100

              return (
                <TouchableOpacity
                  key={`${timeSubMode}-${num}`}
                  style={[styles.clockNumber, { left: x - 15, top: y - 15 }]}
                  onPress={() => handleTimeChange(num)}
                >
                  <Text
                    style={[
                      styles.clockNumberText,
                      (timeSubMode === 'hours'
                        ? selectedHour === num
                        : selectedMinute === num) && styles.selectedTime,
                    ]}
                  >
                    {String(num).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              )
            })}
            <View style={styles.clockCenter} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmTimeButton, { marginTop: 20 }]}
          onPress={handleDateChange}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const handleDateChange = () => {
    console.log('Confirming time:', { selectedHour, selectedMinute })
    const newDate = new Date(selectedDate)
    newDate.setHours(selectedHour)
    newDate.setMinutes(selectedMinute)
    console.log('New date:', newDate)

    setSelectedDate(newDate)
    setNewEvent(prev => ({ ...prev, date: newDate }))

    setDatePickerVisible(false)
  }

  const handleTimeChange = (value: number) => {
    console.log('Time change:', { mode: timeSubMode, value })
    if (timeSubMode === 'hours') {
      setSelectedHour(value)
      console.log('Set hour to:', value)
    } else {
      setSelectedMinute(value)
      console.log('Set minute to:', value)
    }
  }

  const addEvent = () => {
    const event: Event = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: newEvent.date,
      location: newEvent.location,
      description: newEvent.description,
      imageUrl: newEvent.imageUrl || DEFAULT_EVENT_IMAGE,
      locationCoordinates: newEvent.locationCoordinates,
      createdBy: currentUser,
      likes: [],
      comments: [],
      attendees: [],
    }

    // Add event to events list
    setEvents([...events, event])

    // Reset form
    setNewEvent({
      title: '',
      date: new Date(),
      location: '',
      description: '',
      imageUrl: '',
      locationCoordinates: undefined,
    })

    // Close modal
    setModalVisible(false)
  }

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

  const showDateTimePicker = () => {
    setDatePickerVisible(true)
  }

  const DateTimeInput = () => {
    // Web-specific date input
    if (Platform.OS === 'web') {
      return (
        <input
          type='datetime-local'
          value={format(newEvent.date, "yyyy-MM-dd'T'HH:mm")}
          onChange={e => {
            const date = new Date(e.target.value)
            setNewEvent({ ...newEvent, date })
          }}
          style={{
            padding: 10,
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 5,
            marginBottom: 15,
            width: '100%',
          }}
        />
      )
    }

    // Mobile/Native date selection
    return (
      <TouchableOpacity style={styles.dateButton} onPress={showDateTimePicker}>
        <Text style={styles.dateButtonText}>
          {format(newEvent.date, 'MMMM dd, yyyy HH:mm')}
        </Text>
      </TouchableOpacity>
    )
  }

  const renderEventDetails = () => {
    if (!selectedEvent) return null

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
            <TouchableOpacity onPress={() => setSelectedEvent(null)}>
              <Ionicons name='close' size={24} color='black' />
            </TouchableOpacity>
          </View>

          {/* Event Image */}
          <Image
            source={{ uri: selectedEvent.imageUrl || DEFAULT_EVENT_IMAGE }}
            style={styles.eventDetailImage}
            resizeMode='cover'
          />

          {/* Event Basic Info */}
          <View style={styles.eventDetailsContent}>
            <Text style={styles.eventDetailsTitle}>{selectedEvent.title}</Text>
            <Text style={styles.eventDetailsDate}>
              {format(selectedEvent.date, 'MMMM dd, yyyy HH:mm')}
            </Text>
            <Text style={styles.eventDetailsLocation}>
              {selectedEvent.location}
            </Text>
            <Text style={styles.eventDetailsDescription}>
              {selectedEvent.description}
            </Text>

            {/* Attendance Buttons */}
            <View style={styles.attendanceButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.attendanceButton,
                  selectedEvent.attendees.some(
                    a => a.userId === currentUser.userId && a.status === 'going'
                  )
                    ? styles.attendanceButtonActive
                    : {},
                ]}
                onPress={() =>
                  updateAttendanceStatus(selectedEvent.id, 'going')
                }
              >
                <Text style={styles.attendanceButtonText}>Going</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.attendanceButton,
                  selectedEvent.attendees.some(
                    a => a.userId === currentUser.userId && a.status === 'maybe'
                  )
                    ? styles.attendanceButtonActive
                    : {},
                ]}
                onPress={() =>
                  updateAttendanceStatus(selectedEvent.id, 'maybe')
                }
              >
                <Text style={styles.attendanceButtonText}>Maybe</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.attendanceButton,
                  selectedEvent.attendees.some(
                    a =>
                      a.userId === currentUser.userId &&
                      a.status === 'not going'
                  )
                    ? styles.attendanceButtonActive
                    : {},
                ]}
                onPress={() =>
                  updateAttendanceStatus(selectedEvent.id, 'not going')
                }
              >
                <Text style={styles.attendanceButtonText}>Not Going</Text>
              </TouchableOpacity>
            </View>

            {/* Likes */}
            <View style={styles.likesContainer}>
              <TouchableOpacity onPress={() => toggleLike(selectedEvent.id)}>
                <Ionicons
                  name={
                    selectedEvent.likes.includes(currentUser.userId)
                      ? 'heart'
                      : 'heart-outline'
                  }
                  size={24}
                  color={
                    selectedEvent.likes.includes(currentUser.userId)
                      ? 'red'
                      : 'black'
                  }
                />
              </TouchableOpacity>
              <Text style={styles.likesText}>
                {selectedEvent.likes.length} Likes
              </Text>
            </View>

            {/* Attendees */}
            <View style={styles.attendeesContainer}>
              <Text style={styles.attendeesTitle}>Attendees</Text>
              {['going', 'maybe', 'not going'].map(status => {
                const statusAttendees = selectedEvent.attendees.filter(
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
              {selectedEvent.comments.map(comment => (
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
                onPress={() => addComment(selectedEvent.id)}
              >
                <Ionicons name='send' size={24} color='#e21d38' />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Modal>
    )
  }

  const pickImage = async () => {
    // Check if permissions are already known
    if (mediaLibraryPermission === false) {
      Alert.alert(
        'Permission Required',
        'Please grant media library access in your device settings.'
      )
      return
    }

    try {
      // Request permission if not already granted
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

      // Launch image picker with updated API
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      })

      if (!result.canceled) {
        // Handle the selected image
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

  const DatePickerModal = () => {
    const [tempDate, setTempDate] = useState<Date>(new Date(selectedDate))
    const [mode, setMode] = useState<'date' | 'time'>('date')
    const [selectedHour, setSelectedHour] = useState<number>(
      tempDate.getHours()
    )
    const [selectedMinute, setSelectedMinute] = useState<number>(
      tempDate.getMinutes()
    )

    const daysInMonth = new Date(
      tempDate.getFullYear(),
      tempDate.getMonth() + 1,
      0
    ).getDate()
    const firstDayOfMonth = new Date(
      tempDate.getFullYear(),
      tempDate.getMonth(),
      1
    ).getDay()
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]

    const handleDateChange = (): void => {
      const now = new Date()
      now.setSeconds(0, 0)
      const tempDateNormalized = new Date(tempDate)
      tempDateNormalized.setSeconds(0, 0)

      if (tempDateNormalized < now) {
        Alert.alert('Invalid Date', 'Please select a future date and time')
        return
      }

      // Update both the selected date and the new event date
      const updatedDate = new Date(tempDate)
      setSelectedDate(updatedDate)
      setNewEvent(prev => ({
        ...prev,
        date: updatedDate,
      }))
      setDatePickerVisible(false)
    }

    const handleTimeChange = (value: number): void => {
      if (timeSubMode === 'hours') {
        setSelectedHour(value)
      } else {
        setSelectedMinute(value)
      }
    }

    const renderCalendar = (): React.ReactNode[] => {
      const days = []
      const blanks = []

      // Add blank spaces for days before the first day of the month
      for (let i = 0; i < firstDayOfMonth; i++) {
        blanks.push(
          <View key={`blank-${i}`} style={styles.calendarDay}>
            <Text> </Text>
          </View>
        )
      }

      // Add the days of the month
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(tempDate.getFullYear(), tempDate.getMonth(), d)
        const isSelected =
          d === tempDate.getDate() &&
          tempDate.getMonth() === date.getMonth() &&
          tempDate.getFullYear() === date.getFullYear()

        days.push(
          <TouchableOpacity
            key={d}
            style={[styles.calendarDay, isSelected && styles.selectedDay]}
            onPress={() => {
              const newDate = new Date(tempDate)
              newDate.setDate(d)
              setTempDate(newDate)
            }}
          >
            <Text
              style={[
                styles.calendarDayText,
                isSelected && styles.selectedDayText,
              ]}
            >
              {d}
            </Text>
          </TouchableOpacity>
        )
      }

      return [...blanks, ...days]
    }

    const renderAnalogClock = (): React.ReactNode => {
      const numbers =
        timeSubMode === 'hours'
          ? Array.from({ length: 12 }, (_, i) => i + 1)
          : Array.from({ length: 12 }, (_, i) => i * 5)

      return (
        <View style={styles.clockContainer}>
          <View style={styles.clockFace}>
            {numbers.map(num => {
              const angle =
                (num * (timeSubMode === 'hours' ? 30 : 6) - 90) *
                (Math.PI / 180)
              const x = Math.cos(angle) * 80 + 100
              const y = Math.sin(angle) * 80 + 100

              return (
                <TouchableOpacity
                  key={`${timeSubMode}-${num}`}
                  style={[styles.clockNumber, { left: x - 15, top: y - 15 }]}
                  onPress={() => handleTimeChange(num)}
                >
                  <Text
                    style={[
                      styles.clockNumberText,
                      (timeSubMode === 'hours'
                        ? selectedHour === num
                        : selectedMinute === num) && styles.selectedTime,
                    ]}
                  >
                    {String(num).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              )
            })}
            <View style={styles.clockCenter} />
          </View>
        </View>
      )
    }

    // Return the modal UI
    return (
      <RNModal
        visible={datePickerVisible}
        transparent={true}
        animationType='slide'
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === 'date' && styles.activeModeButton,
                ]}
                onPress={() => setMode('date')}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === 'date' && styles.activeModeText,
                  ]}
                >
                  Date
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === 'time' && styles.activeModeButton,
                ]}
                onPress={() => setMode('time')}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === 'time' && styles.activeModeText,
                  ]}
                >
                  Time
                </Text>
              </TouchableOpacity>
            </View>

            {mode === 'date' ? (
              <View style={styles.calendarContainer}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      const newDate = new Date(tempDate)
                      newDate.setMonth(tempDate.getMonth() - 1)
                      setTempDate(newDate)
                    }}
                  >
                    <Ionicons name='chevron-back' size={24} color='#e21d38' />
                  </TouchableOpacity>
                  <Text style={styles.monthYearText}>
                    {monthNames[tempDate.getMonth()]} {tempDate.getFullYear()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      const newDate = new Date(tempDate)
                      newDate.setMonth(tempDate.getMonth() + 1)
                      setTempDate(newDate)
                    }}
                  >
                    <Ionicons
                      name='chevron-forward'
                      size={24}
                      color='#e21d38'
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.weekDaysContainer}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                    day => (
                      <Text key={day} style={styles.weekDayText}>
                        {day}
                      </Text>
                    )
                  )}
                </View>
                <View style={styles.daysContainer}>{renderCalendar()}</View>
              </View>
            ) : (
              <View style={styles.timePickerContainer}>
                <Text style={styles.selectedTimeText}>
                  {String(selectedHour).padStart(2, '0')}:
                  {String(selectedMinute).padStart(2, '0')}
                </Text>
                {renderAnalogClock()}
              </View>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={() => setDatePickerVisible(false)}
              >
                <Text style={styles.footerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerButton, styles.confirmButton]}
                onPress={handleDateChange}
              >
                <Text
                  style={[styles.footerButtonText, styles.confirmButtonText]}
                >
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RNModal>
    )
  }

  // Render method
  return (
    <View style={styles.container}>
      <ImageBackground
        source={BACKGROUND_IMAGE} // Use the new background image
        defaultSource={{ uri: DEFAULT_EVENT_IMAGE }} // Fallback to default image
        style={styles.backgroundImage}
        resizeMode='cover'
      >
        <View style={styles.overlay}>
          <FlatList
            data={events}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.eventCard}
                onPress={() => setSelectedEvent(item)}
              >
                {/* Add event image */}
                <Image
                  source={{ uri: item.imageUrl || DEFAULT_EVENT_IMAGE }}
                  style={styles.eventCardImage}
                  resizeMode='cover'
                />

                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventDate}>
                  {format(item.date, 'MMMM dd, yyyy HH:mm')}
                </Text>
                <Text style={styles.eventLocation}>{item.location}</Text>
                <Text style={styles.eventDescription}>{item.description}</Text>

                {/* Quick event stats */}
                <View style={styles.eventCardFooter}>
                  <View style={styles.eventCardStats}>
                    <Ionicons name='heart' size={16} color='red' />
                    <Text style={styles.eventCardStatsText}>
                      {item.likes.length}
                    </Text>
                  </View>
                  <View style={styles.eventCardStats}>
                    <Ionicons
                      name='chatbubble-outline'
                      size={16}
                      color='black'
                    />
                    <Text style={styles.eventCardStatsText}>
                      {item.comments.length}
                    </Text>
                  </View>
                  <View style={styles.eventCardStats}>
                    <Ionicons name='people' size={16} color='black' />
                    <Text style={styles.eventCardStatsText}>
                      {item.attendees.filter(a => a.status === 'going').length}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No events yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create an event to get started!
                </Text>
              </View>
            }
          />

          {/* Existing modal for creating new event remains the same */}
          <Modal
            isVisible={modalVisible}
            onBackdropPress={() => setModalVisible(false)}
            style={styles.createEventModal}
            backdropOpacity={0.5}
            animationIn='slideInUp'
            animationOut='slideOutDown'
          >
            <View style={styles.modalContainer}>
              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps='handled'
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.modalContent}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name='close' size={24} color='white' />
                  </TouchableOpacity>

                  <Text style={styles.modalTitle}>Create New Event</Text>

                  <Text style={styles.label}>Event Title</Text>
                  <TextInput
                    style={styles.input}
                    placeholder='Enter event title'
                    placeholderTextColor='rgba(255,255,255,0.6)'
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
                    placeholderTextColor='rgba(255,255,255,0.6)'
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
                    placeholderTextColor='rgba(255,255,255,0.6)'
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
                      <Ionicons name='image-outline' size={24} color='white' />
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
                    onPress={addEvent}
                  >
                    <Text style={styles.createEventButtonText}>
                      Create Event
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </Modal>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>

          {/* Event Details Modal */}
          {selectedEvent && renderEventDetails()}

          {/* Custom Date Picker Modal */}
          {datePickerVisible && <DatePickerModal />}
        </View>
      </ImageBackground>
      {/* <Text>Events Screen</Text> */}
    </View>
  )
}

// Styles
const styles = StyleSheet.create({
  // Date Picker Modal Styles
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  calendarContainer: {
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    color: '#666',
    fontWeight: '600',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  selectedDay: {
    backgroundColor: '#e21d38',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDayText: {
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  modeButton: {
    padding: 10,
    borderRadius: 5,
  },
  activeModeButton: {
    backgroundColor: '#e21d38',
  },
  modeButtonText: {
    fontSize: 16,
  },
  activeModeText: {
    color: 'white',
  },
  timePickerContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  timeDisplay: {
    marginBottom: 30,
  },
  selectedTimeText: {
    fontSize: 36,
    fontWeight: '500',
    color: '#333',
  },
  clockContainer: {
    width: 240,
    height: 240,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockFace: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: '#ddd',
    position: 'relative',
  },
  clockNumber: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    paddingLeft: 20,
    paddingTop: 20,
  },
  clockNumberText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTime: {
    backgroundColor: '#e21d38',
    color: 'white',
  },
  clockCenter: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#e21d38',
    borderRadius: 4,
    left: '50%',
    top: '50%',
    marginLeft: -4,
    marginTop: -4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginLeft: 10,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#e21d38',
  },
  confirmButton: {
    backgroundColor: '#e21d38',
    borderRadius: 5,
  },
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
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e21d38',
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  eventCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  eventCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventCardStatsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e21d38',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
  addButtonText: {
    fontSize: 30,
    color: '#fff',
  },
  createEventModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContainer: {
    justifyContent: 'flex-end',
    margin: 0,
  },
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
  emptyStateSubtext: {
    fontSize: 16,
    color: '#ddd',
    marginTop: 10,
    textAlign: 'center',
  },
  eventDetailsModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  eventDetailsModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  eventDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    // marginBottom: 10,
  },
  eventDetailImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  eventCardImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  eventDetailsContent: {
    padding: 20,
  },
  eventDetailsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e21d38',
    marginBottom: 10,
  },
  eventDetailsDate: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  eventDetailsLocation: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  eventDetailsDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  attendanceButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  attendanceButton: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: '#f5f5f9',
  },
  attendanceButtonActive: {
    backgroundColor: '#e21d38',
  },
  attendanceButtonText: {
    fontSize: 16,
    color: '#333',
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
  },
  attendeesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e21d38',
    marginBottom: 10,
  },
  attendeeStatusTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  attendeeItem: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  commentsContainer: {
    marginBottom: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e21d38',
    marginBottom: 10,
  },
  commentItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  commentUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  commentText: {
    fontSize: 16,
    color: '#666',
  },
  commentTimestamp: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  commentInput: {
    flex: 1,
    height: 40,
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginRight: 10,
  },
  sendCommentButton: {
    backgroundColor: '#e21d38',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
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
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  calendarDayHeader: {
    width: 40,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  pastDay: {
    opacity: 0.5,
  },
  pastDayText: {
    color: '#999',
  },

  hoursContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  hourCell: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  minutesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  minuteCell: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayCell: {
    backgroundColor: '#e21d38',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  timeSubModeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  switchModeButton: {
    backgroundColor: '#e21d38',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  switchModeButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  timeTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    marginBottom: 20,
    alignSelf: 'center',
    width: '80%',
  },
  timeTab: {
    padding: 12,
    minWidth: 80,
    alignItems: 'center',
    borderRadius: 6,
    elevation: 2,
  },
  activeTimeTab: {
    backgroundColor: '#e21d38',
    elevation: 4,
  },
  timeTabText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#666',
  },
  activeTimeTabText: {
    color: 'white',
  },
  timeTabSeparator: {
    fontSize: 28,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 12,
  },
  confirmTimeButton: {
    backgroundColor: '#e21d38',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginLeft: 10,
    borderRadius: 5,
  },
  footerButtonText: {
    fontSize: 16,
    color: '#666',
  },
})

type EventComment = {
  id: string
  userId: string
  userName: string
  text: string
  timestamp: Date
}

type EventAttendee = {
  userId: string
  userName: string
  status: 'going' | 'maybe' | 'not going'
}

type Event = {
  id: string
  title: string
  date: Date
  location: string
  locationCoordinates?: Location
  description: string
  imageUrl?: string
  createdBy: {
    userId: string
    userName: string
  }
  likes: string[]
  comments: EventComment[]
  attendees: EventAttendee[]
}
