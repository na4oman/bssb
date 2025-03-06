import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { EventAttendee } from '../types/event' // Import the type

interface AttendeesListProps {
  attendees: EventAttendee[]
}

export default function AttendeesList({ attendees }: AttendeesListProps) {
  // Group attendees by status
  const goingAttendees = attendees.filter(a => a.status === 'going')
  const maybeAttendees = attendees.filter(a => a.status === 'maybe')
  const notGoingAttendees = attendees.filter(a => a.status === 'not going')

  return (
    <View style={styles.attendeesContainer}>
      <Text style={styles.attendeesTitle}>Attendees</Text>
      {/* Going Attendees */}
      {goingAttendees.length > 0 && (
        <View>
          <Text style={styles.attendeeStatusTitle}>
            Going: {goingAttendees.length}
          </Text>
          {goingAttendees.map(attendee => (
            <Text key={attendee.userId} style={styles.attendeeItem}>
              {attendee.userName}
            </Text>
          ))}
        </View>
      )}

      {/* Maybe Attendees */}
      {maybeAttendees.length > 0 && (
        <View>
          <Text style={styles.attendeeStatusTitle}>
            Maybe: {maybeAttendees.length}
          </Text>
          {maybeAttendees.map(attendee => (
            <Text key={attendee.userId} style={styles.attendeeItem}>
              {attendee.userName}
            </Text>
          ))}
        </View>
      )}

      {/* Not Going Attendees */}
      {notGoingAttendees.length > 0 && (
        <View>
          <Text style={styles.attendeeStatusTitle}>
            Not Going: {notGoingAttendees.length}
          </Text>
          {notGoingAttendees.map(attendee => (
            <Text key={attendee.userId} style={styles.attendeeItem}>
              {attendee.userName}
            </Text>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
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
})
