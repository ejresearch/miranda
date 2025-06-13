import { useState, useEffect } from 'react';
import { Upload, Database, Table, Eye, Plus, FileText, Folder, Check, AlertCircle, X } from 'lucide-react';

const TableManager = () => {
  const [projects, setProjects] = useState(['project1', 'project2']); // Mock for now
  const [selectedProject, setSelectedProject] = useState('');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newTableName, setNewTableName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load tables when project is selected
  useEffect(() => {
    if (selectedProject) {
      loadTables(selectedProject);
    }
  }, [selectedProject]);

  // Load table data when table is selected
  useEffect(() => {
    if (selectedProject && selectedTable) {
      loadTableData(selectedTable);
    }
  }, [selectedProject, selectedTable]);

  const loadTables = async (project) => {
    try {
      const response = await fetch(`/api/tables/list?project=${project}`);
      const data = await response.json();
      setTables(data.tables || []);
      setSelectedTable('');
      setTableData([]);
    } catch (err) {
      console.error('Failed to load tables:', err);
      setError('Failed to load tables');
    }
  };

  const loadTableData = async (tableName) => {
    try {
      const response = await fetch(`/api/tables/${tableName}?project=${selectedProject}`);
      const data = await response.json();
      setTableData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load table data:', err);
      setError('Failed to load table data');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.name.endsWith('.csv'));
    
    if (csvFile) {
      setSelectedFile(csvFile);
      setNewTableName(csvFile.name.replace('.csv', ''));
    } else {
      setError('Please upload a CSV file');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setNewTableName(file.name.replace('.csv', ''));
      setError('');
    } else {
      setError('Please select a CSV file');
    }
  };

  const uploadCSV = async () => {
    if (!selectedProject || !selectedFile || !newTableName.trim()) {
      setError('Please select a project, file, and table name');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('project', selectedProject);
      formData.append('table_name', newTableName);

      const response = await fetch('/api/tables/upload_csv', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setSuccess(`Table "${newTableName}" created successfully!`);
        setSelectedFile(null);
        setNewTableName('');
        loadTables(selectedProject);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white shadow-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-stone-900">Table Manager</h1>
          <p className="text-stone-600 mt-2">Upload CSV files and manage your structured data</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-12 gap-8">
          
          {/* Left Panel - Project & Table Selection */}
          <div className="col-span-4 space-y-6">
            
            {/* Project Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="p-6 border-b border-stone-100">
                <h2 className="text-lg font-semibold text-stone-800 mb-4">Project Selection</h2>
                
                {!isCreatingProject ? (
                  <div className="space-y-3">
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Select a project...</option>
                      {projects.map(project => (
                        <option key={project} value={project}>{project}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setIsCreatingProject(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Project
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Enter project name..."
                      className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      onKeyDown={(e) => e.key === 'Enter' && setIsCreatingProject(false)}
                      autoFocus
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (newProjectName.trim()) {
                            setProjects(prev => [...prev, newProjectName]);
                            setSelectedProject(newProjectName);
                          }
                          setNewProjectName('');
                          setIsCreatingProject(false);
                        }}
                        className="flex-1 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setIsCreatingProject(false);
                          setNewProjectName('');
                        }}
                        className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tables List */}
            {selectedProject && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="p-6 border-b border-stone-100">
                  <h2 className="text-lg font-semibold text-stone-800 mb-4">Data Tables</h2>
                  <p className="text-stone-600 text-sm">Tables in "{selectedProject}"</p>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {tables.length === 0 ? (
                    <div className="p-8 text-center text-stone-500">
                      <Database className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">No tables yet</p>
                      <p className="text-sm mt-1">Upload a CSV file to get started</p>
                    </div>
                  ) : (
                    <div className="p-3">
                      {tables.map((table) => (
                        <div
                          key={table}
                          className={`group flex items-center justify-between p-4 mb-2 rounded-lg cursor-pointer transition-all ${
                            selectedTable === table
                              ? 'bg-emerald-50 border-2 border-emerald-200 shadow-sm'
                              : 'hover:bg-stone-50 border-2 border-transparent'
                          }`}
                          onClick={() => setSelectedTable(table)}
                        >
                          <div className="flex items-center gap-3">
                            <Table className={`w-6 h-6 ${
                              selectedTable === table ? 'text-emerald-600' : 'text-stone-400'
                            }`} />
                            <span className={`font-medium ${
                              selectedTable === table ? 'text-emerald-900' : 'text-stone-700'
                            }`}>
                              {table}
                            </span>
                          </div>
                          <Eye className="w-4 h-4 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Upload & Data View */}
          <div className="col-span-8">
            {!selectedProject ? (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
                <Folder className="w-20 h-20 mx-auto mb-6 text-stone-300" />
                <h2 className="text-2xl font-semibold text-stone-600 mb-3">Select a Project</h2>
                <p className="text-stone-500 text-lg">Choose or create a project to start managing your data tables</p>
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* CSV Upload */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                  <div className="p-6 border-b border-stone-100">
                    <h2 className="text-xl font-semibold text-stone-800">Upload CSV File</h2>
                    <p className="text-stone-600 mt-1">Add a new data table to "{selectedProject}"</p>
                  </div>
                  
                  <div className="p-6">
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                        isDragging
                          ? 'border-emerald-400 bg-emerald-50'
                          : 'border-stone-300 hover:border-emerald-400 hover:bg-emerald-50'
                      }`}
                      onDrop={handleDrop}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-stone-400" />
                      <h3 className="text-lg font-semibold text-stone-700 mb-2">
                        Drop CSV file here or browse to select
                      </h3>
                      <p className="text-stone-500 mb-4">
                        <label className="text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium">
                          Choose CSV file
                          <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={uploading}
                          />
                        </label>
                      </p>
                      <div className="inline-flex items-center px-3 py-1 bg-stone-100 rounded-full text-sm">
                        <Database className="w-4 h-4 mr-2 text-stone-500" />
                        <span className="font-medium text-stone-600">
                          {tables.length} tables in project
                        </span>
                      </div>
                    </div>

                    {/* Selected File & Upload */}
                    {selectedFile && (
                      <div className="mt-6">
                        <h4 className="font-medium text-stone-800 mb-3">File ready to upload:</h4>
                        <div className="bg-stone-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-3 mb-3">
                            <FileText className="w-5 h-5 text-stone-400" />
                            <div>
                              <p className="font-medium text-stone-700">{selectedFile.name}</p>
                              <p className="text-sm text-stone-500">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                              Table Name:
                            </label>
                            <input
                              type="text"
                              value={newTableName}
                              onChange={(e) => setNewTableName(e.target.value)}
                              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              placeholder="Enter table name..."
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={uploadCSV}
                            disabled={uploading || !newTableName.trim()}
                            className="flex-1 bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                          >
                            {uploading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                Create Table
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFile(null);
                              setNewTableName('');
                              clearMessages();
                            }}
                            disabled={uploading}
                            className="px-4 py-3 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    {error && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-red-700 font-medium">Error</p>
                          <p className="text-red-600 text-sm">{error}</p>
                        </div>
                        <button onClick={clearMessages} className="ml-auto">
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    )}

                    {success && (
                      <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-emerald-700 font-medium">Success</p>
                          <p className="text-emerald-600 text-sm">{success}</p>
                        </div>
                        <button onClick={clearMessages} className="ml-auto">
                          <X className="w-4 h-4 text-emerald-500" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table Data Preview */}
                {selectedTable && (
                  <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="p-6 border-b border-stone-100">
                      <h2 className="text-xl font-semibold text-stone-800">Table: {selectedTable}</h2>
                      <p className="text-stone-600 mt-1">{tableData.length} rows</p>
                    </div>
                    
                    <div className="p-6">
                      {tableData.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border border-stone-200 rounded-lg overflow-hidden">
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
                              {tableData.slice(0, 50).map((row, index) => (
                                <tr key={index} className="hover:bg-stone-50">
                                  {Object.values(row).map((value, colIndex) => (
                                    <td key={colIndex} className="px-4 py-3 text-stone-700 border-b border-stone-100">
                                      {String(value).length > 100 
                                        ? String(value).substring(0, 100) + '...' 
                                        : String(value)
                                      }
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {tableData.length > 50 && (
                            <div className="mt-4 text-center text-stone-500 text-sm">
                              Showing first 50 of {tableData.length} rows
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-stone-500">
                          <Table className="w-12 h-12 mx-auto mb-3 opacity-40" />
                          <p className="text-lg">No data in this table</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableManager;
