import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
});

export const templateService = {
  async getTemplates() {
    const response = await api.get('/templates/templates');
    return response.data;
  },

  async createFromTemplate(data: any) {
    const response = await api.post('/templates/projects/from-template', data);
    return response.data;
  }
};

export const projectService = {
  async getAllProjects() {
    const response = await api.get('/projects/projects');
    return response.data.projects || [];
  }
};
