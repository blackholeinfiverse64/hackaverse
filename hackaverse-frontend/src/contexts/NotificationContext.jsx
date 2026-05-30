import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications for current user
  const fetchNotifications = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const response = await notificationService.getUserNotifications(userId);
      if (response.success) {
        setNotifications(response.data || []);
        setUnreadCount(response.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.delete(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  // Add new notification
  const addNotification = useCallback(async (notification) => {
    try {
      const response = await notificationService.create(notification);
      if (response.success) {
        setNotifications(prev => [response.data, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }, []);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchNotifications(userId);
      const interval = setInterval(() => fetchNotifications(userId), 30000);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        deleteNotification,
        addNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
