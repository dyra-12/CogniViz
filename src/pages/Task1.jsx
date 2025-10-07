import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Button from '../components/Button';
import useLogger from '../hooks/useLogger';
import { useTaskProgress } from '../contexts/TaskProgressContext'; // Add this import

// Styled Components for the form
const FormContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing[8]};
  background: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.lg};
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

// Main Component
const Task1 = () => {
  // --- Metrics State ---
  const [metrics, setMetrics] = useState({
    field_focus_time: {},
    field_order: [],
    field_order_method: [], // 'tab' or 'click'
    field_changes: {},
    keystroke_timestamps: {},
    backspace_count: { total: 0 },
    paste_event: {},
    mouse_click_locations: [],
    clicks_to_submit: 0,
    hover_time: {},
  // zip_code_attempts removed
    shipping_method_switch: false,
    start_time: Date.now(),
    end_time: null,
    total_time: null,
    success: false,
    error_count: 0,
  });
  // Track if a field has been blurred at least once
  const blurredOnceRef = useRef({});
  // Track last value for each field
  const lastValueRef = useRef({});
  // For focus timing
  const focusStartRef = useRef({});
  // For hover timing
  const hoverStartRef = useRef({});
  // For tracking last shipping method
  const lastShippingMethod = useRef('standard');
  const { log } = useLogger();
  const { completeCurrentTask } = useTaskProgress(); // Add this hook

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

  // Log initial view
  useEffect(() => {
    log('form_view', { formName: 'shipping_info' });
  }, [log]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Only count as a field change if the field has been blurred at least once (i.e., user revisited and changed it)
    if (blurredOnceRef.current[name]) {
      if (lastValueRef.current[name] !== undefined && lastValueRef.current[name] !== value) {
        setMetrics(prev => ({
          ...prev,
          field_changes: {
            ...prev.field_changes,
            [name]: (prev.field_changes[name] || 0) + 1
          }
        }));
      }
    }
    // Always update last value
    lastValueRef.current[name] = value;

    // ZIP code attempts removed

    // Shipping method switch
    if (name === 'shippingMethod' && value !== lastShippingMethod.current) {
      setMetrics(prev => ({ ...prev, shipping_method_switch: true }));
      lastShippingMethod.current = value;
    }

    if (isTouched[name]) {
      log('form_field_interaction', { fieldName: name, value, action: 'change' });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setIsTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
    log('form_field_interaction', { fieldName: name, value, action: 'blur' });
    // Mark as blurred at least once
    blurredOnceRef.current[name] = true;
    // Store last value on blur
    lastValueRef.current[name] = value;
    // Focus time
    if (focusStartRef.current[name]) {
      const duration = Date.now() - focusStartRef.current[name];
      setMetrics(prev => ({
        ...prev,
        field_focus_time: {
          ...prev.field_focus_time,
          [name]: (prev.field_focus_time[name] || 0) + duration / 1000 // seconds
        }
      }));
      focusStartRef.current[name] = null;
    }
  };

  const handleFocus = (e, method = 'click') => {
    const { name } = e.target;
    // Focus start time
    focusStartRef.current[name] = Date.now();
    // Field order
    setMetrics(prev => ({
      ...prev,
      field_order: prev.field_order.includes(name) ? prev.field_order : [...prev.field_order, name],
      field_order_method: prev.field_order.includes(name) ? prev.field_order_method : [...prev.field_order_method, method],
    }));
  };
  // Keystroke and backspace tracking
  const handleKeyDown = (e) => {
    const { name } = e.target;
    // Keystroke timestamps
    setMetrics(prev => ({
      ...prev,
      keystroke_timestamps: {
        ...prev.keystroke_timestamps,
        [name]: [...(prev.keystroke_timestamps[name] || []), Date.now()]
      }
    }));
    // Backspace count
    if (e.key === 'Backspace') {
      setMetrics(prev => ({
        ...prev,
        backspace_count: {
          ...prev.backspace_count,
          total: (prev.backspace_count.total || 0) + 1,
          [name]: (prev.backspace_count[name] || 0) + 1
        }
      }));
    }
  };

  // Paste event
  const handlePaste = (e) => {
    const { name } = e.target;
    setMetrics(prev => ({
      ...prev,
      paste_event: {
        ...prev.paste_event,
        [name]: true
      }
    }));
  };

  // Mouse click location
  useEffect(() => {
    const handleClick = (e) => {
      setMetrics(prev => ({
        ...prev,
        mouse_click_locations: [
          ...prev.mouse_click_locations,
          { x: e.clientX, y: e.clientY, time: Date.now() }
        ]
      }));
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Clicks to submit
  const handleSubmitClick = () => {
    setMetrics(prev => ({ ...prev, clicks_to_submit: prev.clicks_to_submit + 1 }));
  };

  // Hover time for tooltips (example for '?')
  const handleHoverStart = (id) => {
    hoverStartRef.current[id] = Date.now();
  };
  const handleHoverEnd = (id) => {
    if (hoverStartRef.current[id]) {
      const duration = Date.now() - hoverStartRef.current[id];
      setMetrics(prev => ({
        ...prev,
        hover_time: {
          ...prev.hover_time,
          [id]: (prev.hover_time[id] || 0) + duration / 1000 // seconds
        }
      }));
      hoverStartRef.current[id] = null;
    }
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
    log('form_submit_attempt', { formData });
    const errorCount = Object.values(errors).filter(Boolean).length;
    if (validateForm()) {
      setTimeout(() => {
        log('form_submit_success', { formData });
        const endTime = Date.now();
        const totalTime = (endTime - (metrics.start_time || endTime)) / 1000; // seconds
        // Convert all timing metrics to seconds (if not already)
        const convertObjToSeconds = (obj) => {
          const out = {};
          for (const k in obj) {
            if (typeof obj[k] === 'number') out[k] = Number(obj[k]);
          }
          return out;
        };
        const dataToSave = {
          task1: {
            ...metrics,
            field_focus_time: convertObjToSeconds(metrics.field_focus_time),
            hover_time: convertObjToSeconds(metrics.hover_time),
            end_time: endTime,
            total_time: totalTime,
            success: true,
            error_count: metrics.error_count + errorCount,
          }
        };
        localStorage.setItem('task1_metrics', JSON.stringify(dataToSave));
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
        setErrors({});
        setIsTouched({});
        setMetrics({
          field_focus_time: {},
          field_order: [],
          field_order_method: [],
          field_changes: {},
          keystroke_timestamps: {},
          backspace_count: { total: 0 },
          paste_event: {},
          mouse_click_locations: [],
          clicks_to_submit: 0,
          hover_time: {},
          // zip_code_attempts removed
          shipping_method_switch: false,
          start_time: Date.now(),
          end_time: null,
          total_time: null,
          success: false,
          error_count: 0,
        });
      }, 1000);
    } else {
      log('form_validation_error', { errors, formData });
      // Count errors for this attempt
      setMetrics(prev => ({
        ...prev,
        error_count: prev.error_count + Object.values(errors).filter(Boolean).length
      }));
    }
  };

  if (isSubmitted) {
    return (
      <FormContainer>
        <SuccessMessage>
          <h3>✅ Success!</h3>
          <p>Your shipping information has been submitted successfully.</p>
          <Button 
            onClick={() => {
              completeCurrentTask(); // This moves to next task
            }}
            style={{ marginTop: '1rem' }}
          >
            Continue to Next Task
          </Button>
        </SuccessMessage>
      </FormContainer>
    );
  }

  return (
    <FormContainer>
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
            onFocus={e => handleFocus(e, 'click')}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className={errors.fullName ? 'error' : ''}
            placeholder="John Doe"
            tabIndex={0}
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
            onFocus={e => handleFocus(e, 'click')}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className={errors.addressLine1 ? 'error' : ''}
            placeholder="123 Main St"
            tabIndex={0}
          />
          {errors.addressLine1 && <ErrorText>{errors.addressLine1}</ErrorText>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
          <Input
            type="text"
            id="addressLine2"
            name="addressLine2"
            value={formData.addressLine2}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={e => handleFocus(e, 'click')}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Apt 456"
            tabIndex={0}
          />
        </FormGroup>

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
              onFocus={e => handleFocus(e, 'click')}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              className={errors.city ? 'error' : ''}
              placeholder="New York"
              tabIndex={0}
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
              onFocus={e => handleFocus(e, 'click')}
              tabIndex={0}
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
              onFocus={e => handleFocus(e, 'click')}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              className={errors.zipCode ? 'error' : ''}
              placeholder="12345"
              tabIndex={0}
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
              onFocus={e => handleFocus(e, 'click')}
              tabIndex={0}
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
                onFocus={e => handleFocus(e, 'click')}
                tabIndex={0}
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
                onFocus={e => handleFocus(e, 'click')}
                tabIndex={0}
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
                onFocus={e => handleFocus(e, 'click')}
                tabIndex={0}
                style={{ marginRight: '0.5rem' }}
              />
              Overnight (1 business day)
            </label>
          </div>
        </FormGroup>

        <Button type="submit" style={{ width: '100%', fontSize: '1.1rem' }} onClick={handleSubmitClick}>
          Save Shipping Information
        </Button>
      </form>
    </FormContainer>
  );
};

export default Task1;