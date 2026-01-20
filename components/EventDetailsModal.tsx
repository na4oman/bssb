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
      <ScrollView style={styles.eventDetailsModalContent} showsVerticalScrollIndicator={false}>
        {/* Header with Close Button */}
        <View style={styles.eventDetailsHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name='close' size={24} color='#e21d38' />
          </TouchableOpacity>
        </View>

        {/* Event Image */}
        <Image
          source={{ uri: event.imageUrl || DEFAULT_EVENT_IMAGE }}
          style={styles.eventDetailImage}
          resizeMode='cover'
        />

        {/* Content Container */}
        <View style={styles.eventDetailsContent}>
          {/* Event Title */}
          <Text style={styles.eventDetailsTitle}>{event.title}</Text>

          {/* Event Info Cards */}
          <View style={styles.infoCardsContainer}>
            {/* Date & Time Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Ionicons name='calendar-outline' size={20} color='#e21d38' />
                <Text style={styles.infoCardTitle}>Date & Time</Text>
              </View>
              <Text style={styles.infoCardValue}>
                {format(event.date, 'EEEE, MMMM dd, yyyy')}
              </Text>
              <Text style={styles.infoCardSubValue}>
                {format(event.date, 'HH:mm')}
              </Text>
            </View>

            {/* Location Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Ionicons name='location-outline' size={20} color='#e21d38' />
                <Text style={styles.infoCardTitle}>Location</Text>
              </View>
              <Text style={styles.infoCardValue}>{event.location}</Text>
            </View>
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.descriptionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name='document-text-outline' size={20} color='#e21d38' />
                <Text style={styles.sectionTitle}>Description</Text>
              </View>
              <Text style={styles.eventDetailsDescription}>{event.description}</Text>
            </View>
          )}

          {/* Attendance Section */}
          <View style={styles.attendanceSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name='people-outline' size={20} color='#e21d38' />
              <Text style={styles.sectionTitle}>Your Response</Text>
            </View>
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
                <Ionicons 
                  name='checkmark-circle-outline' 
                  size={18} 
                  color={event.attendees.some(
                    a => a.userId === currentUser.userId && a.status === 'going'
                  ) ? '#fff' : '#666'} 
                />
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
                <Ionicons 
                  name='help-circle-outline' 
                  size={18} 
                  color={event.attendees.some(
                    a => a.userId === currentUser.userId && a.status === 'maybe'
                  ) ? '#fff' : '#666'} 
                />
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
                <Ionicons 
                  name='close-circle-outline' 
                  size={18} 
                  color={event.attendees.some(
                    a => a.userId === currentUser.userId && a.status === 'not going'
                  ) ? '#fff' : '#666'} 
                />
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
          </View>

          {/* Likes & Stats */}
          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={styles.likeButton}
              onPress={() => toggleLike(event.id)}
            >
              <Ionicons
                name={
                  event.likes.includes(currentUser.userId)
                    ? 'heart'
                    : 'heart-outline'
                }
                size={24}
                color={
                  event.likes.includes(currentUser.userId) ? '#e21d38' : '#666'
                }
              />
              <Text style={styles.likesText}>
                {event.likes.length} {event.likes.length === 1 ? 'Like' : 'Likes'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.attendeesStats}>
              <Ionicons name='people' size={20} color='#666' />
              <Text style={styles.attendeesStatsText}>
                {event.attendees.filter(a => a.status === 'going').length} Going
              </Text>
            </View>
          </View>

          {/* Attendees List */}
          <AttendeesList attendees={event.attendees} />

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name='chatbubbles-outline' size={20} color='#e21d38' />
              <Text style={styles.sectionTitle}>
                Comments ({event.comments.length})
              </Text>
            </View>
            
            {event.comments.length > 0 ? (
              <View style={styles.commentsContainer}>
                {event.comments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={{ ...comment, timestamp: comment.timestamp.getTime() }}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.noCommentsContainer}>
                <Ionicons name='chatbubble-outline' size={32} color='#ccc' />
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.noCommentsSubText}>Be the first to comment!</Text>
              </View>
            )}
          </View>

          {/* Add Comment */}
          <View style={styles.addCommentContainer}>
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder='Add a comment...'
                placeholderTextColor='#999'
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendCommentButton,
                  !commentText.trim() && styles.sendCommentButtonDisabled
                ]}
                onPress={() => {
                  if (commentText.trim()) {
                    addComment(event.id, commentText)
                    setCommentText('')
                  }
                }}
                disabled={!commentText.trim()}
              >
                <Ionicons name='send' size={20} color='#fff' />
              </TouchableOpacity>
            </View>
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
  // Info Cards Styles
  infoCardsContainer: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e21d38',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  infoCardSubValue: {
    fontSize: 14,
    color: '#666',
  },
  // Section Styles
  descriptionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  attendanceSection: {
    marginBottom: 20,
  },
  // Stats Styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesStatsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
    fontWeight: '500',
  },
  // Comments Styles
  commentsSection: {
    marginBottom: 20,
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginTop: 10,
  },
  noCommentsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    fontWeight: '500',
  },
  noCommentsSubText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
  // Comment Input Styles
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  sendCommentButtonDisabled: {
    backgroundColor: '#ccc',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceButtonActive: {
    backgroundColor: '#e21d38',
  },
  attendanceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginLeft: 5,
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
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'transparent',
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
