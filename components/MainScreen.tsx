import React from 'react'
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native'
import NotificationHandler from './NotificationHandler'

interface MainScreenProps {
  onModalPress: () => void
}

const MainScreen: React.FC<MainScreenProps> = ({ onModalPress }) => {
  return (
    <>
      <NotificationHandler />
      <View style={styles.container}>
        <TouchableOpacity style={styles.addButton} onPress={onModalPress}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
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
  },
  addButtonText: {
    fontSize: 30,
    color: '#fff',
  },
})

export default MainScreen
