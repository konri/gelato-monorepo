// Test script to send a push notification via Expo
// Usage: node scripts/test-notification.js <expo-push-token>

const fetch = require('node-fetch');

const expoPushToken = process.argv[2];

if (!expoPushToken) {
  console.error('❌ Please provide Expo push token as argument');
  console.log('Usage: node scripts/test-notification.js <expo-push-token>');
  process.exit(1);
}

const message = {
  to: expoPushToken,
  sound: 'default',
  title: 'Test Notification 🔔',
  body: 'This is a test notification from Bonapka!',
  data: { testData: 'some data' },
};

async function sendPushNotification() {
  try {
    console.log('📤 Sending test notification...');
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
    console.log('✅ Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

sendPushNotification();
