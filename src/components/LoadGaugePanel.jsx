import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { subscribeToPredictions } from '../telemetry/wsClient';
import { getFeatureLabel } from '../sim/simPredict';

const PanelContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 360px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 9998;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const Title = styled.h3`
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const GaugeContainer = styled.div`
  margin-bottom: 20px;
`;

const GaugeLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
`;

const GaugeBar = styled.div`
  width: 100%;
  height: 32px;
  background: linear-gradient(to right, 
    #22c55e 0%, 
    #22c55e 33%, 
    #eab308 33%, 
    #eab308 66%, 
    #ef4444 66%, 
    #ef4444 100%
  );
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const GaugeIndicator = styled.div`
  position: absolute;
  top: 0;
  left: ${props => props.$position}%;
  width: 4px;
  height: 100%;
  background: white;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5), 0 0 4px rgba(0, 0, 0, 0.3);
  transition: left 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 8px solid white;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }
`;

const ClassBadge = styled.div`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  background: ${props => {
    if (props.$class === 'High') return '#ef4444';
    if (props.$class === 'Medium') return '#eab308';
    return '#22c55e';
  }};
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ContributorsSection = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
`;

const ContributorItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 6px;
  font-size: 13px;
`;

const ContributorName = styled.span`
  font-weight: 600;
  color: #334155;
`;

const ContributorValue = styled.span`
  font-weight: 500;
  color: #64748b;
  font-family: 'SF Mono', 'Monaco', monospace;
  font-size: 12px;
`;

const ExplanationBanner = styled.div`
  padding: 12px;
  background: ${props => {
    if (props.$class === 'High') return 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)';
    if (props.$class === 'Medium') return 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)';
    return 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
  }};
  border-left: 4px solid ${props => {
    if (props.$class === 'High') return '#ef4444';
    if (props.$class === 'Medium') return '#eab308';
    return '#22c55e';
  }};
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: #1e293b;
`;

const LoadGaugePanel = () => {
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToPredictions((data) => {
      setPrediction(data);
    });

    return unsubscribe;
  }, []);

  if (!prediction) {
    return (
      <PanelContainer>
        <Title>🔄 Cognitive Load Monitor</Title>
        <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
          Waiting for data...
        </div>
      </PanelContainer>
    );
  }

  const { probs, class: loadClass, shapTop, explanation } = prediction;
  const highProb = Math.round(probs.High * 100);
  const gaugePosition = probs.High * 100;

  return (
    <PanelContainer>
      <Title>
        📊 Cognitive Load Monitor
      </Title>

      <GaugeContainer>
        <GaugeLabel>
          <span>Load Probability (High)</span>
          <ClassBadge $class={loadClass}>{loadClass}</ClassBadge>
        </GaugeLabel>
        <GaugeBar>
          <GaugeIndicator $position={gaugePosition} />
        </GaugeBar>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '11px', 
          color: '#94a3b8',
          marginTop: '4px',
          fontWeight: 600
        }}>
          <span>LOW</span>
          <span>MEDIUM</span>
          <span>HIGH</span>
        </div>
      </GaugeContainer>

      <ContributorsSection>
        <SectionTitle>Top Contributors</SectionTitle>
        {shapTop.map((contributor, idx) => (
          <ContributorItem key={contributor.feature}>
            <ContributorName>
              {idx + 1}. {getFeatureLabel(contributor.feature)}
            </ContributorName>
            <ContributorValue>
              {contributor.value.toFixed(2)}
            </ContributorValue>
          </ContributorItem>
        ))}
      </ContributorsSection>

      <ExplanationBanner $class={loadClass}>
        {explanation}
      </ExplanationBanner>
    </PanelContainer>
  );
};

export default LoadGaugePanel;
