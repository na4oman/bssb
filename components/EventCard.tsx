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
      <Image
        source={{ uri: event.imageUrl || DEFAULT_EVENT_IMAGE }}
        style={styles.eventCardImage}
        resizeMode='cover'
      />
      <Text style={styles.eventTitle}>{event.title}</Text>
      <Text style={styles.eventDate}>
        {format(event.date, 'MMMM dd, yyyy HH:mm')}
      </Text>
      <Text style={styles.eventLocation}>{event.location}</Text>
      <Text style={styles.eventDescription}>{event.description}</Text>
      <View style={styles.eventCardFooter}>
        <View style={styles.eventCardStats}>
          <Ionicons name='heart' size={16} color='red' />
          <Text style={styles.eventCardStatsText}>{event.likes.length}</Text>
        </View>
        <View style={styles.eventCardStats}>
          <Ionicons name='chatbubble-outline' size={16} color='black' />
          <Text style={styles.eventCardStatsText}>{event.comments.length}</Text>
        </View>
        <View style={styles.eventCardStats}>
          <Ionicons name='people' size={16} color='black' />
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
  eventCardImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
})

export default EventCard
