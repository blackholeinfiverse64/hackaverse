import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import InviteJudgeModal from './InviteJudgeModal';

const AdminSettings = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isInviteJudgeModalOpen, setIsInviteJudgeModalOpen] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    eventName: 'HackaVerse 2025',
    seasonLabel: 'S02',
    timezone: 'UTC-5',
    registrationOpen: '2024-01-01',
    registrationClose: '2024-03-01',
    submissionOpen: '2024-02-15',
    submissionClose: '2024-03-15',
    prizePool: '50000'
  });

  const [tracks] = useState([
    { id: 1, name: 'AI/ML', enabled: true, order: 1 },
    { id: 2, name: 'Web3', enabled: true, order: 2 },
    { id: 3, name: 'Gaming', enabled: true, order: 3 },
    { id: 4, name: 'Open Innovation', enabled: true, order: 4 }
  ]);

  const [judges] = useState([
    { id: 1, name: 'Dr. Sarah Chen', email: 'sarah.chen@email.com', expertise: 'AI/ML', assigned: 12 },
    { id: 2, name: 'Michael Rodriguez', email: 'michael.r@email.com', expertise: 'Web3', assigned: 8 },
    { id: 3, name: 'Dr. Lisa Wang', email: 'lisa.wang@email.com', expertise: 'Gaming', assigned: 15 }
  ]);

  const [announcements] = useState([
    { id: 1, title: 'Welcome to HackaVerse 2025', target: 'all', sent: '2024-01-15 10:00', status: 'sent' },
    { id: 2, title: 'Submission Deadline Reminder', target: 'participants', sent: '2024-03-10 14:30', status: 'sent' }
  ]);

  const tabs = [
    { id: 'general', label: 'General', icon: 'uil-setting' },
    { id: 'tracks', label: 'Tracks & Categories', icon: 'uil-sitemap' },
    { id: 'judges', label: 'Judges', icon: 'uil-user-check' },
    { id: 'announcements', label: 'Announcements', icon: 'uil-megaphone' },
    { id: 'integrations', label: 'Integrations', icon: 'uil-link' },
    { id: 'access', label: 'Access Control', icon: 'uil-shield-check' }
  ];

  const handleSave = () => {
    setShowToast(true);
    setHasChanges(false);
    setTimeout(() => setShowToast(false), 3000);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-text-secondary text-sm mb-2">Event Name</label>
                <input
                  type="text"
                  value={generalSettings.eventName}
                  onChange={(e) => {
                    setGeneralSettings({...generalSettings, eventName: e.target.value});
                    setHasChanges(true);
                  }}
                  className="form-control"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-2">Season Label</label>
                <input
                  type="text"
                  value={generalSettings.seasonLabel}
                  onChange={(e) => {
                    setGeneralSettings({...generalSettings, seasonLabel: e.target.value});
                    setHasChanges(true);
                  }}
                  className="form-control"
                />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-2">Timezone</label>
                <select
                  value={generalSettings.timezone}
                  onChange={(e) => {
                    setGeneralSettings({...generalSettings, timezone: e.target.value});
                    setHasChanges(true);
                  }}
                  className="form-control"
                >
                  <option value="UTC-5">UTC-5 (EST)</option>
                  <option value="UTC-8">UTC-8 (PST)</option>
                  <option value="UTC+0">UTC+0 (GMT)</option>
                </select>
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-2">Prize Pool ($)</label>
                <input
                  type="number"
                  value={generalSettings.prizePool}
                  onChange={(e) => {
                    setGeneralSettings({...generalSettings, prizePool: e.target.value});
                    setHasChanges(true);
                  }}
                  className="form-control"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Important Dates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Registration Opens</label>
                  <input
                    type="date"
                    value={generalSettings.registrationOpen}
                    onChange={(e) => {
                      setGeneralSettings({...generalSettings, registrationOpen: e.target.value});
                      setHasChanges(true);
                    }}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Registration Closes</label>
                  <input
                    type="date"
                    value={generalSettings.registrationClose}
                    onChange={(e) => {
                      setGeneralSettings({...generalSettings, registrationClose: e.target.value});
                      setHasChanges(true);
                    }}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Submission Window Opens</label>
                  <input
                    type="date"
                    value={generalSettings.submissionOpen}
                    onChange={(e) => {
                      setGeneralSettings({...generalSettings, submissionOpen: e.target.value});
                      setHasChanges(true);
                    }}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Submission Window Closes</label>
                  <input
                    type="date"
                    value={generalSettings.submissionClose}
                    onChange={(e) => {
                      setGeneralSettings({...generalSettings, submissionClose: e.target.value});
                      setHasChanges(true);
                    }}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'tracks':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Manage Tracks</h3>
              <button
                className="btn-primary h-10 px-4 text-sm"
                onClick={() => alert('Add Track functionality - opens modal to add new track')}
              >
                Add Track
              </button>
            </div>
            <div className="space-y-3">
              {tracks.map(track => (
                <div key={track.id} className="glass-card rounded-xl border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="cursor-move text-text-muted">
                      <i className="uil uil-draggabledots"></i>
                    </div>
                    <div>
                      <div className="font-medium text-white">{track.name}</div>
                      <div className="text-xs text-text-muted">Order: {track.order}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={track.enabled} className="rounded" />
                      <span className="text-sm text-text-secondary">Enabled</span>
                    </label>
                    <button
                      className="text-text-muted hover:text-white"
                      onClick={() => alert(`Edit track: ${track.name}`)}
                    >
                      <i className="uil uil-edit"></i>
                    </button>
                    <button
                      className="text-error hover:text-white"
                      onClick={() => alert(`Delete track: ${track.name}`)}
                    >
                      <i className="uil uil-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'judges':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Judge Directory</h3>
              <div className="flex gap-2">
                <button
                  className="btn-secondary h-10 px-4 text-sm"
                  onClick={() => alert('Import CSV functionality - opens file picker to import judges from CSV')}
                >
                  Import CSV
                </button>
                <button className="btn-primary h-10 px-4 text-sm" onClick={() => setIsInviteJudgeModalOpen(true)}>Invite Judge</button>
              </div>
            </div>
            <div className="glass-card rounded-2xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-bg-card border-b border-white/10">
                  <tr className="h-12">
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">Name</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">Email</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">Expertise</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">Assigned</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {judges.map(judge => (
                    <tr key={judge.id} className="border-b border-white/5 hover:bg-white/5 transition-colors h-14">
                      <td className="px-5 py-3 text-white font-medium">{judge.name}</td>
                      <td className="px-5 py-3 text-text-secondary">{judge.email}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-1 bg-violet/20 text-violet rounded text-xs font-medium">
                          {judge.expertise}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-white">{judge.assigned}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            className="text-cyan hover:text-white text-sm"
                            onClick={() => alert(`Edit judge: ${judge.name}`)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-error hover:text-white text-sm"
                            onClick={() => alert(`Revoke judge: ${judge.name}`)}
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'announcements':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Announcements</h3>
              <button
                className="btn-primary h-10 px-4 text-sm"
                onClick={() => alert('Compose Announcement functionality - opens announcement composer modal')}
              >
                Compose Announcement
              </button>
            </div>
            
            <div className="glass-card rounded-2xl border p-5">
              <h4 className="font-semibold text-white mb-4">Compose New Announcement</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Title</label>
                  <input type="text" placeholder="Announcement title..." className="form-control" />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Target Audience</label>
                  <select className="form-control">
                    <option value="all">All Participants</option>
                    <option value="participants">Participants Only</option>
                    <option value="judges">Judges Only</option>
                    <option value="track">Specific Track</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Message</label>
                  <textarea 
                    rows="4" 
                    placeholder="Write your announcement..." 
                    className="form-control resize-none"
                  ></textarea>
                </div>
                <div className="flex gap-3">
                  <button
                    className="btn-secondary"
                    onClick={() => alert('Preview Announcement functionality - shows preview of announcement')}
                  >
                    Preview
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => alert('Send Announcement functionality - sends announcement to selected audience')}
                  >
                    Send Announcement
                  </button>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl border overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <h4 className="font-semibold text-white">Sent Announcements</h4>
              </div>
              <table className="w-full">
                <thead className="bg-bg-card border-b border-white/10">
                  <tr className="h-12">
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">Title</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">Target</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">Sent</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map(announcement => (
                    <tr key={announcement.id} className="border-b border-white/5 hover:bg-white/5 transition-colors h-14">
                      <td className="px-5 py-3 text-white font-medium">{announcement.title}</td>
                      <td className="px-5 py-3 text-text-secondary">{announcement.target}</td>
                      <td className="px-5 py-3 text-text-muted text-sm">{announcement.sent}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-1 bg-success/20 text-success rounded text-xs font-medium">
                          {announcement.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">API & Integrations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-text-secondary text-sm mb-2">API Base URL</label>
                <input type="url" placeholder="https://api.hackaverse.com" className="form-control" />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-2">Webhook Endpoint</label>
                <input type="url" placeholder="https://hooks.hackaverse.com" className="form-control" />
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-2">API Key</label>
                <div className="flex gap-2">
                  <input type="password" value="••••••••••••••••" className="form-control" readOnly />
                  <button
                    className="btn-secondary h-11 px-4"
                    onClick={() => alert('Regenerate API Key functionality - generates new API key')}
                  >
                    Regenerate
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-text-secondary text-sm mb-2">Connection Status</label>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-success/20 text-success rounded text-xs font-medium">Connected</span>
                  <button
                    className="btn-secondary h-10 px-4 text-sm"
                    onClick={() => alert('Test Connection functionality - tests API connection and shows status')}
                  >
                    Test Connection
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'access':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Access Control Matrix</h3>
            <div className="glass-card rounded-2xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-bg-card border-b border-white/10">
                  <tr className="h-12">
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary">Action</th>
                    <th className="text-center px-5 py-3 font-semibold text-text-secondary">Admin</th>
                    <th className="text-center px-5 py-3 font-semibold text-text-secondary">Judge</th>
                    <th className="text-center px-5 py-3 font-semibold text-text-secondary">Participant</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    'Manage Users',
                    'Create Projects',
                    'Submit Projects',
                    'Review Submissions',
                    'View Analytics',
                    'Send Announcements'
                  ].map(action => (
                    <tr key={action} className="border-b border-white/5 h-14">
                      <td className="px-5 py-3 text-white">{action}</td>
                      <td className="px-5 py-3 text-center">
                        <input type="checkbox" defaultChecked className="rounded" />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <input type="checkbox" defaultChecked={action === 'Review Submissions'} className="rounded" />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <input type="checkbox" defaultChecked={action.includes('Projects')} className="rounded" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-0">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Settings</h1>
          <p className="text-text-muted">Configure hackathon settings and preferences</p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6">
        {/* Sidebar Tabs */}
        <div className="space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left p-3 rounded-xl transition-colors flex items-center gap-3 ${
                activeTab === tab.id
                  ? 'bg-cyan text-charcoal'
                  : 'text-text-secondary hover:text-white hover:bg-white/10'
              }`}
            >
              <i className={`uil ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass-card rounded-2xl border p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Sticky Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gunmetal border border-white/20 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <span className="text-white">You have unsaved changes</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setHasChanges(false)}
              className="btn-secondary h-10 px-4 text-sm"
            >
              Discard
            </button>
            <button 
              onClick={handleSave}
              className="btn-primary h-10 px-4 text-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-6 right-6 bg-success text-white px-6 py-3 rounded-xl shadow-lg">
          Settings saved successfully!
        </div>
      )}

      <InviteJudgeModal isOpen={isInviteJudgeModalOpen} onClose={() => setIsInviteJudgeModalOpen(false)} />
      </div>
    </div>
  );
};

export default AdminSettings;