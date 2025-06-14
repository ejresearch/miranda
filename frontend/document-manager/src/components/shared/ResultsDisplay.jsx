// frontend/document-manager/src/components/shared/ResultsDisplay.jsx
import { useState } from 'react';
import { Copy, Download, Maximize2, Type, Eye } from 'lucide-react';

const ResultsDisplay = ({ content, type = 'brainstorm', title = null }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted' or 'raw'
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const downloadAsText = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_result_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatContent = (text) => {
    if (viewMode === 'raw') return text;

    // Basic formatting for better readability
    return text
      .split('\n')
      .map((line, index) => {
        // Headers (lines that end with : and are short)
        if (line.trim().endsWith(':') && line.trim().length < 100) {
          return (
            <div key={index} className="font-semibold text-stone-800 mt-4 mb-2 first:mt-0">
              {line.trim()}
            </div>
          );
        }
        
        // Bullet points
        if (line.trim().match(/^[-•*]\s/)) {
          return (
            <div key={index} className="ml-4 mb-1 flex">
              <span className="text-emerald-600 mr-2">•</span>
              <span>{line.trim().substring(2)}</span>
            </div>
          );
        }
        
        // Numbered lists
        if (line.trim().match(/^\d+\.\s/)) {
          return (
            <div key={index} className="ml-4 mb-1">
              {line.trim()}
            </div>
          );
        }
        
        // Empty lines
        if (line.trim() === '') {
          return <div key={index} className="h-3"></div>;
        }
        
        // Regular paragraphs
        return (
          <div key={index} className="mb-3 leading-relaxed">
            {line.trim()}
          </div>
        );
      });
  };

  const getWordCount = () => {
    return content.trim().split(/\s+/).length;
  };

  const getCharCount = () => {
    return content.length;
  };

  const getReadingTime = () => {
    const wordsPerMinute = 200;
    const words = getWordCount();
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
  };

  if (!content) {
    return (
      <div className="text-center py-8 text-stone-500">
        <Type className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>No content to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-stone-500">
          <span>{getWordCount()} words</span>
          <span>{getCharCount()} characters</span>
          <span>~{getReadingTime()} min read</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'formatted' ? 'raw' : 'formatted')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'formatted' 
                ? 'bg-emerald-100 text-emerald-600' 
                : 'text-stone-500 hover:bg-stone-100'
            }`}
            title="Toggle formatting"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          <button
            onClick={copyToClipboard}
            className={`p-2 rounded-lg transition-colors ${
              copied 
                ? 'bg-emerald-100 text-emerald-600' 
                : 'text-stone-500 hover:bg-stone-100'
            }`}
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button
            onClick={downloadAsText}
            className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
            title="Download as text file"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
            title="Expand view"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content display */}
      <div className={`bg-stone-50 rounded-lg border border-stone-200 ${
        isExpanded ? 'fixed inset-4 z-50 bg-white shadow-xl' : ''
      }`}>
        {isExpanded && (
          <div className="flex items-center justify-between p-4 border-b border-stone-200">
            <h3 className="text-lg font-semibold text-stone-800">
              {title || `${type.charAt(0).toUpperCase() + type.slice(1)} Result`}
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-stone-500 hover:text-stone-700 text-xl"
            >
              ×
            </button>
          </div>
        )}
        
        <div className={`p-6 ${
          isExpanded 
            ? 'h-full overflow-y-auto' 
            : 'max-h-96 overflow-y-auto'
        }`}>
          {viewMode === 'raw' ? (
            <pre className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap font-mono">
              {content}
            </pre>
          ) : (
            <div className="text-stone-700 text-sm leading-relaxed">
              {formatContent(content)}
            </div>
          )}
        </div>
      </div>

      {/* Copy feedback */}
      {copied && (
        <div className="text-center text-emerald-600 text-sm">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
