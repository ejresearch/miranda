// frontend/document-manager/src/components/shared/PromptBuilder.jsx
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Settings, Lightbulb, Database, FileText } from 'lucide-react';
import DataSelector from './DataSelector';

const promptTemplates = {
  screenplay: {
    brainstorm: "You are an expert screenplay consultant specializing in romantic comedies. You have access to successful screenplay examples and film theory. Your role is to provide creative insights and suggestions based on industry best practices.",
    write: "You are a professional screenwriter. Using the research and brainstorming insights, create structured screenplay content in industry standard format. Focus on compelling dialogue and visual storytelling."
  },
  textbook: {
    brainstorm: "You are an academic film historian with expertise in cinema studies. You have access to primary sources and scholarly research. Provide analytical insights grounded in historical context and academic rigor.",
    write: "You are an academic writer creating educational content. Using the research and analysis, write clear, informative text suitable for film history students. Include proper citations and maintain scholarly tone."
  },
  custom: {
    brainstorm: "You are a knowledgeable analyst with access to relevant documents and data. Provide thoughtful insights based on the available information.",
    write: "You are a skilled writer. Using the research and brainstorming insights, create well-structured content that addresses the user's needs."
  }
};

const PromptBuilder = ({ 
  project, 
  mode = 'brainstorm', // 'brainstorm' or 'write'
  buckets = [], 
  tables = [], 
  brainstormVersions = [],
  onPromptChange,
  onDataSelectionChange,
  initialData = {}
}) => {
  const [showBasePrompt, setShowBasePrompt] = useState(false);
  const [customizations, setCustomizations] = useState({
    focus: initialData.focus || '',
    tone: initialData.tone || 'professional',
    additionalContext: initialData.additionalContext || '',
    expertise: initialData.expertise || 'general'
  });
  const [selectedData, setSelectedData] = useState({
    buckets: initialData.selectedBuckets || [],
    tables: initialData.selectedTables || [],
    brainstormVersions: initialData.selectedBrainstormVersions || []
  });
  const [constructedPrompt, setConstructedPrompt] = useState('');

  const basePrompt = promptTemplates[project.template]?.[mode] || promptTemplates.custom[mode];

  // Reconstruct prompt when inputs change
  useEffect(() => {
    constructPrompt();
  }, [customizations, selectedData, basePrompt]);

  const constructPrompt = () => {
    let prompt = basePrompt;

    // Add focus area
    if (customizations.focus.trim()) {
      prompt += `\n\nFocus specifically on: ${customizations.focus.trim()}`;
    }

    // Add tone guidance
    const toneGuidance = {
      professional: "Maintain a professional, expert tone.",
      casual: "Use a conversational, approachable tone.",
      academic: "Write in formal academic style with proper citations.",
      creative: "Be creative and inspiring in your approach."
    };
    
    if (toneGuidance[customizations.tone]) {
      prompt += `\n\n${toneGuidance[customizations.tone]}`;
    }

    // Add expertise level
    const expertiseGuidance = {
      beginner: "Explain concepts clearly for beginners.",
      intermediate: "Assume moderate familiarity with the subject.",
      expert: "Use advanced terminology and concepts.",
      general: "Adapt explanation level to the context."
    };

    if (expertiseGuidance[customizations.expertise]) {
      prompt += `\n\n${expertiseGuidance[customizations.expertise]}`;
    }

    // Add additional context
    if (customizations.additionalContext.trim()) {
      prompt += `\n\nAdditional context: ${customizations.additionalContext.trim()}`;
    }

    // Add data source context
    const dataSources = [];
    
    if (selectedData.buckets.length > 0) {
      dataSources.push(`Document collections: ${selectedData.buckets.join(', ')}`);
    }
    
    if (selectedData.tables.length > 0) {
      dataSources.push(`Data tables: ${selectedData.tables.join(', ')}`);
    }
    
    if (selectedData.brainstormVersions.length > 0) {
      dataSources.push(`Previous brainstorm insights: ${selectedData.brainstormVersions.join(', ')}`);
    }

    if (dataSources.length > 0) {
      prompt += `\n\nYou have access to the following sources:\n${dataSources.map(source => `- ${source}`).join('\n')}`;
    }

    setConstructedPrompt(prompt);
    
    // Notify parent components
    if (onPromptChange) {
      onPromptChange(prompt, customizations);
    }
    
    if (onDataSelectionChange) {
      onDataSelectionChange(selectedData);
    }
  };

  const handleCustomizationChange = (field, value) => {
    setCustomizations(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDataSelectionChange = (newSelection) => {
    setSelectedData(newSelection);
  };

  return (
    <div className="space-y-6">
      {/* Base Prompt Display */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-emerald-600" />
              AI Expert Persona
            </h3>
            <button
              onClick={() => setShowBasePrompt(!showBasePrompt)}
              className="flex items-center gap-2 px-3 py-1 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors text-sm"
            >
              {showBasePrompt ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showBasePrompt ? 'Hide' : 'Show'} Base Prompt
            </button>
          </div>
        </div>
        
        {showBasePrompt && (
          <div className="p-4 bg-stone-50 border-b border-stone-100">
            <p className="text-stone-700 text-sm font-mono leading-relaxed whitespace-pre-wrap">
              {basePrompt}
            </p>
          </div>
        )}

        {/* Customization Controls */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Focus Area
              </label>
              <input
                type="text"
                value={customizations.focus}
                onChange={(e) => handleCustomizationChange('focus', e.target.value)}
                placeholder="What should the AI focus on?"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Tone
              </label>
              <select
                value={customizations.tone}
                onChange={(e) => handleCustomizationChange('tone', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="academic">Academic</option>
                <option value="creative">Creative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Expertise Level
              </label>
              <select
                value={customizations.expertise}
                onChange={(e) => handleCustomizationChange('expertise', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="general">General</option>
                <option value="beginner">Beginner-friendly</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert level</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Additional Context
            </label>
            <textarea
              value={customizations.additionalContext}
              onChange={(e) => handleCustomizationChange('additionalContext', e.target.value)}
              placeholder="Any additional instructions or context..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Data Source Selection */}
      <DataSelector
        buckets={buckets}
        tables={tables}
        brainstormVersions={mode === 'write' ? brainstormVersions : []}
        selectedData={selectedData}
        onSelectionChange={handleDataSelectionChange}
        mode={mode}
      />

      {/* Final Prompt Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            Final Prompt Preview
          </h3>
        </div>
        <div className="p-4">
          <div className="bg-stone-50 rounded-lg p-4 border border-stone-200 max-h-64 overflow-y-auto">
            <pre className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap font-mono">
              {constructedPrompt}
            </pre>
          </div>
          <div className="mt-3 text-xs text-stone-500">
            Character count: {constructedPrompt.length} | Selected sources: {selectedData.buckets.length + selectedData.tables.length + selectedData.brainstormVersions.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptBuilder;
