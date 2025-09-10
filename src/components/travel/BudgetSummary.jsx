import styled from 'styled-components';

const BudgetContainer = styled.div`
  background: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[5]};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.md};
  margin-bottom: ${props => props.theme.spacing[6]};
  position: sticky;
  top: ${props => props.theme.spacing[4]};
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

const BudgetSummary = ({ flight, hotel, total, remaining }) => {
  return (
    <BudgetContainer>
      <h3>Budget Summary</h3>
      
      <BudgetItem>
        <span>Flight:</span>
        <span>{flight ? `$${flight.price}` : 'Not selected'}</span>
      </BudgetItem>
      
      <BudgetItem>
        <span>Hotel (3 nights):</span>
        <span>{hotel ? `$${hotel.totalPrice}` : 'Not selected'}</span>
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
        Total Budget: $2,200
      </div>
    </BudgetContainer>
  );
};

export default BudgetSummary;