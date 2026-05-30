import React, { useState } from 'react';
import { apiService } from '../../services/api';

const TeamRegistration = () => {
  const [formData, setFormData] = useState({
    team_name: '',
    members: [''],
    project_title: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleAddMember = () => {
    setFormData({ ...formData, members: [...formData.members, ''] });
  };

  const handleRemoveMember = (index) => {
    const newMembers = formData.members.filter((_, i) => i !== index);
    setFormData({ ...formData, members: newMembers });
  };

  const handleMemberChange = (index, value) => {
    const newMembers = [...formData.members];
    newMembers[index] = value;
    setFormData({ ...formData, members: newMembers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.admin.registerTeam({
        team_name: formData.team_name,
        members: formData.members.filter(m => m.trim()),
        project_title: formData.project_title,
        tenant_id: 'default',
        event_id: 'default_event'
      });

      setSuccess(`Team "${formData.team_name}" registered successfully!`);
      setFormData({ team_name: '', members: [''], project_title: '' });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Failed to register team');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1128] to-[#15193B] p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Team Registration</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-white mb-2">Team Name *</label>
              <input
                type="text"
                required
                value={formData.team_name}
                onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA]"
                placeholder="Enter team name"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Project Title *</label>
              <input
                type="text"
                required
                value={formData.project_title}
                onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA]"
                placeholder="Enter project title"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-white">Team Members *</label>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="text-[#00F2EA] hover:text-white text-sm"
                >
                  + Add Member
                </button>
              </div>
              {formData.members.map((member, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    required
                    value={member}
                    onChange={(e) => handleMemberChange(index, e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA]"
                    placeholder={`Member ${index + 1} name`}
                  />
                  {formData.members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(index)}
                      className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                    >
                      <i className="uil uil-times"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-200">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Registering...' : 'Register Team'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeamRegistration;
