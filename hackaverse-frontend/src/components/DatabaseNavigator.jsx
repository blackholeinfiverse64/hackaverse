import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const DatabaseNavigator = () => {
  const [backendStatus, setBackendStatus] = useState(null);
  const [frontendStatus, setFrontendStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkDatabaseStatus();
    const interval = setInterval(checkDatabaseStatus, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check backend database status
      const response = await apiClient.get('/system/db-status');
      console.log('[DatabaseNavigator] DB Status Response:', response.data);
      
      // Handle both direct data and wrapped response
      const statusData = response.data?.data || response.data;
      setBackendStatus(statusData);

      // Frontend status (always connected if this component renders)
      setFrontendStatus({
        connected: true,
        message: 'Frontend connected to API',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[DatabaseNavigator] Error checking DB status:', err);
      setError(err.message);
      setBackendStatus({
        db_connected: false,
        message: 'Failed to connect to backend',
        error: err.message
      });
      setFrontendStatus({
        connected: false,
        message: 'Frontend unable to reach backend API',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ connected, label }) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      connected 
        ? 'bg-green-100 text-green-800 border border-green-300' 
        : 'bg-red-100 text-red-800 border border-red-300'
    }`}>
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-600' : 'bg-red-600'}`}></div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  const getConnectedStatus = () => {
    if (!backendStatus) return false;
    // Handle both db_connected and connected fields
    return backendStatus.db_connected !== undefined ? backendStatus.db_connected : backendStatus.connected;
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Database Status</h3>
        <button
          onClick={checkDatabaseStatus}
          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-3">
        {/* Backend Status */}
        <div className="border-b pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Backend Database</span>
        {backendStatus && (
              <StatusBadge 
                connected={getConnectedStatus()} 
                label={getConnectedStatus() ? 'Connected' : 'Disconnected'}
              />
            )}
          </div>
          {backendStatus && (
            <div className="text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">Database:</span> {backendStatus.database}</p>
              <p><span className="font-medium">Environment:</span> {backendStatus.env}</p>
              {backendStatus.db_error_type && (
                <p className="text-red-600"><span className="font-medium">Error:</span> {backendStatus.db_error_type}</p>
              )}
              {backendStatus.mongodb_uri_masked && (
                <p><span className="font-medium">URI:</span> {backendStatus.mongodb_uri_masked}</p>
              )}
            </div>
          )}
        </div>

        {/* Frontend Status */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Frontend Connection</span>
            {frontendStatus && (
              <StatusBadge 
                connected={frontendStatus.connected} 
                label={frontendStatus.connected ? 'Connected' : 'Disconnected'}
              />
            )}
          </div>
          {frontendStatus && (
            <div className="text-xs text-gray-600 space-y-1">
              <p>{frontendStatus.message}</p>
              <p><span className="font-medium">Time:</span> {new Date(frontendStatus.timestamp).toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <p className="font-medium">Connection Error:</p>
          <p>{error}</p>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500 text-center">
        Auto-refresh every 10s
      </div>
    </div>
  );
};

export default DatabaseNavigator;
