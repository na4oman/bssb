import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { format } from 'date-fns'
import { Ionicons } from '@expo/vector-icons'
import { isWeb, maxWidthCard } from '../utils/platformStyles'
import { COLORS, RADIUS, SHADOW, FONT } from '../constants/theme'
import { EventLocation } from '../types/event'

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
  locationCoordinates?: EventLocation
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
  const [hovered, setHovered] = useState(false)

  return (
    <TouchableOpacity
      style={[
        styles.eventCard,
        isWeb && styles.eventCardWeb,
        isWeb && hovered && styles.eventCardHovered,
      ]}
      onPress={() => onPress(event)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      activeOpacity={0.8}
    >
      {/* Event Image */}
      <Image
        source={{ uri: event.imageUrl || DEFAULT_EVENT_IMAGE }}
        style={[styles.eventCardImage, isWeb && styles.eventCardImageWeb]}
        resizeMode='cover'
      />

      {/* Content Container */}
      <View
        style={[styles.contentContainer, isWeb && styles.contentContainerWeb]}
      >
        {/* Event Title */}
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Date Section */}
        <View style={styles.infoRow}>
          <View style={styles.labelContainer}>
            <Ionicons name='calendar-outline' size={16} color={COLORS.primary} />
            <Text style={styles.label}>Date</Text>
          </View>
          <Text style={styles.dateValue}>
            {format(event.date, 'MMM dd, yyyy')}
          </Text>
          <Text style={styles.timeValue}>{format(event.date, 'HH:mm')}</Text>
        </View>

        {/* Location Section */}
        <View style={styles.infoRow}>
          <View style={styles.labelContainer}>
            <Ionicons name='location-outline' size={16} color={COLORS.primary} />
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
          <Ionicons name='person-outline' size={14} color={COLORS.textMuted} />
          <Text style={styles.createdByText}>
            Created by {event.createdBy.userName}
          </Text>
        </View>
      </View>

      {/* Footer Stats */}
      <View
        style={[styles.eventCardFooter, isWeb && styles.eventCardFooterWeb]}
      >
        <View style={styles.eventCardStats}>
          <Ionicons name='heart' size={18} color={COLORS.primary} />
          <Text style={styles.eventCardStatsText}>{event.likes.length}</Text>
        </View>
        <View style={styles.eventCardStats}>
          <Ionicons name='chatbubble-outline' size={18} color={COLORS.textSecondary} />
          <Text style={styles.eventCardStatsText}>{event.comments.length}</Text>
        </View>
        <View style={styles.eventCardStats}>
          <Ionicons name='people-outline' size={18} color={COLORS.textSecondary} />
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
    backgroundColor: COLORS.card,
    margin: 12,
    borderRadius: RADIUS.lg,
    ...SHADOW.card,
    overflow: 'hidden',
  },
  eventCardWeb: {
    ...maxWidthCard,
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    borderRadius: 14,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  eventCardHovered: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
    transform: [{ translateY: -2 }],
  },
  eventCardImage: {
    width: '100%',
    height: 180,
  },
  eventCardImageWeb: {
    width: 220,
    height: '100%',
    alignSelf: 'stretch',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  contentContainer: {
    padding: 16,
  },
  contentContainerWeb: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  eventTitle: {
    fontSize: FONT.size.xl,
    fontWeight: 'bold',
    color: COLORS.text,
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
    fontSize: FONT.size.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: FONT.size.md,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 8,
  },
  timeValue: {
    fontSize: FONT.size.md,
    fontWeight: 'bold',
    color: COLORS.primary,
    backgroundColor: '#fff5f5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  locationValue: {
    fontSize: FONT.size.base,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  descriptionLabel: {
    fontSize: FONT.size.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  descriptionValue: {
    fontSize: FONT.size.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  createdByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  createdByText: {
    fontSize: FONT.size.xs,
    color: COLORS.textMuted,
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
  eventCardFooterWeb: {
    width: 96,
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fbfcfd',
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: '#edf0f3',
  },
  eventCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  eventCardStatsText: {
    fontSize: FONT.size.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
})

export default EventCard
