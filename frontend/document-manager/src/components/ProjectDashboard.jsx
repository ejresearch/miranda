import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../hooks/useProject';

const ProjectCard = ({ project, onFavorite, onDelete }) => {
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - new Date(date));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-green-600 text-lg">📁</span>
          </div>
          <div>
            <button
              onClick={() => onFavorite(project.id)}
              className={`text-sm ${project.isFavorite ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500`}
            >
              ⭐
            </button>
            <span className="text-sm text-gray-500 ml-2">
              ⏰ {getTimeAgo(project.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="mb-4">
        <Link 
          to={`/project/${project.id}`}
          className="text-lg font-semibold text-gray-900 hover:text-green-600"
        >
          {project.name}
        </Link>
        <p className="text-sm text-gray-600 mt-1">
          {project.description || 'No description'}
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-center">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {project.stats?.documents || 0}
          </div>
          <div className="text-xs text-gray-500">Documents</div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {project.stats?.tables || 0}
          </div>
          <div className="text-xs text-gray-500">Tables</div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {project.stats?.brainstorms || 0}
          </div>
          <div className="text-xs text-gray-500">Brainstorms</div>
        </div>
      </div>
    </div>
  );
};

const ProjectDashboard = () => {
  const { projects, loading, error, favoriteProject, deleteProject, refreshProjects } = useProject();
  const [sortBy, setSortBy] = useState('recent'); // recent, favorite, name

  useEffect(() => {
    refreshProjects();
  }, []);

  const sortedProjects = React.useMemo(() => {
    if (!projects) return [];
    
    const sorted = [...projects];
    
    switch (sortBy) {
      case 'favorite':
        return sorted.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'recent':
      default:
        return sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
  }, [projects, sortBy]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading projects: {error}</p>
        <button
          onClick={refreshProjects}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Your Projects</h1>
        
        {/* Sort Options */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="recent">Recent</option>
            <option value="favorite">Favorites</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {sortedProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">📁</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">Create your first project to get started</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('newProject'))}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onFavorite={favoriteProject}
              onDelete={deleteProject}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectDashboard;
