import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function TeamInvitations() {
  const [invitations, setInvitations] = useState([]);
  const [sentInvites, setSentInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchInvitations();
    fetchSentInvites();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await api.get('/teams/invitations/received');
      setInvitations(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  };

  const fetchSentInvites = async () => {
    try {
      const response = await api.get('/teams/invitations/sent');
      setSentInvites(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch sent invites:', error);
    }
  };

  const sendInvitation = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const teamId = localStorage.getItem('team_id');
      await api.post('/teams/invitations/send', {
        team_id: teamId,
        invitee_email: email
      });
      setEmail('');
      alert('Invitation sent successfully!');
      fetchSentInvites();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const respondToInvitation = async (invitationId, accept) => {
    try {
      await api.post('/teams/invitations/respond', {
        invitation_id: invitationId,
        accept
      });
      
      if (accept) {
        const invitation = invitations.find(i => i.id === invitationId);
        localStorage.setItem('team_id', invitation.team_id);
        alert('You have joined the team!');
      }
      
      fetchInvitations();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to respond to invitation');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Team Invitations</h1>

      {localStorage.getItem('team_id') && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Invite Team Members</h2>
          <form onSubmit={sendInvitation} className="flex gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter member's email"
              className="flex-1 px-3 py-2 border rounded"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </form>

          {sentInvites.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Sent Invitations</h3>
              <div className="space-y-2">
                {sentInvites.map((invite) => (
                  <div key={invite.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>{invite.invitee_email}</span>
                    <span className={`px-3 py-1 rounded text-sm ${
                      invite.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      invite.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {invite.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Received Invitations</h2>
        {invitations.length === 0 ? (
          <p className="text-gray-500">No pending invitations</p>
        ) : (
          <div className="space-y-4">
            {invitations.map((invite) => (
              <div key={invite.id} className="border rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{invite.team_name}</h3>
                    <p className="text-sm text-gray-600">From: {invite.inviter_name}</p>
                    <p className="text-sm text-gray-600">Hackathon: {invite.hackathon_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToInvitation(invite.id, true)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respondToInvitation(invite.id, false)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
