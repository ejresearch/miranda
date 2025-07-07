// src/components/LandingPage.tsx - Error-free version
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateService, projectService } from '../services/api';

export default function LandingPage() {
  const [projects, setProjects] = useState<string[]>([]);
  const [templates, setTemplates] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<string | false>(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError('');
      const [projectsData, templatesData] = await Promise.all([
        projectService.getAllProjects().catch(() => []), // Graceful fallback
        templateService.getTemplates().catch(() => ({}))  // Graceful fallback
      ]);
      
      setProjects(projectsData || []);
      setTemplates(templatesData || {});
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to connect to backend. Check that your backend is running on port 8000.');
      // Set fallback data so page still works
      setTemplates({
        screenplay: { name: 'Screenplay Writing', description: 'Full screenplay development with character arcs' },
        academic_textbook: { name: 'Academic Textbook', description: 'Research-driven academic writing' },
        business_plan: { name: 'Business Plan', description: 'Comprehensive business strategy' },
        custom: { name: 'Custom Project', description: 'Start with a blank slate' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData: any) => {
    try {
      setError('');
      await templateService.createFromTemplate({
        ...projectData,
        include_sample_data: true
      });
      
      // Navigate to project dashboard (placeholder for now)
      navigate(`/projects/${projectData.name}/dashboard`);
    } catch (error) {
      console.error('Failed to create project:', error);
      setError('Failed to create project. Make sure your backend is running.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Nell Beta
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered project management for creative and research projects
          </p>
          {error && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md max-w-2xl mx-auto">
              <p className="font-medium">Backend Connection Issue:</p>
              <p className="text-sm">{error}</p>
              <p className="text-sm mt-2">Demo templates are shown below. Start your backend to enable full functionality.</p>
            </div>
          )}
        </header>

        {/* Existing Projects */}
        {projects.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Your Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <ProjectCard 
                  key={project} 
                  project={project} 
                  onClick={() => navigate(`/projects/${project}/dashboard`)} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Template Selection */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Start New Project</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(templates).map(([id, template]) => (
              <TemplateCard 
                key={id} 
                templateId={id} 
                template={template}
                onClick={() => setShowCreateModal(id)}
              />
            ))}
          </div>
        </section>

        {/* Demo Projects */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Demo Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DemoProjectCard 
              title="RomCom Screenplay"
              description="Complete romantic comedy with characters and scenes"
              onClick={() => navigate('/demo/romcom')}
            />
            <DemoProjectCard 
              title="Film History Textbook"
              description="Academic textbook with research and citations"
              onClick={() => navigate('/demo/textbook')}
            />
          </div>
        </section>
      </div>

      {showCreateModal && templates[showCreateModal] && (
        <CreateProjectModal 
          templateId={showCreateModal}
          template={templates[showCreateModal]}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateProject}
        />
      )}
    </div>
  );
}

// Sub-components with fixed types
function ProjectCard({ project, onClick }: { project: string; onClick: () => void }) {
  return (
    <div 
      className="bg-white rounded-lg shadow-md border p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold mb-2 text-gray-800">{project}</h3>
      <p className="text-gray-600 text-sm">Click to open project</p>
    </div>
  );
}

function TemplateCard({ 
  templateId, 
  template, 
  onClick 
}: { 
  templateId: string; 
  template: any; // Fixed type
  onClick: () => void 
}) {
  const getTemplateIcon = (id: string) => {
    const icons: Record<string, string> = {
      screenplay: '🎬',
      academic_textbook: '📚',
      business_plan: '💼',
      custom: '⚡'
    };
    return icons[id] || '📄';
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md border p-6 cursor-pointer hover:shadow-lg transition-all hover:border-blue-200"
      onClick={onClick}
    >
      <div className="text-3xl mb-3 text-center">{getTemplateIcon(templateId)}</div>
      <h3 className="text-lg font-semibold mb-2 text-gray-800">{template?.name || 'Template'}</h3>
      <p className="text-gray-600 text-sm">{template?.description || 'Template description'}</p>
    </div>
  );
}

function DemoProjectCard({ 
  title, 
  description, 
  onClick 
}: { 
  title: string; 
  description: string; 
  onClick: () => void 
}) {
  return (
    <div 
      className="bg-white rounded-lg shadow-md border p-6 cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200"
      onClick={onClick}
    >
      <div className="text-2xl mb-2">🚀</div>
      <h3 className="text-lg font-semibold mb-2 text-gray-800">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
      <div className="mt-3 text-xs text-purple-600 font-medium">DEMO PROJECT</div>
    </div>
  );
}

function CreateProjectModal({ 
  templateId, 
  template, 
  onClose, 
  onCreate 
}: {
  templateId: string;
  template: any; // Fixed type
  onClose: () => void;
  onCreate: (data: any) => void;
}) {
  const [projectName, setProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setCreating(true);
    try {
      await onCreate({
        name: projectName.trim(),
        template: templateId,
        description: `${template?.name || 'Template'} project`
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Create {template?.name || 'Project'}</h2>
        <p className="text-gray-600 text-sm mb-4">{template?.description || 'Create a new project'}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name..."
              autoFocus
              disabled={creating}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={!projectName.trim() || creating}
            >
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
