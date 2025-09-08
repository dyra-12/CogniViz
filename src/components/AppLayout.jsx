import { Routes, Route } from 'react-router-dom';
import Header from './Header';
import HomePage from '../pages/HomePage';
import Task1 from '../pages/Task1';
import Task2 from '../pages/Task2';
import Task3 from '../pages/Task3';

const AppLayout = () => {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        {/* Define your routes here */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/task1" element={<Task1 />} />
          <Route path="/task2" element={<Task2 />} />
          <Route path="/task3" element={<Task3 />} />
        </Routes>
      </main>
    </div>
  );
};

export default AppLayout;