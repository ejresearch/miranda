// frontend/document-manager/src/components/shared/VersionManager.jsx
import { useState } from 'react';
import { 
  Clock, 
  Eye, 
  Download, 
  Trash2, 
  GitBranch, 
  Copy, 
  MoreVertical,
  Edit3
} from 'lucide-react';

const VersionManager = ({ 
  versions = [], 
  onVersionSelect, 
  onVersionDelete, 
  onVersionDuplicate,
  onVersionRename,
  selectedVersion = null,
  type = 'brainstorm' // 'brainstorm' or 'write'
}) => {
  const [expandedVersion, setExpandedVersion] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [newName, setNewName] = useState('');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRename = (version) => {
    setEditingName(version.id);
    setNewName(version.name);
  };

  const saveRename = (versionId) => {
    if (newName.trim() && onVersionRename) {
      onVersionRename(versionId, newName.trim());
    }
    setEditingName(null);
    setNewName('');
  };

  const cancelRename = () => {
    setEditingName(null);
    setNewName('');
  };

  const exportVersion = (version) => {
    const data = {
      name: version.name,
      created: version.created,
      prompt: version.prompt,
      result: version.result,
      metadata: version.metadata
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${version.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (versions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 text-center">
        <Clock className="w-12 h-12 mx-auto mb-3 text-stone-300" />
        <h3 className="text-lg font-medium text-stone-600 mb-2">No versions yet</h3>
        <p className="text-stone-500">
          {type === 'brainstorm' ? 'Generate your first brainstorm' : 'Create your first write output'} to see versions here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="p-4 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-emerald-600" />
            {type === 'brainstorm' ? 'Brainstorm' : 'Write'} Versions
          </h3>
          <span className="text-sm text-stone-500">{versions.length} version{versions.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
        {versions.map((version) => (
          <div key={version.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {editingName === version.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(version.id);
                          if (e.key === 'Escape') cancelRename();
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => saveRename(version.id)}
                        className="text-emerald-600 hover:text-emerald-700 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelRename}
                        className="text-stone-500 hover:text-stone-700 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onVersionSelect && onVersionSelect(version)}
                        className={`font-medium text-left hover:text-emerald-600 transition-colors ${
                          selectedVersion?.id === version.id ? 'text-emerald-600' : 'text-stone-800'
                        }`}
                      >
                        {version.name}
                      </button>
                      {selectedVersion?.id === version.id && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                          Active
                        </span>
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-stone-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(version.created)}
                  </span>
                  {version.metadata?.dataSourcesCount && (
                    <span>{version.metadata.dataSourcesCount} sources</span>
                  )}
                  {version.result && (
                    <span>{version.result.length} characters</span>
                  )}
                </div>

                {version.focus && (
                  <div className="mb-3">
                    <span className="text-xs text-stone-500">Focus: </span>
                    <span className="text-sm text-stone-700">{version.focus}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                  title="View details"
                >
                  <Eye className="w-4 h-4 text-stone-500" />
                </button>
                
                <div className="relative group">
                  <button className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-stone-500" />
                  </button>
                  
                  <div className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <button
                      onClick={() => handleRename(version)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 w-full text-left"
                    >
                      <Edit3 className="w-3 h-3" />
                      Rename
                    </button>
                    <button
                      onClick={() => onVersionDuplicate && onVersionDuplicate(version)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 w-full text-left"
                    >
                      <Copy className="w-3 h-3" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => exportVersion(version)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 w-full text-left"
                    >
                      <Download className="w-3 h-3" />
                      Export
                    </button>
                    <button
                      onClick={() => onVersionDelete && onVersionDelete(version.id)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedVersion === version.id && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                {version.prompt && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-stone-700 mb-2">Prompt Used</h4>
                    <div className="bg-stone-50 rounded-lg p-3 text-sm text-stone-600 max-h-32 overflow-y-auto">
                      {version.prompt}
                    </div>
                  </div>
                )}
                
                {version.result && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-stone-700 mb-2">Result Preview</h4>
                    <div className="bg-stone-50 rounded-lg p-3 text-sm text-stone-600 max-h-32 overflow-y-auto">
                      {version.result.substring(0, 300)}
                      {version.result.length > 300 && '...'}
                    </div>
                  </div>
                )}

                {version.metadata?.selectedSources && (
                  <div>
                    <h4 className="text-sm font-medium text-stone-700 mb-2">Data Sources Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {version.metadata.selectedSources.buckets?.map(bucket => (
                        <span key={bucket} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                          📁 {bucket}
                        </span>
                      ))}
                      {version.metadata.selectedSources.tables?.map(table => (
                        <span key={table} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          🗃️ {table}
                        </span>
                      ))}
                      {version.metadata.selectedSources.brainstormVersions?.map(versionId => (
                        <span key={versionId} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          🧠 {versionId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VersionManager;
