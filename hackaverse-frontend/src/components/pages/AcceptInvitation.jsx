import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/appConstants';
import MemberSignupForm from './MemberSignupForm';

/**
 * IMPROVED ACCEPT INVITATION COMPONENT
 * 
 * Features:
 * ✅ New flow: Accept → Signup Form → Submit
 * ✅ Collects member name and bio
 * ✅ All states handled: loading, pending, signup_form, accepting, success, error, expired
 * ✅ Full error UI
 * ✅ Comprehensive logging
 */

const AcceptInvitation = () => {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // UI State
  const [state, setState] = useState('LOADING'); // LOADING, PENDING, SIGNUP_FORM, ACCEPTING, SUCCESS, ERROR, EXPIRED
  const [invitation, setInvitation] = useState(null);
  const [acceptedData, setAcceptedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  
  // Token
  const token = searchParams.get('token');

  // ========================================================================
  // LIFECYCLE - MOUNT
  // ========================================================================

  useEffect(() => {
    console.log('[AcceptInvitation] Component mounted');
    console.log('[AcceptInvitation] Token from URL:', token ? `${token.substring(0, 20)}...` : 'MISSING');
    
    // Validate token exists
    if (!token) {
      console.error('[AcceptInvitation] No token provided in URL');
      setErrorMessage('Invalid Invitation Link');
      setErrorDetails('No token found in URL. Please use the link from your email.');
      setState('ERROR');
      return;
    }

    // Fetch invitation details
    fetchInvitationDetails();
  }, [token]);

  // ========================================================================
  // FETCH INVITATION DETAILS
  // ========================================================================

  const fetchInvitationDetails = async () => {
    console.log('[AcceptInvitation] Fetching invitation details');
    
    try {
      setState('LOADING');
      setErrorMessage(null);
      setErrorDetails(null);
      
      const url = `${API_BASE_URL}/teams/invitations/${token}`;
      
      console.log('[AcceptInvitation] API Call:', {
        method: 'GET',
        url: url,
        token: `${token.substring(0, 20)}...`
      });
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[AcceptInvitation] API Response:', response.data);
      
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format from server');
      }
      
      const invitationData = response.data.data;
      console.log('[AcceptInvitation] Invitation loaded:', {
        team_name: invitationData.team_name,
        hackathon_name: invitationData.hackathon_name,
        email: invitationData.invitee_email
      });
      
      setInvitation(invitationData);
      setState('PENDING');
      
    } catch (err) {
      console.error('[AcceptInvitation] Error fetching invitation:', err);
      console.error('[AcceptInvitation] Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      
      const statusCode = err.response?.status;
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to load invitation';
      
      // Handle specific error cases
      if (statusCode === 400 && errorMsg.includes('expired')) {
        console.log('[AcceptInvitation] Invitation expired');
        setErrorMessage('Invitation Expired');
        setErrorDetails('This invitation has expired. Please request a new one from your team.');
        setState('EXPIRED');
      } else if (statusCode === 404) {
        console.log('[AcceptInvitation] Invitation not found');
        setErrorMessage('Invalid Invitation');
        setErrorDetails('This invitation does not exist or has already been used.');
        setState('ERROR');
      } else if (err.code === 'ECONNABORTED') {
        console.log('[AcceptInvitation] Request timeout');
        setErrorMessage('Connection Timeout');
        setErrorDetails('The server took too long to respond. Please try again.');
        setState('ERROR');
      } else {
        console.log('[AcceptInvitation] Generic error');
        setErrorMessage('Failed to Load Invitation');
        setErrorDetails(errorMsg);
        setState('ERROR');
      }
    }
  };

  // ========================================================================
  // HANDLE ACCEPT INVITATION
  // ========================================================================

  const handleAcceptInvitation = async () => {
    console.log('[AcceptInvitation] Accept button clicked - showing signup form');
    setState('SIGNUP_FORM');
  };

  // ========================================================================
  // HANDLE SIGNUP FORM SUBMISSION
  // ========================================================================

  const handleSubmitSignup = async (formData) => {
    console.log('[AcceptInvitation] Signup form submitted:', { member_name: formData.member_name, has_bio: !!formData.member_bio });
    
    if (!token) {
      console.error('[AcceptInvitation] No token available');
      setErrorMessage('Invalid Request');
      setErrorDetails('Token is missing. Please use the link from your email.');
      setState('ERROR');
      return;
    }

    setState('ACCEPTING');
    setErrorMessage(null);
    setErrorDetails(null);
    
    try {
      const url = `${API_BASE_URL}/teams/invitations/accept-with-details`;
      
      console.log('[AcceptInvitation] API Call:', {
        method: 'POST',
        url: url,
        token: `${token.substring(0, 20)}...`,
        member_name: formData.member_name
      });
      
      const response = await axios.post(
        url,
        { 
          token,
          member_name: formData.member_name,
          member_bio: formData.member_bio
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('[AcceptInvitation] API Response:', response.data);
      
      // Validate response
      if (!response.data) {
        throw new Error('No response data from server');
      }
      
      const data = response.data;
      
      // Check success flag
      if (!data.success) {
        throw new Error(data.message || 'Server returned success=false');
      }
      
      // Validate required fields
      if (!data.team_id || !data.team_name) {
        console.warn('[AcceptInvitation] Response missing required fields:', data);
        throw new Error('Invalid response format: missing team information');
      }
      
      console.log('[AcceptInvitation] Acceptance successful:', {
        team_id: data.team_id,
        team_name: data.team_name,
        hackathon_name: data.hackathon_name
      });
      
      // Store accepted data and show success screen
      setAcceptedData(data);
      setState('SUCCESS');
      
      // Auto-redirect after 3 seconds
      console.log('[AcceptInvitation] Scheduling redirect to /app/teams in 3 seconds');
      setTimeout(() => {
        console.log('[AcceptInvitation] Redirecting to /app/teams');
        navigate('/app/teams');
      }, 3000);
      
    } catch (err) {
      console.error('[AcceptInvitation] Error accepting invitation:', err);
      console.error('[AcceptInvitation] Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      
      const statusCode = err.response?.status;
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to accept invitation';
      
      setState('ERROR');
      setErrorMessage('Failed to Accept Invitation');
      setErrorDetails(errorMsg);
    }
  };

  // ========================================================================
  // RENDER - LOADING STATE
  // ========================================================================

  if (state === 'LOADING') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-6"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Invitation</h2>
          <p className="text-slate-400">Please wait while we verify your invitation...</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER - ERROR STATE
  // ========================================================================

  if (state === 'ERROR') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-2xl p-8 border border-red-500/20">
          {/* Error Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            {errorMessage || 'Error'}
          </h1>
          <p className="text-red-400 font-semibold mb-4 text-center">
            Something went wrong
          </p>

          {/* Error Details */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-200">
              <strong>Details:</strong> {errorDetails || 'An unexpected error occurred'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                console.log('[AcceptInvitation] Retry button clicked');
                fetchInvitationDetails();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
            
            <button
              onClick={() => {
                console.log('[AcceptInvitation] Go Home button clicked');
                navigate('/');
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              Go to Homepage
            </button>
          </div>

          {/* Debug Info */}
          <div className="mt-6 p-3 bg-slate-700/50 rounded text-left border border-slate-600">
            <p className="text-xs text-slate-400 font-mono break-all">
              Token: {token ? `${token.substring(0, 20)}...` : 'MISSING'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER - EXPIRED STATE
  // ========================================================================

  if (state === 'EXPIRED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-950 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-2xl p-8 border border-yellow-500/20">
          {/* Expired Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full mb-4">
              <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Expired Message */}
          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            Invitation Expired
          </h1>
          <p className="text-yellow-400 font-semibold mb-4 text-center">
            This invitation is no longer valid
          </p>

          {/* Expired Details */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-200">
              Invitations expire after 7 days. Please ask your team to send you a new invitation.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER - SUCCESS STATE
  // ========================================================================

  if (state === 'SUCCESS' && acceptedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-2xl p-8 border border-green-500/20">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            Welcome!
          </h1>
          <p className="text-green-400 font-semibold mb-6 text-center">
            You have successfully joined the team!
          </p>

          {/* Team Details */}
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Team Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-blue-400 mr-3 text-xl">👥</span>
                <div>
                  <p className="text-sm text-slate-400">Team Name</p>
                  <p className="text-base font-semibold text-white">
                    {acceptedData.team_name || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-purple-400 mr-3 text-xl">🏆</span>
                <div>
                  <p className="text-sm text-slate-400">Hackathon</p>
                  <p className="text-base font-semibold text-white">
                    {acceptedData.hackathon_name || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-green-400 mr-3 text-xl">✓</span>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <p className="text-base font-semibold text-green-400">
                    Member Added
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Email Confirmation */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-200">
              <strong>✓ Email Registered:</strong> Your email has been added to the team member list.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                console.log('[AcceptInvitation] Go to Teams button clicked');
                navigate('/app/teams');
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              Go to Teams
            </button>
            
            <button
              onClick={() => {
                console.log('[AcceptInvitation] Go to Dashboard button clicked');
                navigate('/app');
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              Go to Dashboard
            </button>
          </div>

          {/* Auto-redirect message */}
          <p className="text-xs text-slate-400 mt-6 text-center">
            Redirecting to teams page in 3 seconds...
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER - SIGNUP FORM STATE (Collect member details)
  // ========================================================================

  if (state === 'SIGNUP_FORM' && invitation) {
    return (
      <MemberSignupForm
        invitation={invitation}
        onSubmit={handleSubmitSignup}
        loading={state === 'ACCEPTING'}
        error={errorMessage}
      />
    );
  }

  // ========================================================================
  // RENDER - PENDING STATE (Waiting for user action)
  // ========================================================================

  if (state === 'PENDING' && invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-2xl p-8 border border-blue-500/20">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🚀</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Team Invitation
            </h1>
            <p className="text-slate-400">
              You've been invited to join a hackathon team!
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">Team Details</h3>
              <div className="space-y-2">
                <p className="text-sm text-slate-300">
                  <strong className="text-slate-400">Team:</strong> {invitation?.team_name}
                </p>
                <p className="text-sm text-slate-300">
                  <strong className="text-slate-400">Hackathon:</strong> {invitation?.hackathon_name}
                </p>
                <p className="text-sm text-slate-300">
                  <strong className="text-slate-400">Invited Email:</strong> {invitation?.invitee_email}
                </p>
              </div>
            </div>

            {invitation?.expires_at && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-sm text-yellow-200">
                  <strong>Expires:</strong> {new Date(invitation.expires_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAcceptInvitation}
              disabled={state === 'ACCEPTING'}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {state === 'ACCEPTING' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Accepting...
                </>
              ) : (
                'Accept Invitation'
              )}
            </button>
            
            <button
              onClick={() => {
                console.log('[AcceptInvitation] Decline button clicked');
                navigate('/');
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              Decline
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              By accepting, you'll become a member of this team and can collaborate on the hackathon project.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================================
  // FALLBACK - Should never reach here
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-slate-400">Unknown state: {state}</p>
      </div>
    </div>
  );
};

export default AcceptInvitation;
