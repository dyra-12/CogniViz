import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useTaskProgress } from '../contexts/TaskProgressContext';

const StyledHeader = styled.header`
  background-color: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[4]} 0;
  border-bottom: 1px solid ${props => props.theme.colors.gray200};
  box-shadow: ${props => props.theme.shadows.sm};
  position: sticky;
  top: 0;
  z-index: 100;
`;

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled(Link)`
  font-family: ${props => props.theme.fonts.heading};
  font-size: ${props => props.theme.fontSizes.xl};
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  text-decoration: none;

  &:hover {
    color: ${props => props.theme.colors.secondary};
  }
`;

const Nav = styled.nav`
  display: flex;
  gap: ${props => props.theme.spacing[4]};
  align-items: center;
`;

const NavLink = styled(Link)`
  font-weight: 500;
  color: ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.gray700};
  text-decoration: none;
  padding: ${props => props.theme.spacing[2]} ${props => props.theme.spacing[3]};
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all 0.2s ease;
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};
  opacity: ${props => props.disabled ? 0.5 : 1};

  &:hover {
    color: ${props => props.disabled ? props.theme.colors.gray700 : props.theme.colors.primary};
    background-color: ${props => props.disabled ? 'transparent' : props.theme.colors.gray100};
  }
`;

const ProgressIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing[2]};
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.gray600};
  margin-left: ${props => props.theme.spacing[4]};
`;

const ProgressDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.completed ? props.theme.colors.success : 
                         props.active ? props.theme.colors.primary : props.theme.colors.gray300};
`;

const Header = () => {
  const location = useLocation();
  const { currentTask, completedTasks } = useTaskProgress();

  return (
    <StyledHeader>
      <div className="container">
        <HeaderContainer>
          <Logo to="/">Research Platform</Logo>
          <Nav>
            <NavLink 
              to="/task1" 
              isActive={location.pathname === '/task1'}
              disabled={currentTask !== 1}
            >
              Task 1: Form
            </NavLink>
            <NavLink 
              to="/task2" 
              isActive={location.pathname === '/task2'}
              disabled={currentTask !== 2}
            >
              Task 2: Laptop
            </NavLink>
            <NavLink 
              to="/task3" 
              isActive={location.pathname === '/task3'}
              disabled={currentTask !== 3}
            >
              Task 3: Travel
            </NavLink>
            
            <ProgressIndicator>
              <ProgressDot completed={completedTasks.includes(1)} active={currentTask === 1} />
              <ProgressDot completed={completedTasks.includes(2)} active={currentTask === 2} />
              <ProgressDot completed={completedTasks.includes(3)} active={currentTask === 3} />
            </ProgressIndicator>
          </Nav>
        </HeaderContainer>
      </div>
    </StyledHeader>
  );
};

export default Header;