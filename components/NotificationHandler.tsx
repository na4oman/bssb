import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

const NotificationHandler = () => {
  const notificationListener = useRef<Notifications.EventSubscription | any>();
  const responseListener = useRef<Notifications.EventSubscription | any>();

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission not granted for notifications');
      }
    };

    requestPermissions();

    // Handle notification received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      
      const data = notification.request.content.data;
      
      // Show alert for payment confirmation
      if (data?.type === 'payment_confirmed') {
        Alert.alert(
          notification.request.content.title || 'Notification',
          notification.request.content.body || '',
          [{ text: 'OK' }]
        );
      }
    });

    // Handle notification tap/interaction
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      const data = response.notification.request.content.data;
      
      // Navigate based on notification type
      if (data?.type === 'payment_confirmed') {
        // Navigate to profile page to see membership status
        router.push('/profile');
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return null; // This component does not render anything
};

export default NotificationHandler;