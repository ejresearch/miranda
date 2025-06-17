import { useState } from 'react';
import apiClient from '../../api/APIClient';

const BrainstormView = ({ project }) => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const run = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const data = await apiClient.generateBrainstorm(project, { prompt_override: prompt });
      setResult(data.result || '');
      setHistory((h) => [...h, { prompt, result: data.result || '' }]);
    } catch {
      setResult('Error generating brainstorm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        className="w-full border rounded p-2"
        rows={4}
        placeholder="Enter prompt..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button onClick={run} className="bg-purple-600 text-white px-4 py-2 rounded" disabled={loading}>
        {loading ? 'Running...' : 'Run Brainstorm'}
      </button>
      {result && (
        <div className="border p-3 rounded bg-gray-50 whitespace-pre-wrap">
          {result}
        </div>
      )}
      {history.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">History</h3>
          <ul className="space-y-2 text-sm">
            {history.map((h, i) => (
              <li key={i} className="border rounded p-2 bg-white">
                <strong>Prompt:</strong> {h.prompt}
                <br />
                <strong>Result:</strong> {h.result}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BrainstormView;
