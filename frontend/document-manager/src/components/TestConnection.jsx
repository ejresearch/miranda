// frontend/document-manager/src/components/TestConnection.jsx
import React, { useState } from 'react';
import apiClient from '../api/client';

const TestConnection = () => {
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState({});
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const testHealthCheck = async () => {
    try {
      addLog('🏥 Testing health check...', 'info');
      const result = await apiClient.healthCheck();
      setResults(prev => ({ ...prev, health: result }));
      addLog('✅ Health check passed: ' + result.message, 'success');
      return true;
    } catch (error) {
      addLog(`❌ Health check failed: ${error.message}`, 'error');
      setResults(prev => ({ ...prev, health: { error: error.message } }));
      return false;
    }
  };

  const testProjectList = async () => {
    try {
      addLog('📁 Testing project list...', 'info');
      const result = await apiClient.getProjects();
      setResults(prev => ({ ...prev, projects: result }));
      addLog(`✅ Found ${Array.isArray(result) ? result.length : 0} projects`, 'success');
      return true;
    } catch (error) {
      addLog(`❌ Project list failed: ${error.message}`, 'error');
      setResults(prev => ({ ...prev, projects: { error: error.message } }));
      return false;
    }
  };

  const testCreateProject = async () => {
    try {
      addLog('🆕 Testing project creation...', 'info');
      const testName = `test_${Date.now()}`;
      const result = await apiClient.createProject({ 
        name: testName,
        description: 'Test project created by connection test',
        template: 'custom',
        type: 'test'
      });
      setResults(prev => ({ ...prev, newProject: result }));
      addLog(`✅ Created project: ${result.project || result.name}`, 'success');
      return true;
    } catch (error) {
      addLog(`❌ Project creation failed: ${error.message}`, 'error');
      setResults(prev => ({ ...prev, newProject: { error: error.message } }));
      return false;
    }
  };

  const testBucketOperations = async () => {
    try {
      addLog('🪣 Testing bucket operations...', 'info');
      
      // List buckets
      try {
        const buckets = await apiClient.listBuckets();
        addLog(`Found ${Array.isArray(buckets) ? buckets.length : 0} existing buckets`, 'info');
        setResults(prev => ({ ...prev, buckets: { list: buckets } }));
      } catch (listError) {
        addLog(`Warning: Could not list buckets: ${listError.message}`, 'warning');
      }
      
      // Create a test bucket
      const testBucket = `test_bucket_${Date.now()}`;
      const createResult = await apiClient.createBucket(testBucket);
      addLog(`✅ Created bucket: ${testBucket}`, 'success');
      
      setResults(prev => ({ 
        ...prev, 
        buckets: { 
          ...prev.buckets,
          created: createResult 
        } 
      }));
      return true;
    } catch (error) {
      addLog(`❌ Bucket operations failed: ${error.message}`, 'error');
      setResults(prev => ({ ...prev, buckets: { error: error.message } }));
      return false;
    }
  };

  const testCORSConnection = async () => {
    try {
      addLog('🌐 Testing CORS connection...', 'info');
      
      // Direct fetch test to backend
      const response = await fetch('http://localhost:8000/healthcheck', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        addLog('✅ Direct CORS connection successful', 'success');
        setResults(prev => ({ ...prev, cors: { status: 'success', data } }));
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      addLog(`❌ CORS connection failed: ${error.message}`, 'error');
      setResults(prev => ({ ...prev, cors: { error: error.message } }));
      
      // Additional CORS troubleshooting
      if (error.message.includes('CORS')) {
        addLog('💡 CORS issue detected. Check backend CORS configuration.', 'warning');
      } else if (error.message.includes('Failed to fetch')) {
        addLog('💡 Connection refused. Make sure backend is running on port 8000.', 'warning');
      }
      return false;
    }
  };

  const runAllTests = async () => {
    setStatus('running');
    setLogs([]);
    setResults({});
    
    addLog('🚀 Starting comprehensive connection tests...', 'info');
    
    const tests = [
      { name: 'CORS Connection', fn: testCORSConnection },
      { name: 'Health Check', fn: testHealthCheck },
      { name: 'Project List', fn: testProjectList },
      { name: 'Create Project', fn: testCreateProject },
      { name: 'Bucket Operations', fn: testBucketOperations },
    ];
    
    let passed = 0;
    
    for (const test of tests) {
      addLog(`\n🧪 Running test: ${test.name}`, 'info');
      const success = await test.fn();
      if (success) passed++;
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (passed === tests.length) {
      addLog(`\n🎉 All tests passed! (${passed}/${tests.length})`, 'success');
      setStatus('success');
    } else {
      addLog(`\n⚠️ Some tests failed (${passed}/${tests.length})`, 'warning');
      setStatus('partial');
    }
  };

  const clearResults = () => {
    setLogs([]);
    setResults({});
    setStatus('idle');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900">🔧 Backend Connection Test</h2>
          <p className="text-gray-600 mt-2">Test the connection between React frontend and FastAPI backend</p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">🎯 What This Tests:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• CORS configuration and cross-origin requests</li>
              <li>• API endpoint accessibility and routing</li>
              <li>• Project creation and management</li>
              <li>• Bucket operations and file handling</li>
              <li>• Error handling and response formatting</li>
            </ul>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={runAllTests}
              disabled={status === 'running'}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                status === 'running'
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {status === 'running' ? '🔄 Running Tests...' : '🚀 Run All Tests'}
            </button>
            
            <button
              onClick={clearResults}
              disabled={status === 'running'}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              🗑️ Clear Results
            </button>
            
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                status === 'idle' ? 'bg-gray-300' :
                status === 'running' ? 'bg-yellow-400 animate-pulse' :
                status === 'success' ? 'bg-green-400' :
                'bg-red-400'
              }`}></div>
              <span className="text-sm font-medium">
                {status === 'idle' ? 'Ready to test' :
                 status === 'running' ? 'Testing in progress...' :
                 status === 'success' ? 'All tests passed!' :
                 'Some tests failed'}
              </span>
            </div>
          </div>

          {/* Test Logs */}
          {logs.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">📝 Test Log</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto text-sm font-mono">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-gray-400 text-xs min-w-[60px]">{log.timestamp}</span>
                    <span className={`${
                      log.type === 'success' ? 'text-green-400' :
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'warning' ? 'text-yellow-400' :
                      'text-gray-300'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Results */}
          {Object.keys(results).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">📊 Test Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(results).map(([key, result]) => (
                  <div key={key} className={`border rounded-lg p-4 ${
                    result.error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                  }`}>
                    <h4 className={`font-medium mb-2 capitalize ${
                      result.error ? 'text-red-800' : 'text-green-800'
                    }`}>
                      {result.error ? '❌' : '✅'} {key.replace(/([A-Z])/g, ' $1')}
                    </h4>
                    <pre className={`text-sm overflow-x-auto max-h-32 overflow-y-auto ${
                      result.error ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connection Info */}
          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">🔧 Connection Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Frontend URL:</span>
                <span className="ml-2 text-gray-600">{window.location.origin}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Backend URL:</span>
                <span className="ml-2 text-gray-600">{apiClient.baseURL}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Environment:</span>
                <span className="ml-2 text-gray-600">{import.meta.env.MODE}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">VITE_API_URL:</span>
                <span className="ml-2 text-gray-600">{import.meta.env.VITE_API_URL || 'Not set'}</span>
              </div>
            </div>
          </div>

          {/* Troubleshooting Tips */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">💡 Troubleshooting Tips</h4>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Make sure the backend is running: <code className="bg-yellow-100 px-1 rounded">uvicorn backend.main:app --reload --port 8000</code></li>
              <li>• Check that CORS is configured in <code className="bg-yellow-100 px-1 rounded">backend/main.py</code></li>
              <li>• Verify the API routes are properly mounted</li>
              <li>• Check browser console for additional error details</li>
              <li>• Ensure no firewall is blocking port 8000</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestConnection;
