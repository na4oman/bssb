import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  FlatList,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { getCurrentUser } from '../utils/userUtils'
import { Event } from '../types/event'
import { subscribeToEvents, deleteEvent } from '../utils/eventService'
import { format } from 'date-fns'
import { updateProfile } from 'firebase/auth'
import NotificationSettings from '../components/NotificationSettings'

const DEFAULT_AVATAR = 'https://via.placeholder.com/100x100.png?text=User'

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const currentUser = getCurrentUser(user)
  
  const [displayName, setDisplayName] = useState(user?.displayName || currentUser.userName)
  const [email] = useState(user?.email || '')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userEvents, setUserEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)

  // Redirect to login if user becomes null (logged out)
  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login')
    }
  }, [user])

  // Load user's created events
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToEvents((allEvents) => {
        const myEvents = allEvents.filter(event => 
          event.createdBy.userId === user.uid
        )
        setUserEvents(myEvents)
        setEventsLoading(false)
      })

      return () => unsubscribe()
    }
  }, [user])

  const handleUpdateProfile = async () => {
    if (!user || !displayName.trim()) {
      Alert.alert('Error', 'Please enter a valid display name')
      return
    }

    try {
      setLoading(true)
      await updateProfile(user, {
        displayName: displayName.trim()
      })
      setIsEditing(false)
      Alert.alert('Success', 'Profile updated successfully!')
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(eventId)
              Alert.alert('Success', 'Event deleted successfully')
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete event')
            }
          }
        }
      ]
    )
  }

  const renderEventItem = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <View style={styles.eventHeader}>
        <View style={styles.eventTitleContainer}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDate}>
            {format(item.date, 'MMM dd, yyyy')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteEvent(item.id, item.title)}
        >
          <Ionicons name="trash-outline" size={20} color="#e21d38" />
        </TouchableOpacity>
      </View>
      <Text style={styles.eventLocation}>{item.location}</Text>
      <Text style={styles.eventDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.eventStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={16} color="#e21d38" />
          <Text style={styles.statText}>{item.likes.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble" size={16} color="#666" />
          <Text style={styles.statText}>{item.comments.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="people" size={16} color="#666" />
          <Text style={styles.statText}>{item.attendees.length}</Text>
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: user?.photoURL || DEFAULT_AVATAR }} 
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            {isEditing ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Display Name"
                  autoFocus
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={[styles.editButton, styles.cancelButton]}
                    onPress={() => {
                      setDisplayName(user?.displayName || currentUser.userName)
                      setIsEditing(false)
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editButton, styles.saveButton]}
                    onPress={handleUpdateProfile}
                    disabled={loading}
                  >
                    <Text style={styles.saveButtonText}>
                      {loading ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.displayContainer}>
                <View style={styles.nameContainer}>
                  <Text style={styles.displayName}>{displayName}</Text>
                  <TouchableOpacity
                    style={styles.editIcon}
                    onPress={() => setIsEditing(true)}
                  >
                    <Ionicons name="pencil" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.email}>{email}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userEvents.length}</Text>
            <Text style={styles.statLabel}>Events Created</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {userEvents.reduce((total, event) => total + event.likes.length, 0)}
            </Text>
            <Text style={styles.statLabel}>Total Likes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {userEvents.reduce((total, event) => total + event.attendees.length, 0)}
            </Text>
            <Text style={styles.statLabel}>Total Attendees</Text>
          </View>
        </View>

        {/* Notification Settings */}
        <NotificationSettings />

        {/* My Events Section */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>My Events</Text>
          {eventsLoading ? (
            <Text style={styles.loadingText}>Loading your events...</Text>
          ) : userEvents.length > 0 ? (
            <FlatList
              data={userEvents}
              renderItem={renderEventItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No events created yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Go to the Events tab to create your first event!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#e21d38',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: 'white',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  displayContainer: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  editIcon: {
    padding: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  editContainer: {
    flex: 1,
  },
  editInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    borderBottomWidth: 2,
    borderBottomColor: '#e21d38',
    paddingBottom: 5,
    marginBottom: 15,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#e21d38',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statsSection: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingHorizontal: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e21d38',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  eventsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  eventItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  eventTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  eventDate: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'rgba(226, 29, 56, 0.1)',
    borderRadius: 8,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  eventStats: {
    flexDirection: 'row',
    gap: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
})
