import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTaskProgress } from '../contexts/TaskProgressContext';
import useLogger from '../hooks/useLogger';
import { generateFlights, filterFlights } from '../data/flightService';
import { generateHotels } from '../data/hotelService';
import { meetings as initialMeetings } from '../data/meetingService';
import FlightBooking from '../components/travel/FlightBooking';
import HotelBooking from '../components/travel/HotelBooking';
import MeetingScheduler from '../components/travel/MeetingScheduler';
import BudgetSummary from '../components/travel/BudgetSummary';
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
  const [meetings, setMeetings] = useState(initialMeetings);
  
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  
  const [validationErrors, setValidationErrors] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Load initial data
    setFlights(generateFlights());
    setHotels(generateHotels());
    
    log('travel_dashboard_view');
  }, [log]);

  const totalCost = (selectedFlight?.price || 0) + (selectedHotel?.totalPrice || 0);
  const remainingBudget = 2200 - totalCost;

  const validateConstraints = () => {
    const errors = [];

    if (!selectedFlight) {
      errors.push('Please select a flight');
    } else {
      if (selectedFlight.type === 'outbound' && selectedFlight.arrivalTime.getHours() >= 15) {
        errors.push('Outbound flight must arrive before 3PM');
      }
      if (selectedFlight.type === 'return' && selectedFlight.departureTime.getHours() < 12) {
        errors.push('Return flight must depart after 12PM');
      }
    }

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

    const unscheduledMeetings = meetings.filter(m => !m.scheduled);
    if (unscheduledMeetings.length > 0) {
      errors.push(`Please schedule all meetings (${unscheduledMeetings.length} unscheduled)`);
    }

    if (remainingBudget < 0) {
      errors.push('Budget exceeded! Please choose less expensive options');
    }

    // Check meeting constraints
    meetings.forEach(meeting => {
      if (meeting.scheduled) {
        if (meeting.title.includes('Client') && ![2, 3].includes(meeting.day)) {
          errors.push('Client meeting must be on Day 2 or 3');
        }
        if (meeting.startTime < 9 || meeting.startTime + meeting.duration > 17) {
          errors.push('Meetings must be scheduled between 9AM-5PM');
        }
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleFlightSelect = (flight) => {
    setSelectedFlight(flight);
    log('flight_selected', {
      airline: flight.airline,
      price: flight.price,
      type: flight.type
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

  const handleFinalize = () => {
    if (validateConstraints()) {
      log('trip_finalized', {
        totalCost,
        remainingBudget,
        flight: selectedFlight,
        hotel: selectedHotel,
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
            flights={[...filteredOutboundFlights, ...filteredReturnFlights]}
            onFlightSelect={handleFlightSelect}
            selectedFlight={selectedFlight}
          />
          
          <HotelBooking
            hotels={hotels}
            onHotelSelect={handleHotelSelect}
            selectedHotel={selectedHotel}
          />
          
          <MeetingScheduler
            meetings={meetings}
            onMeetingSchedule={handleMeetingSchedule}
          />
        </MainContent>

        <Sidebar>
          <BudgetSummary
            flight={selectedFlight}
            hotel={selectedHotel}
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