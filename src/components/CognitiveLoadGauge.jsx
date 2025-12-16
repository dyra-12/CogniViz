import React from 'react';
import { useCognitiveLoad } from '../contexts/CognitiveLoadContext';
import './CognitiveLoadGauge.css';

export default function CognitiveLoadGauge() {
  const { loadLevel } = useCognitiveLoad();

  return (
    <div className="cognitive-load-gauge">
      <div className="gauge-label">Cognitive Load</div>
      <div className={`gauge-indicator ${loadLevel.toLowerCase()}`}>
        <div className="gauge-bar">
          <div className={`gauge-fill ${loadLevel.toLowerCase()}`}></div>
        </div>
        <div className="gauge-text">{loadLevel}</div>
      </div>
    </div>
  );
}
