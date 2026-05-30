import React, { useState } from 'react';
import { apiService } from '../../services/api';

const RewardManagement = () => {
  const [formData, setFormData] = useState({
    request_id: '',
    outcome: 'success'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiService.admin.applyReward({
        request_id: formData.request_id,
        outcome: formData.outcome,
        tenant_id: 'default',
        event_id: 'default_event'
      });

      setResult(response.data);
      setFormData({ request_id: '', outcome: 'success' });
    } catch (err) {
      console.error('Reward error:', err);
      setError(err.response?.data?.detail || 'Failed to apply reward');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1128] to-[#15193B] p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Reward Management</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-white mb-2">Request ID *</label>
              <input
                type="text"
                required
                value={formData.request_id}
                onChange={(e) => setFormData({ ...formData, request_id: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA]"
                placeholder="Enter request ID"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Outcome *</label>
              <select
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00F2EA]"
              >
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="partial_success">Partial Success</option>
                <option value="needs_improvement">Needs Improvement</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Reward Applied</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60">Reward Value:</span>
                  <span className="text-white font-medium">{result.reward_value}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Feedback:</span>
                  <span className="text-white font-medium">{result.feedback}</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Applying...' : 'Apply Reward'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RewardManagement;
