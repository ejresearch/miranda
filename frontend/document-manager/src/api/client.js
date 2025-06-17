// frontend/document-manager/src/api/client.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/healthcheck');
  }

  // Project methods
  async getProjects() {
    return this.request('/projects');
  }

  async createProject(projectData) {
    return this.request('/projects/new', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async getProject(projectName) {
    return this.request(`/projects/${projectName}`);
  }

  // Bucket methods
  async listBuckets() {
    return this.request('/buckets');
  }

  async createBucket(bucket) {
    return this.request('/buckets/new', {
      method: 'POST',
      body: JSON.stringify({ bucket }),
    });
  }

  async deleteBucket(bucket) {
    return this.request(`/buckets/${bucket}`, {
      method: 'DELETE',
    });
  }

  async uploadDocument(bucket, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request(`/buckets/${bucket}/ingest`, {
      method: 'POST',
      body: formData,
    });
  }

  async listBucketFiles(bucket) {
    return this.request(`/buckets/${bucket}/files`);
  }

  async queryBucket(bucket, query, userPrompt = '') {
    return this.request(`/buckets/${bucket}/query`, {
      method: 'POST',
      body: JSON.stringify({ query, user_prompt: userPrompt }),
    });
  }

  // Table methods
  async uploadCSV(project, tableName, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request(`/tables/upload_csv?project=${project}&table_name=${tableName}`, {
      method: 'POST',
      body: formData,
    });
  }

  async listTables(project) {
    return this.request(`/tables/list?project=${project}`);
  }

  async getTable(project, tableName, column = null, value = null) {
    let url = `/tables/${tableName}?project=${project}`;
    if (column && value) {
      url += `&column=${column}&value=${value}`;
    }
    return this.request(url);
  }

  // Brainstorm methods
  async generateBrainstorm(data) {
    return this.request('/brainstorm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Version methods
  async listVersions(projectId, versionType) {
    return this.request(`/versions/projects/${projectId}/versions/${versionType}`);
  }

  async createVersion(projectId, versionType, versionData) {
    return this.request(`/versions/projects/${projectId}/versions/${versionType}`, {
      method: 'POST',
      body: JSON.stringify(versionData),
    });
  }

  async updateVersion(projectId, versionId, versionData) {
    return this.request(`/versions/projects/${projectId}/versions/${versionId}`, {
      method: 'PUT',
      body: JSON.stringify(versionData),
    });
  }

  async deleteVersion(projectId, versionId) {
    return this.request(`/versions/projects/${projectId}/versions/${versionId}`, {
      method: 'DELETE',
    });
  }

  // Graph methods
  async exportGraph() {
    return this.request('/buckets/export_graph');
  }

  async pushGraphToNeo4j() {
    return this.request('/graph/push', {
      method: 'POST',
    });
  }

  async fetchGraphData(limit = 100) {
    return this.request(`/graph/all?limit=${limit}`);
  }
}

export const apiClient = new APIClient();
export default apiClient;
