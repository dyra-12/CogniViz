import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { departments, constraints, getInitialAllocations } from '../data/budgetData';
import DepartmentRow from '../components/budget/DepartmentRow';
import ConstraintsPanel from '../components/budget/ConstraintsPanel';
import BudgetSummary from '../components/budget/BudgetSummary';
import useLogger from '../hooks/useLogger';

const PageContainer = styled.div`
  padding: ${props => props.theme.spacing[6]} 0;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing[4]};
  color: ${props => props.theme.colors.primary};
`;

const PageSubtitle = styled.p`
  text-align: center;
  color: ${props => props.theme.colors.gray600};
  margin-bottom: ${props => props.theme.spacing[8]};
  font-size: ${props => props.theme.fontSizes.lg};
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: ${props => props.theme.spacing[6]};
  align-items: start;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const TableContainer = styled.div`
  background: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.md};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
`;

const TableHeaderCell = styled.th`
  padding: ${props => props.theme.spacing[5]};
  text-align: left;
  font-weight: 600;
  
  &:nth-child(1) { width: 40%; }
  &:nth-child(2) { width: 20%; }
  &:nth-child(3) { width: 40%; }
`;

const Task3 = () => {
  const { log } = useLogger();
  const [allocations, setAllocations] = useState(getInitialAllocations());
  const MAX_BUDGET = 10000;

  // Log initial view
  useEffect(() => {
    log('budget_planner_view', { 
      component: 'business_trip_budget_planner',
      totalBudget: MAX_BUDGET 
    });
  }, [log]);

  const handleAllocationChange = useCallback((departmentId, amount) => {
    setAllocations(prev => {
      const newAllocations = { ...prev, [departmentId]: amount };
      
      // Log the allocation change
      log('allocation_change', {
        department: departmentId,
        newAmount: amount,
        previousAmount: prev[departmentId],
        totalAllocated: Object.values(newAllocations).reduce((sum, a) => sum + a, 0)
      });

      return newAllocations;
    });
  }, [log]);

  const handleReset = () => {
    log('budget_reset', { previousAllocations: allocations });
    setAllocations(getInitialAllocations());
  };

  const totalAllocated = Object.values(allocations).reduce((sum, amount) => sum + amount, 0);

  return (
    <PageContainer>
      <PageTitle>Business Trip Budget Planner</PageTitle>
      <PageSubtitle>
        Plan a 4-day business trip to Berlin under a $2,000 budget.
        Allocate the $10,000 total budget across departments while satisfying all constraints.
      </PageSubtitle>

      <ContentLayout>
        <div>
          <TableContainer>
            <Table>
              <TableHeader>
                <tr>
                  <TableHeaderCell>Department</TableHeaderCell>
                  <TableHeaderCell>Allocation ($)</TableHeaderCell>
                  <TableHeaderCell>Adjust</TableHeaderCell>
                </tr>
              </TableHeader>
              <tbody>
                {departments.map(department => (
                  <DepartmentRow
                    key={department.id}
                    department={department}
                    allocation={allocations[department.id]}
                    onAllocationChange={handleAllocationChange}
                    maxBudget={MAX_BUDGET}
                  />
                ))}
              </tbody>
            </Table>
          </TableContainer>
        </div>

        <div>
          <ConstraintsPanel 
            constraints={constraints} 
            allocations={allocations} 
          />
          
          <BudgetSummary 
            allocations={allocations}
            constraints={constraints}
            onReset={handleReset}
          />
        </div>
      </ContentLayout>
    </PageContainer>
  );
};

export default Task3;