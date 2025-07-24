import React, { useState, useEffect } from 'react';

const WorkingMiranda = () => {
  const [currentView, setCurrentView] = useState('home');
  const [backendOnline, setBackendOnline] = useState(false);
  const [message, setMessage] = useState('');

  // Check backend connection
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:8000/healthcheck');
        setBackendOnline(response.ok);
      } catch {
        setBackendOnline(false);
      }
    };
    checkBackend();
  }, []);

  const handleNavClick = (view: string) => {
    setCurrentView(view);
    setMessage(`Switched to ${view} view`);
    console.log('Navigation clicked:', view);
  };

  const handleTemplateClick = (template: string) => {
    setMessage(`Creating ${template} project...`);
    console.log('Template clicked:', template);
    // Here you would normally start the project creation workflow
  };

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
          </div>
        )}

        {currentView !== 'home' && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', textTransform: 'capitalize' }}>
              {currentView} View
            </h2>
            <p style={{ color: '#6b7280' }}>
              This section is under development. Navigation is working!
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
    </div>
  );
};

export default WorkingMiranda;
