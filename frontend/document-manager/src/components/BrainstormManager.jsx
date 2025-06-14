import React, { useState, useEffect } from 'react';

const BrainstormManager = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for now
  useEffect(() => {
    const mockSessions = [
      {
        id: 1,
        title: 'Marketing Campaign Ideas',
        description: 'Brainstorming session for Q3 marketing campaigns',
        ideas: [
          { id: 1, text: 'Social media influencer partnerships', category: 'social', votes: 5 },
          { id: 2, text: 'Interactive product demos at trade shows', category: 'events', votes: 3 },
          { id: 3, text: 'Email newsletter with customer stories', category: 'content', votes: 7 },
          { id: 4, text: 'Referral program with rewards', category: 'growth', votes: 4 }
        ],
        lastModified: new Date('2024-06-14'),
        tags: ['marketing', 'campaigns', 'ideas'],
        participants: ['Alice', 'Bob', 'Charlie']
      },
      {
        id: 2,
        title: 'Product Feature Prioritization',
        description: 'Ranking potential features for next release',
        ideas: [
          { id: 5, text: 'Dark mode toggle', category: 'ui', votes: 8 },
          { id: 6, text: 'Advanced search filters', category: 'functionality', votes: 6 },
          { id: 7, text: 'Mobile app notifications', category: 'mobile', votes: 9 },
          { id: 8, text: 'Data export functionality', category: 'data', votes: 4 }
        ],
        lastModified: new Date('2024-06-13'),
        tags: ['product', 'features', 'prioritization'],
        participants: ['David', 'Eve', 'Frank']
      }
    ];
    setSessions(mockSessions);
  }, []);

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateNew = () => {
    const newSession = {
      id: Date.now(),
      title: 'New Brainstorm Session',
      description: '',
      ideas: [],
      lastModified: new Date(),
      tags: [],
      participants: []
    };
    setSessions([newSession, ...sessions]);
    setSelectedSession(newSession);
    setIsCreating(true);
  };

  const handleSaveSession = (session) => {
    setSessions(sessions => 
      sessions.map(s => s.id === session.id ? { ...session, lastModified: new Date() } : s)
    );
    setIsCreating(false);
  };

  const handleDeleteSession = (sessionId) => {
    setSessions(sessions => sessions.filter(s => s.id !== sessionId));
    if (selectedSession?.id === sessionId) {
      setSelectedSession(null);
    }
  };

  return (
    <div className="h-screen flex bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Brainstorm Sessions</h2>
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
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedSession?.id === session.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{session.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {session.description || 'No description'}
                  </p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <span>{session.ideas.length} ideas</span>
                    <span className="mx-2">•</span>
                    <span>{session.participants.length} participants</span>
                    <span className="mx-2">•</span>
                    <span>{session.lastModified.toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {session.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
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
        {selectedSession ? (
          <BrainstormEditor 
            session={selectedSession}
            onSave={handleSaveSession}
            isNew={isCreating}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">🧠</div>
              <h3 className="text-lg font-medium mb-2">No session selected</h3>
              <p>Choose a brainstorm session from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Brainstorm Editor Component
const BrainstormEditor = ({ session, onSave, isNew }) => {
  const [title, setTitle] = useState(session.title);
  const [description, setDescription] = useState(session.description);
  const [ideas, setIdeas] = useState([...session.ideas]);
  const [tags, setTags] = useState(session.tags.join(', '));
  const [participants, setParticipants] = useState(session.participants.join(', '));
  const [hasChanges, setHasChanges] = useState(isNew);
  const [newIdea, setNewIdea] = useState('');

  useEffect(() => {
    setTitle(session.title);
    setDescription(session.description);
    setIdeas([...session.ideas]);
    setTags(session.tags.join(', '));
    setParticipants(session.participants.join(', '));
    setHasChanges(isNew);
  }, [session, isNew]);

  const handleSave = () => {
    const updatedSession = {
      ...session,
      title,
      description,
      ideas,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      participants: participants.split(',').map(p => p.trim()).filter(p => p)
    };
    onSave(updatedSession);
    setHasChanges(false);
  };

  const handleChange = () => {
    setHasChanges(true);
  };

  const addIdea = () => {
    if (newIdea.trim()) {
      const idea = {
        id: Date.now(),
        text: newIdea.trim(),
        category: 'general',
        votes: 0
      };
      setIdeas([...ideas, idea]);
      setNewIdea('');
      handleChange();
    }
  };

  const removeIdea = (ideaId) => {
    setIdeas(ideas.filter(idea => idea.id !== ideaId));
    handleChange();
  };

  const voteIdea = (ideaId, delta) => {
    setIdeas(ideas.map(idea => 
      idea.id === ideaId 
        ? { ...idea, votes: Math.max(0, idea.votes + delta) }
        : idea
    ));
    handleChange();
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Editor Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 mr-4">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                handleChange();
              }}
              className="text-xl font-semibold bg-transparent border-none outline-none w-full"
              placeholder="Session title..."
            />
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                handleChange();
              }}
              placeholder="Description..."
              className="mt-1 text-sm text-gray-600 bg-transparent border-none outline-none w-full"
            />
          </div>
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
        
        {/* Tags and Participants */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            value={tags}
            onChange={(e) => {
              setTags(e.target.value);
              handleChange();
            }}
            placeholder="Tags (comma separated)..."
            className="text-sm text-gray-600 bg-transparent border-none outline-none"
          />
          <input
            type="text"
            value={participants}
            onChange={(e) => {
              setParticipants(e.target.value);
              handleChange();
            }}
            placeholder="Participants (comma separated)..."
            className="text-sm text-gray-600 bg-transparent border-none outline-none"
          />
        </div>
      </div>

      {/* Ideas Section */}
      <div className="flex-1 p-4 overflow-auto">
        {/* Add New Idea */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addIdea()}
              placeholder="Add a new idea..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={addIdea}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add Idea
            </button>
          </div>
        </div>

        {/* Ideas List */}
        <div className="space-y-3">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
            >
              <div className="flex-1">
                <p className="text-gray-900">{idea.text}</p>
                <div className="flex items-center mt-2 space-x-2">
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                    {idea.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {idea.votes} votes
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => voteIdea(idea.id, -1)}
                  className="text-gray-400 hover:text-red-500"
                >
                  👎
                </button>
                <span className="text-sm font-medium">{idea.votes}</span>
                <button
                  onClick={() => voteIdea(idea.id, 1)}
                  className="text-gray-400 hover:text-green-500"
                >
                  👍
                </button>
                <button
                  onClick={() => removeIdea(idea.id)}
                  className="text-gray-400 hover:text-red-500 ml-2"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {ideas.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">💡</div>
            <p>No ideas yet. Add your first idea above!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrainstormManager;
