import styled from 'styled-components';

const Panel = styled.div`
  background: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[6]};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.md};
  margin-bottom: ${props => props.theme.spacing[6]};
`;

const PanelTitle = styled.h3`
  margin-bottom: ${props => props.theme.spacing[5]};
  color: ${props => props.theme.colors.dark};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[3]};
`;

const ConstraintList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ConstraintItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[3]};
  padding: ${props => props.theme.spacing[3]} 0;
  border-bottom: 1px solid ${props => props.theme.colors.gray200};
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatusIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${props => props.isMet ? props.theme.colors.success : props.theme.colors.danger};
  color: ${props => props.theme.colors.white};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: bold;
`;

const ConstraintText = styled.span`
  flex: 1;
  color: ${props => props.theme.colors.gray700};
  font-weight: ${props => props.isMet ? 'normal' : '600'};
`;

const ConstraintsPanel = ({ constraints, allocations }) => {
  return (
    <Panel>
      <PanelTitle>
        Budget Constraints
        <span style={{ 
          fontSize: '1rem', 
          fontWeight: 'normal', 
          color: '#6c757d' 
        }}>
          (All must be satisfied)
        </span>
      </PanelTitle>
      
      <ConstraintList>
        {constraints.map(constraint => {
          const isMet = constraint.check(allocations);
          return (
            <ConstraintItem key={constraint.id}>
              <StatusIcon isMet={isMet}>
                {isMet ? '✓' : '✗'}
              </StatusIcon>
              <ConstraintText isMet={isMet}>
                {constraint.description}
              </ConstraintText>
            </ConstraintItem>
          );
        })}
      </ConstraintList>
    </Panel>
  );
};

export default ConstraintsPanel;