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

const TransportSelection = ({ options, selectedOption, onSelect, onTransportHoverStart, onTransportHoverEnd }) => {
  return (
    <Container>
      <Title>Select Transportation</Title>
      <OptionsGrid>
        {options.map(option => (
          <OptionCard
            key={option.id}
            selected={selectedOption?.id === option.id}
            onClick={() => onSelect(option)}
            onMouseEnter={() => { if (typeof onTransportHoverStart === 'function') onTransportHoverStart(option); }}
            onMouseLeave={() => { if (typeof onTransportHoverEnd === 'function') onTransportHoverEnd(option); }}
          >
            <OptionTitle>{option.type}</OptionTitle>
            <OptionPrice>${option.price}</OptionPrice>
            <OptionDescription>{option.description}</OptionDescription>
          </OptionCard>
        ))}
      </OptionsGrid>
    </Container>
  );
};

export default TransportSelection;