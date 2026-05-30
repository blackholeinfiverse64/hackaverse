// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEPRECATED — Use the canonical api.js service instead
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// This file is DEPRECATED and will be removed in a future sprint.
// All components should import from '../services/api' instead.
//
// Reasons for deprecation:
//   1. Does not use the /api/v1 versioned namespace
//   2. Does not have automatic token refresh logic
//   3. Does not capture trace_ids for observability
//   4. Creates contract confusion with duplicate axios instances
//
// Migration guide:
//   BEFORE: import apiClient, { adminAPI } from '../services/apiClient';
//   AFTER:  import { apiService } from '../services/api';
//           apiService.admin.getDashboard()  // replaces adminAPI.getDashboard()
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import axios from 'axios';
import { getApiKey } from '../constants/apiKey';
import { API_BASE_URL } from '../constants/appConstants';

console.warn(
  '[HackaVerse] DEPRECATION WARNING: apiClient.js is deprecated. ' +
  'Use the canonical api.js service instead. ' +
  'See apiClient.js header comments for migration guide.'
);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-Key': getApiKey(),
    'Content-Type': 'application/json'
  }
});

// Admin APIs — DEPRECATED: use apiService.admin.* from api.js
export const adminAPI = {
  getDashboard: () => apiClient.get('/admin/dashboard'),
  createHackathon: (data) => apiClient.post('/hackathons', data),
  inviteJudge: (email) => apiClient.post('/admin/invite-judge', { email }),
  inviteParticipant: (email, hackathonId) => 
    apiClient.post('/admin/invite-participant', { email, hackathonId }),
  getActivityLogs: (limit = 10) => apiClient.get(`/admin/logs?limit=${limit}`)
};

// Submission APIs — DEPRECATED: use apiService.submissions.* from api.js
export const submissionAPI = {
  getAllSubmissions: () => apiClient.get('/submissions'),
  getSubmissionById: (submissionId) => apiClient.get(`/submissions/${submissionId}`),
  getTeamSubmissions: (teamId) => apiClient.get(`/submissions/team/${teamId}`),
  createSubmission: (data) => apiClient.post('/submissions', data),
};

// Invitation APIs — DEPRECATED: use apiService.teams.* from api.js
export const invitationAPI = {
  getInvitations: (userEmail) => apiClient.get(`/invitations?user_email=${userEmail}`),
  acceptInvitation: (invitationId) => apiClient.post(`/invitations/${invitationId}/accept`),
  declineInvitation: (invitationId) => apiClient.post(`/invitations/${invitationId}/decline`)
};

// Judging APIs — DEPRECATED: use apiService.judge.* from api.js
export const judgingAPI = {
  scoreProject: (data) => apiClient.post('/judging/score', data),
  getProjectScores: (projectId) => apiClient.get(`/judging/scores/${projectId}`)
};

// Announcements APIs — DEPRECATED: use apiService.announcements.* from api.js
export const announcementsAPI = {
  getAll: () => apiClient.get('/notifications/announcements'),
  create: (data) => apiClient.post('/notifications/announcements', data)
};

// Leaderboard APIs — DEPRECATED: use apiService.leaderboard.* from api.js
export const leaderboardAPI = {
  getLeaderboard: (hackathonId, limit = 50) => apiClient.get(`/hackathons/${hackathonId}/leaderboard`, { params: { limit } })
};

export default apiClient;
