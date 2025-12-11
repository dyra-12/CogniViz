import styled from 'styled-components';

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing[2]};
  padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[6]};
  font-family: ${props => props.theme.fonts.body};
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: 500;
  line-height: 1;
  border: none;
  border-radius: ${props => props.theme.borderRadius.lg};
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => {
    switch (props.$variant) {
      case 'secondary': return props.theme.colors.secondary;
      case 'outline': return 'transparent';
      default: return props.theme.colors.primary;
    }
  }};
  color: ${props => {
    switch (props.$variant) {
      case 'outline': return props.theme.colors.primary;
      default: return props.theme.colors.white;
    }
  }};
  border: ${props => props.$variant === 'outline' ? `2px solid ${props.theme.colors.primary}` : 'none'};
  box-shadow: ${props => props.$variant === 'outline' ? 'none' : props.theme.shadows.md};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.lg};
    background-color: ${props => {
      if (props.$variant === 'outline') return props.theme.colors.primary;
      return props.theme.colors.info;
    }};
    color: ${props => props.theme.colors.white};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Button = ({ children, variant = 'primary', ...props }) => {
  return (
    <StyledButton $variant={variant} {...props}>
      {children}
    </StyledButton>
  );
};

export default Button;