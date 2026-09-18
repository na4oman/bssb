import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import WebHeader from '../components/WebHeader';
import PageTitle from '../components/PageTitle';
import { isWeb, maxWidthContent } from '../utils/platformStyles';
import {
  subscribeToUsers,
  toggleUserPaidStatus,
  toggleUserAdminStatus,
  checkIsUserAdmin,
  UserData,
} from '../utils/userService';

export default function UsersScreen() {
  const { user, loading: authLoading } = useAuth();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');

  // Check if current user is admin.
  // Guarded on authLoading so we never navigate before the root layout mounts
  // (e.g. on a direct URL load while the session is still being restored).
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      checkIsUserAdmin(user.uid).then((admin) => {
        setIsAdmin(admin);
        setCheckingAdmin(false);
        
        if (!admin) {
          Alert.alert('Access Denied', 'Only admins can access this page', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        }
      });
    } else {
      router.replace('/(auth)/login');
    }
  }, [user, authLoading]);

  // Subscribe to users
  useEffect(() => {
    if (user && isAdmin) {
      const unsubscribe = subscribeToUsers((fetchedUsers) => {
        setUsers(fetchedUsers);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, isAdmin]);

  // Filter and search users
  useEffect(() => {
    let result = [...users];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.userName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    // Apply paid status filter
    if (filterStatus === 'paid') {
      result = result.filter((user) => user.paid);
    } else if (filterStatus === 'unpaid') {
      result = result.filter((user) => !user.paid);
    }

    setFilteredUsers(result);
  }, [users, searchQuery, filterStatus]);

  const handleTogglePaid = async (userId: string, currentPaidStatus: boolean, userName: string) => {
    if (!user) return;

    try {
      await toggleUserPaidStatus(userId, user.uid, !currentPaidStatus, userName);
      
      if (!currentPaidStatus) {
        // Marking as paid
        Alert.alert(
          'Success',
          `${userName} marked as paid.\n\nNote: Notification will only be sent if the user has opened the app and granted notification permissions.`
        );
      } else {
        // Marking as unpaid
        Alert.alert('Success', `${userName} marked as unpaid`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update paid status');
    }
  };

  const handleToggleAdmin = async (userId: string, currentAdminStatus: boolean, userName: string) => {
    if (!user) return;

    Alert.alert(
      'Confirm',
      `Are you sure you want to ${currentAdminStatus ? 'remove admin rights from' : 'make'} ${userName} ${currentAdminStatus ? '' : 'an admin'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await toggleUserAdminStatus(userId, user.uid, !currentAdminStatus);
              Alert.alert(
                'Success',
                `${userName} ${!currentAdminStatus ? 'is now an admin' : 'admin rights removed'}`
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to update admin status');
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }: { item: UserData }) => {
    const isCurrentUser = user?.uid === item.id;

    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Ionicons name="person-circle" size={20} color="#e21d38" />
              <Text style={styles.userName}>{item.userName}</Text>
              {item.isAdmin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
              {isCurrentUser && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>You</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userDate}>
              Joined: {format(item.createdAt, 'MMM dd, yyyy')}
            </Text>
          </View>
        </View>

        <View style={styles.userActions}>
          {/* Paid Status Toggle */}
          <TouchableOpacity
            style={[styles.actionButton, item.paid && styles.actionButtonActive]}
            onPress={() => handleTogglePaid(item.id, item.paid, item.userName)}
          >
            <Ionicons
              name={item.paid ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={20}
              color={item.paid ? '#fff' : '#666'}
            />
            <Text style={[styles.actionButtonText, item.paid && styles.actionButtonTextActive]}>
              {item.paid ? 'Paid' : 'Unpaid'}
            </Text>
          </TouchableOpacity>

          {/* Admin Status Toggle - Don't allow removing own admin status */}
          {!isCurrentUser && (
            <TouchableOpacity
              style={[styles.actionButton, styles.adminButton, item.isAdmin && styles.adminButtonActive]}
              onPress={() => handleToggleAdmin(item.id, item.isAdmin, item.userName)}
            >
              <Ionicons
                name={item.isAdmin ? 'shield-checkmark' : 'shield-outline'}
                size={20}
                color={item.isAdmin ? '#fff' : '#666'}
              />
              <Text style={[styles.actionButtonText, item.isAdmin && styles.actionButtonTextActive]}>
                {item.isAdmin ? 'Admin' : 'User'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (checkingAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState text='Checking permissions...' />
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header: shared web header on desktop, back-arrow header on mobile */}
      {isWeb ? (
        <WebHeader />
      ) : (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Users Management</Text>
          <View style={styles.headerSpacer} />
        </View>
      )}

      <View style={[styles.content, isWeb && styles.contentWeb]}>
        {isWeb && <PageTitle title='Users Management' />}

        {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {users.filter(u => u.paid).length}
          </Text>
          <Text style={styles.statLabel}>Paid</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {users.filter(u => !u.paid).length}
          </Text>
          <Text style={styles.statLabel}>Unpaid</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>
            All ({users.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'paid' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('paid')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'paid' && styles.filterButtonTextActive]}>
            Paid ({users.filter(u => u.paid).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterStatus === 'unpaid' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('unpaid')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'unpaid' && styles.filterButtonTextActive]}>
            Unpaid ({users.filter(u => !u.paid).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      {loading ? (
        <LoadingState text='Loading users...' />
      ) : filteredUsers.length > 0 ? (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          icon="search-outline"
          title="No users found"
          subtitle={
            searchQuery
              ? 'Try a different search term'
              : 'No users match the selected filter'
          }
        />
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  contentWeb: {
    ...maxWidthContent,
    width: '100%',
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
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
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
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
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
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#e21d38',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 15,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
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
  userHeader: {
    marginBottom: 15,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  adminBadge: {
    backgroundColor: '#e21d38',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  adminBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  youBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  youBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  userDate: {
    fontSize: 12,
    color: '#999',
  },
  userActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    gap: 5,
  },
  actionButtonActive: {
    backgroundColor: '#4CAF50',
  },
  adminButton: {
    backgroundColor: '#f0f0f0',
  },
  adminButtonActive: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  actionButtonTextActive: {
    color: '#fff',
  },
});
