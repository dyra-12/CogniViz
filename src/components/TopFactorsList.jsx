import React from 'react';
import { useCognitiveLoad } from '../contexts/CognitiveLoadContext';
import './TopFactorsList.css';

export default function TopFactorsList() {
  const { topFactors, metrics } = useCognitiveLoad();

  if (!topFactors || topFactors.length === 0) {
    return null;
  }

  return (
    <div className="top-factors-list">
      <div className="factors-header">Top Contributing Factors</div>
      <div className="factors-items">
        {topFactors.map((factor, index) => {
          const metricValue = metrics[factor];
          const trend = metricValue > 0.5 ? 'up' : 'down';
          
          return (
            <div key={index} className="factor-item">
              <span className="factor-name">{factor}</span>
              <span className={`factor-trend ${trend}`}>
                {trend === 'up' ? '↑' : '↓'}
              </span>
              {metricValue !== undefined && (
                <span className="factor-value">
                  {(metricValue * 100).toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
