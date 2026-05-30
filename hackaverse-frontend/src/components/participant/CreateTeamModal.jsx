import React, { useState } from 'react';
import { API_BASE_URL } from '../../constants/appConstants';
import { getApiKey } from '../../constants/apiKey';

const CreateTeamModal = ({ hackathon, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    team_name: '',
    project_title: '',
    leader_id: 'current_user_id'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/teams/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': getApiKey()
        },
        body: JSON.stringify({
          hackathon_id: hackathon.id,
          ...formData
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('team_id', data.data.team_id);
        onSuccess(data.data);
        onClose();
        window.location.href = '/app/teams';
      } else {
        setError(data.message || 'Failed to create team');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl border border-white/10 max-w-md w-full">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-semibold text-white">Create Your Team</h3>
          <p className="text-text-secondary text-sm mt-1">for {hackathon.name}</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Team Name *
              </label>
              <input
                type="text"
                value={formData.team_name}
                onChange={(e) => setFormData({...formData, team_name: e.target.value})}
                placeholder="Enter your team name"
                required
                disabled={loading}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:border-cyan/50 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Project Title *
              </label>
              <input
                type="text"
                value={formData.project_title}
                onChange={(e) => setFormData({...formData, project_title: e.target.value})}
                placeholder="What will you build?"
                required
                disabled={loading}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:border-cyan/50 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={onClose} 
                disabled={loading}
                className="flex-1 px-4 py-2 border border-white/20 text-text-secondary hover:text-white hover:border-white/40 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 bg-cyan hover:bg-cyan/80 text-black font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTeamModal;