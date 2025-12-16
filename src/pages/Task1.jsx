import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import Button from '../components/Button';
import useLogger from '../hooks/useLogger';
import useTask1Logger from '../hooks/useTask1Logger';
import { useTaskProgress } from '../contexts/TaskProgressContext'; // Add this import
import { useAuth } from '../contexts/AuthContext';
import { sendTask1Metrics } from '../utils/dataCollection';
import { useCognitiveLoad } from '../contexts/CognitiveLoadContext';
import { boostSimulationActivity, setSimulationTask, publishManualPrediction, clearManualPrediction } from '../telemetry/wsClient';
import CognitiveLoadGauge from '../components/CognitiveLoadGauge';
import ExplanationBanner from '../components/ExplanationBanner';
import TopFactorsList from '../components/TopFactorsList';


// Styled Components for the form
const FormContainer = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing[8]};
  background: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.xl};
  border: 2px solid
    ${props => {
      if (props.$load === 'High') return props.theme.colors.danger;
      if (props.$load === 'Medium') return props.theme.colors.warning;
      return 'transparent';
    }};
  box-shadow: ${props => props.$load === 'High'
    ? '0 24px 50px rgba(247, 37, 133, 0.25)'
    : props.$load === 'Medium'
      ? '0 20px 45px rgba(247, 127, 0, 0.18)'
      : props.theme.shadows.lg};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
`;

const FormTitle = styled.h1`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing[8]};
  color: ${props => props.theme.colors.primary};
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing[6]};
`;

const Label = styled.label`
  display: block;
  margin-bottom: ${props => props.theme.spacing[2]};
  font-weight: 500;
  color: ${props => props.theme.colors.gray700};
`;

const Input = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing[3]};
  border: 1px solid ${props => props.theme.colors.gray300};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.fontSizes.md};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
  }

  &.error {
    border-color: ${props => props.theme.colors.danger};
  }

  &.focus-field {
    border-color: ${props => props.theme.colors.warning};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.warning}22;
    background: ${props => props.theme.colors.warning}08;
  }
`;

const Select = styled.select`
  ${Input} // Inherits all styles from Input
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right ${props => props.theme.spacing[3]} center;
  background-size: 1em;
  /* Hide default arrow in IE/Edge */
  &::-ms-expand {
    display: none;
  }
  /* Hide default arrow in Firefox */
  &::-moz-focus-inner {
    border: 0;
  }
  &::-webkit-search-decoration,
  &::-webkit-search-cancel-button,
  &::-webkit-search-results-button,
  &::-webkit-search-results-decoration {
    display: none;
  }
`;

const AdaptiveBanner = styled.div`
  background: ${props => {
    switch (props.$load) {
      case 'High':
        return 'rgba(247, 37, 133, 0.08)';
      case 'Medium':
        return 'rgba(247, 127, 0, 0.08)';
      case 'Low':
        return 'rgba(67, 97, 238, 0.08)';
      default:
        return props.theme.colors.gray100;
    }
  }};
  border: 1px solid ${props => {
    switch (props.$load) {
      case 'High':
        return props.theme.colors.danger;
      case 'Medium':
        return props.theme.colors.warning;
      case 'Low':
        return props.theme.colors.primary;
      default:
        return props.theme.colors.gray200;
    }
  }};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing[4]};
  margin-bottom: ${props => props.theme.spacing[6]};
`;

const BannerTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: ${props => props.theme.colors.dark};
`;

const BannerList = styled.ul`
  list-style: none;
  padding: 0;
  margin: ${props => props.theme.spacing[3]} 0 0;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing[2]};
`;

const BannerItem = styled.li`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.gray700};
  display: flex;
  flex-direction: column;

  span:first-child {
    font-weight: 600;
    color: ${props => props.theme.colors.dark};
  }
`;

const OptionalToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing[2]};
  border: none;
  background: none;
  color: ${props => props.theme.colors.primary};
  font-weight: 600;
  cursor: pointer;
  margin-bottom: ${props => props.theme.spacing[2]};
`;

const OptionalSection = styled.div`
  border-top: 1px dashed ${props => props.theme.colors.gray200};
  margin-top: ${props => props.theme.spacing[4]};
  padding-top: ${props => props.theme.spacing[4]};
`;

const ErrorText = styled.span`
  display: block;
  margin-top: ${props => props.theme.spacing[2]};
  color: ${props => props.theme.colors.danger};
  font-size: ${props => props.theme.fontSizes.sm};
`;

const SuccessMessage = styled.div`
  padding: ${props => props.theme.spacing[4]};
  background-color: ${props => props.theme.colors.success}15;
  color: ${props => props.theme.colors.success};
  border-radius: ${props => props.theme.borderRadius.md};
  text-align: center;
  margin-top: ${props => props.theme.spacing[6]};
  border: 1px solid ${props => props.theme.colors.success}30;
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing[4]};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const TaskLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: ${props => props.theme.spacing[6]};
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing[6]};

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const CognitiveLoadSidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing[4]};
  position: sticky;
  top: ${props => props.theme.spacing[20]};
  height: fit-content;
`;

const LOW_LOAD_EXPLANATION = 'Fluent sequential entry detected. Minimal hesitation and near-perfect completion efficiency.';

const INITIAL_LOAD_METRICS = {
  focusTimeMs: 0,
  focusSamples: 0,
  hesitationMs: 0,
  hesitationSamples: 0,
  efficiency: 1,
  idleRatio: 0,
};

const getNow = () => (typeof performance !== 'undefined' && typeof performance.now === 'function'
  ? performance.now()
  : Date.now());

const average = (values = []) => {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
};

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const pushSample = (samples, value, limit = 25) => {
  samples.push(value);
  if (samples.length > limit) {
    samples.shift();
  }
};

const focusNarratives = {
  low: 'Focus dwell stays long between switches.',
  medium: 'Focus pacing is steady; keep the current rhythm.',
  high: 'Rapid focus switches detected—slow down between fields.',
};

const hesitationNarratives = {
  low: 'Keystrokes begin immediately after focus.',
  medium: 'Brief pauses before typing are appearing.',
  high: 'Long hesitation before typing indicates uncertainty.',
};

const efficiencyNarratives = {
  low: 'Nearly every focused field is completed.',
  medium: 'Some focused fields are left unfinished.',
  high: 'Many focus events do not result in completion.',
};

const idleNarratives = {
  low: 'Barely any idle time between actions.',
  medium: 'Moderate idle gaps observed.',
  high: 'Large idle windows indicate deliberation.',
};

function buildTask1PredictionSnapshot(metrics) {
  const focusSeverity = metrics.focusTimeMs >= 1500 ? 'low'
    : metrics.focusTimeMs >= 900 ? 'medium'
      : 'high';
  const hesitationSeverity = metrics.hesitationMs <= 250 ? 'low'
    : metrics.hesitationMs <= 500 ? 'medium'
      : 'high';
  const efficiencySeverity = metrics.efficiency >= 0.9 ? 'low'
    : metrics.efficiency >= 0.75 ? 'medium'
      : 'high';
  const idleSeverity = metrics.idleRatio <= 0.05 ? 'low'
    : metrics.idleRatio <= 0.12 ? 'medium'
      : 'high';

  const highlights = [
    {
      id: 'focus_time',
      label: 'Focus Time',
      description: 'Average time between focus switches.',
      severity: focusSeverity,
      value: clamp01(metrics.focusTimeMs / 2000),
      displayValue: metrics.focusTimeMs ? `${(metrics.focusTimeMs / 1000).toFixed(1)}s dwell` : 'Collecting…',
      narrative: focusNarratives[focusSeverity],
    },
    {
      id: 'form_hesitation',
      label: 'Form Hesitation',
      description: 'Delay between focus and the first keystroke.',
      severity: hesitationSeverity,
      value: clamp01(metrics.hesitationMs / 1000),
      displayValue: metrics.hesitationMs ? `${Math.round(metrics.hesitationMs)} ms to type` : 'Collecting…',
      narrative: hesitationNarratives[hesitationSeverity],
    },
    {
      id: 'form_efficiency',
      label: 'Form Efficiency',
      description: 'Filled fields divided by focused fields.',
      severity: efficiencySeverity,
      value: clamp01(metrics.efficiency),
      displayValue: `${Math.round(metrics.efficiency * 100)}% complete`,
      narrative: efficiencyNarratives[efficiencySeverity],
    },
    {
      id: 'idle_time',
      label: 'Idle Time',
      description: 'Portion of the session with no activity (>2s gaps).',
      severity: idleSeverity,
      value: clamp01(metrics.idleRatio),
      displayValue: `${Math.round(metrics.idleRatio * 100)}% idle`,
      narrative: idleNarratives[idleSeverity],
    },
  ];

  return {
    probs: { Low: 0.9, Medium: 0.09, High: 0.01 },
    class: 'Low',
    loadScore: 0.22,
    shapTop: highlights.map((metric, idx) => ({
      feature: metric.id,
      value: metric.value,
      impact: metric.severity === 'low' ? 1 : metric.severity === 'medium' ? 2 : 3,
    })),
    explanation: LOW_LOAD_EXPLANATION,
    taskId: 1,
    taskLabel: 'Task 1 — Form Entry',
    metricHighlights: highlights,
  };
}

// Main Component
const Task1 = () => {
  const { log } = useLogger();
  const { completeCurrentTask } = useTaskProgress();
  const logger = useTask1Logger();
  const formRef = useRef();
  const { participantId } = useAuth();
  const { loadClass, shap, hydrated } = useCognitiveLoad();

  const [loadMetrics, setLoadMetrics] = useState(INITIAL_LOAD_METRICS);
  const metricsRef = useRef({
    sessionStart: getNow(),
    lastFocusTs: null,
    focusDurations: [],
    pendingHesitation: null,
    hesitationDurations: [],
    uniqueFocusedFields: new Set(),
    filledFields: new Set(),
    lastActivityTs: getNow(),
    lastTickTs: getNow(),
    idleAccumMs: 0,
  });
  const manualOverrideRef = useRef(false);

  const registerActivity = () => {
    metricsRef.current.lastActivityTs = getNow();
  };

  const updateMetricsSnapshot = useCallback(() => {
    const state = metricsRef.current;
    const focusSamples = state.focusDurations.length;
    const hesitationSamples = state.hesitationDurations.length;
    const snapshot = {
      focusTimeMs: focusSamples ? average(state.focusDurations) : 0,
      focusSamples,
      hesitationMs: hesitationSamples ? average(state.hesitationDurations) : 0,
      hesitationSamples,
      efficiency: clamp01(state.filledFields.size / Math.max(1, state.uniqueFocusedFields.size)),
      idleRatio: clamp01(state.idleAccumMs / Math.max(1, getNow() - state.sessionStart)),
    };

    setLoadMetrics(prev => {
      const changed =
        Math.abs(prev.focusTimeMs - snapshot.focusTimeMs) > 5 ||
        Math.abs(prev.hesitationMs - snapshot.hesitationMs) > 5 ||
        Math.abs(prev.efficiency - snapshot.efficiency) > 0.01 ||
        Math.abs(prev.idleRatio - snapshot.idleRatio) > 0.01 ||
        prev.focusSamples !== snapshot.focusSamples ||
        prev.hesitationSamples !== snapshot.hesitationSamples;
      return changed ? snapshot : prev;
    });
    }, []);

  const recordFocusEvent = (fieldName) => {
    const state = metricsRef.current;
    const now = getNow();
    state.uniqueFocusedFields.add(fieldName);
    if (state.lastFocusTs) {
      pushSample(state.focusDurations, now - state.lastFocusTs);
    }
    state.lastFocusTs = now;
    state.pendingHesitation = { field: fieldName, ts: now, captured: false };
    updateMetricsSnapshot();
  };

  const recordHesitation = (fieldName) => {
    const state = metricsRef.current;
    const pending = state.pendingHesitation;
    if (!pending || pending.field !== fieldName || pending.captured) return;
    const now = getNow();
    pushSample(state.hesitationDurations, now - pending.ts);
    pending.captured = true;
    updateMetricsSnapshot();
  };

  const trackFieldCompletion = (fieldName, rawValue) => {
    const state = metricsRef.current;
    const normalized = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
    if (normalized) {
      state.filledFields.add(fieldName);
    } else {
      state.filledFields.delete(fieldName);
    }
    updateMetricsSnapshot();
  };

  const resetHeuristicTracking = () => {
    const now = getNow();
    metricsRef.current = {
      sessionStart: now,
      lastFocusTs: null,
      focusDurations: [],
      pendingHesitation: null,
      hesitationDurations: [],
      uniqueFocusedFields: new Set(),
      filledFields: new Set(),
      lastActivityTs: now,
      lastTickTs: now,
      idleAccumMs: 0,
    };
    setLoadMetrics({ ...INITIAL_LOAD_METRICS });
  };

  const hasStableSamples = loadMetrics.focusSamples >= 2 && loadMetrics.hesitationSamples >= 1;
  const lowLoadDetected = hasStableSamples &&
    loadMetrics.hesitationMs > 0 &&
    loadMetrics.hesitationMs < 300 &&
    loadMetrics.efficiency >= 0.9 &&
    loadMetrics.idleRatio < 0.05;

  const remoteLoadState = hydrated ? loadClass : 'Calibrating';
  const loadState = lowLoadDetected ? 'Low' : remoteLoadState;
  const loadTitle = lowLoadDetected ? 'Fluent sequential entry' : 'Adaptive guidance';
  const loadMessage = lowLoadDetected ? LOW_LOAD_EXPLANATION : 'Monitoring for any rise in load.';
  const isHighLoad = loadState === 'High';

  const [formData, setFormData] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    shippingMethod: 'standard'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTouched, setIsTouched] = useState({});
  const [optionalCollapsed, setOptionalCollapsed] = useState(false);

  useEffect(() => {
    if (isHighLoad) {
      setOptionalCollapsed(true);
    }
  }, [isHighLoad]);

  useEffect(() => {
    resetHeuristicTracking();
  }, []);

  useEffect(() => {
    const idleInterval = setInterval(() => {
      const state = metricsRef.current;
      const now = getNow();
      const delta = now - state.lastTickTs;
      if (now - state.lastActivityTs > 2000) {
        state.idleAccumMs += delta;
      }
      state.lastTickTs = now;
      updateMetricsSnapshot();
    }, 600);

    return () => clearInterval(idleInterval);
  }, [updateMetricsSnapshot]);

  useEffect(() => {
    if (!hasStableSamples) {
      if (manualOverrideRef.current) {
        clearManualPrediction();
        manualOverrideRef.current = false;
      }
      return;
    }

    if (lowLoadDetected) {
      publishManualPrediction(buildTask1PredictionSnapshot(loadMetrics), null);
      manualOverrideRef.current = true;
    } else if (manualOverrideRef.current) {
      clearManualPrediction();
      manualOverrideRef.current = false;
    }
  }, [hasStableSamples, lowLoadDetected, loadMetrics.focusTimeMs, loadMetrics.hesitationMs, loadMetrics.efficiency, loadMetrics.idleRatio]);

  useEffect(() => () => {
    clearManualPrediction();
    manualOverrideRef.current = false;
  }, []);

  // Log initial view
  // Mark start when form becomes visible (instructions disappear)
  useEffect(() => {
    logger.markStart();
    log('form_view', { formName: 'shipping_info' });
  }, [log]);

  useEffect(() => {
    setSimulationTask(1);
  }, []);

  // Update cognitive load context based on Task1 metrics
  const { updateState: updateCognitiveLoad } = useCognitiveLoad();
  
  useEffect(() => {
    const deriveLoadLevel = () => {
      const { focusTimeMs, hesitationMs, efficiency } = metricsRef.current;
      
      // High load: rapid focus switching, high hesitation, or low efficiency
      if (focusTimeMs < 800 || hesitationMs > 600 || efficiency < 0.7) {
        return 'HIGH';
      }
      // Medium load: moderate metrics
      if (focusTimeMs < 1200 || hesitationMs > 350 || efficiency < 0.85) {
        return 'MEDIUM';
      }
      return 'LOW';
    };

    const buildExplanation = () => {
      const { focusTimeMs, hesitationMs, efficiency, idleRatio } = metricsRef.current;
      const level = deriveLoadLevel();
      
      if (level === 'LOW') {
        return 'Low cognitive load detected. Stable Focus Dwell Time and fluent Form Progression observed.';
      } else if (level === 'MEDIUM') {
        return 'Moderate activity detected with some hesitation in Form Entry and focus switching.';
      } else {
        return 'High cognitive load: rapid Focus Switches, increased Form Hesitation, and reduced completion efficiency.';
      }
    };

    const buildTopFactors = () => {
      const { focusTimeMs, hesitationMs, efficiency } = metricsRef.current;
      const factors = [];
      
      if (focusTimeMs < 1000) factors.push('Focus Dwell Time');
      if (hesitationMs > 400) factors.push('Form Hesitation');
      if (efficiency < 0.85) factors.push('Entry Efficiency');
      
      return factors.slice(0, 3);
    };

    const interval = setInterval(() => {
      const { focusTimeMs, hesitationMs, efficiency, idleRatio } = metricsRef.current;
      
      updateCognitiveLoad({
        loadLevel: deriveLoadLevel(),
        metrics: {
          'Focus Dwell Time': Math.min(focusTimeMs / 2000, 1),
          'Form Hesitation': Math.min(hesitationMs / 1000, 1),
          'Entry Efficiency': 1 - efficiency,
          'Idle Time': idleRatio
        },
        topFactors: buildTopFactors(),
        explanation: buildExplanation()
      });
    }, 500);

    return () => clearInterval(interval);
  }, [updateCognitiveLoad]);

  // Enhanced handlers to integrate logger
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    registerActivity();
    setFormData(prev => ({ ...prev, [name]: value }));
    trackFieldCompletion(name, value);
    if (type === 'radio' && name === 'shippingMethod') {
      logger.onShippingMethodChange();
    }
    logger.getFieldProps(name, value).onChange(e);
    if (isTouched[name]) {
      log('form_field_interaction', { fieldName: name, value, action: 'change' });
    }
    boostSimulationActivity(0.25);
  };

  const essentialFields = ['fullName', 'addressLine1', 'city', 'zipCode'];
  const getFieldClasses = (name) => {
    const classes = [];
    if (errors[name]) classes.push('error');
    if (isHighLoad && essentialFields.includes(name)) classes.push('focus-field');
    return classes.join(' ');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    registerActivity();
    setIsTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
    logger.getFieldProps(name, value).onBlur(e);
    log('form_field_interaction', { fieldName: name, value, action: 'blur' });
  };

  const handleFocus = (e) => {
    const { name, value } = e.target;
    registerActivity();
    recordFocusEvent(name);
    logger.getFieldProps(name, value).onFocus(e);
  };

  const handleKeyDown = (e) => {
    const { name, value } = e.target;
    registerActivity();
    recordHesitation(name);
    logger.getFieldProps(name, value).onKeyDown(e);
  };

  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'fullName':
        if (!value.trim()) error = 'Full name is required';
        break;
      case 'addressLine1':
        if (!value.trim()) error = 'Address line 1 is required';
        break;
      case 'city':
        if (!value.trim()) error = 'City is required';
        break;
      case 'zipCode':
        // Accept US ZIP (5 or 9 digits) or Indian PIN (6 digits)
        if (!/^\d{5}(-\d{4})?$/.test(value) && !/^\d{6}$/.test(value)) {
          error = 'Please enter a valid ZIP/Postal code';
        }
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      isValid = false;
    }
    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address line 1 is required';
      isValid = false;
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
      isValid = false;
    }
    if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode) && !/^\d{6}$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid ZIP/Postal code';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    registerActivity();
    boostSimulationActivity(0.4);
    log('form_submit_attempt', { formData });

    if (!validateForm()) {
      logger.logError();
      log('form_validation_error', { errors, formData });
      return;
    }

    setTimeout(() => {
      log('form_submit_success', { formData });
      logger.markEnd(true);
      logger.saveToLocalStorage();
      setIsSubmitted(true);
      setFormData({
        fullName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
        shippingMethod: 'standard'
      });
      resetHeuristicTracking();
      setErrors({});
      setIsTouched({});
    }, 1000);
  };

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const handleContinueToNext = async () => {
    setSendError(null);
    setSending(true);
    try {
      // Ensure latest metrics are saved
      try { logger.saveToLocalStorage(); } catch (e) { /* ignore */ }
      const res = await sendTask1Metrics({ participantId });
      if (!res.ok) {
        throw res.error || new Error('Failed to send Task 1 metrics');
      }
      // Optionally remember the doc id
      localStorage.setItem('task1_docId', res.id);
      completeCurrentTask();
    } catch (e) {
      console.error('Task1 upload failed:', e);
      setSendError(e?.message || 'Failed to upload Task 1 metrics');
    } finally {
      setSending(false);
    }
  };

  if (isSubmitted) {
    return (
      <FormContainer $load={loadState}>
        <SuccessMessage>
          <h3>✅ Success!</h3>
          <p>Your shipping information has been submitted successfully.</p>
          {sendError && (
            <p style={{ color: '#d9534f', marginTop: '0.5rem' }}>
              {sendError}
            </p>
          )}
          <Button
            onClick={handleContinueToNext}
            style={{ marginTop: '1rem' }}
            disabled={sending}
          >
            {sending ? 'Uploading…' : 'Continue to Next Task'}
          </Button>
        </SuccessMessage>
      </FormContainer>
    );
  }

  return (
    <TaskLayout>
      <FormContainer $load={loadState}>
        <AdaptiveBanner $load={loadState}>
          <BannerTitle>
            <span>{loadTitle}</span>
            <small style={{ color: '#475569' }}>{loadState}</small>
          </BannerTitle>
          <p style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>{loadMessage}</p>
            {/* insights removed due to missing cognitiveLoadHints */}
          {isHighLoad && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#b45309' }}>
              Optional address fields are collapsed to keep focus on required inputs.
            </p>
          )}
        </AdaptiveBanner>
        <FormTitle>Shipping Information</FormTitle>
      
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className={getFieldClasses('fullName')}
            placeholder="John Doe"
          />
          {errors.fullName && <ErrorText>{errors.fullName}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="addressLine1">Address Line 1 *</Label>
          <Input
            type="text"
            id="addressLine1"
            name="addressLine1"
            value={formData.addressLine1}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className={getFieldClasses('addressLine1')}
            placeholder="123 Main St"
          />
          {errors.addressLine1 && <ErrorText>{errors.addressLine1}</ErrorText>}
        </FormGroup>

        <OptionalSection>
          <OptionalToggle type="button" onClick={() => setOptionalCollapsed(prev => !prev)}>
            {optionalCollapsed ? 'Show optional fields' : 'Hide optional fields'}
          </OptionalToggle>
          {!optionalCollapsed && (
            <FormGroup>
              <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
              <Input
                type="text"
                id="addressLine2"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                placeholder="Apt 456"
              />
            </FormGroup>
          )}
        </OptionalSection>

        <TwoColumnGrid>
          <FormGroup>
            <Label htmlFor="city">City *</Label>
            <Input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              className={getFieldClasses('city')}
              placeholder="New York"
            />
            {errors.city && <ErrorText>{errors.city}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="state">State</Label>
            <Select
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
            >
              <option value="">Select State</option>
              <option value="CA">California</option>
              <option value="NY">New York</option>
              <option value="TX">Texas</option>
              <option value="FL">Florida</option>
              <option value="IL">Illinois</option>
              <option disabled>──────────</option>
              <option value="AP">Andhra Pradesh</option>
              <option value="AR">Arunachal Pradesh</option>
              <option value="AS">Assam</option>
              <option value="BR">Bihar</option>
              <option value="CT">Chhattisgarh</option>
              <option value="GA">Goa</option>
              <option value="GJ">Gujarat</option>
              <option value="HR">Haryana</option>
              <option value="HP">Himachal Pradesh</option>
              <option value="JH">Jharkhand</option>
              <option value="KA">Karnataka</option>
              <option value="KL">Kerala</option>
              <option value="MP">Madhya Pradesh</option>
              <option value="MH">Maharashtra</option>
              <option value="MN">Manipur</option>
              <option value="ML">Meghalaya</option>
              <option value="MZ">Mizoram</option>
              <option value="NL">Nagaland</option>
              <option value="OR">Odisha</option>
              <option value="PB">Punjab</option>
              <option value="RJ">Rajasthan</option>
              <option value="SK">Sikkim</option>
              <option value="TN">Tamil Nadu</option>
              <option value="TG">Telangana</option>
              <option value="TR">Tripura</option>
              <option value="UP">Uttar Pradesh</option>
              <option value="UT">Uttarakhand</option>
              <option value="WB">West Bengal</option>
              <option value="AN">Andaman and Nicobar Islands</option>
              <option value="CH">Chandigarh</option>
              <option value="DN">Dadra and Nagar Haveli and Daman and Diu</option>
              <option value="DL">Delhi</option>
              <option value="JK">Jammu and Kashmir</option>
              <option value="LA">Ladakh</option>
              <option value="LD">Lakshadweep</option>
              <option value="PY">Puducherry</option>
            </Select>
          </FormGroup>
        </TwoColumnGrid>

        <TwoColumnGrid>
          <FormGroup>
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              className={getFieldClasses('zipCode')}
              placeholder="12345"
            />
            {errors.zipCode && <ErrorText>{errors.zipCode}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="country">Country</Label>
            <Select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
              <option value="IN">India</option>
            </Select>
          </FormGroup>
        </TwoColumnGrid>

        <FormGroup>
          <Label>Shipping Method</Label>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              <input
                type="radio"
                name="shippingMethod"
                value="standard"
                checked={formData.shippingMethod === 'standard'}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                style={{ marginRight: '0.5rem' }}
              />
              Standard (5-7 business days)
            </label>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              <input
                type="radio"
                name="shippingMethod"
                value="express"
                checked={formData.shippingMethod === 'express'}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                style={{ marginRight: '0.5rem' }}
              />
              Express (2-3 business days)
            </label>
            <label style={{ display: 'block' }}>
              <input
                type="radio"
                name="shippingMethod"
                value="overnight"
                checked={formData.shippingMethod === 'overnight'}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                style={{ marginRight: '0.5rem' }}
              />
              Overnight (1 business day)
            </label>
          </div>
        </FormGroup>

        <Button type="submit" style={{ width: '100%', fontSize: '1.1rem' }}>
          Save Shipping Information
        </Button>
      </form>
    </FormContainer>

    <CognitiveLoadSidebar>
      <CognitiveLoadGauge />
      <ExplanationBanner />
      <TopFactorsList />
    </CognitiveLoadSidebar>
  </TaskLayout>
  );
};

export default Task1;