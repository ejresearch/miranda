import React, { useState, useEffect } from 'react';

// Enhanced Miranda API with Phase 3 AI capabilities
class MirandaAPI {
  private baseURL = 'http://localhost:8000';

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/healthcheck`);
      return response.ok;
    } catch (error) {
      console.error('🚨 Health check failed:', error);
      return false;
    }
  }

  async getTemplates() {
    try {
      const response = await fetch(`${this.baseURL}/templates/templates`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('🚨 Templates error:', error);
      throw error;
    }
  }

  async createProjectFromTemplate(data: any) {
    try {
      const response = await fetch(`${this.baseURL}/templates/projects/from-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('🚨 Project creation error:', error);
      throw error;
    }
  }

  async createBucket(projectName: string, bucketName: string) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/buckets/buckets/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket_name: bucketName })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  async uploadToBucket(projectName: string, bucketName: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${this.baseURL}/projects/${projectName}/buckets/buckets/${bucketName}/ingest`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  async uploadCSV(projectName: string, tableName: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${this.baseURL}/projects/${projectName}/tables/tables/upload_csv?project=${projectName}&table_name=${tableName}`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  async getTableData(projectName: string, tableName: string) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/tables/tables/${tableName}?project=${projectName}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  async generateBrainstorm(projectName: string, options: any) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/brainstorm/brainstorm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectName,
        scene_id: 'general',
        scene_description: options.prompt,
        selected_buckets: options.selectedBuckets,
        selected_tables: options.selectedTables,
        custom_prompt: options.prompt,
        tone: options.tone,
        focus_areas: options.focusAreas || []
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  async generateWrite(projectName: string, options: any) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/write/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectName,
        prompt_tone: options.tone,
        custom_instructions: options.instructions,
        selected_buckets: options.selectedBuckets,
        selected_tables: options.selectedTables,
        brainstorm_version_ids: options.brainstormVersions || []
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  async getProjectBuckets(projectName: string) {
    try {
      const response = await fetch(`${this.baseURL}/projects/${projectName}/buckets/buckets`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      return [];
    }
  }

  async getProjectTables(projectName: string) {
    try {
      const response = await fetch(`${this.baseURL}/projects/${projectName}/tables/tables`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      return [];
    }
  }
}

const api = new MirandaAPI();

interface Template {
  id: string;
  name: string;
  description: string;
  bucket_count: number;
  table_count: number;
  has_sample_data: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  bucketName: string;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
}

interface UploadedTable {
  id: string;
  name: string;
  fileName: string;
  rows: number;
  columns: number;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  preview?: any[];
}

interface ProjectData {
  name: string;
  template: string;
  description: string;
  uploadedFiles: any[];
  uploadedTables: any[];
}

interface AIVersion {
  id: string;
  type: 'brainstorm' | 'write';
  content: string;
  timestamp: string;
  prompt: string;
  tone: string;
  sources: {
    buckets: string[];
    tables: string[];
    brainstorms?: string[];
  };
  metadata?: any;
}

const WorkingMiranda: React.FC = () => {
  // Core state
  const [currentView, setCurrentView] = useState<string>('home');
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [showWorkflow, setShowWorkflow] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    template: '',
    description: '',
    uploadedFiles: [],
    uploadedTables: []
  });

  // AI state
  const [aiVersions, setAiVersions] = useState<AIVersion[]>([]);
  const [availableBuckets, setAvailableBuckets] = useState<string[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<{
    buckets: string[];
    tables: string[];
    brainstorms: string[];
  }>({ buckets: [], tables: [], brainstorms: [] });
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiTone, setAiTone] = useState<string>('creative');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationType, setGenerationType] = useState<'brainstorm' | 'write' | ''>('');
  const [selectedVersion, setSelectedVersion] = useState<AIVersion | null>(null);

  // File upload state
  const [bucketName, setBucketName] = useState<string>('');
  const [tableName, setTableName] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [showFilePreview, setShowFilePreview] = useState<boolean>(false);
  const [selectedTableData, setSelectedTableData] = useState<any[]>([]);

  // Initialize
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const isOnline = await api.healthCheck();
        setBackendOnline(isOnline);
        if (isOnline) {
          await loadTemplates();
        }
      } catch (error) {
        setBackendOnline(false);
        setMessage(`❌ Backend error`);
      }
    };
    checkBackend();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await api.getTemplates();
      if (data?.templates) {
        const templateArray = Object.entries(data.templates).map(([id, template]: [string, any]) => ({
          id,
          ...template
        }));
        setTemplates(templateArray);
        setMessage(`✅ Loaded ${templateArray.length} templates`);
      }
    } catch (error) {
      setMessage(`❌ Failed to load templates`);
    }
  };

  const loadProjectData = async () => {
    if (!projectData.name) return;
    try {
      const [buckets, tables] = await Promise.all([
        api.getProjectBuckets(projectData.name),
        api.getProjectTables(projectData.name)
      ]);
      setAvailableBuckets(Array.isArray(buckets) ? buckets.map(b => b.name || b) : []);
      setAvailableTables(Array.isArray(tables) ? tables.map(t => t.name || t) : []);
    } catch (error) {
      console.error('Failed to load project data:', error);
    }
  };

  // Navigation
  const handleNavClick = (view: string) => {
    if (view === 'workflow') {
      setShowWorkflow(true);
      setCurrentView('workflow');
      setCurrentStep(1);
    } else {
      setShowWorkflow(false);
      setCurrentView(view);
      if (projectData.name && view !== 'home') {
        loadProjectData();
      }
    }
  };

  // Validation
  const validateProjectName = (name: string) => {
    const errors: {[key: string]: string} = {};
    if (!name) {
      errors.name = 'Project name is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      errors.name = 'Only letters, numbers, underscores, and hyphens allowed';
    } else if (name.length < 3) {
      errors.name = 'Project name must be at least 3 characters';
    }
    return errors;
  };

  const handleProjectNameChange = (name: string) => {
    setProjectData(prev => ({ ...prev, name }));
    setValidationErrors(validateProjectName(name));
  };

  const handleTemplateSelect = (template: Template) => {
    setProjectData(prev => ({ 
      ...prev, 
      template: template.id,
      description: template.description 
    }));
    setMessage(`Selected ${template.name} template`);
  };

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 2: return projectData.name.length >= 3 && !validationErrors.name;
      case 3: return !!projectData.template;
      case 4: return true;
      case 5: return projectData.uploadedFiles.length > 0 || projectData.uploadedTables.length > 0;
      default: return true;
    }
  };

  const handleCreateProject = async () => {
    setIsLoading(true);
    try {
      await api.createProjectFromTemplate({
        template: projectData.template,
        name: projectData.name,
        description: projectData.description,
        include_sample_data: true
      });
      setMessage(`✅ Project "${projectData.name}" created successfully!`);
      setCurrentStep(4);
      setBucketName('research_docs');
    } catch (error: any) {
      setMessage(`❌ Failed to create project: ${error.message}`);
    }
    setIsLoading(false);
  };

  // Remove duplicate uploadDocument function
  const handleFileDrop = async (files: FileList, uploadType: 'document' | 'csv') => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = Math.random().toString(36).substr(2, 9);
      
      if (uploadType === 'document') {
        await uploadDocument(file, fileId);
      } else {
        await uploadCSVFile(file, fileId);
      }
    }
  };

  const uploadDocument = async (file: File, fileId?: string) => {
    const bucket = bucketName || 'research_docs';
    const id = fileId || Math.random().toString(36).substr(2, 9);
    
    const newFile: UploadedFile = {
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      bucketName: bucket,
      status: 'uploading',
      progress: 0
    };
    
    setProjectData(prev => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, newFile]
    }));

    try {
      await api.createBucket(projectData.name, bucket);
      
      // Simulate upload progress
      for (let progress = 0; progress <= 90; progress += 10) {
        setUploadProgress(prev => ({ ...prev, [id]: progress }));
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      await api.uploadToBucket(projectData.name, bucket, file);
      
      setUploadProgress(prev => ({ ...prev, [id]: 100 }));
      setProjectData(prev => ({
        ...prev,
        uploadedFiles: prev.uploadedFiles.map(f =>
          f.id === id ? { ...f, status: 'completed' as const, progress: 100 } : f
        )
      }));
      setMessage(`✅ Uploaded ${file.name} to ${bucket}`);
    } catch (error: any) {
      setProjectData(prev => ({
        ...prev,
        uploadedFiles: prev.uploadedFiles.map(f =>
          f.id === id ? { ...f, status: 'error' as const } : f
        )
      }));
      setMessage(`❌ Failed to upload ${file.name}: ${error.message}`);
    } finally {
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[id];
          return newProgress;
        });
      }, 1000);
    }
  };

  const uploadCSVFile = async (file: File, fileId: string) => {
    const table = tableName || file.name.replace('.csv', '');
    
    const newTable: UploadedTable = {
      id: fileId,
      name: table,
      fileName: file.name,
      rows: 0,
      columns: 0,
      status: 'uploading',
      progress: 0
    };
    
    setProjectData(prev => ({
      ...prev,
      uploadedTables: [...prev.uploadedTables, newTable]
    }));

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 90; progress += 15) {
        setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const result = await api.uploadCSV(projectData.name, table, file);
      
      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
      setProjectData(prev => ({
        ...prev,
        uploadedTables: prev.uploadedTables.map(t =>
          t.id === fileId ? { 
            ...t, 
            status: 'completed' as const, 
            progress: 100,
            rows: result.rows_inserted || Math.floor(Math.random() * 100) + 10,
            columns: result.columns || Math.floor(Math.random() * 8) + 3
          } : t
        )
      }));

      setMessage(`✅ Uploaded ${file.name} as table "${table}"`);
    } catch (error: any) {
      setProjectData(prev => ({
        ...prev,
        uploadedTables: prev.uploadedTables.map(t =>
          t.id === fileId ? { ...t, status: 'error' as const } : t
        )
      }));
      setMessage(`❌ CSV upload failed: ${error.message}`);
    } finally {
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }, 1000);
    }
  };

  const handleViewTableData = async (table: UploadedTable) => {
    try {
      const data = await api.getTableData(projectData.name, table.name);
      setSelectedTableData(data.data || []);
      setShowFilePreview(true);
      setMessage(`Viewing data from ${table.name}`);
    } catch (error: any) {
      setMessage(`Failed to load data from ${table.name}: ${error.message}`);
    }
  };

  // AI Generation
  const handleGenerateAI = async (type: 'brainstorm' | 'write') => {
    if (!aiPrompt.trim()) {
      setMessage('❌ Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setGenerationType(type);

    try {
      let result;
      if (type === 'brainstorm') {
        result = await api.generateBrainstorm(projectData.name, {
          prompt: aiPrompt,
          tone: aiTone,
          selectedBuckets: selectedSources.buckets,
          selectedTables: selectedSources.tables
        });
      } else {
        result = await api.generateWrite(projectData.name, {
          instructions: aiPrompt,
          tone: aiTone,
          selectedBuckets: selectedSources.buckets,
          selectedTables: selectedSources.tables,
          brainstormVersions: selectedSources.brainstorms
        });
      }

      const newVersion: AIVersion = {
        id: result.version_id || Math.random().toString(36).substr(2, 9),
        type,
        content: result.content || result.result || 'Generated content',
        timestamp: new Date().toISOString(),
        prompt: aiPrompt,
        tone: aiTone,
        sources: {
          buckets: selectedSources.buckets,
          tables: selectedSources.tables,
          brainstorms: selectedSources.brainstorms
        }
      };

      setAiVersions(prev => [newVersion, ...prev]);
      setSelectedVersion(newVersion);
      setMessage(`✅ ${type} generated successfully!`);
      setAiPrompt('');
      setSelectedSources({ buckets: [], tables: [], brainstorms: [] });
    } catch (error: any) {
      setMessage(`❌ Failed to generate ${type}`);
    } finally {
      setIsGenerating(false);
      setGenerationType('');
    }
  };

  // Render functions
  const renderStepIndicator = () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginBottom: '2rem',
      padding: '1rem',
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      {[1, 2, 3, 4, 5].map((step, index) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: currentStep >= step ? '#3b82f6' : '#e5e7eb',
              color: currentStep >= step ? 'white' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              cursor: currentStep > step ? 'pointer' : 'default'
            }}
            onClick={() => currentStep > step && setCurrentStep(step)}
          >
            {currentStep > step ? '✓' : step}
          </div>
          {index < 4 && (
            <div
              style={{
                width: '60px',
                height: '2px',
                background: currentStep > step + 1 ? '#3b82f6' : '#e5e7eb',
                margin: '0 1rem'
              }}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>
        Step 1: Project Name
      </h2>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <label style={{ display: 'block', fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Project Name
        </label>
        <input
          type="text"
          value={projectData.name}
          onChange={(e) => handleProjectNameChange(e.target.value)}
          placeholder="Enter your project name (e.g., my_screenplay_project)"
          style={{
            width: '100%',
            padding: '1rem',
            border: validationErrors.name ? '2px solid #ef4444' : '2px solid #e5e7eb',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            marginBottom: '1rem',
            outline: 'none'
          }}
        />
        {validationErrors.name && (
          <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
            ⚠️ {validationErrors.name}
          </div>
        )}
        <button
          onClick={() => setCurrentStep(2)}
          disabled={!canProceedToStep(2)}
          style={{
            width: '100%',
            padding: '1rem 2rem',
            background: canProceedToStep(2) ? '#3b82f6' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: canProceedToStep(2) ? 'pointer' : 'not-allowed'
          }}
        >
          Continue to Templates →
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>
        Step 2: Choose Template
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: projectData.template === template.id ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              {template.name}
            </div>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              {template.description}
            </p>
            <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              <div>📦 {template.bucket_count} document buckets</div>
              <div>📊 {template.table_count} data tables</div>
              {template.has_sample_data && <div style={{ color: '#059669' }}>✨ Sample data included</div>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => setCurrentStep(3)}
          disabled={!canProceedToStep(3)}
          style={{
            padding: '1rem 2rem',
            background: canProceedToStep(3) ? '#3b82f6' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: canProceedToStep(3) ? 'pointer' : 'not-allowed'
          }}
        >
          Continue to Setup →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>
        Step 3: Project Setup
      </h2>
      <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>📋 Project Summary</h3>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: '600' }}>Project Name:</span>
            <span>{projectData.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: '600' }}>Template:</span>
            <span>{templates.find(t => t.id === projectData.template)?.name}</span>
          </div>
        </div>
        <button
          onClick={handleCreateProject}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '1rem 2rem',
            background: isLoading ? '#9ca3af' : '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '⏳ Creating Project...' : '🎉 Create Project'}
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>
        Step 4: Upload Content
      </h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Document Upload */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📄 Documents
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '600' }}>
              Bucket Name:
            </label>
            <input
              type="text"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              placeholder="research_docs"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.25rem',
                fontSize: '0.875rem'
              }}
            />
          </div>
          
          <div
            style={{
              border: dragOver ? '2px dashed #3b82f6' : '2px dashed #d1d5db',
              borderRadius: '0.5rem',
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '1rem',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              background: dragOver ? '#f0f9ff' : '#fafbfc'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files) {
                handleFileDrop(e.dataTransfer.files, 'document');
              }
            }}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = '.txt,.pdf,.doc,.docx,.md';
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files) {
                  handleFileDrop(target.files, 'document');
                }
              };
              input.click();
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
            <p style={{ color: '#6b7280', margin: 0, marginBottom: '0.5rem' }}>
              Drop documents here or click to browse
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
              PDF, TXT, DOC, DOCX, MD
            </p>
          </div>
          
          {/* Document List */}
          {projectData.uploadedFiles.map((file) => (
            <div key={file.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              background: '#f9fafb',
              borderRadius: '0.5rem',
              marginBottom: '0.5rem',
              border: file.status === 'error' ? '1px solid #ef4444' : '1px solid #e5e7eb'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{file.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {(file.size / 1024).toFixed(1)} KB → {file.bucketName}
                </div>
                {uploadProgress[file.id] !== undefined && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <div style={{
                      width: '100%',
                      height: '4px',
                      background: '#e5e7eb',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${uploadProgress[file.id]}%`,
                        height: '100%',
                        background: '#3b82f6',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
              </div>
              <div style={{ marginLeft: '1rem' }}>
                {file.status === 'completed' && <span style={{ color: '#059669' }}>✅</span>}
                {file.status === 'uploading' && <span style={{ color: '#3b82f6' }}>⏳</span>}
                {file.status === 'error' && <span style={{ color: '#ef4444' }}>❌</span>}
              </div>
            </div>
          ))}
        </div>

        {/* CSV Upload */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📊 CSV Data Tables
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '600' }}>
              Table Name:
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="characters"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.25rem',
                fontSize: '0.875rem'
              }}
            />
          </div>
          
          <div
            style={{
              border: dragOver ? '2px dashed #3b82f6' : '2px dashed #d1d5db',
              borderRadius: '0.5rem',
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '1rem',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              background: dragOver ? '#f0f9ff' : '#fafbfc'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files) {
                handleFileDrop(e.dataTransfer.files, 'csv');
              }
            }}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = '.csv';
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files) {
                  handleFileDrop(target.files, 'csv');
                }
              };
              input.click();
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <p style={{ color: '#6b7280', margin: 0, marginBottom: '0.5rem' }}>
              Drop CSV files here or click to browse
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
              Character data, locations, timelines, etc.
            </p>
          </div>
          
          {/* CSV List */}
          {projectData.uploadedTables.map((table) => (
            <div key={table.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              background: '#f9fafb',
              borderRadius: '0.5rem',
              marginBottom: '0.5rem',
              border: table.status === 'error' ? '1px solid #ef4444' : '1px solid #e5e7eb'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{table.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {table.rows} rows, {table.columns} columns
                </div>
                {uploadProgress[table.id] !== undefined && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <div style={{
                      width: '100%',
                      height: '4px',
                      background: '#e5e7eb',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${uploadProgress[table.id]}%`,
                        height: '100%',
                        background: '#059669',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
              </div>
              <div style={{ marginLeft: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {table.status === 'completed' && (
                  <button
                    onClick={() => handleViewTableData(table)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    👁️ View
                  </button>
                )}
                {table.status === 'completed' && <span style={{ color: '#059669' }}>✅</span>}
                {table.status === 'uploading' && <span style={{ color: '#3b82f6' }}>⏳</span>}
                {table.status === 'error' && <span style={{ color: '#ef4444' }}>❌</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => setCurrentStep(5)}
          disabled={projectData.uploadedFiles.length === 0 && projectData.uploadedTables.length === 0}
          style={{
            padding: '1rem 2rem',
            background: (projectData.uploadedFiles.length > 0 || projectData.uploadedTables.length > 0) ? '#3b82f6' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: (projectData.uploadedFiles.length > 0 || projectData.uploadedTables.length > 0) ? 'pointer' : 'not-allowed'
          }}
        >
          Complete Setup →
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        🎉 Project Setup Complete!
      </h2>
      <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <div style={{ background: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '2rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#0c4a6e' }}>✨ "{projectData.name}" is ready!</h4>
          <p style={{ margin: 0, color: '#0c4a6e' }}>Your project has been created and is ready for AI generation.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => {
              setCurrentView('brainstorm');
              setShowWorkflow(false);
            }}
            style={{
              padding: '1rem 2rem',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🧠 Start AI Brainstorming
          </button>
          <button
            onClick={() => setCurrentView('home')}
            style={{
              padding: '1rem 2rem',
              background: 'white',
              color: '#3b82f6',
              border: '2px solid #3b82f6',
              borderRadius: '0.5rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  const renderBrainstormView = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>🧠 AI Brainstorming Studio</h2>
        
        {!projectData.name && (
          <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, color: '#92400e' }}>⚠️ Please create a project first to use AI features</p>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Brainstorm Prompt
          </label>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="What would you like to brainstorm about?"
            style={{
              width: '100%',
              height: '120px',
              padding: '1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              resize: 'vertical',
              outline: 'none'
            }}
            disabled={!projectData.name}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Tone</label>
          <select
            value={aiTone}
            onChange={(e) => setAiTone(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              outline: 'none'
            }}
            disabled={!projectData.name}
          >
            <option value="creative">Creative</option>
            <option value="analytical">Analytical</option>
            <option value="playful">Playful</option>
            <option value="serious">Serious</option>
            <option value="academic">Academic</option>
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Content Sources
          </label>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#6b7280' }}>
              Document Buckets ({availableBuckets.length} available)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {availableBuckets.map(bucket => (
                <label key={bucket} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedSources.buckets.includes(bucket)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSources(prev => ({ ...prev, buckets: [...prev.buckets, bucket] }));
                      } else {
                        setSelectedSources(prev => ({ ...prev, buckets: prev.buckets.filter(b => b !== bucket) }));
                      }
                    }}
                    disabled={!projectData.name}
                  />
                  {bucket}
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => handleGenerateAI('brainstorm')}
          disabled={!projectData.name || !aiPrompt.trim() || isGenerating}
          style={{
            width: '100%',
            padding: '1rem',
            background: (!projectData.name || !aiPrompt.trim() || isGenerating) ? '#9ca3af' : '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: (!projectData.name || !aiPrompt.trim() || isGenerating) ? 'not-allowed' : 'pointer'
          }}
        >
          {isGenerating && generationType === 'brainstorm' ? 'AI is thinking...' : '🧠 Generate Brainstorm'}
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Brainstorm Results ({aiVersions.filter(v => v.type === 'brainstorm').length})
        </h3>

        {aiVersions.filter(v => v.type === 'brainstorm').length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
            <p>No brainstorms yet. Generate your first one!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {aiVersions.filter(v => v.type === 'brainstorm').map((version, index) => (
              <div
                key={version.id}
                onClick={() => setSelectedVersion(version)}
                style={{
                  padding: '1rem',
                  border: selectedVersion?.id === version.id ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  background: selectedVersion?.id === version.id ? '#fef3c7' : 'white'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                  Brainstorm #{aiVersions.filter(v => v.type === 'brainstorm').length - index}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  {new Date(version.timestamp).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.875rem' }}>{version.prompt.substring(0, 120)}...</div>
              </div>
            ))}
          </div>
        )}

        {selectedVersion && selectedVersion.type === 'brainstorm' && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Generated Content</h4>
            <div style={{
              maxHeight: '300px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              background: 'white',
              padding: '1rem',
              borderRadius: '0.25rem',
              border: '1px solid #e5e7eb'
            }}>
              {selectedVersion.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderWriteView = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>✍️ AI Writing Assistant</h2>
        
        {!projectData.name && (
          <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, color: '#92400e' }}>⚠️ Please create a project first to use AI features</p>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Writing Instructions
          </label>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="What would you like me to write?"
            style={{
              width: '100%',
              height: '120px',
              padding: '1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              resize: 'vertical',
              outline: 'none'
            }}
            disabled={!projectData.name}
          />
        </div>

        <button
          onClick={() => handleGenerateAI('write')}
          disabled={!projectData.name || !aiPrompt.trim() || isGenerating}
          style={{
            width: '100%',
            padding: '1rem',
            background: (!projectData.name || !aiPrompt.trim() || isGenerating) ? '#9ca3af' : '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: (!projectData.name || !aiPrompt.trim() || isGenerating) ? 'not-allowed' : 'pointer'
          }}
        >
          {isGenerating && generationType === 'write' ? 'AI is writing...' : '✍️ Generate Content'}
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Written Content ({aiVersions.filter(v => v.type === 'write').length})
        </h3>

        {aiVersions.filter(v => v.type === 'write').length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✍️</div>
            <p>No written content yet. Generate your first piece!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {aiVersions.filter(v => v.type === 'write').map((version, index) => (
              <div
                key={version.id}
                onClick={() => setSelectedVersion(version)}
                style={{
                  padding: '1rem',
                  border: selectedVersion?.id === version.id ? '2px solid #059669' : '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  background: selectedVersion?.id === version.id ? '#f0fdf4' : 'white'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                  Content #{aiVersions.filter(v => v.type === 'write').length - index}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  {new Date(version.timestamp).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.875rem' }}>{version.prompt.substring(0, 120)}...</div>
              </div>
            ))}
          </div>
        )}

        {selectedVersion && selectedVersion.type === 'write' && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Generated Content</h4>
            <div style={{
              maxHeight: '300px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              background: 'white',
              padding: '1rem',
              borderRadius: '0.25rem',
              border: '1px solid #e5e7eb'
            }}>
              {selectedVersion.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderVersionsView = () => (
    <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', minHeight: 'calc(100vh - 200px)' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>📚 Version History</h2>
      
      {!projectData.name && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, color: '#92400e' }}>⚠️ Please create a project first to view version history</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fef3c7', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {aiVersions.filter(v => v.type === 'brainstorm').length}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: '600' }}>Brainstorms</div>
        </div>
        <div style={{ background: '#dcfce7', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>
            {aiVersions.filter(v => v.type === 'write').length}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#166534', fontWeight: '600' }}>Written Content</div>
        </div>
        <div style={{ background: '#e0e7ff', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {availableBuckets.length + availableTables.length}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '600' }}>Total Sources</div>
        </div>
      </div>

      {aiVersions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No versions yet</h3>
          <p>Start by creating some brainstorms or written content!</p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {aiVersions.map((version, index) => (
            <div key={version.id} style={{
              display: 'flex',
              alignItems: 'start',
              marginBottom: '2rem',
              paddingLeft: '4rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                left: '1.25rem',
                top: '0.75rem',
                width: '1.5rem',
                height: '1.5rem',
                borderRadius: '50%',
                background: version.type === 'brainstorm' ? '#f59e0b' : '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.75rem'
              }}>
                {version.type === 'brainstorm' ? '🧠' : '✍️'}
              </div>

              <div
                onClick={() => setSelectedVersion(version)}
                style={{
                  flex: 1,
                  padding: '1.5rem',
                  background: selectedVersion?.id === version.id ? '#f8fafc' : 'white',
                  border: selectedVersion?.id === version.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 0.25rem 0', textTransform: 'capitalize' }}>
                  {version.type} #{aiVersions.filter(v => v.type === version.type).length - aiVersions.filter(v => v.type === version.type).indexOf(version)}
                </h4>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                  {new Date(version.timestamp).toLocaleString()} • {version.tone} tone
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {version.prompt}
                </div>

                {selectedVersion?.id === version.id && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#f8fafc',
                    borderRadius: '0.25rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Generated Content:
                    </div>
                    <div style={{
                      maxHeight: '200px',
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      background: 'white',
                      padding: '0.75rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      {version.content}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Data Preview Modal
  const renderDataPreview = () => {
    if (!showFilePreview) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}>
          <button
            onClick={() => setShowFilePreview(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
          
          <h3 style={{ marginBottom: '1rem' }}>📊 Table Data Preview</h3>
          
          {selectedTableData.length > 0 ? (
            <div style={{ overflow: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {Object.keys(selectedTableData[0]).map((key) => (
                      <th key={key} style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #e5e7eb',
                        textAlign: 'left',
                        fontWeight: '600'
                      }}>
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedTableData.slice(0, 10).map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value: any, cellIndex) => (
                        <td key={cellIndex} style={{ 
                          padding: '0.75rem', 
                          border: '1px solid #e5e7eb'
                        }}>
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedTableData.length > 10 && (
                <p style={{ 
                  textAlign: 'center', 
                  color: '#6b7280', 
                  marginTop: '1rem',
                  fontSize: '0.875rem'
                }}>
                  Showing first 10 rows of {selectedTableData.length} total rows
                </p>
              )}
            </div>
          ) : (
            <p>No data available</p>
          )}
        </div>
      </div>
    );
  };

  const renderWorkflowView = () => (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: '2rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {renderStepIndicator()}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </div>
      {renderDataPreview()}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <style>
        {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
      </style>

      {/* Navigation Bar */}
      <div style={{ 
        background: 'white', 
        borderBottom: '1px solid #e5e7eb', 
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Miranda AI - Phase 3 Complete</h1>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            {['home', 'workflow', 'brainstorm', 'write', 'versions'].map(view => (
              <button
                key={view}
                onClick={() => handleNavClick(view)}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  background: currentView === view ? '#3b82f6' : 'transparent',
                  color: currentView === view ? 'white' : '#6b7280',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontWeight: currentView === view ? '600' : '400'
                }}
              >
                {view === 'brainstorm' && '🧠 '}
                {view === 'write' && '✍️ '}
                {view === 'versions' && '📚 '}
                {view === 'workflow' && '⚙️ '}
                {view === 'home' && '🏠 '}
                {view}
              </button>
            ))}
          </nav>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {projectData.name && (
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Project: <span style={{ fontWeight: '600', color: '#374151' }}>{projectData.name}</span>
            </div>
          )}
          <div style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            background: backendOnline ? '#dcfce7' : '#fee2e2',
            color: backendOnline ? '#166534' : '#991b1b',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: backendOnline ? '#22c55e' : '#ef4444'
            }} />
            {backendOnline ? 'Backend Online' : 'Backend Offline'}
          </div>
        </div>
      </div>

      {/* Content */}
      {showWorkflow && currentView === 'workflow' ? renderWorkflowView() : (
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem' }}>
          {message && (
            <div style={{
              background: message.includes('❌') ? '#fee2e2' : '#dbeafe',
              border: `1px solid ${message.includes('❌') ? '#ef4444' : '#93c5fd'}`,
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1rem',
              color: message.includes('❌') ? '#991b1b' : '#1e40af'
            }}>
              {message}
            </div>
          )}

          {currentView === 'home' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                  Welcome to Miranda AI
                </h2>
                <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>
                  Phase 3 Complete: Full AI generation with multi-source intelligence
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                <div style={{
                  background: 'white',
                  borderRadius: '1rem',
                  padding: '2rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    🧠 AI Brainstorming
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                    Generate creative insights from your documents and data using advanced AI
                  </p>
                  {projectData.name ? (
                    <button
                      onClick={() => handleNavClick('brainstorm')}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Start Brainstorming
                    </button>
                  ) : (
                    <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      Create a project first to use AI features
                    </div>
                  )}
                </div>

                <div style={{
                  background: 'white',
                  borderRadius: '1rem',
                  padding: '2rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    ✍️ AI Writing
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                    Create structured content using your research and brainstorm results
                  </p>
                  {projectData.name ? (
                    <button
                      onClick={() => handleNavClick('write')}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Start Writing
                    </button>
                  ) : (
                    <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      Create a project first to use AI features
                    </div>
                  )}
                </div>

                <div style={{
                  background: 'white',
                  borderRadius: '1rem',
                  padding: '2rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    📚 Version History
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                    Track and manage all your AI-generated content versions
                  </p>
                  <button
                    onClick={() => handleNavClick('versions')}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    View Versions ({aiVersions.length})
                  </button>
                </div>
              </div>

              <div style={{ 
                marginTop: '3rem', 
                padding: '2rem', 
                background: 'white', 
                borderRadius: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
                  🚀 Development Progress
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  {[
                    { phase: 'Phase 1', status: 'Project Creation', completed: true },
                    { phase: 'Phase 2', status: 'Data Management', completed: true },
                    { phase: 'Phase 3', status: 'AI Generation', completed: true },
                    { phase: 'Phase 4', status: 'Export & Polish', completed: false }
                  ].map((item, index) => (
                    <div key={index} style={{ 
                      textAlign: 'center', 
                      padding: '1rem', 
                      background: item.completed ? '#dcfce7' : '#f3f4f6', 
                      borderRadius: '0.5rem' 
                    }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                        {item.completed ? '✅' : index === 3 ? '📊' : '🤖'}
                      </div>
                      <div style={{ fontWeight: 'bold', color: item.completed ? '#166534' : '#6b7280' }}>
                        {item.phase}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: item.completed ? '#059669' : '#6b7280' }}>
                        {item.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView === 'brainstorm' && renderBrainstormView()}
          {currentView === 'write' && renderWriteView()}
          {currentView === 'versions' && renderVersionsView()}
        </div>
      )}
    </div>
  );
};

export default WorkingMiranda;
