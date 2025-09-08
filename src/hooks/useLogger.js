import { useCallback, useContext } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../contexts/AuthContext';

const useLogger = () => {
  const { participantId } = useAuth();

  const log = useCallback(async (eventName, eventData = {}) => {
    // Generate a unique ID for this specific log entry
    const logId = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const logEntry = {
      participantId, // From context
      eventName,
      eventData,
      timestamp: serverTimestamp(), // Use server time for accuracy
      userAgent: navigator.userAgent,
      url: window.location.href,
      logId // Unique ID for this log
    };

    // For debugging: always log to console
    console.log('[LOG]', eventName, logEntry);

    try {
      // Write to Firestore. We use the unique logId as the document ID.
      await setDoc(doc(db, 'logs', logId), logEntry);
    } catch (error) {
      console.error('Error writing log to Firebase:', error);
      // It's often better to fail silently for logging so it doesn't break the user experience.
    }
  }, [participantId]); // participantId is a dependency

  return { log };
};

export default useLogger;