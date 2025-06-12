import { useState, useEffect, useCallback } from 'react';
import { Upload, Plus, Trash2, Search, FileText, Folder, Check, AlertCircle, X } from 'lucide-react';

const DocumentManager = () => {
 const [buckets, setBuckets] = useState([]);
 const [selectedBucket, setSelectedBucket] = useState(null);
 const [files, setFiles] = useState([]);
 const [isCreatingBucket, setIsCreatingBucket] = useState(false);
 const [newBucketName, setNewBucketName] = useState('');
 const [isDragging, setIsDragging] = useState(false);
 const [uploading, setUploading] = useState(false);
 const [selectedFiles, setSelectedFiles] = useState([]);
 const [uploadProgress, setUploadProgress] = useState({});
 const [query, setQuery] = useState('');
 const [queryResult, setQueryResult] = useState(null);
 const [querying, setQuerying] = useState(false);

 useEffect(() => {
   loadBuckets();
 }, []);

 const loadBuckets = async () => {
   try {
     const response = await fetch('/api/buckets');
     const data = await response.json();
     setBuckets(Array.isArray(data) ? data : []);
   } catch (err) {
     console.error('Failed to load buckets:', err);
   }
 };

 const createBucket = async () => {
   if (!newBucketName.trim()) return;
   
   try {
     const response = await fetch('/api/buckets/new', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ bucket: newBucketName })
     });
     
     if (response.ok) {
       setNewBucketName('');
       setIsCreatingBucket(false);
       loadBuckets();
     }
   } catch (err) {
     console.error('Failed to create bucket:', err);
   }
 };

 const deleteBucket = async (bucketName) => {
   if (!confirm(`Delete bucket "${bucketName}"? This cannot be undone.`)) return;
   
   try {
     const response = await fetch(`/api/buckets/${bucketName}`, {
       method: 'DELETE'
     });
     
     if (response.ok) {
       if (selectedBucket === bucketName) {
         setSelectedBucket(null);
         setFiles([]);
       }
       loadBuckets();
     }
   } catch (err) {
     console.error('Failed to delete bucket:', err);
   }
 };

 const selectBucket = async (bucketName) => {
   setSelectedBucket(bucketName);
   setQueryResult(null);
   
   try {
     const response = await fetch(`/api/buckets/${bucketName}/files`);
     const data = await response.json();
     setFiles(Array.isArray(data) ? data : []);
   } catch (err) {
     console.error('Failed to load files:', err);
     setFiles([]);
   }
 };

 const handleDrop = useCallback(async (e) => {
   e.preventDefault();
   setIsDragging(false);
   
   if (!selectedBucket) return;
   
   const droppedFiles = Array.from(e.dataTransfer.files);
   setSelectedFiles(prev => [...prev, ...droppedFiles]);
 }, [selectedBucket]);

 const handleFileSelect = (e) => {
   const files = Array.from(e.target.files);
   setSelectedFiles(prev => [...prev, ...files]);
 };

 const removeFile = (index) => {
   setSelectedFiles(prev => prev.filter((_, i) => i !== index));
 };

 const uploadFiles = async () => {
   if (!selectedBucket || selectedFiles.length === 0) return;
   
   setUploading(true);
   setUploadProgress({});
   
   try {
     for (let i = 0; i < selectedFiles.length; i++) {
       const file = selectedFiles[i];
       setUploadProgress(prev => ({
         ...prev,
         [i]: { status: 'uploading', name: file.name }
       }));
       
       const formData = new FormData();
       formData.append('file', file);
       
       const response = await fetch(`/api/buckets/${selectedBucket}/ingest`, {
         method: 'POST',
         body: formData
       });
       
       if (response.ok) {
         setUploadProgress(prev => ({
           ...prev,
           [i]: { status: 'success', name: file.name }
         }));
       } else {
         setUploadProgress(prev => ({
           ...prev,
           [i]: { status: 'error', name: file.name }
         }));
       }
     }
     
     // Reload files and clear selection
     await selectBucket(selectedBucket);
     setSelectedFiles([]);
     setUploadProgress({});
   } catch (err) {
     console.error('Upload failed:', err);
   } finally {
     setUploading(false);
   }
 };

 const queryBucket = async () => {
   if (!selectedBucket || !query.trim()) return;
   
   setQuerying(true);
   try {
     const response = await fetch(`/api/buckets/${selectedBucket}/query`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ query: query.trim() })
     });
     
     if (response.ok) {
       const data = await response.json();
       setQueryResult(data.result);
     }
   } catch (err) {
     console.error('Query failed:', err);
   } finally {
     setQuerying(false);
   }
 };

 return (
   <div className="min-h-screen bg-stone-50">
     <div className="bg-white shadow-sm border-b border-stone-200">
       <div className="max-w-7xl mx-auto px-8 py-6">
         <h1 className="text-3xl font-bold text-stone-900">Document Manager</h1>
         <p className="text-stone-600 mt-2">Organize and search your document collections with AI</p>
       </div>
     </div>

     <div className="max-w-7xl mx-auto p-8">
       <div className="grid grid-cols-12 gap-8">
         
         <div className="col-span-4">
           <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
             <div className="p-6 border-b border-stone-100">
               <h2 className="text-lg font-semibold text-stone-800 mb-4">Document Buckets</h2>
               
               {!isCreatingBucket ? (
                 <button
                   onClick={() => setIsCreatingBucket(true)}
                   className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                 >
                   <Plus className="w-5 h-5" />
                   Create New Bucket
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
                       className="flex-1 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-medium"
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

             <div className="max-h-96 overflow-y-auto">
               {buckets.length === 0 ? (
                 <div className="p-8 text-center text-stone-500">
                   <Folder className="w-12 h-12 mx-auto mb-3 opacity-40" />
                   <p className="font-medium">No buckets yet</p>
                   <p className="text-sm mt-1">Create your first bucket to get started</p>
                 </div>
               ) : (
                 <div className="p-3">
                   {buckets.map((bucket) => (
                     <div
                       key={bucket}
                       className={`group flex items-center justify-between p-4 mb-2 rounded-lg cursor-pointer transition-all ${
                         selectedBucket === bucket
                           ? 'bg-emerald-50 border-2 border-emerald-200 shadow-sm'
                           : 'hover:bg-stone-50 border-2 border-transparent'
                       }`}
                       onClick={() => selectBucket(bucket)}
                     >
                       <div className="flex items-center gap-3">
                         <Folder className={`w-6 h-6 ${
                           selectedBucket === bucket ? 'text-emerald-600' : 'text-stone-400'
                         }`} />
                         <span className={`font-medium ${
                           selectedBucket === bucket ? 'text-emerald-900' : 'text-stone-700'
                         }`}>
                           {bucket}
                         </span>
                       </div>
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           deleteBucket(bucket);
                         }}
                         className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 hover:text-red-600 rounded-lg transition-all"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>
         </div>

         <div className="col-span-8">
           {!selectedBucket ? (
             <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
               <Folder className="w-20 h-20 mx-auto mb-6 text-stone-300" />
               <h2 className="text-2xl font-semibold text-stone-600 mb-3">Select a Bucket</h2>
               <p className="text-stone-500 text-lg">Choose a bucket from the sidebar to start managing your documents</p>
             </div>
           ) : (
             <div className="space-y-8">
               
               <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                 <div className="p-6 border-b border-stone-100">
                   <h2 className="text-xl font-semibold text-stone-800">Upload Documents</h2>
                   <p className="text-stone-600 mt-1">Add files to the "{selectedBucket}" bucket</p>
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
                     <div className="inline-flex items-center px-3 py-1 bg-stone-100 rounded-full text-sm">
                       <FileText className="w-4 h-4 mr-2 text-stone-500" />
                       <span className="font-medium text-stone-600">
                         {files.length} files in bucket
                       </span>
                     </div>
                   </div>

                   {/* Selected Files Queue */}
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
                             {uploadProgress[index] ? (
                               <div className="flex items-center gap-2">
                                 {uploadProgress[index].status === 'uploading' && (
                                   <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                 )}
                                 {uploadProgress[index].status === 'success' && (
                                   <Check className="w-5 h-5 text-emerald-600" />
                                 )}
                                 {uploadProgress[index].status === 'error' && (
                                   <AlertCircle className="w-5 h-5 text-red-500" />
                                 )}
                               </div>
                             ) : (
                               <button
                                 onClick={() => removeFile(index)}
                                 className="p-1 hover:bg-stone-200 rounded"
                                 disabled={uploading}
                               >
                                 <X className="w-4 h-4 text-stone-500" />
                               </button>
                             )}
                           </div>
                         ))}
                       </div>
                       
                       <div className="flex gap-3">
                         <button
                           onClick={uploadFiles}
                           disabled={uploading || selectedFiles.length === 0}
                           className="flex-1 bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                         >
                           {uploading ? (
                             <div className="flex items-center justify-center gap-2">
                               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                               Uploading {Object.keys(uploadProgress).length}/{selectedFiles.length}...
                             </div>
                           ) : (
                             `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`
                           )}
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
                 </div>
               </div>

               <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                 <div className="p-6 border-b border-stone-100">
                   <h2 className="text-xl font-semibold text-stone-800">Ask Questions</h2>
                   <p className="text-stone-600 mt-1">Search and query your uploaded documents</p>
                 </div>
                 
                 <div className="p-6">
                   <div className="flex gap-4 mb-6">
                     <div className="flex-1 relative">
                       <Search className="absolute left-4 top-4 w-5 h-5 text-stone-400" />
                       <input
                         type="text"
                         value={query}
                         onChange={(e) => setQuery(e.target.value)}
                         placeholder="Ask a question about your documents..."
                         className="w-full pl-12 pr-4 py-4 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                         onKeyDown={(e) => e.key === 'Enter' && queryBucket()}
                         disabled={querying}
                       />
                     </div>
                     <button
                       onClick={queryBucket}
                       disabled={!query.trim() || querying}
                       className="px-8 py-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
                     >
                       {querying ? 'Searching...' : 'Ask'}
                     </button>
                   </div>

                   {queryResult ? (
                     <div className="bg-stone-50 rounded-xl border border-stone-200 p-6">
                       <div className="flex items-start gap-4">
                         <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                           <Check className="w-6 h-6 text-emerald-600" />
                         </div>
                         <div className="flex-1">
                           <h3 className="font-semibold text-stone-800 mb-3 text-lg">Answer</h3>
                           <div className="text-stone-700 leading-relaxed whitespace-pre-wrap text-base">
                             {queryResult}
                           </div>
                         </div>
                       </div>
                     </div>
                   ) : query && !querying ? (
                     <div className="text-center text-stone-500 py-8">
                       <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                       <p className="text-lg">Click "Ask" to search your documents</p>
                     </div>
                   ) : (
                     <div className="text-center text-stone-500 py-8">
                       <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                       <p className="text-lg">Upload documents and ask questions to get started</p>
                     </div>
                   )}
                 </div>
               </div>

             </div>
           )}
         </div>

       </div>
     </div>
   </div>
 );
};

export default DocumentManager;
