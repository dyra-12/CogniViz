import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { AuthProvider } from './contexts/AuthContext';
import { TaskProgressProvider } from './contexts/TaskProgressContext';
import { theme } from './styles/theme';
import GlobalStyles from './styles/GlobalStyles';
import AppLayout from './components/AppLayout';
import { CognitiveLoadProvider } from './contexts/CognitiveLoadContext';
import ModeBadge from './components/ModeBadge';
import LoadGaugePanel from './components/LoadGaugePanel';
import { useEffect } from 'react';
import FEATURE_ORDER from './telemetry/FEATURE_ORDER.json';

function App() {
  useEffect(() => {
    const debugEnabled = import.meta.env.VITE_ENABLE_DEBUG_TELEMETRY === 'true';
    if (debugEnabled) {
      console.log('[App] FEATURE_ORDER loaded:', FEATURE_ORDER);
      console.log('[App] Environment config:', {
        VITE_COG_LOAD_MODE: import.meta.env.VITE_COG_LOAD_MODE,
        VITE_WS_URL: import.meta.env.VITE_WS_URL,
        VITE_SCHEMA_VERSION: import.meta.env.VITE_SCHEMA_VERSION,
        VITE_ENABLE_DEBUG_TELEMETRY: import.meta.env.VITE_ENABLE_DEBUG_TELEMETRY,
      });
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <ModeBadge />
      <LoadGaugePanel />
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