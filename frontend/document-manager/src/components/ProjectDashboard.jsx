import { useState, useEffect } from 'react';
import { 
  Folder, 
  Plus, 
  Settings, 
  FileText, 
  Database, 
  Brain, 
  Search,
  BarChart3,
  ChevronRight,
  Star,
  Clock,
  Upload,
  X,
  Table,
  Loader2,
  Lightbulb,
  Check,
  AlertCircle
} from 'lucide-react';

const ProjectDashboard = () => {
  const [currentView, setCurrentView] = useState('projects');
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data
  const projects = [
    {
      id: 'proj-1',
      name: 'Market Research Q4',
      description: 'Customer analysis and market trends for Q4 planning',
      lastUpdated: '2 hours ago',
      stats: { documents: 15, tables: 4, brainstorms: 8 },
      starred: true
    },
    {
      id: 'proj-2', 
      name: 'Product Launch Analysis',
      description: 'Data analysis for new product launch strategy',
      lastUpdated: '1 day ago',
      stats: { documents: 23, tables: 7, brainstorms: 12 },
      starred: false
    },
    {
      id: 'proj-3',
      name: 'Customer Feedback Study',
      description: 'Analysis of customer satisfaction surveys',
      lastUpdated: '3 days ago', 
      stats: { documents: 8, tables: 3, brainstorms: 5 },
      starred: true
    }
  ];

  const projectTabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'data', name: 'Data Tables', icon: Database },
    { id: 'brainstorm', name: 'Brainstorm', icon: Brain },
    { id: 'insights', name: 'Insights', icon: Search },
  ];

  const openProject = (project) => {
    setSelectedProject(project);
    setCurrentView('project-detail');
    setActiveTab('overview');
  };

  const goBackToProjects = () => {
    setCurrentView('projects');
    setSelectedProject(null);
  };

  if (currentView === 'project-detail' && selectedProject) {
    return (
      <div className="min-h-screen bg-stone-50">
        {/* Project Header */}
        <div className="bg-white shadow-sm border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={goBackToProjects}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-stone-600 rotate-180" />
                </button>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Folder className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-stone-900">{selectedProject.name}</h1>
                  <p className="text-stone-600">{selectedProject.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">
                  <Star className={`w-4 h-4 ${selectedProject.starred ? 'text-yellow-500 fill-current' : ''}`} />
                  {selectedProject.starred ? 'Starred' : 'Star'}
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Project Tabs */}
        <div className="bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex space-x-1">
              {projectTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 rounded-t-lg transition-all font-medium ${
                      activeTab === tab.id
                        ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Project Content */}
        <div className="max-w-7xl mx-auto p-8">
          {activeTab === 'overview' && <ProjectOverview project={selectedProject} />}
          {activeTab === 'documents' && <ProjectDocuments project={selectedProject} />}
          {activeTab === 'data' && <ProjectData project={selectedProject} />}
          {activeTab === 'brainstorm' && <ProjectBrainstorm project={selectedProject} />}
          {activeTab === 'insights' && <ProjectInsights project={selectedProject} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* App Header */}
      <div className="bg-white shadow-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-stone-900">Nell Beta</h1>
                <p className="text-stone-600">AI-powered project workspace</p>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors font-medium">
              <Plus className="w-5 h-5" />
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-stone-800">Your Projects</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id}
              onClick={() => openProject(project)}
              className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Folder className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    {project.starred && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                    <Clock className="w-4 h-4 text-stone-400" />
                    <span className="text-sm text-stone-500">{project.lastUpdated}</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-stone-900 mb-2 group-hover:text-emerald-600 transition-colors">
                  {project.name}
                </h3>
                <p className="text-stone-600 text-sm mb-4">
                  {project.description}
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-stone-900">{project.stats.documents}</div>
                    <div className="text-xs text-stone-500">Documents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-stone-900">{project.stats.tables}</div>
                    <div className="text-xs text-stone-500">Tables</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-stone-900">{project.stats.brainstorms}</div>
                    <div className="text-xs text-stone-500">Brainstorms</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Project Overview Component
const ProjectOverview = ({ project }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-8 h-8 text-emerald-600" />
          <div>
            <h3 className="text-lg font-semibold text-stone-900">Documents</h3>
            <p className="text-2xl font-bold text-stone-900">{project.stats.documents}</p>
          </div>
        </div>
        <p className="text-stone-600 text-sm">AI-searchable documents</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-8 h-8 text-emerald-600" />
          <div>
            <h3 className="text-lg font-semibold text-stone-900">Data Tables</h3>
            <p className="text-2xl font-bold text-stone-900">{project.stats.tables}</p>
          </div>
        </div>
        <p className="text-stone-600 text-sm">Structured datasets</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8 text-emerald-600" />
          <div>
            <h3 className="text-lg font-semibold text-stone-900">Brainstorms</h3>
            <p className="text-2xl font-bold text-stone-900">{project.stats.brainstorms}</p>
          </div>
        </div>
        <p className="text-stone-600 text-sm">AI-generated insights</p>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50">
            <FileText className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-medium text-stone-900">Uploaded customer_survey.pdf</p>
              <p className="text-sm text-stone-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50">
            <Database className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-medium text-stone-900">Created sales_data table</p>
              <p className="text-sm text-stone-500">1 day ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50">
            <Brain className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-medium text-stone-900">Generated marketing ideas</p>
              <p className="text-sm text-stone-500">2 days ago</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button className="w-full flex items-center gap-3 p-4 rounded-lg border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left">
            <Plus className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-medium text-stone-900">Upload Document</p>
              <p className="text-sm text-stone-500">Add files for AI analysis</p>
            </div>
          </button>
          <button className="w-full flex items-center gap-3 p-4 rounded-lg border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left">
            <Database className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-medium text-stone-900">Import Data</p>
              <p className="text-sm text-stone-500">Upload CSV files</p>
            </div>
          </button>
          <button className="w-full flex items-center gap-3 p-4 rounded-lg border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left">
            <Brain className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-medium text-stone-900">Start Brainstorming</p>
              <p className="text-sm text-stone-500">Generate AI insights</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Project Documents Component - Wired to backend
const ProjectDocuments = ({ project }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [querying, setQuerying] = useState(false);

  const projectBucketName = `${project.id}_documents`;

  useEffect(() => {
    loadProjectBucket();
  }, [project]);

  const loadProjectBucket = async () => {
    try {
      await fetch('/api/buckets/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: projectBucketName })
      });

      const response = await fetch(`/api/buckets/${projectBucketName}/files`);
      const data = await response.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load project documents:', err);
    }
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        
        await fetch(`/api/buckets/${projectBucketName}/ingest`, {
          method: 'POST',
          body: formData
        });
      }
      
      setSelectedFiles([]);
      await loadProjectBucket();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const queryDocuments = async () => {
    if (!query.trim()) return;
    
    setQuerying(true);
    try {
      const response = await fetch(`/api/buckets/${projectBucketName}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() })
      });
      
      if (response.ok) {
        const data = await response.json();
        setQueryResult(data.result);
      }
    } catch (err) {
      console.error('Query failed:', err);
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h3 className="text-lg font-semibold text-stone-900">Upload Documents</h3>
          <p className="text-stone-600 text-sm">Add documents to {project.name}</p>
        </div>
        <div className="p-6">
          <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center hover:border-emerald-400 hover:bg-emerald-50 transition-all">
            <Upload className="w-8 h-8 mx-auto mb-3 text-stone-400" />
            <div className="mb-4">
              <label className="text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium">
                Choose files to upload
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="text-sm text-stone-500">{files.length} documents in project</p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <div className="space-y-2 mb-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                    <span className="text-stone-700">{file.name}</span>
                    <button
                      onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                      className="text-stone-500 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={uploadFiles}
                disabled={uploading}
                className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h3 className="text-lg font-semibold text-stone-900">Search Documents</h3>
          <p className="text-stone-600 text-sm">Ask questions about your documents</p>
        </div>
        <div className="p-6">
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="flex-1 px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onKeyDown={(e) => e.key === 'Enter' && queryDocuments()}
            />
            <button
              onClick={queryDocuments}
              disabled={!query.trim() || querying}
              className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              {querying ? 'Searching...' : 'Search'}
            </button>
          </div>

          {queryResult && (
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <h4 className="font-medium text-emerald-900 mb-2">Answer</h4>
              <p className="text-emerald-800 whitespace-pre-wrap">{queryResult}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Project Data Component - Wired to backend
const ProjectData = ({ project }) => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newTableName, setNewTableName] = useState('');

  useEffect(() => {
    loadTables();
  }, [project]);

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable);
    }
  }, [selectedTable]);

  const loadTables = async () => {
    try {
      const response = await fetch(`/api/tables/list?project=${project.id}`);
      const data = await response.json();
      setTables(data.tables || []);
    } catch (err) {
      console.error('Failed to load tables:', err);
    }
  };

  const loadTableData = async (tableName) => {
    try {
      const response = await fetch(`/api/tables/${tableName}?project=${project.id}`);
      const data = await response.json();
      setTableData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load table data:', err);
    }
  };

  const uploadCSV = async () => {
    if (!selectedFile || !newTableName.trim()) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('project', project.id);
      formData.append('table_name', newTableName);

      const response = await fetch('/api/tables/upload_csv', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setSelectedFile(null);
        setNewTableName('');
        await loadTables();
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h3 className="text-lg font-semibold text-stone-900">Upload Data Table</h3>
          <p className="text-stone-600 text-sm">Add CSV data to {project.name}</p>
        </div>
        <div className="p-6">
          <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center hover:border-emerald-400 hover:bg-emerald-50 transition-all">
            <Database className="w-8 h-8 mx-auto mb-3 text-stone-400" />
            <div className="mb-4">
              <label className="text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium">
                Choose CSV file
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setSelectedFile(file);
                      setNewTableName(file.name.replace('.csv', ''));
                    }
                  }}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="text-sm text-stone-500">{tables.length} tables in project</p>
          </div>

          {selectedFile && (
            <div className="mt-4 space-y-4">
              <div className="p-3 bg-stone-50 rounded-lg">
                <p className="font-medium text-stone-700">{selectedFile.name}</p>
              </div>
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Table name..."
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={uploadCSV}
                disabled={uploading || !newTableName.trim()}
                className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Creating Table...' : 'Create Table'}
              </button>
            </div>
          )}
        </div>
      </div>

      {tables.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-6 border-b border-stone-100">
            <h3 className="text-lg font-semibold text-stone-900">Data Tables</h3>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {tables.map((table) => (
                <button
                  key={table}
                  onClick={() => setSelectedTable(table)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedTable === table
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-stone-200 hover:border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Table className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-stone-900">{table}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTable && tableData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-6 border-b border-stone-100">
            <h3 className="text-lg font-semibold text-stone-900">Preview: {selectedTable}</h3>
            <p className="text-stone-600 text-sm">{tableData.length} rows</p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-stone-200 rounded-lg">
                <thead className="bg-stone-50">
                  <tr>
                    {Object.keys(tableData[0]).map(column => (
                      <th key={column} className="px-4 py-3 text-left font-medium text-stone-700 border-b border-stone-200">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.slice(0, 10).map((row, index) => (
                    <tr key={index} className="hover:bg-stone-50">
                      {Object.values(row).map((value, colIndex) => (
                        <td key={colIndex} className="px-4 py-3 text-stone-700 border-b border-stone-100">
                          {String(value).substring(0, 50)}{String(value).length > 50 && '...'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {tableData.length > 10 && (
                <p className="text-center text-stone-500 text-sm mt-4">
                  Showing first 10 of {tableData.length} rows
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Project Brainstorm Component - Wired to backend
const ProjectBrainstorm = ({ project }) => {
  const [tables, setTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [tableData, setTableData] = useState({});
  const [selectedRows, setSelectedRows] = useState({});
  const [userNote, setUserNote] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTables();
  }, [project]);

  const loadTables = async () => {
    try {
      const response = await fetch(`/api/tables/list?project=${project.id}`);
      const data = await response.json();
      setTables(data.tables || []);
    } catch (err) {
      console.error('Failed to load tables:', err);
    }
  };

  const loadTableData = async (tableName) => {
    try {
      const response = await fetch(`/api/tables/${tableName}?project=${project.id}`);
      const data = await response.json();
      setTableData(prev => ({
        ...prev,
        [tableName]: data
      }));
    } catch (err) {
      console.error(`Failed to load data for table ${tableName}:`, err);
    }
  };

  const toggleTableSelection = (tableName) => {
    setSelectedTables(prev => {
      const newSelection = prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName];
      
      if (newSelection.includes(tableName) && !tableData[tableName]) {
        loadTableData(tableName);
      }
      
      return newSelection;
    });
  };

  const runBrainstorm = async () => {
    if (selectedTables.length === 0 || !userNote.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: project.id,
          table_names: selectedTables,
          selected_rows: selectedRows,
          prompt_override: '',
          user_note: userNote
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.result);
      }
    } catch (err) {
      console.error('Brainstorm failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h3 className="text-lg font-semibold text-stone-900">AI Brainstorming</h3>
          <p className="text-stone-600 text-sm">Generate insights from {project.name} data</p>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">
              Select Data Tables ({selectedTables.length} selected)
            </label>
            <div className="space-y-2">
              {tables.map(table => (
                <label
                  key={table}
                  className="flex items-center gap-3 p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTables.includes(table)}
                    onChange={() => toggleTableSelection(table)}
                    className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500"
                  />
                  <Table className="w-5 h-5 text-stone-400" />
                  <span className="font-medium text-stone-700">{table}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              What do you want to brainstorm?
            </label>
            <textarea
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="Describe what you're trying to achieve..."
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              rows={4}
            />
          </div>

          <button
            onClick={runBrainstorm}
            disabled={isLoading || selectedTables.length === 0 || !userNote.trim()}
            className="w-full bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Ideas...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                Start Brainstorming
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-6 border-b border-stone-100">
            <h3 className="text-lg font-semibold text-stone-900">Generated Ideas</h3>
          </div>
          <div className="p-6">
            <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
              <div className="flex items-start gap-4">
                <Lightbulb className="w-6 h-6 text-emerald-600 mt-1 flex-shrink-0" />
                <div className="text-stone-700 whitespace-pre-wrap leading-relaxed">
                  {result}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Project Insights Component (placeholder for now)
const ProjectInsights = ({ project }) => (
  <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 text-center">
    <Search className="w-16 h-16 mx-auto mb-4 text-stone-300" />
    <h3 className="text-xl font-semibold text-stone-600 mb-2">Project Insights</h3>
    <p className="text-stone-500">Cross-reference and analyze project data</p>
    <p className="text-stone-400 text-sm mt-2">Coming soon...</p>
  </div>
);

export default ProjectDashboard;
