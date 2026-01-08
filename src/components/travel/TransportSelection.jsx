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

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing[4]};
`;

const OptionCard = styled.div`
  border: 2px solid ${props => props.selected ? props.theme.colors.primary : props.theme.colors.gray300};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing[4]};
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.selected ? props.theme.colors.primary + '15' : props.theme.colors.white};
  box-shadow: ${props => props.$anchored ? `0 0 0 3px ${props.theme.colors.primary}20` : 'none'};
  opacity: ${props => props.$muted ? 0.55 : 1};
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-2px);
  }
`;

const OptionTitle = styled.h4`
  margin-bottom: ${props => props.theme.spacing[2]};
  color: ${props => props.selected ? props.theme.colors.primary : props.theme.colors.dark};
`;

const OptionPrice = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing[2]};
`;

const OptionDescription = styled.p`
  color: ${props => props.theme.colors.gray700};
  font-size: ${props => props.theme.fontSizes.sm};
`;
const AnchorPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${props => props.theme.colors.primary}15;
  color: ${props => props.theme.colors.primary};
  font-size: 0.7rem;
  font-weight: 700;
  border: 1px solid ${props => props.theme.colors.primary}40;
  margin-top: ${props => props.theme.spacing[1]};
`;

const StabilizeHint = styled.div`
  font-size: 0.72rem;
  color: ${props => props.theme.colors.gray700};
  margin-top: 6px;
`;

const TransportSelection = ({ options, selectedOption, onSelect, onTransportHoverStart, onTransportHoverEnd, onComponentEnter, adaptiveMode }) => {
  return (
    <Container onMouseEnter={() => { if (typeof onComponentEnter === 'function') onComponentEnter('Transportation'); }}>
      <Title>Select Transportation</Title>
      <OptionsGrid>
        {options.map(option => (
          <OptionCard
            key={option.id}
            selected={selectedOption?.id === option.id}
            $anchored={adaptiveMode?.showAnchors && adaptiveMode?.anchoredId && selectedOption?.id === adaptiveMode.anchoredId}
            $muted={Array.isArray(adaptiveMode?.focusTargets) && adaptiveMode.focusTargets.length > 0 && !adaptiveMode.focusTargets.includes('transport')}
            onClick={() => onSelect(option)}
            onMouseEnter={() => { if (typeof onTransportHoverStart === 'function') onTransportHoverStart(option); }}
            onMouseLeave={() => { if (typeof onTransportHoverEnd === 'function') onTransportHoverEnd(option); }}
          >
            <OptionTitle>{option.type}</OptionTitle>
            <OptionPrice>${option.price}</OptionPrice>
            <OptionDescription>{option.description}</OptionDescription>
            {adaptiveMode?.showAnchors && adaptiveMode?.anchoredId && selectedOption?.id === adaptiveMode.anchoredId && (
              <>
                <AnchorPill>Anchored choice</AnchorPill>
                {adaptiveMode?.stabilizing && (
                  <StabilizeHint>Brief pause reduces rapid switching.</StabilizeHint>
                )}
              </>
            )}
          </OptionCard>
        ))}
      </OptionsGrid>
    </Container>
  );
};

export default TransportSelection;