import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

/**
 * JUDGE INVITATION ACCEPTANCE COMPONENT
 * 
 * Features:
 * ✅ Handles all states: loading, pending, accepting, success, error, expired
 * ✅ Safe token extraction using useSearchParams
 * ✅ Comprehensive error handling
 * ✅ Full-page error screens
 * ✅ Success screen with judge details
 * ✅ Auto-redirect after 3 seconds
 * ✅ Retry mechanism
 * ✅ Extensive console logging
 */

const AcceptJudgeInvitation = () => {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  
  // UI State
  const [state, setState] = useState('LOADING'); // LOADING, PENDING, ACCEPTING, SUCCESS, ERROR, EXPIRED
  const [invitation, setInvitation] = useState(null);
  const [acceptedData, setAcceptedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [judgeName, setJudgeName] = useState('');
  const [nameError, setNameError] = useState(null);
  
  // Token
  const token = searchParams.get('token');

  // ========================================================================
  // LIFECYCLE - MOUNT
  // ========================================================================

  useEffect(() => {
    console.log('[AcceptJudgeInvitation] Component mounted');
    console.log('[AcceptJudgeInvitation] Token from URL:', token ? `${token.substring(0, 20)}...` : 'MISSING');
    
    // Validate token exists
    if (!token) {
      console.error('[AcceptJudgeInvitation] No token provided in URL');
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
    console.log('[AcceptJudgeInvitation] Fetching invitation details');
    
    try {
      setState('LOADING');
      setErrorMessage(null);
      setErrorDetails(null);
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const url = `${apiBaseUrl}/judge/invitations/${token}`;
      
      console.log('[AcceptJudgeInvitation] API Call:', {
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
      
      console.log('[AcceptJudgeInvitation] API Response:', response.data);
      
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format from server');
      }
      
      const invitationData = response.data.data;
      console.log('[AcceptJudgeInvitation] Invitation loaded:', {
        email: invitationData.email,
        hackathon_name: invitationData.hackathon_name
      });
      
      setInvitation(invitationData);
      setState('PENDING');
      
    } catch (err) {
      console.error('[AcceptJudgeInvitation] Error fetching invitation:', err);
      console.error('[AcceptJudgeInvitation] Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      
      const statusCode = err.response?.status;
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to load invitation';
      
      // Handle specific error cases
      if (statusCode === 400 && errorMsg.includes('expired')) {
        console.log('[AcceptJudgeInvitation] Invitation expired');
        setErrorMessage('Invitation Expired');
        setErrorDetails('This invitation has expired. Please request a new one from the admin.');
        setState('EXPIRED');
      } else if (statusCode === 404) {
        console.log('[AcceptJudgeInvitation] Invitation not found');
        setErrorMessage('Invalid Invitation');
        setErrorDetails('This invitation does not exist or has already been used.');
        setState('ERROR');
      } else if (err.code === 'ECONNABORTED') {
        console.log('[AcceptJudgeInvitation] Request timeout');
        setErrorMessage('Connection Timeout');
        setErrorDetails('The server took too long to respond. Please try again.');
        setState('ERROR');
      } else {
        console.log('[AcceptJudgeInvitation] Generic error');
        setErrorMessage('Failed to Load Invitation');
        setErrorDetails(errorMsg);
        setState('ERROR');
      }
    }
  };

  // ========================================================================
  // VALIDATE NAME INPUT
  // ========================================================================

  const validateName = (name) => {
    if (!name || !name.trim()) {
      setNameError('Name is required');
      return false;
    }
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    if (name.trim().length > 100) {
      setNameError('Name must be less than 100 characters');
      return false;
    }
    setNameError(null);
    return true;
  };

  // ========================================================================
  // HANDLE ACCEPT INVITATION
  // ========================================================================

  const handleAcceptInvitation = async () => {
    console.log('[AcceptJudgeInvitation] Accept button clicked');
    
    // Validate name
    if (!validateName(judgeName)) {
      return;
    }
    
    // Safety check
    if (!token) {
      console.error('[AcceptJudgeInvitation] No token available');
      setErrorMessage('Invalid Request');
      setErrorDetails('Token is missing. Please use the link from your email.');
      setState('ERROR');
      return;
    }

    setState('ACCEPTING');
    setErrorMessage(null);
    setErrorDetails(null);
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const url = `${apiBaseUrl}/judge/invitations/accept`;
      
      console.log('[AcceptJudgeInvitation] API Call:', {
        method: 'POST',
        url: url,
        token: `${token.substring(0, 20)}...`,
        name: judgeName
      });
      
      const response = await axios.post(
        url,
        { token, name: judgeName },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('[AcceptJudgeInvitation] API Response:', response.data);
      
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
      if (!data.data || !data.data.email) {
        console.warn('[AcceptJudgeInvitation] Response missing required fields:', data);
        throw new Error('Invalid response format: missing judge information');
      }
      
      console.log('[AcceptJudgeInvitation] Acceptance successful:', {
        email: data.data.email,
        name: data.data.name,
        hackathon_name: data.data.hackathon_name
      });
      
      // Store accepted data and show success screen
      setAcceptedData(data.data);
      setState('SUCCESS');
      
      // Update AuthContext with judge role
      const updatedUser = {
        ...authUser,
        role: 'judge',
        name: data.data.name
      };
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      
      // Auto-redirect after 3 seconds
      console.log('[AcceptJudgeInvitation] Scheduling redirect to /judge in 3 seconds');
      setTimeout(() => {
        console.log('[AcceptJudgeInvitation] Redirecting to /judge');
        window.location.href = '/judge';
      }, 3000);
      
    } catch (err) {
      console.error('[AcceptJudgeInvitation] Error accepting invitation:', err);
      console.error('[AcceptJudgeInvitation] Error details:', {
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
                console.log('[AcceptJudgeInvitation] Retry button clicked');
                fetchInvitationDetails();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
            
            <button
              onClick={() => {
                console.log('[AcceptJudgeInvitation] Go Home button clicked');
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
              Invitations expire after 7 days. Please ask the admin to send you a new invitation.
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
            Welcome, Judge!
          </h1>
          <p className="text-green-400 font-semibold mb-6 text-center">
            Your account has been created successfully!
          </p>

          {/* Judge Details */}
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Your Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-blue-400 mr-3 text-xl">👤</span>
                <div>
                  <p className="text-sm text-slate-400">Name</p>
                  <p className="text-base font-semibold text-white">
                    {acceptedData.name || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-purple-400 mr-3 text-xl">📧</span>
                <div>
                  <p className="text-sm text-slate-400">Email</p>
                  <p className="text-base font-semibold text-white break-all">
                    {acceptedData.email || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-yellow-400 mr-3 text-xl">🏆</span>
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
                    Active Judge
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-200">
              <strong>✓ Account Created:</strong> You can now access the judge dashboard and start reviewing submissions.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                console.log('[AcceptJudgeInvitation] Go to Judge Dashboard button clicked');
                const updatedUser = {
                  ...authUser,
                  role: 'judge',
                  name: acceptedData.name
                };
                localStorage.setItem('userData', JSON.stringify(updatedUser));
                window.location.href = '/judge';
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              Go to Judge Dashboard
            </button>
            
            <button
              onClick={() => {
                console.log('[AcceptJudgeInvitation] Go to Homepage button clicked');
                navigate('/');
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              Go to Homepage
            </button>
          </div>

          {/* Auto-redirect message */}
          <p className="text-xs text-slate-400 mt-6 text-center">
            Redirecting to judge dashboard in 3 seconds...
          </p>
        </div>
      </div>
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
            <div className="text-5xl mb-4">⚖️</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Judge Invitation
            </h1>
            <p className="text-slate-400">
              You've been invited to be a judge!
            </p>
          </div>

          {/* Invitation Details */}
          <div className="space-y-4 mb-6">
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">Hackathon Details</h3>
              <div className="space-y-2">
                <p className="text-sm text-slate-300">
                  <strong className="text-slate-400">Hackathon:</strong> {invitation?.hackathon_name}
                </p>
                <p className="text-sm text-slate-300">
                  <strong className="text-slate-400">Email:</strong> {invitation?.email}
                </p>
              </div>
            </div>

            {invitation?.expires_at && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm text-blue-200">
                  <strong>Expires:</strong> {new Date(invitation.expires_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Name Input Form */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-2">
              Your Full Name
            </label>
            <input
              type="text"
              value={judgeName}
              onChange={(e) => {
                setJudgeName(e.target.value);
                if (nameError) validateName(e.target.value);
              }}
              onBlur={() => validateName(judgeName)}
              placeholder="Enter your full name"
              className={`w-full px-4 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400 border ${
                nameError ? 'border-red-500' : 'border-slate-600'
              } focus:outline-none focus:border-blue-500 transition-colors`}
            />
            {nameError && (
              <p className="text-red-400 text-sm mt-2">{nameError}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleAcceptInvitation}
              disabled={state === 'ACCEPTING' || !judgeName.trim()}
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
                'Accept & Continue'
              )}
            </button>
            
            <button
              onClick={() => {
                console.log('[AcceptJudgeInvitation] Decline button clicked');
                navigate('/');
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
            >
              Decline
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              By accepting, you'll become a judge and can review and score submissions.
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

export default AcceptJudgeInvitation;
