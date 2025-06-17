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
      addLog('Testing health check...', 'info');
      const result = await apiClient.healthCheck();
      setResults(prev => ({ ...prev, health: result }));
      addLog('✅ Health check passed', 'success');
      return true;
    } catch (error) {
      addLog(`❌ Health check failed: ${error.message}`, 'error');
      return false;
    }
  };

  const testProjectList = async () => {
    try {
      addLog('Testing project list...', 'info');
      const result = await apiClient.getProjects();
      setResults(prev => ({ ...prev, projects: result }));
      addLog(`✅ Found ${Array.isArray(result) ? result.length : 0} projects`, 'success');
      return true;
    } catch (error) {
      addLog(`❌ Project list failed: ${error.message}`, 'error');
      return false;
    }
  };

  const testCreateProject = async () => {
    try {
      addLog('Testing project creation...', 'info');
      const testName = `test_${Date.now()}`;
      const result = await apiClient.createProject({ 
        name: testName,
        description: 'Test project created by connection test',
        template: 'custom',
        type: 'test'
      });
      setResults(prev => ({ ...prev, newProject: result }));
      addLog(`✅ Created project: ${result.project}`, 'success');
      return true;
    } catch (error) {
      addLog(`❌ Project creation failed: ${error.message}`, 'error');
      return false;
    }
  };

  const testBucketOperations = async () => {
    try {
      addLog('Testing bucket operations...', 'info');
      
      // List buckets
      const buckets = await apiClient.listBuckets();
      addLog(`Found ${Array.isArray(buckets) ? buckets.length : 0} existing buckets`, 'info');
      
      // Create a test bucket
      const testBucket = `test_bucket_${Date.now()}`;
      const createResult = await apiClient.createBucket(testBucket);
      addLog(`✅ Created bucket: ${testBucket}`, 'success');
      
      setResults(prev => ({ ...prev, buckets: { list: buckets, created: createResult } }));
      return true;
    } catch (error) {
      addLog(`❌ Bucket operations failed: ${error.message}`, 'error');
      return false;
    }
  };

  const runAllTests = async () => {
    setStatus('running');
    setLogs([]);
    setResults({});
    
    addLog('🚀 Starting connection tests...', 'info');
    
    const tests = [
      { name: 'Health Check', fn: testHealthCheck },
      { name: 'Project List', fn: testProjectList },
      { name: 'Create Project', fn: testCreateProject },
      { name: 'Bucket Operations', fn: testBucketOperations },
    ];
    
    let passed = 0;
    
    for (const test of tests) {
      const success = await test.fn();
      if (success) passed++;
    }
    
    if (passed === tests.length) {
      addLog(`🎉 All tests passed! (${passed}/${tests.length})`, 'success');
      setStatus('success');
    } else {
      addLog(`⚠️ Some tests failed (${passed}/${tests.length})`, 'warning');
      setStatus('partial');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Backend Connection Test</h2>
          <p className="text-gray-600 mt-2">Test the connection between React frontend and FastAPI backend</p>
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
              {status === 'running' ? 'Running Tests...' : 'Run All Tests'}
            </button>
            
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                status === 'idle' ? 'bg-gray-300' :
                status === 'running' ? 'bg-yellow-400' :
                status === 'success' ? 'bg-green-400' :
                'bg-red-400'
              }`}></div>
              <span className="text-sm font-medium">
                {status === 'idle' ? 'Ready to test' :
                 status === 'running' ? 'Testing...' :
                 status === 'success' ? 'All tests passed' :
                 'Some tests failed'}
              </span>
            </div>
          </div>

          {/* Test Logs */}
          {logs.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Test Log</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <span className="text-gray-500 font-mono text-xs">{log.timestamp}</span>
                    <span className={`font-medium ${
                      log.type === 'success' ? 'text-green-600' :
                      log.type === 'error' ? 'text-red-600' :
                      log.type === 'warning' ? 'text-yellow-600' :
                      'text-gray-700'
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
              <h3 className="text-lg font-semibold text-gray-800">Test Results</h3>
              
              {results.health && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Health Check</h4>
                  <pre className="text-sm text-green-700 bg-green-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(results.health, null, 2)}
                  </pre>
                </div>
              )}

              {results.projects && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Projects ({results.projects.length})</h4>
                  <pre className="text-sm text-blue-700 bg-blue-100 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                    {JSON.stringify(results.projects, null, 2)}
                  </pre>
                </div>
              )}

              {results.newProject && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-2">Created Project</h4>
                  <pre className="text-sm text-purple-700 bg-purple-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(results.newProject, null, 2)}
                  </pre>
                </div>
              )}

              {results.buckets && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="font-medium text-indigo-800 mb-2">Bucket Operations</h4>
                  <pre className="text-sm text-indigo-700 bg-indigo-100 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                    {JSON.stringify(results.buckets, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* API Information */}
          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">API Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Base URL:</span>
                <span className="ml-2 text-gray-600">{apiClient.baseURL}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Environment:</span>
                <span className="ml-2 text-gray-600">{import.meta.env.MODE}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestConnection;
