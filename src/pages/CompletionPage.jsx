import styled from 'styled-components';
import { useTaskProgress } from '../contexts/TaskProgressContext';
import { useAuth } from '../contexts/AuthContext';
import { sendAggregatedStudyData, buildAggregatedStudyPayload } from '../utils/dataCollection';
import Button from '../components/Button';
import { useEffect, useState } from 'react';

const Container = styled.div`
  max-width: 700px;
  margin: 4rem auto;
  padding: ${props => props.theme.spacing[8]};
  text-align: center;
  background: linear-gradient(135deg, ${props => props.theme.colors.white}, ${props => props.theme.colors.gray100});
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.lg};
  animation: fadeIn 0.6s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const IconWrapper = styled.div`
  font-size: 5rem;
  margin-bottom: ${props => props.theme.spacing[4]};
  animation: bounceIn 0.8s ease-out;

  @keyframes bounceIn {
    0% {
      transform: scale(0);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing[4]};
  font-size: ${props => props.theme.fontSizes['4xl']};
  font-weight: 700;
`;

const Subtitle = styled.h2`
  color: ${props => props.theme.colors.success};
  margin-bottom: ${props => props.theme.spacing[6]};
  font-size: ${props => props.theme.fontSizes.xl};
  font-weight: 600;
`;

const Message = styled.p`
  font-size: ${props => props.theme.fontSizes.lg};
  margin-bottom: ${props => props.theme.spacing[4]};
  color: ${props => props.theme.colors.gray700};
  line-height: 1.6;
`;

const HighlightBox = styled.div`
  background: ${props => props.theme.colors.primary}10;
  border-left: 4px solid ${props => props.theme.colors.primary};
  padding: ${props => props.theme.spacing[4]};
  margin: ${props => props.theme.spacing[6]} 0;
  border-radius: ${props => props.theme.borderRadius.md};
  text-align: left;
`;

const HighlightText = styled.p`
  font-size: ${props => props.theme.fontSizes.md};
  color: ${props => props.theme.colors.gray800};
  margin: ${props => props.theme.spacing[2]} 0;
  line-height: 1.6;
`;

const StatsList = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing[4]};
  margin: ${props => props.theme.spacing[6]} 0;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[4]};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const StatNumber = styled.div`
  font-size: ${props => props.theme.fontSizes['3xl']};
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing[2]};
`;

const StatLabel = styled.div`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.gray600};
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing[3]};
  justify-content: center;
  margin-top: ${props => props.theme.spacing[8]};

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 2px solid ${props => props.theme.colors.gray200};
  margin: ${props => props.theme.spacing[6]} 0;
`;

const CompletionPage = () => {
  const { resetProgress, completedTasks } = useTaskProgress();
  const responses = (buildAggregatedStudyPayload()?.nasa_tlx_responses) || [];
  const { participantId } = useAuth();
  const [sendStatus, setSendStatus] = useState('idle'); // idle | sending | sent | failed

  const handleDownloadData = () => {
    const dataStr = JSON.stringify(responses, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `study-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Send aggregated study data to Firebase Firestore
  const sendDataToFirebase = async () => {
    try {
      const res = await sendAggregatedStudyData();
      if (!res.ok) return null;
      return res.id;
    } catch (error) {
      console.error('Failed to send data to Firebase:', error);
      setSendStatus('failed');
      return null;
    }
  };

  useEffect(() => {
    // Trigger send when the completion page mounts
    let mounted = true;
    (async () => {
      if (!mounted) return;
      setSendStatus('sending');
      const id = await sendDataToFirebase();
      if (!mounted) return;
      if (id) setSendStatus('sent');
      else setSendStatus('failed');
    })();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container>
      <IconWrapper>🎉</IconWrapper>
      <Title>Thank You!</Title>
      <Subtitle>Study Successfully Completed</Subtitle>
  {sendStatus === 'sending' && <Message>Sending your data to the research server…</Message>}
  {sendStatus === 'disabled' && <Message style={{ color: '#6c757d' }}>Data upload to the research server is disabled in this build. Please download your data and send it to the research team if needed.</Message>}
  {sendStatus === 'sent' && <Message>All data uploaded successfully. Thank you!</Message>}
  {sendStatus === 'failed' && <Message style={{ color: '#d9534f' }}>Failed to upload data. You can try downloading your data and contacting the research team.</Message>}
      <Message>
        We greatly appreciate your time and effort in participating in this cognitive load study. 
        Your contributions are invaluable to our research.
      </Message>

      <StatsList>
        <StatCard>
          <StatNumber>{completedTasks.length}</StatNumber>
          <StatLabel>Tasks Completed</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>{responses.length}</StatNumber>
          <StatLabel>Evaluations Submitted</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>100%</StatNumber>
          <StatLabel>Completion Rate</StatLabel>
        </StatCard>
      </StatsList>

      <HighlightBox>
        <HighlightText>
          <strong>✓ What happens next:</strong>
        </HighlightText>
        <HighlightText>
          • Your responses have been securely saved and will be used for research analysis
        </HighlightText>
        <HighlightText>
          • All data is anonymized and will be handled according to research ethics guidelines
        </HighlightText>
        <HighlightText>
          • Your feedback helps us understand cognitive workload in different interface designs
        </HighlightText>
      </HighlightBox>

      <Divider />

      <Message style={{ fontSize: '1rem', color: '#6c757d' }}>
        You may now close this window. If you have any questions about the study, 
        please contact the research team.
      </Message>

      <ButtonGroup>
        <Button variant="secondary" onClick={handleDownloadData}>
          Download My Data
        </Button>
        <Button onClick={resetProgress}>
          Start Over
        </Button>
      </ButtonGroup>
    </Container>
  );
};

export default CompletionPage;