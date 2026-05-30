import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import TeamInviteModal from './TeamInviteModal';

const Teams = () => {
  const [myTeam, setMyTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    fetchMyTeam();
  }, [location.pathname]);

  const fetchMyTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.teams.getAll();
      console.log('Fetch Teams Response:', response);
      
      const data = response.data;
      
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        // /teams/list is already user-specific in backend; take first matching team.
        let userTeam = data.data[0];

        const storedTeamId = localStorage.getItem('team_id');
        if (storedTeamId) {
          const teamFromStorage = data.data.find((team) => team.team_id === storedTeamId);
          if (teamFromStorage) {
            userTeam = teamFromStorage;
          }
        }

        if (!userTeam && user) {
          userTeam = data.data.find((team) => {
            const normalizedUserIds = [user?.user_id, user?.id, user?.email].filter(Boolean);
            if (team.leader_id && normalizedUserIds.includes(team.leader_id)) return true;
            if (!team.members) return false;

            return team.members.some((member) => {
              if (typeof member === 'string') {
                return normalizedUserIds.includes(member);
              }
              if (typeof member === 'object') {
                return normalizedUserIds.includes(member.user_id || member.id || member.email);
              }
              return false;
            });
          });
        }

        if (userTeam) {
          console.log('User team found:', userTeam);
          setMyTeam(userTeam);
          localStorage.setItem('team_id', userTeam.team_id);
        } else {
          console.log('No team found for user');
          setMyTeam(null);
        }
      } else {
        console.log('No teams in response');
        setMyTeam(null);
      }
    } catch (err) {
      console.error('Failed to fetch team:', err);
      setError(err.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-0">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>My Team</h1>
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--neon-cyan)' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-0">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>My Team</h1>
          <div className="glass-card rounded-2xl border p-8 text-center" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <i className="uil uil-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
            <button
              onClick={fetchMyTeam}
              className="mt-4 px-6 py-2 rounded-lg transition-colors"
              style={{ background: 'var(--neon-gradient)', color: '#FFFFFF' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-0">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>My Team</h1>
          <div className="flex gap-2">
            <button
              onClick={fetchMyTeam}
              disabled={loading}
              className="font-medium px-4 py-2 rounded-lg transition-colors border"
              style={{ borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)' }}
              title="Refresh team data"
            >
              <i className={`uil uil-refresh ${loading ? 'animate-spin' : ''}`}></i>
            </button>
            {!myTeam && (
              <button
                onClick={() => navigate('/join-hackathon')}
                className="font-medium px-4 py-2 rounded-lg transition-colors"
                style={{ background: 'var(--neon-gradient)', color: '#FFFFFF' }}
              >
                Join Hackathon
              </button>
            )}
          </div>
        </div>
        
        {!myTeam ? (
          <div className="glass-card rounded-2xl border p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <i className="uil uil-users-alt text-3xl" style={{ color: 'var(--text-muted)' }}></i>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No team found</h3>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Join a hackathon and create a team to get started!</p>
            <button
              onClick={() => navigate('/join-hackathon')}
              className="font-medium px-6 py-2 rounded-lg transition-colors"
              style={{ background: 'var(--neon-gradient)', color: '#FFFFFF' }}
            >
              Join Hackathon
            </button>
          </div>
        ) : (
          <div className="glass-card rounded-2xl border p-6" style={{ borderColor: 'var(--neon-cyan)', background: 'rgba(var(--neon-cyan-rgb, 45, 183, 209), 0.05)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{myTeam.team_name}</h3>
                  <span className="px-2 py-1 text-xs rounded-full" style={{ background: 'rgba(var(--neon-cyan-rgb, 45, 183, 209), 0.2)', color: 'var(--neon-cyan)' }}>
                    Your Team
                  </span>
                </div>
                {myTeam.project_title && (
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{myTeam.project_title}</p>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <i className="uil uil-calendar-alt" style={{ color: 'var(--text-muted)' }}></i>
                <span style={{ color: 'var(--text-secondary)' }}>Created:</span>
                <span style={{ color: 'var(--text-primary)' }}>{new Date(myTeam.created_at).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <i className="uil uil-users-alt" style={{ color: 'var(--text-muted)' }}></i>
                <span style={{ color: 'var(--text-secondary)' }}>Members:</span>
                <span style={{ color: 'var(--text-primary)' }}>{myTeam.members?.length || 1}</span>
              </div>

              {myTeam.members && myTeam.members.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Team Members:</p>
                  <div className="flex flex-wrap gap-2">
                    {myTeam.members.map((member, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 text-xs rounded-lg"
                        style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}
                      >
                        {typeof member === 'string' ? member : member.name || member.email}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button
                onClick={() => navigate('/app/submissions')}
                className="flex-1 font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                style={{ background: 'var(--neon-gradient)', color: '#FFFFFF' }}
              >
                Submit Project
              </button>
              <button
                className="px-4 py-2 border rounded-lg transition-colors text-sm"
                style={{ borderColor: 'rgba(255, 255, 255, 0.2)', color: 'var(--text-secondary)' }}
                onClick={() => setIsInviteModalOpen(true)}
              >
                Invite Members
              </button>
            </div>

            <TeamInviteModal
              isOpen={isInviteModalOpen}
              onClose={() => setIsInviteModalOpen(false)}
              teamId={myTeam.team_id}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;
