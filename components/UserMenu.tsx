import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuth } from '../contexts/AuthContext'
import { checkIsUserAdmin } from '../utils/userService'
import DeleteAccountModal from './DeleteAccountModal'

/**
 * Web-only user menu: avatar button + dropdown (Profile, Users Management,
 * Settings, About, Logout). Replaces the hamburger drawer on desktop —
 * the native header keeps HamburgerMenu for mobile.
 */
const UserMenu = () => {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Check if user is admin
  useEffect(() => {
    if (user) {
      checkIsUserAdmin(user.uid).then(setIsAdmin)
    }
  }, [user])

  // Close on Escape (web only)
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const initials = user?.email
    ? user.email
        .split('@')[0]
        .split(/[._-]+/)
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : ''

  const menuItems = [
    {
      id: 'profile',
      title: 'Profile',
      icon: 'person-outline',
      onPress: () => {
        setOpen(false)
        router.push('/profile')
      },
    },
    ...(isAdmin
      ? [
          {
            id: 'users',
            title: 'Users Management',
            icon: 'people-outline',
            isAdminOnly: true,
            onPress: () => {
              setOpen(false)
              router.push('/users')
            },
          },
        ]
      : []),
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings-outline',
      onPress: () => {
        setOpen(false)
        // Navigate to settings screen (to be implemented)
        console.log('Navigate to Settings')
      },
    },
    {
      id: 'about',
      title: 'About',
      icon: 'information-circle-outline',
      onPress: () => {
        setOpen(false)
        // Navigate to about screen (to be implemented)
        console.log('Navigate to About')
      },
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: 'log-out-outline',
      isDanger: true,
      onPress: async () => {
        setOpen(false)
        await signOut()
      },
    },
    {
      id: 'delete-account',
      title: 'Delete Account',
      icon: 'trash-outline',
      isDanger: true,
      onPress: () => {
        setOpen(false)
        setShowDeleteModal(true)
      },
    },
  ]

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => setOpen(o => !o)}
        accessibilityRole='button'
        accessibilityLabel='User menu'
        accessibilityState={{ expanded: open }}
      >
        {initials ? (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        ) : (
          <Ionicons name='person-circle-outline' size={36} color='#fff' />
        )}
        <Ionicons
          name='chevron-down'
          size={14}
          color='rgba(255,255,255,0.85)'
          style={[styles.chevron, open && styles.chevronOpen]}
        />
      </TouchableOpacity>

      {open && (
        <>
          <Pressable
            style={styles.overlay}
            onPress={() => setOpen(false)}
            accessibilityLabel='Close menu'
          />
          <View style={styles.dropdown}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownEmail} numberOfLines={1}>
                {user?.email}
              </Text>
            </View>
            {menuItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  (item as any).isAdminOnly && styles.adminMenuItem,
                  hoveredItem === item.id && styles.menuItemHovered,
                ]}
                onPress={item.onPress}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={
                    (item as any).isAdminOnly
                      ? '#FF9800'
                      : item.isDanger
                        ? '#e21d38'
                        : '#333'
                  }
                />
                <Text
                  style={[
                    styles.menuItemText,
                    item.isDanger && styles.dangerText,
                    (item as any).isAdminOnly && styles.adminText,
                  ]}
                >
                  {item.title}
                </Text>
                {(item as any).isAdminOnly && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={() => {
          setShowDeleteModal(false)
          router.replace('/(auth)/login')
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 24,
    transition: 'background-color 0.15s ease',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#e21d38',
    fontSize: 15,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 4,
    transition: 'transform 0.15s ease',
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  overlay: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 6,
    width: 260,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 101,
    overflow: 'hidden',
  },
  dropdownHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dropdownEmail: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    transition: 'background-color 0.15s ease',
  },
  adminMenuItem: {
    backgroundColor: '#FFF3E0',
  },
  menuItemHovered: {
    backgroundColor: '#f0f0f0',
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  dangerText: {
    color: '#e21d38',
  },
  adminText: {
    color: '#FF9800',
    fontWeight: '600',
  },
  adminBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  adminBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
})

export default UserMenu