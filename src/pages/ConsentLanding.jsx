import { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useTaskProgress } from '../contexts/TaskProgressContext';

const Container = styled.div`
  max-width: 900px;
  margin: 3rem auto;
  padding: ${props => props.theme.spacing[6]};
  background: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.lg};
`;

const Title = styled.h1`
  margin-bottom: ${props => props.theme.spacing[4]};
  text-align: center;
  color: ${props => props.theme.colors.primary};
`;

const Section = styled.section`
  margin-bottom: ${props => props.theme.spacing[4]};
  line-height: 1.5;
  color: ${props => props.theme.colors.gray700};
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${props => props.theme.spacing[3]};
  margin-top: ${props => props.theme.spacing[4]};
`;

const ConsentButton = styled.button`
  padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[4]};
  background: ${props => props.theme.colors.primary};
  color: white;
  border-radius: ${props => props.theme.borderRadius.md};
  border: none;
  cursor: pointer;
  font-weight: 600;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const Secondary = styled.button`
  padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[4]};
  background: transparent;
  color: ${props => props.theme.colors.primary};
  border: 1px solid ${props => props.theme.colors.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
`;

const Checklist = styled.ul`
  margin-top: ${props => props.theme.spacing[2]};
  padding-left: 1.25rem;
`;

const ConsentLanding = () => {
  const navigate = useNavigate();
  const { setConsentGiven, setShowInstructions } = useTaskProgress();
  const [checked, setChecked] = useState(false);

  const handleAccept = () => {
    setConsentGiven(true);
    setShowInstructions(true);
    navigate('/task1');
  };

  const handleDecline = () => {
    setConsentGiven(false);
    // send to completion / exit page
    navigate('/complete');
  };

  return (
    <Container>
      <Title>Participant Information & Consent</Title>

      <Section>
        <strong>Purpose:</strong>
        <p>
          You are invited to take part in a user study about travel-planning interfaces. We will ask you to
          complete a set of tasks that simulate booking a business trip. Your interaction data (e.g., clicks,
          selections, mouse movements) will be recorded to analyze usability and decision patterns.
        </p>
      </Section>

      <Section>
        <strong>What we collect:</strong>
        <Checklist>
          <li>Interaction events: clicks, hovers, selections, drags</li>
          <li>Timing/sequence of actions and high-level navigation</li>
          <li>Aggregated mouse movement statistics (entropy) — no raw video or personally identifying tracking</li>
        </Checklist>
      </Section>

      <Section>
        <strong>Privacy & use of data:</strong>
        <p>
          All data will be stored locally in your browser and uploaded only with your explicit permission.
          Collected data will be used for research purposes and reported in aggregate. No personally
          identifying information will be shared. If you have concerns, contact the research team below.
        </p>
      </Section>

      <Section>
        <strong>Voluntary participation & withdrawal:</strong>
        <p>
          Participation is voluntary. You may stop at any time. If you choose to withdraw during the study,
          you may request that your data be deleted by contacting the research team.
        </p>
      </Section>

      <Section>
        <strong>Risks & benefits:</strong>
        <p>
          This study involves minimal risk. There is no direct benefit to you beyond contributing to research
          that may improve future travel interfaces.
        </p>
      </Section>

      <Section>
        <strong>Contact:</strong>
        <p>For questions about the study or your rights, contact the research team at research@example.com.</p>
      </Section>

      <Section>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <span>I have read the information above and consent to participate in this study.</span>
        </label>
      </Section>

      <Actions>
        <Secondary onClick={handleDecline}>Decline</Secondary>
        <ConsentButton disabled={!checked} onClick={handleAccept}>I Agree & Start Study</ConsentButton>
      </Actions>
    </Container>
  );
};

export default ConsentLanding;
