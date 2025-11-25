import { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
import Button from '../components/Button';
import useLogger from '../hooks/useLogger';
import useTask1Logger from '../hooks/useTask1Logger';
import { useTaskProgress } from '../contexts/TaskProgressContext'; // Add this import
import { useAuth } from '../contexts/AuthContext';
import { sendTask1Metrics } from '../utils/dataCollection';
import { useCognitiveLoad } from '../contexts/CognitiveLoadContext';
import { describeLoadState, getTaskInsights } from '../utils/cognitiveLoadHints';

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

// Main Component
const Task1 = () => {
  const { log } = useLogger();
  const { completeCurrentTask } = useTaskProgress();
  const logger = useTask1Logger();
  const formRef = useRef();
  const { participantId } = useAuth();
  const { loadClass, shap, hydrated } = useCognitiveLoad();
  const loadState = hydrated ? loadClass : 'Calibrating';
  const { title: loadTitle, message: loadMessage } = describeLoadState(loadState);
  const isHighLoad = hydrated && loadClass === 'High';
  const insights = useMemo(() => getTaskInsights(shap, 'task1', 2), [shap]);

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

  // Log initial view
  // Mark start when form becomes visible (instructions disappear)
  useEffect(() => {
    logger.markStart();
    log('form_view', { formName: 'shipping_info' });
  }, [log]);

  // Enhanced handlers to integrate logger
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (type === 'radio' && name === 'shippingMethod') {
      logger.onShippingMethodChange();
    }
    logger.getFieldProps(name, value).onChange(e);
    if (isTouched[name]) {
      log('form_field_interaction', { fieldName: name, value, action: 'change' });
    }
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
    setIsTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
    logger.getFieldProps(name, value).onBlur(e);
    log('form_field_interaction', { fieldName: name, value, action: 'blur' });
  };

  const handleFocus = (e) => {
    const { name, value } = e.target;
    logger.getFieldProps(name, value).onFocus(e);
  };

  const handleKeyDown = (e) => {
    const { name, value } = e.target;
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
    log('form_submit_attempt', { formData });
    if (validateForm()) {
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
        setErrors({});
        setIsTouched({});
      }, 1000);
    } else {
      logger.logError();
      log('form_validation_error', { errors, formData });
    }
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
    <FormContainer $load={loadState}>
      <AdaptiveBanner $load={loadState}>
        <BannerTitle>
          <span>{loadTitle}</span>
          <small style={{ color: '#475569' }}>{loadState}</small>
        </BannerTitle>
        <p style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>{loadMessage}</p>
        {insights.length > 0 && (
          <BannerList>
            {insights.map((insight) => (
              <BannerItem key={insight.feature}>
                <span>{insight.label}</span>
                <span>{insight.advice}</span>
              </BannerItem>
            ))}
          </BannerList>
        )}
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
  );
};

export default Task1;