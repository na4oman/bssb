// Script to test push notification
// Usage: node scripts/testPushNotification.js YOUR_EXPO_PUSH_TOKEN

const expoPushToken = process.argv[2];

if (!expoPushToken) {
  console.error('❌ Please provide your Expo Push Token');
  console.log('Usage: node scripts/testPushNotification.js YOUR_EXPO_PUSH_TOKEN');
  console.log('\nTo get your token:');
  console.log('1. Open the app');
  console.log('2. Check the console logs for "Expo Push Token:"');
  console.log('3. Copy the token (starts with ExponentPushToken[...])');
  process.exit(1);
}

async function sendTestNotification() {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: '✅ Payment Confirmed',
    body: 'Your membership payment has been confirmed. Thank you for your support!',
    data: { type: 'payment_confirmed' },
  };

  try {
    console.log('Sending test notification...');
    console.log('Token:', expoPushToken);
    
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();
    
    if (data.data && data.data[0].status === 'ok') {
      console.log('✅ Notification sent successfully!');
      console.log('Check your device for the notification');
    } else {
      console.log('❌ Failed to send notification');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

sendTestNotification();
