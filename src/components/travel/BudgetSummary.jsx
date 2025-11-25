import styled from 'styled-components';

const BudgetContainer = styled.div`
  background: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[5]};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.$highlighted ? '0 18px 38px rgba(72, 149, 239, 0.25)' : props.theme.shadows.md};
  border: 2px solid ${props => props.$highlighted ? props.theme.colors.info : 'transparent'};
  margin-bottom: ${props => props.theme.spacing[6]};
  position: sticky;
  top: ${props => props.theme.spacing[4]};
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
`;

const BudgetItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing[3]};
  padding: ${props => props.theme.spacing[2]};
  border-bottom: 1px solid ${props => props.theme.colors.gray200};
`;

const Total = styled(BudgetItem)`
  font-weight: 600;
  font-size: ${props => props.theme.fontSizes.lg};
  border-bottom: 2px solid ${props => props.theme.colors.gray300};
`;

const Remaining = styled(BudgetItem)`
  font-weight: 600;
  color: ${props => props.remaining < 0 ? props.theme.colors.danger : props.theme.colors.success};
  font-size: ${props => props.theme.fontSizes.lg};
`;

const BudgetSummary = ({ flight, hotel, transport, total, remaining, highlight = false }) => {
  return (
    <BudgetContainer $highlighted={highlight}>
      <h3>Budget Summary</h3>
      
      <BudgetItem>
        <span>Flight:</span>
        <span>{flight ? `$${flight.price}` : 'Not selected'}</span>
      </BudgetItem>
      
      <BudgetItem>
        <span>Hotel (3 nights):</span>
        <span>{hotel ? `$${hotel.totalPrice}` : 'Not selected'}</span>
      </BudgetItem>
      
      <BudgetItem>
        <span>Transportation:</span>
        <span>{transport ? `$${transport.price}` : 'Not selected'}</span>
      </BudgetItem>
      
      <Total>
        <span>Total Cost:</span>
        <span>${total}</span>
      </Total>
      
      <Remaining remaining={remaining}>
        <span>Remaining Budget:</span>
        <span>${remaining}</span>
      </Remaining>
      
      <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
        Total Budget: $1,380
      </div>
      {highlight && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.85rem',
          color: '#4895ef',
          fontWeight: 600
        }}>
          Keep an eye here—going over budget is driving load up.
        </div>
      )}
    </BudgetContainer>
  );
};

export default BudgetSummary;