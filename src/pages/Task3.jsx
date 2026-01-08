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

const ADAPTIVE_TRIGGER_WINDOW_MS = 5000;
const ADAPTIVE_RECOVERY_MS = 5000;
const COST_DELTA_WINDOW_MS = 8000;

const determineAdaptiveDomain = (conflicts = [], lastViolationType = '') => {
  if (!Array.isArray(conflicts)) return 'general';
  if (conflicts.includes('budget') || lastViolationType === 'budget_overrun') {
    return 'budget';
  }
  if (conflicts.some(tag => tag === 'outbound_time' || tag === 'return_time') || lastViolationType === 'flight_constraint') {
    return 'flight';
  }
  if (conflicts.some(tag => tag.startsWith('meeting_')) || lastViolationType === 'scheduling_failure') {
    return 'meeting';
  }
  return 'general';
};

const defaultAdaptiveState = {
  active: false,
  domain: null,
  since: null,
  focusTargets: [],
  reasonFlags: {},
  directives: [],
};

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
    currentLoad: 'MEDIUM',
    lastViolationType: null,
    interactionSwitches: [],
    lastInteractionDomain: null,
  });
  const prevBudgetRef = useRef(null);
  const lastValidationSignatureRef = useRef('');
  const adaptiveRef = useRef({
    ...defaultAdaptiveState,
    candidateSince: null,
    pendingDomain: null,
  });
  const interactionGuardRef = useRef({ until: 0, lastDomain: null });
  const [adaptiveState, setAdaptiveState] = useState(defaultAdaptiveState);
  const [adaptiveFeedback, setAdaptiveFeedback] = useState(null);
  const [costDeltas, setCostDeltas] = useState({});
  
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [transportOptions, setTransportOptions] = useState([]);
  const [meetings, setMeetings] = useState(initialMeetings);
  const filteredOutboundFlights = useMemo(() => filterFlights(flights, 'outbound'), [flights]);
  const filteredReturnFlights = useMemo(() => filterFlights(flights, 'return'), [flights]);
  
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

  const computeActiveConflicts = useCallback(() => {
    const conflicts = [];
    if (remainingBudget < 0) conflicts.push('budget');
    if (selectedOutboundFlight && selectedOutboundFlight.arrivalTime.getHours() >= 15) conflicts.push('outbound_time');
    if (selectedReturnFlight && selectedReturnFlight.departureTime.getHours() < 12) conflicts.push('return_time');
    if (selectedHotel && (selectedHotel.distance > 5 || selectedHotel.stars < 3)) conflicts.push('hotel_rules');
    const meetingConflicts = computeMeetingConflicts();
    if (meetingConflicts.length) {
      meetingConflicts.forEach(tag => conflicts.push(`meeting_${tag}`));
    }
    return conflicts;
  }, [computeMeetingConflicts, remainingBudget, selectedHotel, selectedOutboundFlight, selectedReturnFlight]);

  const computeAdaptiveFocusTargets = useCallback((domain, conflicts) => {
    if (domain === 'flight') {
      const focus = ['flightSelection'];
      if (conflicts.includes('outbound_time')) focus.push('outboundFlight');
      if (conflicts.includes('return_time')) focus.push('returnFlight');
      return [...new Set(focus)];
    }
    if (domain === 'meeting') {
      const focus = ['meetingSchedule'];
      const meetingTags = conflicts.filter(tag => tag.startsWith('meeting_'));
      meetingTags.forEach(tag => focus.push(tag));
      return [...new Set(focus)];
    }
    if (domain === 'budget') {
      return ['budgetOverrun', 'flightSelection', 'hotelSelection', 'transportSelection'];
    }
    return [];
  }, []);

  const buildAdaptiveDirectives = useCallback((domain, conflicts, flags) => {
    if (domain === 'flight') {
      return [
        'Resolve the highlighted flight constraint before switching tasks.',
        flags.repeatedViolations ? 'Choose a flight that meets the time requirement to break the violation streak.' : 'Adjust the targeted flight until the time requirement is met.'
      ];
    }
    if (domain === 'meeting') {
      return [
        'Fix the highlighted meeting conflicts before adding new meetings.',
        flags.failedAdjustments ? 'Use the inline badges to satisfy ordering or overlap rules.' : 'Use the highlighted slots to realign meetings without overlaps.'
      ];
    }
    if (domain === 'budget') {
      return [
        'Bring spending back under budget using the pinned summary before adjusting other items.',
        flags.slowRecovery ? 'Target the largest cost contributors first to recover faster.' : 'Focus on the highlighted cost drivers to resolve the overrun.'
      ];
    }
    return ['Resolve the highlighted constraint before moving on.'];
  }, []);

  const updateAdaptiveMode = useCallback((nextLoad, activeConflicts, flags, now, signals) => {
    const candidate = adaptiveRef.current;
    const domain = determineAdaptiveDomain(activeConflicts, signals.lastViolationType);
    const triggersActive = Boolean(flags.repeatedViolations || flags.failedAdjustments || flags.slowRecovery || flags.highInteractionThrash || flags.dragReverts);

    if (nextLoad === 'HIGH' && triggersActive) {
      if (candidate.pendingDomain !== domain) {
        candidate.pendingDomain = domain;
        candidate.candidateSince = now;
      }
      if (!candidate.candidateSince) {
        candidate.candidateSince = now;
        candidate.pendingDomain = domain;
      }
      if (!candidate.active && candidate.candidateSince && (now - candidate.candidateSince >= ADAPTIVE_TRIGGER_WINDOW_MS)) {
        const focusTargets = computeAdaptiveFocusTargets(domain, activeConflicts);
        const directives = buildAdaptiveDirectives(domain, activeConflicts, flags);
        candidate.active = true;
        candidate.domain = domain;
        candidate.since = now;
        candidate.focusTargets = focusTargets;
        candidate.reasonFlags = { ...flags };
        candidate.directives = directives;
        setAdaptiveState({
          active: true,
          domain,
          since: now,
          focusTargets,
          reasonFlags: { ...flags },
          directives,
        });
        setAdaptiveFeedback(null);
      }
      if (candidate.active && candidate.domain !== domain) {
        const focusTargets = computeAdaptiveFocusTargets(domain, activeConflicts);
        const directives = buildAdaptiveDirectives(domain, activeConflicts, flags);
        candidate.domain = domain;
        candidate.focusTargets = focusTargets;
        candidate.reasonFlags = { ...flags };
        candidate.directives = directives;
        setAdaptiveState(prev => ({
          ...prev,
          domain,
          focusTargets,
          reasonFlags: { ...flags },
          directives,
        }));
      }
    } else {
      candidate.pendingDomain = null;
      candidate.candidateSince = null;
    }

    const canDeactivate = candidate.active && (
      (activeConflicts.length === 0 && signals.recoveryStableStartTs && (now - signals.recoveryStableStartTs >= ADAPTIVE_RECOVERY_MS)) ||
      nextLoad !== 'HIGH'
    );

    if (canDeactivate) {
      candidate.active = false;
      candidate.pendingDomain = null;
      candidate.candidateSince = null;
      candidate.domain = null;
      candidate.since = null;
      candidate.focusTargets = [];
      candidate.reasonFlags = {};
      candidate.directives = [];
      setAdaptiveState(defaultAdaptiveState);
      setAdaptiveFeedback(null);
    }
  }, [buildAdaptiveDirectives, computeAdaptiveFocusTargets]);

  const markInteraction = useCallback((domainKey) => {
    const now = performance.now();
    const signals = loadSignalsRef.current;
    if (!signals.interactionSwitches) {
      signals.interactionSwitches = [];
    }
    signals.interactionSwitches.push({ ts: now, domain: domainKey });
    signals.lastInteractionDomain = domainKey;
  }, []);

  const allowInteraction = useCallback((domainKey, focusKey = null) => {
    const now = performance.now();
    const guard = interactionGuardRef.current;

    if (loadState === 'HIGH') {
      if (guard.until && now < guard.until && guard.lastDomain === domainKey) {
        setAdaptiveFeedback('Pause briefly to avoid rapid toggling.');
        return false;
      }
      guard.until = now + 700;
      guard.lastDomain = domainKey;
    }

    if (adaptiveState.active && adaptiveState.domain && adaptiveState.domain !== 'general') {
      const domainMatches = (() => {
        if (adaptiveState.domain === 'flight') return domainKey.startsWith('flight');
        if (adaptiveState.domain === 'meeting') return domainKey.startsWith('meeting');
        if (adaptiveState.domain === 'budget') {
          return domainKey === 'budget' || domainKey.startsWith('flight') || domainKey.startsWith('hotel') || domainKey.startsWith('transport');
        }
        return domainKey === adaptiveState.domain;
      })();

      if (!domainMatches) {
        setAdaptiveFeedback('Resolve the highlighted constraint before switching tasks.');
        return false;
      }

      if (adaptiveState.focusTargets.length && focusKey) {
        if (!adaptiveState.focusTargets.includes(focusKey)) {
          setAdaptiveFeedback('Stay with the highlighted element until the constraint clears.');
          return false;
        }
      }
    }

    return true;
  }, [adaptiveState, loadState]);

  const captureCostDelta = useCallback((key, delta) => {
    const stamped = Date.now();
    setCostDeltas(prev => ({
      ...prev,
      [key]: { delta, at: stamped }
    }));
  }, []);

  const pushLoadToContext = useCallback((level, metrics, explanation, topFactorsOverride) => {
    const upScore = (v) => clamp01(0.5 + 0.5 * clamp01(v));
    const downScore = (v) => clamp01(0.49 * (1 - clamp01(v)));
    let topFactors = topFactorsOverride || (level === 'HIGH'
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

    if (level === 'HIGH' && metrics.interactionThrash && metrics.interactionThrash > 0) {
      metricsPayload['Interaction Thrash'] = upScore(metrics.interactionThrash);
      if (!topFactors.includes('Interaction Thrash')) {
        topFactors = [...topFactors, 'Interaction Thrash'];
      }
    }

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
    signals.interactionSwitches = (signals.interactionSwitches || []).filter(ev => now - ev.ts <= 4000);

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
    const highInteractionThrash = (signals.interactionSwitches || []).length >= 5;
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
      interactionThrash: clamp01(((signals.interactionSwitches || []).length) / 6),
      source,
    };

    const explanation = nextLoad === 'HIGH'
      ? buildHighExplanation(activeConflicts, { repeatedViolations, failedAdjustments, dragReverts, idleAfterFailure, slowRecovery })
      : MEDIUM_EXPLANATION;

    updateAdaptiveMode(nextLoad, activeConflicts, { repeatedViolations, failedAdjustments, dragReverts, idleAfterFailure, slowRecovery, highInteractionThrash }, now, signals);
    pushLoadToContext(nextLoad, metrics, explanation);
  }, [computeActiveConflicts, meetings, pushLoadToContext, selectedHotel, selectedOutboundFlight, selectedReturnFlight, selectedTransport]);

  const recordViolationEvent = useCallback((type, detail = null) => {
    const now = performance.now();
    loadSignalsRef.current.violationEvents.push({ ts: now, type, detail });
    loadSignalsRef.current.lastViolationTs = now;
    loadSignalsRef.current.lastActionTs = now;
    loadSignalsRef.current.lastViolationType = type;
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
  }, [computeActiveConflicts, evaluateLoadFromSignals, updateAdaptiveMode]);

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
    evaluateLoadFromSignals('state_change');
  }, [evaluateLoadFromSignals, meetings, selectedHotel, selectedOutboundFlight, selectedReturnFlight, selectedTransport]);

  const handleOutboundFlightSelect = (flight) => {
    if (!allowInteraction('flight_outbound', 'outboundFlight')) {
      return;
    }
    setAdaptiveFeedback(null);
    markInteraction('flight_outbound');
    const prevPrice = selectedOutboundFlight?.price || 0;
    captureCostDelta('outboundFlight', flight.price - prevPrice);
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
    if (!allowInteraction('flight_return', 'returnFlight')) {
      return;
    }
    setAdaptiveFeedback(null);
    markInteraction('flight_return');
    const prevPrice = selectedReturnFlight?.price || 0;
    captureCostDelta('returnFlight', flight.price - prevPrice);
    setSelectedReturnFlight(flight);
    log('return_flight_selected', {
      airline: flight.airline,
      price: flight.price,
      departureTime: flight.departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    });
    try { task3Logger.logFlightSelection(flight, 'return'); } catch (e) { /* ignore */ }
    boostSimulationActivity(0.25);
    if (flight.departureTime.getHours() < 12) {
      recordViolationEvent('flight_constraint', 'return_departure_before_12');
    } else {
      recordSuccessAction();
    }
  };

  const handleHotelSelect = (hotel) => {
    if (!allowInteraction('hotel_selection', 'hotelSelection')) {
      return;
    }
    setAdaptiveFeedback(null);
    markInteraction('hotel_selection');
    const prevPrice = selectedHotel?.totalPrice || 0;
    captureCostDelta('hotel', hotel.totalPrice - prevPrice);
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
    if (!allowInteraction('transport_selection', 'transportSelection')) {
      return;
    }
    setAdaptiveFeedback(null);
    markInteraction('transport_selection');
    const prevPrice = selectedTransport?.price || 0;
    captureCostDelta('transport', transport.price - prevPrice);
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
    if (!allowInteraction('meeting_drag', 'meetingSchedule')) {
      return;
    }
    setAdaptiveFeedback(null);
    markInteraction('meeting_drag');
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
    if (!allowInteraction('meeting_drop', 'meetingSchedule')) {
      return;
    }
    const meeting = meetings.find(m => m.id === meetingId);
    if (adaptiveState.active && adaptiveState.domain === 'meeting') {
      const hasConflicts = Object.keys(meetingConflictDetails.conflictsByMeeting).length > 0;
      if (hasConflicts && meeting && !meeting.scheduled) {
        setAdaptiveFeedback('Resolve highlighted meeting conflicts before adding new meetings.');
        return;
      }
    }
    setAdaptiveFeedback(null);
    markInteraction('meeting_drop');
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
    } else if (selectedReturnFlight.departureTime.getHours() < 12) {
      errors.push('Return flight must depart after 12:00');
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

  const recentCostDeltas = useMemo(() => {
    const now = Date.now();
    const windowed = {};
    Object.entries(costDeltas).forEach(([key, payload]) => {
      if (payload && now - payload.at <= COST_DELTA_WINDOW_MS && Math.abs(payload.delta) > 0) {
        windowed[key] = payload.delta;
      }
    });
    return windowed;
  }, [costDeltas]);

  const outboundConstraintLabels = useMemo(() => {
    const map = {};
    filteredOutboundFlights.forEach(flight => {
      const labels = [];
      if (flight.arrivalTime.getHours() >= 15) labels.push('Arrives after required time');
      if (labels.length) {
        map[flight.id] = labels;
      }
    });
    return map;
  }, [filteredOutboundFlights]);

  const returnConstraintLabels = useMemo(() => {
    const map = {};
    filteredReturnFlights.forEach(flight => {
      const labels = [];
      if (flight.departureTime.getHours() < 12) labels.push('Departs before allowed time');
      if (labels.length) {
        map[flight.id] = labels;
      }
    });
    return map;
  }, [filteredReturnFlights]);

  const meetingConflictDetails = useMemo(() => {
    const details = {
      conflictsByMeeting: {},
      conflictSlots: [],
    };

    meetings.forEach(meeting => {
      if (!meeting.scheduled) return;
      const conflictEntries = [];
      const pushConflict = (type, message) => {
        if (!conflictEntries.find(entry => entry.type === type)) {
          conflictEntries.push({ type, message });
        }
      };

      if (meeting.constraints.allowedDays && !meeting.constraints.allowedDays.includes(meeting.day)) {
        pushConflict('meeting_wrong_day', `Must occur on Day ${meeting.constraints.allowedDays.join(' or ')}`);
      }

      if (meeting.constraints.timeRange) {
        if (meeting.startTime < meeting.constraints.timeRange.start || meeting.startTime + meeting.duration > meeting.constraints.timeRange.end) {
          pushConflict('meeting_time_range', `Outside ${meeting.constraints.timeRange.start}:00-${meeting.constraints.timeRange.end}:00 window`);
        }
      }

      if (meeting.constraints.mustFollow) {
        const followed = meetings.find(m => m.id === meeting.constraints.mustFollow);
        if (followed && followed.scheduled) {
          const invalidOrder = meeting.day < followed.day || (meeting.day === followed.day && meeting.startTime <= followed.startTime + followed.duration);
          if (invalidOrder) {
            pushConflict('meeting_must_follow', `Requires ${followed.title} first`);
          }
        }
      }

      if (meeting.constraints.mustPrecede) {
        const preceded = meetings.find(m => m.id === meeting.constraints.mustPrecede);
        if (preceded && preceded.scheduled) {
          const invalidOrder = meeting.day > preceded.day || (meeting.day === preceded.day && meeting.startTime + meeting.duration >= preceded.startTime);
          if (invalidOrder) {
            pushConflict('meeting_must_precede', `Must finish before ${preceded.title}`);
          }
        }
      }

      if (meeting.constraints.cannotOverlapWith) {
        meeting.constraints.cannotOverlapWith.forEach((otherId) => {
          const other = meetings.find(m => m.id === otherId);
          if (other && other.scheduled && other.day === meeting.day) {
            const meetingEnd = meeting.startTime + meeting.duration;
            const otherEnd = other.startTime + other.duration;
            if (!(meetingEnd <= other.startTime || meeting.startTime >= otherEnd)) {
              pushConflict('meeting_overlap', `Overlaps with ${other.title}`);
            }
          }
        });
      }

      if (conflictEntries.length) {
        details.conflictsByMeeting[meeting.id] = conflictEntries;
        for (let hour = meeting.startTime; hour < meeting.startTime + meeting.duration; hour += 1) {
          details.conflictSlots.push({
            day: meeting.day,
            hour,
            meetingId: meeting.id,
            types: conflictEntries.map(entry => entry.type),
          });
        }
      }
    });

    return details;
  }, [meetings]);

  const currentActiveConflicts = useMemo(() => computeActiveConflicts(), [computeActiveConflicts]);

  const adaptiveFlightMode = adaptiveState.active && adaptiveState.domain === 'flight';
  const adaptiveMeetingMode = adaptiveState.active && adaptiveState.domain === 'meeting';
  const adaptiveBudgetMode = adaptiveState.active && adaptiveState.domain === 'budget';
  const flightSelectionLocked = adaptiveFlightMode && (currentActiveConflicts.includes('outbound_time') || currentActiveConflicts.includes('return_time'));

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

  return (
    <PageContainer>
      <PageTitle>Plan Your Business Trip to Berlin</PageTitle>

      <AdaptiveNotice $load={uiLoadState}>
        <NoticeHeader>
          <span>{loadTitle}</span>
          <span style={{ fontSize: '0.85rem', color: '#475569' }}>{uiLoadState}</span>
        </NoticeHeader>
        <p style={{ marginTop: '0.35rem', fontSize: '0.9rem', color: '#475569' }}>{loadMessage}</p>
        {adaptiveState.active && (
          <div style={{ marginTop: '0.75rem', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5f5', padding: '0.75rem' }}>
            {adaptiveState.directives.map((line, idx) => (
              <p key={idx} style={{ margin: idx === 0 ? '0 0 0.35rem' : '0', fontSize: '0.85rem', color: '#1f2a5a', fontWeight: idx === 0 ? 600 : 500 }}>{line}</p>
            ))}
            {adaptiveFeedback && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#be123c', fontWeight: 600 }}>{adaptiveFeedback}</p>
            )}
          </div>
        )}
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
          {adaptiveBudgetMode && (
            <BudgetSummary
              flight={selectedOutboundFlight}
              returnFlight={selectedReturnFlight}
              hotel={selectedHotel}
              transport={selectedTransport}
              total={totalCost}
              remaining={remainingBudget}
              highlight
              deltas={recentCostDeltas}
              variant="inline"
            />
          )}
          <FlightBooking
            flights={filteredOutboundFlights}
            onFlightSelect={handleOutboundFlightSelect}
            selectedFlight={selectedOutboundFlight}
            title="Outbound Flight (NY → Berlin)"
            constraint="Must arrive before 15:00 on the same day"
            onFlightHoverStart={handleFlightHoverStart}
            onFlightHoverEnd={handleFlightHoverEnd}
            onComponentEnter={handleComponentEnter}
            adaptiveMode={adaptiveState}
            focusKey="outboundFlight"
            constraintLabels={outboundConstraintLabels}
            selectionLocked={flightSelectionLocked}
            deemphasizeNonViable={adaptiveFlightMode}
          />
          
          <FlightBooking
            flights={filteredReturnFlights}
            onFlightSelect={handleReturnFlightSelect}
            selectedFlight={selectedReturnFlight}
            title="Return Flight (Berlin → NY)"
            constraint="Must depart after 12:00 and arrive the next day"
            onFlightHoverStart={handleFlightHoverStart}
            onFlightHoverEnd={handleFlightHoverEnd}
            onComponentEnter={handleComponentEnter}
            adaptiveMode={adaptiveState}
            focusKey="returnFlight"
            constraintLabels={returnConstraintLabels}
            selectionLocked={flightSelectionLocked}
            deemphasizeNonViable={adaptiveFlightMode}
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
            adaptiveMode={adaptiveState}
            highlightConflicts={adaptiveMeetingMode}
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
            highlight={isHighLoad || remainingBudget < 0}
            deltas={recentCostDeltas}
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