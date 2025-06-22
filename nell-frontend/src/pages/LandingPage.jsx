import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/templates')
      .then(res => res.json())
      .then(data => {
        setTemplates(data.templates || {});
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  const createProject = async (templateId, name) => {
    try {
      const response = await fetch('/projects/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: templateId,
          name: name,
          include_sample_data: true
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        navigate(`/projects/${result.project_name}/dashboard`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Nell Beta</h1>
          <p className="text-xl text-gray-600">AI-powered project management</p>
        </header>

        <section>
          <h2 className="text-3xl font-bold mb-8">Create New Project</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(templates).map(([id, template]) => (
              <div key={id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-bold mb-2">{template.name}</h3>
                <p className="text-gray-600 mb-4">{template.description}</p>
                <button
                  onClick={() => {
                    const name = prompt(`Enter name for your ${template.name}:`);
                    if (name) createProject(id, name);
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  Create Project
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
