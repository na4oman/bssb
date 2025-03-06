import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

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

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return null; // This component does not render anything
};

export default NotificationHandler;