import { useCallback, useContext } from 'react';
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
      // Using client timestamp instead of serverTimestamp since we're no longer
      // writing to Firestore. This prevents accidental network calls.
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logId // Unique ID for this log
    };

    // For debugging: always log to console
    console.log('[LOG]', eventName, logEntry);

    // NOTE: Sending logs to Firebase has been disabled.
    // If you need to re-enable remote logging in the future, add a feature flag
    // or restore the Firestore write here. For now we only emit the log to
    // the browser console so no data is transmitted to Firebase.
    // (No-op for remote write)
  }, [participantId]); // participantId is a dependency

  return { log };
};

export default useLogger;