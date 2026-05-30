import { useState } from 'react';
import FilterToolbar from '../ui/FilterToolbar';

const JudgeScores = () => {
  const [filters, setFilters] = useState({
    search: '',
    track: 'all',
    dateRange: '7days',
    needsRevision: false
  });
  const [hasChanges, setHasChanges] = useState(false);

  const [summary] = useState({
    avgScore: 7.8,
    median: 8.0,
    countScored: 12,
    consistency: 'High'
  });

  const [myScores] = useState([
    {
      id: 1,
      submission: 'AI Campus Navigator',
      team: 'Team Alpha',
      myScore: 8.5,
      finalScore: 8.2,
      deviation: '+0.3',
      scoredOn: '2024-03-07 14:30',
      track: 'AI/ML',
      rubric: {
        innovation: 9,
        technical: 8,
        impact: 8,
        presentation: 9
      },
      notes: 'Excellent use of computer vision. Strong technical implementation.',
      timeSpent: '25 min'
    },
    {
      id: 2,
      submission: 'Blockchain Voting',
      team: 'Team Beta',
      myScore: 7.2,
      finalScore: 7.5,
      deviation: '-0.3',
      scoredOn: '2024-03-07 16:15',
      track: 'Web3',
      rubric: {
        innovation: 7,
        technical: 8,
        impact: 7,
        presentation: 7
      },
      notes: 'Good concept but needs better UI/UX design.',
      timeSpent: '18 min'
    }
  ]);

  const [selectedScore, setSelectedScore] = useState(null);

  

  const filteredScores = myScores.filter(score => {
    if (filters.search && !score.submission.toLowerCase().includes(filters.search.toLowerCase()) && 
        !score.team.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.track !== 'all' && score.track !== filters.track) return false;
    if (filters.needsRevision && Math.abs(parseFloat(score.deviation)) < 0.5) return false;
    return true;
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleReset = () => {
    setFilters({ search: '', track: 'all', dateRange: '7days', needsRevision: false });
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
      placeholder: 'Date Range',
      value: filters.dateRange,
      onChange: (value) => handleFilterChange('dateRange', value),
      options: [
        { value: '7days', label: 'Last 7 days' },
        { value: '30days', label: 'Last 30 days' },
        { value: 'all', label: 'All time' }
      ]
    }
  ];

  const ScoreDetailPanel = ({ score, onClose }) => (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
      <div className="glass-card w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">{score.submission}</h2>
            <p className="text-text-muted text-sm">{score.team} • {score.track}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white p-1">
            <i className="uil uil-times text-xl"></i>
          </button>
        </div>
        
        <div className="p-5 space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Score Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(score.rubric).map(([criterion, value]) => (
                <div key={criterion} className="flex justify-between items-center">
                  <span className="text-text-secondary capitalize">{criterion}</span>
                  <span className="text-white font-medium">{value}/10</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="font-medium text-white">Total Score</span>
                <span className="text-xl font-bold text-cyan">{score.myScore}/10</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Notes</h3>
            <div className="glass-card bg-bg-card p-4 rounded-2xl text-text-secondary">
              {score.notes}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-0">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">My Scores</h1>
            <p className="text-text-muted">Your scoring history and performance</p>
          </div>
          <button className="btn-secondary h-10 px-4 text-sm whitespace-nowrap">
            <i className="uil uil-download-alt mr-2"></i>
            Export scores (.csv)
          </button>
        </div>

      {/* Metrics Strip */}
      <div className="glass-card rounded-2xl border p-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center h-24 flex flex-col justify-center">
            <div className="text-2xl font-bold text-cyan">{summary.avgScore}</div>
            <div className="text-sm text-text-muted mt-1">Your Avg Score</div>
          </div>
          <div className="text-center h-24 flex flex-col justify-center">
            <div className="text-2xl font-bold text-white">{summary.median}</div>
            <div className="text-sm text-text-muted mt-1">Median</div>
          </div>
          <div className="text-center h-24 flex flex-col justify-center">
            <div className="text-2xl font-bold text-white">{summary.countScored}</div>
            <div className="text-sm text-text-muted mt-1">Count Scored (7d)</div>
          </div>
          <div className="text-center h-24 flex flex-col justify-center">
            <div className="text-2xl font-bold text-success">{summary.consistency}</div>
            <div className="text-sm text-text-muted mt-1">Consistency</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterToolbar
        searchPlaceholder="Search submissions or teams..."
        searchValue={filters.search}
        onSearchChange={(value) => handleFilterChange('search', value)}
        filters={toolbarFilters}
        onReset={handleReset}
        onApply={handleApply}
        hasChanges={hasChanges}
      />

      {/* Additional Filters */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input 
            type="checkbox" 
            checked={filters.needsRevision}
            onChange={(e) => handleFilterChange('needsRevision', e.target.checked)}
            className="rounded"
          />
          Needs revision
        </label>
      </div>

      {/* Scores Table */}
      <div className="glass-card rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-card border-b border-white/10">
              <tr className="h-12">
                <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[320px]">Submission</th>
                <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[180px]">Team</th>
                <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[120px]">Your Score</th>
                <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[120px]">Final Score</th>
                <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[100px]">Deviation</th>
                <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[160px]">Scored On</th>
                <th className="text-left px-5 py-3 font-semibold text-text-secondary min-w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredScores.map(score => (
                <tr key={score.id} className="border-b border-white/5 hover:bg-white/5 transition-colors h-14">
                  <td className="px-5 py-3">
                    <div className="font-medium text-white">{score.submission}</div>
                    <div className="text-xs text-text-muted">{score.track}</div>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{score.team}</td>
                  <td className="px-5 py-3">
                    <span className="font-semibold text-cyan">{score.myScore}</span>
                  </td>
                  <td className="px-5 py-3 text-white">{score.finalScore || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`font-medium ${
                      score.deviation.startsWith('+') ? 'text-success' : 'text-error'
                    }`}>
                      {score.deviation}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-text-muted text-sm">{score.scoredOn}</td>
                  <td className="px-5 py-3">
                    <button 
                      onClick={() => setSelectedScore(score)}
                      className="text-cyan hover:text-white transition-colors text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredScores.length === 0 && (
        <div className="glass-card rounded-2xl border p-12 text-center">
          <i className="uil uil-chart-line text-4xl text-text-muted mb-4"></i>
          <h3 className="text-lg font-semibold text-white mb-2">No scores found</h3>
          <p className="text-text-muted">You haven't scored any submissions in this range.</p>
        </div>
      )}

      {selectedScore && (
        <ScoreDetailPanel 
          score={selectedScore} 
          onClose={() => setSelectedScore(null)} 
        />
      )}
      </div>
    </div>
  );
};

export default JudgeScores;