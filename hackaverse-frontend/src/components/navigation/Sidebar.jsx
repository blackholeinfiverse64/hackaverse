import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Tooltip from '../ui/Tooltip';

const Sidebar = ({ items, isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const { logout } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'c' || e.key === 'C') {
        if (!e.target.matches('input, textarea, [contenteditable]')) {
          onToggleCollapse(!isCollapsed);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed, onToggleCollapse]);

  const isActive = (path) => location.pathname === path;

  const NavItem = ({ item, isCollapsed }) => {
    const active = isActive(item.path);
    
    const itemContent = (
      <Link
        to={item.path}
        className={`group flex items-center h-11 rounded-xl transition-all relative ${
          isCollapsed 
            ? 'w-11 justify-center mx-auto' 
            : 'gap-3 px-3'
        } ${
          active 
            ? 'border' 
            : 'hover:bg-white/10 dark:hover:bg-white/10'
        }`}
        style={{
          color: 'var(--text-primary)',
          background: active ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          borderColor: active ? 'rgba(var(--neon-cyan-rgb, 45, 183, 209), 0.3)' : 'transparent'
        }}
        aria-current={active ? 'page' : undefined}
      >
        {active && (
          <div className="absolute left-[-2px] top-2 bottom-2 w-[3px] rounded-r-sm" style={{ background: 'var(--neon-cyan)' }}></div>
        )}
        
        <div className="relative flex items-center justify-center">
          <i className={`${item.icon} text-xl min-w-[20px]`}></i>
          {item.hasPresence && (
            <div className="absolute right-1 top-1 w-2 h-2 bg-[#22C55E] rounded-full animate-pulse"></div>
          )}
        </div>
        
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)' }}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );

    return isCollapsed ? (
      <Tooltip content={item.label}>
        {itemContent}
      </Tooltip>
    ) : itemContent;
  };

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] border-r transition-all duration-300 z-30 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`} style={{ borderColor: 'rgba(var(--neon-cyan-rgb, 45, 183, 209), 0.2)', background: 'rgba(var(--bg-gradient-start-rgb, 13, 17, 40), 0.5)' }}>
      {/* Navigation */}
      <nav className="py-6 px-3 overflow-y-auto flex-1" role="navigation" aria-label="Primary">
        <div className="space-y-2">
          {items.map(item => (
            <NavItem key={item.path} item={item} isCollapsed={isCollapsed} />
          ))}
        </div>
      </nav>

      {/* Logout Button at Bottom */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(var(--neon-cyan-rgb, 45, 183, 209), 0.2)' }}>
        <button
          onClick={logout}
          className={`group flex items-center h-11 rounded-xl transition-all w-full ${
            isCollapsed ? 'justify-center' : 'gap-3 px-3'
          }`}
          style={{ color: 'var(--text-primary)' }}
          aria-label="Logout"
        >
          <div className="relative flex items-center justify-center">
            <i className="uil uil-sign-out-alt text-xl min-w-[20px]"></i>
          </div>
          {!isCollapsed && (
            <span className="flex-1">Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;