import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ProjectDashboard() {
  const { projectName } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{projectName}</h1>
              <p className="text-gray-600">Project Dashboard</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              ← Back
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-2">📄 Documents</h3>
            <p className="text-gray-600">Upload and manage research files</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-2">📊 Data</h3>
            <p className="text-gray-600">Structure your information</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-2">🧠 Brainstorm</h3>
            <p className="text-gray-600">Generate creative ideas</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-2">✍️ Write</h3>
            <p className="text-gray-600">Create final content</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Project: {projectName}</h2>
          <p className="text-gray-600">
            Your project has been created! The full dashboard is coming soon. 
            For now, you can use the backend API to manage your project data.
          </p>
        </div>
      </div>
    </div>
  );
}
