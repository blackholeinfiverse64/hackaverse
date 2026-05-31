import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateTeamModal from './CreateTeamModal';
import api from '../../services/api';

const ParticipantHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userTeam, setUserTeam] = useState(null);

  useEffect(() => {
    fetchHackathons();
    fetchAnnouncements();
    checkUserTeam();
    
    // Refresh announcements every 10 seconds
    const announcementInterval = setInterval(fetchAnnouncements, 10000);
    return () => clearInterval(announcementInterval);
  }, []);

  const fetchHackathons = async () => {
    try {
      const response = await api.get('/hackathons/active');
      const data = response.data;
      if (data.success) {
        const hData = data.data;
        setHackathons(Array.isArray(hData) ? hData : (hData?.items || []));
      } else {
        setHackathons([]);
      }
    } catch (error) {
      console.error('Failed to fetch hackathons:', error);
      setHackathons([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/notifications/announcements');
      const data = response.data;
      console.log('[ParticipantHome] Announcements response:', data);
      if (data.success && Array.isArray(data.data)) {
        setAnnouncements(data.data);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('[ParticipantHome] Failed to fetch announcements:', error);
      setAnnouncements([]);
    }
  };

  const checkUserTeam = () => {
    const teamId = localStorage.getItem('team_id');
    const hackathonId = localStorage.getItem('hackathon_id');
    if (teamId && hackathonId) {
      setUserTeam({ team_id: teamId, hackathon_id: hackathonId });
    }
  };

  const handleJoinHackathon = async (hackathon) => {
    try {
      localStorage.setItem('joining_hackathon_id', hackathon.id);
      localStorage.setItem('joining_hackathon_name', hackathon.name);
      navigate(`/create-team/${hackathon.id}`);
    } catch (error) {
      console.error('Failed to join hackathon:', error);
    }
  };

  const handleJoinSuccess = (teamData) => {
    setUserTeam(teamData);
    setShowJoinModal(false);
    // Refresh hackathons to update participant counts
    fetchHackathons();
  };

  const HackathonCard = ({ hackathon }) => {
    const isActive = hackathon.status === 'active';
    const hasEnded = new Date(hackathon.end_date) < new Date();
    const isJoined = userTeam && userTeam.hackathon_id === hackathon.id;

    return (
      <div className="glass-card rounded-2xl border p-6 hover:border-cyan/40 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{hackathon.name}</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{hackathon.description}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            isActive && !hasEnded ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
          }`}>
            {hasEnded ? 'Ended' : isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>Start Date:</span>
            <span style={{ color: 'var(--text-primary)' }}>{new Date(hackathon.start_date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>End Date:</span>
            <span style={{ color: 'var(--text-primary)' }}>{new Date(hackathon.end_date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>Team Size:</span>
            <span style={{ color: 'var(--text-primary)' }}>{hackathon.min_team_size}-{hackathon.max_team_size} members</span>
          </div>
        </div>

        {isJoined ? (
          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/app/teams')}
              className="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg font-medium transition-colors hover:bg-green-500/30"
            >
              View My Team
            </button>
            <button 
              onClick={() => navigate('/app/submissions')}
              className="flex-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-lg font-medium transition-colors hover:bg-blue-500/30"
            >
              Submit Project
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleJoinHackathon(hackathon)}
            disabled={!isActive || hasEnded}
            className="w-full font-medium px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
            style={{ 
              background: (!isActive || hasEnded) ? 'rgba(128, 128, 128, 0.2)' : 'var(--neon-gradient)',
              color: (!isActive || hasEnded) ? 'rgba(128, 128, 128, 0.6)' : '#FFFFFF'
            }}
          >
            {hasEnded ? 'Hackathon Ended' : !isActive ? 'Not Active' : 'Join Hackathon'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-0">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>Participant Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>Join hackathons and build amazing projects</p>
          </div>
          <div className="flex items-center gap-2">
            {userTeam && (
              <button
                onClick={() => navigate('/app/teams')}
                className="btn-primary h-11 px-6"
              >
                <i className="uil uil-users-alt mr-2"></i>
                My Team
              </button>
            )}
            <button
              onClick={() => navigate('/leaderboard')}
              className="btn-secondary h-11 px-6"
            >
              <i className="uil uil-trophy mr-2"></i>
              Leaderboard
            </button>
          </div>
        </div>

        {/* User Status */}
        {userTeam && (
          <div className="glass-card rounded-2xl border p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <i className="uil uil-check text-green-400 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>You're participating!</h3>
                <p style={{ color: 'var(--text-secondary)' }}>You have joined a hackathon. Check your team progress and submit your project.</p>
              </div>
            </div>
          </div>
        )}

        {announcements.length > 0 && (
          <div className="glass-card rounded-2xl border p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Announcements</h3>
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement._id || announcement.id} className="bg-white text-black p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-1">{announcement.title}</h4>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{announcement.message}</p>
                  <small className="text-xs text-gray-500">{new Date(announcement.created_at).toLocaleString()}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Hackathons */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Available Hackathons</h2>
            <button
              onClick={fetchHackathons}
              className="transition-colors"
              style={{ color: 'var(--neon-cyan)' }}
            >
              <i className="uil uil-refresh mr-1"></i>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card rounded-2xl border p-6 animate-pulse">
                  <div className="bg-white/10 h-6 rounded mb-4"></div>
                  <div className="bg-white/10 h-4 rounded mb-2"></div>
                  <div className="bg-white/10 h-4 rounded mb-4"></div>
                  <div className="bg-white/10 h-10 rounded"></div>
                </div>
              ))}
            </div>
          ) : hackathons.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="uil uil-calendar-alt text-2xl" style={{ color: 'var(--text-muted)' }}></i>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No hackathons available</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Check back later for new hackathons to join!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hackathons.map(hackathon => (
                <HackathonCard key={hackathon.id} hackathon={hackathon} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-2xl border p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/app/teams')}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
            >
              <i className="uil uil-users-alt text-xl mb-2 block" style={{ color: 'var(--neon-cyan)' }}></i>
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>View Teams</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Browse all teams</div>
            </button>
            <button
              onClick={() => navigate('/app/submissions')}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
            >
              <i className="uil uil-file-upload-alt text-xl mb-2 block" style={{ color: 'var(--neon-cyan)' }}></i>
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Submissions</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>View all submissions</div>
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
            >
              <i className="uil uil-trophy text-xl mb-2 block" style={{ color: 'var(--neon-cyan)' }}></i>
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Leaderboard</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>See rankings</div>
            </button>
            <button
              onClick={() => navigate('/mentors')}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
            >
              <i className="uil uil-user-check text-xl mb-2 block" style={{ color: 'var(--neon-cyan)' }}></i>
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Mentors</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Get help</div>
            </button>
          </div>
        </div>
      </div>

      {/* Create Team Modal */}
      {showJoinModal && selectedHackathon && (
        <CreateTeamModal
          hackathon={selectedHackathon}
          onClose={() => {
            setShowJoinModal(false);
            setSelectedHackathon(null);
          }}
          onSuccess={handleJoinSuccess}
        />
      )}
    </div>
  );
};

export default ParticipantHome;