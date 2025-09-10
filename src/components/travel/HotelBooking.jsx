import styled from 'styled-components';

// Define all the required styled components locally
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: ${props => props.theme.colors.gray300};
    color: ${props => props.theme.colors.gray600};
    border-color: ${props => props.theme.colors.gray400};
  }
`;

const HotelContainer = styled.div`
  background: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[5]};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.md};
  margin-bottom: ${props => props.theme.spacing[6]};
`;

const Stars = styled.span`
  color: #ffc107;
  font-size: ${props => props.theme.fontSizes.sm};
`;

const Distance = styled.span`
  color: ${props => props.distance > 5 ? props.theme.colors.danger : props.theme.colors.success};
  font-weight: ${props => props.distance > 5 ? 'normal' : '600'};
`;

const HotelBooking = ({ hotels, onHotelSelect, selectedHotel }) => {
  const renderStars = (count) => {
    return '★'.repeat(count);
  };

  return (
    <HotelContainer>
      <h3>Book Your Hotel (3 nights)</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Constraints:</strong> 3+ stars, within 5km of Conference Center
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr>
            <Th>Hotel</Th>
            <Th>Stars</Th>
            <Th>Distance</Th>
            <Th>Price/Night</Th>
            <Th>Total</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody>
          {hotels.map(hotel => (
            <Tr 
              key={hotel.id} 
              className={selectedHotel?.id === hotel.id ? 'selected' : ''}
            >
              <Td>{hotel.name}</Td>
              <Td>
                <Stars>{renderStars(hotel.stars)}</Stars> ({hotel.stars})
              </Td>
              <Td>
                <Distance distance={hotel.distance}>
                  {hotel.distance} km
                  {hotel.distance > 5 && ' (Too far!)'}
                </Distance>
              </Td>
              <Td>${hotel.pricePerNight}</Td>
              <Td>${hotel.totalPrice}</Td>
              <Td>
                <SelectButton
                  selected={selectedHotel?.id === hotel.id}
                  onClick={() => onHotelSelect(hotel)}
                  disabled={!hotel.within5km || !hotel.threeStarPlus}
                >
                  {selectedHotel?.id === hotel.id ? 'Selected' : 
                   (!hotel.within5km || !hotel.threeStarPlus) ? 'Not Available' : 'Select'}
                </SelectButton>
              </Td>
            </Tr>
          ))}
        </tbody>
      </table>
    </HotelContainer>
  );
};

export default HotelBooking;