import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../constants/appConstants';
import { getApiKey } from '../../constants/apiKey';
import { useToast, ToastContainer } from '../../hooks/useToast.jsx';

const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    hackathon: 'all',
    sortBy: 'recent'
  });
  const { toasts, success, error: showError } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, [filters]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      // Fetch judge rankings to get submissions
      const response = await fetch(`${API_BASE_URL}/judge/rank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': getApiKey()
        },
        body: JSON.stringify({
          tenant_id: 'default',
          event_id: 'default_event',
          limit: 100
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rankings = data.data?.rankings || [];
        
        // Transform rankings into submission format
        const transformedSubmissions = rankings.map((ranking, index) => ({
          id: ranking.team_id || `submission_${index}`,
          team_id: ranking.team_id,
          team_name: `Team ${ranking.team_id}`,
          project_title: `Project by ${ranking.team_id}`,
          submission_time: ranking.submission_time || new Date().toISOString(),
          status: ranking.total_score > 0 ? 'judged' : 'pending',
          score: ranking.total_score || 0,
          hackathon_id: 'hack_1708012345.67',
          hackathon_name: 'AI Innovation Challenge',
          criteria_scores: ranking.criteria_scores || {},
          feedback: ranking.feedback || 'No feedback available'
        }));

        // Apply filters
        let filteredSubmissions = transformedSubmissions;
        
        if (filters.status !== 'all') {
          filteredSubmissions = filteredSubmissions.filter(s => s.status === filters.status);
        }
        
        // Sort submissions
        if (filters.sortBy === 'recent') {
          filteredSubmissions.sort((a, b) => new Date(b.submission_time) - new Date(a.submission_time));
        } else if (filters.sortBy === 'score') {
          filteredSubmissions.sort((a, b) => b.score - a.score);
        }

        setSubmissions(filteredSubmissions);
      } else {
        showError('Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      showError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (submission) => {
    setSelectedSubmission(submission);
    setShowDetailModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'judged': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const SubmissionCard = ({ submission }) => (
    <div className="glass-card rounded-xl border border-white/10 p-6 hover:border-cyan/40 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{submission.project_title}</h3>
          <p className="text-text-secondary text-sm mb-2">by {submission.team_name}</p>
          <p className="text-text-muted text-xs">Submitted: {formatDate(submission.submission_time)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(submission.status)}`}>
            {submission.status}
          </span>
          {submission.score > 0 && (
            <div className="text-right">
              <div className="text-lg font-bold text-white">{submission.score.toFixed(1)}</div>
              <div className="text-xs text-text-muted">Score</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-text-muted">
          Hackathon: {submission.hackathon_name}
        </div>
        <button
          onClick={() => handleViewDetails(submission)}
          className="px-4 py-2 bg-cyan/20 text-cyan hover:bg-cyan/30 rounded-lg text-sm font-medium transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );

  const DetailModal = ({ submission, onClose }) => {
    if (!submission) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="glass-card rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollable-container">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">Submission Details</h3>
            <button 
              onClick={onClose}
              className="text-text-muted hover:text-white text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Project Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-muted">Project Title:</span>
                  <span className="text-white">{submission.project_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Team:</span>
                  <span className="text-white">{submission.team_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Submitted:</span>
                  <span className="text-white">{formatDate(submission.submission_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                </div>
              </div>
            </div>

            {submission.score > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Scoring</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Total Score:</span>
                    <span className="text-2xl font-bold text-white">{submission.score.toFixed(1)}</span>
                  </div>
                  
                  {Object.keys(submission.criteria_scores).length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-text-secondary mb-2">Criteria Breakdown:</h5>
                      <div className="space-y-2">
                        {Object.entries(submission.criteria_scores).map(([criteria, score]) => (
                          <div key={criteria} className="flex justify-between">
                            <span className="text-text-muted capitalize">{criteria.replace('_', ' ')}:</span>
                            <span className="text-white">{score.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Feedback</h4>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-text-secondary">{submission.feedback}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-white/20 text-text-secondary hover:text-white hover:border-white/40 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.open(`/admin/teams/${submission.team_id}`, '_blank')}
                className="flex-1 bg-cyan hover:bg-cyan/80 text-black font-medium px-4 py-2 rounded-lg transition-colors"
              >
                View Team
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Project Submissions</h1>
            <p className="text-text-muted">Monitor and review all project submissions</p>
          </div>
          <button
            onClick={fetchSubmissions}
            className="btn-secondary h-11 px-6"
          >
            <i className="uil uil-refresh mr-2"></i>
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-2xl border border-white/10 p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-cyan/50 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="judged">Judged</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-cyan/50 focus:outline-none"
              >
                <option value="recent">Most Recent</option>
                <option value="score">Highest Score</option>
              </select>
            </div>

            <div className="ml-auto">
              <div className="text-sm text-text-muted">
                Total: {submissions.length} submissions
              </div>
            </div>
          </div>
        </div>

        {/* Submissions Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-card rounded-xl border border-white/10 p-6 animate-pulse">
                <div className="bg-white/10 h-6 rounded mb-4"></div>
                <div className="bg-white/10 h-4 rounded mb-2"></div>
                <div className="bg-white/10 h-4 rounded mb-4"></div>
                <div className="bg-white/10 h-10 rounded"></div>
              </div>
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="uil uil-file-upload text-2xl text-text-muted"></i>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No submissions found</h3>
            <p className="text-text-secondary">No project submissions match your current filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map(submission => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSubmission && (
        <DetailModal
          submission={selectedSubmission}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSubmission(null);
          }}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
};

export default AdminSubmissions;