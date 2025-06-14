// frontend/document-manager/src/components/project/ProjectBrainstorm.jsx
import { useState, useEffect } from 'react';
import { Brain, Loader2, Save, Download, AlertCircle } from 'lucide-react';
import PromptBuilder from '../shared/PromptBuilder';
import VersionManager from '../shared/VersionManager';
import ResultsDisplay from '../shared/ResultsDisplay';

const ProjectBrainstorm = ({ 
  project, 
  buckets, 
  tables, 
  versions, 
  onVersionsChange, 
  onStepComplete 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState('');
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saveDialog, setSaveDialog] = useState({ show: false, name: '', focus: '' });

  // Prompt builder state
  const [constructedPrompt, setConstructedPrompt] = useState('');
  const [promptCustomizations, setPromptCustomizations] = useState({});
  const [selectedData, setSelectedData] = useState({
    buckets: [],
    tables: [],
    brainstormVersions: []
  });

  useEffect(() => {
    // Mark step as complete if we have versions
    onStepComplete(versions.length > 0);
  }, [versions.length, onStepComplete]);

  const handlePromptChange = (prompt, customizations) => {
    setConstructedPrompt(prompt);
    setPromptCustomizations(customizations);
  };

  const handleDataSelectionChange = (selection) => {
    setSelectedData(selection);
  };

  const generateBrainstorm = async () => {
    if (!constructedPrompt.trim()) {
      setError('Please configure your prompt first');
      return;
    }

    if (selectedData.buckets.length === 0 && selectedData.tables.length === 0) {
      setError('Please select at least one data source');
      return;
    }

    setIsGenerating(true);
    setError('');
    setCurrentResult('');

    try {
      const response = await fetch('/api/brainstorm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: project.id,
          table_names: selectedData.tables,
          selected_rows: {}, // TODO: Implement row selection
          prompt_override: constructedPrompt,
          user_note: promptCustomizations.additionalContext || '',
          metadata: {
            selectedSources: selectedData,
            customizations: promptCustomizations,
            dataSourcesCount: selectedData.buckets.length + selectedData.tables.length
          }
        })
      });

      if (!response.ok) {
        throw new Error('Brainstorm request failed');
      }

      const data = await response.json();
      setCurrentResult(data.result);
      
      // Auto-open save dialog with suggested name
      const suggestedName = promptCustomizations.focus 
        ? `${promptCustomizations.focus}_v${versions.length + 1}`
        : `brainstorm_v${versions.length + 1}`;
      
      setSaveDialog({
        show: true,
        name: suggestedName,
        focus: promptCustomizations.focus || ''
      });

    } catch (err) {
      console.error('Brainstorm failed:', err);
      setError('Failed to generate brainstorm. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveVersion = async () => {
    if (!saveDialog.name.trim() || !currentResult) {
      setError('Please provide a name for this version');
      return;
    }

    try {
      // In a real implementation, this would save to backend
      const newVersion = {
        id: `brainstorm_${Date.now()}`,
        name: saveDialog.name.trim(),
        focus: saveDialog.focus,
        created: new Date().toISOString(),
        prompt: constructedPrompt,
        result: currentResult,
        metadata: {
          selectedSources: selectedData,
          customizations: promptCustomizations,
          dataSourcesCount: selectedData.buckets.length + selectedData.tables.length
        }
      };

      const updatedVersions = [...versions, newVersion];
      onVersionsChange(updatedVersions);
      
      setSuccess(`Version "${saveDialog.name}" saved successfully!`);
      setSaveDialog({ show: false, name: '', focus: '' });
      setCurrentResult('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Failed to save version:', err);
      setError('Failed to save version');
    }
  };

  const handleVersionSelect = (version) => {
    setSelectedVersion(version);
    setCurrentResult(''); // Clear current result when viewing saved version
  };

  const handleVersionDelete = (versionId) => {
    if (confirm('Are you sure you want to delete this version?')) {
      const updatedVersions = versions.filter(v => v.id !== versionId);
      onVersionsChange(updatedVersions);
      if (selectedVersion?.id === versionId) {
        setSelectedVersion(null);
      }
    }
  };

  const handleVersionDuplicate = (version) => {
    const duplicatedVersion = {
      ...version,
      id: `brainstorm_${Date.now()}`,
      name: `${version.name}_copy`,
      created: new Date().toISOString()
    };
    
    const updatedVersions = [...versions, duplicatedVersion];
    onVersionsChange(updatedVersions);
  };

  const handleVersionRename = (versionId, newName) => {
    const updatedVersions = versions.map(v => 
      v.id === versionId ? { ...v, name: newName } : v
    );
    onVersionsChange(updatedVersions);
  };

  const exportAllVersions = () => {
    const exportData = {
      project: project.name,
      type: 'brainstorm_versions',
      exported: new Date().toISOString(),
      versions: versions
    };
    
    const csv = convertToCSV(versions);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}_brainstorm_versions.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data) => {
    const headers = ['Name', 'Focus', 'Created', 'Result', 'Data Sources'];
    const rows = data.map(version => [
      version.name,
      version.focus || '',
      version.created,
      version.result?.replace(/"/g, '""') || '', // Escape quotes for CSV
      version.metadata?.dataSourcesCount || 0
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-8 h-8 text-emerald-600" />
          <div>
            <h2 className="text-2xl font-bold text-stone-900">AI Brainstorming</h2>
            <p className="text-stone-600">Generate insights from your project data</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
            <Save className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-700">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Prompt Builder */}
          <div className="space-y-6">
            <PromptBuilder
              project={project}
              mode="brainstorm"
              buckets={buckets}
              tables={tables}
              onPromptChange={handlePromptChange}
              onDataSelectionChange={handleDataSelectionChange}
            />

            <button
              onClick={generateBrainstorm}
              disabled={isGenerating || !constructedPrompt.trim()}
              className="w-full bg-emerald-500 text-white px-6 py-4 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Insights...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Generate Brainstorm
                </>
              )}
            </button>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {currentResult && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-stone-800">Generated Insights</h3>
                </div>
                <div className="p-6">
                  <ResultsDisplay content={currentResult} type="brainstorm" />
                </div>
              </div>
            )}

            {selectedVersion && !currentResult && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-stone-800">{selectedVersion.name}</h3>
                  <span className="text-sm text-stone-500">{new Date(selectedVersion.created).toLocaleDateString()}</span>
                </div>
                <div className="p-6">
                  <ResultsDisplay content={selectedVersion.result} type="brainstorm" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Version Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <VersionManager
          versions={versions}
          selectedVersion={selectedVersion}
          onVersionSelect={handleVersionSelect}
          onVersionDelete={handleVersionDelete}
          onVersionDuplicate={handleVersionDuplicate}
          onVersionRename={handleVersionRename}
          type="brainstorm"
        />

        {versions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <h3 className="text-lg font-semibold text-stone-800 mb-4">Export Options</h3>
            <button
              onClick={exportAllVersions}
              className="w-full bg-stone-600 text-white px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export All Versions as CSV
            </button>
          </div>
        )}
      </div>

      {/* Save Dialog */}
      {saveDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-stone-800 mb-4">Save Brainstorm Version</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Version Name
                </label>
                <input
                  type="text"
                  value={saveDialog.name}
                  onChange={(e) => setSaveDialog(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter version name..."
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Focus (optional)
                </label>
                <input
                  type="text"
                  value={saveDialog.focus}
                  onChange={(e) => setSaveDialog(prev => ({ ...prev, focus: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="What was the main focus?"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSaveDialog({ show: false, name: '', focus: '' })}
                className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveVersion}
                disabled={!saveDialog.name.trim()}
                className="flex-1 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                Save Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectBrainstorm;
