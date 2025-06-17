// frontend/document-manager/src/api/APIClient.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async requestWithFallback(endpoints, options) {
    let lastError;
    for (const ep of endpoints) {
      try {
        return await this.request(ep, options);
      } catch (err) {
        lastError = err;
        if (!/404|405/.test(err.message)) {
          break;
        }
      }
    }
    if (lastError) {
      throw lastError;
    }
    throw new Error('Request failed');
  }

  async request(endpoint, options = {}) {
    // Always use /api prefix for consistency
    const url = endpoint.startsWith('/api') 
      ? `${this.baseURL}${endpoint}` 
      : `${this.baseURL}/api${endpoint}`;
    
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
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      console.log(`📥 API Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`✅ API Success:`, data);
      return data;
    } catch (error) {
      console.error('🚨 API request failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/healthcheck');
  }

  // Project methods - Updated paths
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

  // Bucket methods - Updated paths  
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

  // Project-specific bucket methods
  async createProjectBucket(projectName, bucket) {
    return this.requestWithFallback(
      [
        `/projects/${projectName}/buckets/new`,
        `/projects/${projectName}/buckets/buckets/new`,
      ],
      {
        method: 'POST',
        body: JSON.stringify({ bucket }),
      }
    );
  }

  async uploadDocument(projectName, bucket, file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.requestWithFallback(
      [
        `/projects/${projectName}/buckets/${bucket}/ingest`,
        `/projects/${projectName}/buckets/buckets/${bucket}/ingest`,
      ],
      {
        method: 'POST',
        body: formData,
      }
    );
  }

  async listBucketFiles(projectName, bucket) {
    return this.requestWithFallback([
      `/projects/${projectName}/buckets/${bucket}/files`,
      `/projects/${projectName}/buckets/buckets/${bucket}/files`,
    ]);
  }

  async queryBucket(projectName, bucket, query, userPrompt = '') {
    return this.requestWithFallback(
      [
        `/projects/${projectName}/buckets/${bucket}/query`,
        `/projects/${projectName}/buckets/buckets/${bucket}/query`,
      ],
      {
        method: 'POST',
        body: JSON.stringify({ query, user_prompt: userPrompt }),
      }
    );
  }

  // Table methods - Updated paths
  async uploadCSV(project, tableName, file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.requestWithFallback(
      [
        `/projects/${project}/tables/upload_csv?project=${project}&table_name=${tableName}`,
        `/projects/${project}/tables/tables/upload_csv?project=${project}&table_name=${tableName}`,
      ],
      {
        method: 'POST',
        body: formData,
      }
    );
  }

  async listTables(project) {
    return this.requestWithFallback([
      `/projects/${project}/tables/list?project=${project}`,
      `/projects/${project}/tables/tables/list?project=${project}`,
    ]);
  }

  async getTable(project, tableName, column = null, value = null) {
    let url = `/projects/${project}/tables/${tableName}?project=${project}`;
    if (column && value) {
      url += `&column=${column}&value=${value}`;
    }
    const alt = `/projects/${project}/tables/tables/${tableName}?project=${project}${column && value ? `&column=${column}&value=${value}` : ''}`;
    return this.requestWithFallback([url, alt]);
  }

  // Brainstorm methods - Updated paths
  async generateBrainstorm(projectName, data) {
    return this.request(`/projects/${projectName}/brainstorm/brainstorm`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Version methods - Updated paths
  async listVersions(projectId, versionType) {
    return this.request(`/projects/${projectId}/versions/${versionType}`);
  }

  async createVersion(projectId, versionType, versionData) {
    return this.request(`/projects/${projectId}/versions/${versionType}`, {
      method: 'POST',
      body: JSON.stringify(versionData),
    });
  }

  async updateVersion(projectId, versionId, versionData) {
    return this.request(`/projects/${projectId}/versions/${versionId}`, {
      method: 'PUT',
      body: JSON.stringify(versionData),
    });
  }

  async deleteVersion(projectId, versionId) {
    return this.request(`/projects/${projectId}/versions/${versionId}`, {
      method: 'DELETE',
    });
  }

  // Graph methods - Updated paths
  async exportGraph(projectName) {
    return this.request(`/projects/${projectName}/buckets/export_graph`);
  }

  async pushGraphToNeo4j(projectName) {
    return this.request(`/projects/${projectName}/graph/push`, {
      method: 'POST',
    });
  }

  async fetchGraphData(projectName, limit = 100) {
    return this.request(`/projects/${projectName}/graph/all?limit=${limit}`);
  }

  // Test connection method
  async testConnection() {
    const tests = [];
    
    try {
      // Test 1: Health check
      const health = await this.healthCheck();
      tests.push({ name: 'Health Check', status: 'success', data: health });
    } catch (error) {
      tests.push({ name: 'Health Check', status: 'error', error: error.message });
    }

    try {
      // Test 2: List projects
      const projects = await this.getProjects();
      tests.push({ name: 'List Projects', status: 'success', data: projects });
    } catch (error) {
      tests.push({ name: 'List Projects', status: 'error', error: error.message });
    }

    try {
      // Test 3: List buckets
      const buckets = await this.listBuckets();
      tests.push({ name: 'List Buckets', status: 'success', data: buckets });
    } catch (error) {
      tests.push({ name: 'List Buckets', status: 'error', error: error.message });
    }

    return tests;
  }
}

export const apiClient = new APIClient();
export default apiClient;
