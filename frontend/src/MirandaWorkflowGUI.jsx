import React, { useState, useEffect } from 'react';
import { ChevronRight, BookOpen, Film, FileText, Lightbulb, PenTool, Download, Plus, Upload, Play, Brain, History, Star, Zap, Clock, GitBranch, Eye, Copy, Trash2, Settings, Sparkles, AlertCircle } from 'lucide-react';

// Fixed Miranda API Service - Matches actual backend endpoints
const API_BASE = 'http://localhost:8000';

class MirandaAPI {
  constructor() {
    this.baseURL = API_BASE;
  }

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
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create project');
    }
    return response.json();
  }

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

  async uploadCSV(projectName, tableName, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseURL}/projects/${projectName}/tables/tables/upload_csv?project=${projectName}&table_name=${tableName}`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to upload CSV');
    }
    return response.json();
  }

  async getTableData(projectName, tableName) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/tables/tables/${tableName}?project=${projectName}`);
    if (!response.ok) throw new Error('Failed to fetch table data');
    return response.json();
  }

  async generateBrainstorm(projectName, options) {
    const payload = {
      project_id: projectName,
      scene_id: options.sceneId || 'general',
      scene_description: options.prompt || 'Generate creative insights for this project',
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
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to generate brainstorm');
    }
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
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to generate content');
    }
    return response.json();
  }

  async getBrainstormVersions(projectName) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/versions/brainstorm`);
    if (!response.ok) return [];
    return response.json();
  }

  async getWriteVersions(projectName) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/versions/write`);
    if (!response.ok) return [];
    return response.json();
  }

  async exportProject(projectName, format) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/export/export/${format}`);
    if (!response.ok) throw new Error('Failed to export project');
    return response.blob();
  }

  async getProjectBuckets(projectName) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/buckets/buckets`);
    if (!response.ok) return [];
    return response.json();
  }

  async getProjectTables(projectName) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/tables/tables`);
    if (!response.ok) return [];
    return response.json();
  }

  async healthCheck() {
    const response = await fetch(`${this.baseURL}/healthcheck`);
    return response.ok;
  }
}

const mirandaAPI = new MirandaAPI();

const MirandaWorkflowGUI = () => {
  const [currentView, setCurrentView] = useState('home');
  const [currentStep, setCurrentStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [selectedSchema, setSelectedSchema] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedTables, setUploadedTables] = useState({});
  const [buckets, setBuckets] = useState([]);
  const [tables, setTables] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState('');
  const [versions, setVersions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingProjects, setExistingProjects] = useState([]);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  // Updated schemas to match backend templates
  const schemas = [
    { 
      id: 'screenplay', 
      name: 'Screenplay', 
      icon: <Film className="w-6 h-6" />,
      description: 'Feature film or TV screenplay development',
      gradient: 'from-purple-500 to-indigo-500',
      tables: ['characters', 'scenes', 'locations', 'themes'],
      buckets: ['character_research', 'plot_devices', 'dialogue_samples', 'screenplay_examples']
    },
    { 
      id: 'academic_textbook', 
      name: 'Academic Textbook', 
      icon: <BookOpen className="w-6 h-6" />,
      description: 'Research-driven academic writing with citations',
      gradient: 'from-blue-500 to-cyan-500',
      tables: ['chapters', 'references', 'figures', 'key_terms'],
      buckets: ['primary_sources', 'secondary_research', 'case_studies', 'methodologies']
    },
    { 
      id: 'research_project', 
      name: 'Research Project', 
      icon: <FileText className="w-6 h-6" />,
      description: 'General research and analysis project',
      gradient: 'from-green-500 to-emerald-500',
      tables: ['data_points', 'sources', 'findings', 'timeline'],
      buckets: ['research_docs', 'data_files', 'reference_materials']
    }
  ];

  const steps = [
    { number: 1, title: 'New Project', completed: currentStep > 1 },
    { number: 2, title: 'Pick Schema', completed: currentStep > 2 },
    { number: 3, title: 'Upload Content', completed: currentStep > 3 },
    { number: 4, title: 'AI Generation', completed: currentStep > 4 },
    { number: 5, title: 'Export', completed: false }
  ];

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
    loadExistingProjects();
  }, []);

  // Load project data when project is selected
  useEffect(() => {
    if (projectName && projectLoaded) {
      loadProjectData();
    }
  }, [projectName, projectLoaded]);

  const checkBackendHealth = async () => {
    try {
      const isOnline = await mirandaAPI.healthCheck();
      setBackendOnline(isOnline);
      if (!isOnline) {
        setError('Backend server is not responding. Please ensure Miranda backend is running on localhost:8000');
      }
    } catch (error) {
      setBackendOnline(false);
      setError('Cannot connect to backend server. Please start the Miranda backend.');
    }
  };

  const loadExistingProjects = async () => {
    try {
      const projects = await mirandaAPI.getProjects();
      setExistingProjects(Array.isArray(projects) ? projects : []);
    } catch (error) {
      console.error('Error loading projects:', error);
      setExistingProjects([]);
    }
  };

  const loadProjectData = async () => {
    try {
      const [projectBuckets, projectTables, brainstormVersions, writeVersions] = await Promise.all([
        mirandaAPI.getProjectBuckets(projectName),
        mirandaAPI.getProjectTables(projectName),
        mirandaAPI.getBrainstormVersions(projectName),
        mirandaAPI.getWriteVersions(projectName)
      ]);

      setBuckets(Array.isArray(projectBuckets) ? projectBuckets : []);
      setTables(Array.isArray(projectTables) ? projectTables : []);
      
      const allVersions = [
        ...(Array.isArray(brainstormVersions) ? brainstormVersions.map(v => ({ ...v, type: 'brainstorm' })) : []),
        ...(Array.isArray(writeVersions) ? writeVersions.map(v => ({ ...v, type: 'write' })) : [])
      ].sort((a, b) => new Date(b.created || b.timestamp || 0) - new Date(a.created || a.timestamp || 0));
      
      setVersions(allVersions);
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

  const handleError = (error, context) => {
    console.error(`Error in ${context}:`, error);
    setError(`Failed to ${context}: ${error.message}`);
    setLoading(false);
    setIsGenerating(false);
  };

  const handleSelectExistingProject = async (project) => {
    const name = typeof project === 'string' ? project : project.name;
    const template = typeof project === 'object' ? project.template || 'screenplay' : 'screenplay';
    
    setProjectName(name);
    setSelectedSchema(template);
    setProjectLoaded(true);
    setCurrentView('brainstorm');
    setError('');
  };

  const handleCreateNewProject = () => {
    setCurrentView('workflow');
    setCurrentStep(1);
    setProjectLoaded(false);
    setProjectName('');
    setSelectedSchema('');
    setError('');
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError('Please enter a project name');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await mirandaAPI.createProject(
        selectedSchema || 'screenplay',
        projectName,
        `${selectedSchema || 'screenplay'} project created with Miranda`,
        false
      );
      setProjectLoaded(true);
      setCurrentStep(2);
    } catch (error) {
      handleError(error, 'create project');
    }
    
    setLoading(false);
  };

  const handleSelectSchema = async (schemaId) => {
    setSelectedSchema(schemaId);
    setLoading(true);
    setError('');

    try {
      await mirandaAPI.createProject(
        schemaId,
        projectName,
        `${schemaId} project created with Miranda`,
        false
      );
      
      // Create default buckets for this schema
      const schema = schemas.find(s => s.id === schemaId);
      if (schema && schema.buckets) {
        for (const bucketName of schema.buckets) {
          try {
            await mirandaAPI.createBucket(projectName, bucketName);
          } catch (error) {
            console.warn(`Failed to create bucket ${bucketName}:`, error);
          }
        }
      }
      
      setCurrentStep(3);
    } catch (error) {
      handleError(error, 'select schema');
    }
    
    setLoading(false);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    setLoading(true);
    setError('');

    try {
      const schema = schemas.find(s => s.id === selectedSchema);
      const defaultBucket = schema?.buckets?.[0] || 'default_bucket';

      // Ensure bucket exists
      try {
        await mirandaAPI.createBucket(projectName, defaultBucket);
      } catch (error) {
        console.warn('Bucket may already exist:', error);
      }

      for (const file of files) {
        try {
          await mirandaAPI.uploadToBucket(projectName, defaultBucket, file);
          setUploadedFiles(prev => [...prev, file.name]);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          setError(`Failed to upload ${file.name}: ${error.message}`);
        }
      }
    } catch (error) {
      handleError(error, 'upload files');
    }

    setLoading(false);
  };

  const handleTableUpload = async (tableName, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      await mirandaAPI.uploadCSV(projectName, tableName, file);
      setUploadedTables(prev => ({ ...prev, [tableName]: file.name }));
    } catch (error) {
      handleError(error, `upload ${tableName} table`);
    }

    setLoading(false);
  };

  const handleGenerate = async (type, options = {}) => {
    setGenerationType(type);
    setIsGenerating(true);
    setError('');

    try {
      const schema = schemas.find(s => s.id === selectedSchema);
      const availableBuckets = schema?.buckets || [];
      const availableTables = Object.keys(uploadedTables);

      if (type === 'brainstorm') {
        await mirandaAPI.generateBrainstorm(projectName, {
          prompt: options.prompt,
          tone: options.tone,
          selectedBuckets: availableBuckets,
          selectedTables: availableTables,
          sceneId: 'general'
        });
      } else {
        await mirandaAPI.generateWrite(projectName, {
          instructions: options.instructions,
          tone: options.tone,
          selectedBuckets: availableBuckets,
          selectedTables: availableTables,
          brainstormVersions: []
        });
      }

      await loadProjectData(); // Reload versions
      if (currentStep < 5) setCurrentStep(5);
    } catch (error) {
      handleError(error, `generate ${type}`);
    }

    setIsGenerating(false);
  };

  const handleExport = async (format) => {
    try {
      const blob = await mirandaAPI.exportProject(projectName, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      handleError(error, `export ${format}`);
    }
  };

  const NavBar = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Miranda AI
            </h1>
          </div>
          
          <nav className="flex space-x-1">
            {[
              { id: 'home', label: 'Home', icon: <Zap className="w-4 h-4" /> },
              { id: 'workflow', label: 'New Project', icon: <Plus className="w-4 h-4" /> },
              { id: 'brainstorm', label: 'Brainstorm', icon: <Brain className="w-4 h-4" /> },
              { id: 'write', label: 'Write', icon: <PenTool className="w-4 h-4" /> },
              { id: 'versions', label: 'Versions', icon: <GitBranch className="w-4 h-4" /> }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                disabled={!projectLoaded && item.id !== 'home' && item.id !== 'workflow'}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentView === item.id
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${backendOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <div className="text-sm text-gray-500">
            Project: <span className="font-medium text-gray-700">{projectName || 'None'}</span>
          </div>
          {error && (
            <div className="flex items-center space-x-1 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Error</span>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
          <button 
            onClick={() => setError('')}
            className="text-red-600 hover:text-red-800 text-xs mt-1"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );

  const BrainstormView = () => {
    const [prompt, setPrompt] = useState('');
    const [tone, setTone] = useState('creative');

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">AI Brainstorming Studio</h2>
          <p className="text-gray-600">Generate creative insights from your research and data</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Brainstorm Parameters</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                  <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="creative">Creative</option>
                    <option value="analytical">Analytical</option>
                    <option value="playful">Playful</option>
                    <option value="serious">Serious</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Prompt</label>
                  <textarea 
                    placeholder="What specific aspect would you like to explore?"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    rows="4"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Available Sources</h3>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Uploaded Documents</span>
                    <span className="text-xs text-blue-600">{uploadedFiles.length} files</span>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">CSV Tables</span>
                    <span className="text-xs text-green-600">{Object.keys(uploadedTables).length} tables</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-800">Document Buckets</span>
                    <span className="text-xs text-purple-600">{buckets.length} buckets</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={() => handleGenerate('brainstorm', { prompt, tone })}
              disabled={isGenerating || !projectName || !backendOnline}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 px-8 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center space-x-3 text-lg"
            >
              {isGenerating && generationType === 'brainstorm' ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>AI is thinking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Ideas</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const WriteView = () => {
    const [instructions, setInstructions] = useState('');
    const [tone, setTone] = useState('creative');

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PenTool className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">AI Writing Assistant</h2>
          <p className="text-gray-600">Create structured content using all your research</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Writing Parameters</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Writing Tone</label>
                  <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="creative">Creative</option>
                    <option value="professional">Professional</option>
                    <option value="academic">Academic</option>
                    <option value="casual">Casual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                  <textarea 
                    placeholder="Any specific requirements or focus areas?"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows="4"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Content Sources</h3>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Research Documents</span>
                    <span className="text-xs text-blue-600">{uploadedFiles.length} files</span>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Structured Data</span>
                    <span className="text-xs text-green-600">{Object.keys(uploadedTables).length} tables</span>
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-yellow-800">Brainstorm Results</span>
                    <span className="text-xs text-yellow-600">{versions.filter(v => v.type === 'brainstorm').length} sessions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={() => handleGenerate('write', { instructions, tone })}
              disabled={isGenerating || !projectName || !backendOnline}
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 px-8 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center space-x-3 text-lg"
            >
              {isGenerating && generationType === 'write' ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>AI is writing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Generate Content</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const HomeView = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Miranda AI</h2>
        <p className="text-xl text-gray-600 mb-8">Your intelligent content creation assistant</p>
        {!backendOnline && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">⚠️ Backend server offline. Please start Miranda backend on localhost:8000</p>
            <button 
              onClick={checkBackendHealth}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all group cursor-pointer"
             onClick={handleCreateNewProject}>
          <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Create New Project</h3>
          <p className="text-gray-600 text-center mb-6">Start fresh with a new AI-powered project using our guided workflow</p>
          <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg text-center font-medium">
            Start New Project Workflow
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Continue Existing Project</h3>
          
          {existingProjects.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No existing projects found</p>
              <button 
                onClick={loadExistingProjects}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {existingProjects.map((project, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectExistingProject(project)}
                  className="p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800 group-hover:text-blue-700">
                        {typeof project === 'string' ? project : project.name || 'Unnamed Project'}
                      </h4>
                      {typeof project === 'object' && project.template && (
                        <p className="text-sm text-gray-500">
                          {schemas.find(s => s.id === project.template)?.name || project.template}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-4">What can Miranda AI do?</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <Brain className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-700">AI Brainstorming</h4>
            <p className="text-sm text-gray-600">Generate creative insights from your research</p>
          </div>
          <div className="text-center">
            <PenTool className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-700">Intelligent Writing</h4>
            <p className="text-sm text-gray-600">Create structured content using AI assistance</p>
          </div>
          <div className="text-center">
            <GitBranch className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-700">Version Management</h4>
            <p className="text-sm text-gray-600">Track and manage all your generated content</p>
          </div>
        </div>
      </div>
    </div>
  );

  const VersionsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Version Manager</h2>
          <p className="text-gray-600">Track and manage all your generated content</p>
        </div>
        <button 
          onClick={loadProjectData}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-12">
          <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No versions yet</h3>
          <p className="text-gray-500">Generate some content to see versions here</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {versions.map((version, index) => (
            <div key={version.id || index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    version.type === 'brainstorm' 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                      : 'bg-gradient-to-r from-green-400 to-blue-500'
                  }`}>
                    {version.type === 'brainstorm' ? (
                      <Brain className="w-6 h-6 text-white" />
                    ) : (
                      <PenTool className="w-6 h-6 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {version.name || `${version.type} Version ${index + 1}`}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        version.type === 'brainstorm' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {version.type}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(version.created || version.timestamp || Date.now()).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed">
                      {version.focus || version.description || 'Generated content'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavBar />
      
      <div className="max-w-6xl mx-auto p-6">
        {currentView === 'home' && <HomeView />}
        {currentView === 'workflow' && (
          <>
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-4">
                {steps.map((step, index) => (
                  <React.Fragment key={step.number}>
                    <div className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all ${
                      currentStep === step.number 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                        : step.completed 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                          : 'bg-white text-gray-500 border border-gray-200 shadow-sm'
                    }`}>
                      <span className="font-semibold">{step.number}</span>
                      <span className="text-sm font-medium">{step.title}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              {currentStep === 1 && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Plus className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Create Your AI Project</h2>
                  <p className="text-gray-600 mb-8">Start your creative journey with Miranda AI</p>
                  <div className="max-w-md mx-auto">
                    <input
                      type="text"
                      placeholder="Enter project name..."
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6 text-lg"
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                    />
                    <button
                      onClick={handleCreateProject}
                      disabled={!projectName.trim() || loading || !backendOnline}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
                    >
                      {loading ? 'Creating...' : 'Create Project'}
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Choose Your Content Type</h2>
                  <p className="text-gray-600 mb-8 text-center">Select the schema that best fits your project</p>
                  <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {schemas.map((schema) => (
                      <div
                        key={schema.id}
                        onClick={() => handleSelectSchema(schema.id)}
                        className="border-2 border-gray-200 rounded-2xl p-6 cursor-pointer hover:border-blue-500 hover:shadow-xl transition-all group"
                      >
                        <div className="flex items-center mb-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${schema.gradient} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                            {schema.icon}
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 ml-4">{schema.name}</h3>
                        </div>
                        <p className="text-gray-600 mb-6">{schema.description}</p>
                        <div className="space-y-3">
                          <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tables</span>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {schema.tables.map(table => (
                                <span key={table} className="px-3 py-1 bg-gray-100 text-xs rounded-full font-medium">{table}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Buckets</span>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {schema.buckets.map(bucket => (
                                <span key={bucket} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">{bucket}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Upload Your Content</h2>
                  <p className="text-gray-600 mb-8 text-center">
                    Add documents and data for {schemas.find(s => s.id === selectedSchema)?.name}
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-gray-700 flex items-center">
                        <Upload className="w-6 h-6 mr-3" />
                        Research Documents
                      </h3>
                      <div className="border-3 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors bg-gray-50">
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                          accept=".pdf,.txt,.docx"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-600 mb-2">Drop files or click to upload</p>
                          <p className="text-sm text-gray-500">PDF, TXT, DOCX supported</p>
                        </label>
                      </div>
                      
                      {uploadedFiles.length > 0 && (
                        <div className="space-y-3">
                          <p className="font-semibold text-gray-700">Uploaded Files:</p>
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center p-3 bg-green-50 rounded-xl border-l-4 border-green-400">
                              <FileText className="w-5 h-5 text-green-600 mr-3" />
                              <span className="text-green-800 font-medium">{file}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-gray-700">Structured Data</h3>
                      {schemas.find(s => s.id === selectedSchema)?.tables.map(table => (
                        <div key={table} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-gray-700 capitalize text-lg">{table}</span>
                            <div>
                              <input
                                type="file"
                                accept=".csv"
                                onChange={(e) => handleTableUpload(table, e)}
                                className="hidden"
                                id={`${table}-upload`}
                              />
                              <label 
                                htmlFor={`${table}-upload`}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium cursor-pointer"
                              >
                                Upload CSV
                              </label>
                            </div>
                          </div>
                          {uploadedTables[table] && (
                            <div className="text-sm text-green-600 font-medium">
                              ✓ {uploadedTables[table]}
                            </div>
                          )}
                          <p className="text-sm text-gray-500">Upload {table} data as CSV file</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center mt-10">
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center text-lg"
                    >
                      Continue to AI Generation
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">AI Generation Ready</h2>
                  <p className="text-gray-600 mb-8 text-center">Choose how you want to proceed with AI assistance</p>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="text-center p-8 border-2 border-gray-200 rounded-2xl hover:shadow-xl transition-all group cursor-pointer"
                         onClick={() => setCurrentView('brainstorm')}>
                      <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <Brain className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">Brainstorm Studio</h3>
                      <p className="text-gray-600 mb-6">Generate creative insights and explore ideas from your content</p>
                      <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium">
                        Open Brainstorm Studio
                      </div>
                    </div>

                    <div className="text-center p-8 border-2 border-gray-200 rounded-2xl hover:shadow-xl transition-all group cursor-pointer"
                         onClick={() => setCurrentView('write')}>
                      <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <PenTool className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">Writing Assistant</h3>
                      <p className="text-gray-600 mb-6">Create complete content using all your research and data</p>
                      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
                        Open Writing Assistant
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-8">
                    <p className="text-gray-600 text-sm">
                      You can switch between brainstorming and writing at any time using the navigation bar
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Download className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Export Your Work</h2>
                  <p className="text-gray-600 mb-8">Your AI-generated content is ready! Choose your export format.</p>
                  
                  <div className="flex justify-center space-x-4 mb-8">
                    <button 
                      onClick={() => handleExport('pdf')}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download PDF
                    </button>
                    <button 
                      onClick={() => handleExport('json')}
                      className="bg-gradient-to-r from-gray-500 to-gray-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download JSON
                    </button>
                    <button 
                      onClick={() => handleExport('csv')}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download CSV
                    </button>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                    <p className="text-green-800 font-bold text-lg">✨ Project "{projectName}" completed successfully!</p>
                    <p className="text-green-700 mt-2">Your {schemas.find(s => s.id === selectedSchema)?.name.toLowerCase()} content is ready for download.</p>
                    <button 
                      onClick={() => setCurrentView('versions')}
                      className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      View All Versions
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {currentView === 'brainstorm' && <BrainstormView />}
        {currentView === 'write' && <WriteView />}
        {currentView === 'versions' && <VersionsView />}
      </div>
    </div>
  );
};

export default MirandaWorkflowGUI;
