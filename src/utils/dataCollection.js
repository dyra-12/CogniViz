// Utilities for collecting and sending study data
import { db } from './firebase';
import { addDoc, collection } from 'firebase/firestore';
import { getAllQuestionnaireResponses } from './tlx';

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

/**
 * Build aggregated study payload from localStorage for all tasks and questionnaires.
 * Returns a plain object; does not perform any network calls.
 */
export function buildAggregatedStudyPayload() {
	const participantId = localStorage.getItem('participantId') || null;

	const task1Raw = localStorage.getItem('task_1_data');
	const task2Raw = localStorage.getItem('task_2_data');
	const task3Raw = (() => {
		const byKey = localStorage.getItem('task 3');
		if (byKey) return byKey;
		const keys = Object.keys(localStorage).filter(k => k && k.startsWith('task3_metrics_'));
		if (keys.length === 0) return null;
		let best = null;
		for (const k of keys) {
			try {
				const parsed = JSON.parse(localStorage.getItem(k));
				if (!parsed) continue;
				if (!best) best = { key: k, data: parsed };
				else {
					const a = parsed.last_saved_ts || parsed.lastSavedTs || null;
					const b = best.data.last_saved_ts || best.data.lastSavedTs || null;
					if (a && b) {
						if (new Date(a) > new Date(b)) best = { key: k, data: parsed };
					} else {
						best = { key: k, data: parsed };
					}
				}
			} catch (e) { /* ignore parse errors */ }
		}
		return best ? JSON.stringify(best.data) : null;
	})();

	const task1 = task1Raw ? safeParse(task1Raw) : null;
	const task2 = task2Raw ? safeParse(task2Raw) : null;
	const task3 = task3Raw ? safeParse(task3Raw) : null;

	const nasaResponsesRaw = localStorage.getItem('nasa_tlx_responses');
	const nasaResponses = nasaResponsesRaw ? safeParse(nasaResponsesRaw, []) : getAllQuestionnaireResponses();

	const id = participantId || genId();

	return {
		id,
		participantId,
		timestamp: new Date().toISOString(),
		task_metrics: {
			task_1: task1,
			task_2: task2,
			task_3: task3,
		},
		nasa_tlx_responses: nasaResponses,
		meta: {
			app: 'CogniViz',
			version: typeof process !== 'undefined' ? (process.env.npm_package_version || null) : null,
		}
	};
}

/**
 * Send aggregated study data to Firestore collection 'study_responses'.
 * De-duplicates via localStorage key 'submission_sent'.
 */
export async function sendAggregatedStudyData() {
	try {
		// Prevent duplicate submissions per session
		if (localStorage.getItem('submission_sent') === 'true') {
			return { ok: true, id: localStorage.getItem('submission_docId') || null, duplicate: true };
		}

		const payload = buildAggregatedStudyPayload();
		const colRef = collection(db, 'study_responses');
		const docRef = await addDoc(colRef, payload);
		try {
			localStorage.setItem('submission_sent', 'true');
			localStorage.setItem('submission_docId', docRef.id);
		} catch (_) { /* ignore */ }
		return { ok: true, id: docRef.id };
	} catch (error) {
		const msg = (error && (error.message || error.code)) || String(error);
		let hint;
		if (msg && msg.includes('Missing or insufficient permissions')) {
			hint = 'Missing or insufficient permissions. Ensure Firestore rules allow create on collection "study_responses" and that Anonymous Auth is enabled (or adjust rules).';
		}
		const wrapped = hint ? new Error(hint) : error;
		return { ok: false, error: wrapped };
	}
}

// Helpers
function genId() {
	return Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
}

function safeParse(raw, fallback = null) {
	try { return JSON.parse(raw); } catch { return fallback; }
}

export default {
	sendTask1Metrics,
	buildAggregatedStudyPayload,
	sendAggregatedStudyData,
};
