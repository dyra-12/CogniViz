import { useMemo } from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import { useCognitiveLoad } from '../contexts/CognitiveLoadContext';

const PanelWrapper = styled.aside`
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 320px;
  z-index: 120;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.15);
  border: 1px solid ${props => props.theme.colors.gray200};
  padding: 16px 20px;
  backdrop-filter: blur(8px);
  font-size: 0.9rem;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Title = styled.span`
  font-weight: 600;
  color: ${props => props.theme.colors.gray900};
`;

const StatusDot = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: ${props => props.theme.colors.gray600};

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.$color};
  }
`;

const LoadBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.85rem;
  background: ${props => props.$bg};
  color: ${props => props.$color};
`;

const BarGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 12px 0;
`;

const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BarLabel = styled.span`
  width: 52px;
  font-size: 0.78rem;
  color: ${props => props.theme.colors.gray600};
`;

const BarTrack = styled.div`
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: ${props => props.theme.colors.gray200};
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  width: ${props => props.$value}%;
  background: ${props => props.$color};
`;

const ShapList = styled.ul`
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  max-height: 140px;
  overflow: auto;
`;

const ShapItem = styled.li`
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  padding: 4px 0;
  color: ${props => props.theme.colors.gray700};

  span:first-child {
    font-weight: 500;
  }
`;

const Explanation = styled.p`
  font-size: 0.82rem;
  color: ${props => props.theme.colors.gray700};
  margin-top: 12px;
`;

const colorMap = {
  Low: { bg: 'rgba(16,185,129,0.15)', color: '#059669' },
  Medium: { bg: 'rgba(250,204,21,0.18)', color: '#B45309' },
  High: { bg: 'rgba(248,113,113,0.2)', color: '#B91C1C' },
  Calibrating: { bg: 'rgba(148,163,184,0.2)', color: '#475569' },
};

const statusColor = {
  online: '#22c55e',
  mock: '#3b82f6',
  connecting: '#f59e0b',
  reconnecting: '#f97316',
  offline: '#ef4444',
  unsupported: '#94a3b8',
};

const probabilityColors = {
  Low: '#22c55e',
  Medium: '#facc15',
  High: '#f87171',
};

const taskRoutes = ['/task1', '/task2', '/task3'];

const CognitiveLoadPanel = () => {
  const location = useLocation();
  const showPanel = taskRoutes.some((route) => location.pathname.startsWith(route));
  const {
    loadClass,
    probabilities = {},
    shap = [],
    explanation,
    transportState,
    hydrated,
  } = useCognitiveLoad();

  const badgePalette = colorMap[loadClass] || colorMap.Calibrating;
  const shapTop = useMemo(() => shap.slice(0, 3), [shap]);

  if (!showPanel) {
    return null;
  }

  return (
    <PanelWrapper>
      <HeaderRow>
        <Title>Cognitive Load</Title>
        <StatusDot $color={statusColor[transportState] || '#94a3b8'}>
          {transportState}
        </StatusDot>
      </HeaderRow>

      <LoadBadge $bg={badgePalette.bg} $color={badgePalette.color}>
        {hydrated ? loadClass : 'Calibrating'}
      </LoadBadge>

      <BarGroup>
        {Object.entries(probabilities).map(([label, value]) => (
          <BarRow key={label}>
            <BarLabel>{label}</BarLabel>
            <BarTrack>
              <BarFill $value={Math.round((value || 0) * 100)} $color={probabilityColors[label] || '#6366f1'} />
            </BarTrack>
            <span>{Math.round((value || 0) * 100)}%</span>
          </BarRow>
        ))}
      </BarGroup>

      {shapTop.length > 0 && (
        <ShapList>
          {shapTop.map((item) => (
            <ShapItem key={item.feature}>
              <span>{item.feature}</span>
              <span>{item.contribution.toFixed(2)}</span>
            </ShapItem>
          ))}
        </ShapList>
      )}

      <Explanation>{explanation}</Explanation>
    </PanelWrapper>
  );
};

export default CognitiveLoadPanel;
