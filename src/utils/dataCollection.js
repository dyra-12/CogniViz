// Utilities for collecting and sending study data
import { db } from './firebase';
import { addDoc, collection } from 'firebase/firestore';

/**
 * Read Task 1 metrics from localStorage and send to Firestore.
 * Collection: task1
 * Document shape:
 *   {
 *     participantId: string | null,
 *     timestamp: ISOString,
 *     task_1_data: { ... } // the exact structure saved by useTask1Logger
 *   }
 *
 * Returns: { ok: true, id } on success; { ok: false, error } on failure.
 */
export async function sendTask1Metrics({ participantId: pidFromArg } = {}) {
	try {
		const raw = localStorage.getItem('task_1_data');
		if (!raw) {
			return { ok: false, error: new Error('No task_1_data found in localStorage') };
		}

		let parsed;
		try {
			parsed = JSON.parse(raw);
		} catch (e) {
			return { ok: false, error: new Error('Failed to parse task_1_data JSON') };
		}

		const taskData = parsed?.task_1_data || parsed; // tolerate either wrapped or raw

		// participantId preference: argument -> localStorage -> null
		const pid = pidFromArg || localStorage.getItem('participantId') || null;

		const payload = {
			participantId: pid,
			timestamp: new Date().toISOString(),
			task_1_data: taskData,
		};

			// Prevent duplicate uploads for Task 1 per participant/session
			const already = localStorage.getItem('task1_uploaded');
			if (already === 'true') {
				return { ok: true, id: localStorage.getItem('task1_docId') || null, duplicate: true };
			}

			const colRef = collection(db, 'task1');
			const docRef = await addDoc(colRef, payload);
			try {
				localStorage.setItem('task1_uploaded', 'true');
				localStorage.setItem('task1_docId', docRef.id);
			} catch (_) { /* ignore */ }
			return { ok: true, id: docRef.id };
	} catch (error) {
			// Normalize common permission errors for clearer UI messaging
			const msg = (error && (error.message || error.code)) || String(error);
			let hint;
			if (msg && msg.includes('Missing or insufficient permissions')) {
				hint = 'Missing or insufficient permissions. Ensure Firestore rules allow create on collection "task1" and that Anonymous Auth is enabled (or adjust rules).';
			}
			const wrapped = hint ? new Error(hint) : error;
			return { ok: false, error: wrapped };
	}
}

export default {
	sendTask1Metrics,
};
