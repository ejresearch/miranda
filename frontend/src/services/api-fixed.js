// Fixed API service that aligns with actual backend endpoints
        const API_BASE = 'http://127.0.0.1:8000';

class APIService {
    constructor() {
        this.baseURL = API_BASE;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            // Handle different content types
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return await response.text();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // Fixed project management
    async getProjects() {
        return await this.request('/projects');
    }

    async createProject(data) {
        return await this.request('/projects/new', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Fixed template system
    async getTemplates() {
        return await this.request('/templates/templates');
    }

    async createFromTemplate(data) {
        return await this.request('/templates/projects/from-template', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Fixed bucket management
    async createBucket(projectName, bucketName) {
        return await this.request(`/projects/${projectName}/buckets/buckets/new`, {
            method: 'POST',
            body: JSON.stringify({ bucket: bucketName })
        });
    }

    async uploadDocument(projectName, bucketName, file) {
        const formData = new FormData();
        formData.append('file', file);
        
        return await this.request(`/projects/${projectName}/buckets/buckets/${bucketName}/ingest`, {
            method: 'POST',
            headers: {}, // Remove Content-Type to let browser set it for FormData
            body: formData
        });
    }

    async listBuckets(projectName) {
        return await this.request(`/projects/${projectName}/buckets/buckets`);
    }

    async queryBucket(projectName, bucketName, query, userPrompt = '') {
        return await this.request(`/projects/${projectName}/buckets/buckets/${bucketName}/query`, {
            method: 'POST',
            body: JSON.stringify({ query, user_prompt: userPrompt })
        });
    }

    // Fixed table management
    async uploadCSV(projectName, tableName, file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const url = `/projects/${projectName}/tables/upload_csv?project=${projectName}&table_name=${tableName}`;
        return await this.request(url, {
            method: 'POST',
            headers: {}, // Remove Content-Type for FormData
            body: formData
        });
    }

    async listTables(projectName) {
        return await this.request(`/projects/${projectName}/tables/list?project=${projectName}`);
    }

    async getTable(projectName, tableName) {
        return await this.request(`/projects/${projectName}/tables/${tableName}?project=${projectName}`);
    }

    // Fixed AI generation
    async generateBrainstorm(projectName, data) {
        const payload = {
            project_id: projectName,
            scene_id: data.sceneId || `scene_${Date.now()}`,
            scene_description: data.prompt || data.description,
            selected_buckets: data.selectedBuckets || [],
            custom_prompt: data.customPrompt || '',
            tone: data.tone || 'neutral',
            easter_egg: data.easterEgg || ''
        };

        return await this.request(`/projects/${projectName}/brainstorm/brainstorm`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async generateContent(projectName, data) {
        const payload = {
            project_id: projectName,
            prompt_tone: data.tone || 'neutral',
            custom_instructions: data.prompt || data.instructions || '',
            selected_buckets: data.selectedBuckets || [],
            selected_tables: data.selectedTables || [],
            brainstorm_version_ids: data.brainstormVersionIds || []
        };

        return await this.request(`/projects/${projectName}/write/write`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    // Fixed export system
    async exportJSON(projectName) {
        return await this.request(`/projects/${projectName}/export/json`);
    }

    async exportCSV(projectName) {
        const response = await fetch(`${this.baseURL}/projects/${projectName}/export/csv`);
        return response.blob();
    }

    async exportComplete(projectName) {
        const response = await fetch(`${this.baseURL}/projects/${projectName}/export/complete`);
        return response.blob();
    }

    // Version management
    async getVersions(projectName, versionType) {
        return await this.request(`/projects/${projectName}/versions/${versionType}`);
    }

    async createVersion(projectName, versionType, data) {
        return await this.request(`/projects/${projectName}/versions/${versionType}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

export const apiService = new APIService();
export default apiService;
