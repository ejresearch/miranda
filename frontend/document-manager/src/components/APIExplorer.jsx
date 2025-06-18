import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

const APIExplorer = () => {
  const [spec, setSpec] = useState(null);
  const [selected, setSelected] = useState(null);
  const [payload, setPayload] = useState('{}');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const res = await fetch(`${apiClient.baseURL}/openapi.json`);
        const data = await res.json();
        setSpec(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchSpec();
  }, []);

  const operations = React.useMemo(() => {
    if (!spec) return [];
    const ops = [];
    for (const path in spec.paths) {
      for (const method in spec.paths[path]) {
        ops.push({ path, method: method.toUpperCase(), op: spec.paths[path][method] });
      }
    }
    return ops;
  }, [spec]);

  const invoke = async () => {
    if (!selected) return;
    setError(null);
    setResponse(null);

    const options = { method: selected.method };
    let bodyObj = null;
    if (selected.method !== 'GET' && payload) {
      try {
        bodyObj = JSON.parse(payload);
        options.body = JSON.stringify(bodyObj);
        options.headers = { 'Content-Type': 'application/json' };
      } catch (err) {
        setError('Invalid JSON payload');
        return;
      }
    }

    try {
      const res = await fetch(`${apiClient.baseURL}${selected.path}`, options);
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-1/3">
        <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
        <ul className="space-y-2 max-h-[70vh] overflow-y-auto">
          {operations.map((op, idx) => (
            <li key={idx}>
              <button
                onClick={() => { setSelected(op); setPayload('{}'); setResponse(null); setError(null); }}
                className={`w-full text-left px-3 py-2 rounded-md border ${selected === op ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              >
                <span className="font-mono text-xs mr-2">{op.method}</span>
                <span className="font-mono text-sm">{op.path}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="md:flex-1">
        {selected ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{selected.method} {selected.path}</h2>
            {selected.method !== 'GET' && (
              <textarea
                className="w-full border rounded p-2 font-mono text-sm"
                rows={8}
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
              />
            )}
            <button
              onClick={invoke}
              className="px-4 py-2 bg-green-600 text-white rounded-md"
            >Send</button>
            {error && <pre className="text-red-600 whitespace-pre-wrap">{error}</pre>}
            {response && (
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto whitespace-pre-wrap">
{JSON.stringify(response, null, 2)}
</pre>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Select an endpoint to begin.</p>
        )}
      </div>
    </div>
  );
};

export default APIExplorer;
