import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to the Research Platform</h1>
      <p>Please select a task from the navigation menu to begin.</p>
      <div style={{ marginTop: '2rem' }}>
        <h2>Tasks:</h2>
        <ul>
          <li><Link to="/task1">Task 1: Shipping Form</Link></li>
          <li><Link to="/task2">Task 2: Product Catalog</Link></li>
          <li><Link to="/task3">Task 3: Weather Dashboard</Link></li>
        </ul>
      </div>
    </div>
  );
};

export default HomePage;