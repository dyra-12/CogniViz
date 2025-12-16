import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { AuthProvider } from './contexts/AuthContext';
import { TaskProgressProvider } from './contexts/TaskProgressContext';
import { theme } from './styles/theme';
import GlobalStyles from './styles/GlobalStyles';
import AppLayout from './components/AppLayout';
import { CognitiveLoadProvider } from './contexts/CognitiveLoadContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <AuthProvider>
        <TaskProgressProvider>
          <CognitiveLoadProvider>
            <Router>
              <AppLayout />
            </Router>
          </CognitiveLoadProvider>
        </TaskProgressProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;