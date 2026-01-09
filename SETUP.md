# Setup Instructions

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# News API
EXPO_PUBLIC_NEWS_API_KEY=your_news_api_key

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Firebase Setup

1. **Create Firebase Project**: Go to [Firebase Console](https://console.firebase.google.com)
2. **Enable Authentication**: 
   - Go to Authentication → Sign-in method
   - Enable Email/Password provider
3. **Create Firestore Database**:
   - Go to Firestore Database
   - Create database in test mode
4. **Get Configuration**:
   - Go to Project Settings → Your apps
   - Copy the config object values to your `.env` file

## Android Setup

1. **Download google-services.json**:
   - In Firebase Console → Project Settings → Your apps
   - Download `google-services.json` for Android
   - Place it in the root directory (it's gitignored for security)

## Security Notes

- Never commit `.env` files or `google-services.json` to version control
- These files contain sensitive API keys and should be kept private
- Use the template files as reference for required structure