import React, { useState, useEffect } from 'react';
import { ChevronRight, BookOpen, Film, FileText, Lightbulb, PenTool, Download, Plus, Upload, Play, Brain, History, Star, Zap, Clock, GitBranch, Eye, Copy, Trash2, Settings, Sparkles, AlertCircle } from 'lucide-react';

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

  async createProject(projectData) {
    const response = await fetch(`${this.baseURL}/projects/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create project');
    }
    return response.json();
  }

  // Document buckets endpoints
  async createBucket(projectName, bucketName) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/buckets/buckets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: bucketName })
    });
    if (!response.ok) throw new Error('Failed to create bucket');
    return response.json();
  }

  async uploadToBucket(projectName, bucketName, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseURL}/projects/${projectName}/buckets/buckets/${bucketName}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload file');
    return response.json();
  }

  // CSV tables endpoints
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

  // AI generation endpoints
  async generateBrainstorm(projectName, options) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/brainstorm/brainstorm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectName,
        prompt: options.prompt || 'Generate creative insights',
        tone: options.tone || 'creative',
        selected_buckets: options.selectedBuckets || [],
        selected_tables: options.selectedTables || [],
        scene_id: options.sceneId || 'general'
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to generate brainstorm');
    }
    return response.json();
  }

  async generateWrite(projectName, options) {
    const response = await fetch(`${this.baseURL}/projects/${projectName}/write/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectName,
        instructions: options.instructions || 'Write creative content',
        tone: options.tone || 'creative',
        selected_buckets: options.selectedBuckets || [],
        selected_tables: options.selectedTables || [],
        brainstorm_versions: options.brainstormVersions || []
      })
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
    try {
      const response = await fetch(`${this.baseURL}/healthcheck`);
      return response.ok;
    } catch {
      return false;
    }
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

  // Define schemas
  const schemas = [
    {
      id: 'screenplay',
      name: 'Screenplay Writing',
      description: 'Professional screenplay development with character arcs, scene structure, and dialogue.',
      icon: Film,
      buckets: ['character_notes', 'research', 'scene_ideas'],
      tables: ['characters', 'scenes', 'locations']
    },
    {
      id: 'academic',
      name: 'Academic Textbook',
      description: 'Structured academic content with citations, research integration, and pedagogical design.',
      icon: BookOpen,
      buckets: ['research_papers', 'source_materials', 'notes'],
      tables: ['citations', 'concepts', 'chapters']
    },
    {
      id: 'research',
      name: 'Research Project',
      description: 'Data-driven research with analysis, insights, and comprehensive reporting.',
      icon: FileText,
      buckets: ['data_sources', 'literature', 'methodology'],
      tables: ['datasets', 'findings', 'references']
    }
  ];

  const steps = [
    { number: 1, title: 'Project Setup', completed: currentStep > 1 },
    { number: 2, title: 'Choose Schema', completed: currentStep > 2 },
    { number: 3, title: 'Upload Content', completed: currentStep > 3 },
    { number: 4, title: 'AI Generation', completed: currentStep > 4 },
    { number: 5, title: 'Export', completed: currentStep > 5 }
  ];

  useEffect(() => {
    checkBackendConnection();
    loadExistingProjects();
  }, []);

  useEffect(() => {
    if (projectName && projectLoaded) {
      loadProjectData();
    }
  }, [projectName, projectLoaded]);

  const checkBackendConnection = async () => {
    try {
      const isOnline = await mirandaAPI.healthCheck();
      setBackendOnline(isOnline);
      if (!isOnline) {
        setError('Backend server is offline. Please ensure Miranda backend is running on localhost:8000');
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
    const template = typeof project === 'object' ? project.template : 'research';
    
    setProjectName(name);
    setSelectedSchema(template);
    setProjectLoaded(true);
    setCurrentStep(3); // Skip to upload step for existing projects
    setCurrentView('workflow');
    await loadProjectData();
  };

  const handleCreateProject = async () => {
    if (!projectName.trim() || !selectedSchema) {
      setError('Please provide a project name and select a schema');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await mirandaAPI.createProject({
        name: projectName,
        template: selectedSchema,
        description: `${schemas.find(s => s.id === selectedSchema)?.name} project`
      });

      setProjectLoaded(true);
      setCurrentStep(3);
      await loadExistingProjects();
    } catch (error) {
      handleError(error, 'create project');
    }

    setLoading(false);
  };

  const handleFileUpload = async (files) => {
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
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Miranda AI</h1>
          </div>
          
          <nav className="flex space-x-6">
            {[
              { id: 'home', label: 'Home', icon: Star },
              { id: 'workflow', label: 'New Project', icon: Plus },
              { id: 'brainstorm', label: 'Brainstorm', icon: Brain },
              { id: 'write', label: 'Write', icon: PenTool },
              { id: 'versions', label: 'Versions', icon: History }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  currentView === id
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            backendOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{backendOnline ? 'Backend Online' : 'Backend Offline'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const HomeView = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Welcome to Miranda AI
        </h2>
        <p className="text-xl text-gray-600">
          Intelligent research assistant for screenwriting, academic work, and creative projects
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div 
          onClick={() => setCurrentView('workflow')}
          className="group bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-200"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <ChevronRight className="w-6 h-6 text-blue-500 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Create New Project</h3>
          <p className="text-gray-600 mb-6">Start a new research project with AI-powered assistance</p>
          
          <div className="grid grid-cols-3 gap-4">
            {schemas.map((schema) => {
              const Icon = schema.icon;
              return (
                <div key={schema.id} className="bg-white rounded-lg p-3 shadow-sm">
                  <Icon className="w-5 h-5 text-gray-600 mb-2" />
                  <p className="text-xs font-medium text-gray-700">{schema.name}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 border-2 border-transparent">
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <History className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Continue Existing Project</h3>
          <p className="text-gray-600 mb-6">Resume work on your existing research projects</p>
          
          <div className="space-y-2">
            {existingProjects.slice(0, 3).map((project, index) => (
              <div
                key={index}
                onClick={() => handleSelectExistingProject(project)}
                className="bg-white rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {typeof project === 'string' ? project : project.name || `Project ${index + 1}`}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
            
            {existingProjects.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No existing projects found</p>
                <p className="text-sm text-gray-400 mt-1">Create your first project to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const BrainstormView = () => {
    const [prompt, setPrompt] = useState('');
    const [tone, setTone] = useState('creative');

    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Brainstorming</h2>
          <p className="text-gray-600">Generate creative insights using your uploaded content</p>
        </div>

        {!projectName ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800">Please create or select a project first to use brainstorming.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Brainstorm Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What would you like to brainstorm about?
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="4"
                    placeholder="Describe what you want to explore or generate ideas about..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="creative">Creative</option>
                    <option value="analytical">Analytical</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                  </select>
                </div>

                <button
                  onClick={() => handleGenerate('brainstorm', { prompt, tone })}
                  disabled={isGenerating || !prompt.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      <span>Generate Brainstorm</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {versions.filter(v => v.type === 'brainstorm').length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Recent Brainstorms</h3>
                <div className="space-y-4">
                  {versions.filter(v => v.type === 'brainstorm').slice(0, 3).map((version, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">
                          {new Date(version.created || version.timestamp || Date.now()).toLocaleString()}
                        </span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                          Brainstorm
                        </span>
                      </div>
                      <p className="text-gray-700">{version.focus || version.description || 'Generated brainstorm'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const WriteView = () => {
    const [instructions, setInstructions] = useState('');
    const [tone, setTone] = useState('creative');

    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Writing Assistant</h2>
          <p className="text-gray-600">Generate structured content based on your research and brainstorms</p>
        </div>

        {!projectName ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800">Please create or select a project first to use the writing assistant.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Writing Instructions</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What would you like to write?
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="4"
                    placeholder="Provide instructions for what you want to write..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Writing Style</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="creative">Creative</option>
                    <option value="academic">Academic</option>
                    <option value="professional">Professional</option>
                    <option value="conversational">Conversational</option>
                  </select>
                </div>

                <button
                  onClick={() => handleGenerate('write', { instructions, tone })}
                  disabled={isGenerating || !instructions.trim()}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Writing...</span>
                    </>
                  ) : (
                    <>
                      <PenTool className="w-5 h-5" />
                      <span>Generate Content</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {versions.filter(v => v.type === 'write').length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Recent Writing</h3>
                <div className="space-y-4">
                  {versions.filter(v => v.type === 'write').slice(0, 3).map((version, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">
                          {new Date(version.created || version.timestamp || Date.now()).toLocaleString()}
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          Writing
                        </span>
                      </div>
                      <p className="text-gray-700">{version.focus || version.description || 'Generated content'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const VersionsView = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Version History</h2>
        <p className="text-gray-600">
          {projectName ? `All versions for project "${projectName}"` : 'View and manage all your generated content'}
        </p>
      </div>

      {!projectName ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">Please select a project to view its version history.</p>
          </div>
        </div>
      ) : versions.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No versions yet</h3>
          <p className="text-gray-500">Generate some content to see versions here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {versions.map((version, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      version.type === 'brainstorm' 
                        ? 'bg-purple-100 text-purple-800' 
                        : version.type === 'write'
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {version.type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(version.created || version.timestamp || Date.now()).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed">
                    {version.focus || version.description || 'Generated content'}
                  </p>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
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
      
      {error && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => setError('')}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
      
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
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className="font-bold text-lg">{step.number}</span>
                      <span className="font-medium">{step.title}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              {currentStep === 1 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Project Setup</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your project name..."
                      />
                    </div>

                    <button
                      onClick={() => setCurrentStep(2)}
                      disabled={!projectName.trim()}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue to Schema Selection
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Project Schema</h3>
                  
                  <div className="grid gap-6">
                    {schemas.map((schema) => {
                      const Icon = schema.icon;
                      return (
                        <div
                          key={schema.id}
                          onClick={() => setSelectedSchema(schema.id)}
                          className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedSchema === schema.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              selectedSchema === schema.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">{schema.name}</h4>
                              <p className="text-gray-600 mb-4">{schema.description}</p>
                              
                              <div className="flex flex-wrap gap-2">
                                {schema.buckets.map((bucket) => (
                                  <span key={bucket} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                                    {bucket}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreateProject}
                      disabled={!selectedSchema || loading}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Creating...</span>
                        </>
                      ) : (
                        <span>Create Project</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Upload Content</h3>
                    
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Documents</h4>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
                          <input
                            type="file"
                            multiple
                            onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                            className="hidden"
                            id="file-upload"
                          />
                          <label
                            htmlFor="file-upload"
                            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium cursor-pointer hover:bg-blue-600 transition-colors inline-block"
                          >
                            Choose Files
                          </label>
                          
                          {uploadedFiles.length > 0 && (
                            <div className="mt-4 text-left">
                              <p className="font-medium text-gray-700 mb-2">Uploaded Files:</p>
                              <div className="space-y-1">
                                {uploadedFiles.map((file, index) => (
                                  <div key={index} className="text-sm text-green-600">✓ {file}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Data Tables (CSV)</h4>
                        <div className="space-y-4">
                          {schemas.find(s => s.id === selectedSchema)?.tables.map((table) => (
                            <div key={table} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium text-gray-900 capitalize">{table}</h5>
                                  <p className="text-sm text-gray-600">Upload CSV data for {table}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  {uploadedTables[table] && (
                                    <span className="text-sm text-green-600">✓ {uploadedTables[table]}</span>
                                  )}
                                  <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => handleTableUpload(table, e)}
                                    className="hidden"
                                    id={`${table}-upload`}
                                  />
                                  <label
                                    htmlFor={`${table}-upload`}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-300 transition-colors"
                                  >
                                    Upload CSV
                                  </label>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between mt-8">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setCurrentStep(4)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                      >
                        Continue to AI Generation
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">AI Generation</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Brain className="w-8 h-8 text-purple-500" />
                        <h4 className="text-lg font-semibold text-gray-900">Brainstorm</h4>
                      </div>
                      <p className="text-gray-600 mb-6">Generate creative insights and ideas from your content</p>
                      
                      <button
                        onClick={() => handleGenerate('brainstorm', { 
                          prompt: 'Generate creative insights', 
                          tone: 'creative' 
                        })}
                        disabled={isGenerating}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isGenerating && generationType === 'brainstorm' ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Brain className="w-5 h-5" />
                            <span>Start Brainstorming</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <PenTool className="w-8 h-8 text-green-500" />
                        <h4 className="text-lg font-semibold text-gray-900">Write</h4>
                      </div>
                      <p className="text-gray-600 mb-6">Create structured content based on your research</p>
                      
                      <button
                        onClick={() => handleGenerate('write', { 
                          instructions: 'Write creative content', 
                          tone: 'creative' 
                        })}
                        disabled={isGenerating}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isGenerating && generationType === 'write' ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Writing...</span>
                          </>
                        ) : (
                          <>
                            <PenTool className="w-5 h-5" />
                            <span>Start Writing</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep(5)}
                      disabled={versions.length === 0}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue to Export
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Export Your Project</h3>
                  <p className="text-gray-600 mb-8">Choose your export format.</p>
                  
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
