import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTaskProgress } from '../contexts/TaskProgressContext';
import Header from './Header';
import ModeBadge from './ModeBadge';
import InstructionModal from './InstructionModal';
import QuestionnaireModal from './QuestionnaireModal';
import Task1 from '../pages/Task1';
import Task2 from '../pages/Task2';
import Task3 from '../pages/Task3';
import CompletionPage from '../pages/CompletionPage';
import ConsentLanding from '../pages/ConsentLanding';
import CognitiveLoadDemo from '../pages/CognitiveLoadDemo';


const AppLayout = () => {
  const { 
    currentTask, 
    showInstructions, 
    setShowInstructions, 
    consentGiven,
    questionnaireData,
    handleQuestionnaireSubmit
  } = useTaskProgress();

  const location = useLocation();

  // The routing table below renders task components directly.

  return (
    <div className="app">
      <ModeBadge />
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to={consentGiven ? `/task${currentTask}` : '/consent'} replace />} />
          <Route path="/consent" element={<ConsentLanding />} />
          <Route path="/cognitive-demo" element={<CognitiveLoadDemo />} />
          <Route path="/task1" element={consentGiven ? (currentTask === 1 ? <Task1 /> : <Navigate to={`/task${currentTask}`} replace />) : <Navigate to="/consent" replace />} />
          <Route path="/task2" element={consentGiven ? (currentTask === 2 ? <Task2 /> : <Navigate to={`/task${currentTask}`} replace />) : <Navigate to="/consent" replace />} />
          <Route path="/task3" element={consentGiven ? (currentTask === 3 ? <Task3 /> : <Navigate to={`/task${currentTask}`} replace />) : <Navigate to="/consent" replace />} />
          <Route path="/task4" element={<CompletionPage />} />
          <Route path="/complete" element={<CompletionPage />} />
          <Route path="*" element={<Navigate to={`/task${currentTask}`} replace />} />
        </Routes>
      </main>

      {showInstructions && currentTask < 4 && consentGiven && !location.pathname.startsWith('/consent') && (
        <InstructionModal 
          taskNumber={currentTask} 
          onClose={() => setShowInstructions(false)} 
        />
      )}

      {/* NASA-TLX Questionnaire Modal */}
      <QuestionnaireModal
        isOpen={questionnaireData.isOpen}
        taskId={questionnaireData.taskId}
        onSubmit={handleQuestionnaireSubmit}
      />

    </div>
  );
};

export default AppLayout;