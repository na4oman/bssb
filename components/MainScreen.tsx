import React, { useState } from 'react'
import NotificationHandler from './NotificationHandler'
import EventForm from './EventForm'
import EventList from './EventList'
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native'
import { Event } from '@/types/event'
import Modal from 'react-native-modal'

interface MainScreenProps {
  onAddEvent: (
    eventData: Omit<
      Event,
      'id' | 'likes' | 'comments' | 'attendees' | 'createdBy'
    >
  ) => void
}

const MainScreen: React.FC<MainScreenProps> = ({ onAddEvent }) => {
  const [events, setEvents] = useState<Event[]>([])
  const [modalVisible, setModalVisible] = useState(false)

  const handleModalClose = () => {
    setModalVisible(false)
  }

  return (
    <>
      <NotificationHandler />
      <EventList events={events} />
      <Modal
        isVisible={modalVisible}
        onBackdropPress={handleModalClose}
        style={styles.createEventModal}
        backdropOpacity={0.5}
        animationIn='slideInUp'
        animationOut='slideOutDown'
      >
        <EventForm onAddEvent={onAddEvent} onClose={handleModalClose} />
      </Modal>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </>
  )
}

const styles = StyleSheet.create({
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e21d38',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)',
    elevation: 5,
    zIndex: 999,
  },
  addButtonText: {
    fontSize: 30,
    color: '#fff',
  },
  createEventModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
})

export default MainScreen
