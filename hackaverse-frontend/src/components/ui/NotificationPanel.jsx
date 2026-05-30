import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UIPortal from './UIPortal';

const NotificationPanel = ({ isOpen, onClose, triggerRef }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
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
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  const getPosition = () => {
    if (!triggerRef.current) return {};

    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = 400;

    // Position from the right side
    let right = window.innerWidth - rect.right;
    let top = rect.bottom + 8;

    // Ensure the panel doesn't go off the left edge
    if (right + panelWidth > window.innerWidth - 16) {
      right = 16;
    }

    // Ensure the panel doesn't go off the top edge
    if (top < 16) {
      top = 16;
    }

    return {
      top: top,
      right: right
    };
  };

  if (!isOpen) return null;

  const position = getPosition();

  const notifications = [];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'announcement': return 'uil uil-megaphone';
      case 'update': return 'uil uil-bell';
      case 'result': return 'uil uil-trophy';
      default: return 'uil uil-bell';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'announcement': return 'text-cyan';
      case 'update': return 'text-warning';
      case 'result': return 'text-success';
      default: return 'text-text-secondary';
    }
  };

  return (
    <UIPortal>
      <div
        ref={panelRef}
        className={`notification-panel glass-card ${isOpen ? 'slide-in' : ''}`}
        style={position}
        role="dialog"
        aria-label="Notifications panel"
      >
        <div className="notification-panel-header">
          <h3 className="notification-panel-title">Notifications</h3>
          <button
            onClick={onClose}
            className="notification-panel-close"
            aria-label="Close notifications"
          >
            <i className="uil uil-times"></i>
          </button>
        </div>

        <div className="notification-panel-content">
          {notifications.length === 0 ? (
            <div className="notification-panel-empty">
              <i className="uil uil-bell-slash text-3xl text-text-muted mb-3"></i>
              <p className="text-text-secondary">No notifications yet</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.unread ? 'unread' : ''}`}
                >
                  <div className="notification-icon">
                    <i className={`${getNotificationIcon(notification.type)} ${getNotificationColor(notification.type)}`}></i>
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{notification.time}</div>
                  </div>
                  {notification.unread && <div className="notification-unread-dot"></div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="notification-panel-footer">
          <button className="notification-panel-link">
            View All Notifications
          </button>
        </div>
      </div>
    </UIPortal>
  );
};

export default NotificationPanel;
