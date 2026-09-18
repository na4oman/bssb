import React, { useState } from 'react'
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
} from 'react-native'
import NotificationHandler from './NotificationHandler'

interface MainScreenProps {
  onModalPress: () => void
}

const MainScreen: React.FC<MainScreenProps> = ({ onModalPress }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <>
      {Platform.OS !== 'web' && <NotificationHandler />}
      {/* Hide the floating FAB on web — the events tab renders an inline
          "Create Event" button instead (more natural for desktop). */}
      {Platform.OS !== 'web' && (
        <View style={styles.container}>
          <TouchableOpacity
            style={[styles.addButton, hovered && styles.addButtonHovered]}
            onPress={onModalPress}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', // <--- Make container relative to the screen
    bottom: 20, // <--- Position at the bottom
    left: 0,
    right: 20,
    alignItems: 'flex-end', // <--- Center the button horizontally
    zIndex: 1, // Ensure the button is above other components
  },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e21d38',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    shadowColor: '#000', // <--- Shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // Elevation is for Android
    transition: 'background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
  },
  addButtonHovered: {
    backgroundColor: '#c0142e',
    transform: [{ scale: 1.08 }],
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  addButtonText: {
    fontSize: 30,
    color: '#fff',
  },
})

export default MainScreen
