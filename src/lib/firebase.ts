
// Firebase project configuration
// This configuration was obtained from your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyAq_zQxT1gsbNMgFGiFlr0qv7LYKKGz6eY",
  authDomain: "memoria-padit.firebaseapp.com",
  databaseURL: "https://memoria-padit-default-rtdb.firebaseio.com", // Constructed based on projectId
  projectId: "memoria-padit",
  storageBucket: "memoria-padit.firebasestorage.app",
  messagingSenderId: "942752770709",
  appId: "1:942752770709:web:3aeab2385d59af7073899c",
};

// Import and initialize Firebase
import { initializeApp, getApp, getApps } from 'firebase/app';

let firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export { firebaseApp };
