import React from 'react';
import styled from 'styled-components';
import { useCognitiveLoad } from '../contexts/CognitiveLoadContext';

const Panel = styled.aside`
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 90;
  background: ${props => props.theme.colors.white};
  border: 1px solid ${props => props.theme.colors.gray200};
  padding: ${props => props.theme.spacing[3]};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.md};
  width: 220px;
  font-size: ${props => props.theme.fontSizes.sm};
`;

const Title = styled.div`
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing[2]};
`;

const CognitiveLoadPanel = () => {
  const { loadClass, shap, hydrated } = useCognitiveLoad();
  return (
    <Panel aria-live="polite">
      <Title>Cognitive Load</Title>
      <div>Status: {hydrated ? loadClass : 'Calibrating'}</div>
      {shap && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>Top features:</div>
          <ul style={{ paddingLeft: '16px', marginTop: '6px' }}>
            {Object.entries(shap).slice(0,3).map(([k,v]) => (
              <li key={k}>{k}: {Number(v).toFixed(2)}</li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
};

export default CognitiveLoadPanel;
