import styled from 'styled-components';

const BudgetContainer = styled.div`
  background: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[3]};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.$highlighted ? '0 8px 20px rgba(72, 149, 239, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.08)'};
  border: 2px solid ${props => props.$highlighted ? props.theme.colors.info : 'transparent'};
  position: sticky;
  top: ${props => props.$variant === 'inline' ? props.theme.spacing[2] : props.theme.spacing[4]};
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  z-index: ${props => props.$variant === 'inline' ? 15 : 'auto'};
  max-width: ${props => props.$variant === 'inline' ? '420px' : 'auto'};
  width: ${props => props.$variant === 'inline' ? '100%' : 'auto'};
  margin-left: ${props => props.$variant === 'inline' ? 'auto' : '0'};
  margin-right: ${props => props.$variant === 'inline' ? 'auto' : '0'};
`;

const BudgetItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing[2]};
  padding: ${props => props.theme.spacing[1]} ${props => props.theme.spacing[2]};
  border-bottom: 1px solid ${props => props.theme.colors.gray200};
  background: ${props => props.$emphasized ? `${props.theme.colors.danger}10` : 'transparent'};
  border-left: ${props => props.$emphasized ? `3px solid ${props.theme.colors.danger}` : 'none'};
  font-size: ${props => props.theme.fontSizes.sm};
`;

const Total = styled(BudgetItem)`
  font-weight: 600;
  font-size: ${props => props.theme.fontSizes.md};
  border-bottom: 2px solid ${props => props.theme.colors.gray300};
`;

const Remaining = styled(BudgetItem)`
  font-weight: 600;
  color: ${props => props.remaining < 0 ? props.theme.colors.danger : props.theme.colors.success};
  font-size: ${props => props.theme.fontSizes.md};
`;

const DeltaTag = styled.span`
  margin-left: ${props => props.theme.spacing[1]};
  color: ${props => props.$increase ? props.theme.colors.danger : props.theme.colors.success};
  font-weight: 700;
  font-size: 0.8rem;
`;

const BudgetSummary = ({
  flight,
  returnFlight,
  hotel,
  transport,
  total,
  remaining,
  highlight = false,
  deltas = {},
  variant = 'sidebar',
  emphasizedKeys = [],
  inlineHint = ''
}) => {
  const emphasizeSet = new Set(emphasizedKeys || []);

  const formatDelta = (value) => {
    if (typeof value !== 'number' || value === 0) return null;
    const increase = value > 0;
    const dollars = Math.abs(value).toLocaleString();
    return (
      <DeltaTag $increase={increase}>
        {increase ? '+' : '−'}${dollars}
      </DeltaTag>
    );
  };

  const totalDelta = (deltas.outboundFlight || 0) + (deltas.returnFlight || 0) + (deltas.hotel || 0) + (deltas.transport || 0);

  return (
    <BudgetContainer $highlighted={highlight} $variant={variant}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', marginBottom: '0.75rem' }}>
        Budget Summary
        {variant === 'inline' && (
          <span style={{ fontSize: '0.7rem', color: '#4895ef', fontWeight: 700 }}>
            Pinned while resolving overrun
          </span>
        )}
      </h3>
      
      <BudgetItem $emphasized={emphasizeSet.has('outboundFlight')}>
        <span>Outbound Flight:</span>
        <span>
          {flight ? `$${flight.price}` : 'Not selected'}
          {formatDelta(deltas.outboundFlight)}
        </span>
      </BudgetItem>

      <BudgetItem $emphasized={emphasizeSet.has('returnFlight')}>
        <span>Return Flight:</span>
        <span>
          {returnFlight ? `$${returnFlight.price}` : 'Not selected'}
          {formatDelta(deltas.returnFlight)}
        </span>
      </BudgetItem>
      
      <BudgetItem $emphasized={emphasizeSet.has('hotel')}>
        <span>Hotel (3 nights):</span>
        <span>
          {hotel ? `$${hotel.totalPrice}` : 'Not selected'}
          {formatDelta(deltas.hotel)}
        </span>
      </BudgetItem>
      
      <BudgetItem $emphasized={emphasizeSet.has('transport')}>
        <span>Transportation:</span>
        <span>
          {transport ? `$${transport.price}` : 'Not selected'}
          {formatDelta(deltas.transport)}
        </span>
      </BudgetItem>
      
      <Total>
        <span>Total Cost:</span>
        <span>
          ${total}
          {formatDelta(totalDelta)}
        </span>
      </Total>
      
      <Remaining remaining={remaining}>
        <span>Remaining Budget:</span>
        <span>${remaining}</span>
      </Remaining>
      
      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#666' }}>
        Total Budget: $1,380
      </div>
      {(highlight || inlineHint) && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: '#4895ef',
          fontWeight: 600
        }}>
          {inlineHint || 'Keep an eye here - going over budget is driving load up.'}
        </div>
      )}
    </BudgetContainer>
  );
};

export default BudgetSummary;