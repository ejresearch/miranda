import { useState, useEffect } from 'react';
import apiClient from '../../api/APIClient';

const BucketManager = ({ project }) => {
  const [buckets, setBuckets] = useState([]);
  const [newBucket, setNewBucket] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBuckets();
  }, []);

  const loadBuckets = async () => {
    try {
      const data = await apiClient.listBuckets();
      setBuckets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load buckets');
    }
  };

  const createBucket = async () => {
    if (!newBucket.trim()) return;
    try {
      await apiClient.createProjectBucket(project, newBucket.trim());
      setNewBucket('');
      loadBuckets();
    } catch (err) {
      setError('Failed to create bucket');
    }
  };

  const loadFiles = async (bucket) => {
    try {
      const data = await apiClient.listBucketFiles(project, bucket);
      setFiles(Array.isArray(data) ? data : []);
      setSelectedBucket(bucket);
    } catch {
      setError('Failed to load files');
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedBucket) return;
    setUploading(true);
    try {
      await apiClient.uploadDocument(project, selectedBucket, file);
      loadFiles(selectedBucket);
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder="New bucket name"
          value={newBucket}
          onChange={(e) => setNewBucket(e.target.value)}
        />
        <button onClick={createBucket} className="bg-blue-600 text-white px-3 py-1 rounded">
          Create
        </button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
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
        <div className="flex-1 space-y-2">
          {selectedBucket && (
            <div>
              <h3 className="font-medium mb-2">Files in {selectedBucket}</h3>
              <input type="file" onChange={handleUpload} disabled={uploading} />
              <ul className="mt-2 space-y-1">
                {files.map((f) => (
                  <li key={f} className="text-sm border-b pb-1">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BucketManager;
