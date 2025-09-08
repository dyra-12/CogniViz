import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Button from './Button';

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

  &:hover {
    color: ${props => props.theme.colors.primary};
    background-color: ${props => props.theme.colors.gray100};
  }
`;

const Header = () => {
  const location = useLocation();

  return (
    <StyledHeader>
      <div className="container">
        <HeaderContainer>
          <Logo to="/">Research Platform</Logo>
          <Nav>
            <NavLink 
              to="/task1" 
              isActive={location.pathname === '/task1'}
            >
              Task 1: Form
            </NavLink>
            <NavLink 
              to="/task2" 
              isActive={location.pathname === '/task2'}
            >
              Task 2: Catalog
            </NavLink>
            <NavLink 
              to="/task3" 
              isActive={location.pathname === '/task3'}
            >
              Task 3: Weather
            </NavLink>
          </Nav>
        </HeaderContainer>
      </div>
    </StyledHeader>
  );
};

export default Header;