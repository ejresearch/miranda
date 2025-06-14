import { useState, useCallback } from 'react';

// Mock API functions - replace with your actual API calls
const mockAPI = {
  getProjects: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock project data
    return [
      {
        id: 1,
        name: 'Market Research Q4',
        description: 'Customer analysis and market trends for Q4 planning',
        createdAt: new Date('2024-06-12'),
        updatedAt: new Date('2024-06-14'),
        isFavorite: true,
        stats: {
          documents: 15,
          tables: 4,
          brainstorms: 8
        },
        type: 'research',
        status: 'active'
      },
      {
        id: 2,
        name: 'Product Launch Analysis',
        description: 'Data analysis for new product launch strategy',
        createdAt: new Date('2024-06-13'),
        updatedAt: new Date('2024-06-13'),
        isFavorite: false,
        stats: {
          documents: 23,
          tables: 7,
          brainstorms: 12
        },
        type: 'product',
        status: 'active'
      },
      {
        id: 3,
        name: 'Customer Feedback Study',
        description: 'Analysis of customer satisfaction surveys',
        createdAt: new Date('2024-06-11'),
        updatedAt: new Date('2024-06-11'),
        isFavorite: true,
        stats: {
          documents: 8,
          tables: 3,
          brainstorms: 5
        },
        type: 'research',
        status: 'active'
      }
    ];
  },

  createProject: async (projectData) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newProject = {
      id: Date.now(),
      name: projectData.name || 'New Project',
      description: projectData.description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isFavorite: false,
      stats: {
        documents: 0,
        tables: 0,
        brainstorms: 0
      },
      type: projectData.type || 'general',
      status: 'active',
      template: projectData.template
    };
    
    return newProject;
  },

  updateProject: async (projectId, updates) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { id: projectId, ...updates, updatedAt: new Date() };
  },

  deleteProject: async (projectId) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true };
  },

  favoriteProject: async (projectId, isFavorite) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id: projectId, isFavorite };
  }
};

export const useProject = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get all projects
  const refreshProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const projectList = await mockAPI.getProjects();
      setProjects(projectList);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new project
  const createProject = useCallback(async (projectData) => {
    try {
      setLoading(true);
      setError(null);
      const newProject = await mockAPI.createProject(projectData);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      setError(err.message);
      console.error('Failed to create project:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update project
  const updateProject = useCallback(async (projectId, updates) => {
    try {
      const updatedProject = await mockAPI.updateProject(projectId, updates);
      setProjects(prev => 
        prev.map(p => p.id === projectId ? { ...p, ...updatedProject } : p)
      );
      return updatedProject;
    } catch (err) {
      setError(err.message);
      console.error('Failed to update project:', err);
      throw err;
    }
  }, []);

  // Delete project
  const deleteProject = useCallback(async (projectId) => {
    try {
      await mockAPI.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      setError(err.message);
      console.error('Failed to delete project:', err);
      throw err;
    }
  }, []);

  // Toggle favorite status
  const favoriteProject = useCallback(async (projectId) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const newFavoriteStatus = !project.isFavorite;
      await mockAPI.favoriteProject(projectId, newFavoriteStatus);
      
      setProjects(prev => 
        prev.map(p => 
          p.id === projectId ? { ...p, isFavorite: newFavoriteStatus } : p
        )
      );
    } catch (err) {
      setError(err.message);
      console.error('Failed to update favorite status:', err);
    }
  }, [projects]);

  // Get single project by ID
  const getProject = useCallback((projectId) => {
    return projects.find(p => p.id === parseInt(projectId));
  }, [projects]);

  return {
    projects,
    loading,
    error,
    refreshProjects,
    createProject,
    updateProject,
    deleteProject,
    favoriteProject,
    getProject
  };
};
