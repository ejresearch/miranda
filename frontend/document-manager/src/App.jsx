import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/layout/Header';
import ProjectDashboard from './components/ProjectDashboard';
import DocumentManager from './components/DocumentManager';
import TableManager from './components/TableManager';
import BrainstormManager from './components/BrainstormManager';
import ProjectWorkflow from './components/project/ProjectWorkflow';
import TemplateSelector from './components/templates/TemplateSelector';
import TestConnection from './components/TestConnection'; // ← Add this import
import { useProject } from './hooks/useProject';

function AppContent() {
  const navigate = useNavigate();
  const { createProject } = useProject();
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const handleNewProject = () => {
    setShowTemplateSelector(true);
  };

  const handleTemplateSelect = async (template) => {
    try {
      const newProject = await createProject({
        name: template.name || 'New Project',
        template: template.id,
        description: template.description || '',
        type: template.type || 'general'
      });
      
      setShowTemplateSelector(false);
      navigate(`/project/${newProject.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNewProject={handleNewProject} />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<ProjectDashboard />} />
          <Route path="/documents" element={<DocumentManager />} />
          <Route path="/tables" element={<TableManager />} />
          <Route path="/brainstorm" element={<BrainstormManager />} />
          <Route path="/project/:id" element={<ProjectWorkflow />} />
          <Route path="/project/:id/:step" element={<ProjectWorkflow />} />
          <Route path="/test" element={<TestConnection />} /> {/* ← Add this route */}
        </Routes>
      </main>

      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Choose Project Template</h2>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <TemplateSelector
              onSelectTemplate={handleTemplateSelect}
              onCancel={() => setShowTemplateSelector(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
