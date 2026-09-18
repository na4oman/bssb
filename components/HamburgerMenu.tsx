import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import { checkIsUserAdmin } from '../utils/userService';
import { isWeb } from '../utils/platformStyles';

const HamburgerMenu = () => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user, signOut } = useAuth();

  // Check if user is admin
  useEffect(() => {
    if (user) {
      checkIsUserAdmin(user.uid).then(setIsAdmin);
    }
  }, [user]);

  const menuItems = [
    {
      id: 'profile',
      title: 'Profile',
      icon: 'person-outline',
      onPress: () => {
        setIsMenuVisible(false);
        router.push('/profile');
      },
    },
    ...(isAdmin ? [{
      id: 'users',
      title: 'Users Management',
      icon: 'people-outline',
      onPress: () => {
        setIsMenuVisible(false);
        router.push('/users');
      },
      isAdminOnly: true,
    }] : []),
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline',
      onPress: () => {
        setIsMenuVisible(false);
        // Navigate to notifications screen (to be implemented)
        console.log('Navigate to Notifications');
      },
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings-outline',
      onPress: () => {
        setIsMenuVisible(false);
        // Navigate to settings screen (to be implemented)
        console.log('Navigate to Settings');
      },
    },
    {
      id: 'about',
      title: 'About',
      icon: 'information-circle-outline',
      onPress: () => {
        setIsMenuVisible(false);
        // Navigate to about screen (to be implemented)
        console.log('Navigate to About');
      },
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: 'log-out-outline',
      onPress: async () => {
        setIsMenuVisible(false);
        await signOut();
      },
      isDanger: true,
    },
  ];

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsMenuVisible(true)}
        style={styles.menuButton}
        accessibilityRole='button'
        accessibilityLabel='Open menu'
      >
        <Ionicons name="menu" size={28} color="white" />
      </TouchableOpacity>

      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={[styles.menuContainer, isWeb && styles.menuContainerWeb]}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuHeaderText}>Menu</Text>
              <TouchableOpacity
                onPress={() => setIsMenuVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.userInfo}>
              <Ionicons name="person-circle-outline" size={50} color="#e21d38" />
              <Text style={styles.userName}>{user?.email}</Text>
            </View>

            <ScrollView style={styles.menuItems}>
              {menuItems.map((item) => (
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
                    size={24}
                    color={
                      (item as any).isAdminOnly ? '#FF9800' :
                      item.isDanger ? '#e21d38' : '#333'
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
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    width: '75%',
    height: '100%',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuContainerWeb: {
    width: '100%',
    maxWidth: 360,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  userInfo: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userName: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    transition: 'background-color 0.15s ease',
  },
  adminMenuItem: {
    backgroundColor: '#FFF3E0',
  },
  menuItemHovered: {
    backgroundColor: '#f0f0f0',
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
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
});

export default HamburgerMenu;
