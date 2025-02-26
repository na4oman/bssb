import React, { useState, useRef, useCallback, useEffect } from 'react';
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
} from 'react-native';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import * as ImagePicker from 'expo-image-picker';

// Custom type definition for location
type Location = {
  latitude: number;
  longitude: number;
  placeName?: string;
};

// Fallback location
const DEFAULT_LOCATION = {
  latitude: 54.9146,
  longitude: -1.3882,
  placeName: 'Stadium of Light, Sunderland',
};

// Restore the default event image
const DEFAULT_EVENT_IMAGE = 'https://www.sunderlandecho.com/webimg/b25lY21zOmI3MGJlOTU0LWYzZWYtNDdjOC04ZjQwLTE4NDlhOWM2MmQ1YTo3MmI1NjBkOS01NDM5LTQzOGEtOWFkNy1kYmZkZmViNjUyYmI=.jpg?width=1200&enable=upscale';

// Simulated current user (in a real app, this would come from authentication)
const currentUser = {
  userId: 'user123',
  userName: 'John Doe',
};

// Define type for Firebase messaging payload
interface NotificationPayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: Record<string, string>;
}

// Request media library permissions
const requestMediaLibraryPermission = async () => {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const isGranted = status === 'granted';
    return isGranted;
  }
  return true;
};

// Main component
export default function IndexScreen(): React.ReactElement {
  // State definitions
  const [events, setEvents] = useState<Event[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [commentText, setCommentText] = useState('');
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date(),
    location: '',
    description: '',
    imageUrl: '',
    locationCoordinates: undefined as Location | undefined,
  });
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState<boolean | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setNewEvent(prev => ({ ...prev, date }));
  };

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
    };

    // Add event to events list
    setEvents([...events, event]);

    // Reset form
    setNewEvent({
      title: '',
      date: new Date(),
      location: '',
      description: '',
      imageUrl: '',
      locationCoordinates: undefined,
    });

    // Close modal
    setModalVisible(false);
  };

  const toggleLike = (eventId: string) => {
    setEvents(events.map(event => {
      if (event.id === eventId) {
        const isLiked = event.likes.includes(currentUser.userId);
        return {
          ...event,
          likes: isLiked 
            ? event.likes.filter(id => id !== currentUser.userId)
            : [...event.likes, currentUser.userId]
        };
      }
      return event;
    }));
  };

  const addComment = (eventId: string) => {
    if (!commentText.trim()) return;

    const newComment: EventComment = {
      id: Date.now().toString(),
      userId: currentUser.userId,
      userName: currentUser.userName,
      text: commentText,
      timestamp: new Date(),
    };

    setEvents(events.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          comments: [...event.comments, newComment]
        };
      }
      return event;
    }));

    setCommentText('');
  };

  const updateAttendanceStatus = (eventId: string, status: 'going' | 'maybe' | 'not going') => {
    setEvents(events.map(event => {
      if (event.id === eventId) {
        // Remove existing attendance if user already has one
        const filteredAttendees = event.attendees.filter(
          attendee => attendee.userId !== currentUser.userId
        );

        // Add new attendance status
        return {
          ...event,
          attendees: [
            ...filteredAttendees, 
            { 
              userId: currentUser.userId, 
              userName: currentUser.userName, 
              status 
            }
          ]
        };
      }
      return event;
    }));
  };

  const showDateTimePicker = () => {
    setDatePickerVisible(true);
  };

  const DateTimeInput = () => {
    // Web-specific date input
    if (Platform.OS === 'web') {
      return (
        <input
          type="datetime-local"
          value={format(newEvent.date, "yyyy-MM-dd'T'HH:mm")}
          onChange={(e) => {
            const date = new Date(e.target.value);
            setNewEvent({ ...newEvent, date });
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
      );
    }

    // Mobile/Native date selection
    return (
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setDatePickerVisible(true)}
      >
        <Text style={styles.dateButtonText}>
          {format(newEvent.date, 'MMMM dd, yyyy HH:mm')}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEventDetails = (event: Event) => {
    return (
      <Modal
        isVisible={!!selectedEvent}
        onBackdropPress={() => setSelectedEvent(null)}
        style={styles.eventDetailsModal}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <ScrollView style={styles.eventDetailsModalContent}>
          {/* Event Header */}
          <View style={styles.eventDetailsHeader}>
            <TouchableOpacity onPress={() => setSelectedEvent(null)}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          {/* Event Image */}
          <Image 
            source={{ uri: event.imageUrl || DEFAULT_EVENT_IMAGE }} 
            style={styles.eventDetailImage} 
            resizeMode="cover" 
          />

          {/* Event Basic Info */}
          <View style={styles.eventDetailsContent}>
            <Text style={styles.eventDetailsTitle}>{event.title}</Text>
            <Text style={styles.eventDetailsDate}>
              {format(event.date, 'MMMM dd, yyyy HH:mm')}
            </Text>
            <Text style={styles.eventDetailsLocation}>{event.location}</Text>
            <Text style={styles.eventDetailsDescription}>{event.description}</Text>

            {/* Attendance Buttons */}
            <View style={styles.attendanceButtonContainer}>
              <TouchableOpacity 
                style={[
                  styles.attendanceButton, 
                  event.attendees.some(a => a.userId === currentUser.userId && a.status === 'going') 
                    ? styles.attendanceButtonActive 
                    : {}
                ]}
                onPress={() => updateAttendanceStatus(event.id, 'going')}
              >
                <Text style={styles.attendanceButtonText}>Going</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.attendanceButton, 
                  event.attendees.some(a => a.userId === currentUser.userId && a.status === 'maybe') 
                    ? styles.attendanceButtonActive 
                    : {}
                ]}
                onPress={() => updateAttendanceStatus(event.id, 'maybe')}
              >
                <Text style={styles.attendanceButtonText}>Maybe</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.attendanceButton, 
                  event.attendees.some(a => a.userId === currentUser.userId && a.status === 'not going') 
                    ? styles.attendanceButtonActive 
                    : {}
                ]}
                onPress={() => updateAttendanceStatus(event.id, 'not going')}
              >
                <Text style={styles.attendanceButtonText}>Not Going</Text>
              </TouchableOpacity>
            </View>

            {/* Likes */}
            <View style={styles.likesContainer}>
              <TouchableOpacity onPress={() => toggleLike(event.id)}>
                <Ionicons 
                  name={event.likes.includes(currentUser.userId) ? "heart" : "heart-outline"} 
                  size={24} 
                  color={event.likes.includes(currentUser.userId) ? "red" : "black"} 
                />
              </TouchableOpacity>
              <Text style={styles.likesText}>{event.likes.length} Likes</Text>
            </View>

            {/* Attendees */}
            <View style={styles.attendeesContainer}>
              <Text style={styles.attendeesTitle}>Attendees</Text>
              {['going', 'maybe', 'not going'].map(status => {
                const statusAttendees = event.attendees.filter(a => a.status === status);
                return statusAttendees.length > 0 ? (
                  <View key={status}>
                    <Text style={styles.attendeeStatusTitle}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}: {statusAttendees.length}
                    </Text>
                    {statusAttendees.map(attendee => (
                      <Text key={attendee.userId} style={styles.attendeeItem}>
                        {attendee.userName}
                      </Text>
                    ))}
                  </View>
                ) : null;
              })}
            </View>

            {/* Comments Section */}
            <View style={styles.commentsContainer}>
              <Text style={styles.commentsTitle}>Comments</Text>
              {event.comments.map(comment => (
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
                placeholder="Add a comment..."
                multiline
              />
              <TouchableOpacity 
                style={styles.sendCommentButton}
                onPress={() => addComment(event.id)}
              >
                <Ionicons name="send" size={24} color="#e21d38" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Modal>
    );
  };

  const pickImage = async () => {
    // Check if permissions are already known
    if (mediaLibraryPermission === false) {
      Alert.alert(
        'Permission Required', 
        'Please grant media library access in your device settings.'
      );
      return;
    }

    try {
      // Request permission if not already granted
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        setMediaLibraryPermission(false);
        Alert.alert(
          'Permission Denied', 
          'Sorry, we need camera roll permissions to make this work!'
        );
        return;
      }

      // Launch image picker with updated API
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'], 
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        // Handle the selected image
        const selectedAsset = result.assets[0];
        setNewEvent(prevEvent => ({
          ...prevEvent,
          imageUrl: selectedAsset.uri
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Image Selection Error', 
        'Unable to select image. Please try again.'
      );
    }
  };

  const DatePickerModal = () => {
    const [tempDate, setTempDate] = useState(new Date(selectedDate));

    const handleDateChange = () => {
      setSelectedDate(tempDate);
      setNewEvent(prev => ({
        ...prev,
        date: tempDate
      }));
      setDatePickerVisible(false);
    };

    return (
      <RNModal
        animationType="slide"
        transparent={true}
        visible={datePickerVisible}
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Select Date and Time</Text>
            
            {/* Date Input */}
            <View style={styles.dateInputContainer}>
              <Text style={styles.label}>Date</Text>
              <View style={styles.dateInputRow}>
                <TextInput
                  style={styles.dateInput}
                  value={format(tempDate, 'yyyy')}
                  keyboardType="numeric"
                  maxLength={4}
                  onChangeText={(year) => {
                    const newDate = new Date(tempDate);
                    newDate.setFullYear(parseInt(year) || new Date().getFullYear());
                    setTempDate(newDate);
                  }}
                  placeholder="Year"
                />
                <TextInput
                  style={styles.dateInput}
                  value={format(tempDate, 'MM')}
                  keyboardType="numeric"
                  maxLength={2}
                  onChangeText={(month) => {
                    const newDate = new Date(tempDate);
                    newDate.setMonth(parseInt(month) - 1 || 0);
                    setTempDate(newDate);
                  }}
                  placeholder="Month"
                />
                <TextInput
                  style={styles.dateInput}
                  value={format(tempDate, 'dd')}
                  keyboardType="numeric"
                  maxLength={2}
                  onChangeText={(day) => {
                    const newDate = new Date(tempDate);
                    newDate.setDate(parseInt(day) || 1);
                    setTempDate(newDate);
                  }}
                  placeholder="Day"
                />
              </View>

              {/* Time Input */}
              <Text style={styles.label}>Time</Text>
              <View style={styles.dateInputRow}>
                <TextInput
                  style={styles.dateInput}
                  value={format(tempDate, 'HH')}
                  keyboardType="numeric"
                  maxLength={2}
                  onChangeText={(hours) => {
                    const newDate = new Date(tempDate);
                    newDate.setHours(parseInt(hours) || 0);
                    setTempDate(newDate);
                  }}
                  placeholder="Hours"
                />
                <TextInput
                  style={styles.dateInput}
                  value={format(tempDate, 'mm')}
                  keyboardType="numeric"
                  maxLength={2}
                  onChangeText={(minutes) => {
                    const newDate = new Date(tempDate);
                    newDate.setMinutes(parseInt(minutes) || 0);
                    setTempDate(newDate);
                  }}
                  placeholder="Minutes"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setDatePickerVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleDateChange}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RNModal>
    );
  };

  // Render method
  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: DEFAULT_EVENT_IMAGE }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.eventCard}
                onPress={() => setSelectedEvent(item)}
              >
                {/* Add event image */}
                <Image 
                  source={{ uri: item.imageUrl || DEFAULT_EVENT_IMAGE }}
                  style={styles.eventCardImage}
                  resizeMode="cover"
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
                    <Ionicons name="heart" size={16} color="red" />
                    <Text style={styles.eventCardStatsText}>{item.likes.length}</Text>
                  </View>
                  <View style={styles.eventCardStats}>
                    <Ionicons name="chatbubble" size={16} color="black" />
                    <Text style={styles.eventCardStatsText}>{item.comments.length}</Text>
                  </View>
                  <View style={styles.eventCardStats}>
                    <Ionicons name="people" size={16} color="black" />
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
            animationIn="slideInUp"
            animationOut="slideOutDown"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New Event</Text>
              
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={newEvent.title}
                onChangeText={(text) =>
                  setNewEvent({ ...newEvent, title: text })
                }
                placeholder="Event Title"
              />

              <Text style={styles.label}>Date and Time</Text>
              <DateTimeInput />
              
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={newEvent.location}
                onChangeText={(text) =>
                  setNewEvent({ ...newEvent, location: text })
                }
                placeholder="Event Location"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={newEvent.description}
                onChangeText={(text) =>
                  setNewEvent({ ...newEvent, description: text })
                }
                placeholder="Event Description"
                multiline
              />

              <Text style={styles.label}>Image URL (Optional)</Text>
              <TouchableOpacity 
                style={styles.input}
                onPress={pickImage}
              >
                <Text style={{ padding: 10, fontSize: 16 }}>
                  {newEvent.imageUrl ? 'Change Image' : 'Select Image'}
                </Text>
              </TouchableOpacity>
              
              {newEvent.imageUrl && (
                <Image 
                  source={{ uri: newEvent.imageUrl }} 
                  style={styles.imagePreview} 
                />
              )}

              <TouchableOpacity style={styles.submitButton} onPress={addEvent}>
                <Text style={styles.submitButtonText}>Create Event</Text>
              </TouchableOpacity>
            </View>
          </Modal>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>

          {/* Event Details Modal */}
          {selectedEvent && renderEventDetails(selectedEvent)}

          {/* Custom Date Picker Modal */}
          <DatePickerModal />
        </View>
      </ImageBackground>
      {/* <Text>Events Screen</Text> */}
    </View>
  );
}

// Styles (keep existing styles)

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
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e21d38',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#e21d38',
    padding: 15,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
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
    backgroundColor: '#f5f5f5',
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
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 20,
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
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dateInputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  dateInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    width: '30%',
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    borderRadius: 5,
    padding: 10,
    elevation: 2,
    width: '45%',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonConfirm: {
    backgroundColor: '#e21d38',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

type EventComment = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
};

type EventAttendee = {
  userId: string;
  userName: string;
  status: 'going' | 'maybe' | 'not going';
};

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