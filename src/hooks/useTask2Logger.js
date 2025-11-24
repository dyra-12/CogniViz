import { useRef, useEffect } from 'react';
import { publishTaskMetrics } from '../telemetry/taskMetricsBus';

// Utility functions
const nowISO = () => new Date().toISOString();
const nowMS = () => Date.now();

/**
 * useTask2Logger
 * Returns:
 *   - API for filter/product/mouse/decision logging
 *   - saveToLocalStorage() to persist the session
 *   - task_2_data (live data object)
 */
const useTask2Logger = () => {
  // --- Data structure refs ---
  const dataRef = useRef({
    timestamps: { start: null, end: null },
    summary_metrics: {
      total_time_ms: 0,
      success: false,
      error_count: 0,
    },
    filter_interactions: {
      filter_uses: [], // {filter_type, action, value_before, value_after, timestamp}
      filter_sequence: [],
      filter_resets: 0,
    },
    product_exploration: {
      products_viewed: [], // {product_id, hover_duration_ms}
      rapid_hover_switches: 0,
    },
    decision_making: {
      time_to_first_filter: null,
      decision_time_ms: null,
      comparison_count: 0,
    },
    mouse_analytics: {
      mouse_entropy: null,
      click_precision: [], // {target, click_pos, center_pos, distance}
    },
  });

  useEffect(() => {
    publishTaskMetrics('task2', dataRef.current);
  }, []);

  const broadcastThrottle = useRef(0);
  const broadcastSnapshot = () => {
    const now = Date.now();
    if (now - broadcastThrottle.current < 250) return;
    broadcastThrottle.current = now;
    publishTaskMetrics('task2', dataRef.current);
  };

  // --- Internal state ---
  const filterFirstUse = useRef({});
  const filterLastValues = useRef({});
  const lastFilterType = useRef(null);
  const lastFilterTime = useRef(null);
  const lastFilterSetTime = useRef(null);
  const firstFilterTime = useRef(null);

  // Product hover tracking
  const hoverStart = useRef({}); // {product_id: ms}
  const lastHoveredProduct = useRef(null);
  const lastHoverTime = useRef(null);
  const hoverSwitches = useRef([]); // [{from, to, time_ms}]
  const hoveredProductsSet = useRef(new Set());

  // Mouse movement
  const mousePath = useRef([]); // [{x, y, t}]

  // --- TIMESTAMPS ---
  const markStart = () => {
    if (!dataRef.current.timestamps.start) {
      dataRef.current.timestamps.start = nowISO();
    }
    broadcastSnapshot();
  };
  const markEnd = () => {
    if (!dataRef.current.timestamps.end) {
      dataRef.current.timestamps.end = nowISO();
      // Calculate total time
      const start = new Date(dataRef.current.timestamps.start).getTime();
      const end = new Date(dataRef.current.timestamps.end).getTime();
      dataRef.current.summary_metrics.total_time_ms = end - start;
      broadcastSnapshot();
    }
  };

  // --- FILTER INTERACTIONS ---
  const logFilterUse = (filter_type, action, value_before, value_after) => {
    const ts = nowISO();
    dataRef.current.filter_interactions.filter_uses.push({
      filter_type, action, value_before, value_after, timestamp: ts
    });
    // Sequence
    if (!filterFirstUse.current[filter_type]) {
      dataRef.current.filter_interactions.filter_sequence.push(filter_type);
      filterFirstUse.current[filter_type] = true;
      if (!firstFilterTime.current) {
        firstFilterTime.current = nowMS();
        // time_to_first_filter
        if (dataRef.current.timestamps.start) {
          dataRef.current.decision_making.time_to_first_filter = firstFilterTime.current - new Date(dataRef.current.timestamps.start).getTime();
        }
      }
    }
    // For decision_time_ms
    lastFilterType.current = filter_type;
    lastFilterTime.current = nowMS();
    lastFilterSetTime.current = nowMS();
    broadcastSnapshot();
  };
  const logFilterReset = () => {
    dataRef.current.filter_interactions.filter_resets++;
    broadcastSnapshot();
  };
  const logFilterError = () => {
    dataRef.current.summary_metrics.error_count++;
    broadcastSnapshot();
  };

  // --- PRODUCT EXPLORATION ---
  const logProductHoverStart = (product_id) => {
    hoverStart.current[product_id] = nowMS();
    // Rapid hover switch
    if (lastHoveredProduct.current && lastHoveredProduct.current !== product_id) {
      const now = nowMS();
      const delta = now - (lastHoverTime.current || now);
      if (delta < 500) {
        dataRef.current.product_exploration.rapid_hover_switches++;
      }
      hoverSwitches.current.push({ from: lastHoveredProduct.current, to: product_id, time_ms: delta });
    }
    lastHoveredProduct.current = product_id;
    lastHoverTime.current = nowMS();
    hoveredProductsSet.current.add(product_id);
    broadcastSnapshot();
  };
  const logProductHoverEnd = (product_id) => {
    const start = hoverStart.current[product_id];
    if (start) {
      const duration = nowMS() - start;
      dataRef.current.product_exploration.products_viewed.push({ product_id, hover_duration_ms: duration });
      hoverStart.current[product_id] = null;
    }
    broadcastSnapshot();
  };

  // --- DECISION MAKING ---
  const markDecisionTime = () => {
    if (lastFilterSetTime.current && dataRef.current.timestamps.end) {
      dataRef.current.decision_making.decision_time_ms = new Date(dataRef.current.timestamps.end).getTime() - lastFilterSetTime.current;
    }
    dataRef.current.decision_making.comparison_count = hoveredProductsSet.current.size;
    broadcastSnapshot();
  };

  // --- MOUSE ANALYTICS ---
  useEffect(() => {
    const mouseMoveHandler = (e) => {
      mousePath.current.push({ x: e.clientX, y: e.clientY, t: nowMS() });
      broadcastSnapshot();
    };
    window.addEventListener('mousemove', mouseMoveHandler);
    return () => window.removeEventListener('mousemove', mouseMoveHandler);
  }, []);

  // Calculate mouse entropy (simple version: path randomness)
  const calculateMouseEntropy = () => {
    const path = mousePath.current;
    if (path.length < 2) return 0;
    let totalDist = 0;
    let straightDist = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      totalDist += Math.sqrt(dx * dx + dy * dy);
    }
    const dx = path[path.length - 1].x - path[0].x;
    const dy = path[path.length - 1].y - path[0].y;
    straightDist = Math.sqrt(dx * dx + dy * dy);
    // Entropy: ratio of actual path to straight path
    return straightDist === 0 ? 0 : totalDist / straightDist;
  };

  // Click precision
  const logClickPrecision = (target, click_pos, center_pos) => {
    const dx = click_pos.x - center_pos.x;
    const dy = click_pos.y - center_pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    dataRef.current.mouse_analytics.click_precision.push({ target, click_pos, center_pos, distance });
    broadcastSnapshot();
  };

  // --- SAVE ---
  const saveToLocalStorage = (success = false) => {
    markEnd();
    markDecisionTime();
    dataRef.current.mouse_analytics.mouse_entropy = calculateMouseEntropy();
    dataRef.current.summary_metrics.success = !!success;
    localStorage.setItem('task_2_data', JSON.stringify({ task_2_data: dataRef.current }));
    broadcastSnapshot();
  };

  return {
    markStart,
    markEnd,
    logFilterUse,
    logFilterReset,
    logFilterError,
    logProductHoverStart,
    logProductHoverEnd,
    logClickPrecision,
    saveToLocalStorage,
    data: dataRef.current,
  };
};

export default useTask2Logger;
