import React from 'react';
import styled from 'styled-components';
import { buildTlxPayload, saveTlxToLocal } from '../utils/tlx';

const Container = styled.div`
  width: 100%;
  background: ${p => p.theme.colors.white};
  border-radius: ${p => p.theme.borderRadius.lg};
  padding: ${p => p.theme.spacing[5]};
  box-shadow: ${p => p.theme.shadows.md};
  margin: ${p => p.theme.spacing[4]} 0;
`;

const Header = styled.div`
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom: ${p => p.theme.spacing[3]};
`;

const Title = styled.h3`
  margin:0;
`;

const QuestionGrid = styled.div`
  display:grid;
  grid-template-columns: 1fr;
  gap: ${p => p.theme.spacing[3]};
`;

const QuestionCard = styled.div`
  padding: ${p => p.theme.spacing[3]};
  border: 1px solid ${p => p.theme.colors.gray100};
  border-radius: ${p => p.theme.borderRadius.md};
`;

const Footer = styled.div`
  display:flex;
  justify-content:flex-end;
  gap: ${p => p.theme.spacing[3]};
  margin-top: ${p => p.theme.spacing[3]};
`;

const Btn = styled.button`
  background: ${p => p.primary ? p.theme.colors.primary : 'transparent'};
  color: ${p => p.primary ? p.theme.colors.white : p.theme.colors.gray800};
  border: ${p => p.primary ? 'none' : `1px solid ${p.theme.colors.gray300}`};
  padding: ${p => p.theme.spacing[2]} ${p => p.theme.spacing[4]};
  border-radius: ${p => p.theme.borderRadius.md};
  cursor: pointer;
`;

const QUESTIONS = [
  { key: 'mental_demand', title: 'Mental Demand', anchors: ['Very Easy & Automatic','Simple','Moderate','Challenging','Extremely Demanding'] },
  { key: 'physical_demand', title: 'Physical Demand', anchors: ['Very Light','Light','Comfortable','Tiring','Exhausting'] },
  { key: 'temporal_demand', title: 'Temporal Demand', anchors: ['Very Relaxed Pace','Comfortable Pace','Occasionally Rushed','Frequent Time Pressure','Extreme Time Crunch'] },
  { key: 'performance', title: 'Performance', anchors: ['Complete Failure','Mostly Unsuccessful','Partially Successful','Mostly Successful','Perfect Performance'] },
  { key: 'effort', title: 'Effort', anchors: ['Minimal Effort','Some Effort','Moderate Effort','Considerable Effort','Extreme Effort'] },
  { key: 'frustration', title: 'Frustration', anchors: ['Completely Relaxed','Mostly Comfortable','Occasionally Annoyed','Very Frustrated','Extremely Stressed'] }
];

const QuestionnaireInline = ({ taskId = 'task_1_form', onClose = () => {}, onSaved = () => {}, randomize = true, initialValues = {} }) => {
  const [order] = React.useState(QUESTIONS.map((q,i) => i));
  const [values, setValues] = React.useState(() => {
    const v = {};
    QUESTIONS.forEach(q => { v[q.key] = typeof initialValues[q.key] !== 'undefined' ? initialValues[q.key] : undefined; });
    return v;
  });

  const handleChange = (k, v) => {
    setValues(prev => ({ ...prev, [k]: Number(v) }));
  };

  const handleSave = () => {
    const missing = QUESTIONS.map(q => q.key).filter(k => typeof values[k] === 'undefined');
    if (missing.length) {
      alert('Please complete all 6 ratings before continuing.');
      return;
    }
    const payload = buildTlxPayload(taskId, values);
    const ok = saveTlxToLocal(payload);
    onSaved(payload, ok);
  };

  return (
    <Container>
      <Header>
        <Title>Task Evaluation (NASA-TLX)</Title>
        <div>Complete all 6 ratings to continue</div>
      </Header>

      <QuestionGrid>
        {QUESTIONS.map(q => (
          <QuestionCard key={q.key}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <strong>{q.title}</strong>
              <div style={{fontSize:12, color:'rgba(0,0,0,0.6)'}}>{typeof values[q.key] === 'undefined' ? '—' : values[q.key]}</div>
            </div>
            <p style={{margin:'8px 0', color:'rgba(0,0,0,0.6)'}}>Slide to rate (0-100)</p>
            <input type="range" min="0" max="100" value={typeof values[q.key] === 'undefined' ? 50 : values[q.key]} onChange={(e) => handleChange(q.key, e.target.value)} style={{width:'100%'}} />
            <div style={{display:'flex', justifyContent:'space-between', marginTop:8, fontSize:12, color:'rgba(0,0,0,0.6)'}}>
              {q.anchors.map((a,i) => <span key={i}>{a}</span>)}
            </div>
          </QuestionCard>
        ))}
      </QuestionGrid>

      <Footer>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn primary onClick={handleSave}>Save & Continue</Btn>
      </Footer>
    </Container>
  );
};

export default QuestionnaireInline;
