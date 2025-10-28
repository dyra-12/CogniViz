import { useRef, useEffect } from 'react';

// Simple UUID v4 (small, local use only)
const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

const nowISO = () => new Date().toISOString();
const nowMS = () => Date.now();

const DEFAULT_SAMPLE_MS = 100;

const useTask3Logger = (opts = {}) => {
  const sessionId = useRef(uuidv4());
  const dataRef = useRef({
    session_id: sessionId.current,
    task: 'task3',
    start_time: null,
    end_time: null,
    success: null,
    error_count: 0,
    internal_errors: [],
    completed: false,
    last_saved_ts: null,
    total_actions: 0,
    component_switches: [],
    idle_periods: [],
    computed_signals: { rapid_selection_changes: 0, mouse_sampling_rate_ms: DEFAULT_SAMPLE_MS },
  budget: { current_total: 0, updates: [], budget_overrun_events: 0, cost_adjustment_actions: 0, in_overrun: false, overrun_selection_counter: 0 },
    flights: { hover_events: [], selections: [], mouse_entropy: 0 },
    hotels: { hover_events: [], selections: [], mouse_entropy: 0 },
    transportation: { hover_events: [], selections: [], mouse_entropy: 0 },
    meetings: { drag_attempts: [], mouse_entropy: 0 },
    computed: { rapid_selection_buffer: [] }
  });

  // Hover timers
  const hoverTimers = useRef({}); // key -> {start: ms}

  // Sampling for mouse entropy
  const sampling = useRef({ currentArea: null, samples: [], timerId: null });

  // Idle detection
  const idleState = useRef({ lastActivity: nowMS(), idleStart: null });

  // Rapid selection detection buffers
  const selectionBuffers = useRef({}); // category -> [timestamps]

  // Helpers
  const safePush = (arr, item) => { arr.push(item); if (arr.length > 5000) arr.splice(0, 1000); };

  const markStart = () => {
    if (!dataRef.current.start_time) dataRef.current.start_time = nowISO();
    touch();
  };

  const markEnd = (success = null) => {
    if (!dataRef.current.end_time) dataRef.current.end_time = nowISO();
    if (success !== null) dataRef.current.success = !!success;
    dataRef.current.last_saved_ts = nowISO();
    touch();
  };

  const touch = () => { dataRef.current.last_saved_ts = nowISO(); };

  const flushToLocalStorage = () => {
    try {
      localStorage.setItem(`task3_metrics_${sessionId.current}`, JSON.stringify(dataRef.current));
    } catch (e) {
      dataRef.current.internal_errors.push({ ts: nowISO(), message: `LS save failed: ${e.message}` });
    }
  };

  // Periodic flush
  useEffect(() => {
    const id = setInterval(() => {
      flushToLocalStorage();
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Idle detection handlers
  useEffect(() => {
    const onActivity = () => {
      const now = nowMS();
      // If we were idle, close idle period
      if (idleState.current.idleStart) {
        const start = idleState.current.idleStart;
        const end = now;
        safePush(dataRef.current.idle_periods, { start: new Date(start).toISOString(), end: new Date(end).toISOString(), duration_ms: end - start });
        idleState.current.idleStart = null;
      }
      idleState.current.lastActivity = now;
    };

    const onTick = () => {
      const now = nowMS();
      if (!idleState.current.idleStart && now - idleState.current.lastActivity > 3000) {
        idleState.current.idleStart = idleState.current.lastActivity + 3000;
      }
    };

    window.addEventListener('mousemove', onActivity);
    window.addEventListener('mousedown', onActivity);
    window.addEventListener('keydown', onActivity);
    const tick = setInterval(onTick, 1000);
    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('mousedown', onActivity);
      window.removeEventListener('keydown', onActivity);
      clearInterval(tick);
    };
  }, []);

  // Mouse sampling
  const startSampling = (area = 'global') => {
    sampling.current.currentArea = area;
    sampling.current.samples = [];
    if (sampling.current.timerId) return;
    const handler = (e) => {
      sampling.current.samples.push({ x: e.clientX, y: e.clientY, t: nowMS() });
    };
    window.addEventListener('mousemove', handler);
    sampling.current.handler = handler;
    sampling.current.timerId = true; // mark active
  };

  const stopSamplingAndCompute = (area) => {
    try {
      if (!sampling.current.handler) return 0;
      window.removeEventListener('mousemove', sampling.current.handler);
      const samples = sampling.current.samples || [];
      // simple grid binning 10x10
      const bins = {};
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      samples.forEach(s => { if (s.x < minX) minX = s.x; if (s.y < minY) minY = s.y; if (s.x > maxX) maxX = s.x; if (s.y > maxY) maxY = s.y; });
      const w = Math.max(1, maxX - minX);
      const h = Math.max(1, maxY - minY);
      const gx = 10, gy = 10;
      samples.forEach(s => {
        const ix = Math.min(gx - 1, Math.floor(((s.x - minX) / w) * gx));
        const iy = Math.min(gy - 1, Math.floor(((s.y - minY) / h) * gy));
        const key = `${ix},${iy}`;
        bins[key] = (bins[key] || 0) + 1;
      });
      const total = samples.length || 1;
      let entropy = 0;
      Object.values(bins).forEach(count => {
        const p = count / total;
        entropy -= p * Math.log2(p);
      });
  sampling.current.samples = [];
      sampling.current.handler = null;
      sampling.current.timerId = null;
      sampling.current.currentArea = null;
      return entropy;
    } catch (e) {
      dataRef.current.internal_errors.push({ ts: nowISO(), message: `entropy failed ${e.message}` });
      return 0;
    }
  };

  // Exposed mouse entropy controls
  const startMouseEntropy = (area = 'meetings') => {
    try {
      startSampling(area);
    } catch (e) {
      dataRef.current.internal_errors.push({ ts: nowISO(), message: `startMouseEntropy failed ${e.message}` });
    }
  };

  const stopMouseEntropy = (area = 'meetings') => {
    try {
      const entropy = stopSamplingAndCompute(area);
      if (area === 'meetings') dataRef.current.meetings.mouse_entropy = entropy;
      else if (area === 'flights') dataRef.current.flights.mouse_entropy = entropy;
      else if (area === 'hotels') dataRef.current.hotels.mouse_entropy = entropy;
      else if (area === 'transportation') dataRef.current.transportation.mouse_entropy = entropy;
      return entropy;
    } catch (e) {
      dataRef.current.internal_errors.push({ ts: nowISO(), message: `stopMouseEntropy failed ${e.message}` });
      return 0;
    }
  };

  // Hover logging
  const logHoverStart = (category, id, name) => {
    try {
      const key = `${category}_${id}`;
      hoverTimers.current[key] = { start: nowMS(), id, name };
      // Start sampling for this area
      startSampling(category);
      dataRef.current.total_actions += 0; // no-op but touch
    } catch (e) {
      dataRef.current.internal_errors.push({ ts: nowISO(), message: `hoverStart failed ${e.message}` });
    }
  };

  const logHoverEnd = (category, id, name) => {
    try {
      const key = `${category}_${id}`;
      const t = hoverTimers.current[key];
      if (t && t.start) {
        const end = nowMS();
        const duration = end - t.start;
        const ev = { [category === 'flights' ? 'flight_id' : category === 'hotels' ? 'hotel_id' : 'transport_id']: id, [`${category.slice(0, -1)}_name`]: name, start_ts: new Date(t.start).toISOString(), end_ts: new Date(end).toISOString(), duration_ms: duration };
        if (category === 'flights') safePush(dataRef.current.flights.hover_events, ev);
        else if (category === 'hotels') safePush(dataRef.current.hotels.hover_events, ev);
        else if (category === 'transportation') safePush(dataRef.current.transportation.hover_events, ev);
      }
      // Compute entropy for this area and store
      const entropy = stopSamplingAndCompute(category);
      if (category === 'flights') dataRef.current.flights.mouse_entropy = entropy;
      else if (category === 'hotels') dataRef.current.hotels.mouse_entropy = entropy;
      else if (category === 'transportation') dataRef.current.transportation.mouse_entropy = entropy;
    } catch (e) {
      dataRef.current.internal_errors.push({ ts: nowISO(), message: `hoverEnd failed ${e.message}` });
    }
  };

  // Selection logging
  const logFlightSelection = (flight, direction) => {
    try {
      const ts = nowISO();
      // Outbound: arrival before 15:00
      // Return: departure after or equal 12:00 AND arrival on following day (after 00:00)
      let followsRules = false;
      try {
        if (direction === 'outbound') {
          followsRules = flight.arrivalTime.getHours() < 15;
        } else {
          const depOk = flight.departureTime.getHours() >= 12;
          const arrivalNextDay = flight.arrivalTime.getDate() !== flight.departureTime.getDate() || flight.arrivalTime.getTime() > flight.departureTime.getTime();
          followsRules = depOk && arrivalNextDay;
        }
      } catch (e) {
        followsRules = false;
      }
      const obj = { ts, flight_id: flight.id, flight_name: flight.airline + ' ' + flight.id, direction, airline: flight.airline, dep_time: flight.departureTime.toISOString(), arr_time: flight.arrivalTime.toISOString(), price: flight.price, follows_rules: followsRules };
      safePush(dataRef.current.flights.selections, obj);
      bumpSelectionCounter('flights');
      registerRapidSelection('flights');
      dataRef.current.total_actions++;
      // budget update
      pushBudgetUpdate('flight', { flight_id: flight.id, price: flight.price });
    } catch (e) {
      dataRef.current.internal_errors.push({ ts: nowISO(), message: `flightSelect failed ${e.message}` });
    }
  };

  const logHotelSelection = (hotel) => {
    try {
      const ts = nowISO();
      const within5km = hotel.distance <= 5;
      const obj = { ts, hotel_id: hotel.id, hotel_name: hotel.name, stars: hotel.stars, distance_km: hotel.distance, price: hotel.totalPrice, within_5km: within5km, booked_finally: false };
      safePush(dataRef.current.hotels.selections, obj);
      bumpSelectionCounter('hotels');
      registerRapidSelection('hotels');
      dataRef.current.total_actions++;
      pushBudgetUpdate('hotel', { hotel_id: hotel.id, price: hotel.totalPrice });
    } catch (e) {
      dataRef.current.internal_errors.push({ ts: nowISO(), message: `hotelSelect failed ${e.message}` });
    }
  };

  const logTransportSelection = (transport) => {
    try {
      const ts = nowISO();
      const obj = { ts, mode: transport.type, price: transport.price };
      safePush(dataRef.current.transportation.selections, obj);
      bumpSelectionCounter('transportation');
      registerRapidSelection('transportation');
      dataRef.current.total_actions++;
      pushBudgetUpdate('transport', { transport_id: transport.id, price: transport.price });
    } catch (e) {
      dataRef.current.internal_errors.push({ ts: nowISO(), message: `transportSelect failed ${e.message}` });
    }
  };

  const bumpSelectionCounter = (category) => {
    // increment selection_index on last entry
    // no-op here, selection objects will be counted by their array length
  };

  const registerRapidSelection = (category) => {
    try {
      const now = nowMS();
      if (!selectionBuffers.current[category]) selectionBuffers.current[category] = [];
      const buf = selectionBuffers.current[category];
      buf.push(now);
      // keep last 10
      if (buf.length > 10) buf.shift();
      // count how many in last 5s
      const recent = buf.filter(t => now - t <= 5000).length;
      if (recent >= 3) {
        dataRef.current.computed_signals.rapid_selection_changes++;
        // clear buffer to avoid double counting
        selectionBuffers.current[category] = [];
      }
    } catch (e) {
      dataRef.current.internal_errors.push({ ts: nowISO(), message: `rapidSelect failed ${e.message}` });
    }
  };

  // Meeting drag attempts
  const logMeetingDragStart = (meetingId) => {
    try {
      const ts = nowISO();
      // Start a new drag attempt entry in meetings.drag_attempts if not exists for this meeting in-progress
      const existing = dataRef.current.meetings.drag_attempts.find(a => a.meeting_id === meetingId && !a.placed);
      if (!existing) {
        dataRef.current.meetings.drag_attempts.push({ meeting_id: meetingId, attempts: [{ start_ts: ts }], placement_duration_ms: null, final_slot: null });
      } else {
        existing.attempts.push({ start_ts: ts });
      }
      dataRef.current.total_actions++;
    } catch (e) {
      dataRef.current.internal_errors.push({ ts: nowISO(), message: `meetingDragStart failed ${e.message}` });
    }
  };

  const logMeetingDropAttempt = (meetingId, day, hour, valid, reason = null) => {
    try {
      const ts = nowISO();
      const entry = dataRef.current.meetings.drag_attempts.find(a => a.meeting_id === meetingId && !a.placed);
      if (entry) {
        entry.attempts.push({ start_ts: entry.attempts[0]?.start_ts || ts, attempted_slot: `${day} ${hour}:00`, valid, reason, duration_ms: nowMS() - new Date(entry.attempts[0]?.start_ts || ts).getTime() });
        if (valid) {
          entry.placed = true;
          entry.placement_duration_ms = nowMS() - new Date(entry.attempts[0].start_ts).getTime();
          entry.final_slot = `${day} ${hour}:00`;
        }
      } else {
        // If no start recorded, push a quick attempt
        dataRef.current.meetings.drag_attempts.push({ meeting_id: meetingId, attempts: [{ start_ts: ts, attempted_slot: `${day} ${hour}:00`, valid, reason, duration_ms: 0 }], placement_duration_ms: valid ? 0 : null, final_slot: valid ? `${day} ${hour}:00` : null, placed: !!valid });
      }
      dataRef.current.total_actions++;
    } catch (e) {
      dataRef.current.internal_errors.push({ ts: nowISO(), message: `meetingDropAttempt failed ${e.message}` });
    }
  };

  const pushBudgetUpdate = (cause, detail) => {
    try {
      const ts = nowISO();
      const prevTotal = dataRef.current.budget.current_total || (dataRef.current.budget.updates.length ? dataRef.current.budget.updates[dataRef.current.budget.updates.length - 1].new_total : null) || 0;
      // Infer new total if not explicitly provided but a price is given (e.g., selection)
      let inferredNewTotal = null;
      if (detail && typeof detail.new_total === 'number') inferredNewTotal = detail.new_total;
      else if (detail && typeof detail.price === 'number') inferredNewTotal = prevTotal + detail.price;
      // Record update with the inferred total so downstream viewers can inspect
      safePush(dataRef.current.budget.updates, { ts, new_total: inferredNewTotal, cause, detail });

      if (inferredNewTotal !== null) {
        // If we transition into overrun state (total > 1380), start counting selections until resolved
        if (!dataRef.current.budget.in_overrun && inferredNewTotal > 1380) {
          dataRef.current.budget.budget_overrun_events++;
          dataRef.current.budget.in_overrun = true;
          dataRef.current.budget.overrun_selection_counter = 0;
        }

        // If we're currently in overrun, count selection attempts (only for selection-causes)
        if (dataRef.current.budget.in_overrun) {
          if (cause === 'flight' || cause === 'hotel' || cause === 'transport') {
            dataRef.current.budget.overrun_selection_counter++;
          }
          // If the new total brings us back within budget, finalize the cost_adjustment_actions
          if (inferredNewTotal <= 1380) {
            dataRef.current.budget.cost_adjustment_actions += dataRef.current.budget.overrun_selection_counter || 0;
            dataRef.current.budget.in_overrun = false;
            dataRef.current.budget.overrun_selection_counter = 0;
          }
        } else {
          // If not in overrun, detect simple cost adjustment where user reduces total (not part of overrun flow)
          if (inferredNewTotal < prevTotal) {
            dataRef.current.budget.cost_adjustment_actions++;
          }
        }

        dataRef.current.budget.current_total = inferredNewTotal;
      }

      dataRef.current.last_saved_ts = ts;
    } catch (e) {
      dataRef.current.internal_errors.push({ ts: nowISO(), message: `budgetUpdate failed ${e.message}` });
    }
  };

  const incrementError = () => { dataRef.current.error_count++; };

  const componentSwitch = (tab) => { safePush(dataRef.current.component_switches, { tab, ts: nowISO() }); };

  const finalizeAndSave = (success) => {
    try {
      markEnd(success);
      // compute some summaries: fill budget.current_total if possible
      // try to derive current total from last budget.update entries
      const lastUpdate = dataRef.current.budget.updates[dataRef.current.budget.updates.length - 1];
      if (lastUpdate && lastUpdate.new_total !== null) dataRef.current.budget.current_total = lastUpdate.new_total;
      dataRef.current.completed = !!success;
      flushToLocalStorage();
    } catch (e) {
      dataRef.current.internal_errors.push({ ts: nowISO(), message: `finalize failed ${e.message}` });
    }
  };

  return {
    markStart,
    markEnd,
    flushToLocalStorage,
    logHoverStart,
    logHoverEnd,
    logFlightSelection,
    logHotelSelection,
    logTransportSelection,
    logMeetingDragStart,
    logMeetingDropAttempt,
    startMouseEntropy,
    stopMouseEntropy,
    pushBudgetUpdate,
    incrementError,
    componentSwitch,
    finalizeAndSave,
    data: dataRef.current
  };
};

export default useTask3Logger;
