// frontend/document-manager/src/components/project/ProjectData.jsx
import { useState, useEffect } from 'react';
import { 
  Upload, 
  Database, 
  Table, 
  Eye, 
  FileText, 
  Check, 
  AlertCircle,
  X 
} from 'lucide-react';

const ProjectData = ({ project, tables, onTablesChange, onStepComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [newTableName, setNewTableName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get suggested tables from project template
  const suggestedTables = {
    screenplay: ['character_types', 'scene_beats', 'story_structure'],
    textbook: ['timeline_data', 'filmmaker_info', 'film_catalog'],
    custom: []
  };

  const suggestions = suggestedTables[project.template] || [];

  useEffect(() => {
    // Mark step as complete if we have tables
    onStepComplete(tables.length > 0);
  }, [tables.length, onStepComplete]);

  // Load table data when table is selected
  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable);
    }
  }, [selectedTable]);

  const loadTableData = async (tableName) => {
    try {
      const response = await fetch(`/api/tables/${tableName}?project=${project.id}`);
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
      setError('');
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
    if (!selectedFile || !newTableName.trim()) {
      setError('Please select a file and enter a table name');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('project', project.id);
      formData.append('table_name', newTableName.trim());

      const response = await fetch('/api/tables/upload_csv', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const updatedTables = [...tables, newTableName.trim()];
        onTablesChange(updatedTables);
        setSuccess(`Table "${newTableName}" created successfully!`);
        setSelectedFile(null);
        setNewTableName('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload CSV file');
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setNewTableName('');
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-stone-900">Upload Data Tables</h2>
            <p className="text-stone-600">Add CSV files to create structured data tables</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-emerald-700">{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Suggested Tables */}
        {suggestions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-stone-700 mb-3">Suggested tables for {project.template}:</h3>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(suggestion => (
                <span
                  key={suggestion}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                >
                  {suggestion}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-stone-300 hover:border-blue-400 hover:bg-blue-50'
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
            <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
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
              {tables.length} table{tables.length !== 1 ? 's' : ''} in project
            </span>
          </div>
        </div>

        {/* Selected File */}
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
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter table name..."
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={uploadCSV}
                disabled={uploading || !newTableName.trim()}
                className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Table...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Create Table
                  </>
                )}
              </button>
              <button
                onClick={clearSelection}
                disabled={uploading}
                className="px-4 py-3 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing Tables */}
      {tables.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-100">
            <h3 className="text-lg font-semibold text-stone-800">Your Data Tables</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map(table => (
                <div
                  key={table}
                  className={`p-4 border rounded-lg transition-all cursor-pointer ${
                    selectedTable === table
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-stone-200 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                  onClick={() => setSelectedTable(table)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Table className="w-6 h-6 text-blue-600" />
                      <span className="font-medium text-stone-900">{table}</span>
                    </div>
                    <Eye className="w-4 h-4 text-stone-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table Preview */}
      {selectedTable && tableData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-100">
            <h3 className="text-lg font-semibold text-stone-800">
              Preview: {selectedTable}
            </h3>
            <p className="text-stone-600 text-sm">{tableData.length} rows</p>
          </div>
          <div className="p-6">
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
                  {tableData.slice(0, 10).map((row, index) => (
                    <tr key={index} className="hover:bg-stone-50">
                      {Object.values(row).map((value, colIndex) => (
                        <td key={colIndex} className="px-4 py-3 text-stone-700 border-b border-stone-100">
                          {String(value).length > 50 
                            ? String(value).substring(0, 50) + '...' 
                            : String(value)
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {tableData.length > 10 && (
                <div className="mt-4 text-center text-stone-500 text-sm">
                  Showing first 10 of {tableData.length} rows
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectData;
