import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { buildTlxPayload, saveTlxToLocal } from '../utils/tlx';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const Modal = styled.div`
  width: 680px;
  max-width: 94vw;
  background: ${p => p.theme.colors.white};
  border-radius: ${p => p.theme.borderRadius.lg};
  padding: ${p => p.theme.spacing[6]};
  box-shadow: ${p => p.theme.shadows.xl};
`;

const Header = styled.div`
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom: ${p => p.theme.spacing[4]};
`;

const Title = styled.h3`
  margin:0;
  color: ${p => p.theme.colors.gray800};
`;

const Body = styled.div`
  margin-top: ${p => p.theme.spacing[3]};
`;

const Footer = styled.div`
  margin-top: ${p => p.theme.spacing[4]};
  display:flex;
  justify-content:space-between;
  gap: ${p => p.theme.spacing[3]};
`;

const SliderRow = styled.div`
  margin-bottom: ${p => p.theme.spacing[4]};
`;

const AnchorLabels = styled.div`
  display:flex;
  justify-content:space-between;
  font-size: ${p => p.theme.fontSizes.xs};
  color: ${p => p.theme.colors.gray600};
  margin-top: ${p => p.theme.spacing[2]};
`;

const Progress = styled.div`
  font-size: ${p => p.theme.fontSizes.sm};
  color: ${p => p.theme.colors.gray600};
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

const QuestionnaireModal = ({ taskId = 'task_1_form', onClose = () => {}, onSaved = () => {}, randomize = true }) => {
  const [order, setOrder] = useState(QUESTIONS.map((q,i) => i));
  const [idx, setIdx] = useState(0);
  const [values, setValues] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (randomize) {
      const arr = [...order];
      for (let i = arr.length -1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i+1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setOrder(arr);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentQuestion = QUESTIONS[order[idx]];

  const handleChange = (k, v) => {
    setValues(prev => ({ ...prev, [k]: Number(v) }));
    setTouched(prev => ({ ...prev, [k]: true }));
  };

  const canNext = () => {
    const k = currentQuestion.key;
    return typeof values[k] !== 'undefined';
  };

  const handleNext = () => {
    if (!canNext()) return;
    if (idx < order.length - 1) setIdx(i => i + 1);
  };

  const handlePrev = () => {
    if (idx > 0) setIdx(i => i - 1);
  };

  const handleSave = () => {
    // Ensure all six present
    const missing = QUESTIONS.map(q => q.key).filter(k => typeof values[k] === 'undefined');
    if (missing.length) {
      // jump to first missing
      const firstMissing = order.findIndex(i => missing.includes(QUESTIONS[i].key));
      if (firstMissing >= 0) setIdx(firstMissing);
      return;
    }
    const payload = buildTlxPayload(taskId, values);
    const ok = saveTlxToLocal(payload);
    onSaved(payload, ok);
    onClose();
  };

  return (
    <Overlay role="dialog" aria-modal="true">
      <Modal>
        <Header>
          <div>
            <Title>Task Evaluation (NASA-TLX)</Title>
            <Progress>Question {idx + 1} of {QUESTIONS.length}</Progress>
          </div>
          <div>
            <Btn onClick={() => { if (window.confirm('Are you sure you want to close? This questionnaire is required to proceed.')) onClose(); }}>Close</Btn>
          </div>
        </Header>

        <Body>
          <h4 style={{marginTop:0}}>{currentQuestion.title}</h4>
          <p style={{color: 'rgba(0,0,0,0.6)'}}>Use the slider to rate the task from 0 to 100.</p>
          <SliderRow>
            <input
              type="range"
              min="0"
              max="100"
              value={typeof values[currentQuestion.key] === 'undefined' ? 50 : values[currentQuestion.key]}
              onChange={(e) => handleChange(currentQuestion.key, e.target.value)}
              style={{ width: '100%' }}
            />
            <div style={{display:'flex', justifyContent:'space-between', marginTop:8}}>
              <div style={{fontWeight:600}}>{typeof values[currentQuestion.key] === 'undefined' ? '—' : values[currentQuestion.key]}</div>
              <div style={{fontSize:12, color:'rgba(0,0,0,0.5)'}}>Anchor labels below</div>
            </div>
            <AnchorLabels>
              {currentQuestion.anchors.map((a, i) => <span key={i}>{a}</span>)}
            </AnchorLabels>
          </SliderRow>

          <div style={{marginTop: '1rem'}}>
            <h5>Summary</h5>
            <ul>
              {QUESTIONS.map(q => (
                <li key={q.key} style={{opacity: values[q.key] ? 1 : 0.6}}>{q.title}: {typeof values[q.key] === 'undefined' ? '—' : values[q.key]}</li>
              ))}
            </ul>
          </div>
        </Body>

        <Footer>
          <div style={{display:'flex', gap:8}}>
            <Btn onClick={handlePrev} disabled={idx===0}>Previous</Btn>
            <Btn onClick={handleNext} disabled={!canNext() || idx === order.length - 1}>Next</Btn>
          </div>
          <div style={{display:'flex', gap:8}}>
            <Btn onClick={() => { setValues({}); setIdx(0); }}>Reset</Btn>
            <Btn primary onClick={handleSave}>Save & Continue</Btn>
          </div>
        </Footer>
      </Modal>
    </Overlay>
  );
};

export default QuestionnaireModal;
