import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTaskProgress } from '../contexts/TaskProgressContext';
import useLogger from '../hooks/useLogger';
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

const Task3 = () => {
  const { completeCurrentTask } = useTaskProgress();
  const { log } = useLogger();
  
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
  }, [log]);

  const totalCost = (selectedOutboundFlight?.price || 0) + 
                   (selectedReturnFlight?.price || 0) + 
                   (selectedHotel?.totalPrice || 0) + 
                   (selectedTransport?.price || 0);

  const remainingBudget = 1000 - totalCost;

  const handleOutboundFlightSelect = (flight) => {
    setSelectedOutboundFlight(flight);
    log('outbound_flight_selected', {
      airline: flight.airline,
      price: flight.price,
      arrivalTime: flight.arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    });
  };

  const handleReturnFlightSelect = (flight) => {
    setSelectedReturnFlight(flight);
    log('return_flight_selected', {
      airline: flight.airline,
      price: flight.price,
      departureTime: flight.departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    });
  };

  const handleHotelSelect = (hotel) => {
    setSelectedHotel(hotel);
    log('hotel_selected', {
      name: hotel.name,
      price: hotel.totalPrice,
      distance: hotel.distance
    });
  };

  const handleTransportSelect = (transport) => {
    setSelectedTransport(transport);
    log('transport_selected', {
      type: transport.type,
      price: transport.price
    });
  };

  const handleMeetingSchedule = (meetingId, day, hour) => {
    setMeetings(prev => prev.map(meeting => 
      meeting.id === meetingId 
        ? { ...meeting, scheduled: true, day, startTime: hour }
        : meeting
    ));
    
    const meeting = meetings.find(m => m.id === meetingId);
    log('meeting_scheduled', {
      meeting: meeting.title,
      day,
      startTime: hour
    });
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
      setIsCompleted(true);
    } else {
      log('trip_finalize_failed', { errors: validationErrors });
    }
  };

  const handleComplete = () => {
    completeCurrentTask();
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

      <Layout>
        <MainContent>
          <FlightBooking
            flights={filteredOutboundFlights}
            onFlightSelect={handleOutboundFlightSelect}
            selectedFlight={selectedOutboundFlight}
            title="Outbound Flight (NY → Berlin)"
            constraint="Must arrive before 15:00 on the same day"
          />
          
          <FlightBooking
            flights={filteredReturnFlights}
            onFlightSelect={handleReturnFlightSelect}
            selectedFlight={selectedReturnFlight}
            title="Return Flight (Berlin → NY)"
            constraint="Must depart after 12:00 on Day 4"
          />
          
          <HotelBooking
            hotels={hotels}
            onHotelSelect={handleHotelSelect}
            selectedHotel={selectedHotel}
          />
          
          <TransportSelection
            options={transportOptions}
            selectedOption={selectedTransport}
            onSelect={handleTransportSelect}
          />
          
          <MeetingScheduler
            meetings={meetings}
            onMeetingSchedule={handleMeetingSchedule}
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