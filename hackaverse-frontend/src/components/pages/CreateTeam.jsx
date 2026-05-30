import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';

export default function CreateTeam() {
  const { hackathonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hackathon, setHackathon] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedMembers, setInvitedMembers] = useState([]);
  const [formData, setFormData] = useState({
    team_name: '',
    project_title: ''
  });

  useEffect(() => {
    if (hackathonId) {
      fetchHackathon();
    }
  }, [hackathonId]);

  const fetchHackathon = async () => {
    try {
      const response = await apiService.hackathons.getActive();
      const found = response.data.data.find(h => h.id === hackathonId);
      if (found) {
        setHackathon(found);
      } else {
        setError('Hackathon not found');
      }
    } catch (err) {
      setError('Failed to load hackathon details');
    }
  };

  const handleAddMember = () => {
    if (!inviteEmail.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setError('Invalid email address');
      return;
    }
    if (invitedMembers.includes(inviteEmail)) {
      setError('Member already added');
      return;
    }
    setInvitedMembers([...invitedMembers, inviteEmail]);
    setInviteEmail('');
    setError('');
  };

  const handleRemoveMember = (email) => {
    setInvitedMembers(invitedMembers.filter(m => m !== email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.team_name.trim()) {
      setError('Team name is required');
      return;
    }
    if (!formData.project_title.trim()) {
      setError('Project idea is required');
      return;
    }

    try {
      setLoading(true);
      
      // Create team
      const response = await apiService.teams.create({
        hackathon_id: hackathonId,
        team_name: formData.team_name,
        project_title: formData.project_title,
        leader_id: String(user?.id || user?.email || 'current_user')
      });
      
      console.log('Create Team Response:', response);
      
      if (response.data.success) {
        const teamId = response.data.data.team_id;
        
        // Store team info
        localStorage.setItem('team_id', teamId);
        localStorage.setItem('hackathon_id', hackathonId);
        
        // Send invitations (non-blocking)
        if (invitedMembers.length > 0) {
          Promise.all(
            invitedMembers.map(email => 
              apiService.teams.sendInvitation({
                team_id: teamId,
                invitee_email: email
              }).catch(err => console.error('Failed to send invitation to', email, err))
            )
          );
        }
        
        // Show success message
        toast.success('Team created successfully!');
        
        // Small delay to ensure backend processing completes
        setTimeout(() => {
          navigate('/app/teams', { replace: true });
        }, 500);
      } else {
        setError(response.data.message || 'Failed to create team');
        toast.error('Failed to create team');
      }
    } catch (err) {
      console.error('Create team error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to create team';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!hackathon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--neon-cyan)', borderTopColor: 'transparent' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading hackathon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-0">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Create Team</h1>
          <p style={{ color: 'var(--text-secondary)' }}>for {hackathon.name}</p>
        </div>

        <div className="glass-card rounded-2xl border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Team Name *
              </label>
              <input
                type="text"
                value={formData.team_name}
                onChange={(e) => setFormData({...formData, team_name: e.target.value})}
                placeholder="Enter your team name"
                required
                disabled={loading}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none disabled:opacity-50"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Project Idea / Title *
              </label>
              <textarea
                value={formData.project_title}
                onChange={(e) => setFormData({...formData, project_title: e.target.value})}
                placeholder="What will you build?"
                required
                disabled={loading}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none disabled:opacity-50 resize-none"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Invite Teammates (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMember())}
                  placeholder="teammate@email.com"
                  disabled={loading}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none disabled:opacity-50"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={loading}
                  className="px-4 py-2 font-medium rounded-lg transition-colors disabled:opacity-50"
                  style={{ background: 'var(--neon-gradient)', color: '#FFFFFF' }}
                >
                  + Add
                </button>
              </div>
            </div>

            {invitedMembers.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Invited Members ({invitedMembers.length})
                </label>
                <div className="space-y-2">
                  {invitedMembers.map((email, index) => (
                    <div key={index} className="flex items-center justify-between border rounded-lg px-3 py-2" style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(email)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> You will be the team leader. Invited members will receive an invitation to join your team.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/app')}
                disabled={loading}
                className="flex-1 px-4 py-2 border rounded-lg transition-colors disabled:opacity-50"
                style={{ borderColor: 'rgba(255, 255, 255, 0.2)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
                style={{ background: 'var(--neon-gradient)', color: '#FFFFFF' }}
              >
                {loading ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
