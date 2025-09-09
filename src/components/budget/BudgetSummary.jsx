import styled from 'styled-components';
import Button from '../Button';

const SummaryPanel = styled.div`
  background: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[6]};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.md};
  margin-bottom: ${props => props.theme.spacing[6]};
`;

const SummaryTitle = styled.h3`
  margin-bottom: ${props => props.theme.spacing[5]};
  color: ${props => props.theme.colors.dark};
  text-align: center;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing[5]};
  margin-bottom: ${props => props.theme.spacing[5]};
`;

const SummaryItem = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing[4]};
  background: ${props => props.theme.colors.gray100};
  border-radius: ${props => props.theme.borderRadius.lg};
`;

const SummaryLabel = styled.div`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.gray600};
  margin-bottom: ${props => props.theme.spacing[2]};
  font-weight: 600;
`;

const SummaryValue = styled.div`
  font-size: ${props => props.theme.fontSizes.xl};
  font-weight: 700;
  color: ${props => props.negative ? props.theme.colors.danger : props.theme.colors.primary};
`;

const SuccessMessage = styled.div`
  background: ${props => props.theme.colors.success}15;
  color: ${props => props.theme.colors.success};
  padding: ${props => props.theme.spacing[4]};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.success}30;
  text-align: center;
  margin-top: ${props => props.theme.spacing[4]};
`;

const BudgetSummary = ({ allocations, constraints, onReset }) => {
  const totalAllocated = Object.values(allocations).reduce((sum, amount) => sum + amount, 0);
  const remainingBudget = 10000 - totalAllocated;
  const allConstraintsMet = constraints.every(constraint => constraint.check(allocations));

  return (
    <SummaryPanel>
      <SummaryTitle>Budget Summary</SummaryTitle>
      
      <SummaryGrid>
        <SummaryItem>
          <SummaryLabel>Total Budget</SummaryLabel>
          <SummaryValue>$10,000</SummaryValue>
        </SummaryItem>
        
        <SummaryItem>
          <SummaryLabel>Total Allocated</SummaryLabel>
          <SummaryValue>${totalAllocated.toLocaleString()}</SummaryValue>
        </SummaryItem>
        
        <SummaryItem>
          <SummaryLabel>Remaining Budget</SummaryLabel>
          <SummaryValue negative={remainingBudget < 0}>
            ${remainingBudget.toLocaleString()}
          </SummaryValue>
        </SummaryItem>
      </SummaryGrid>

      {allConstraintsMet ? (
        <SuccessMessage>
          <h4>✅ All constraints satisfied!</h4>
          <p>Your budget plan is ready to be submitted.</p>
          <Button onClick={() => alert('Budget plan submitted successfully!')}>
            Submit Budget Plan
          </Button>
        </SuccessMessage>
      ) : (
        <div style={{ textAlign: 'center', color: '#6c757d' }}>
          <p>Adjust allocations to meet all constraints.</p>
          <Button variant="outline" onClick={onReset}>
            Reset Allocations
          </Button>
        </div>
      )}
    </SummaryPanel>
  );
};

export default BudgetSummary;