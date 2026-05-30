import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const SyncContext = createContext();

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }
  return context;
};

export const SyncProvider = ({ children }) => {
  const [syncData, setSyncData] = useState({
    teams: [],
    participants: [],
    hackathons: [],
    projects: [],
    submissions: [],
    activities: [],
    events: [],
    lastUpdate: null
  });

  const fetchAllData = useCallback(async () => {
    try {
      const authToken = localStorage.getItem('authToken');

      // Build list of requests - only include protected endpoints if authenticated
      const requests = [
        api.get('/hackathons').catch(() => null)
      ];

      // Only fetch protected endpoints if user is authenticated
      if (authToken) {
        requests.push(
          api.get('/teams').catch(() => null),
          api.get('/submissions').catch(() => null),
          api.get('/admin/dashboard').catch(() => null)
        );
      } else {
        // No auth - still add null placeholders to keep array indices consistent
        requests.push(null, null, null);
      }

      const [hackathonsRes, teamsRes, submissionsRes, activitiesRes] = await Promise.all(requests);

      const teams = teamsRes ? (teamsRes.data?.success ? teamsRes.data.data || [] : []) : [];
      const hackathons = hackathonsRes ? (hackathonsRes.data?.success ? hackathonsRes.data.data || [] : []) : [];
      const submissions = submissionsRes ? (submissionsRes.data?.success ? submissionsRes.data.data || [] : []) : [];
      const dashboardData = activitiesRes ? (activitiesRes.data?.success ? activitiesRes.data.data || {} : {}) : {};
      const activities = dashboardData.recentActivities || [];

      const participantsMap = new Map();
      teams.forEach(team => {
        const members = team.members || [];
        members.forEach(member => {
          const memberId = typeof member === 'object' ? member.user_id : member;
          if (memberId && !participantsMap.has(memberId)) {
            participantsMap.set(memberId, {
              id: memberId,
              name: typeof member === 'object' ? member.name : `User ${memberId}`,
              email: typeof member === 'object' ? member.email : `user${memberId}@hackaverse.com`
            });
          }
        });
      });

      setSyncData({
        teams,
        hackathons,
        submissions,
        activities,
        events: activities,
        participants: Array.from(participantsMap.values()),
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Sync error:', error);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const value = {
    syncData,
    teams: syncData.teams,
    hackathons: syncData.hackathons,
    submissions: syncData.submissions,
    activities: syncData.activities,
    events: syncData.events,
    participants: syncData.participants
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};
