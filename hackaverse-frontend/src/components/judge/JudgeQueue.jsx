import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
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
      const response = await apiService.judge.getRankings({
        tenant_id: 'default',
        event_id: 'default_event',
        limit: 100
      });
      
      const rankings = response.data?.rankings || [];
      const formattedSubmissions = rankings.map((item, index) => ({
        id: index + 1,
        submission: `Project by ${item.team_id}`,
        team: item.team_id,
        track: 'AI/ML',
        priority: item.total_score > 85 ? 'high' : item.total_score > 70 ? 'medium' : 'low',
        status: 'judged',
        updated: 'Recently',
        clarity: item.clarity,
        quality: item.quality,
        innovation: item.innovation,
        total_score: item.total_score,
        rank: item.rank
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
        { value: 'returned', label: 'Returned' }
      ]
    },
    {
      placeholder: 'Sort',
      value: filters.sort,
      onChange: (value) => handleFilterChange('sort', value),
      options: [
        { value: 'newest', label: 'Newest' },
        { value: 'priority', label: 'Priority' },
        { value: 'track', label: 'Track' }
      ]
    }
  ];

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(filteredSubmissions.map(s => s.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id, checked) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter(item => item !== id));
    }
  };

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
      case 'returned': return 'text-error bg-error/20';
      default: return 'text-text-muted bg-gunmetal';
    }
  };

  return (
    <div className="min-h-screen pt-0">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">Judging Queue</h1>
            <p className="text-text-muted">{filteredSubmissions.length} AI-judged submissions</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchSubmissions} className="btn-primary h-11 px-6" title="Refresh">
              <i className="uil uil-refresh mr-2"></i>
              Refresh
            </button>
            <button className="btn-secondary h-11 w-11 flex items-center justify-center" title="Export">
              <i className="uil uil-download-alt"></i>
            </button>
          </div>
        </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <FilterToolbar
            searchPlaceholder="Search submissions or teams..."
            searchValue={filters.search}
            onSearchChange={(value) => handleFilterChange('search', value)}
            filters={toolbarFilters}
            onReset={handleReset}
            onApply={handleApply}
            hasChanges={hasChanges}
          />
        </div>
        
        <button 
          disabled={selectedItems.length === 0}
          className={`btn-primary h-11 lg:h-[44px] px-4 flex items-center gap-2 ${
            selectedItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <i className="uil uil-play"></i>
          Start Review ({selectedItems.length})
        </button>
      </div>

      {/* Queue Table */}
      <div className="glass-card rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-card border-b border-white/10">
              <tr className="h-12">
                <th className="text-left px-5 py-3 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedItems.length === filteredSubmissions.length && filteredSubmissions.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </th>
                <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[320px]">Submission</th>
                <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[180px]">Team</th>
                <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[120px]">Track</th>
                <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[100px]">Priority</th>
                <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[120px]">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[140px]">Updated</th>
                <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Skeleton rows
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5 h-14">
                    <td className="px-5 py-3"><div className="w-4 h-4 bg-gunmetal rounded animate-pulse"></div></td>
                    <td className="px-5 py-3"><div className="w-32 h-4 bg-gunmetal rounded animate-pulse"></div></td>
                    <td className="px-5 py-3"><div className="w-24 h-4 bg-gunmetal rounded animate-pulse"></div></td>
                    <td className="px-5 py-3"><div className="w-16 h-4 bg-gunmetal rounded animate-pulse"></div></td>
                    <td className="px-5 py-3"><div className="w-12 h-4 bg-gunmetal rounded animate-pulse"></div></td>
                    <td className="px-5 py-3"><div className="w-16 h-4 bg-gunmetal rounded animate-pulse"></div></td>
                    <td className="px-5 py-3"><div className="w-20 h-4 bg-gunmetal rounded animate-pulse"></div></td>
                    <td className="px-5 py-3"><div className="w-16 h-4 bg-gunmetal rounded animate-pulse"></div></td>
                  </tr>
                ))
              ) : (
                filteredSubmissions.map(submission => (
                  <tr key={submission.id} className="border-b border-white/5 hover:bg-white/5 transition-colors h-14">
                    <td className="px-5 py-3">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(submission.id)}
                        onChange={(e) => handleSelectItem(submission.id, e.target.checked)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-white">{submission.submission}</div>
                      <div className="text-xs text-text-muted">
                        C:{submission.clarity} Q:{submission.quality} I:{submission.innovation} = {submission.total_score?.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{submission.team}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-1 bg-violet/20 text-violet rounded text-xs font-medium">
                        {submission.track}
                      </span>
                    </td>
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
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => navigate('/leaderboard')}
                          className="px-3 py-1 bg-cyan text-charcoal rounded text-sm font-medium hover:bg-cyan/80 transition-colors"
                        >
                          View Leaderboard
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {!isLoading && filteredSubmissions.length === 0 && (
        <div className="glass-card rounded-2xl border p-12 text-center">
          <i className="uil uil-file-search-alt text-4xl text-text-muted mb-4"></i>
          <h3 className="text-lg font-semibold text-white mb-2">No items match your filters</h3>
          <p className="text-text-muted">Try adjusting your filter criteria to see more submissions.</p>
        </div>
      )}
      </div>
    </div>
  );
};

export default JudgeQueue;