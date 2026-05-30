import React, { useState, useEffect, useRef } from 'react';
import NotificationDropdown from '../ui/NotificationDropdown';

const GlobalSearch = ({ onFocus, onBlur, isFocused }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions] = useState([
    { type: 'Submissions', items: ['AI Campus Navigator', 'Blockchain Voting', 'AR Study Assistant', 'Smart Waste Management'] },
    { type: 'Teams', items: ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta'] },
    { type: 'Projects', items: ['ML Trading Bot', 'IoT Dashboard', 'VR Learning Platform'] }
  ]);
  const inputRef = useRef(null);

  const filteredSuggestions = suggestions.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 3)
  })).filter(group => group.items.length > 0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        onFocus();
      }
      if (e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
        onFocus();
      }
      if (e.key === 'Escape') {
        onBlur();
        inputRef.current?.blur();
        setActiveIndex(-1);
      }
  if (isFocused) {
  const allItems = filteredSuggestions.flatMap(group => group.items);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveIndex(prev => (prev + 1) % allItems.length);
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveIndex(prev => prev <= 0 ? allItems.length - 1 : prev - 1);
        }
        if (e.key === 'Enter' && activeIndex >= 0) {
          e.preventDefault();
          setQuery(allItems[activeIndex]);
          onBlur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onFocus, onBlur, isFocused, activeIndex, filteredSuggestions]);

  return (
    <div className="relative flex-1 max-w-[640px]">
      <div className="relative">
        <i className="uil uil-search absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 min-w-[20px]"></i>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search submissions, teams, projects…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={onFocus}
          onBlur={() => setTimeout(onBlur, 200)}
          className="h-11 w-full rounded-xl bg-white/[0.04] border border-white/10 pl-10 pr-16 text-white placeholder-white/40 hover:border-white/20 focus:border-cyan focus:ring-2 focus:ring-cyan/40 transition-[border,box-shadow] duration-150"
          role="combobox"
          aria-expanded={isFocused}
          aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
          aria-label="Global search"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="text-[11px] px-1.5 py-0.5 rounded border border-white/15 text-white/70">⌘K</kbd>
          <span className="text-white/30">/</span>
          <kbd className="text-[11px] px-1.5 py-0.5 rounded border border-white/15 text-white/70">/</kbd>
        </div>
      </div>

      {isFocused && (
  <div className="absolute top-full left-0 right-0 mt-2 w-full max-w-[640px] rounded-xl border border-white/10 bg-gunmetal backdrop-blur glass-card shadow-[0_10px_30px_-15px_rgba(0,0,0,.6)] z-[60] max-h-80 overflow-y-auto">
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((group, groupIndex) => {
              let itemIndex = 0;
              if (groupIndex > 0) {
                itemIndex = filteredSuggestions.slice(0, groupIndex).reduce((acc, g) => acc + g.items.length, 0);
              }
              return (
                <div key={group.type} className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-white/60 uppercase tracking-wider">
                    {group.type}
                  </div>
                  {group.items.map((item, index) => {
                    const globalIndex = itemIndex + index;
                    return (
                      <button
                        key={index}
                        id={`search-item-${globalIndex}`}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm text-white transition-colors ${
                          activeIndex === globalIndex ? 'bg-cyan/20 text-cyan' : 'hover:bg-white/[0.05]'
                        }`}
                        onClick={() => {
                          setQuery(item);
                          onBlur();
                        }}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              );
            })
          ) : query ? (
            <div className="p-4 text-center text-white/60 text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <div className="p-4 text-center text-white/60 text-sm">
              Try searching for: submissions, teams, projects
            </div>
          )}
        </div>
      )}
    </div>
  );
};


const TopNav = ({ user, onLogout, sidebarWidth = 264 }) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsOpen && notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setNotificationsOpen(false);
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notificationsOpen, userMenuOpen]);

  return (
    <header
      className="fixed top-0 right-0 h-16 bg-[#0B1422]/80 backdrop-blur-lg border-b border-white/10 glass-card z-20"
      style={{
        left: `${sidebarWidth}px`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
    >
      <div className="h-16 grid grid-cols-[1fr_auto] items-center gap-4 px-6 xl:px-8">
        {/* Search */}
        <GlobalSearch 
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          isFocused={searchFocused}
        />

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              ref={notificationRef}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative h-10 w-10 rounded-xl border border-white/15 bg-white/[0.02] hover:bg-white/[0.06] transition-colors flex items-center justify-center"
              aria-label="Toggle notifications"
              aria-expanded={notificationsOpen}
            >
              <i className="uil uil-bell text-white/70 min-w-[20px]"></i>
              {hasUnreadNotifications && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#6CCAFF] rounded-full animate-pulse"></div>
              )}
            </button>
            <NotificationDropdown
              isOpen={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
              triggerRef={notificationRef}
            />
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              ref={userMenuRef}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 h-10 px-3 rounded-xl border border-white/15 bg-white/[0.02] hover:bg-white/[0.06] transition-colors"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
            >
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <img src={user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm text-white font-medium">{user?.name}</span>
              <i className="uil uil-angle-down text-white/70"></i>
            </button>

            {userMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur glass-card shadow-[0_10px_30px_-15px_rgba(0,0,0,.6)] z-50">
                <div className="p-2">
                  <div className="px-3 py-2 border-b border-white/10 mb-2">
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-white/60">{user?.email}</p>
                  </div>
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.05] text-sm text-white transition-colors">
                    <i className="uil uil-user mr-2"></i>
                    Profile
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.05] text-sm text-white transition-colors">
                    <i className="uil uil-cog mr-2"></i>
                    Settings
                  </button>
                  <hr className="border-white/10 my-2" />
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.05] text-sm text-red-400 transition-colors"
                  >
                    <i className="uil uil-sign-out-alt mr-2"></i>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;