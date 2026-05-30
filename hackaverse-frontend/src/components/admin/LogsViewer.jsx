import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const LogsViewer = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.admin.getLogs({
        tenant_id: 'default',
        event_id: 'default_event',
        limit: 100
      });
      setLogs(response.data?.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.level?.toLowerCase() === filter.toLowerCase();
  });

  const getLevelColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'ERROR': return 'bg-red-500/20 text-red-400';
      case 'WARNING': return 'bg-yellow-500/20 text-yellow-400';
      case 'INFO': return 'bg-blue-500/20 text-blue-400';
      case 'DEBUG': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-white/10 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1128] to-[#15193B] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">System Logs</h1>
          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] text-white rounded-lg hover:opacity-90"
          >
            <i className="uil uil-refresh mr-2"></i>
            Refresh
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 mb-6">
          <div className="flex gap-2">
            {['all', 'error', 'warning', 'info', 'debug'].map(level => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === level
                    ? 'bg-[#00F2EA] text-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-white/50">Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-white/50">No logs found</div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredLogs.map((log, index) => (
                <div key={index} className="p-4 hover:bg-white/5">
                  <div className="flex items-start gap-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <div className="flex-1">
                      <div className="text-white text-sm mb-1">{log.message}</div>
                      <div className="text-white/40 text-xs">{log.timestamp}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogsViewer;
