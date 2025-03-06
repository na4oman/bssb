import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native'
import Modal from 'react-native-modal'
import { format } from 'date-fns'
import { Ionicons } from '@expo/vector-icons'
import { Event } from '../types/event'
import AttendeesList from './AttendeesList'
import CommentItem from './CommentItem'

// Restore the default event image
const DEFAULT_EVENT_IMAGE =
  'https://www.sunderlandecho.com/webimg/b25lY21zOmI3MGJlOTU0LWYzZWYtNDdjOC04ZjQwLTE4NDlhOWM2MmQ1YTo3MmI1NjBkOS01NDM5LTQzOGEtOWFkNy1kYmZkZmViNjUyYmI=.jpg?width=1200&enable=upscale'

interface EventDetailsModalProps {
  event: Event | null
  onClose: () => void
  currentUser: { userId: string; userName: string }
  toggleLike: (eventId: string) => void
  addComment: (eventId: string, commentText: string) => void
  updateAttendanceStatus: (
    eventId: string,
    status: 'going' | 'maybe' | 'not going'
  ) => void
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  onClose,
  currentUser,
  toggleLike,
  addComment,
  updateAttendanceStatus,
}) => {
  const [commentText, setCommentText] = useState('')
  if (!event) return null

  return (
    <Modal
      isVisible={!!event}
      onBackdropPress={onClose}
      style={styles.eventDetailsModal}
      backdropOpacity={0.5}
      animationIn='slideInUp'
      animationOut='slideOutDown'
    >
      <ScrollView style={styles.eventDetailsModalContent}>
        <View style={styles.eventDetailsHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name='close' size={24} color='#e21d38' />
          </TouchableOpacity>
        </View>
        <Image
          source={{ uri: event.imageUrl || DEFAULT_EVENT_IMAGE }}
          style={styles.eventDetailImage}
          resizeMode='cover'
        />
        <View style={styles.eventDetailsContent}>
          <Text style={styles.eventDetailsTitle}>{event.title}</Text>
          <Text style={styles.eventDetailsDate}>
            {format(event.date, 'MMMM dd, yyyy HH:mm')}
          </Text>
          <Text style={styles.eventDetailsLocation}>{event.location}</Text>
          <Text style={styles.eventDetailsDescription}>
            {event.description}
          </Text>
          <View style={styles.attendanceButtonContainer}>
            <TouchableOpacity
              style={[
                styles.attendanceButton,
                event.attendees.some(
                  a => a.userId === currentUser.userId && a.status === 'going'
                ) && styles.attendanceButtonActive,
              ]}
              onPress={() => updateAttendanceStatus(event.id, 'going')}
            >
              <Text
                style={[
                  styles.attendanceButtonText,
                  event.attendees.some(
                    a => a.userId === currentUser.userId && a.status === 'going'
                  ) && { color: '#fff' },
                ]}
              >
                Going
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.attendanceButton,
                event.attendees.some(
                  a => a.userId === currentUser.userId && a.status === 'maybe'
                ) && styles.attendanceButtonActive,
              ]}
              onPress={() => updateAttendanceStatus(event.id, 'maybe')}
            >
              <Text
                style={[
                  styles.attendanceButtonText,
                  event.attendees.some(
                    a => a.userId === currentUser.userId && a.status === 'maybe'
                  ) && { color: '#fff' },
                ]}
              >
                Maybe
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.attendanceButton,
                event.attendees.some(
                  a =>
                    a.userId === currentUser.userId && a.status === 'not going'
                ) && styles.attendanceButtonActive,
              ]}
              onPress={() => updateAttendanceStatus(event.id, 'not going')}
            >
              <Text
                style={[
                  styles.attendanceButtonText,
                  event.attendees.some(
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
          <View style={styles.likesContainer}>
            <TouchableOpacity onPress={() => toggleLike(event.id)}>
              <Ionicons
                name={
                  event.likes.includes(currentUser.userId)
                    ? 'heart'
                    : 'heart-outline'
                }
                size={24}
                color={
                  event.likes.includes(currentUser.userId) ? 'red' : 'black'
                }
              />
            </TouchableOpacity>
            <Text style={styles.likesText}>{event.likes.length} Likes</Text>
          </View>
          <AttendeesList attendees={event.attendees} />
          <View style={styles.commentsContainer}>
            <Text style={styles.commentsTitle}>Comments</Text>
            {event.comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={{ ...comment, timestamp: comment.timestamp.getTime() }}
              />
            ))}
          </View>
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
              onPress={() => addComment(event.id, commentText)}
            >
              <Ionicons name='send' size={20} color='#fff' />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Modal>
  )
}

const styles = StyleSheet.create({
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
    backgroundColor: '#fff',
    borderRadius: 5,
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
  eventCardImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
})

export default EventDetailsModal
