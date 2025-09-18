import styled from 'styled-components';

// ---------- Styled Components ----------

// Container for the whole hotel booking block
const HotelContainer = styled.div`
  background: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[5]};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.md};
  margin-bottom: ${props => props.theme.spacing[6]};
`;


const Th = styled.th`
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.gray[200]};
`;

const Tr = styled.tr`
  &.selected {
    background: ${props => props.theme.colors.gray[100]};
  }
`;

const Td = styled.td`
  padding: 0.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.gray[200]};
`;

// Button for selecting a hotel
const SelectButton = styled.button`
  background: ${props =>
    props.selected ? props.theme.colors.primary : props.theme.colors.gray[300]};
  color: ${props => (props.selected ? props.theme.colors.white : props.theme.colors.black)};
  padding: 0.4rem 0.8rem;
  border-radius: ${props => props.theme.borderRadius.md};
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover:enabled {
    background: ${props =>
      props.selected ? props.theme.colors.primaryDark : props.theme.colors.gray[400]};
  }

  &:disabled {
    background: ${props => props.theme.colors.gray[200]};
    cursor: not-allowed;
  }
`;

const Stars = styled.span`
  color: #ffc107;
  font-size: ${props => props.theme.fontSizes.sm};
`;

const Distance = styled.span`
  color: ${props =>
    props.distance > 5 ? props.theme.colors.danger : props.theme.colors.success};
  font-weight: ${props => (props.distance > 5 ? 'normal' : '600')};
`;

// ---------- Component ----------
const HotelBooking = ({ hotels, onHotelSelect, selectedHotel }) => {
  const renderStars = (count) => {
    return '★'.repeat(count) + ` (${count})`;
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
                <Stars>{renderStars(hotel.stars)}</Stars>
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
                  {selectedHotel?.id === hotel.id
                    ? 'Selected'
                    : (!hotel.within5km || !hotel.threeStarPlus)
                      ? 'Not Available'
                      : 'Select'}
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
