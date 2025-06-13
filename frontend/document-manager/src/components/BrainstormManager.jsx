import { useState, useEffect } from 'react';
import { Brain, Table, Lightbulb, Check, AlertCircle, Loader2, Database } from 'lucide-react';

const BrainstormManager = () => {
  const [projects, setProjects] = useState(['project1', 'project2']);
  const [selectedProject, setSelectedProject] = useState('');
  const [tables, setTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [tableData, setTableData] = useState({});
  const [selectedRows, setSelectedRows] = useState({});
  const [promptOverride, setPromptOverride] = useState('');
  const [userNote, setUserNote] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedProject) {
      loadTables(selectedProject);
    }
  }, [selectedProject]);

  useEffect(() => {
    selectedTables.forEach(tableName => {
      if (!tableData[tableName]) {
        loadTableData(tableName);
      }
    });
  }, [selectedTables]);

  const loadTables = async (project) => {
    try {
      const response = await fetch(`/api/tables/list?project=${project}`);
      const data = await response.json();
      setTables(data.tables || []);
      setSelectedTables([]);
      setTableData({});
      setSelectedRows({});
    } catch (err) {
      console.error('Failed to load tables:', err);
      setError('Failed to load tables');
    }
  };

  const loadTableData = async (tableName) => {
    try {
      const response = await fetch(`/api/tables/${tableName}?project=${selectedProject}`);
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
      
      if (!newSelection.includes(tableName)) {
        setSelectedRows(prev => {
          const newRows = { ...prev };
          delete newRows[tableName];
          return newRows;
        });
      }
      
      return newSelection;
    });
  };

  const toggleRowSelection = (tableName, rowIndex) => {
    setSelectedRows(prev => ({
      ...prev,
      [tableName]: prev[tableName]?.includes(rowIndex)
        ? prev[tableName].filter(idx => idx !== rowIndex)
        : [...(prev[tableName] || []), rowIndex]
    }));
  };

  const runBrainstorm = async () => {
    if (!selectedProject || selectedTables.length === 0 || !userNote.trim()) {
      setError('Please select a project, at least one table, and provide a user note');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch('/api/brainstorm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: selectedProject,
          table_names: selectedTables,
          selected_rows: selectedRows,
          prompt_override: promptOverride,
          user_note: userNote
        })
      });

      if (!response.ok) {
        throw new Error('Brainstorm request failed');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      console.error('Brainstorm failed:', err);
      setError('Failed to generate brainstorm results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedRowCount = () => {
    return Object.values(selectedRows).reduce((total, rows) => total + rows.length, 0);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white shadow-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-stone-900">Brainstorm Manager</h1>
          <p className="text-stone-600 mt-2">Generate creative ideas from your structured data</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-4 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="p-6 border-b border-stone-100">
                <h2 className="text-lg font-semibold text-stone-800 mb-4">Project Selection</h2>
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
              </div>
            </div>

            {selectedProject && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="p-6 border-b border-stone-100">
                  <h2 className="text-lg font-semibold text-stone-800 mb-4">Data Tables</h2>
                  <p className="text-stone-600 text-sm mb-4">{selectedTables.length} tables selected</p>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {tables.length === 0 ? (
                    <div className="p-8 text-center text-stone-500">
                      <Table className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">No tables found</p>
                      <p className="text-sm mt-1">This project has no data tables</p>
                    </div>
                  ) : (
                    <div className="p-3">
                      {tables.map(table => (
                        <label
                          key={table}
                          className="group flex items-center gap-3 p-4 mb-2 hover:bg-stone-50 rounded-lg cursor-pointer transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTables.includes(table)}
                            onChange={() => toggleTableSelection(table)}
                            className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500"
                          />
                          <Database className="w-5 h-5 text-stone-400" />
                          <div className="flex-1">
                            <span className="font-medium text-stone-700">{table}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="p-6 border-b border-stone-100">
                <h2 className="text-lg font-semibold text-stone-800 mb-4">Your Input</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    What do you want to brainstorm?
                  </label>
                  <textarea
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="Describe what you're trying to achieve..."
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>

                <button
                  onClick={runBrainstorm}
                  disabled={isLoading || !selectedProject || selectedTables.length === 0 || !userNote.trim()}
                  className="w-full bg-emerald-500 text-white px-6 py-4 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
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

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="p-6 border-b border-stone-100">
                <h2 className="text-xl font-semibold text-stone-800">Brainstorm Results</h2>
              </div>
              
              <div className="p-6">
                {result ? (
                  <div className="bg-stone-50 rounded-xl border border-stone-200 p-6">
                    <div className="flex items-start gap-4">
                      <Lightbulb className="w-6 h-6 text-emerald-600 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-stone-800 mb-3">Generated Ideas</h3>
                        <div className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                          {result}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-stone-500">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">Ready to generate ideas!</p>
                    <p className="mt-1">Select project, tables and add your input to begin</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrainstormManager;
