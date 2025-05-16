
// Firebase project configuration
// This configuration was obtained from your Firebase project settings.
// IMPORTANT: YOU MUST VERIFY THESE VALUES, ESPECIALLY `apiKey`,
// WITH THE VALUES FROM YOUR FIREBASE PROJECT CONSOLE.
// Go to Project settings > General > Your apps > Firebase SDK snippet > Config.
const firebaseConfig = {
  apiKey: "AIzaSyAq_zQxT1gsbNMgFGiFlr0qv7LYKKGz6eY",
  authDomain: "memoria-padit.firebaseapp.com",
  databaseURL: "https://memoria-padit-default-rtdb.firebaseio.com",
  projectId: "memoria-padit",
  storageBucket: "memoria-padit.appspot.com",
  messagingSenderId: "942752770709",
  appId: "1:942752770709:web:3aeab2385d59af7073899c",
};

// Import and initialize Firebase
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

let firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

export { firebaseApp, auth };
