// frontend/document-manager/src/components/shared/DataSelector.jsx
import { useState } from 'react';
import { Folder, Database, Brain, ChevronDown, ChevronRight, Eye } from 'lucide-react';

const DataSelector = ({ 
  buckets = [], 
  tables = [], 
  brainstormVersions = [],
  selectedData = { buckets: [], tables: [], brainstormVersions: [] },
  onSelectionChange,
  mode = 'brainstorm'
}) => {
  const [expandedSections, setExpandedSections] = useState({
    buckets: true,
    tables: true,
    brainstorm: true
  });
  const [previewData, setPreviewData] = useState(null);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSelectionChange = (type, item, checked) => {
    const newSelection = { ...selectedData };
    
    if (checked) {
      if (!newSelection[type].includes(item)) {
        newSelection[type] = [...newSelection[type], item];
      }
    } else {
      newSelection[type] = newSelection[type].filter(i => i !== item);
    }
    
    onSelectionChange(newSelection);
  };

  const previewBucket = async (bucketName) => {
    try {
      const response = await fetch(`/api/buckets/${bucketName}/files`);
      const data = await response.json();
      setPreviewData({
        type: 'bucket',
        name: bucketName,
        files: data || []
      });
    } catch (err) {
      console.error('Failed to preview bucket:', err);
    }
  };

  const previewTable = async (tableName, projectId) => {
    try {
      const response = await fetch(`/api/tables/${tableName}?project=${projectId}`);
      const data = await response.json();
      setPreviewData({
        type: 'table',
        name: tableName,
        data: Array.isArray(data) ? data.slice(0, 5) : [], // First 5 rows
        totalRows: Array.isArray(data) ? data.length : 0
      });
    } catch (err) {
      console.error('Failed to preview table:', err);
    }
  };

  const getSelectionCount = () => {
    return selectedData.buckets.length + selectedData.tables.length + selectedData.brainstormVersions.length;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="p-4 border-b border-stone-100">
        <h3 className="text-lg font-semibold text-stone-800">
          Select Data Sources
        </h3>
        <p className="text-stone-600 text-sm mt-1">
          {getSelectionCount()} source{getSelectionCount() !== 1 ? 's' : ''} selected
        </p>
      </div>

      <div className="divide-y divide-stone-100">
        {/* Document Buckets */}
        {buckets.length > 0 && (
          <div className="p-4">
            <button
              onClick={() => toggleSection('buckets')}
              className="flex items-center justify-between w-full text-left mb-3"
            >
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-stone-800">Document Buckets</span>
                <span className="text-sm text-stone-500">({buckets.length})</span>
              </div>
              {expandedSections.buckets ? (
                <ChevronDown className="w-4 h-4 text-stone-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-stone-400" />
              )}
            </button>
            
            {expandedSections.buckets && (
              <div className="space-y-2">
                {buckets.map(bucket => (
                  <div key={bucket} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selectedData.buckets.includes(bucket)}
                        onChange={(e) => handleSelectionChange('buckets', bucket, e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500"
                      />
                      <Folder className="w-4 h-4 text-stone-400" />
                      <span className="font-medium text-stone-700">{bucket}</span>
                    </label>
                    <button
                      onClick={() => previewBucket(bucket)}
                      className="p-1 hover:bg-stone-200 rounded transition-colors"
                      title="Preview bucket contents"
                    >
                      <Eye className="w-4 h-4 text-stone-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Data Tables */}
        {tables.length > 0 && (
          <div className="p-4">
            <button
              onClick={() => toggleSection('tables')}
              className="flex items-center justify-between w-full text-left mb-3"
            >
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-stone-800">Data Tables</span>
                <span className="text-sm text-stone-500">({tables.length})</span>
              </div>
              {expandedSections.tables ? (
                <ChevronDown className="w-4 h-4 text-stone-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-stone-400" />
              )}
            </button>
            
            {expandedSections.tables && (
              <div className="space-y-2">
                {tables.map(table => (
                  <div key={table} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selectedData.tables.includes(table)}
                        onChange={(e) => handleSelectionChange('tables', table, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-stone-300 rounded focus:ring-blue-500"
                      />
                      <Database className="w-4 h-4 text-stone-400" />
                      <span className="font-medium text-stone-700">{table}</span>
                    </label>
                    <button
                      onClick={() => previewTable(table, 'project-id')} // TODO: Pass actual project ID
                      className="p-1 hover:bg-stone-200 rounded transition-colors"
                      title="Preview table data"
                    >
                      <Eye className="w-4 h-4 text-stone-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Brainstorm Versions (only show in Write mode) */}
        {mode === 'write' && brainstormVersions.length > 0 && (
          <div className="p-4">
            <button
              onClick={() => toggleSection('brainstorm')}
              className="flex items-center justify-between w-full text-left mb-3"
            >
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-stone-800">Previous Brainstorms</span>
                <span className="text-sm text-stone-500">({brainstormVersions.length})</span>
              </div>
              {expandedSections.brainstorm ? (
                <ChevronDown className="w-4 h-4 text-stone-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-stone-400" />
              )}
            </button>
            
            {expandedSections.brainstorm && (
              <div className="space-y-2">
                {brainstormVersions.map(version => (
                  <div key={version.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selectedData.brainstormVersions.includes(version.id)}
                        onChange={(e) => handleSelectionChange('brainstormVersions', version.id, e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-stone-300 rounded focus:ring-purple-500"
                      />
                      <Brain className="w-4 h-4 text-stone-400" />
                      <div className="flex-1">
                        <span className="font-medium text-stone-700">{version.name}</span>
                        <div className="text-xs text-stone-500">{version.created}</div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-800">
                Preview: {previewData.name}
              </h3>
              <button
                onClick={() => setPreviewData(null)}
                className="text-stone-500 hover:text-stone-700"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              {previewData.type === 'bucket' && (
                <div>
                  <p className="text-stone-600 mb-3">{previewData.files.length} files</p>
                  <div className="space-y-2">
                    {previewData.files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-stone-50 rounded">
                        <span className="text-stone-700">{file.filename || `Document ${index + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {previewData.type === 'table' && (
                <div>
                  <p className="text-stone-600 mb-3">{previewData.totalRows} total rows (showing first 5)</p>
                  {previewData.data.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-stone-200 rounded">
                        <thead className="bg-stone-50">
                          <tr>
                            {Object.keys(previewData.data[0]).map(column => (
                              <th key={column} className="px-3 py-2 text-left font-medium text-stone-700 border-b border-stone-200">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.data.map((row, index) => (
                            <tr key={index}>
                              {Object.values(row).map((value, colIndex) => (
                                <td key={colIndex} className="px-3 py-2 text-stone-700 border-b border-stone-100">
                                  {String(value).substring(0, 50)}{String(value).length > 50 && '...'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSelector;
