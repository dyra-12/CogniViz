import React from 'react';
import { useCognitiveLoad } from '../contexts/CognitiveLoadContext';
import './ModeBadge.css';

export default function ModeBadge() {
  const { mode, setMode } = useCognitiveLoad();

  const toggleMode = () => {
    setMode(mode === 'LIVE' ? 'DEMO' : 'LIVE');
  };

  return (
    <div className={`mode-badge ${mode.toLowerCase()}`} onClick={toggleMode} role="button" tabIndex={0}>
      <span className="mode-label">{mode}</span>
    </div>
  );
}
