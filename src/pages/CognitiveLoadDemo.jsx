import React, { useState } from 'react';
import { CognitiveLoadProvider, useCognitiveLoad } from '../contexts/CognitiveLoadContext';
import CognitiveLoadGauge from '../components/CognitiveLoadGauge';
import ExplanationBanner from '../components/ExplanationBanner';
import TopFactorsList from '../components/TopFactorsList';
import './CognitiveLoadDemo.css';

function CognitiveLoadDemoContent() {
  const { loadLevel, setLoadLevel, updateState } = useCognitiveLoad();

  const setLow = () => {
    updateState({
      loadLevel: 'LOW',
      metrics: {
        'Mouse Speed': 0.3,
        'Click Rate': 0.2,
        'Idle Time': 0.8
      },
      topFactors: ['Idle Time', 'Mouse Speed'],
      explanation: 'User is relaxed with low interaction frequency and high idle time.'
    });
  };

  const setMedium = () => {
    updateState({
      loadLevel: 'MEDIUM',
      metrics: {
        'Mouse Speed': 0.6,
        'Click Rate': 0.5,
        'Scroll Velocity': 0.7
      },
      topFactors: ['Scroll Velocity', 'Mouse Speed', 'Click Rate'],
      explanation: 'Moderate activity detected with increased scrolling and mouse movement.'
    });
  };

  const setHigh = () => {
    updateState({
      loadLevel: 'HIGH',
      metrics: {
        'Mouse Speed': 0.9,
        'Click Rate': 0.85,
        'Scroll Velocity': 0.95,
        'Error Rate': 0.8
      },
      topFactors: ['Scroll Velocity', 'Mouse Speed', 'Error Rate'],
      explanation: 'High cognitive load detected: rapid clicking, fast scrolling, and increased errors.'
    });
  };

  return (
    <div className="cognitive-load-demo">
      <div className="demo-header">
        <h1>Cognitive Load Monitoring System</h1>
        <p>Demo: Verify that UI updates instantly when load level changes</p>
      </div>

      <div className="demo-controls">
        <button 
          className={`control-btn low ${loadLevel === 'LOW' ? 'active' : ''}`}
          onClick={setLow}
        >
          Set LOW
        </button>
        <button 
          className={`control-btn medium ${loadLevel === 'MEDIUM' ? 'active' : ''}`}
          onClick={setMedium}
        >
          Set MEDIUM
        </button>
        <button 
          className={`control-btn high ${loadLevel === 'HIGH' ? 'active' : ''}`}
          onClick={setHigh}
        >
          Set HIGH
        </button>
      </div>

      <div className="demo-display">
        <CognitiveLoadGauge />
        <ExplanationBanner />
        <TopFactorsList />
      </div>
    </div>
  );
}

export default function CognitiveLoadDemo() {
  return (
    <CognitiveLoadProvider>
      <CognitiveLoadDemoContent />
    </CognitiveLoadProvider>
  );
}
