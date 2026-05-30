import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSyncContext } from '../../contexts/SyncContext';
import InviteParticipantModal from './InviteParticipantModal';

const AdminParticipants = () => {
  const { logout } = useAuth();
  const { teams, hackathons, participants: syncParticipants } = useSyncContext();
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all'
  });
  const [selectedItems] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState('all');

  useEffect(() => {
    const participantsData = [];
    
    syncParticipants.forEach(participant => {
      const userTeam = teams.find(t => t.members?.some(m => {
        const memberId = typeof m === 'object' ? m.user_id : m;
        return memberId === participant.id;
      }));
      
      const hackathon = userTeam ? hackathons.find(h => h.id === userTeam.hackathon_id) : null;
      
      participantsData.push({
        id: participant.id,
        name: participant.name,
        email: participant.email,
        team: userTeam?.team_name || 'No Team',
        track: hackathon?.track || 'Open Innovation',
        projects: 1,
        role: 'participant',
        status: 'active',
        joined: userTeam ? new Date(userTeam.created_at).toLocaleDateString() : 'N/A'
      });
    });
    
    setParticipants(participantsData);
    setFilteredParticipants(participantsData);
  }, [syncParticipants, teams, hackathons]);

  useEffect(() => {
    if (selectedTrack === 'all') {
      setFilteredParticipants(participants);
    } else {
      setFilteredParticipants(participants.filter(p => p.track === selectedTrack));
    }
  }, [selectedTrack, participants]);

  const tracks = ['all', 'AI/ML', 'Web Development', 'Blockchain', 'Open Innovation'];
  const roles = ['all', 'participant', 'judge', 'admin'];
  const statuses = ['all', 'active', 'inactive'];

  const displayParticipants = filteredParticipants.filter(participant => {
    if (filters.search && !participant.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !participant.email.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.role !== 'all' && participant.role !== filters.role) return false;
    if (filters.status !== 'all' && participant.status !== filters.status) return false;
    return true;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-error bg-error/20';
      case 'judge': return 'text-violet bg-violet/20';
      case 'participant': return 'text-cyan bg-cyan/20';
      default: return 'text-text-muted bg-gunmetal';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-success bg-success/20';
      case 'inactive': return 'text-text-muted bg-gunmetal';
      default: return 'text-text-muted bg-gunmetal';
    }
  };

  const ParticipantDetailPanel = ({ participant, onClose }) => (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
      <div className="glass-card w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan/20 rounded-full flex items-center justify-center">
              <i className="uil uil-user text-cyan text-xl"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{participant.name}</h2>
              <p className="text-text-muted text-sm">{participant.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white p-1">
            <i className="uil uil-times text-xl"></i>
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-text-secondary text-sm">Role</label>
              <select className="form-control mt-1" defaultValue={participant.role}>
                <option value="participant">Participant</option>
                <option value="judge">Judge</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-text-secondary text-sm">Status</label>
              <select className="form-control mt-1" defaultValue={participant.status}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Teams & Projects</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Current Team</span>
                <span className="text-white">{participant.team || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Track</span>
                <span className="text-white">{participant.track}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Projects</span>
                <span className="text-white">{participant.projects}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Joined</span>
                <span className="text-white">{participant.joined}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn-secondary flex-1">Reset Password</button>
            <button className="btn-primary flex-1">Send Message</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-0 ">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">Participants</h1>
            <p className="text-text-muted">Manage hackathon participants and roles</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-primary h-11 px-6"
              title="Invite Participants"
              onClick={() => setIsInviteModalOpen(true)}
            >
              <i className="uil uil-user-plus mr-2"></i>
              Invite Participants
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Search participants..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="form-control h-11 w-64"
          />
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="form-control h-11 w-48"
          >
            {tracks.map(track => (
              <option key={track} value={track}>
                {track === 'all' ? 'All Tracks' : track}
              </option>
            ))}
          </select>
          <select
            value={filters.role}
            onChange={(e) => setFilters({...filters, role: e.target.value})}
            className="form-control h-11 w-32"
          >
            {roles.map(role => (
              <option key={role} value={role}>
                {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="form-control h-11 w-32"
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-cyan/10 border border-cyan/30 rounded-2xl">
            <span className="text-cyan font-medium">{selectedItems.length} selected</span>
            <div className="flex gap-2">
              <button className="btn-primary h-10 px-4 text-sm">Invite to Team</button>
              <button className="btn-secondary h-10 px-4 text-sm">Enable/Disable</button>
              <button className="btn-secondary h-10 px-4 text-sm">Export CSV</button>
            </div>
          </div>
        )}

        {/* Participants Table */}
        <div className="glass-card rounded-2xl border overflow-hidden">
          {displayParticipants.length === 0 ? (
            <div className="p-12 text-center">
              <i className="uil uil-users-alt text-4xl text-text-muted mb-4"></i>
              <h3 className="text-lg font-semibold text-white mb-2">No participants found</h3>
              <p className="text-text-muted mb-4">
                {participants.length === 0 
                  ? 'Invite participants to start your hackathon.'
                  : selectedTrack !== 'all'
                  ? `No participants found for ${selectedTrack} track.`
                  : 'No participants match your current filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-card border-b border-white/10">
                  <tr className="h-12">
                    <th className="text-left px-5 py-3 w-12">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[250px]">Participant</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[150px]">Team</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[120px]">Track</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[100px]">Projects</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[120px]">Role</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[100px]">Status</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[120px]">Joined</th>
                    <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[140px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayParticipants.map(participant => (
                    <tr key={participant.id} className="border-b border-white/5 hover:bg-white/5 transition-colors h-14">
                      <td className="px-5 py-3">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <div className="font-medium text-white">{participant.name}</div>
                          <div className="text-xs text-text-muted">{participant.email}</div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {participant.team && participant.team !== 'No Team' ? (
                          <span className="px-2 py-1 bg-violet/20 text-violet rounded text-xs font-medium">
                            {participant.team}
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-white">{participant.track}</td>
                      <td className="px-5 py-3 text-white">{participant.projects}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(participant.role)}`}>
                          {participant.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(participant.status)}`}>
                          {participant.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-text-muted text-sm">{participant.joined}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedParticipant(participant)}
                            className="text-cyan hover:text-white text-sm"
                          >
                            View
                          </button>
                          <button className="text-text-muted hover:text-white text-sm">
                            {participant.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedParticipant && (
          <ParticipantDetailPanel
            participant={selectedParticipant}
            onClose={() => setSelectedParticipant(null)}
          />
        )}

        <InviteParticipantModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onSend={(data) => {
            console.log('Sending invitation:', data);
          }}
        />
      </div>
    </div>
  );
};

export default AdminParticipants;
