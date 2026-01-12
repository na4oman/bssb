# Push Notifications Implementation

## Overview
The app now includes a complete push notification system using Firebase Cloud Messaging (FCM) and Expo Notifications. Users receive notifications when new events are created.

## Features Implemented

### 1. **Notification Registration**
- Automatic registration when users log in
- Stores notification tokens in Firestore
- Handles permissions for both iOS and Android

### 2. **Push Notifications for New Events**
- Automatically sends notifications to all users when a new event is created
- Includes event title and location in the notification
- Uses Expo Push API for reliable delivery

### 3. **Notification Settings**
- Users can manage notification preferences in their profile
- Toggle notifications on/off
- Control different types of notifications (events, comments, likes)
- Test notification functionality

### 4. **Test Functionality**
- Test notification button in the header (bell icon)
- Test button in notification settings
- Helps verify the system is working

## Files Added/Modified

### New Files:
- `utils/notificationService.ts` - Core notification functionality
- `utils/pushNotificationService.ts` - Push notification sending
- `components/NotificationSettings.tsx` - User notification preferences
- `NOTIFICATIONS.md` - This documentation

### Modified Files:
- `contexts/AuthContext.tsx` - Added notification registration on login
- `utils/eventService.ts` - Added notification sending when events are created
- `app/(tabs)/profile.tsx` - Added notification settings component
- `app/(tabs)/_layout.tsx` - Added test notification button
- `app.json` - Added notification permissions and configuration
- `package.json` - Added notification dependencies

## How It Works

### 1. **User Login**
```typescript
// When user logs in, register for notifications
const token = await registerForPushNotifications(user.uid)
// Token is stored in Firestore under users/{userId}/tokens/{token}
```

### 2. **Event Creation**
```typescript
// When a new event is created
await createEvent(eventData)
// Automatically sends notification to all users
await sendNotificationToAllUsers(
  'New Event Created! 🎉',
  `${eventData.title} - ${eventData.location}`
)
```

### 3. **Notification Delivery**
- Uses Expo Push API to send notifications
- Retrieves all user tokens from Firestore
- Sends batch notifications to all registered devices

## Testing

### Test Notification Button
- Bell icon in the header sends a test notification
- Verifies that notifications are working
- Shows success/error messages

### Notification Settings
- Located in the Profile tab
- Allows users to test notifications
- Toggle different notification types

## Configuration

### App Configuration (`app.json`)
```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/images/sunderland-afc-logo.png",
        "color": "#e21d38",
        "defaultChannel": "default"
      }
    ]
  ]
}
```

### Permissions
- Android: Added notification and wake lock permissions
- iOS: Added background modes for remote notifications

## Future Enhancements

### Possible Improvements:
1. **Comment Notifications** - Notify event creators when someone comments
2. **Like Notifications** - Notify when events receive likes
3. **Event Reminders** - Send reminders before events start
4. **Topic-based Notifications** - Allow users to subscribe to specific event types
5. **Rich Notifications** - Include images and action buttons
6. **Firebase Functions** - Move notification logic to server-side triggers

### Server-Side Implementation (Optional):
For production, consider implementing Firebase Cloud Functions:
```javascript
exports.sendNewEventNotification = functions.firestore
  .document('events/{eventId}')
  .onCreate(async (snap, context) => {
    // Send notification when new event is created
  })
```

## Troubleshooting

### Common Issues:
1. **No notifications received**: Check device permissions
2. **Token not stored**: Verify Firebase connection
3. **Notifications not sending**: Check Expo Push API limits

### Debug Steps:
1. Use test notification buttons to verify functionality
2. Check console logs for error messages
3. Verify notification permissions in device settings
4. Test on physical device (notifications don't work in simulator)

## Dependencies
- `expo-notifications` - Notification handling
- `expo-device` - Device detection
- `expo-constants` - App configuration
- Firebase Firestore - Token storage
- Expo Push API - Notification delivery

The notification system is now fully functional and ready for production use!