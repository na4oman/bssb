import React from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { format } from 'date-fns'
import { Ionicons } from '@expo/vector-icons'

// Restore the default event image
const DEFAULT_EVENT_IMAGE =
  'https://www.sunderlandecho.com/webimg/b25lY21zOmI3MGJlOTU0LWYzZWYtNDdjOC04ZjQwLTE4NDlhOWM2MmQ1YTo3MmI1NjBkOS01NDM5LTQzOGEtOWFkNy1kYmZkZmViNjUyYmI=.jpg?width=1200&enable=upscale'

interface EventCardProps {
  event: Event
  onPress: (event: Event) => void
}

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

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => onPress(event)}
      activeOpacity={0.8}
    >
      {/* Event Image */}
      <Image
        source={{ uri: event.imageUrl || DEFAULT_EVENT_IMAGE }}
        style={styles.eventCardImage}
        resizeMode='cover'
      />
      
      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Event Title */}
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        
        {/* Date Section */}
        <View style={styles.infoRow}>
          <View style={styles.labelContainer}>
            <Ionicons name='calendar-outline' size={16} color='#e21d38' />
            <Text style={styles.label}>Date</Text>
          </View>
          <Text style={styles.dateValue}>
            {format(event.date, 'MMM dd, yyyy')}
          </Text>
          <Text style={styles.timeValue}>
            {format(event.date, 'HH:mm')}
          </Text>
        </View>
        
        {/* Location Section */}
        <View style={styles.infoRow}>
          <View style={styles.labelContainer}>
            <Ionicons name='location-outline' size={16} color='#e21d38' />
            <Text style={styles.label}>Location</Text>
          </View>
          <Text style={styles.locationValue} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
        
        {/* Description Section */}
        {event.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.descriptionValue} numberOfLines={2}>
              {event.description}
            </Text>
          </View>
        )}
        
        {/* Created By */}
        <View style={styles.createdByContainer}>
          <Ionicons name='person-outline' size={14} color='#999' />
          <Text style={styles.createdByText}>
            Created by {event.createdBy.userName}
          </Text>
        </View>
      </View>
      
      {/* Footer Stats */}
      <View style={styles.eventCardFooter}>
        <View style={styles.eventCardStats}>
          <Ionicons name='heart' size={18} color='#e21d38' />
          <Text style={styles.eventCardStatsText}>{event.likes.length}</Text>
        </View>
        <View style={styles.eventCardStats}>
          <Ionicons name='chatbubble-outline' size={18} color='#666' />
          <Text style={styles.eventCardStatsText}>{event.comments.length}</Text>
        </View>
        <View style={styles.eventCardStats}>
          <Ionicons name='people-outline' size={18} color='#666' />
          <Text style={styles.eventCardStatsText}>
            {event.attendees.filter(a => a.status === 'going').length}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: 'white',
    margin: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  eventCardImage: {
    width: '100%',
    height: 180,
  },
  contentContainer: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e21d38',
    marginBottom: 12,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
    marginRight: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e21d38',
    backgroundColor: '#fff5f5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  locationValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  descriptionValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  createdByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  createdByText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  eventCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  eventCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  eventCardStatsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
})

export default EventCard
