const resolveMode = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_COG_LOAD_MODE) {
      return import.meta.env.VITE_COG_LOAD_MODE;
    }
  } catch {
    // ignore SSR differences
  }
  if (typeof process !== 'undefined' && process?.env?.VITE_COG_LOAD_MODE) {
    return process.env.VITE_COG_LOAD_MODE;
  }
  return '';
};
import styled from 'styled-components';

const Badge = styled.div`
  position: fixed;
  top: 16px;
  right: 20px;
  z-index: 200;
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing[2]};
  padding: ${props => props.theme.spacing[1]} ${props => props.theme.spacing[3]};
  border-radius: 999px;
  font-weight: 600;
  font-size: ${props => props.theme.fontSizes.sm};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${props => props.$variant === 'simulation' ? '#5f3207' : '#053255'};
  background: ${props => props.$variant === 'simulation'
    ? 'linear-gradient(120deg, rgba(255,210,149,0.95), rgba(255,175,97,0.9))'
    : 'linear-gradient(120deg, rgba(147,197,253,0.95), rgba(59,130,246,0.9))'};
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.15);
  pointer-events: none;
`;

const ModeBadge = () => {
  const rawMode = resolveMode().toString().toLowerCase();
  const isSimulation = rawMode.includes('sim');
  const variant = isSimulation ? 'simulation' : 'live';
  const emoji = isSimulation ? '🟠' : '🔵';
  const label = isSimulation ? 'Simulation Mode' : 'Live Mode';

  return (
    <Badge $variant={variant} aria-live="polite">
      <span>{emoji}</span>
      <span>{label}</span>
    </Badge>
  );
};

export default ModeBadge;
