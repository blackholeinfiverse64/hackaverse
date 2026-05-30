import React, { useState } from 'react';

const MemberSignupForm = ({ invitation, onSubmit, loading, error }) => {
  const [formData, setFormData] = useState({
    member_name: '',
    member_bio: ''
  });
  const [validationError, setValidationError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setValidationError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.member_name.trim()) {
      setValidationError('Please enter your name');
      return;
    }

    if (formData.member_name.trim().length < 2) {
      setValidationError('Name must be at least 2 characters');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-2xl p-8 border border-blue-500/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">👤</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Complete Your Profile
          </h1>
          <p className="text-slate-400">
            Tell us a bit about yourself
          </p>
        </div>

        {/* Team Info */}
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-white mb-3 text-sm">Joining</h3>
          <div className="space-y-2">
            <p className="text-sm text-slate-300">
              <strong className="text-slate-400">Team:</strong> {invitation?.team_name}
            </p>
            <p className="text-sm text-slate-300">
              <strong className="text-slate-400">Hackathon:</strong> {invitation?.hackathon_name}
            </p>
            <p className="text-sm text-slate-300">
              <strong className="text-slate-400">Email:</strong> {invitation?.invitee_email}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="member_name"
              value={formData.member_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              disabled={loading}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>

          {/* Bio Field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Bio (Optional)
            </label>
            <textarea
              name="member_bio"
              value={formData.member_bio}
              onChange={handleChange}
              placeholder="Tell us about yourself, your skills, or interests..."
              disabled={loading}
              rows="4"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              {formData.member_bio.length}/500 characters
            </p>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-200">
                {validationError}
              </p>
            </div>
          )}

          {/* API Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-200">
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center mt-6"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Joining Team...
              </>
            ) : (
              'Join Team'
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            You can update your profile information later in your account settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemberSignupForm;
