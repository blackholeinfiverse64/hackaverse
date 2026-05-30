import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/apiClient';

export const useDashboardData = (refreshInterval = 10000) => {
  const [data, setData] = useState({
    totalParticipants: 0,
    activeProjects: 0,
    submissions: 0,
    activeTeams: 0,
    recentActivities: [],
    deltas: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      if (response.data?.data) {
        setData(response.data.data);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchDashboardData, refreshInterval]);

  return { data, loading, error, refetch: fetchDashboardData };
};

export const useActivityLogs = (limit = 10, refreshInterval = 15000) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getActivityLogs(limit);
      if (response.data?.data) {
        setActivities(response.data.data);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
      console.error('Activity logs fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchActivities, refreshInterval]);

  return { activities, loading, error, refetch: fetchActivities };
};
