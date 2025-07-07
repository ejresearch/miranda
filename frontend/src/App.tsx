import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/projects/:projectName/dashboard" element={
            <div className="p-8 text-center">
              <h1 className="text-2xl">Project Dashboard</h1>
              <p className="text-gray-600">Coming in Week 2!</p>
              <button 
                onClick={() => window.location.href = '/'} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Back to Home
              </button>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
