import React, { useState } from 'react';
import axios from 'axios';

/**
 * ADMIN JUDGE INVITATION COMPONENT
 * 
 * Features:
 * ✅ Email input with validation
 * ✅ Hackathon selection
 * ✅ Success/error feedback
 * ✅ Loading state
 * ✅ Comprehensive logging
 */

const AdminInviteJudge = () => {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [email, setEmail] = useState('');
  const [hackathonName, setHackathonName] = useState('HackaVerse');
  const [hackathonId, setHackathonId] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [invitedJudges, setInvitedJudges] = useState([]);

  // ========================================================================
  // VALIDATE EMAIL
  // ========================================================================

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // ========================================================================
  // HANDLE INVITE JUDGE
  // ========================================================================

  const handleInviteJudge = async (e) => {
    e.preventDefault();
    
    console.log('[AdminInviteJudge] Invite button clicked');
    console.log('[AdminInviteJudge] Email:', email);
    console.log('[AdminInviteJudge] Hackathon:', hackathonName);
    
    // Validate email
    if (!email.trim()) {
      setErrorMessage('Please enter an email address');
      return;
    }
    
    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    
    // Check if already invited
    if (invitedJudges.some(j => j.email === email)) {
      setErrorMessage('This judge has already been invited');
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const apiKey = import.meta.env.VITE_API_KEY || '';
      
      const url = `${apiBaseUrl}/judge/invitations/send`;
      
      console.log('[AdminInviteJudge] API Call:', {
        method: 'POST',
        url: url,
        email: email,
        hackathonName: hackathonName
      });
      
      const response = await axios.post(
        url,
        {
          email: email,
          hackathon_id: hackathonId,
          hackathon_name: hackathonName
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          },
          timeout: 10000
        }
      );
      
      console.log('[AdminInviteJudge] API Response:', response.data);
      
      if (response.data.success) {
        console.log('[AdminInviteJudge] Invitation sent successfully');
        
        // Add to invited judges list
        setInvitedJudges([...invitedJudges, {
          email: email,
          hackathon_name: hackathonName,
          status: 'pending',
          created_at: new Date().toISOString()
        }]);
        
        setSuccessMessage(`✅ Invitation sent to ${email}`);
        setEmail('');
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        throw new Error(response.data.message || 'Failed to send invitation');
      }
      
    } catch (err) {
      console.error('[AdminInviteJudge] Error:', err);
      console.error('[AdminInviteJudge] Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to send invitation';
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">⚖️ Invite Judge</h2>
        <p className="text-slate-400">Send invitation to a judge to review submissions</p>
      </div>

      {/* Form */}
      <form onSubmit={handleInviteJudge} className="space-y-4">
        {/* Email Input */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Judge Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMessage(null);
            }}
            placeholder="judge@example.com"
            className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            disabled={loading}
          />
        </div>

        {/* Hackathon Name Input */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Hackathon Name
          </label>
          <input
            type="text"
            value={hackathonName}
            onChange={(e) => setHackathonName(e.target.value)}
            placeholder="e.g., HackaVerse 2025"
            className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            disabled={loading}
          />
        </div>

        {/* Hackathon ID Input (Optional) */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Hackathon ID (Optional)
          </label>
          <input
            type="text"
            value={hackathonId}
            onChange={(e) => setHackathonId(e.target.value)}
            placeholder="hack_123"
            className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            disabled={loading}
          />
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-200 text-sm">
              <strong>Error:</strong> {errorMessage}
            </p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-200 text-sm">
              {successMessage}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </>
          ) : (
            '📧 Send Invitation'
          )}
        </button>
      </form>

      {/* Invited Judges List */}
      {invitedJudges.length > 0 && (
        <div className="mt-8 pt-8 border-t border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Invited Judges ({invitedJudges.length})
          </h3>
          
          <div className="space-y-2">
            {invitedJudges.map((judge, index) => (
              <div key={index} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{judge.email}</p>
                  <p className="text-slate-400 text-sm">{judge.hackathon_name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-200 text-xs font-semibold rounded-full">
                    {judge.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          <strong>ℹ️ How it works:</strong> The judge will receive an email with a link to accept the invitation. They'll enter their name and create their judge account. After that, they can access the judge dashboard to review submissions.
        </p>
      </div>
    </div>
  );
};

export default AdminInviteJudge;
