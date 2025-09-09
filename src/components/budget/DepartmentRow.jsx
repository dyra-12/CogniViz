import styled from 'styled-components';

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: ${props => props.theme.colors.gray100};
  }
  
  &:hover {
    background-color: ${props => props.theme.colors.gray200};
  }
`;

const TableCell = styled.td`
  padding: ${props => props.theme.spacing[4]};
  text-align: left;
  border-bottom: 1px solid ${props => props.theme.colors.gray300};
`;

const DepartmentName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.dark};
`;

const AllocationInput = styled.input`
  width: 100px;
  padding: ${props => props.theme.spacing[2]};
  border: 2px solid ${props => props.theme.colors.gray300};
  border-radius: ${props => props.theme.borderRadius.md};
  text-align: right;
  font-size: ${props => props.theme.fontSizes.md};
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
  
  &:invalid {
    border-color: ${props => props.theme.colors.danger};
  }
`;

const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[3]};
  min-width: 200px;
`;

const Slider = styled.input`
  flex: 1;
  height: 6px;
  accent-color: ${props => props.theme.colors.primary};
`;

const SliderValue = styled.span`
  min-width: 60px;
  text-align: right;
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
`;

const DepartmentRow = ({ department, allocation, onAllocationChange, maxBudget }) => {
  const handleInputChange = (e) => {
    const value = Math.max(0, Math.min(maxBudget, parseInt(e.target.value) || 0));
    onAllocationChange(department.id, value);
  };

  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value);
    onAllocationChange(department.id, value);
  };

  return (
    <TableRow>
      <TableCell>
        <DepartmentName>{department.name}</DepartmentName>
        <small style={{ color: '#6c757d' }}>
          Min: ${department.min.toLocaleString()} | Max: ${department.max.toLocaleString()}
        </small>
      </TableCell>
      
      <TableCell>
        <AllocationInput
          type="number"
          min="0"
          max={maxBudget}
          value={allocation}
          onChange={handleInputChange}
        />
      </TableCell>
      
      <TableCell>
        <SliderContainer>
          <Slider
            type="range"
            min="0"
            max={maxBudget}
            value={allocation}
            onChange={handleSliderChange}
          />
          <SliderValue>${allocation.toLocaleString()}</SliderValue>
        </SliderContainer>
      </TableCell>
    </TableRow>
  );
};

export default DepartmentRow;