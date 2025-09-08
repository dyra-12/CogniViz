// Import the functions you need from the SDKs
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// TODO: Replace with your project's config object from the Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyDpAeHRK5FAFd_hhRBRFFDV6LgziXA-5qE",
  authDomain: "my-research-platform.firebaseapp.com",
  projectId: "my-research-platform",
  storageBucket: "my-research-platform.firebasestorage.app",
  messagingSenderId: "945020375498",
  appId: "1:945020375498:web:ba90e6ca1f06f70e237f33",
  measurementId: "G-GREN6E8YFQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;