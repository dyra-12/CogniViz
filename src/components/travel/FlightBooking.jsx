import styled from 'styled-components';

const Container = styled.div`
  background: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[5]};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.md};
  margin-bottom: ${props => props.theme.spacing[6]};
`;

const Title = styled.h3`
  margin-bottom: ${props => props.theme.spacing[2]};
  color: ${props => props.theme.colors.dark};
`;

const Constraint = styled.div`
  margin-bottom: ${props => props.theme.spacing[4]};
  color: ${props => props.highlight ? props.theme.colors.danger : props.theme.colors.gray600};
  font-style: italic;
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

const FlightBooking = ({ flights, onFlightSelect, selectedFlight, title, constraint, onFlightHoverStart, onFlightHoverEnd, onComponentEnter }) => {
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDuration = (hours) => {
    const hoursInt = Math.floor(hours);
    const minutes = Math.floor((hours % 1) * 60);
    return `${hoursInt}h ${minutes}m`;
  };

  const highlight = constraint && (
    constraint.includes('Must arrive before 15:00') ||
    constraint.includes('Must depart after 12:00 and arrive the next day')
  );

  return (
  <Container onMouseEnter={() => { if (typeof onComponentEnter === 'function') onComponentEnter('Flights'); }}>
      <Title>{title}</Title>
      <Constraint highlight={highlight}>{constraint}</Constraint>

      <Table>
        <thead>
          <tr>
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
              onMouseEnter={() => { if (typeof onFlightHoverStart === 'function') onFlightHoverStart(flight); }}
              onMouseLeave={() => { if (typeof onFlightHoverEnd === 'function') onFlightHoverEnd(flight); }}
            >
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