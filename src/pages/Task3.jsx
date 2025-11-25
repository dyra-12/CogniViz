import { useState, useEffect, useMemo } from 'react';
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
import { describeLoadState, getTaskInsights } from '../utils/cognitiveLoadHints';

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
  background: ${props => props.completed ? `${props.theme.colors.success}15` : props.theme.colors.white};
  border: 1px solid ${props => props.completed ? props.theme.colors.success : props.theme.colors.gray200};
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

const Task3 = () => {
  const { completeCurrentTask } = useTaskProgress();
  const { log } = useLogger();
  const task3Logger = useTask3Logger();
  const { loadClass, shap, hydrated } = useCognitiveLoad();
  const loadState = hydrated ? loadClass : 'Calibrating';
  const isHighLoad = hydrated && loadClass === 'High';
  const insights = useMemo(() => getTaskInsights(shap, 'task3', 3), [shap]);
  const { title: loadTitle, message: loadMessage } = describeLoadState(loadState);
  
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

  const totalCost = (selectedOutboundFlight?.price || 0) + 
                   (selectedReturnFlight?.price || 0) + 
                   (selectedHotel?.totalPrice || 0) + 
                   (selectedTransport?.price || 0);

  const remainingBudget = 1380 - totalCost; // Changed to $1,380

  const handleOutboundFlightSelect = (flight) => {
    setSelectedOutboundFlight(flight);
    log('outbound_flight_selected', {
      airline: flight.airline,
      price: flight.price,
      arrivalTime: flight.arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    });
    try { task3Logger.logFlightSelection(flight, 'outbound'); } catch (e) { /* ignore */ }
  };

  const handleReturnFlightSelect = (flight) => {
    setSelectedReturnFlight(flight);
    log('return_flight_selected', {
      airline: flight.airline,
      price: flight.price,
      departureTime: flight.departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    });
    try { task3Logger.logFlightSelection(flight, 'return'); } catch (e) { /* ignore */ }
  };

  const handleHotelSelect = (hotel) => {
    setSelectedHotel(hotel);
    log('hotel_selected', {
      name: hotel.name,
      price: hotel.totalPrice,
      distance: hotel.distance
    });
    try { task3Logger.logHotelSelection(hotel); } catch (e) { /* ignore */ }
  };

  const handleTransportSelect = (transport) => {
    setSelectedTransport(transport);
    log('transport_selected', {
      type: transport.type,
      price: transport.price
    });
    try { task3Logger.logTransportSelection(transport); } catch (e) { /* ignore */ }
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
    try { task3Logger.logMeetingDragStart(meetingId); } catch (e) { /* ignore */ }
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
    const meeting = meetings.find(m => m.id === meetingId);
    const { valid, reason } = validateSingleMeetingPlacement(meeting, day, hour, meetings);
    if (valid) {
      setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, scheduled: true, day, startTime: hour } : m));
      log('meeting_scheduled', { meeting: meeting?.title, day, startTime: hour });
      try { task3Logger.logMeetingDropAttempt(meetingId, day, hour, true); } catch (e) { /* ignore */ }
      // remove any prior validationErrors related to this meeting
      setValidationErrors(prev => prev.filter(msg => typeof msg === 'string' ? !msg.includes(meetingId) : true));
    } else {
      // Log failed attempt
      log('meeting_schedule_attempt_failed', { meetingId, day, hour, reason });
      try { task3Logger.logMeetingDropAttempt(meetingId, day, hour, false, reason); } catch (e) { /* ignore */ }
      try { task3Logger.incrementError(); } catch (e) { /* ignore */ }
      // show error to user by appending to validationErrors with meeting id so we can remove later
      setValidationErrors(prev => [...prev, `Failed to place meeting ${meetingId}: ${reason}`]);
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
    }
  };

  const handleComplete = () => {
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

  const runGuidedValidation = () => {
    const success = validateConstraints();
    log('adaptive_guided_validation', { success, loadState });
  };

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

  return (
    <PageContainer>
      <PageTitle>Plan Your Business Trip to Berlin</PageTitle>

      <AdaptiveNotice $load={loadState}>
        <NoticeHeader>
          <span>{loadTitle}</span>
          <span style={{ fontSize: '0.85rem', color: '#475569' }}>{loadState}</span>
        </NoticeHeader>
        <p style={{ marginTop: '0.35rem', fontSize: '0.9rem', color: '#475569' }}>{loadMessage}</p>
        {insights.length > 0 && (
          <InsightChips>
            {insights.map(insight => (
              <InsightChip key={insight.feature}>{insight.label}</InsightChip>
            ))}
          </InsightChips>
        )}
        <GuidedList>
          {guidedSteps.map(step => (
            <GuidedItem key={step.id} completed={step.completed}>
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
          />
        </MainContent>

        <Sidebar>
          <BudgetSummary
            flight={selectedOutboundFlight}
            returnFlight={selectedReturnFlight}
            hotel={selectedHotel}
            transport={selectedTransport}
            total={totalCost}
            remaining={remainingBudget}
            highlight={isHighLoad || remainingBudget < 0}
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