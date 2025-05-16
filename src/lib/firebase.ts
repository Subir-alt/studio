
// TODO: Replace with your actual Firebase project configuration
// You can find this in your Firebase project settings.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Import and initialize Firebase (if not already done for server-side)
// For client-side usage:
import { initializeApp, getApp, getApps } from 'firebase/app';

let firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export { firebaseApp };
