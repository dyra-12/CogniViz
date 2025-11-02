import { Routes, Route, Navigate } from 'react-router-dom';
import { useTaskProgress } from '../contexts/TaskProgressContext';
import Header from './Header';
import InstructionModal from './InstructionModal';
import QuestionnaireModal from './QuestionnaireModal';
import Task1 from '../pages/Task1';
import Task2 from '../pages/Task2';
import Task3 from '../pages/Task3';
import CompletionPage from '../pages/CompletionPage';
import ConsentLanding from '../pages/ConsentLanding';

const AppLayout = () => {
  const { 
    currentTask, 
    showInstructions, 
    setShowInstructions, 
    consentGiven,
    questionnaireData,
    handleQuestionnaireSubmit
  } = useTaskProgress();

  const getCurrentComponent = () => {
    switch (currentTask) {
      case 1: return <Task1 />;
      case 2: return <Task2 />;
      case 3: return <Task3 />;
      case 4: return <CompletionPage />;
      default: return <CompletionPage />;
    }
  };

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to={consentGiven ? `/task${currentTask}` : '/consent'} replace />} />
          <Route path="/consent" element={<ConsentLanding />} />
          <Route path="/task1" element={consentGiven ? (currentTask === 1 ? <Task1 /> : <Navigate to={`/task${currentTask}`} replace />) : <Navigate to="/consent" replace />} />
          <Route path="/task2" element={consentGiven ? (currentTask === 2 ? <Task2 /> : <Navigate to={`/task${currentTask}`} replace />) : <Navigate to="/consent" replace />} />
          <Route path="/task3" element={consentGiven ? (currentTask === 3 ? <Task3 /> : <Navigate to={`/task${currentTask}`} replace />) : <Navigate to="/consent" replace />} />
          <Route path="/task4" element={<CompletionPage />} />
          <Route path="/complete" element={<CompletionPage />} />
          <Route path="*" element={<Navigate to={`/task${currentTask}`} replace />} />
        </Routes>
      </main>

      {showInstructions && currentTask < 4 && consentGiven && (
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