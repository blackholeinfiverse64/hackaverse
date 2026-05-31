import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, extractApiData } from '../../services/api';
import FilterToolbar from '../ui/FilterToolbar';

const JudgeQueue = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    track: 'all',
    status: 'all',
    sort: 'newest'
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.judge.getPendingSubmissions();
      const pending = extractApiData(response) || [];

      const formattedSubmissions = pending.map((item, index) => ({
        id: item.submission_id || item._id || index + 1,
        submission_id: item.submission_id || item._id,
        submission: item.title || `Project by ${item.team_id}`,
        team: item.team_id || 'Unknown',
        track: item.track || 'Open Innovation',
        priority: item.ai_total_score > 85 ? 'high' : item.ai_total_score > 70 ? 'medium' : 'low',
        status: item.judge_reviewed ? 'judged' : 'pending',
        updated: item.submitted_at
          ? new Date(item.submitted_at).toLocaleDateString()
          : 'Recently',
        description: item.description || '',
        github_url: item.github_link || item.github_url || null,
      }));

      setSubmissions(formattedSubmissions);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filters.search && !submission.submission.toLowerCase().includes(filters.search.toLowerCase()) &&
        !submission.team.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.track !== 'all' && submission.track !== filters.track) return false;
    if (filters.status !== 'all' && submission.status !== filters.status) return false;
    return true;
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleReset = () => {
    setFilters({ search: '', track: 'all', status: 'all', sort: 'newest' });
    setHasChanges(false);
  };

  const handleApply = () => {
    setHasChanges(false);
  };

  const toolbarFilters = [
    {
      placeholder: 'Track',
      value: filters.track,
      onChange: (value) => handleFilterChange('track', value),
      options: [
        { value: 'all', label: 'All Tracks' },
        { value: 'AI/ML', label: 'AI/ML' },
        { value: 'Web3', label: 'Web3' },
        { value: 'Gaming', label: 'Gaming' },
        { value: 'Open Innovation', label: 'Open Innovation' }
      ]
    },
    {
      placeholder: 'Status',
      value: filters.status,
      onChange: (value) => handleFilterChange('status', value),
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'judged', label: 'Judged' }
      ]
    },
    {
      placeholder: 'Sort',
      value: filters.sort,
      onChange: (value) => handleFilterChange('sort', value),
      options: [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'priority', label: 'Priority' }
      ]
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-error bg-error/20';
      case 'medium': return 'text-warning bg-warning/20';
      case 'low': return 'text-success bg-success/20';
      default: return 'text-text-muted bg-gunmetal';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-warning bg-warning/20';
      case 'judged': return 'text-success bg-success/20';
      default: return 'text-text-muted bg-gunmetal';
    }
  };

  return (
    <div className="min-h-screen pt-0">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">Review Queue</h1>
            <p className="text-text-muted">Submissions awaiting your review</p>
          </div>
          <button
            className="btn-secondary h-11 px-6"
            onClick={fetchSubmissions}
            disabled={isLoading}
          >
            <i className="uil uil-refresh mr-2"></i>
            Refresh
          </button>
        </div>

        <FilterToolbar
          searchValue={filters.search}
          onSearchChange={(value) => handleFilterChange('search', value)}
          filters={toolbarFilters}
          hasChanges={hasChanges}
          onReset={handleReset}
          onApply={handleApply}
        />

        <div className="glass-card rounded-2xl border overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-text-muted">Loading queue...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center text-text-muted">No submissions in queue</div>
          ) : (
            <table className="w-full">
              <thead className="bg-bg-card border-b border-white/10">
                <tr className="h-12">
                  <th className="text-left px-5 py-3 font-semibold text-text-secondary">Submission</th>
                  <th className="text-left px-5 py-3 font-semibold text-text-secondary">Team</th>
                  <th className="text-left px-5 py-3 font-semibold text-text-secondary">Track</th>
                  <th className="text-left px-5 py-3 font-semibold text-text-secondary">Priority</th>
                  <th className="text-left px-5 py-3 font-semibold text-text-secondary">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-text-secondary">Updated</th>
                  <th className="text-left px-5 py-3 font-semibold text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="border-b border-white/5 hover:bg-white/5 transition-colors h-14">
                    <td className="px-5 py-3 text-white font-medium">{submission.submission}</td>
                    <td className="px-5 py-3 text-text-secondary">{submission.team}</td>
                    <td className="px-5 py-3 text-text-secondary">{submission.track}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(submission.priority)}`}>
                        {submission.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-muted text-sm">{submission.updated}</td>
                    <td className="px-5 py-3">
                      <button
                        className="text-cyan hover:text-white text-sm font-medium"
                        onClick={() => navigate('/judge/manual-review')}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default JudgeQueue;
