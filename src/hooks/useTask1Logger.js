import { useRef, useEffect } from 'react';

// Utility: get ISO8601 timestamp
const nowISO = () => new Date().toISOString();

// Utility: get ms since epoch
const nowMS = () => Date.now();

/**
 * useTask1Logger
 * Returns:
 *   - event handlers for fields (onFocus, onBlur, onChange, onKeyDown, onPaste)
 *   - mouse/keyboard global listeners
 *   - help/error logging methods
 *   - saveToLocalStorage() to persist the session
 *   - task_1_data (live data object)
 */
const useTask1Logger = () => {
	// --- Data structure refs (persist across renders, not reactive) ---
	const dataRef = useRef({
		timestamps: { start: null, end: null },
		summary_metrics: {
			total_time_ms: 0,
			success: false,
			error_count: 0,
			help_requests: 0,
		},
		field_interactions: [], // [{ field_name, focus_time_ms, backspace_count, edit_count }]
		mouse_data: [], // [{ type, timestamp, target, coordinates?, key? }]
		task_specific_metrics: {
			zip_code_corrections: 0,
			shipping_method_changes: 0,
			field_sequence: [],
		},
	});

	// --- Internal state for field focus timing, etc. ---
	const fieldTimers = useRef({}); // { field_name: { focusStart: ms, total: ms } }
	const fieldBackspaces = useRef({}); // { field_name: count }
	const fieldEdits = useRef({}); // { field_name: count }
	const lastField = useRef(null); // for field_sequence

	// --- FIELD INTERACTIONS ---
	const onFieldFocus = (field_name) => {
		// Start timer
		if (!fieldTimers.current[field_name]) fieldTimers.current[field_name] = { focusStart: null, total: 0 };
		fieldTimers.current[field_name].focusStart = nowMS();
		// Sequence
		if (lastField.current !== field_name) {
			dataRef.current.task_specific_metrics.field_sequence.push(field_name);
			lastField.current = field_name;
		}
	};

	const onFieldBlur = (field_name) => {
		const timer = fieldTimers.current[field_name];
		if (timer && timer.focusStart) {
			timer.total += nowMS() - timer.focusStart;
			timer.focusStart = null;
		}
		// Update field_interactions array
		updateFieldInteraction(field_name);
	};

	const onFieldChange = (field_name) => {
		if (!fieldEdits.current[field_name]) fieldEdits.current[field_name] = 0;
		fieldEdits.current[field_name]++;
		// Special: zip_code
		if (field_name === 'zipCode') {
			dataRef.current.task_specific_metrics.zip_code_corrections++;
		}
		updateFieldInteraction(field_name);
	};

	const onFieldBackspace = (field_name) => {
		if (!fieldBackspaces.current[field_name]) fieldBackspaces.current[field_name] = 0;
		fieldBackspaces.current[field_name]++;
		updateFieldInteraction(field_name);
	};

	// Helper: update field_interactions array for a field
	function updateFieldInteraction(field_name) {
		const idx = dataRef.current.field_interactions.findIndex(f => f.field_name === field_name);
		const obj = {
			field_name,
			focus_time_ms: fieldTimers.current[field_name]?.total || 0,
			backspace_count: fieldBackspaces.current[field_name] || 0,
			edit_count: fieldEdits.current[field_name] || 0,
		};
		if (idx === -1) {
			dataRef.current.field_interactions.push(obj);
		} else {
			dataRef.current.field_interactions[idx] = obj;
		}
	}

	// --- MOUSE & KEYBOARD LOGGING ---
	// Throttle mousemove
	const mouseMoveThrottle = useRef(0);
	useEffect(() => {
		const mouseHandler = (e) => {
			if (e.type === 'mousemove') {
				const now = Date.now();
				if (now - mouseMoveThrottle.current < 100) return;
				mouseMoveThrottle.current = now;
			}
			dataRef.current.mouse_data.push({
				type: e.type,
				timestamp: nowISO(),
				target: e.target?.name || e.target?.id || e.target?.className || e.target?.tagName,
				coordinates: e.type.startsWith('mouse') ? { x: e.clientX, y: e.clientY } : undefined,
				key: e.type.startsWith('key') ? e.key : undefined,
			});
		};
		window.addEventListener('mousemove', mouseHandler);
		window.addEventListener('mousedown', mouseHandler);
		window.addEventListener('mouseup', mouseHandler);
		window.addEventListener('keydown', mouseHandler);
		window.addEventListener('keyup', mouseHandler);
		return () => {
			window.removeEventListener('mousemove', mouseHandler);
			window.removeEventListener('mousedown', mouseHandler);
			window.removeEventListener('mouseup', mouseHandler);
			window.removeEventListener('keydown', mouseHandler);
			window.removeEventListener('keyup', mouseHandler);
		};
	}, []);

	// --- SHIPPING METHOD ---
	const onShippingMethodChange = () => {
		dataRef.current.task_specific_metrics.shipping_method_changes++;
	};

	// --- HELP & ERROR ---
	const logHelpRequest = () => {
		dataRef.current.summary_metrics.help_requests++;
	};
	const logError = () => {
		dataRef.current.summary_metrics.error_count++;
	};

	// --- TIMESTAMPS ---
	const markStart = () => {
		if (!dataRef.current.timestamps.start) {
			dataRef.current.timestamps.start = nowISO();
		}
	};
	const markEnd = (success = true) => {
		if (!dataRef.current.timestamps.end) {
			dataRef.current.timestamps.end = nowISO();
			dataRef.current.summary_metrics.success = !!success;
			// Calculate total time
			const start = new Date(dataRef.current.timestamps.start).getTime();
			const end = new Date(dataRef.current.timestamps.end).getTime();
			dataRef.current.summary_metrics.total_time_ms = end - start;
		}
	};

	// --- SAVE ---
	const saveToLocalStorage = () => {
		// Validate structure
		const d = dataRef.current;
		if (!d.timestamps.start || !d.timestamps.end) return false;
		localStorage.setItem('task_1_data', JSON.stringify({ task_1_data: d }));
		return true;
	};

	// --- FIELD EVENT HANDLERS ---
	// These are to be attached to each field in Task1.jsx
	const getFieldProps = (field_name) => ({
		onFocus: () => { onFieldFocus(field_name); },
		onBlur: () => { onFieldBlur(field_name); },
		onChange: () => { onFieldChange(field_name); },
		onKeyDown: (e) => { if (e.key === 'Backspace') onFieldBackspace(field_name); },
	});

	return {
		getFieldProps,
		onShippingMethodChange,
		logHelpRequest,
		logError,
		markStart,
		markEnd,
		saveToLocalStorage,
		data: dataRef.current,
	};
};

export default useTask1Logger;
