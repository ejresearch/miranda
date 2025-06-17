import { useEffect, useState } from 'react';
import apiClient from '../../api/APIClient';

const ReferenceDocuments = ({ project }) => {
  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState('');
  const [files, setFiles] = useState([]);

  useEffect(() => {
    loadBuckets();
  }, []);

  const loadBuckets = async () => {
    try {
      const data = await apiClient.listBuckets();
      setBuckets(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  };

  const loadFiles = async (bucket) => {
    setSelectedBucket(bucket);
    try {
      const data = await apiClient.listBucketFiles(project, bucket);
      setFiles(Array.isArray(data) ? data : []);
    } catch {
      setFiles([]);
    }
  };

  return (
    <div className="flex gap-4">
      <div className="w-1/3 space-y-2">
        {buckets.map((b) => (
          <button
            key={b}
            onClick={() => loadFiles(b)}
            className={`block w-full text-left px-3 py-2 border rounded ${selectedBucket === b ? 'bg-blue-50' : ''}`}
          >
            {b}
          </button>
        ))}
      </div>
      <div className="flex-1">
        <h3 className="font-medium mb-2">{selectedBucket || 'Select a bucket'}</h3>
        <ul className="space-y-1">
          {files.map((f) => (
            <li key={f} className="text-sm border-b pb-1">
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReferenceDocuments;
