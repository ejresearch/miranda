import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../../hooks/useProject';

const ProjectWorkflow = () => {
  const { id, step } = useParams();
  const navigate = useNavigate();
  const { getProject } = useProject();
  const [currentStep, setCurrentStep] = useState(step || 'documents');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const steps = [
    { id: 'documents', name: 'Documents', icon: '📄', description: 'Upload and organize source documents' },
    { id: 'data', name: 'Data', icon: '📊', description: 'Structure and analyze your data' },
    { id: 'brainstorm', name: 'Brainstorm', icon: '🧠', description: 'Generate and organize ideas' },
    { id: 'write', name: 'Write', icon: '✍️', description: 'Create your final output' },
    { id: 'export', name: 'Export', icon: '📤', description: 'Export and share your work' }
  ];

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const mockProject = {
          id: parseInt(id),
          name: 'Market Research Q4',
          description: 'Customer analysis and market trends for Q4 planning',
          type: 'research',
          template: 'market-research',
          createdAt: new Date('2024-06-12'),
          updatedAt: new Date('2024-06-14'),
          stats: {
            documents: 15,
            tables: 4,
            brainstorms: 8
          },
          progress: {
            documents: 0.8,
            data: 0.6,
            brainstorm: 0.4,
            write: 0.1,
            export: 0
          }
        };
        setProject(mockProject);
      } catch (error) {
        console.error('Failed to load project:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProject();
    }
  }, [id]);

  const handleStepChange = (stepId) => {
    setCurrentStep(stepId);
    navigate(`/project/${id}/${stepId}`);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'documents':
        return <DocumentsStep project={project} />;
      case 'data':
        return <DataStep project={project} />;
      case 'brainstorm':
        return <BrainstormStep project={project} />;
      case 'write':
        return <WriteStep project={project} />;
      case 'export':
        return <ExportStep project={project} />;
      default:
        return <DocumentsStep project={project} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ← Back to Projects
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
              </div>
              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = project.progress[step.id] > 0;
              
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepChange(step.id)}
                  className={`relative py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    isActive
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{step.icon}</span>
                    <span>{step.name}</span>
                    {isCompleted && (
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-96">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

const DocumentsStep = ({ project }) => (
  <div className="p-8 text-center">
    <div className="text-6xl mb-4">📄</div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">Documents Step</h3>
    <p className="text-gray-600 mb-6">Upload and organize your source documents for analysis.</p>
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
        <p className="text-gray-500">Drag and drop files here, or click to browse</p>
      </div>
      <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
        Upload Documents
      </button>
    </div>
  </div>
);

const DataStep = ({ project }) => (
  <div className="p-8 text-center">
    <div className="text-6xl mb-4">📊</div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">Data Step</h3>
    <p className="text-gray-600 mb-6">Structure and analyze your data tables.</p>
    <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
      Create Data Table
    </button>
  </div>
);

const BrainstormStep = ({ project }) => (
  <div className="p-8 text-center">
    <div className="text-6xl mb-4">🧠</div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">Brainstorm Step</h3>
    <p className="text-gray-600 mb-6">Generate and organize ideas based on your research.</p>
    <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
      Start Brainstorming
    </button>
  </div>
);

const WriteStep = ({ project }) => (
  <div className="p-8 text-center">
    <div className="text-6xl mb-4">✍️</div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">Write Step</h3>
    <p className="text-gray-600 mb-6">Create your final deliverable using AI assistance.</p>
    <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
      Start Writing
    </button>
  </div>
);

const ExportStep = ({ project }) => (
  <div className="p-8 text-center">
    <div className="text-6xl mb-4">📤</div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">Export Step</h3>
    <p className="text-gray-600 mb-6">Export and share your completed project.</p>
    <div className="space-x-4">
      <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
        Export as PDF
      </button>
      <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
        Share Link
      </button>
    </div>
  </div>
);

export default ProjectWorkflow;
