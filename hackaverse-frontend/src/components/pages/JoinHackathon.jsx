import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function JoinHackathon() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hackathons/active');
      // API returns { data: { items: [...], pagination: {...} } }
      const hackathonList = response.data?.data?.items || [];
      setHackathons(hackathonList);
    } catch (error) {
      console.error('Failed to fetch hackathons:', error);
      setHackathons([]);
    } finally {
      setLoading(false);
    }
  };

  const joinHackathon = async (hackathonId) => {
    try {
      localStorage.setItem('joining_hackathon_id', hackathonId);
      navigate(`/create-team/${hackathonId}`);
    } catch (error) {
      console.error('Join error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-white mb-1">Join a Hackathon</h1>

      {loading ? (
        <p className="text-text-muted">Loading hackathons...</p>
      ) : hackathons.length === 0 ? (
        <div className="glass-card rounded-2xl border border-white/10 p-8 text-center">
          <p className="text-text-muted mb-4">No active hackathons available</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {hackathons.map((h) => (
            <div key={h.id} className="glass-card rounded-2xl border border-white/10 p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-white mb-2">{h.name}</h2>
                  <p className="text-text-secondary mb-4">{h.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-text-secondary">Start:</span> <span className="text-white">{new Date(h.start_date).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-text-secondary">End:</span> <span className="text-white">{new Date(h.end_date).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-text-secondary">Team Size:</span> <span className="text-white">{h.min_team_size}-{h.max_team_size} members</span>
                    </div>
                    <div>
                      <span className="font-medium text-text-secondary">Participants:</span> <span className="text-white">{h.participant_count || 0}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => joinHackathon(h.id)}
                  className="ml-6 bg-cyan hover:bg-cyan/80 text-black font-medium px-6 py-3 rounded-lg transition-all"
                >
                  Join Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
