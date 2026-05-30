import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import UIPortal from './UIPortal';
import { apiService } from '../../services/api';

const NotificationDropdown = ({ isOpen, onClose, triggerRef }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  const fetchNotifications = async () => {
    if (!user?.user_id) return;
    
    setLoading(true);
    try {
      const response = await apiService.notifications.getAll(user.user_id);
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleScroll = () => {
      if (window.scrollY > 24) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  const handleNotificationClick = async (notification) => {
    // Mark as read
    try {
      await apiService.notifications.markRead(notification.notification_id);
      setNotifications(prev => 
        prev.map(n => n.notification_id === notification.notification_id ? {...n, read: true} : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'hackathon_joined':
        navigate('/app/home');
        break;
      case 'invitation_received':
        navigate('/teams/invitations');
        break;
      case 'invitation_accepted':
        navigate('/teams');
        break;
      case 'project_submitted':
        navigate('/submissions');
        break;
      case 'judge_reviewed':
        navigate('/leaderboard');
        break;
      default:
        navigate('/logs');
    }

    onClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'hackathon_joined':
        return 'uil-trophy';
      case 'invitation_received':
        return 'uil-envelope';
      case 'invitation_accepted':
        return 'uil-check-circle';
      case 'project_submitted':
        return 'uil-file-upload';
      case 'judge_reviewed':
        return 'uil-user-check';
      default:
        return 'uil-bell';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'hackathon_joined':
        return 'text-green-400';
      case 'invitation_received':
        return 'text-blue-400';
      case 'invitation_accepted':
        return 'text-green-400';
      case 'project_submitted':
        return 'text-purple-400';
      case 'judge_reviewed':
        return 'text-orange-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const getPosition = () => {
    if (!triggerRef.current) return {};

    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownWidth = 400;

    // Position to the left of the trigger
    let left = rect.right - dropdownWidth;
    let top = rect.bottom + 8;

    // Ensure the dropdown doesn't go off the right edge of the screen
    if (left + dropdownWidth > window.innerWidth - 16) {
      left = window.innerWidth - dropdownWidth - 16;
    }

    // Ensure the dropdown doesn't go off the left edge of the screen
    if (left < 16) {
      left = 16;
    }

    // Ensure the dropdown doesn't go off the top edge of the screen
    if (top < 16) {
      top = 16;
    }

    return {
      top: top,
      left: left
    };
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  const position = getPosition();

  return (
    <UIPortal>
      <div
        ref={dropdownRef}
        className="notification-dropdown glass-card"
        style={position}
        role="menu"
        aria-label="Notifications"
      >
        <div className="notification-header">
          <h3 className="notification-title">Notifications</h3>
          {unreadCount > 0 && (
            <span className="notification-count">{unreadCount}</span>
          )}
        </div>

        <div className="notification-list">
          {loading ? (
            <div className="notification-empty">
              <div className="animate-spin text-2xl text-cyan-400 mb-2">⟳</div>
              <p className="text-gray-400 text-sm">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <i className="uil uil-bell-slash text-2xl text-gray-400 mb-2"></i>
              <p className="text-gray-400 text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.notification_id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                role="menuitem"
                tabIndex={0}
                onClick={() => handleNotificationClick(notification)}
                onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  <i className={`uil ${getNotificationIcon(notification.type)} ${getNotificationColor(notification.type)}`}></i>
                </div>

                <div className="notification-content">
                  <div className="notification-title-text">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{formatTime(notification.created_at)}</div>
                </div>

                {!notification.read && (
                  <div className="notification-unread-indicator"></div>
                )}
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="notification-footer">
            <button
              className="notification-view-all"
              onClick={() => {
                navigate('/logs');
                onClose();
              }}
            >
              View All Notifications
            </button>
          </div>
        )}
      </div>
    </UIPortal>
  );
};

export default NotificationDropdown;
