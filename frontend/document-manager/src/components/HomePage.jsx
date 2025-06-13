import { useState } from 'react';
import { FileText, Brain, Database, Upload, Search, Lightbulb, ArrowRight, Plus, Eye, Activity } from 'lucide-react';

const HomePage = () => {
  const [stats] = useState({
    documents: 12,
    tables: 8,
    projects: 3,
    brainstorms: 15
  });

  const features = [
    {
      icon: FileText,
      title: 'Document Manager',
      description: 'Upload, organize, and search through your document collections using AI-powered semantic search.',
      action: 'Manage Documents',
      stats: `${stats.documents} documents`
    },
    {
      icon: Database,
      title: 'Table Manager',
      description: 'Upload CSV files and manage structured data across multiple projects with an intuitive interface.',
      action: 'Manage Tables',
      stats: `${stats.tables} tables, ${stats.projects} projects`
    },
    {
      icon: Brain,
      title: 'Brainstorm Manager',
      description: 'Generate creative ideas by combining your structured data with AI-powered brainstorming capabilities.',
      action: 'Start Brainstorming',
      stats: `${stats.brainstorms} sessions completed`
    }
  ];

  const recentActivity = [
    { type: 'document', action: 'Uploaded "Q4 Report.pdf"', time: '2 hours ago' },
    { type: 'table', action: 'Created table "customer_data"', time: '4 hours ago' },
    { type: 'brainstorm', action: 'Generated ideas for "Product Launch"', time: '1 day ago' },
    { type: 'document', action: 'Searched "market analysis"', time: '2 days ago' }
  ];

  const quickActions = [
    { icon: Upload, label: 'Upload Document', description: 'Add new documents to search' },
    { icon: Plus, label: 'Create Table', description: 'Upload CSV data' },
    { icon: Lightbulb, label: 'New Brainstorm', description: 'Generate fresh ideas' },
    { icon: Search, label: 'Search Content', description: 'Find information quickly' }
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-stone-900">Dashboard</h1>
          <p className="text-stone-600 mt-2">Manage your documents, data, and AI-powered insights</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">{stats.documents}</p>
                <p className="text-sm text-stone-600">Documents</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">{stats.tables}</p>
                <p className="text-sm text-stone-600">Data Tables</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">{stats.projects}</p>
                <p className="text-sm text-stone-600">Projects</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">{stats.brainstorms}</p>
                <p className="text-sm text-stone-600">Brainstorms</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Features */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-stone-800 mb-6">Workspaces</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6 border-b border-stone-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-stone-800">{feature.title}</h3>
                        <p className="text-sm text-stone-500">{feature.stats}</p>
                      </div>
                    </div>
                    <p className="text-stone-600 mb-4">{feature.description}</p>
                  </div>
                  <div className="p-6">
                    <button className="w-full bg-emerald-500 text-white py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center justify-center gap-2">
                      {feature.action}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-100">
              <h3 className="text-lg font-semibold text-stone-800">Quick Actions</h3>
              <p className="text-stone-600 text-sm mt-1">Get started with common tasks</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button key={index} className="p-4 rounded-lg border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group text-left">
                      <Icon className="w-6 h-6 text-stone-400 group-hover:text-emerald-600 mb-3 transition-colors" />
                      <h4 className="font-medium text-stone-800 mb-1">{action.label}</h4>
                      <p className="text-sm text-stone-500">{action.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-100">
              <h3 className="text-lg font-semibold text-stone-800">Recent Activity</h3>
              <p className="text-stone-600 text-sm mt-1">Your latest actions across all managers</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const iconMap = {
                    document: FileText,
                    table: Database,
                    brainstorm: Brain
                  };
                  const Icon = iconMap[activity.type];
                  
                  return (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-stone-700 font-medium">{activity.action}</p>
                        <p className="text-stone-500 text-sm">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-6 border-b border-stone-100">
            <h3 className="text-lg font-semibold text-stone-800">Getting Started</h3>
            <p className="text-stone-600 text-sm mt-1">New to Nell Beta? Start here</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-stone-200 rounded-lg">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                  <Upload className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="font-medium text-stone-800 mb-2">1. Upload Documents</h4>
                <p className="text-sm text-stone-600">Start by uploading your first document or CSV file to begin organizing your data.</p>
              </div>
              
              <div className="p-4 border border-stone-200 rounded-lg">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                  <Search className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="font-medium text-stone-800 mb-2">2. Search & Explore</h4>
                <p className="text-sm text-stone-600">Use AI-powered search to find information across your documents and data tables.</p>
              </div>
              
              <div className="p-4 border border-stone-200 rounded-lg">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                  <Lightbulb className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="font-medium text-stone-800 mb-2">3. Generate Ideas</h4>
                <p className="text-sm text-stone-600">Combine your data with AI brainstorming to generate creative insights and solutions.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;
