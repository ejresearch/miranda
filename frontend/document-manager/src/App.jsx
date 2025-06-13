import { useState } from 'react';
import { Folder, FileText, Brain, Database } from 'lucide-react';
import ProjectDashboard from './components/ProjectDashboard';
import DocumentManager from './components/DocumentManager';
import BrainstormManager from './components/BrainstormManager';
import TableManager from './components/TableManager';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('projects');

  const tabs = [
    {
      id: 'projects',
      name: 'Projects',
      icon: Folder,
    },
    {
      id: 'documents',
      name: 'Documents',
      icon: FileText,
    },
    {
      id: 'tables',
      name: 'Tables', 
      icon: Database,
    },
    {
      id: 'brainstorm',
      name: 'Brainstorm', 
      icon: Brain,
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white shadow-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="ml-3 text-xl font-bold text-stone-900">Nell Beta</span>
            </div>

            <div className="flex items-center space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all font-medium ${
                      activeTab === tab.id
                        ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {activeTab === 'projects' && <ProjectDashboard />}
        {activeTab === 'documents' && <DocumentManager />}
        {activeTab === 'tables' && <TableManager />}
        {activeTab === 'brainstorm' && <BrainstormManager />}
      </main>
    </div>
  );
}

export default App;
