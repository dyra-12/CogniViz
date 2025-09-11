import { useState, useEffect } from 'react';
import styled from 'styled-components';

const ChecklistContainer = styled.div`
  background: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[5]};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.md};
  margin-bottom: ${props => props.theme.spacing[6]};
`;

const ChecklistTitle = styled.h3`
  margin-bottom: ${props => props.theme.spacing[4]};
  color: ${props => props.theme.colors.dark};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[3]};
`;

const RequirementItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[3]};
  margin-bottom: ${props => props.theme.spacing[3]};
  padding: ${props => props.theme.spacing[2]};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => (props.completed ? `${props.theme.colors.success}15` : props.theme.colors.gray100)};
  border-left: 4px solid ${props => props.completed ? props.theme.colors.success : props.theme.colors.gray300};
`;

const RequirementText = styled.span`
  flex: 1;
  color: ${props => props.completed ? props.theme.colors.success : props.theme.colors.gray700};
  font-weight: ${props => props.completed ? '600' : 'normal'};
`;

const Icon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.completed ? props.theme.colors.success : props.theme.colors.gray300};
  color: ${props => props.theme.colors.white};
  font-size: ${props => props.theme.fontSizes.sm};
`;

const ProgressBar = styled.div`
  height: 8px;
  background: ${props => props.theme.colors.gray200};
  border-radius: 4px;
  margin-top: ${props => props.theme.spacing[4]};
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => props.theme.colors.success};
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  text-align: center;
  margin-top: ${props => props.theme.spacing[2]};
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.gray600};
`;

const ActionButton = styled.button`
  width: 100%;
  padding: ${props => props.theme.spacing[3]};
  background: ${props => props.disabled ? props.theme.colors.gray300 : props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  margin-top: ${props => props.theme.spacing[4]};
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.secondary};
  }
`;

const RequirementsChecklist = ({ filters, selectedProduct, checkoutStep, onAction }) => {
  const [requirements, setRequirements] = useState([
    { id: 1, text: "Price between $800 and $1200", completed: false },
    { id: 2, text: "Brand: Dell OR Lenovo", completed: false },
    { id: 3, text: "Minimum 4-star rating", completed: false },
    { id: 4, text: "At least 16GB RAM", completed: false },
    { id: 5, text: "Select a laptop and add to cart", completed: false }
  ]);

  useEffect(() => {
    const updatedRequirements = [...requirements];
    
    // Check price requirement: min >= 800 AND max <= 1200
    updatedRequirements[0].completed = filters.minPrice >= 800 && filters.maxPrice <= 1200;
    
    // Check brand requirement
    updatedRequirements[1].completed = filters.brands.includes('Dell') || filters.brands.includes('Lenovo');
    
    // Check rating requirement
    updatedRequirements[2].completed = filters.minRating >= 4;
    
    // Check RAM requirement
    updatedRequirements[3].completed = filters.rams.includes('16GB') || 
                                      filters.rams.includes('32GB') || 
                                      filters.rams.includes('64GB');
    
    // Check combined requirement: product selection AND add to cart
    updatedRequirements[4].completed = !!selectedProduct && checkoutStep !== 'browsing';
    
    setRequirements(updatedRequirements);
  }, [filters, selectedProduct, checkoutStep]);

  const completedCount = requirements.filter(req => req.completed).length;
  const totalCount = requirements.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const allRequirementsMet = completedCount === totalCount;

  const getButtonText = () => {
    switch (checkoutStep) {
      case 'browsing':
        return selectedProduct ? 'Add to Cart' : 'Select a Product First';
      case 'cart':
        return 'Complete Task';
      case 'checkout':
        return 'Task Complete';
      default:
        return 'Continue';
    }
  };

  const getButtonDisabled = () => {
    switch (checkoutStep) {
      case 'browsing':
        return !selectedProduct || !requirements.slice(0, 4).every(req => req.completed);
      case 'cart':
        return false; // Always allow completing the task from cart
      case 'checkout':
        return false; // Task is already complete
      default:
        return true;
    }
  };

  return (
    <ChecklistContainer>
      <ChecklistTitle>
        📋 Task Requirements
        <span style={{ 
          fontSize: '0.9em', 
          fontWeight: 'normal', 
          color: '#666',
          marginLeft: 'auto'
        }}>
          {completedCount}/{totalCount} completed
        </span>
      </ChecklistTitle>
      
      {requirements.map(requirement => (
        <RequirementItem key={requirement.id} completed={requirement.completed}>
          <Icon completed={requirement.completed}>
            {requirement.completed ? '✓' : '!'}
          </Icon>
          <RequirementText completed={requirement.completed}>
            {requirement.text}
          </RequirementText>
        </RequirementItem>
      ))}
      
      <ProgressBar>
        <ProgressFill percentage={percentage} />
      </ProgressBar>
      <ProgressText>
        {percentage}% complete
      </ProgressText>

      <ActionButton
        onClick={onAction}
        disabled={getButtonDisabled()}
      >
        {getButtonText()}
      </ActionButton>

      {getButtonDisabled() && checkoutStep === 'browsing' && (
        <div style={{ 
          fontSize: '0.8rem', 
          color: '#666', 
          textAlign: 'center', 
          marginTop: '0.5rem' 
        }}>
          {!selectedProduct 
            ? 'Select a product first' 
            : 'Complete all filter requirements to continue'
          }
        </div>
      )}

      {checkoutStep === 'checkout' && (
        <div style={{ 
          fontSize: '0.9rem', 
          color: '#28a745', 
          textAlign: 'center', 
          marginTop: '1rem',
          fontWeight: '600'
        }}>
          ✅ All requirements completed!
        </div>
      )}
    </ChecklistContainer>
  );
};

export default RequirementsChecklist;