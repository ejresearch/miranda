import React, { useState, useEffect } from 'react';

const DocumentManager = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for now - replace with your actual data source
  useEffect(() => {
    const mockDocs = [
      {
        id: 1,
        title: 'Marketing Strategy 2024',
        content: 'Our comprehensive marketing strategy...',
        lastModified: new Date('2024-06-10'),
        type: 'strategy',
        tags: ['marketing', 'strategy', '2024']
      },
      {
        id: 2,
        title: 'Product Requirements Document',
        content: 'This document outlines the requirements...',
        lastModified: new Date('2024-06-12'),
        type: 'requirements',
        tags: ['product', 'requirements', 'development']
      },
      {
        id: 3,
        title: 'Meeting Notes - June 14',
        content: 'Key decisions made in today\'s meeting...',
        lastModified: new Date('2024-06-14'),
        type: 'notes',
        tags: ['meeting', 'notes', 'decisions']
      }
    ];
    setDocuments(mockDocs);
  }, []);

  const filteredDocs = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateNew = () => {
    const newDoc = {
      id: Date.now(),
      title: 'Untitled Document',
      content: '',
      lastModified: new Date(),
      type: 'document',
      tags: []
    };
    setDocuments([newDoc, ...documents]);
    setSelectedDoc(newDoc);
    setIsCreating(true);
  };

  const handleSaveDocument = (doc) => {
    setDocuments(docs => 
      docs.map(d => d.id === doc.id ? { ...doc, lastModified: new Date() } : d)
    );
    setIsCreating(false);
  };

  const handleDeleteDocument = (docId) => {
    setDocuments(docs => docs.filter(d => d.id !== docId));
    if (selectedDoc?.id === docId) {
      setSelectedDoc(null);
    }
  };

  return (
    <div className="h-screen flex bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
            <button
              onClick={handleCreateNew}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
            >
              + New
            </button>
          </div>
          
          {/* Search */}
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedDoc?.id === doc.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {doc.content || 'No content yet...'}
                  </p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className="text-xs text-gray-500">
                      {doc.lastModified.toLocaleDateString()}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDocument(doc.id);
                  }}
                  className="text-gray-400 hover:text-red-500 ml-2"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedDoc ? (
          <DocumentEditor 
            document={selectedDoc}
            onSave={handleSaveDocument}
            isNew={isCreating}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium mb-2">No document selected</h3>
              <p>Choose a document from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Document Editor Component
const DocumentEditor = ({ document, onSave, isNew }) => {
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content);
  const [tags, setTags] = useState(document.tags.join(', '));
  const [hasChanges, setHasChanges] = useState(isNew);

  useEffect(() => {
    setTitle(document.title);
    setContent(document.content);
    setTags(document.tags.join(', '));
    setHasChanges(isNew);
  }, [document, isNew]);

  const handleSave = () => {
    const updatedDoc = {
      ...document,
      title,
      content,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    onSave(updatedDoc);
    setHasChanges(false);
  };

  const handleChange = () => {
    setHasChanges(true);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Editor Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              handleChange();
            }}
            className="text-xl font-semibold bg-transparent border-none outline-none flex-1 mr-4"
            placeholder="Document title..."
          />
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <span className="text-sm text-orange-600">Unsaved changes</span>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-4 py-2 rounded font-medium ${
                hasChanges
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Save
            </button>
          </div>
        </div>
        
        {/* Tags */}
        <input
          type="text"
          value={tags}
          onChange={(e) => {
            setTags(e.target.value);
            handleChange();
          }}
          placeholder="Tags (comma separated)..."
          className="mt-2 text-sm text-gray-600 bg-transparent border-none outline-none w-full"
        />
      </div>

      {/* Content Editor */}
      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleChange();
          }}
          placeholder="Start writing your document..."
          className="w-full h-full resize-none border-none outline-none text-gray-900 leading-relaxed"
        />
      </div>
    </div>
  );
};

export default DocumentManager;
