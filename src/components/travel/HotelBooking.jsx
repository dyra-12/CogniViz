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

const AdaptiveHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing[3]};
`;

const BudgetPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: ${props => props.theme.colors.info}15;
  color: ${props => props.theme.colors.info};
  font-weight: 700;
  font-size: 0.85rem;
`;

const Hint = styled.div`
  margin-bottom: ${props => props.theme.spacing[3]};
  color: ${props => props.theme.colors.info};
  font-weight: 600;
`;

//////////
const Th = styled.th`
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.gray[200]};
`;

const Tr = styled.tr`
  &.selected {
    background: ${props => props.theme.colors.gray[100]};
  }
  opacity: ${props => props.$dimmed ? 0.45 : 1};
  pointer-events: ${props => props.$dimmed ? 'auto' : 'auto'};
  transition: opacity 0.2s ease;
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

const HotelConstraints = styled.div`
  margin-bottom: ${props => props.theme.spacing[4]};
  color: ${props => props.theme.colors.danger};
`;

const PinnedContext = styled.div`
  margin-bottom: ${props => props.theme.spacing[3]};
  padding: ${props => props.theme.spacing[3]};
  border: 1px dashed ${props => props.theme.colors.info};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.info}10;
  color: ${props => props.theme.colors.info};
  font-weight: 600;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const DeltaTag = styled.span`
  color: ${props => props.$over ? props.theme.colors.danger : props.theme.colors.success};
  font-weight: 700;
`;

// ---------- Component ----------
const HotelBooking = ({ hotels, onHotelSelect, selectedHotel, onHotelHoverStart, onHotelHoverEnd, onComponentEnter, adaptiveMode, remainingBudget = 0, projectedBudgetMap = {} }) => {
  const renderStars = (count) => {
    return '★'.repeat(count) + ` (${count})`;
  };

  const isAdaptive = Boolean(adaptiveMode);

  const tripWindow = 'Jan 15 - Jan 18';
  const showPinned = isAdaptive;
  const hint = adaptiveMode?.hint;

  return (
  <HotelContainer onMouseEnter={() => { if (typeof onComponentEnter === 'function') onComponentEnter('Hotels'); }}>
      <AdaptiveHeader>
        <h3>Book Your Hotel (3 nights)</h3>
        {isAdaptive && (
          <BudgetPill>
            Remaining: ${remainingBudget}
          </BudgetPill>
        )}
      </AdaptiveHeader>

      <HotelConstraints>
        <strong>Constraints:</strong> 3+ stars, within 5km of Conference Center
      </HotelConstraints>

      {showPinned && (
        <PinnedContext>
          <span>Stay window: {tripWindow}</span>
          <span>Current hotel cost: ${selectedHotel?.totalPrice || 0}</span>
          <span>Remaining budget: ${remainingBudget}</span>
          {remainingBudget < 0 && (
            <DeltaTag $over>
              {`Over by $${Math.abs(remainingBudget)}`}
            </DeltaTag>
          )}
        </PinnedContext>
      )}

      {hint && (
        <Hint>{hint}</Hint>
      )}

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
              $dimmed={isAdaptive && (projectedBudgetMap[hotel.id] || false)}
              onMouseEnter={() => { if (typeof onHotelHoverStart === 'function') onHotelHoverStart(hotel); }}
              onMouseLeave={() => { if (typeof onHotelHoverEnd === 'function') onHotelHoverEnd(hotel); }}
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
              <Td>
                ${hotel.totalPrice}
                {isAdaptive && projectedBudgetMap[hotel.id] && (
                  <DeltaTag $over style={{ marginLeft: 6 }}>
                    Over budget if selected
                  </DeltaTag>
                )}
              </Td>
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
