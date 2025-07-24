import React, { useState, useEffect } from 'react';

// API Service for Phase 1
class MirandaAPI {
  private baseURL = 'http://localhost:8000';

  async healthCheck() {
    const response = await fetch(`${this.baseURL}/healthcheck`);
    return response.ok;
  }

  async getTemplates() {
    const response = await fetch(`${this.baseURL}/templates/templates`);
    if (!response.ok) throw new Error('Failed to fetch templates');
    return response.json();
  }

  async createProjectFromTemplate(data: {
    template: string;
    name: string;
    description: string;
    include_sample_data: boolean;
  }) {
    const response = await fetch(`${this.baseURL}/templates/projects/from-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
  }
}

const api = new MirandaAPI();

// Types for Phase 1
interface Template {
  id: string;
  name: string;
  description: string;
  bucket_count: number;
  table_count: number;
  has_sample_data: boolean;
}

interface ProjectData {
  name: string;
  template: string;
  description: string;
}

const WorkingMiranda: React.FC = () => {
  // Existing working state
  const [currentView, setCurrentView] = useState<string>('home');
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Phase 1: Project Creation Workflow state
  const [showWorkflow, setShowWorkflow] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    template: '',
    description: ''
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Check backend connection and load templates
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const isOnline = await api.healthCheck();
        setBackendOnline(isOnline);
        if (isOnline) {
          await loadTemplates();
        }
      } catch {
        setBackendOnline(false);
      }
    };
    checkBackend();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await api.getTemplates();
      const templateArray = Object.entries(data.templates).map(([id, template]: [string, any]) => ({
        id,
        ...template
      }));
      setTemplates(templateArray);
      console.log('✅ Templates loaded:', templateArray.map(t => t.name));
    } catch (error) {
      console.error('❌ Failed to load templates:', error);
      setMessage('Failed to load templates from backend');
    }
  };

  // Navigation handlers (existing)
  const handleNavClick = (view: string) => {
    console.log('🔥 Navigation clicked:', view);
    if (view === 'workflow') {
      setShowWorkflow(true);
      setCurrentView('workflow');
      setMessage('🚀 Starting project creation workflow');
      setCurrentStep(1);
    } else {
      setShowWorkflow(false);
      setCurrentView(view);
      setMessage(`Switched to ${view} view`);
    }
  };

  const handleTemplateClick = (template: string) => {
    console.log('🔥 Template clicked:', template);
    setMessage(`Starting ${template} project...`);
    setShowWorkflow(true);
    setCurrentView('workflow');
    setCurrentStep(1);
  };

  // Phase 1: Project Creation Workflow Functions
  const validateProjectName = (name: string): {[key: string]: string} => {
    const errors: {[key: string]: string} = {};
    if (!name) {
      errors.name = 'Project name is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      errors.name = 'Only letters, numbers, underscores, and hyphens allowed';
    } else if (name.length < 3) {
      errors.name = 'Project name must be at least 3 characters';
    } else if (name.length > 50) {
      errors.name = 'Project name must be less than 50 characters';
    }
    return errors;
  };

  const handleProjectNameChange = (name: string) => {
    setProjectData(prev => ({ ...prev, name }));
    const errors = validateProjectName(name);
    setValidationErrors(errors);
  };

  const handleTemplateSelect = (template: Template) => {
    setProjectData(prev => ({ 
      ...prev, 
      template: template.id,
      description: template.description 
    }));
    setMessage(`Selected ${template.name} template`);
    console.log('📋 Template selected:', template.name);
  };

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 2:
        return projectData.name.length >= 3 && !validationErrors.name;
      case 3:
        return !!projectData.template;
      case 4:
        return true; // For Phase 1, we'll skip upload validation
      case 5:
        return true;
      default:
        return true;
    }
  };

  const handleCreateProject = async () => {
    setIsLoading(true);
    try {
      const result = await api.createProjectFromTemplate({
        template: projectData.template,
        name: projectData.name,
        description: projectData.description,
        include_sample_data: true
      });
      
      setMessage(`✅ Project "${projectData.name}" created successfully!`);
      setCurrentStep(5);
      console.log('🎉 Project created:', result);
    } catch (error) {
      console.error('❌ Project creation failed:', error);
      setMessage(`❌ Failed to create project: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetWorkflow = () => {
    setShowWorkflow(false);
    setCurrentStep(1);
    setProjectData({ name: '', template: '', description: '' });
    setValidationErrors({});
    setMessage('');
  };

  // Step indicator component
  const renderStepIndicator = () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginBottom: '2rem',
      padding: '1rem',
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      {[1, 2, 3, 4, 5].map((step, index) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: currentStep >= step ? '#3b82f6' : '#e5e7eb',
              color: currentStep >= step ? 'white' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              cursor: currentStep > step ? 'pointer' : 'default'
            }}
            onClick={() => currentStep > step && setCurrentStep(step)}
          >
            {currentStep > step ? '✓' : step}
          </div>
          
          {index < 4 && (
            <div
              style={{
                width: '60px',
                height: '2px',
                background: currentStep > step + 1 ? '#3b82f6' : '#e5e7eb',
                margin: '0 1rem'
              }}
            />
          )}
        </div>
      ))}
    </div>
  );

  // Step 1: Project Name Input
  const renderStep1 = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>
        Step 1: Project Name
      </h2>
      
      <div style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '1rem', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
      }}>
        <label style={{ 
          display: 'block', 
          fontSize: '1.1rem', 
          fontWeight: '600', 
          marginBottom: '0.5rem' 
        }}>
          Project Name
        </label>
        
        <input
          type="text"
          value={projectData.name}
          onChange={(e) => handleProjectNameChange(e.target.value)}
          placeholder="Enter your project name (e.g., my_screenplay_project)"
          style={{
            width: '100%',
            padding: '1rem',
            border: validationErrors.name ? '2px solid #ef4444' : '2px solid #e5e7eb',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            marginBottom: '1rem',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = validationErrors.name ? '#ef4444' : '#e5e7eb';
          }}
        />
        
        {validationErrors.name && (
          <div style={{ 
            color: '#ef4444', 
            fontSize: '0.875rem', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ⚠️ {validationErrors.name}
          </div>
        )}
        
        <div style={{ 
          background: '#f0f9ff', 
          border: '1px solid #0ea5e9', 
          borderRadius: '0.5rem', 
          padding: '1rem',
          marginBottom: '2rem' 
        }}>
          <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.875rem' }}>
            <strong>💡 Tip:</strong> Use descriptive names like "romantic_comedy_script" or "ai_research_paper". 
            Only letters, numbers, underscores, and hyphens are allowed.
          </p>
        </div>
        
        <button
          onClick={() => setCurrentStep(2)}
          disabled={!canProceedToStep(2)}
          style={{
            width: '100%',
            padding: '1rem 2rem',
            background: canProceedToStep(2) ? '#3b82f6' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: canProceedToStep(2) ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'background-color 0.2s'
          }}
        >
          Continue to Templates →
        </button>
      </div>
    </div>
  );

  // Step 2: Template Selection
  const renderStep2 = () => (
    <div>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>
        Step 2: Choose Template
      </h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: projectData.template === template.id ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (projectData.template !== template.id) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }}
          >
            {projectData.template === template.id && (
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#3b82f6',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}>
                ✓
              </div>
            )}
            
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {template.id === 'screenplay' && '🎬'}
              {template.id === 'academic_textbook' && '📚'}
              {template.id === 'research_project' && '🔬'}
              {template.name}
            </div>
            
            <p style={{ 
              color: '#6b7280', 
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              {template.description}
            </p>
            
            <div style={{ 
              background: '#f9fafb', 
              padding: '1rem', 
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>📦 Includes:</strong>
              </div>
              <div style={{ color: '#6b7280' }}>
                • {template.bucket_count} document buckets
              </div>
              <div style={{ color: '#6b7280' }}>
                • {template.table_count} data tables
              </div>
              {template.has_sample_data && (
                <div style={{ color: '#059669' }}>
                  • ✨ Sample data included
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => setCurrentStep(3)}
          disabled={!canProceedToStep(3)}
          style={{
            padding: '1rem 2rem',
            background: canProceedToStep(3) ? '#3b82f6' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: canProceedToStep(3) ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          Continue to Setup →
        </button>
      </div>
    </div>
  );

  // Step 3: Project Setup (Phase 1 - Basic confirmation)
  const renderStep3 = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>
        Step 3: Project Setup
      </h2>
      
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          📋 Project Summary
        </h3>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: '600' }}>Project Name:</span>
            <span>{projectData.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: '600' }}>Template:</span>
            <span>{templates.find(t => t.id === projectData.template)?.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: '600' }}>Sample Data:</span>
            <span>✅ Included</span>
          </div>
        </div>

        <div style={{
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#0c4a6e' }}>
            🚀 Ready to Create!
          </h4>
          <p style={{ margin: 0, color: '#0c4a6e' }}>
            Your project will be created with sample data and ready for content uploads and AI generation.
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleCreateProject}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '1rem 2rem',
              background: isLoading ? '#9ca3af' : '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading ? '⏳ Creating Project...' : '🎉 Create Project'}
          </button>
        </div>
      </div>
    </div>
  );

  // Step 4 & 5: Placeholder for future phases
  const renderStep4 = () => (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        📤 Upload Content
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        File upload functionality will be added in Phase 2.
      </p>
      <button 
        onClick={() => setCurrentStep(5)}
        style={{
          padding: '1rem 2rem',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer'
        }}
      >
        Skip to Completion →
      </button>
    </div>
  );

  const renderStep5 = () => (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        🎉 Project Created Successfully!
      </h2>
      
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#0c4a6e' }}>
            ✨ "{projectData.name}" is ready!
          </h4>
          <p style={{ margin: 0, color: '#0c4a6e' }}>
            Your {templates.find(t => t.id === projectData.template)?.name} project has been created with sample data and is ready for use.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>Phase 1</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>✅ Project Creation Complete</div>
          </div>
          
          <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9ca3af' }}>Phase 2</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>📤 File Upload (Coming Soon)</div>
          </div>
          
          <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9ca3af' }}>Phase 3</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>🤖 AI Generation (Coming Soon)</div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          onClick={resetWorkflow}
          style={{
            padding: '1rem 2rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          ➕ Create Another Project
        </button>
        
        <button
          onClick={() => setCurrentView('home')}
          style={{
            padding: '1rem 2rem',
            background: 'white',
            color: '#3b82f6',
            border: '2px solid #3b82f6',
            borderRadius: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🏠 Back to Home
        </button>
      </div>
    </div>
  );

  // Main workflow view
  const renderWorkflowView = () => (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: '2rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {renderStepIndicator()}
        
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </div>
    </div>
  );

  // Main render (existing home view + new workflow)
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      {/* Navigation Bar */}
      <div style={{ 
        background: 'white', 
        borderBottom: '1px solid #e5e7eb', 
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Miranda AI</h1>
          
          <nav style={{ display: 'flex', gap: '1rem' }}>
            {['home', 'workflow', 'brainstorm', 'write', 'versions'].map(view => (
              <button
                key={view}
                onClick={() => handleNavClick(view)}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  background: currentView === view ? '#3b82f6' : 'transparent',
                  color: currentView === view ? 'white' : '#6b7280',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {view}
              </button>
            ))}
          </nav>
        </div>
        
        <div style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          background: backendOnline ? '#dcfce7' : '#fee2e2',
          color: backendOnline ? '#166534' : '#991b1b',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: backendOnline ? '#22c55e' : '#ef4444'
          }} />
          {backendOnline ? 'Backend Online' : 'Backend Offline'}
        </div>
      </div>

      {/* Content */}
      {showWorkflow && currentView === 'workflow' ? renderWorkflowView() : (
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem' }}>
          {message && (
            <div style={{
              background: '#dbeafe',
              border: '1px solid #93c5fd',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1rem',
              color: '#1e40af'
            }}>
              {message}
            </div>
          )}

          {currentView === 'home' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                  Welcome to Miranda AI
                </h2>
                <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>
                  Intelligent research assistant for screenwriting, academic work, and creative projects
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div style={{
                  background: 'white',
                  borderRadius: '1rem',
                  padding: '2rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    Create New Project
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                    Start a new research project with AI-powered assistance
                  </p>
                  
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {[
                      { name: 'Screenplay Writing', desc: 'Professional screenplay development' },
                      { name: 'Academic Textbook', desc: 'Structured academic content' },
                      { name: 'Research Project', desc: 'Data-driven research analysis' }
                    ].map(template => (
                      <button
                        key={template.name}
                        onClick={() => handleTemplateClick(template.name)}
                        style={{
                          padding: '1rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          background: 'white',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#f9fafb';
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {template.name}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {template.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{
                  background: 'white',
                  borderRadius: '1rem',
                  padding: '2rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    Continue Existing Project
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                    Resume work on your existing research projects
                  </p>
                  
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    <p>No existing projects found</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      Create your first project to get started
                    </p>
                  </div>
                </div>
              </div>

              {/* Phase Progress Indicator */}
              <div style={{ 
                marginTop: '3rem', 
                padding: '2rem', 
                background: 'white', 
                borderRadius: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
                  🚀 Development Progress
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  <div style={{ textAlign: 'center', padding: '1rem', background: '#dcfce7', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</div>
                    <div style={{ fontWeight: 'bold', color: '#166534' }}>Phase 1</div>
                    <div style={{ fontSize: '0.875rem', color: '#059669' }}>Project Creation</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '1rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📤</div>
                    <div style={{ fontWeight: 'bold', color: '#6b7280' }}>Phase 2</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>File Upload</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '1rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🤖</div>
                    <div style={{ fontWeight: 'bold', color: '#6b7280' }}>Phase 3</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>AI Generation</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '1rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
                    <div style={{ fontWeight: 'bold', color: '#6b7280' }}>Phase 4</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Export & Polish</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView !== 'home' && currentView !== 'workflow' && (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem', textTransform: 'capitalize' }}>
                {currentView} View
              </h2>
              <p style={{ color: '#6b7280' }}>
                This section will be built in Phase 2-4. Navigation is working!
              </p>
              <button 
                onClick={() => handleNavClick('home')}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Back to Home
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkingMiranda;
