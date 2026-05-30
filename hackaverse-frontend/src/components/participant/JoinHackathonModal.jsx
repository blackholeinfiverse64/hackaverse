import React, { useState } from 'react';
import { API_BASE_URL } from '../../constants/appConstants';
import { getApiKey } from '../../constants/apiKey';
import { useAuth } from '../../contexts/AuthContext';

const JoinHackathonModal = ({ hackathon, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    team_name: '',
    project_title: '',
    leader_id: user?.id || 'current_user_id'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!formData.team_name.trim()) {
      errors.team_name = 'Team name is required';
    } else if (formData.team_name.length < 3) {
      errors.team_name = 'Team name must be at least 3 characters';
    }
    
    if (!formData.project_title.trim()) {
      errors.project_title = 'Project title is required';
    } else if (formData.project_title.length < 5) {
      errors.project_title = 'Project title must be at least 5 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
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
        // Store team info for future use
        if (data.data?.team_id) {
          localStorage.setItem('team_id', data.data.team_id);
          localStorage.setItem('hackathon_id', hackathon.id);
        }
        
        onSuccess && onSuccess(data.data);
        onClose();
        
        // Show success message
        const successMsg = `Successfully created team "${formData.team_name}" and joined ${hackathon.name}!`;
        
        // Create a temporary toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = successMsg;
        document.body.appendChild(toast);
        
        setTimeout(() => {
          document.body.removeChild(toast);
          // Redirect to teams page to see the created team
          window.location.href = '/teams';
        }, 2000);
        
      } else {
        setError(data.message || 'Failed to create team. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create team:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!hackathon) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl border border-white/10 max-w-md w-full max-h-[90vh] overflow-y-auto scrollable-container">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Join {hackathon.name}</h3>
          <button 
            onClick={onClose} 
            disabled={loading}
            className="text-text-muted hover:text-white text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-text-secondary mb-4">{hackathon.description}</p>
            <div className="flex gap-4 text-sm text-text-muted">
              <span>Team Size: {hackathon.min_team_size}-{hackathon.max_team_size} members</span>
              <span>Ends: {new Date(hackathon.end_date).toLocaleDateString()}</span>
            </div>
          </div>

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
                onChange={(e) => handleInputChange('team_name', e.target.value)}
                placeholder="Enter your team name (e.g., AI Innovators)"
                required
                disabled={loading}
                className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-text-muted focus:border-cyan/50 focus:outline-none disabled:opacity-50 transition-colors ${
                  validationErrors.team_name ? 'border-red-500' : 'border-white/10'
                }`}
              />
              {validationErrors.team_name && (
                <p className="text-red-400 text-xs mt-1">{validationErrors.team_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Project Title *
              </label>
              <input
                type="text"
                value={formData.project_title}
                onChange={(e) => handleInputChange('project_title', e.target.value)}
                placeholder="What will you build? (e.g., Smart Healthcare Assistant)"
                required
                disabled={loading}
                className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-text-muted focus:border-cyan/50 focus:outline-none disabled:opacity-50 transition-colors ${
                  validationErrors.project_title ? 'border-red-500' : 'border-white/10'
                }`}
              />
              {validationErrors.project_title && (
                <p className="text-red-400 text-xs mt-1">{validationErrors.project_title}</p>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">What happens next:</h4>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• Your team will be created and you'll join the hackathon</li>
                <li>• You can invite team members via the Teams page</li>
                <li>• Start building your project immediately</li>
                <li>• Submit your work for AI-powered judging</li>
              </ul>
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
                disabled={loading || !formData.team_name.trim() || !formData.project_title.trim()}
                className="flex-1 bg-cyan hover:bg-cyan/80 text-black font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  'Create Team & Join'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinHackathonModal;