import { apiService } from './api';
import { API_BASE_URL } from '../constants/appConstants';
import { getAuthHeaders } from '../constants/apiKey';

const defaultHeaders = () => getAuthHeaders();

export const notificationService = {
  // Create notification
  create: (notification) => {
    return fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(notification)
    }).then(r => r.json());
  },

  // Get user notifications
  getUserNotifications: (userId, unreadOnly = false) => {
    return fetch(`${API_BASE_URL}/notifications/user/${userId}?unread_only=${unreadOnly}`, {
      headers: defaultHeaders()
    }).then(r => r.json());
  },

  // Mark as read
  markAsRead: (notificationId) => {
    return fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'PATCH',
      headers: defaultHeaders(),
      body: JSON.stringify({ read: true })
    }).then(r => r.json());
  },

  // Delete notification
  delete: (notificationId) => {
    return fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: defaultHeaders()
    }).then(r => r.json());
  },

  // Trigger notifications on events
  onHackathonJoined: (userId, hackathonName) => {
    return notificationService.create({
      user_id: userId,
      title: 'Joined Hackathon',
      message: `You have successfully joined ${hackathonName}!`,
      type: 'hackathon_joined'
    });
  },

  onInvitationReceived: (userId, teamName) => {
    return notificationService.create({
      user_id: userId,
      title: 'Team Invitation',
      message: `You have been invited to join ${teamName}!`,
      type: 'invitation_received'
    });
  },

  onInvitationAccepted: (userId, teamName) => {
    return notificationService.create({
      user_id: userId,
      title: 'Invitation Accepted',
      message: `Your invitation to ${teamName} was accepted!`,
      type: 'invitation_accepted'
    });
  },

  onProjectSubmitted: (userId, projectTitle) => {
    return notificationService.create({
      user_id: userId,
      title: 'Project Submitted',
      message: `Your project "${projectTitle}" has been submitted for judging!`,
      type: 'project_submitted'
    });
  },

  onJudgeReviewed: (userId, score) => {
    return notificationService.create({
      user_id: userId,
      title: 'Judging Complete',
      message: `Your project has been reviewed! Score: ${score}/100`,
      type: 'judge_reviewed'
    });
  }
};
