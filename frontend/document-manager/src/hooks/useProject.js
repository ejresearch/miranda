// frontend/document-manager/src/hooks/useProject.js
import { useState, useCallback } from 'react';
import apiClient from '../api/client';

export const useProject = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get all projects
  const refreshProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const projectList = await apiClient.getProjects();
      
      // Transform backend data to match frontend expectations
      const transformedProjects = Array.isArray(projectList) 
        ? projectList.map(project => ({
            id: project.name || project.id, // Use name as ID for now
            name: project.name,
            description: project.description || 'No description',
            createdAt: new Date(project.created || Date.now()),
            updatedAt: new Date(project.updated || Date.now()),
            isFavorite: project.isFavorite || false,
            stats: {
              documents: project.stats?.documents || 0,
              tables: project.stats?.tables || 0,
              brainstorms: project.stats?.brainstorms || 0
            },
            type: project.type || 'general',
            template: project.template || 'custom',
            status: 'active'
          }))
        : [];
      
      setProjects(transformedProjects);
      return transformedProjects;
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError(err.message);
      // Return empty array on error so UI doesn't break
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new project
  const createProject = useCallback(async (projectData) => {
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        name: projectData.name || 'New Project',
      };
      
      const newProject = await apiClient.createProject(payload);
      
      // Transform response to match frontend format
      const transformedProject = {
        id: newProject.project || newProject.name,
        name: newProject.project || newProject.name,
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
        template: projectData.template || 'custom',
        status: 'active'
      };
      
      setProjects(prev => [transformedProject, ...prev]);
      return transformedProject;
    } catch (err) {
      console.error('Failed to create project:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update project (keep mock for now since no backend endpoint)
  const updateProject = useCallback(async (projectId, updates) => {
    try {
      // TODO: Implement when backend has update endpoint
      setProjects(prev => 
        prev.map(p => p.id === projectId ? { ...p, ...updates, updatedAt: new Date() } : p)
      );
      return { id: projectId, ...updates, updatedAt: new Date() };
    } catch (err) {
      setError(err.message);
      console.error('Failed to update project:', err);
      throw err;
    }
  }, []);

  // Delete project (keep mock for now since no backend endpoint)
  const deleteProject = useCallback(async (projectId) => {
    try {
      // TODO: Implement when backend has delete endpoint
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      setError(err.message);
      console.error('Failed to delete project:', err);
      throw err;
    }
  }, []);

  // Toggle favorite status (keep mock for now)
  const favoriteProject = useCallback(async (projectId) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const newFavoriteStatus = !project.isFavorite;
      // TODO: Call backend when endpoint exists
      
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
    return projects.find(p => p.id === projectId);
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
