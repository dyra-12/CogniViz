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
          title: 'Task 2: Find the Perfect Laptop',
          goal: 'Use the filters to find a laptop that meets ALL of these criteria: Price between $800-$1200, Brand: Dell OR Lenovo, Minimum 4-star rating, At least 16GB RAM. Then add it to cart.',
          steps: [
            'Use the filter panel on the left to set your criteria',
            'Price: Set range between $800 and $1200',
            'Brand: Check both "Dell" and "Lenovo"',
            'Rating: Set minimum to 4 stars',
            'RAM: Select "16GB" or higher',
            'Choose one laptop from the filtered results',
            'Click "Add to Cart" and then "Proceed to Checkout"'
          ]
        };
      case 3:
        return {
          title: 'Task 3: Plan Your Business Trip to Berlin',
          goal: 'Plan a 4-day, 3-night business trip to Berlin with a total budget of $2,200. Book flights, hotel, and schedule meetings.',
          steps: [
            'Book a Flight: Choose round-trip flight from NY to Berlin that arrives before 3PM Day 1 and departs after 12PM Day 4',
            'Book a Hotel: Choose a 3+ star hotel within 5km of Conference Center for 3 nights',
            'Schedule Meetings: Drag the two meetings into the calendar on Day 2 or Day 3 between 9AM-5PM',
            'Manage Budget: Keep total cost under $2,200',
            'Finalize your trip when everything is arranged'
          ]
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