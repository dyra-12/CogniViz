import React from 'react';
import { useCognitiveLoad } from '../contexts/CognitiveLoadContext';
import './ExplanationBanner.css';

export default function ExplanationBanner() {
  const { explanation, loadLevel } = useCognitiveLoad();

  return (
    <div className={`explanation-banner ${loadLevel.toLowerCase()}`}>
      <div className="explanation-icon">
        {loadLevel === 'LOW' && '✓'}
        {loadLevel === 'MEDIUM' && '⚠'}
        {loadLevel === 'HIGH' && '⚠'}
      </div>
      <div className="explanation-text">{explanation}</div>
    </div>
  );
}
