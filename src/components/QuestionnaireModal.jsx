import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import Button from './Button';

// Modal Overlay
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing[4]};
  overflow-y: auto;
  backdrop-filter: blur(4px);
`;

// Modal Container
const ModalContainer = styled.div`
  background: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 640px) {
    max-height: 95vh;
    border-radius: ${props => props.theme.borderRadius.lg};
  }
`;

// Header
const ModalHeader = styled.div`
  padding: ${props => props.theme.spacing[6]};
  border-bottom: 2px solid ${props => props.theme.colors.gray200};
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}15, ${props => props.theme.colors.secondary}10);
`;

const Title = styled.h2`
  margin: 0 0 ${props => props.theme.spacing[2]};
  color: ${props => props.theme.colors.primary};
  font-size: ${props => props.theme.fontSizes['2xl']};
  font-weight: 600;

  @media (max-width: 640px) {
    font-size: ${props => props.theme.fontSizes.xl};
  }
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${props => props.theme.colors.gray600};
  font-size: ${props => props.theme.fontSizes.sm};
`;

// Progress Indicator
const ProgressContainer = styled.div`
  padding: ${props => props.theme.spacing[4]} ${props => props.theme.spacing[6]};
  background: ${props => props.theme.colors.gray100};
  border-bottom: 1px solid ${props => props.theme.colors.gray200};
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing[2]};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: 500;
  color: ${props => props.theme.colors.gray700};
`;

const ProgressBar = styled.div`
  height: 6px;
  background: ${props => props.theme.colors.gray300};
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  border-radius: 3px;
  transition: width 0.3s ease;
  width: ${props => props.progress}%;
`;

// Content
const ModalContent = styled.div`
  padding: ${props => props.theme.spacing[8]} ${props => props.theme.spacing[6]};
  overflow-y: auto;
  flex: 1;

  @media (max-width: 640px) {
    padding: ${props => props.theme.spacing[6]} ${props => props.theme.spacing[4]};
  }
`;

const QuestionContainer = styled.div`
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const QuestionTitle = styled.h3`
  margin: 0 0 ${props => props.theme.spacing[3]};
  color: ${props => props.theme.colors.gray900};
  font-size: ${props => props.theme.fontSizes.lg};
  font-weight: 600;
`;

const QuestionDescription = styled.p`
  margin: 0 0 ${props => props.theme.spacing[6]};
  color: ${props => props.theme.colors.gray600};
  font-size: ${props => props.theme.fontSizes.md};
  line-height: 1.6;
`;

// Options Container - Horizontal Scale
const OptionsContainer = styled.div`
  margin: ${props => props.theme.spacing[8]} 0;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing[4]};
`;

const ScaleContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${props => props.theme.spacing[2]};
  justify-content: space-between;
  align-items: stretch;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: ${props => props.theme.spacing[3]};
  }
`;

const OptionButton = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing[4]} ${props => props.theme.spacing[2]};
  background: ${props => {
    if (props.isSelected) return props.theme.colors.primary;
    return props.theme.colors.white;
  }};
  color: ${props => props.isSelected ? props.theme.colors.white : props.theme.colors.gray700};
  border: 2px solid ${props => props.isSelected ? props.theme.colors.primary : props.theme.colors.gray300};
  border-radius: ${props => props.theme.borderRadius.lg};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  min-height: 120px;
  position: relative;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.isSelected ? props.theme.colors.info : `${props.theme.colors.primary}10`};
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.lg};
  }

  &:active {
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    flex-direction: row;
    justify-content: flex-start;
    text-align: left;
    min-height: auto;
    padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[4]};
  }
`;

const OptionRange = styled.div`
  font-size: ${props => props.theme.fontSizes.xs};
  font-weight: 700;
  color: ${props => props.isSelected ? props.theme.colors.white : props.theme.colors.gray500};
  margin-bottom: ${props => props.theme.spacing[2]};
  letter-spacing: 0.5px;

  @media (max-width: 768px) {
    margin-bottom: 0;
    margin-right: ${props => props.theme.spacing[3]};
    min-width: 50px;
  }
`;

const OptionLabel = styled.div`
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: 600;
  color: ${props => props.isSelected ? props.theme.colors.white : props.theme.colors.gray800};
  line-height: 1.3;

  @media (max-width: 768px) {
    flex: 1;
  }
`;

const ScaleLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: ${props => props.theme.spacing[2]};
  padding: 0 ${props => props.theme.spacing[2]};
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.gray600};
  font-weight: 500;

  @media (max-width: 768px) {
    display: none;
  }
`;

// Footer
const ModalFooter = styled.div`
  padding: ${props => props.theme.spacing[4]} ${props => props.theme.spacing[6]};
  border-top: 2px solid ${props => props.theme.colors.gray200};
  display: flex;
  gap: ${props => props.theme.spacing[3]};
  justify-content: ${props => props.justify || 'space-between'};
  background: ${props => props.theme.colors.gray50};

  @media (max-width: 640px) {
    padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[4]};
    flex-direction: ${props => props.singleButton ? 'column' : 'row'};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing[3]};
  flex: 1;
  justify-content: ${props => props.align || 'flex-start'};

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

// NASA-TLX Questions Configuration
const QUESTIONS = [
  {
    id: 'mental_demand',
    title: '1. Mental Demand',
    description: 'How much thinking, deciding, or remembering did the task require?',
    lowLabel: 'Very Low',
    highLabel: 'Very High',
    options: [
      { value: 10, range: '0-20', label: 'Very Easy & Automatic' },
      { value: 30, range: '21-40', label: 'Simple' },
      { value: 50, range: '41-60', label: 'Moderate' },
      { value: 70, range: '61-80', label: 'Challenging' },
      { value: 90, range: '81-100', label: 'Extremely Demanding' }
    ]
  },
  {
    id: 'physical_demand',
    title: '2. Physical Demand',
    description: 'How much physical effort was involved? (Clicking, typing, mouse movement)',
    lowLabel: 'Very Low',
    highLabel: 'Very High',
    options: [
      { value: 10, range: '0-20', label: 'Very Light' },
      { value: 30, range: '21-40', label: 'Light' },
      { value: 50, range: '41-60', label: 'Comfortable' },
      { value: 70, range: '61-80', label: 'Tiring' },
      { value: 90, range: '81-100', label: 'Exhausting' }
    ]
  },
  {
    id: 'temporal_demand',
    title: '3. Temporal Demand',
    description: 'How much time pressure did you feel due to the pace of the task?',
    lowLabel: 'Very Low',
    highLabel: 'Very High',
    options: [
      { value: 10, range: '0-20', label: 'Very Relaxed Pace' },
      { value: 30, range: '21-40', label: 'Comfortable Pace' },
      { value: 50, range: '41-60', label: 'Occasionally Rushed' },
      { value: 70, range: '61-80', label: 'Frequent Pressure' },
      { value: 90, range: '81-100', label: 'Extreme Pressure' }
    ]
  },
  {
    id: 'performance',
    title: '4. Performance',
    description: 'How successful do you think you were in accomplishing the task goals?',
    lowLabel: 'Very Poor',
    highLabel: 'Very Good',
    options: [
      { value: 10, range: '0-20', label: 'Complete Failure' },
      { value: 30, range: '21-40', label: 'Mostly Unsuccessful' },
      { value: 50, range: '41-60', label: 'Partially Successful' },
      { value: 70, range: '61-80', label: 'Mostly Successful' },
      { value: 90, range: '81-100', label: 'Perfect Performance' }
    ]
  },
  {
    id: 'effort',
    title: '5. Effort',
    description: 'How hard did you have to work to achieve your level of performance?',
    lowLabel: 'Very Low',
    highLabel: 'Very High',
    options: [
      { value: 10, range: '0-20', label: 'Minimal Effort' },
      { value: 30, range: '21-40', label: 'Some Effort' },
      { value: 50, range: '41-60', label: 'Moderate Effort' },
      { value: 70, range: '61-80', label: 'Considerable Effort' },
      { value: 90, range: '81-100', label: 'Extreme Effort' }
    ]
  },
  {
    id: 'frustration',
    title: '6. Frustration',
    description: 'How insecure, discouraged, or annoyed did you feel during the task?',
    lowLabel: 'Very Low',
    highLabel: 'Very High',
    options: [
      { value: 10, range: '0-20', label: 'Completely Relaxed' },
      { value: 30, range: '21-40', label: 'Mostly Comfortable' },
      { value: 50, range: '41-60', label: 'Occasionally Annoyed' },
      { value: 70, range: '61-80', label: 'Very Frustrated' },
      { value: 90, range: '81-100', label: 'Extremely Stressed' }
    ]
  }
];

/**
 * NASA-TLX Questionnaire Modal Component
 */
const QuestionnaireModal = ({ isOpen, onClose, onSubmit, taskId }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Randomize question order (memoized so it doesn't change on re-renders)
  const randomizedQuestions = useMemo(() => {
    const questions = [...QUESTIONS];
    // Shuffle using Fisher-Yates algorithm
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    return questions;
  }, [isOpen]); // Re-randomize when modal opens

  const currentQuestion = randomizedQuestions[currentQuestionIndex];
  const currentValue = responses[currentQuestion?.id] ?? null;
  const totalQuestions = randomizedQuestions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const allQuestionsAnswered = randomizedQuestions.every(q => responses[q.id] !== undefined);

  const handleOptionSelect = (optionValue) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: optionValue
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!allQuestionsAnswered) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(responses);
    } catch (error) {
      console.error('Failed to submit questionnaire:', error);
      alert('Failed to save your responses. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    // Prevent closing when clicking inside the modal
    if (e.target === e.currentTarget) {
      // Optional: show a warning that the questionnaire must be completed
      if (!allQuestionsAnswered) {
        alert('Please complete all questions before proceeding.');
      }
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentQuestionIndex(0);
      setResponses({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Overlay onClick={handleOverlayClick}>
      <ModalContainer role="dialog" aria-modal="true" aria-labelledby="questionnaire-title">
        <ModalHeader>
          <Title id="questionnaire-title">NASA-TLX: Task Evaluation</Title>
          <Subtitle>Please rate your experience with the task you just completed</Subtitle>
        </ModalHeader>

        <ProgressContainer>
          <ProgressText>
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span>{Math.round(progress)}% Complete</span>
          </ProgressText>
          <ProgressBar>
            <ProgressFill progress={progress} />
          </ProgressBar>
        </ProgressContainer>

        <ModalContent>
          <QuestionContainer key={currentQuestion.id}>
            <QuestionTitle>{currentQuestion.title}</QuestionTitle>
            <QuestionDescription>{currentQuestion.description}</QuestionDescription>

            <OptionsContainer>
              <ScaleContainer>
                {currentQuestion.options.map((option) => (
                  <OptionButton
                    key={option.value}
                    type="button"
                    isSelected={currentValue === option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    aria-label={`${option.label} - ${option.range}`}
                  >
                    <OptionRange isSelected={currentValue === option.value}>
                      {option.range}
                    </OptionRange>
                    <OptionLabel isSelected={currentValue === option.value}>
                      {option.label}
                    </OptionLabel>
                  </OptionButton>
                ))}
              </ScaleContainer>
              <ScaleLabels>
                <span>{currentQuestion.lowLabel}</span>
                <span>{currentQuestion.highLabel}</span>
              </ScaleLabels>
            </OptionsContainer>
          </QuestionContainer>
        </ModalContent>

        <ModalFooter singleButton={currentQuestionIndex === totalQuestions - 1 && allQuestionsAnswered}>
          <ButtonGroup align="flex-start">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </Button>
          </ButtonGroup>

          <ButtonGroup align="flex-end">
            {currentQuestionIndex < totalQuestions - 1 ? (
              <Button
                onClick={handleNext}
                disabled={currentValue === null}
              >
                Next →
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
              </Button>
            )}
          </ButtonGroup>
        </ModalFooter>
      </ModalContainer>
    </Overlay>
  );
};

export default QuestionnaireModal;
