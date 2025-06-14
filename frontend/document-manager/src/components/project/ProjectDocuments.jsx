// frontend/document-manager/src/components/project/ProjectDocuments.jsx
import { useState, useEffect } from 'react';
import { 
  Upload, 
  Folder, 
  FileText, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle,
  X 
} from 'lucide-react';

const ProjectDocuments = ({ project, buckets, onBucketsChange, onStepComplete }) => {
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get suggested buckets from project template
  const suggestedBuckets = {
    screenplay: ['screenplay_examples', 'film_theory', 'character_guides'],
    textbook: ['primary_sources', 'academic_papers', 'film_analyses'],
    custom: []
  };

  const suggestions = suggestedBuckets[project.template] || [];

  useEffect(() => {
    // Mark step as complete if we have buckets with files
    onStepComplete(buckets.length > 0);
  }, [buckets.length, onStepComplete]);

  const createBucket = async () => {
    if (!newBucketName.trim()) {
      setError('Please enter a bucket name');
      return;
    }

    try {
      const response = await fetch('/api/buckets/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: newBucketName.trim() })
      });

      if (response.ok) {
        const updatedBuckets = [...buckets, newBucketName.trim()];
        onBucketsChange(updatedBuckets);
        setNewBucketName('');
        setIsCreatingBucket(false);
        setSuccess(`Bucket "${newBucketName}" created successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Failed to create bucket');
      }
    } catch (err) {
      console.error('Failed to create bucket:', err);
      setError('Failed to create bucket');
    }
  };

  const deleteBucket = async (bucketName) => {
    if (!confirm(`Delete bucket "${bucketName}"? This will remove all documents in it.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/buckets/${bucketName}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedBuckets = buckets.filter(b => b !== bucketName);
        onBucketsChange(updatedBuckets);
        if (selectedBucket === bucketName) {
          setSelectedBucket('');
        }
        setSuccess(`Bucket "${bucketName}" deleted successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Failed to delete bucket');
      }
    } catch (err) {
      console.error('Failed to delete bucket:', err);
      setError('Failed to delete bucket');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!selectedBucket) {
      setError('Please select a bucket first');
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!selectedBucket || selectedFiles.length === 0) {
      setError('Please select a bucket and files to upload');
      return;
    }

    setUploading(true);
    setError('');
    setUploadResults([]);

    const results = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await fetch(`/api/buckets/${selectedBucket}/ingest`, {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            results.push({
              filename: file.name,
              status: 'success',
              message: 'Uploaded successfully'
            });
          } else {
            results.push({
              filename: file.name,
              status: 'error',
              message: 'Upload failed'
            });
          }
        } catch (fileErr) {
          results.push({
            filename: file.name,
            status: 'error',
            message: 'Upload failed'
          });
        }
      }

      setUploadResults(results);
      
      const successCount = results.filter(r => r.status === 'success').length;
      if (successCount > 0) {
        setSuccess(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''} to ${selectedBucket}`);
        setSelectedFiles([]);
        setTimeout(() => {
          setSuccess('');
          setUploadResults([]);
        }, 5000);
      }

      const errorCount = results.filter(r => r.status === 'error').length;
      if (errorCount > 0) {
        setError(`Failed to upload ${errorCount} file${errorCount > 1 ? 's' : ''}`);
      }

    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const createSuggestedBucket = async (bucketName) => {
    try {
      const response = await fetch('/api/buckets/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: bucketName })
      });

      if (response.ok) {
        const updatedBuckets = [...buckets, bucketName];
        onBucketsChange(updatedBuckets);
        setSelectedBucket(bucketName);
        setSuccess(`Bucket "${bucketName}" created successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to create suggested bucket:', err);
      setError('Failed to create bucket');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-8 h-8 text-emerald-600" />
          <div>
            <h2 className="text-2xl font-bold text-stone-900">Upload Documents</h2>
            <p className="text-stone-600">Add documents to LightRAG buckets for AI analysis</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-emerald-700">{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Suggested Buckets */}
        {suggestions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-stone-700 mb-3">Suggested buckets for {project.template}:</h3>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => createSuggestedBucket(suggestion)}
                  disabled={buckets.includes(suggestion)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    buckets.includes(suggestion)
                      ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
                      : 'bg-stone-100 text-stone-700 hover:bg-emerald-50 hover:text-emerald-600'
                  }`}
                >
                  {buckets.includes(suggestion) ? '✓ ' : '+ '}
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bucket Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Bucket */}
          <div>
            <h3 className="text-lg font-semibold text-stone-800 mb-3">Create New Bucket</h3>
            {!isCreatingBucket ? (
              <button
                onClick={() => setIsCreatingBucket(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Bucket
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  placeholder="Enter bucket name..."
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && createBucket()}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={createBucket}
                    disabled={!newBucketName.trim()}
                    className="flex-1 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors font-medium"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingBucket(false);
                      setNewBucketName('');
                    }}
                    className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Select Bucket */}
          <div>
            <h3 className="text-lg font-semibold text-stone-800 mb-3">Select Upload Bucket</h3>
            <select
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Choose bucket...</option>
              {buckets.map(bucket => (
                <option key={bucket} value={bucket}>{bucket}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Existing Buckets */}
      {buckets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-100">
            <h3 className="text-lg font-semibold text-stone-800">Your Buckets</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buckets.map(bucket => (
                <div
                  key={bucket}
                  className={`p-4 border rounded-lg transition-all cursor-pointer ${
                    selectedBucket === bucket
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-stone-200 hover:border-emerald-200 hover:bg-emerald-50'
                  }`}
                  onClick={() => setSelectedBucket(bucket)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Folder className="w-6 h-6 text-emerald-600" />
                      <span className="font-medium text-stone-900">{bucket}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBucket(bucket);
                      }}
                      className="p-1 text-stone-400 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* File Upload */}
      {selectedBucket && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-100">
            <h3 className="text-lg font-semibold text-stone-800">
              Upload to "{selectedBucket}"
            </h3>
          </div>
          <div className="p-6">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-stone-300 hover:border-emerald-400 hover:bg-emerald-50'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-stone-400" />
              <h3 className="text-lg font-semibold text-stone-700 mb-2">
                Drop files here or browse to select
              </h3>
              <p className="text-stone-500 mb-4">
                <label className="text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium">
                  Choose files
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                </label>
              </p>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-stone-800 mb-3">Files ready to upload:</h4>
                <div className="space-y-2 mb-4">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-stone-400" />
                        <div>
                          <p className="font-medium text-stone-700">{file.name}</p>
                          <p className="text-sm text-stone-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        disabled={uploading}
                        className="p-1 hover:bg-stone-200 rounded"
                      >
                        <X className="w-4 h-4 text-stone-500" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={uploadFiles}
                    disabled={uploading}
                    className="flex-1 bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
                  </button>
                  <button
                    onClick={() => setSelectedFiles([])}
                    disabled={uploading}
                    className="px-4 py-3 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Upload Results */}
            {uploadResults.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-stone-800 mb-3">Upload Results:</h4>
                <div className="space-y-2">
                  {uploadResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                      <span className="text-stone-700">{result.filename}</span>
                      <div className="flex items-center gap-2">
                        {result.status === 'success' ? (
                          <Check className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className={`text-sm ${
                          result.status === 'success' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {result.message}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDocuments;
