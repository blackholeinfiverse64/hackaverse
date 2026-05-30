import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import SearchOverlay from './SearchOverlay';
import AccountMenu from './AccountMenu';
import NotificationDropdown from './NotificationDropdown';

const Topbar = ({ onSearchOpen, onAccountMenuOpen }) => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [searchValue, setSearchValue] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const searchInputRef = useRef(null);
  const avatarRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && 
          document.activeElement.tagName !== 'INPUT' && 
          document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    setIsSearchOpen(value.length > 0 || document.activeElement === searchInputRef.current);
    
    // Notify parent components
    if (onSearchOpen) {
      onSearchOpen(value.length > 0 || document.activeElement === searchInputRef.current);
    }
  };

  const handleSearchFocus = () => {
    setIsSearchOpen(true);
    // Close account menu if open
    setIsAccountMenuOpen(false);
    
    // Notify parent components
    if (onSearchOpen) {
      onSearchOpen(true);
    }
    if (onAccountMenuOpen) {
      onAccountMenuOpen(false);
    }
  };

  const handleSearchBlur = () => {
    // Keep open if clicking within overlay
    setTimeout(() => {
      if (!searchInputRef.current?.matches(':focus')) {
        setIsSearchOpen(false);
        if (onSearchOpen) {
          onSearchOpen(false);
        }
      }
    }, 150);
  };

  const handleAccountMenuToggle = () => {
    const newState = !isAccountMenuOpen;
    // Close search and notifications if open
    if (newState) {
      setIsSearchOpen(false);
      setIsNotificationOpen(false);
      if (onSearchOpen) {
        onSearchOpen(false);
      }
    }

    // Notify parent components
    if (onAccountMenuOpen) {
      onAccountMenuOpen(newState);
    }
  };

  const handleNotificationToggle = () => {
    const newState = !isNotificationOpen;
    setIsNotificationOpen(newState);
    // Close search and account menu if open
    if (newState) {
      setIsSearchOpen(false);
      setIsAccountMenuOpen(false);
      if (onSearchOpen) {
        onSearchOpen(false);
      }
      if (onAccountMenuOpen) {
        onAccountMenuOpen(false);
      }
    }
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchValue('');
    searchInputRef.current?.blur();
    if (onSearchOpen) {
      onSearchOpen(false);
    }
  };

  const closeAccountMenu = () => {
    setIsAccountMenuOpen(false);
    if (onAccountMenuOpen) {
      onAccountMenuOpen(false);
    }
  };

  return (
    <header className="topbar" style={{
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      background: 'rgba(var(--bg-gradient-start-rgb, 13, 20, 59), 0.8)'
    }}>
      <div className="topbar-content">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--neon-gradient)' }}>
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>HackaVerse</span>
        </Link>

        {/* Search */}
        <div className="topbar-search relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search submissions, teams, projects... (Press / to focus)"
            value={searchValue}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            role="combobox"
            aria-expanded={isSearchOpen}
            aria-controls="search-results"
            aria-autocomplete="list"
          />
          
          <SearchOverlay
            isOpen={isSearchOpen}
            onClose={closeSearch}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            inputRef={searchInputRef}
          />
        </div>

        {/* Actions */}
        <div className="topbar-actions">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative p-2 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title="Toggle dark mode (Cmd+B)"
            aria-label="Toggle dark mode"
          >
            <i className={`uil ${isDark ? 'uil-sun' : 'uil-moon'} text-xl`}></i>
          </button>

          {/* Notifications */}
          <button
            ref={notificationRef}
            onClick={handleNotificationToggle}
            className="relative p-2 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title="Notifications"
            aria-label="Notifications"
            aria-expanded={isNotificationOpen}
          >
            <i className="uil uil-bell text-xl"></i>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* Avatar */}
          <button
            ref={avatarRef}
            className="avatar-button"
            onClick={handleAccountMenuToggle}
            aria-haspopup="menu"
            aria-expanded={isAccountMenuOpen}
          >
            {user?.name?.charAt(0) || 'U'}
          </button>

          <AccountMenu
            isOpen={isAccountMenuOpen}
            onClose={closeAccountMenu}
            triggerRef={avatarRef}
          />

          <NotificationDropdown
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            triggerRef={notificationRef}
          />
        </div>
      </div>
    </header>
  );
};

export default Topbar;