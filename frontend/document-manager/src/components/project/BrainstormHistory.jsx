import { useEffect, useState } from 'react';
import apiClient from '../../api/APIClient';

const BrainstormHistory = ({ project }) => {
  const [versions, setVersions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      const data = await apiClient.listVersions(project, 'brainstorm');
      setVersions(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load versions');
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-medium">Brainstorm Versions</h3>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <ul className="space-y-1 text-sm">
        {versions.map((v) => (
          <li key={v.id || v.name} className="border rounded p-2 bg-white">
            <strong>{v.name}</strong>
            <div className="mt-1 whitespace-pre-wrap">{v.result}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BrainstormHistory;
