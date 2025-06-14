// frontend/document-manager/src/components/project/ProjectExport.jsx
import { useState } from 'react';
import { 
  Download, 
  FileText, 
  Table as TableIcon, 
  Brain, 
  PenTool, 
  Check, 
  Loader2,
  Archive,
  File
} from 'lucide-react';

const ProjectExport = ({ 
  project, 
  brainstormVersions, 
  writeVersions, 
  onStepComplete 
}) => {
  const [exportOptions, setExportOptions] = useState({
    includeBrainstorm: true,
    includeWrite: true,
    format: 'pdf', // 'pdf', 'csv', 'json'
    versionSelection: 'all' // 'all', 'latest', 'selected'
  });
  const [selectedVersions, setSelectedVersions] = useState({
    brainstorm: [],
    write: []
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess('');

    try {
      if (exportOptions.format === 'pdf') {
        await exportPDF();
      } else if (exportOptions.format === 'csv') {
        await exportCSV();
      } else if (exportOptions.format === 'json') {
        await exportJSON();
      }
      
      setExportSuccess('Export completed successfully!');
      onStepComplete(true);
      
      setTimeout(() => setExportSuccess(''), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = async () => {
    // In a real implementation, this would call a backend endpoint
    // For now, we'll create a simple HTML document and trigger print
    const content = generatePDFContent();
    
    // Create a new window with the content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${project.name} - Complete Report</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
            h1 { color: #2d3748; border-bottom: 2px solid #4ade80; padding-bottom: 10px; }
            h2 { color: #4a5568; margin-top: 30px; }
            h3 { color: #2d7d32; margin-top: 20px; }
            .version { margin: 20px 0; padding: 15px; border-left: 4px solid #4ade80; background: #f7fafc; }
            .metadata { font-size: 0.9em; color: #718096; margin-bottom: 10px; }
            .content { white-space: pre-wrap; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const exportCSV = async () => {
    const csvData = generateCSVContent();
    const blob = new Blob([csvData], { type: 'text/csv' });
    downloadFile(blob, `${project.name}_complete_data.csv`);
  };

  const exportJSON = async () => {
    const jsonData = generateJSONContent();
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    downloadFile(blob, `${project.name}_complete_data.json`);
  };

  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generatePDFContent = () => {
    let content = `
      <h1>${project.name}</h1>
      <p><strong>Project Type:</strong> ${project.template}</p>
      <p><strong>Created:</strong> ${new Date(project.created || Date.now()).toLocaleDateString()}</p>
      <p><strong>Export Date:</strong> ${new Date().toLocaleDateString()}</p>
    `;

    if (exportOptions.includeBrainstorm && brainstormVersions.length > 0) {
      content += `<h2>Brainstorm Results</h2>`;
      const versionsToInclude = getVersionsToInclude(brainstormVersions, 'brainstorm');
      
      versionsToInclude.forEach(version => {
        content += `
          <div class="version">
            <h3>${version.name}</h3>
            <div class="metadata">
              Created: ${new Date(version.created).toLocaleDateString()} | 
              Focus: ${version.focus || 'General'} |
              Sources: ${version.metadata?.dataSourcesCount || 0}
            </div>
            <div class="content">${version.result}</div>
          </div>
        `;
      });
    }

    if (exportOptions.includeWrite && writeVersions.length > 0) {
      content += `<h2>Written Content</h2>`;
      const versionsToInclude = getVersionsToInclude(writeVersions, 'write');
      
      versionsToInclude.forEach(version => {
        content += `
          <div class="version">
            <h3>${version.name}</h3>
            <div class="metadata">
              Created: ${new Date(version.created).toLocaleDateString()} | 
              Focus: ${version.focus || 'General'} |
              Sources: ${version.metadata?.dataSourcesCount || 0}
            </div>
            <div class="content">${version.result}</div>
          </div>
        `;
      });
    }

    return content;
  };

  const generateCSVContent = () => {
    const headers = ['Type', 'Name', 'Focus', 'Created', 'Content', 'Sources'];
    const rows = [];

    if (exportOptions.includeBrainstorm) {
      const versionsToInclude = getVersionsToInclude(brainstormVersions, 'brainstorm');
      versionsToInclude.forEach(version => {
        rows.push([
          'Brainstorm',
          version.name,
          version.focus || '',
          version.created,
          version.result?.replace(/"/g, '""') || '',
          version.metadata?.dataSourcesCount || 0
        ]);
      });
    }

    if (exportOptions.includeWrite) {
      const versionsToInclude = getVersionsToInclude(writeVersions, 'write');
      versionsToInclude.forEach(version => {
        rows.push([
          'Write',
          version.name,
          version.focus || '',
          version.created,
          version.result?.replace(/"/g, '""') || '',
          version.metadata?.dataSourcesCount || 0
        ]);
      });
    }

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  };

  const generateJSONContent = () => {
    const data = {
      project: {
        name: project.name,
        template: project.template,
        created: project.created || new Date().toISOString(),
        exported: new Date().toISOString()
      },
      brainstormVersions: exportOptions.includeBrainstorm ? getVersionsToInclude(brainstormVersions, 'brainstorm') : [],
      writeVersions: exportOptions.includeWrite ? getVersionsToInclude(writeVersions, 'write') : []
    };

    return data;
  };

  const getVersionsToInclude = (versions, type) => {
    if (exportOptions.versionSelection === 'all') {
      return versions;
    } else if (exportOptions.versionSelection === 'latest') {
      return versions.slice(-1);
    } else if (exportOptions.versionSelection === 'selected') {
      const selected = selectedVersions[type] || [];
      return versions.filter(v => selected.includes(v.id));
    }
    return versions;
  };

  const toggleVersionSelection = (type, versionId) => {
    setSelectedVersions(prev => ({
      ...prev,
      [type]: prev[type].includes(versionId)
        ? prev[type].filter(id => id !== versionId)
        : [...prev[type], versionId]
    }));
  };

  const getTotalVersions = () => {
    let total = 0;
    if (exportOptions.includeBrainstorm) total += getVersionsToInclude(brainstormVersions, 'brainstorm').length;
    if (exportOptions.includeWrite) total += getVersionsToInclude(writeVersions, 'write').length;
    return total;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Download className="w-8 h-8 text-orange-600" />
          <div>
            <h2 className="text-2xl font-bold text-stone-900">Export Project</h2>
            <p className="text-stone-600">Download your complete project as PDF, CSV, or JSON</p>
          </div>
        </div>

        {/* Success Message */}
        {exportSuccess && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-700">{exportSuccess}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Export Options */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-stone-800 mb-4">Content to Include</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeBrainstorm}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeBrainstorm: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500"
                  />
                  <Brain className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="font-medium text-stone-900">Brainstorm Results</span>
                    <div className="text-sm text-stone-500">{brainstormVersions.length} versions</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeWrite}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeWrite: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 border-stone-300 rounded focus:ring-purple-500"
                  />
                  <PenTool className="w-5 h-5 text-purple-600" />
                  <div>
                    <span className="font-medium text-stone-900">Written Content</span>
                    <div className="text-sm text-stone-500">{writeVersions.length} versions</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-stone-800 mb-4">Export Format</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'pdf', label: 'PDF', icon: FileText, description: 'Complete report' },
                  { id: 'csv', label: 'CSV', icon: TableIcon, description: 'Data table' },
                  { id: 'json', label: 'JSON', icon: Archive, description: 'Raw data' }
                ].map(format => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={format.id}
                      onClick={() => setExportOptions(prev => ({ ...prev, format: format.id }))}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        exportOptions.format === format.id
                          ? 'border-orange-200 bg-orange-50 text-orange-700'
                          : 'border-stone-200 hover:border-orange-200 hover:bg-orange-50'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <div className="font-medium">{format.label}</div>
                      <div className="text-xs text-stone-500">{format.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-stone-800 mb-4">Version Selection</h3>
              <div className="space-y-2">
                {[
                  { id: 'all', label: 'All Versions', description: 'Include every version' },
                  { id: 'latest', label: 'Latest Only', description: 'Most recent version of each type' },
                  { id: 'selected', label: 'Selected Versions', description: 'Choose specific versions' }
                ].map(option => (
                  <label key={option.id} className="flex items-start gap-3 p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer">
                    <input
                      type="radio"
                      name="versionSelection"
                      value={option.id}
                      checked={exportOptions.versionSelection === option.id}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, versionSelection: e.target.value }))}
                      className="w-4 h-4 text-orange-600 border-stone-300 focus:ring-orange-500 mt-0.5"
                    />
                    <div>
                      <div className="font-medium text-stone-900">{option.label}</div>
                      <div className="text-sm text-stone-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Preview & Export */}
          <div className="space-y-6">
            <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
              <h4 className="font-medium text-stone-800 mb-3">Export Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">Project:</span>
                  <span className="font-medium text-stone-900">{project.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Format:</span>
                  <span className="font-medium text-stone-900 uppercase">{exportOptions.format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Total Versions:</span>
                  <span className="font-medium text-stone-900">{getTotalVersions()}</span>
                </div>
                {exportOptions.includeBrainstorm && (
                  <div className="flex justify-between">
                    <span className="text-stone-600">Brainstorm:</span>
                    <span className="font-medium text-emerald-600">
                      {getVersionsToInclude(brainstormVersions, 'brainstorm').length}
                    </span>
                  </div>
                )}
                {exportOptions.includeWrite && (
                  <div className="flex justify-between">
                    <span className="text-stone-600">Write:</span>
                    <span className="font-medium text-purple-600">
                      {getVersionsToInclude(writeVersions, 'write').length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting || (!exportOptions.includeBrainstorm && !exportOptions.includeWrite)}
              className="w-full bg-orange-500 text-white px-6 py-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export Project
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Version Selection Details */}
      {exportOptions.versionSelection === 'selected' && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-100">
            <h3 className="text-lg font-semibold text-stone-800">Select Specific Versions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Brainstorm Versions */}
              {exportOptions.includeBrainstorm && brainstormVersions.length > 0 && (
                <div>
                  <h4 className="font-medium text-stone-800 mb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-emerald-600" />
                    Brainstorm Versions
                  </h4>
                  <div className="space-y-2">
                    {brainstormVersions.map(version => (
                      <label key={version.id} className="flex items-start gap-3 p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedVersions.brainstorm.includes(version.id)}
                          onChange={() => toggleVersionSelection('brainstorm', version.id)}
                          className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500 mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-stone-900 truncate">{version.name}</div>
                          <div className="text-sm text-stone-500">
                            {new Date(version.created).toLocaleDateString()}
                            {version.focus && ` • ${version.focus}`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Write Versions */}
              {exportOptions.includeWrite && writeVersions.length > 0 && (
                <div>
                  <h4 className="font-medium text-stone-800 mb-3 flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-purple-600" />
                    Write Versions
                  </h4>
                  <div className="space-y-2">
                    {writeVersions.map(version => (
                      <label key={version.id} className="flex items-start gap-3 p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedVersions.write.includes(version.id)}
                          onChange={() => toggleVersionSelection('write', version.id)}
                          className="w-4 h-4 text-purple-600 border-stone-300 rounded focus:ring-purple-500 mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-stone-900 truncate">{version.name}</div>
                          <div className="text-sm text-stone-500">
                            {new Date(version.created).toLocaleDateString()}
                            {version.focus && ` • ${version.focus}`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectExport;
