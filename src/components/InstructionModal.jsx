import styled from 'styled-components';
import Button from './Button';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing[4]};
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing[8]};
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: ${props => props.theme.shadows.xl};
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing[6]};
  text-align: center;
`;

const Instructions = styled.div`
  margin-bottom: ${props => props.theme.spacing[6]};
  
  h3 {
    color: ${props => props.theme.colors.dark};
    margin-bottom: ${props => props.theme.spacing[3]};
  }
  
  ul {
    margin-left: ${props => props.theme.spacing[6]};
    margin-bottom: ${props => props.theme.spacing[4]};
  }
  
  li {
    margin-bottom: ${props => props.theme.spacing[2]};
    line-height: 1.6;
  }
`;

const TaskGoal = styled.div`
  background: ${props => props.theme.colors.gray100};
  padding: ${props => props.theme.spacing[4]};
  border-radius: ${props => props.theme.borderRadius.lg};
  margin-bottom: ${props => props.theme.spacing[6]};
  border-left: 4px solid ${props => props.theme.colors.primary};
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const BudgetWarning = styled.div`
  background: ${props => props.theme.colors.warning}15;
  color: ${props => props.theme.colors.warning};
  padding: ${props => props.theme.spacing[3]};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.warning}30;
  margin-top: ${props => props.theme.spacing[4]};
  font-weight: 600;
`;

const InstructionModal = ({ taskNumber, onClose }) => {
  const getTaskInstructions = () => {
    switch (taskNumber) {
      case 1:
        return {
          title: 'Task 1: Shipping Information',
          goal: 'Please fill out the shipping form with your information.',
          steps: [
            'Fill in all the required fields (marked with *)',
            'Ensure the ZIP code is in the correct format',
            'Select a shipping method',
            'Submit the form when complete'
          ]
        };
      case 2:
        return {
          title: 'Task 2: Find a Laptop Matching Specific Requirements',
          goal: 'Find and select a laptop that meets all of the following criteria using the filter system.',
          steps: [
            'Price: Between $800 and $1200',
            'Brand: Dell or Lenovo (select both)',
            'Rating: 4 stars or higher',
            'RAM: 16GB or more',
            '---',
            'Steps to Complete:',
            '• Use the filter panel on the left side to set each requirement',
            '• Apply all four filters until only matching laptops remain',
            '• Hover over any laptop card to see detailed specifications',
            '• Click "Add to Cart" on any laptop that meets all criteria',
            '• Click "Proceed to Checkout" to complete the task'
          ]
        };
      case 3:
        return {
          title: 'Task 3: Plan Your Business Trip to Berlin',
          goal: 'Plan a 4-day, 3-night business trip to Berlin with a budget of $1,380. Book flights, hotel, transportation, and schedule meetings with multiple complex constraints.',
          steps: [
            'Book a Flight: Choose round-trip flight from NY to Berlin that arrives before 15:00 on the same day and departs after 12:00 on Day 4',
            'Book a Hotel: Choose a 3+ star hotel within 5km of Conference Center for 3 nights',
            'Select Transportation: Choose how you will get around Berlin',
            'Schedule Meetings: Drag all five meetings into the calendar respecting complex time constraints and dependencies',
            'Manage Budget: Keep total cost under $1,380 - careful planning required!',
            'Finalize your trip when everything is arranged'
          ],
          budgetWarning: '⚠️ Budget: $1,380 - plan carefully!'
        };
        default:
        return { title: '', goal: '', steps: [] };
    }
  };

  const instructions = getTaskInstructions();

  return (
    <ModalOverlay>
      <ModalContent>
        <Title>{instructions.title}</Title>
        
        <TaskGoal>
          <strong>Your Goal:</strong> {instructions.goal}
        </TaskGoal>

        <Instructions>
          <h3>What you need to do:</h3>
          <ul>
            {instructions.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </Instructions>

        {instructions.budgetWarning && (
          <BudgetWarning>
            {instructions.budgetWarning}
          </BudgetWarning>
        )}

        <ButtonContainer>
          <Button onClick={onClose}>
            Start Task {taskNumber}
          </Button>
        </ButtonContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

export default InstructionModal;