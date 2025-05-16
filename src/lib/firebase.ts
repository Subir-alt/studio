
// Firebase project configuration
// This configuration was obtained from your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyCSmPQdaMd27kfyMwWvPKez6Ix6hTSwWKc", // New API Key
  authDomain: "memoria-padit.firebaseapp.com",
  databaseURL: "https://memoria-padit-default-rtdb.firebaseio.com",
  projectId: "memoria-padit",
  storageBucket: "memoria-padit.appspot.com",
  messagingSenderId: "942752770709",
  appId: "1:942752770709:web:3aeab2385d59af7073899c",
};

// Log the configuration to the console for verification
console.log("Firebase Config Loaded:", firebaseConfig);

// Import and initialize Firebase
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

let firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

export { firebaseApp, auth };
