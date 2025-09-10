import styled from 'styled-components';
import { useTaskProgress } from '../contexts/TaskProgressContext';
import Button from '../components/Button';

const Container = styled.div`
  max-width: 600px;
  margin: 4rem auto;
  padding: ${props => props.theme.spacing[8]};
  text-align: center;
  background: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.lg};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.success};
  margin-bottom: ${props => props.theme.spacing[6]};
`;

const Message = styled.p`
  font-size: ${props => props.theme.fontSizes.lg};
  margin-bottom: ${props => props.theme.spacing[6]};
  color: ${props => props.theme.colors.gray700};
`;

const CompletionPage = () => {
  const { resetProgress } = useTaskProgress();

  return (
    <Container>
      <Title>🎉 Study Complete!</Title>
      <Message>
        Thank you for participating in our user study. You have successfully completed all three tasks.
        Your responses have been recorded and will be used for research purposes.
      </Message>
      <Message>
        You may now close this window or click the button below to start over.
      </Message>
      <Button onClick={resetProgress}>
        Start Over
      </Button>
    </Container>
  );
};

export default CompletionPage;