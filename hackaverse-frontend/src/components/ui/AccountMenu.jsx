import { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import UIPortal from './UIPortal';

const AccountMenu = ({ isOpen, onClose, triggerRef }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && 
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

  const handleMenuItemClick = (action) => {
    onClose();
    
    switch (action) {
      case 'profile':
        navigate('/app/profile');
        break;
      case 'edit-profile':
        navigate('/app/profile/edit');
        break;
      case 'settings':
        navigate('/app/settings');
        break;
      case 'logout':
        // Use centralized logout from AuthContext
        logout();
        break;
    }
  };

  const getPosition = () => {
    if (!triggerRef.current) return {};
    
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 300;
    
    // Calculate position to avoid overlapping with search overlay
    let left = rect.right - menuWidth;
    let top = rect.bottom + 8;
    
    // Ensure the menu doesn't go off the right edge of the screen
    if (left + menuWidth > window.innerWidth - 16) {
      left = window.innerWidth - menuWidth - 16;
    }
    
    // Ensure the menu doesn't go off the left edge of the screen
    if (left < 16) {
      left = 16;
    }
    
    // Ensure the menu doesn't go off the top edge of the screen
    if (top < 16) {
      top = 16;
    }
    
    return {
      top: top,
      left: left
    };
  };

  if (!isOpen) return null;

  const position = getPosition();

  return (
    <UIPortal>
      <div 
        ref={menuRef}
        className="account-menu glass-card"
        style={position}
        role="menu"
        aria-label="Account menu"
      >
        <div className="account-menu-header">
          <div className="account-menu-name">{user?.name || 'User'}</div>
          <div className="account-menu-email">{user?.email || 'user@example.com'}</div>
        </div>

        <div
          className="account-menu-item"
          role="menuitem"
          tabIndex={0}
          onClick={() => handleMenuItemClick('profile')}
          onKeyDown={(e) => e.key === 'Enter' && handleMenuItemClick('profile')}
        >
          <i className="uil uil-user account-menu-item-icon"></i>
          <span className="account-menu-item-text">Profile</span>
        </div>

        <div
          className="account-menu-item"
          role="menuitem"
          tabIndex={0}
          onClick={() => handleMenuItemClick('edit-profile')}
          onKeyDown={(e) => e.key === 'Enter' && handleMenuItemClick('edit-profile')}
        >
          <i className="uil uil-edit account-menu-item-icon"></i>
          <span className="account-menu-item-text">Edit Profile</span>
        </div>

        <div
          className="account-menu-item"
          role="menuitem"
          tabIndex={0}
          onClick={() => handleMenuItemClick('settings')}
          onKeyDown={(e) => e.key === 'Enter' && handleMenuItemClick('settings')}
        >
          <i className="uil uil-setting account-menu-item-icon"></i>
          <span className="account-menu-item-text">Settings</span>
        </div>

        <div className="account-menu-divider"></div>

        <div
          className="account-menu-item"
          role="menuitem"
          tabIndex={0}
          onClick={() => handleMenuItemClick('logout')}
          onKeyDown={(e) => e.key === 'Enter' && handleMenuItemClick('logout')}
        >
          <i className="uil uil-sign-out-alt account-menu-item-icon"></i>
          <span className="account-menu-item-text">Sign out</span>
        </div>
      </div>
    </UIPortal>
  );
};

export default AccountMenu;