import React, { useState } from 'react';
import { apiService } from '../../services/api';

const TeamInviteModal = ({ isOpen, onClose, teamId }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    try {
      setLoading(true);
      await apiService.teams.sendInvitation({
        team_id: teamId,
        invitee_email: email
      });
      setSuccess(true);
      setEmail('');
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="glass-card rounded-2xl border p-6 w-full max-w-md" style={{ borderColor: 'var(--neon-cyan)' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Invite Team Member</h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none"
            style={{ color: 'var(--text-muted)' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              className="w-full px-4 py-2 rounded-lg border bg-transparent focus:outline-none focus:ring-2"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--neon-cyan)'
              }}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
              Invitation sent successfully!
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border transition-colors"
              style={{ borderColor: 'rgba(255, 255, 255, 0.2)', color: 'var(--text-secondary)' }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium"
              style={{ background: 'var(--neon-gradient)', color: '#FFFFFF' }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamInviteModal;
