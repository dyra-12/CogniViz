// Import the functions you need from the SDKs
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Auth and sign in anonymously to satisfy Firestore security rules
export const auth = getAuth(app);

// Attempt anonymous sign-in on startup. If it fails because the provider is
// not enabled, we'll continue unauthenticated (writes requiring auth will fail
// and be surfaced to the UI).
try {
  // Avoid duplicate calls on HMR by checking currentUser first
  if (!auth.currentUser) {
    signInAnonymously(auth).catch((err) => {
      // Common: auth/operation-not-allowed if Anonymous provider is disabled
      console.warn('[Firebase] Anonymous auth failed:', err?.code || err?.message || err);
    });
  }
} catch (e) {
  console.warn('[Firebase] Auth initialization error:', e);
}

export default app;