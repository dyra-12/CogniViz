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
  max-width: 650px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(67, 97, 238, 0.25);
  border: 1px solid ${props => props.theme.colors.gray200};
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.gray100};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.primary};
    border-radius: 4px;
  }
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing[6]};
  text-align: center;
  font-size: ${props => props.theme.fontSizes['3xl']};
  font-weight: 700;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, ${props => props.theme.colors.secondary} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Instructions = styled.div`
  margin-bottom: ${props => props.theme.spacing[6]};
  
  h3 {
    color: ${props => props.theme.colors.dark};
    margin-bottom: ${props => props.theme.spacing[4]};
    font-size: ${props => props.theme.fontSizes.xl};
    font-weight: 600;
  }
  
  ul {
    margin-left: ${props => props.theme.spacing[4]};
    margin-bottom: ${props => props.theme.spacing[4]};
  }
  
  li {
    margin-bottom: ${props => props.theme.spacing[2]};
    line-height: 1.7;
    color: ${props => props.theme.colors.gray700};
    font-size: ${props => props.theme.fontSizes.md};
  }
`;

const TaskGoal = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}08 0%, ${props => props.theme.colors.info}08 100%);
  padding: ${props => props.theme.spacing[5]};
  border-radius: ${props => props.theme.borderRadius.lg};
  margin-bottom: ${props => props.theme.spacing[6]};
  border-left: 4px solid ${props => props.theme.colors.primary};
  box-shadow: 0 2px 8px rgba(67, 97, 238, 0.08);
  
  strong {
    color: ${props => props.theme.colors.primary};
    font-size: ${props => props.theme.fontSizes.lg};
    display: block;
    margin-bottom: ${props => props.theme.spacing[2]};
  }
  
  color: ${props => props.theme.colors.gray800};
  font-size: ${props => props.theme.fontSizes.md};
  line-height: 1.6;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const BudgetWarning = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.warning}12 0%, ${props => props.theme.colors.danger}08 100%);
  color: ${props => props.theme.colors.warning};
  padding: ${props => props.theme.spacing[4]};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 2px solid ${props => props.theme.colors.warning}40;
  margin-top: ${props => props.theme.spacing[4]};
  font-weight: 600;
  font-size: ${props => props.theme.fontSizes.md};
  box-shadow: 0 2px 8px rgba(247, 127, 0, 0.12);
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[2]};
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
          title: 'Task 2: Laptop Selection Challenge',
          goal: 'Use the filtering system to find and select a laptop that meets ALL the specified requirements below.',
          steps: [
            '📋 Requirements to Match:',
            '',
            '• Price Range: $800 - $1,200',
            '• Brand: Dell OR Lenovo (you can select both)',
            '• Customer Rating: 4 stars or higher',
            '• Memory (RAM): 16GB or more',
            '',
            '─────────────────────────',
            '',
            '📝 How to Complete This Task:',
            '',
            '1. Open the filter panel on the left side',
            '2. Set each filter to match all four requirements above',
            '3. Review the filtered laptops in the product grid',
            '4. Hover over cards to view detailed specifications',
            '5. Click "Add to Cart" on ANY laptop that matches all criteria',
            '6. Click "Complete Task" when done',
            '',
            '💡 Pro Tip: Watch the requirements checklist on the right to track your progress in real-time!'
          ]
        };
      case 3:
        return {
          title: 'Task 3: Berlin Business Trip Planner',
          goal: 'Plan a complete 4-day, 3-night business trip to Berlin while staying within your $1,380 budget. You need to book flights, accommodation, transportation, and schedule all required meetings.',
          steps: [
            '✈️ Flight Booking:',
            '• Round-trip from New York to Berlin',
            '• Arrival: Before 3:00 PM on Day 1',
            '• Departure: After 12:00 PM on Day 4',
            '',
            '🏨 Hotel Reservation:',
            '• Rating: 3 stars or higher',
            '• Location: Within 5km of Conference Center',
            '• Duration: 3 nights (check-in Day 1, check-out Day 4)',
            '',
            '🚗 Transportation:',
            '• Select your preferred method to get around Berlin',
            '• Consider cost vs. convenience trade-offs',
            '',
            '📅 Meeting Scheduler:',
            '• Drag and drop all 5 meetings into the calendar',
            '• Follow time constraints and dependencies carefully',
            '• Some meetings must occur before others',
            '',
            '💰 Budget Management:',
            '• Total budget: $1,380',
            '• Track spending in real-time via the budget panel',
            '• Balance cost and quality for all bookings',
            '',
            '✅ Click "Finalize Trip" when everything is booked and scheduled!'
          ],
          budgetWarning: '⚠️ Budget Alert: You have $1,380 total. Plan each booking carefully to stay within budget!'
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
          <h3>Instructions:</h3>
          <ul>
            {instructions.steps.map((step, index) => {
              // Handle empty lines (for spacing)
              if (step === '') {
                return <li key={index} style={{ listStyle: 'none', height: '0.3rem', margin: 0 }}></li>;
              }
              // Handle dividers
              if (step.includes('─────')) {
                return <li key={index} style={{ 
                  listStyle: 'none', 
                  margin: '1rem 0',
                  borderTop: '1px solid #dee2e6',
                  padding: 0
                }}></li>;
              }
              // Handle section headers with emojis
              if (step.match(/^[✈️🏨🚗📅💰📋📝]/)) {
                return <li key={index} style={{ 
                  listStyle: 'none', 
                  fontWeight: '700',
                  fontSize: '1.05rem',
                  marginTop: '1rem',
                  marginBottom: '0.5rem',
                  color: '#4361ee'
                }}>{step}</li>;
              }
              // Bullet points (items starting with •)
              if (step.startsWith('•')) {
                return <li key={index} style={{
                  listStyle: 'none',
                  paddingLeft: '1.5rem',
                  position: 'relative',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: '0',
                    color: '#4361ee',
                    fontWeight: 'bold'
                  }}>•</span>
                  {step.substring(1).trim()}
                </li>;
              }
              // Tips and special notes
              if (step.startsWith('💡') || step.startsWith('✅')) {
                return <li key={index} style={{ 
                  listStyle: 'none',
                  background: '#4cc9f008',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  marginTop: '1rem',
                  border: '1px solid #4cc9f030',
                  fontWeight: '500',
                  color: '#495057'
                }}>{step}</li>;
              }
              // Numbered items (starting with digit)
              if (step.match(/^\d+\./)) {
                return <li key={index} style={{
                  listStyle: 'none',
                  marginBottom: '0.6rem',
                  paddingLeft: '0.5rem'
                }}>{step}</li>;
              }
              // Regular list items
              return <li key={index} style={{
                marginBottom: '0.6rem',
                paddingLeft: '0.5rem'
              }}>{step}</li>;
            })}
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