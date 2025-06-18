import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ onNewProject }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Projects', path: '/', icon: '📁' },
    { name: 'Documents', path: '/documents', icon: '📄' },
    { name: 'Tables', path: '/tables', icon: '📊' },
    { name: 'Brainstorm', path: '/brainstorm', icon: '🧠' },
    { name: 'Explore API', path: '/explorer', icon: '📚' },
    { name: 'Test API', path: '/test', icon: '🔧' }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname.startsWith('/project/');
    }
    return location.pathname === path;
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">
            N
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Nell Beta</h1>
            <p className="text-sm text-gray-500">AI-powered project workspace</p>
          </div>
        </div>

        <nav className="flex items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <button
          onClick={onNewProject}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <span>+</span>
          <span>New Project</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
