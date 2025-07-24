// Fixed Miranda API Service - Matches actual backend endpoints
const API_BASE = 'http://localhost:8000';

class MirandaAPI {
  constructor() {
    this.baseURL = API_BASE;
  }

  // Projects endpoints (corrected)
  async getProjects() {
    const response = await fetch(`${this.baseURL}/projects/projects`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  }

  async createProject(template, name, description, includeSampleData = false) {
    const response = await fetch(`${this.baseURL}/templates/projects/from-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template,
        name,
        description,
        include_sample_data: includeSampleData
      })
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
  }

  // Buckets endpoints (corrected)
  async createBucket(projectName, bucketName) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/buckets/buckets/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket_name: bucketName })
    });
    if (!response.ok) throw new Error('Failed to create bucket');
    return response.json();
  }

  async uploadToBucket(projectName, bucketName, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseURL}/projects/${projectName}/buckets/buckets/${bucketName}/ingest`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload file');
    return response.json();
  }

  // Tables endpoints (corrected)
  async uploadCSV(projectName, tableName, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseURL}/projects/${projectName}/tables/tables/upload_csv?project=${projectName}&table_name=${tableName}`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload CSV');
    return response.json();
  }

  async getTableData(projectName, tableName) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/tables/tables/${tableName}?project=${projectName}`);
    if (!response.ok) throw new Error('Failed to fetch table data');
    return response.json();
  }

  // AI Generation endpoints (corrected)
  async generateBrainstorm(projectName, options) {
    const payload = {
      project_id: projectName,
      scene_id: options.sceneId || 'general',
      scene_description: options.prompt || 'Generate creative insights',
      selected_buckets: options.selectedBuckets || [],
      selected_tables: options.selectedTables || [],
      custom_prompt: options.prompt || '',
      tone: options.tone || 'creative',
      easter_egg: ''
    };

    const response = await fetch(`${this.baseURL}/projects/${projectName}/brainstorm/brainstorm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to generate brainstorm');
    return response.json();
  }

  async generateWrite(projectName, options) {
    const payload = {
      project_id: projectName,
      prompt_tone: options.tone || 'creative',
      custom_instructions: options.instructions || '',
      selected_buckets: options.selectedBuckets || [],
      selected_tables: options.selectedTables || [],
      brainstorm_version_ids: options.brainstormVersions || []
    };

    const response = await fetch(`${this.baseURL}/projects/${projectName}/write/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to generate content');
    return response.json();
  }

  // Versions endpoints (corrected)
  async getBrainstormVersions(projectName) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/versions/brainstorm`);
    if (!response.ok) throw new Error('Failed to fetch brainstorm versions');
    return response.json();
  }

  async getWriteVersions(projectName) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/versions/write`);
    if (!response.ok) throw new Error('Failed to fetch write versions');
    return response.json();
  }

  // Export endpoints (corrected)
  async exportProject(projectName, format) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/export/export/${format}`);
    if (!response.ok) throw new Error('Failed to export project');
    return response.blob();
  }

  // Project status endpoints
  async getProjectBuckets(projectName) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/buckets/buckets`);
    if (!response.ok) throw new Error('Failed to fetch buckets');
    return response.json();
  }

  async getProjectTables(projectName) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/tables/tables`);
    if (!response.ok) throw new Error('Failed to fetch tables');
    return response.json();
  }
}

export const mirandaAPI = new MirandaAPI();
