// frontend/document-manager/src/components/templates/TemplateSelector.jsx
import { useState } from 'react';
import { Film, BookOpen, Settings, ArrowLeft, Check } from 'lucide-react';

const templates = [
  {
    id: 'screenplay',
    name: 'Screenplay Writing',
    description: 'Create romantic comedy screenplays with structured character development and scene planning',
    icon: Film,
    color: 'emerald',
    buckets: ['screenplay_examples', 'film_theory', 'character_guides'],
    tables: ['character_types', 'scene_beats', 'story_structure'],
    workflow: ['documents', 'data', 'brainstorm', 'write', 'export']
  },
  {
    id: 'textbook',
    name: 'Film History Textbook',
    description: 'Research and write comprehensive film history content with academic rigor',
    icon: BookOpen,
    color: 'blue',
    buckets: ['primary_sources', 'academic_papers', 'film_analyses'],
    tables: ['timeline_data', 'filmmaker_info', 'film_catalog'],
    workflow: ['documents', 'data', 'brainstorm', 'write', 'export']
  },
  {
    id: 'custom',
    name: 'Custom Project',
    description: 'Start with a blank project and build your own workflow',
    icon: Settings,
    color: 'stone',
    buckets: [],
    tables: [],
    workflow: ['documents', 'data', 'brainstorm', 'write', 'export']
  }
];

const TemplateSelector = ({ onSelectTemplate, onCancel }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [step, setStep] = useState('select'); // 'select' or 'configure'

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setProjectName(`New ${template.name} Project`);
    setStep('configure');
  };

  const handleCreateProject = () => {
    if (selectedTemplate && projectName.trim()) {
      onSelectTemplate({
        ...selectedTemplate,
        name: projectName.trim()
      });
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      emerald: 'border-emerald-200 bg-emerald-50 hover:border-emerald-300',
      blue: 'border-blue-200 bg-blue-50 hover:border-blue-300',
      stone: 'border-stone-200 bg-stone-50 hover:border-stone-300'
    };
    return colors[color] || colors.stone;
  };

  const getIconColor = (color) => {
    const colors = {
      emerald: 'text-emerald-600',
      blue: 'text-blue-600',
      stone: 'text-stone-600'
    };
    return colors[color] || colors.stone;
  };

  if (step === 'configure') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-8 max-w-2xl w-full mx-4">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => setStep('select')}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${getColorClasses(selectedTemplate.color).split(' ')[1]} flex items-center justify-center`}>
                <selectedTemplate.icon className={`w-6 h-6 ${getIconColor(selectedTemplate.color)}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-stone-900">Configure Project</h2>
                <p className="text-stone-600">{selectedTemplate.name}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter project name..."
                autoFocus
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-stone-800 mb-3">This template includes:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-stone-50 rounded-lg p-4">
                  <h4 className="font-medium text-stone-700 mb-2">Suggested Document Buckets</h4>
                  <ul className="text-sm text-stone-600 space-y-1">
                    {selectedTemplate.buckets.map(bucket => (
                      <li key={bucket} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        {bucket}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-stone-50 rounded-lg p-4">
                  <h4 className="font-medium text-stone-700 mb-2">Suggested Data Tables</h4>
                  <ul className="text-sm text-stone-600 space-y-1">
                    {selectedTemplate.tables.map(table => (
                      <li key={table} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        {table}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <h4 className="font-medium text-emerald-800 mb-2">Guided Workflow</h4>
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                {selectedTemplate.workflow.map((phase, index) => (
                  <div key={phase} className="flex items-center gap-2">
                    <span className="capitalize font-medium">{phase}</span>
                    {index < selectedTemplate.workflow.length - 1 && (
                      <span className="text-emerald-500">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={onCancel}
                className="flex-1 px-6 py-3 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!projectName.trim()}
                className="flex-1 bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Create Project
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white shadow-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-stone-900">Choose Project Template</h1>
              <p className="text-stone-600 mt-2">Select a template to get started with guided workflows</p>
            </div>
            <button 
              onClick={onCancel}
              className="px-6 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <div 
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all hover:shadow-md ${getColorClasses(template.color)}`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl ${getColorClasses(template.color).split(' ')[1]} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${getIconColor(template.color)}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-stone-900 mb-2">
                      {template.name}
                    </h3>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">Document buckets:</span>
                    <span className="font-medium text-stone-700">{template.buckets.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">Data tables:</span>
                    <span className="font-medium text-stone-700">{template.tables.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">Workflow steps:</span>
                    <span className="font-medium text-stone-700">{template.workflow.length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
