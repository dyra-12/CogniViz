import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useTaskProgress } from '../contexts/TaskProgressContext';
import useLogger from '../hooks/useLogger';
import useTask3Logger from '../hooks/useTask3Logger';
import { generateFlights, filterFlights } from '../data/flightService';
import { generateHotels } from '../data/hotelService';
import { generateTransportOptions } from '../data/transportService';
import { meetings as initialMeetings } from '../data/meetingService';
import FlightBooking from '../components/travel/FlightBooking';
import HotelBooking from '../components/travel/HotelBooking';
import MeetingScheduler from '../components/travel/MeetingScheduler';
import BudgetSummary from '../components/travel/BudgetSummary';
import TransportSelection from '../components/travel/TransportSelection';
import Button from '../components/Button';
import { useCognitiveLoad } from '../contexts/CognitiveLoadContext';
import { boostSimulationActivity, setSimulationTask } from '../telemetry/wsClient';
import CognitiveLoadGauge from '../components/CognitiveLoadGauge';
import ExplanationBanner from '../components/ExplanationBanner';
import TopFactorsList from '../components/TopFactorsList';


const PageContainer = styled.div`
  padding: ${props => props.theme.spacing[6]} 0;
  max-width: 1600px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing[8]};
  color: ${props => props.theme.colors.primary};
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: ${props => props.theme.spacing[6]};
  padding: 0 ${props => props.theme.spacing[4]};
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing[6]};
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing[6]};
  position: sticky;
  top: ${props => props.theme.spacing[8]};
  height: fit-content;
`;

const CompletionMessage = styled.div`
  background: ${props => props.theme.colors.success}15;
  color: ${props => props.theme.colors.success};
  padding: ${props => props.theme.spacing[4]};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.success}30;
  text-align: center;
  margin-top: ${props => props.theme.spacing[6]};
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.danger}15;
  color: ${props => props.theme.colors.danger};
  padding: ${props => props.theme.spacing[3]};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.danger}30;
  margin-bottom: ${props => props.theme.spacing[3]};
`;

const AdaptiveNotice = styled.div`
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing[4]};
  border: 1px solid ${props => props.theme.colors.gray200};
  background: ${props => props.$load === 'High'
    ? 'rgba(72,149,239,0.12)'
    : props.$load === 'Medium'
      ? 'rgba(247,127,0,0.08)'
      : 'rgba(76,201,240,0.08)'};
  margin-bottom: ${props => props.theme.spacing[5]};
`;

const NoticeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: ${props => props.theme.colors.dark};
`;

const InsightChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing[2]};
  margin-top: ${props => props.theme.spacing[3]};
`;

const InsightChip = styled.span`
  font-size: ${props => props.theme.fontSizes.sm};
  padding: ${props => props.theme.spacing[1]} ${props => props.theme.spacing[2]};
  border-radius: 999px;
  background: ${props => props.theme.colors.white};
  border: 1px solid ${props => props.theme.colors.gray300};
`;

const GuidedList = styled.ul`
  list-style: none;
  padding: 0;
  margin: ${props => props.theme.spacing[3]} 0 0;
  display: grid;
  gap: ${props => props.theme.spacing[2]};
`;

const GuidedItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.$completed ? `${props.theme.colors.success}15` : props.theme.colors.white};
  border: 1px solid ${props => props.$completed ? props.theme.colors.success : props.theme.colors.gray200};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
  font-size: ${props => props.theme.fontSizes.sm};
`;

const QuickActionButton = styled.button`
  border: none;
  background: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  margin-top: ${props => props.theme.spacing[3]};
`;

const MEDIUM_EXPLANATION = 'Moderate cognitive load detected during initial trip planning.';

const describeActiveConstraints = (conflicts = []) => {
  const map = {
    budget: 'budget overrun',
    outbound_time: 'late inbound arrival',
    return_time: 'early return departure',
    hotel_rules: 'hotel quality/distance limits',
    meeting_overlap: 'overlapping meetings',
    meeting_time_range: 'meetings outside allowed time ranges',
    meeting_wrong_day: 'meetings on blocked days',
    meeting_must_follow: 'ordering conflicts',
    meeting_must_precede: 'ordering conflicts',
  };
  const phrases = conflicts
    .map(c => map[c] || c.replace('meeting_', 'meeting constraint '))
    .filter(Boolean);
  if (phrases.length === 0) return 'active constraints';
  const unique = [...new Set(phrases)];
  return unique.slice(0, 3).join(' and ');
};

const buildHighExplanation = (conflicts, flags) => {
  const constraintText = describeActiveConstraints(conflicts);
  const pressures = [];
  if (flags.repeatedViolations) pressures.push('recurring constraint violations');
  if (flags.failedAdjustments) pressures.push('repeated placement retries');
  if (flags.dragReverts) pressures.push('repeated drag-and-drop reversions');
  if (flags.idleAfterFailure) pressures.push('idle time following failed actions');
  if (flags.slowRecovery) pressures.push('slow conflict resolution');
  const pressureText = pressures.length ? ` with ${pressures.join(' and ')}` : '';
  return `High cognitive load detected due to ${constraintText}${pressureText}.`;
};

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const Task3 = () => {
  const { completeCurrentTask } = useTaskProgress();
  const { log } = useLogger();
  const task3Logger = useTask3Logger();
  const { updateState: updateCognitiveLoad, explanation: loadExplanation } = useCognitiveLoad();

  const [loadState, setLoadState] = useState('MEDIUM');
  const loadSignalsRef = useRef({
    violationEvents: [],
    schedulingFailures: [],
    successEvents: [],
    lastViolationTs: null,
    lastFailureTs: null,
    conflictStartTs: null,
    lastResolutionTs: null,
    lastSuccessTs: null,
    successStreakStart: null,
    cumulativeConflictMs: 0,
    lastEvalTs: performance.now(),
    recoveryStableStartTs: null,
    currentLoad: 'MEDIUM'
  });
  const highLoadStartRef = useRef(null);
  const lastInteractionRef = useRef('flight');
  const [activeFlightSubtask, setActiveFlightSubtask] = useState('outbound');
  const prevSelectionsRef = useRef({
    outboundFlight: null,
    returnFlight: null,
    hotel: null,
    transport: null,
  });
  const prevBudgetRef = useRef(null);
  const lastValidationSignatureRef = useRef('');
  const [adaptiveActive, setAdaptiveActive] = useState(false);
  const [activeDomain, setActiveDomain] = useState(null);
  const [meetingConflictDetails, setMeetingConflictDetails] = useState({
    conflictsByMeeting: {},
    conflictSlots: [],
    focusedDays: [],
  });
  const [costDeltas, setCostDeltas] = useState({
    outboundFlight: 0,
    returnFlight: 0,
    hotel: 0,
    transport: 0,
  });
  
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [transportOptions, setTransportOptions] = useState([]);
  const [meetings, setMeetings] = useState(initialMeetings);
  
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState(null);
  const [selectedReturnFlight, setSelectedReturnFlight] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState(null);
  
  const [validationErrors, setValidationErrors] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const totalCost = (selectedOutboundFlight?.price || 0) + 
                   (selectedReturnFlight?.price || 0) + 
                   (selectedHotel?.totalPrice || 0) + 
                   (selectedTransport?.price || 0);

  const remainingBudget = 1380 - totalCost; // Changed to $1,380

  const costForSelection = useCallback((key, selection) => {
    if (!selection) return 0;
    if (key === 'hotel') return selection.totalPrice || 0;
    return selection.price || 0;
  }, []);

  const computeMeetingConflicts = useCallback(() => {
    const conflicts = [];
    meetings.forEach((meeting) => {
      if (!meeting.scheduled) return;
      if (meeting.constraints.allowedDays && !meeting.constraints.allowedDays.includes(meeting.day)) {
        conflicts.push('wrong_day');
      }
      if (meeting.startTime < meeting.constraints.timeRange.start || meeting.startTime + meeting.duration > meeting.constraints.timeRange.end) {
        conflicts.push('time_range');
      }
      if (meeting.constraints.mustFollow) {
        const followed = meetings.find(m => m.id === meeting.constraints.mustFollow);
        if (followed && followed.scheduled) {
          const invalidOrder = meeting.day < followed.day || (meeting.day === followed.day && meeting.startTime <= followed.startTime + followed.duration);
          if (invalidOrder) conflicts.push('must_follow');
        }
      }
      if (meeting.constraints.mustPrecede) {
        const preceded = meetings.find(m => m.id === meeting.constraints.mustPrecede);
        if (preceded && preceded.scheduled) {
          const invalidOrder = meeting.day > preceded.day || (meeting.day === preceded.day && meeting.startTime + meeting.duration >= preceded.startTime);
          if (invalidOrder) conflicts.push('must_precede');
        }
      }
      if (meeting.constraints.cannotOverlapWith) {
        meeting.constraints.cannotOverlapWith.forEach((otherId) => {
          const other = meetings.find(m => m.id === otherId);
          if (other && other.scheduled && other.day === meeting.day) {
            const meetingEnd = meeting.startTime + meeting.duration;
            const otherEnd = other.startTime + other.duration;
            if (!(meetingEnd <= other.startTime || meeting.startTime >= otherEnd)) {
              conflicts.push('overlap');
            }
          }
        });
      }
    });
    return conflicts;
  }, [meetings]);

  const detailedMeetingConflicts = useMemo(() => {
    const conflictsByMeeting = {};
    const conflictSlots = [];
    const focusedDays = new Set();

    const addConflict = (meetingId, type, message, day, hour) => {
      if (!conflictsByMeeting[meetingId]) conflictsByMeeting[meetingId] = [];
      conflictsByMeeting[meetingId].push({ type, message, day, hour });
      if (typeof day === 'number') focusedDays.add(day);
      if (typeof day === 'number' && typeof hour === 'number') {
        conflictSlots.push({ day, hour, meetingId, types: [type], message });
      }
    };

    meetings.forEach((meeting) => {
      if (meeting.scheduled) {
        const start = meeting.startTime;
        const end = meeting.startTime + meeting.duration;
        if (meeting.constraints.allowedDays && !meeting.constraints.allowedDays.includes(meeting.day)) {
          addConflict(meeting.id, 'wrong_day', `${meeting.title} is on a blocked day`, meeting.day, start);
        }
        if (meeting.constraints.timeRange) {
          if (start < meeting.constraints.timeRange.start || end > meeting.constraints.timeRange.end) {
            addConflict(meeting.id, 'time_range', `${meeting.title} is outside its allowed time range`, meeting.day, start);
          }
        }
        if (meeting.constraints.mustFollow) {
          const followed = meetings.find(m => m.id === meeting.constraints.mustFollow);
          if (!followed || !followed.scheduled || meeting.day < followed.day || (meeting.day === followed.day && start <= followed.startTime + followed.duration)) {
            addConflict(meeting.id, 'must_follow', `${meeting.title} must be after ${followed?.title || 'its prerequisite'}`, meeting.day, start);
          }
        }
        if (meeting.constraints.mustPrecede) {
          const preceded = meetings.find(m => m.id === meeting.constraints.mustPrecede);
          if (preceded && preceded.scheduled && (meeting.day > preceded.day || (meeting.day === preceded.day && end >= preceded.startTime))) {
            addConflict(meeting.id, 'must_precede', `${meeting.title} must come before ${preceded.title}`, meeting.day, start);
          }
        }
        if (meeting.constraints.cannotOverlapWith) {
          meeting.constraints.cannotOverlapWith.forEach(otherId => {
            const other = meetings.find(m => m.id === otherId);
            if (other && other.scheduled && other.day === meeting.day) {
              const otherEnd = other.startTime + other.duration;
              if (!(end <= other.startTime || start >= otherEnd)) {
                addConflict(meeting.id, 'overlap', `${meeting.title} overlaps with ${other.title}`, meeting.day, start);
              }
            }
          });
        }
      } else {
        if (meeting.constraints.mustFollow) {
          addConflict(meeting.id, 'unscheduled_dependency', `${meeting.title} depends on another meeting first`);
        }
        if (meeting.constraints.mustPrecede) {
          addConflict(meeting.id, 'unscheduled_dependency', `${meeting.title} needs placement before ${meeting.constraints.mustPrecede}`);
        }
      }
    });

    return {
      conflictsByMeeting,
      conflictSlots,
      focusedDays: Array.from(focusedDays)
    };
  }, [meetings]);

  const computeActiveConflicts = useCallback(() => {
    const conflicts = [];
    if (remainingBudget < 0) conflicts.push('budget');
    if (selectedOutboundFlight && selectedOutboundFlight.arrivalTime.getHours() >= 15) conflicts.push('outbound_time');
    if (selectedReturnFlight) {
      const arrivesNextDay = selectedReturnFlight.arrivalTime.getDate() !== selectedReturnFlight.departureTime.getDate();
      const arrivalHour = selectedReturnFlight.arrivalTime.getHours();
      const arrivalInWindow = arrivalHour >= 0 && arrivalHour < 12;
      if (!arrivesNextDay || !arrivalInWindow) conflicts.push('return_time');
    }
    if (selectedHotel && (selectedHotel.distance > 5 || selectedHotel.stars < 3)) conflicts.push('hotel_rules');
    const meetingConflicts = computeMeetingConflicts();
    if (meetingConflicts.length) {
      meetingConflicts.forEach(tag => conflicts.push(`meeting_${tag}`));
    }
    return conflicts;
  }, [computeMeetingConflicts, remainingBudget, selectedHotel, selectedOutboundFlight, selectedReturnFlight]);

  const activeConflicts = useMemo(() => computeActiveConflicts(), [computeActiveConflicts]);

  const pushLoadToContext = useCallback((level, metrics, explanation, topFactorsOverride) => {
    const upScore = (v) => clamp01(0.5 + 0.5 * clamp01(v));
    const downScore = (v) => clamp01(0.49 * (1 - clamp01(v)));
    const topFactors = topFactorsOverride || (level === 'HIGH'
      ? ['Constraint Violations', 'Failed Adjustments', 'Recovery Drag', 'Post-Failure Stall']
      : ['Planning Activity', 'Constraint Awareness']);
    const metricsPayload = level === 'HIGH'
      ? {
          'Constraint Violations': upScore(metrics.violationPressure),
          'Failed Adjustments': upScore(metrics.schedulingPressure),
          'Recovery Drag': upScore(metrics.recoveryLag || metrics.resolutionEffort),
          'Post-Failure Stall': upScore(metrics.idleStall || 0),
        }
      : {
          'Planning Activity': metrics.planningActivity,
          'Constraint Awareness': metrics.constraintAwareness,
        };

    updateCognitiveLoad({
      loadLevel: level,
      metrics: metricsPayload,
      topFactors,
      explanation: explanation || (level === 'HIGH' ? buildHighExplanation([], {}) : MEDIUM_EXPLANATION),
    });
  }, [updateCognitiveLoad]);

  const evaluateLoadFromSignals = useCallback((source = 'tick') => {
    const now = performance.now();
    const signals = loadSignalsRef.current;
    const windowMs = 30000;

    signals.violationEvents = signals.violationEvents.filter(ev => now - ev.ts <= windowMs);
    signals.schedulingFailures = signals.schedulingFailures.filter(ev => now - ev.ts <= windowMs);
    signals.successEvents = signals.successEvents.filter(ev => now - ev.ts <= windowMs);

    const activeConflicts = computeActiveConflicts();
    const hasConflicts = activeConflicts.length > 0;

    const delta = now - (signals.lastEvalTs || now);
    signals.lastEvalTs = now;
    if (hasConflicts) {
      signals.cumulativeConflictMs += delta;
      if (!signals.conflictStartTs) signals.conflictStartTs = now;
      signals.successStreakStart = null;
    } else if (signals.conflictStartTs) {
      signals.lastResolutionTs = now;
      signals.conflictStartTs = null;
    }

    const violationsCount = signals.violationEvents.length;
    const schedulingFailuresCount = signals.schedulingFailures.length;
    const recoveryMs = signals.conflictStartTs ? now - signals.conflictStartTs : 0;

    const stableNoFailures = !hasConflicts && violationsCount === 0 && schedulingFailuresCount === 0;
    if (!stableNoFailures) {
      signals.recoveryStableStartTs = null;
    } else if (!signals.recoveryStableStartTs) {
      signals.recoveryStableStartTs = now;
    }

    const repeatedViolations = violationsCount >= 2;
    const failedAdjustments = schedulingFailuresCount >= 2;
    const dragReverts = schedulingFailuresCount >= 3;
    const slowRecovery = recoveryMs > 8000 || signals.cumulativeConflictMs > 18000;
    const idleAfterFailure = hasConflicts && signals.lastViolationTs && (!signals.lastSuccessTs || signals.lastSuccessTs < signals.lastViolationTs) && (now - signals.lastViolationTs > 8000);
    const constraintPressure = hasConflicts || repeatedViolations || failedAdjustments;

    const successesAfterLastViolation = signals.successEvents.filter(ev => !signals.lastViolationTs || ev.ts > signals.lastViolationTs);
    let nextLoad = signals.currentLoad || 'MEDIUM';

    if (nextLoad === 'HIGH') {
      const noNewViolations = !signals.lastViolationTs || (signals.recoveryStableStartTs && signals.lastViolationTs < signals.recoveryStableStartTs);
      const noNewFailures = !signals.lastFailureTs || (signals.recoveryStableStartTs && signals.lastFailureTs < signals.recoveryStableStartTs);
      const stabilizationWindowMs = 5000;
      const stableWindowMet = stableNoFailures && signals.recoveryStableStartTs && (now - signals.recoveryStableStartTs >= stabilizationWindowMs) && noNewViolations && noNewFailures;
      nextLoad = stableWindowMet ? 'MEDIUM' : 'HIGH';
    } else {
      const shouldHigh = constraintPressure && (
        (hasConflicts && (repeatedViolations || failedAdjustments || dragReverts || slowRecovery || idleAfterFailure)) ||
        (repeatedViolations && failedAdjustments) ||
        dragReverts ||
        slowRecovery ||
        idleAfterFailure
      );
      nextLoad = shouldHigh ? 'HIGH' : 'MEDIUM';
    }

    signals.currentLoad = nextLoad;
    setLoadState(nextLoad);

    const metrics = {
      schedulingPressure: clamp01(schedulingFailuresCount / 3),
      violationPressure: clamp01(violationsCount / 3),
      recoveryLag: clamp01(recoveryMs / 15000),
      resolutionEffort: clamp01(signals.cumulativeConflictMs / 20000),
      planningActivity: clamp01((meetings.filter(m => m.scheduled).length + (selectedOutboundFlight ? 1 : 0) + (selectedReturnFlight ? 1 : 0) + (selectedHotel ? 1 : 0) + (selectedTransport ? 1 : 0)) / 8),
      constraintAwareness: clamp01((violationsCount + schedulingFailuresCount) / 5),
      idleStall: idleAfterFailure ? clamp01((now - (signals.lastViolationTs || now)) / 12000) : 0,
      dragReverts: clamp01(schedulingFailuresCount / 4),
      activeConflictsCount: activeConflicts.length,
      source,
    };

    const explanation = nextLoad === 'HIGH'
      ? buildHighExplanation(activeConflicts, { repeatedViolations, failedAdjustments, dragReverts, idleAfterFailure, slowRecovery })
      : MEDIUM_EXPLANATION;

    pushLoadToContext(nextLoad, metrics, explanation);
  }, [computeActiveConflicts, meetings, pushLoadToContext, selectedHotel, selectedOutboundFlight, selectedReturnFlight, selectedTransport]);

  const recordViolationEvent = useCallback((type, detail = null) => {
    const now = performance.now();
    loadSignalsRef.current.violationEvents.push({ ts: now, type, detail });
    loadSignalsRef.current.lastViolationTs = now;
    loadSignalsRef.current.lastActionTs = now;
    loadSignalsRef.current.successStreakStart = null;
    evaluateLoadFromSignals('violation');
  }, [evaluateLoadFromSignals]);

  const recordSchedulingFailure = useCallback((reason) => {
    const now = performance.now();
    loadSignalsRef.current.schedulingFailures.push({ ts: now, reason });
    loadSignalsRef.current.lastFailureTs = now;
    recordViolationEvent('scheduling_failure', reason);
  }, [recordViolationEvent]);

  const recordSuccessAction = useCallback(() => {
    const now = performance.now();
    loadSignalsRef.current.lastSuccessTs = now;
    loadSignalsRef.current.lastActionTs = now;
    loadSignalsRef.current.successEvents.push({ ts: now });
    const conflictFree = computeActiveConflicts().length === 0;
    if (conflictFree && !loadSignalsRef.current.successStreakStart) {
      loadSignalsRef.current.successStreakStart = now;
    }
    if (conflictFree && !loadSignalsRef.current.recoveryStableStartTs) {
      loadSignalsRef.current.recoveryStableStartTs = now;
    }
    evaluateLoadFromSignals('success');
  }, [computeActiveConflicts, evaluateLoadFromSignals]);

  const updateCostTracking = useCallback((key, nextSelection) => {
    const prevSelection = prevSelectionsRef.current[key];
    const delta = costForSelection(key, nextSelection) - costForSelection(key, prevSelection);
    if (delta !== 0) {
      setCostDeltas(prev => ({ ...prev, [key]: delta }));
    }
    prevSelectionsRef.current[key] = nextSelection || null;
  }, [costForSelection]);

  useEffect(() => {
    setFlights(generateFlights());
    setHotels(generateHotels());
    setTransportOptions(generateTransportOptions());
    
    log('travel_dashboard_view');
    // Mark task start for metrics collection
    try {
      task3Logger.markStart();
      // expose for debugging in browser console
      if (typeof window !== 'undefined') window.__task3Logger = task3Logger;
    } catch (e) {
      // swallow - telemetry hook should not break UI
      console.warn('task3 logger start failed', e);
    }
  }, [log]);

  useEffect(() => {
    setSimulationTask(3);
  }, []);

  useEffect(() => {
    setMeetingConflictDetails(detailedMeetingConflicts);
  }, [detailedMeetingConflicts]);

  useEffect(() => {
    if (prevBudgetRef.current === null) {
      prevBudgetRef.current = remainingBudget;
    }
  }, [remainingBudget]);

  useEffect(() => {
    if (prevBudgetRef.current === null) return;
    if (remainingBudget < 0 && prevBudgetRef.current >= 0) {
      recordViolationEvent('budget_overrun', { remainingBudget });
    }
    if (remainingBudget >= 0 && prevBudgetRef.current < 0) {
      loadSignalsRef.current.lastResolutionTs = performance.now();
    }
    prevBudgetRef.current = remainingBudget;
    evaluateLoadFromSignals('budget_change');
  }, [evaluateLoadFromSignals, recordViolationEvent, remainingBudget]);

  useEffect(() => {
    evaluateLoadFromSignals('init');
    const intervalId = setInterval(() => evaluateLoadFromSignals('interval'), 1000);
    return () => clearInterval(intervalId);
  }, [evaluateLoadFromSignals]);

  useEffect(() => {
    if (loadState === 'HIGH') {
      if (!highLoadStartRef.current) highLoadStartRef.current = performance.now();
      const timer = setTimeout(() => {
        if (loadState === 'HIGH' && highLoadStartRef.current && (performance.now() - highLoadStartRef.current) >= 2000) {
          setAdaptiveActive(true);
        }
      }, 2100);
      return () => clearTimeout(timer);
    }
    highLoadStartRef.current = null;
    setAdaptiveActive(false);
  }, [loadState]);

  useEffect(() => {
    if (loadState !== 'HIGH') {
      setAdaptiveActive(false);
    }
  }, [loadState]);

  useEffect(() => {
    evaluateLoadFromSignals('state_change');
  }, [evaluateLoadFromSignals, meetings, selectedHotel, selectedOutboundFlight, selectedReturnFlight, selectedTransport]);

  useEffect(() => {
    if (!adaptiveActive) {
      setActiveDomain(null);
      return;
    }
    let domain = lastInteractionRef.current || 'flight';
    if (domain === 'flight') {
      domain = 'flight';
    } else if (activeConflicts.some(c => c.startsWith('meeting_'))) {
      domain = 'meeting';
    } else if (activeConflicts.includes('budget') || remainingBudget < 0) {
      domain = 'budget';
    }
    setActiveDomain(domain);
  }, [activeConflicts, adaptiveActive, remainingBudget]);

  const handleOutboundFlightSelect = (flight) => {
    lastInteractionRef.current = 'flight';
    setActiveFlightSubtask('outbound');
    updateCostTracking('outboundFlight', flight);
    setSelectedOutboundFlight(flight);
    log('outbound_flight_selected', {
      airline: flight.airline,
      price: flight.price,
      arrivalTime: flight.arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    });
    boostSimulationActivity(0.25);
    try { task3Logger.logFlightSelection(flight, 'outbound'); } catch (e) { /* ignore */ }
    if (flight.arrivalTime.getHours() >= 15) {
      recordViolationEvent('flight_constraint', 'outbound_arrival_after_15');
    } else {
      recordSuccessAction();
    }
  };

  const handleReturnFlightSelect = (flight) => {
    lastInteractionRef.current = 'flight';
    setActiveFlightSubtask('return');
    updateCostTracking('returnFlight', flight);
    setSelectedReturnFlight(flight);
    log('return_flight_selected', {
      airline: flight.airline,
      price: flight.price,
      departureTime: flight.departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    });
    try { task3Logger.logFlightSelection(flight, 'return'); } catch (e) { /* ignore */ }
    boostSimulationActivity(0.25);
    const arrivesNextDay = flight.arrivalTime.getDate() !== flight.departureTime.getDate();
    const arrivalHour = flight.arrivalTime.getHours();
    const arrivalInWindow = arrivalHour >= 0 && arrivalHour < 12;
    if (!arrivesNextDay || !arrivalInWindow) {
      recordViolationEvent('flight_constraint', 'return_arrival_not_next_day_morning');
    } else {
      recordSuccessAction();
    }
  };

  const handleHotelSelect = (hotel) => {
    lastInteractionRef.current = 'budget';
    updateCostTracking('hotel', hotel);
    setSelectedHotel(hotel);
    log('hotel_selected', {
      name: hotel.name,
      price: hotel.totalPrice,
      distance: hotel.distance
    });
    try { task3Logger.logHotelSelection(hotel); } catch (e) { /* ignore */ }
    boostSimulationActivity(0.3);
    if (hotel.distance > 5 || hotel.stars < 3) {
      recordViolationEvent('hotel_constraint', hotel.distance > 5 ? 'distance_over_5km' : 'under_3_stars');
    } else {
      recordSuccessAction();
    }
  };

  const handleTransportSelect = (transport) => {
    lastInteractionRef.current = 'budget';
    updateCostTracking('transport', transport);
    setSelectedTransport(transport);
    log('transport_selected', {
      type: transport.type,
      price: transport.price
    });
    try { task3Logger.logTransportSelection(transport); } catch (e) { /* ignore */ }
    boostSimulationActivity(0.2);
    recordSuccessAction();
  };

  // Hover handlers for flights/hotels/transport
  const handleFlightHoverStart = (flight) => {
    try { task3Logger.logHoverStart('flights', flight.id, `${flight.airline} ${flight.id}`); } catch (e) { /* ignore */ }
  };
  const handleFlightHoverEnd = (flight) => {
    try { task3Logger.logHoverEnd('flights', flight.id, `${flight.airline} ${flight.id}`); } catch (e) { /* ignore */ }
  };

  const handleHotelHoverStart = (hotel) => {
    try { task3Logger.logHoverStart('hotels', hotel.id, hotel.name); } catch (e) { /* ignore */ }
  };
  const handleHotelHoverEnd = (hotel) => {
    try { task3Logger.logHoverEnd('hotels', hotel.id, hotel.name); } catch (e) { /* ignore */ }
  };

  const handleTransportHoverStart = (opt) => {
    try { task3Logger.logHoverStart('transportation', opt.id, opt.type); } catch (e) { /* ignore */ }
  };
  const handleTransportHoverEnd = (opt) => {
    try { task3Logger.logHoverEnd('transportation', opt.id, opt.type); } catch (e) { /* ignore */ }
  };

  const handleComponentEnter = (name) => {
    const lowerName = (name || '').toLowerCase();
    // Hover/focus only for analytics; do not change active segment/domain for adaptation
    try { task3Logger.componentSwitch(name); } catch (e) { /* ignore */ }
    // Start/stop mouse entropy sampling per-area when switching components
    try {
      const mapNameToArea = (n) => {
        if (!n) return null;
        const lower = n.toLowerCase();
        if (lower.includes('flight')) return 'flights';
        if (lower.includes('hotel')) return 'hotels';
        if (lower.includes('transport')) return 'transportation';
        if (lower.includes('meeting')) return 'meetings';
        if (lower.includes('meetings')) return 'meetings';
        return null;
      };
      const area = mapNameToArea(name);
      const prev = handleComponentEnter._prevArea;
      const prevArea = prev || null;
      if (prevArea && prevArea !== area) {
        try { task3Logger.stopMouseEntropy(prevArea); } catch (e) { /* ignore */ }
      }
      if (area) {
        try { task3Logger.startMouseEntropy(area); } catch (e) { /* ignore */ }
      }
      handleComponentEnter._prevArea = area;
    } catch (e) { /* ignore */ }
  };

  // Meeting drag/drop instrumentation: drag start -> log; drop -> validate, log attempts
  const handleMeetingDragStart = (meetingId) => {
    try { task3Logger.logMeetingDragStart(meetingId); } catch (e) { /* ignore */ }
    boostSimulationActivity(0.15);
  };

  const validateSingleMeetingPlacement = (meeting, day, hour, currentMeetings) => {
    if (!meeting) return { valid: false, reason: 'unknown_meeting' };
    // Allowed days
    if (meeting.constraints.allowedDays && !meeting.constraints.allowedDays.includes(day)) {
      return { valid: false, reason: 'wrong_day' };
    }
    // Time range
    if (meeting.constraints.timeRange) {
      if (hour < meeting.constraints.timeRange.start || (hour + meeting.duration) > meeting.constraints.timeRange.end) {
        return { valid: false, reason: 'time_conflict' };
      }
    }
    // mustFollow
    if (meeting.constraints.mustFollow) {
      const followed = currentMeetings.find(m => m.id === meeting.constraints.mustFollow);
      if (followed && followed.scheduled) {
        if (day < followed.day || (day === followed.day && hour <= followed.startTime + followed.duration)) {
          return { valid: false, reason: 'must_follow' };
        }
      }
    }
    // mustPrecede
    if (meeting.constraints.mustPrecede) {
      const preceded = currentMeetings.find(m => m.id === meeting.constraints.mustPrecede);
      if (preceded && preceded.scheduled) {
        if (day > preceded.day || (day === preceded.day && (hour + meeting.duration) >= preceded.startTime)) {
          return { valid: false, reason: 'must_precede' };
        }
      }
    }
    // cannot overlap
    if (meeting.constraints.cannotOverlapWith) {
      for (const otherId of meeting.constraints.cannotOverlapWith) {
        const other = currentMeetings.find(m => m.id === otherId);
        if (other && other.scheduled && other.day === day) {
          const meetingEnd = hour + meeting.duration;
          const otherEnd = other.startTime + other.duration;
          if (!(meetingEnd <= other.startTime || hour >= otherEnd)) {
            return { valid: false, reason: 'time_conflict' };
          }
        }
      }
    }
    return { valid: true, reason: null };
  };

  const handleMeetingDropAttempt = (meetingId, day, hour) => {
    lastInteractionRef.current = 'meeting';
    const meeting = meetings.find(m => m.id === meetingId);
    const { valid, reason } = validateSingleMeetingPlacement(meeting, day, hour, meetings);
    if (valid) {
      setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, scheduled: true, day, startTime: hour } : m));
      log('meeting_scheduled', { meeting: meeting?.title, day, startTime: hour });
      try { task3Logger.logMeetingDropAttempt(meetingId, day, hour, true); } catch (e) { /* ignore */ }
      boostSimulationActivity(0.25);
      // remove any prior validationErrors related to this meeting
      setValidationErrors(prev => prev.filter(msg => typeof msg === 'string' ? !msg.includes(meetingId) : true));
      recordSuccessAction();
    } else {
      // Log failed attempt
      log('meeting_schedule_attempt_failed', { meetingId, day, hour, reason });
      try { task3Logger.logMeetingDropAttempt(meetingId, day, hour, false, reason); } catch (e) { /* ignore */ }
      try { task3Logger.incrementError(); } catch (e) { /* ignore */ }
      // show error to user by appending to validationErrors with meeting id so we can remove later
      setValidationErrors(prev => [...prev, `Failed to place meeting ${meetingId}: ${reason}`]);
      boostSimulationActivity(0.15);
      recordSchedulingFailure(reason);
    }
  };

  const handleResetMeetings = () => {
    // Reset all meetings to unscheduled state
    setMeetings(prev => prev.map(meeting => ({
      ...meeting,
      scheduled: false,
      day: undefined,
      startTime: undefined
    })));
    // Clear any meeting-related validation errors
    setValidationErrors(prev => prev.filter(msg => typeof msg === 'string' ? !msg.includes('meeting') && !msg.includes('Meeting') : true));
    log('meetings_reset');
    boostSimulationActivity(0.1);
  };

  const validateConstraints = () => {
    const errors = [];

    // Flight validation
    if (!selectedOutboundFlight) {
      errors.push('Please select an outbound flight');
    } else if (selectedOutboundFlight.arrivalTime.getHours() >= 15) {
      errors.push('Outbound flight must arrive before 15:00');
    }

    if (!selectedReturnFlight) {
      errors.push('Please select a return flight');
    } else {
      const arrivesNextDay = selectedReturnFlight.arrivalTime.getDate() !== selectedReturnFlight.departureTime.getDate();
      const arrivalHour = selectedReturnFlight.arrivalTime.getHours();
      const arrivalInWindow = arrivalHour >= 0 && arrivalHour < 12;
      if (!arrivesNextDay || !arrivalInWindow) {
        errors.push('Return flight must arrive the next day between 00:00 and 11:00');
      }
    }

    // Hotel validation
    if (!selectedHotel) {
      errors.push('Please select a hotel');
    } else {
      if (selectedHotel.distance > 5) {
        errors.push('Hotel must be within 5km of conference center');
      }
      if (selectedHotel.stars < 3) {
        errors.push('Hotel must be 3 stars or higher');
      }
    }

    // Transport validation
    if (!selectedTransport) {
      errors.push('Please select a transportation option');
    }

    // Meeting validation
    const unscheduledMeetings = meetings.filter(m => !m.scheduled);
    if (unscheduledMeetings.length > 0) {
      errors.push(`Please schedule all meetings (${unscheduledMeetings.length} unscheduled)`);
    }

    // Budget validation
    if (remainingBudget < 0) {
      errors.push('Budget exceeded! Please choose less expensive options');
    }

    // Enhanced meeting constraints validation
    meetings.forEach(meeting => {
      if (meeting.scheduled) {
        // Check day constraints
        if (meeting.constraints.allowedDays && !meeting.constraints.allowedDays.includes(meeting.day)) {
          errors.push(`${meeting.title} must be on day ${meeting.constraints.allowedDays.join(' or ')}`);
        }
        
        // Check time constraints
        if (meeting.startTime < meeting.constraints.timeRange.start || 
            meeting.startTime + meeting.duration > meeting.constraints.timeRange.end) {
          errors.push(`${meeting.title} must be scheduled between ${meeting.constraints.timeRange.start}:00 and ${meeting.constraints.timeRange.end}:00`);
        }
        
        // Check mustFollow constraint
        if (meeting.constraints.mustFollow) {
          const followedMeeting = meetings.find(m => m.id === meeting.constraints.mustFollow);
          if (followedMeeting && followedMeeting.scheduled) {
            if (meeting.day < followedMeeting.day || 
                (meeting.day === followedMeeting.day && meeting.startTime <= followedMeeting.startTime + followedMeeting.duration)) {
              errors.push(`${meeting.title} must be scheduled after ${followedMeeting.title}`);
            }
          }
        }
        
        // Check mustPrecede constraint
        if (meeting.constraints.mustPrecede) {
          const precededMeeting = meetings.find(m => m.id === meeting.constraints.mustPrecede);
          if (precededMeeting && precededMeeting.scheduled) {
            if (meeting.day > precededMeeting.day || 
                (meeting.day === precededMeeting.day && meeting.startTime + meeting.duration >= precededMeeting.startTime)) {
              errors.push(`${meeting.title} must be scheduled before ${precededMeeting.title}`);
            }
          }
        }
        
        // Check cannotOverlapWith constraints
        if (meeting.constraints.cannotOverlapWith) {
          meeting.constraints.cannotOverlapWith.forEach(otherMeetingId => {
            const otherMeeting = meetings.find(m => m.id === otherMeetingId);
            if (otherMeeting && otherMeeting.scheduled && otherMeeting.day === meeting.day) {
              const meetingEnd = meeting.startTime + meeting.duration;
              const otherMeetingEnd = otherMeeting.startTime + otherMeeting.duration;
              
              if (!(meetingEnd <= otherMeeting.startTime || meeting.startTime >= otherMeetingEnd)) {
                errors.push(`${meeting.title} cannot overlap with ${otherMeeting.title}`);
              }
            }
          });
        }

        // Check preparation time constraint
        if (meeting.constraints.preparationTime) {
          const hasPreparationTime = checkPreparationTime(meeting);
          if (!hasPreparationTime) {
            errors.push(`${meeting.title} requires ${meeting.constraints.preparationTime}h preparation time`);
          }
        }

        // Check setup time constraint
        if (meeting.constraints.minSetupTime) {
          const hasSetupTime = checkSetupTime(meeting);
          if (!hasSetupTime) {
            errors.push(`${meeting.title} requires ${meeting.constraints.minSetupTime}h setup time`);
          }
        }
      }
    });

    setValidationErrors(errors);
    // Count each visible error as an error event
    if (errors.length > 0) {
      try {
        errors.forEach(() => task3Logger.incrementError());
      } catch (e) { /* ignore */ }
    }

    const signature = errors.join('|');
    if (errors.length > 0 && signature !== lastValidationSignatureRef.current) {
      recordViolationEvent('validation_conflict', { count: errors.length, signature });
      lastValidationSignatureRef.current = signature;
    }
    if (errors.length === 0) {
      lastValidationSignatureRef.current = '';
      recordSuccessAction();
    }

    return errors.length === 0;
  };

  const checkPreparationTime = (meeting) => {
    // Simplified check - in real implementation, would check calendar slots
    return true;
  };

  const checkSetupTime = (meeting) => {
    // Simplified check - in real implementation, would check calendar slots
    return true;
  };

  const handleFinalize = () => {
    if (validateConstraints()) {
      log('trip_finalized', {
        totalCost,
        remainingBudget,
        outboundFlight: selectedOutboundFlight,
        returnFlight: selectedReturnFlight,
        hotel: selectedHotel,
        transport: selectedTransport,
        meetings: meetings.filter(m => m.scheduled)
      });
      try { task3Logger.finalizeAndSave(true); } catch (e) { /* ignore */ }
      try {
        // Also write final payload under the required key
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('task 3', JSON.stringify({ task_3_data: task3Logger.data }));
        }
      } catch (e) { /* ignore */ }
      // stop any running sampling
      try {
        const prevArea = handleComponentEnter._prevArea;
        if (prevArea) task3Logger.stopMouseEntropy(prevArea);
      } catch (e) { /* ignore */ }
      boostSimulationActivity(0.4);
      setIsCompleted(true);
    } else {
      log('trip_finalize_failed', { errors: validationErrors });
      try { task3Logger.finalizeAndSave(false); } catch (e) { /* ignore */ }
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('task 3', JSON.stringify({ task_3_data: task3Logger.data }));
        }
      } catch (e) { /* ignore */ }
      // stop any running sampling
      try {
        const prevArea = handleComponentEnter._prevArea;
        if (prevArea) task3Logger.stopMouseEntropy(prevArea);
      } catch (e) { /* ignore */ }
      boostSimulationActivity(0.25);
    }
  };

  const handleComplete = () => {
    boostSimulationActivity(0.4);
    completeCurrentTask();
  };

  const guidedSteps = useMemo(() => ([
    {
      id: 'flights',
      label: 'Select both flights (arrive < 15:00, depart > 12:00)',
      completed: !!selectedOutboundFlight && !!selectedReturnFlight
    },
    {
      id: 'hotel',
      label: 'Hotel within 5km and ≥3★',
      completed: !!selectedHotel && selectedHotel.distance <= 5 && selectedHotel.stars >= 3
    },
    {
      id: 'transport',
      label: 'Ground transport chosen',
      completed: !!selectedTransport
    },
    {
      id: 'meetings',
      label: 'All meetings scheduled',
      completed: meetings.every(m => m.scheduled)
    },
    {
      id: 'budget',
      label: 'Stay within $1,380 budget',
      completed: remainingBudget >= 0
    }
  ]), [selectedOutboundFlight, selectedReturnFlight, selectedHotel, selectedTransport, meetings, remainingBudget]);

  const flightConstraintLabels = useMemo(() => {
    const labels = {};
    flights.forEach((flight) => {
      const flightLabels = [];
      if (flight.type === 'outbound' && flight.arrivalTime.getHours() >= 15) {
        flightLabels.push('Arrives after 15:00 requirement');
      }
      if (flight.type === 'return') {
        const arrivesNextDay = flight.arrivalTime.getDate() !== flight.departureTime.getDate();
        const arrivalHour = flight.arrivalTime.getHours();
        const arrivalInWindow = arrivalHour >= 0 && arrivalHour < 12;
        if (!arrivesNextDay || !arrivalInWindow) {
          flightLabels.push('Does not arrive next day (00:00-11:00)');
        }
      }
      if (flightLabels.length > 0) {
        labels[flight.id] = flightLabels;
      }
    });
    return labels;
  }, [flights]);

  const outboundConstraintLabels = useMemo(() => {
    const labels = {};
    Object.entries(flightConstraintLabels).forEach(([id, l]) => {
      if (id.startsWith('out_')) labels[id] = l;
    });
    return labels;
  }, [flightConstraintLabels]);

  const returnConstraintLabels = useMemo(() => {
    const labels = {};
    Object.entries(flightConstraintLabels).forEach(([id, l]) => {
      if (id.startsWith('in_')) labels[id] = l;
    });
    return labels;
  }, [flightConstraintLabels]);

  const primaryFlightViolation = useMemo(() => {
    if (activeFlightSubtask === 'outbound') return 'outbound_time';
    if (activeFlightSubtask === 'return') return 'return_time';
    return null;
  }, [activeFlightSubtask]);

  const flightHint = primaryFlightViolation === 'outbound_time'
    ? 'This flight arrives after your required time - earlier departures satisfy all constraints.'
    : primaryFlightViolation === 'return_time'
      ? 'This return does not arrive next day in the 00:00-11:00 window - options that do will satisfy the constraint.'
      : 'Check arrival before 15:00 and return arrival next day 00:00-11:00 to satisfy constraints.';

  const flightFocusTargets = useMemo(() => {
    if (activeFlightSubtask === 'outbound') return ['outbound'];
    if (activeFlightSubtask === 'return') return ['return'];
    return ['outbound'];
  }, [activeFlightSubtask]);

  const meetingAdaptiveActive = adaptiveActive && activeDomain === 'meeting';
  const flightAdaptiveActive = adaptiveActive && activeDomain === 'flight';
  const constraintViolationsDominant = useMemo(() => {
    const now = performance.now();
    const windowMs = 12000;
    const violations = (loadSignalsRef.current?.violationEvents || []).filter(ev => now - ev.ts <= windowMs);
    const failures = (loadSignalsRef.current?.schedulingFailures || []).filter(ev => now - ev.ts <= windowMs);
    return violations.length >= 2 && violations.length >= failures.length;
  }, [loadState]);

  const flightInterventionActive = flightAdaptiveActive && constraintViolationsDominant;
  const outboundIntervention = flightInterventionActive && primaryFlightViolation === 'outbound_time';
  const returnIntervention = flightInterventionActive && primaryFlightViolation === 'return_time';

  const outboundAdaptiveRender = flightAdaptiveActive && activeFlightSubtask === 'outbound';
  const returnAdaptiveRender = flightAdaptiveActive && activeFlightSubtask === 'return';
  const budgetAdaptiveActive = adaptiveActive && activeDomain === 'budget';

  const meetingFocusTargets = useMemo(() => {
    if (!meetingAdaptiveActive) return [];
    const targets = ['meetingSchedule'];
    (meetingConflictDetails.conflictSlots || []).forEach(slot => {
      if (Array.isArray(slot.types)) targets.push(...slot.types);
    });
    return Array.from(new Set(targets));
  }, [meetingAdaptiveActive, meetingConflictDetails]);

  const meetingAdaptiveHint = useMemo(() => {
    if (!meetingAdaptiveActive) return '';
    const firstMeetingConflicts = Object.values(meetingConflictDetails.conflictsByMeeting || {})[0];
    if (firstMeetingConflicts && firstMeetingConflicts.length > 0) {
      return firstMeetingConflicts[0].message;
    }
    if (meetingConflictDetails.focusedDays && meetingConflictDetails.focusedDays.length > 0) {
      return 'Try adjusting the highlighted day and resolve dependency cues first.';
    }
    return 'Try scheduling prerequisite meetings before placing dependents.';
  }, [meetingAdaptiveActive, meetingConflictDetails]);

  const dependencyCues = useMemo(() => {
    if (!meetingAdaptiveActive) return [];
    const cues = [];
    Object.values(meetingConflictDetails.conflictsByMeeting || {}).forEach(list => {
      list.forEach(item => {
        if (item.type === 'must_follow' || item.type === 'must_precede' || item.type === 'unscheduled_dependency') {
          cues.push(item.message);
        }
      });
    });
    return Array.from(new Set(cues)).slice(0, 3);
  }, [meetingAdaptiveActive, meetingConflictDetails]);

  const budgetParts = useMemo(() => ({
    outboundFlight: costForSelection('outboundFlight', selectedOutboundFlight),
    returnFlight: costForSelection('returnFlight', selectedReturnFlight),
    hotel: costForSelection('hotel', selectedHotel),
    transport: costForSelection('transport', selectedTransport)
  }), [costForSelection, selectedHotel, selectedOutboundFlight, selectedReturnFlight, selectedTransport]);

  const budgetEmphasizedKeys = useMemo(() => {
    if (!budgetAdaptiveActive || remainingBudget >= 0) return [];
    const positiveDeltas = Object.entries(costDeltas)
      .filter(([, delta]) => delta > 0)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .map(([key]) => key);
    if (positiveDeltas.length > 0) return positiveDeltas.slice(0, 2);
    const heaviest = Object.entries(budgetParts).sort((a, b) => b[1] - a[1]);
    return heaviest.length > 0 ? [heaviest[0][0]] : [];
  }, [budgetAdaptiveActive, budgetParts, costDeltas, remainingBudget]);

  const budgetHint = budgetAdaptiveActive && remainingBudget < 0
    ? 'Reducing hotel nights or selecting an earlier return brings you within budget.'
    : budgetAdaptiveActive
      ? 'Keep the summary pinned while you rebalance costs.'
      : '';

  const runGuidedValidation = () => {
    const success = validateConstraints();
    log('adaptive_guided_validation', { success, loadState });
  };

  const isHighLoad = loadState === 'HIGH';
  const uiLoadState = isHighLoad ? 'High' : 'Medium';
  const loadTitle = loadState === 'HIGH' ? 'Resolving constraint conflicts' : 'Coordinating trip plan';
  const loadMessage = loadState === 'HIGH'
    ? (loadExplanation && loadExplanation.toLowerCase().includes('high cognitive load')
        ? loadExplanation
        : 'High cognitive load detected while resolving constraint conflicts.')
    : MEDIUM_EXPLANATION;

  if (isCompleted) {
    return (
      <PageContainer>
        <CompletionMessage>
          <h3>✅ Trip Successfully Planned!</h3>
          <p>Your business trip to Berlin has been finalized within budget.</p>
          <p>Total Cost: ${totalCost} | Remaining Budget: ${remainingBudget}</p>
          <Button onClick={handleComplete} style={{ marginTop: '1rem' }}>
            Complete Study
          </Button>
        </CompletionMessage>
      </PageContainer>
    );
  }

  const filteredOutboundFlights = filterFlights(flights, 'outbound');
  const filteredReturnFlights = filterFlights(flights, 'return');

  const outboundAdaptiveMode = flightAdaptiveActive ? {
    domain: 'flight',
    focusTargets: flightFocusTargets,
    hint: flightHint,
    primaryViolation: primaryFlightViolation,
    lockViolations: outboundIntervention
  } : null;

  const returnAdaptiveMode = flightAdaptiveActive ? {
    domain: 'flight',
    focusTargets: flightFocusTargets,
    hint: flightHint,
    primaryViolation: primaryFlightViolation,
    lockViolations: returnIntervention
  } : null;

  const meetingAdaptiveMode = meetingAdaptiveActive ? {
    focusTargets: meetingFocusTargets,
    hint: meetingAdaptiveHint,
    collapseInactiveDays: true,
    dependencyCues,
    focusedDays: meetingConflictDetails.focusedDays
  } : null;

  return (
    <PageContainer>
      <PageTitle>Plan Your Business Trip to Berlin</PageTitle>

      <AdaptiveNotice $load={uiLoadState}>
        <NoticeHeader>
          <span>{loadTitle}</span>
          <span style={{ fontSize: '0.85rem', color: '#475569' }}>{uiLoadState}</span>
        </NoticeHeader>
        <p style={{ marginTop: '0.35rem', fontSize: '0.9rem', color: '#475569' }}>{loadMessage}</p>
        {/* insights removed due to missing cognitiveLoadHints */}
        <GuidedList>
          {guidedSteps.map(step => (
            <GuidedItem key={step.id} $completed={step.completed}>
              <span>{step.label}</span>
              <span>{step.completed ? '✓' : '•'}</span>
            </GuidedItem>
          ))}
        </GuidedList>
        <QuickActionButton type="button" onClick={runGuidedValidation}>
          Run Guided Validation
        </QuickActionButton>
      </AdaptiveNotice>

      <Layout>
        <MainContent>
          <FlightBooking
            flights={filteredOutboundFlights}
            onFlightSelect={handleOutboundFlightSelect}
            selectedFlight={selectedOutboundFlight}
            title="Outbound Flight (NY → Berlin)"
            constraint="Must arrive before 15:00 on the same day"
            onFlightHoverStart={handleFlightHoverStart}
            onFlightHoverEnd={handleFlightHoverEnd}
            onComponentEnter={handleComponentEnter}
            adaptiveMode={outboundAdaptiveRender ? outboundAdaptiveMode : null}
            constraintLabels={outboundConstraintLabels}
            deemphasizeNonViable={outboundAdaptiveRender}
            selectionLocked={outboundAdaptiveRender && outboundIntervention}
            focusKey="outbound"
          />
          
          <FlightBooking
            flights={filteredReturnFlights}
            onFlightSelect={handleReturnFlightSelect}
            selectedFlight={selectedReturnFlight}
            title="Return Flight (Berlin → NY)"
            constraint="Must arrive the next day between 00:00 and 11:00"
            onFlightHoverStart={handleFlightHoverStart}
            onFlightHoverEnd={handleFlightHoverEnd}
            onComponentEnter={handleComponentEnter}
            adaptiveMode={returnAdaptiveRender ? returnAdaptiveMode : null}
            constraintLabels={returnConstraintLabels}
            deemphasizeNonViable={returnAdaptiveRender}
            selectionLocked={returnAdaptiveRender && returnIntervention}
            focusKey="return"
          />
          
          <HotelBooking
            hotels={hotels}
            onHotelSelect={handleHotelSelect}
            selectedHotel={selectedHotel}
            onHotelHoverStart={handleHotelHoverStart}
            onHotelHoverEnd={handleHotelHoverEnd}
            onComponentEnter={handleComponentEnter}
          />
          
          <TransportSelection
            options={transportOptions}
            selectedOption={selectedTransport}
            onSelect={handleTransportSelect}
            onTransportHoverStart={handleTransportHoverStart}
            onTransportHoverEnd={handleTransportHoverEnd}
            onComponentEnter={handleComponentEnter}
          />
          
          <MeetingScheduler
            meetings={meetings}
            onMeetingDragStart={handleMeetingDragStart}
            onMeetingDropAttempt={handleMeetingDropAttempt}
            onComponentEnter={handleComponentEnter}
            onResetMeetings={handleResetMeetings}
            conflictDetails={meetingConflictDetails}
            adaptiveMode={meetingAdaptiveMode}
            highlightConflicts={meetingAdaptiveActive}
          />
        </MainContent>

        <Sidebar>
          <CognitiveLoadGauge />
          <ExplanationBanner />
          <TopFactorsList />
          
          <BudgetSummary
            flight={selectedOutboundFlight}
            returnFlight={selectedReturnFlight}
            hotel={selectedHotel}
            transport={selectedTransport}
            total={totalCost}
            remaining={remainingBudget}
            highlight={isHighLoad || remainingBudget < 0 || budgetAdaptiveActive}
            deltas={costDeltas}
            variant={budgetAdaptiveActive ? 'inline' : 'sidebar'}
            emphasizedKeys={budgetEmphasizedKeys}
            inlineHint={budgetHint}
          />
          
          <div>
            <Button 
              onClick={handleFinalize}
              style={{ width: '100%', fontSize: '1.1rem' }}
            >
              Finalize Trip
            </Button>
            {validationErrors.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h4>Issues to resolve:</h4>
                {validationErrors.map((error, index) => (
                  <ErrorMessage key={index}>
                    ⚠️ {error}
                  </ErrorMessage>
                ))}
              </div>
            )}
          </div>
        </Sidebar>
      </Layout>
    </PageContainer>
  );
};

export default Task3;