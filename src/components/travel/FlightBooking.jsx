import styled from 'styled-components';

const Container = styled.div`
  background: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[5]};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.md};
  margin-bottom: ${props => props.theme.spacing[6]};
`;

const Title = styled.h3`
  margin-bottom: ${props => props.theme.spacing[4]};
  color: ${props => props.theme.colors.dark};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${props => props.theme.fontSizes.sm};
`;

const Th = styled.th`
  text-align: left;
  padding: ${props => props.theme.spacing[3]};
  background: ${props => props.theme.colors.gray100};
  border-bottom: 2px solid ${props => props.theme.colors.gray300};
  font-weight: 600;
`;

const Td = styled.td`
  padding: ${props => props.theme.spacing[3]};
  border-bottom: 1px solid ${props => props.theme.colors.gray200};
`;

const Tr = styled.tr`
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.gray50};
  }
  
  &.selected {
    background: ${props => props.theme.colors.primary}15;
    border: 2px solid ${props => props.theme.colors.primary};
  }
`;

const SelectButton = styled.button`
  padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
  background: ${props => props.selected ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.selected ? props.theme.colors.white : props.theme.colors.primary};
  border: 1px solid ${props => props.theme.colors.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.white};
  }
`;

const FlightBooking = ({ flights, onFlightSelect, selectedFlight }) => {
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (hours) => {
    return `${Math.floor(hours)}h ${Math.floor((hours % 1) * 60)}m`;
  };

  return (
    <Container>
      <Title>Book Your Flight (NY → Berlin → NY)</Title>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Constraints:</strong> Outbound must arrive before 3PM Day 1, Return must depart after 12PM Day 4
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Type</Th>
            <Th>Airline</Th>
            <Th>Departure</Th>
            <Th>Arrival</Th>
            <Th>Duration</Th>
            <Th>Stops</Th>
            <Th>Price</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody>
          {flights.map(flight => (
            <Tr 
              key={flight.id} 
              className={selectedFlight?.id === flight.id ? 'selected' : ''}
            >
              <Td>{flight.type === 'outbound' ? 'Outbound' : 'Return'}</Td>
              <Td>{flight.airline}</Td>
              <Td>{formatTime(flight.departureTime)}</Td>
              <Td>{formatTime(flight.arrivalTime)}</Td>
              <Td>{formatDuration(flight.duration)}</Td>
              <Td>{flight.stops}</Td>
              <Td>${flight.price}</Td>
              <Td>
                <SelectButton
                  selected={selectedFlight?.id === flight.id}
                  onClick={() => onFlightSelect(flight)}
                >
                  {selectedFlight?.id === flight.id ? 'Selected' : 'Select'}
                </SelectButton>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default FlightBooking;