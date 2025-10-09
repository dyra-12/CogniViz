import { useRef, useEffect } from 'react';

/**
 * Custom hook to log all user interactions for Task 1 form.
 * Returns:
 * - logger: object with event handler functions to spread into form fields
 * - onSubmit: function to call on successful form submit
 * - onError: function to call on validation error
 * - onHelp: function to call when help is requested
 * - getData: function to get the current data object
 */
export default function useTask1Logger() {
  // Main data object
  const dataRef = useRef({
    task_1_data: {
      timestamps: {
        start: new Date().toISOString(),
        end: null,
      },
      summary_metrics: {
        total_time_ms: 0,
        success: false,
        error_count: 0,
        help_requests: 0,
      },
      field_interactions: [],
      mouse_data: [],
      task_specific_metrics: {
        zip_code_corrections: 0,
        shipping_method_changes: 0,
        field_sequence: [],
      },
    },
  });

  // For focus timing
  const focusTimers = useRef({});
  // For backspace count per field
  const backspaceCounts = useRef({});
  // For edit count per field
  const editCounts = useRef({});
  // For tracking last focused field
  const lastFocusedField = useRef(null);
  // For tracking last shipping method
  const lastShippingMethod = useRef(null);

  // Mouse and keyboard event listeners
  useEffect(() => {
    function handleMouseMove(e) {
      dataRef.current.task_1_data.mouse_data.push({
        type: 'mouse_move',
        timestamp: new Date().toISOString(),
        target: e.target?.name || e.target?.id || e.target?.className || 'unknown',
        x: e.clientX,
        y: e.clientY,
      });
    }
    function handleClick(e) {
      dataRef.current.task_1_data.mouse_data.push({
        type: 'click',
        timestamp: new Date().toISOString(),
        target: e.target?.name || e.target?.id || e.target?.className || 'unknown',
      });
    }
    function handleKeyDown(e) {
      dataRef.current.task_1_data.mouse_data.push({
        type: 'key_down',
        timestamp: new Date().toISOString(),
        target: e.target?.name || e.target?.id || e.target?.className || 'unknown',
        key: e.key,
      });
    }
    function handleKeyUp(e) {
      dataRef.current.task_1_data.mouse_data.push({
        type: 'key_up',
        timestamp: new Date().toISOString(),
        target: e.target?.name || e.target?.id || e.target?.className || 'unknown',
        key: e.key,
      });
    }
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Field event handlers
  function onFocus(e) {
    const name = e.target.name;
    focusTimers.current[name] = Date.now();
    // Field sequence
    const seq = dataRef.current.task_1_data.task_specific_metrics.field_sequence;
    if (seq.length === 0 || seq[seq.length - 1] !== name) {
      seq.push(name);
    }
    lastFocusedField.current = name;
  }

  function onBlur(e) {
    const name = e.target.name;
    if (focusTimers.current[name]) {
      const duration = Date.now() - focusTimers.current[name];
      let fieldObj = dataRef.current.task_1_data.field_interactions.find(f => f.field_name === name);
      if (!fieldObj) {
        fieldObj = { field_name: name, focus_time_ms: 0, backspace_count: 0, edit_count: 0 };
        dataRef.current.task_1_data.field_interactions.push(fieldObj);
      }
      fieldObj.focus_time_ms += duration;
      focusTimers.current[name] = null;
    }
  }

  function onChange(e) {
    const name = e.target.name;
    // Edit count
    editCounts.current[name] = (editCounts.current[name] || 0) + 1;
    let fieldObj = dataRef.current.task_1_data.field_interactions.find(f => f.field_name === name);
    if (!fieldObj) {
      fieldObj = { field_name: name, focus_time_ms: 0, backspace_count: 0, edit_count: 0 };
      dataRef.current.task_1_data.field_interactions.push(fieldObj);
    }
    fieldObj.edit_count = editCounts.current[name];
    // Task-specific: zip code
    if (name === 'zipCode') {
      dataRef.current.task_1_data.task_specific_metrics.zip_code_corrections = fieldObj.edit_count;
    }
    // Task-specific: shipping method
    if (name === 'shippingMethod') {
      if (lastShippingMethod.current && lastShippingMethod.current !== e.target.value) {
        dataRef.current.task_1_data.task_specific_metrics.shipping_method_changes += 1;
      }
      lastShippingMethod.current = e.target.value;
    }
  }

  function onKeyDown(e) {
    const name = e.target.name;
    if (e.key === 'Backspace') {
      backspaceCounts.current[name] = (backspaceCounts.current[name] || 0) + 1;
      let fieldObj = dataRef.current.task_1_data.field_interactions.find(f => f.field_name === name);
      if (!fieldObj) {
        fieldObj = { field_name: name, focus_time_ms: 0, backspace_count: 0, edit_count: 0 };
        dataRef.current.task_1_data.field_interactions.push(fieldObj);
      }
      fieldObj.backspace_count = backspaceCounts.current[name];
    }
  }

  function onPaste(e) {
    dataRef.current.task_1_data.mouse_data.push({
      type: 'paste',
      timestamp: new Date().toISOString(),
      target: e.target?.name || e.target?.id || e.target?.className || 'unknown',
    });
  }

  // Submission and error handling
  function onSubmit() {
    const end = new Date();
    dataRef.current.task_1_data.timestamps.end = end.toISOString();
    const start = new Date(dataRef.current.task_1_data.timestamps.start);
    dataRef.current.task_1_data.summary_metrics.total_time_ms = end - start;
    dataRef.current.task_1_data.summary_metrics.success = true;
    // Save to localStorage
    localStorage.setItem('task_1_data', JSON.stringify(dataRef.current.task_1_data));
  }

  function onError() {
    dataRef.current.task_1_data.summary_metrics.error_count += 1;
  }

  function onHelp() {
    dataRef.current.task_1_data.summary_metrics.help_requests += 1;
  }

  function getData() {
    return dataRef.current.task_1_data;
  }

  // Return handlers to spread into fields
  return {
    logger: {
      onFocus,
      onBlur,
      onChange,
      onKeyDown,
      onPaste,
    },
    onSubmit,
    onError,
    onHelp,
    getData,
  };
}
