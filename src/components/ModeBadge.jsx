import styled from 'styled-components';
import { useEffect, useState } from 'react';

const BadgeContainer = styled.div`
  position: fixed;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 9999;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const ModeBadge = () => {
  const [mode, setMode] = useState('simulation');

  useEffect(() => {
    const cogLoadMode = import.meta.env.VITE_COG_LOAD_MODE || 'simulation';
    setMode(cogLoadMode);
    
    const debugEnabled = import.meta.env.VITE_ENABLE_DEBUG_TELEMETRY === 'true';
    if (debugEnabled) {
      console.log('[ModeBadge] VITE_COG_LOAD_MODE:', cogLoadMode);
      console.log('[ModeBadge] VITE_ENABLE_DEBUG_TELEMETRY:', debugEnabled);
    }
  }, []);

  const isLive = mode === 'live';
  const icon = isLive ? '🔵' : '🟠';
  const label = isLive ? 'Live' : 'Simulation';

  return (
    <BadgeContainer>
      <span>{icon}</span>
      <span>{label}</span>
    </BadgeContainer>
  );
};

export default ModeBadge;
