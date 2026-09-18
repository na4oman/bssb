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
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentUser } from '../../utils/userUtils'
import { Event } from '../../types/event'
import { Post } from '../../types/post'
import { subscribeToEvents, deleteEvent } from '../../utils/eventService'
import { subscribeToPosts, deletePost } from '../../utils/postService'
import { format } from 'date-fns'
import { updateProfile } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../config/firebase'
import NotificationSettings from '../../components/NotificationSettings'
import LoadingState from '../../components/LoadingState'
import EmptyState from '../../components/EmptyState'
import PageTitle from '../../components/PageTitle'
import DeleteAccountModal from '../../components/DeleteAccountModal'
import { isWeb, maxWidthCard } from '../../utils/platformStyles'

const DEFAULT_AVATAR = 'https://via.placeholder.com/100x100.png?text=User'

export default function ProfileScreen() {
  const { user, logout, loading: authLoading } = useAuth()
  const currentUser = getCurrentUser(user)

  const [displayName, setDisplayName] = useState(
    user?.displayName || currentUser.userName,
  )
  const [email] = useState(user?.email || '')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userEvents, setUserEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [userPaidStatus, setUserPaidStatus] = useState(false)
  const [loadingPaidStatus, setLoadingPaidStatus] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Redirect to login if user becomes null (logged out).
  // Guarded on authLoading so we never navigate before the root layout mounts
  // (e.g. on a direct URL load while the session is still being restored).
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(auth)/login')
    }
  }, [user, authLoading])

  // Load user's created events
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToEvents(allEvents => {
        // Filter events created by current user
        const myEvents = allEvents.filter(
          event => event.createdBy.userId === user.uid,
        )
        setUserEvents(myEvents)
        setEventsLoading(false)
      })

      return () => unsubscribe()
    }
  }, [user])

  // Load user's created posts
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToPosts(allPosts => {
        const myPosts = allPosts.filter(
          post => post.createdBy.userId === user.uid,
        )
        setUserPosts(myPosts)
        setPostsLoading(false)
      })

      return () => unsubscribe()
    }
  }, [user])

  // Subscribe to user's paid status
  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid)
      const unsubscribe = onSnapshot(userRef, doc => {
        if (doc.exists()) {
          const data = doc.data()
          setUserPaidStatus(data.paid || false)
        }
        setLoadingPaidStatus(false)
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
        displayName: displayName.trim(),
      })
      setIsEditing(false)
      Alert.alert('Success', 'Profile updated successfully!')
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('Starting logout process...')
            await logout()
            // Don't clear stored credentials to preserve Samsung Pass data
            // This allows native password managers to maintain saved credentials
            console.log('Logout successful, redirecting to login...')
            // Explicitly redirect to login screen
            router.replace('/(auth)/login')
          } catch (error) {
            console.error('Logout error:', error)
            Alert.alert('Error', 'Failed to logout. Please try again.')
          }
        },
      },
    ])
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
          },
        },
      ],
    )
  }

  const handleDeletePost = (postId: string, postTitle: string) => {
    Alert.alert(
      'Delete Post',
      `Are you sure you want to delete "${postTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user) {
                await deletePost(postId, user.uid)
                Alert.alert('Success', 'Post deleted successfully')
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete post')
            }
          },
        },
      ],
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
          <Ionicons name='trash-outline' size={20} color='#e21d38' />
        </TouchableOpacity>
      </View>
      <Text style={styles.eventLocation}>{item.location}</Text>
      <Text style={styles.eventDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.eventStats}>
        <View style={styles.statItem}>
          <Ionicons name='heart' size={16} color='#e21d38' />
          <Text style={styles.statText}>{item.likes.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name='chatbubble' size={16} color='#666' />
          <Text style={styles.statText}>{item.comments.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name='people' size={16} color='#666' />
          <Text style={styles.statText}>{item.attendees.length}</Text>
        </View>
      </View>
    </View>
  )

  const renderPostItem = ({ item }: { item: Post }) => (
    <View style={styles.postItem}>
      <View style={styles.postHeader}>
        <View style={styles.postTitleContainer}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.postDate}>
            {format(item.createdAt, 'MMM dd, yyyy')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePost(item.id, item.title)}
        >
          <Ionicons name='trash-outline' size={20} color='#e21d38' />
        </TouchableOpacity>
      </View>
      <Text style={styles.postContent} numberOfLines={3}>
        {item.content}
      </Text>
      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Ionicons name='heart' size={16} color='#e21d38' />
          <Text style={styles.statText}>{item.likes.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name='chatbubble' size={16} color='#666' />
          <Text style={styles.statText}>{item.comments.length}</Text>
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={isWeb && styles.scrollViewContentWeb}
      >
        {isWeb && <PageTitle title='Profile' />}

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
                  placeholder='Display Name'
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
                    <Ionicons name='pencil' size={20} color='#666' />
                  </TouchableOpacity>
                </View>
                <Text style={styles.email}>{email}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Confirmation Banner */}
        {!loadingPaidStatus && userPaidStatus && (
          <View style={styles.confirmationBanner}>
            <View style={styles.bannerContent}>
              <Ionicons name='checkmark-circle' size={32} color='#4CAF50' />
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>✅ Payment Confirmed!</Text>
                <Text style={styles.bannerMessage}>
                  Your membership payment has been confirmed. Thank you for your
                  support!
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userEvents.length}</Text>
            <Text style={styles.statLabel}>Events Created</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userPosts.length}</Text>
            <Text style={styles.statLabel}>Posts Created</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {userEvents.reduce(
                (total, event) => total + event.likes.length,
                0,
              ) +
                userPosts.reduce((total, post) => total + post.likes.length, 0)}
            </Text>
            <Text style={styles.statLabel}>Total Likes</Text>
          </View>
        </View>

        {/* Membership Status */}
        {!loadingPaidStatus && (
          <View style={styles.membershipContainer}>
            <View style={styles.membershipCard}>
              <View style={styles.membershipHeader}>
                <Ionicons
                  name={
                    userPaidStatus ? 'checkmark-circle' : 'alert-circle-outline'
                  }
                  size={24}
                  color={userPaidStatus ? '#4CAF50' : '#FF9800'}
                />
                <Text style={styles.membershipTitle}>Membership Status</Text>
              </View>
              <View
                style={[
                  styles.membershipBadge,
                  userPaidStatus
                    ? styles.membershipBadgePaid
                    : styles.membershipBadgeUnpaid,
                ]}
              >
                <Text style={styles.membershipBadgeText}>
                  {userPaidStatus ? '✓ Paid' : 'Pending Payment'}
                </Text>
              </View>
              {!userPaidStatus && (
                <Text style={styles.membershipNote}>
                  Please contact an admin to confirm your membership payment
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Notification Settings */}
        <NotificationSettings />

        {/* My Events Section */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>My Events</Text>
          {eventsLoading ? (
            <LoadingState text='Loading your events...' compact />
          ) : userEvents.length > 0 ? (
            <FlatList
              data={userEvents}
              renderItem={renderEventItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <EmptyState
              compact
              icon='calendar-outline'
              title='No events created yet'
              subtitle='Go to the Events tab to create your first event!'
            />
          )}
        </View>

        {/* My Posts Section */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>My Posts</Text>
          {postsLoading ? (
            <LoadingState text='Loading your posts...' compact />
          ) : userPosts.length > 0 ? (
            <FlatList
              data={userPosts}
              renderItem={renderPostItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <EmptyState
              compact
              icon='newspaper-outline'
              title='No posts created yet'
              subtitle='Go to the Posts tab to create your first post!'
            />
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name='log-out-outline' size={24} color='#fff' />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={() => setShowDeleteModal(true)}
        >
          <Ionicons name='trash-outline' size={22} color='#e21d38' />
          <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={() => {
          setShowDeleteModal(false)
          router.replace('/(auth)/login')
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContentWeb: {
    ...maxWidthCard,
    width: '100%',
  },
  profileHeader: {
    backgroundColor: 'white',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 20,
    borderRadius: 12,
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
  membershipContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  membershipCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  membershipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  membershipBadge: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  membershipBadgePaid: {
    backgroundColor: '#4CAF50',
  },
  membershipBadgeUnpaid: {
    backgroundColor: '#FF9800',
  },
  membershipBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  membershipNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  confirmationBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
    marginLeft: 12,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  bannerMessage: {
    fontSize: 14,
    color: '#388E3C',
    lineHeight: 20,
  },
  eventsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  postsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
  postItem: {
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
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  postTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  postDate: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  postStats: {
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
  logoutButton: {
    backgroundColor: '#e21d38',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteAccountButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#e21d38',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  deleteAccountButtonText: {
    color: '#e21d38',
    fontSize: 16,
    fontWeight: '600',
  },
})
