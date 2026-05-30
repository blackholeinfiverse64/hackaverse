import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../navigation/Sidebar';
import Topbar from '../ui/Topbar';

const AuthenticatedLayout = ({ children }) => {
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // logout helper is available via useAuth() and toast if needed by components

  const adminSidebarItems = [
    { icon: 'uil-dashboard', label: 'Dashboard', path: '/admin' },
    { icon: 'uil-calendar-alt', label: 'Hackathons', path: '/admin/hackathons' },
    { icon: 'uil-users-alt', label: 'Participants', path: '/admin/participants' },
    { icon: 'uil-robot', label: 'HackaAgent', path: '/hacka-agent' },
    { icon: 'uil-cog', label: 'Settings', path: '/admin/settings' }
  ];

  const participantSidebarItems = [
    { icon: 'uil-home', label: 'Home', path: '/app' },
    { icon: 'uil-calendar-alt', label: 'Join Hackathon', path: '/join-hackathon' },
    { icon: 'uil-users-alt', label: 'My Team', path: '/app/teams' },
    { icon: 'uil-file-upload-alt', label: 'Submissions', path: '/app/submissions' },
    { icon: 'uil-robot', label: 'HackaAgent', path: '/hacka-agent' },
    { icon: 'uil-user-circle', label: 'Profile', path: '/app/profile' }
  ];

  const judgeSidebarItems = [
    { icon: 'uil-dashboard', label: 'Dashboard', path: '/judge' },
    { icon: 'uil-list-ul', label: 'Queue', path: '/judge/queue' },
    { icon: 'uil-edit', label: 'Manual Review', path: '/judge/manual-review' },
    { icon: 'uil-chart-line', label: 'My Scores', path: '/judge/scores' },
    { icon: 'uil-robot', label: 'HackaAgent', path: '/hacka-agent' },
    { icon: 'uil-file-alt', label: 'Logs', path: '/logs' }
  ];

  const getSidebarItems = () => {
    switch (user?.role) {
      case 'admin': return adminSidebarItems;
      case 'judge': return judgeSidebarItems;
      default: return participantSidebarItems;
    }
  };

  const sidebarItems = getSidebarItems();

  return (
    <div className="min-h-screen transition-all duration-300" style={{ background: 'linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%)' }}>
      <Topbar />
      <div className="flex">
        <Sidebar
          items={sidebarItems}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={setIsSidebarCollapsed}
        />
        <main className={`flex-1 min-h-screen overflow-y-auto transition-all duration-300 pt-16 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <div className="pb-8 px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;