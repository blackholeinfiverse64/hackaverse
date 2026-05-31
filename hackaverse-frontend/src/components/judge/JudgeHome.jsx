import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, extractApiData } from '../../services/api';

const JudgeHome = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingReviews: 0,
    completedReviews: 0,
    averageScore: 0,
    totalSubmissions: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const [pendingRes, allRes, rankRes] = await Promise.all([
        apiService.judge.getPendingSubmissions(),
        apiService.judge.getSubmissions({ status: 'submitted', limit: 100 }),
        apiService.judge.getRankings({ tenant_id: 'default', event_id: 'default_event', limit: 50 }),
      ]);

      const pending = extractApiData(pendingRes) || [];
      const allSubmissions = extractApiData(allRes) || pending;
      const rankData = extractApiData(rankRes) || {};
      const rankings = rankData.rankings || [];

      const total = allSubmissions.length;
      const pendingCount = pending.length;
      const completedCount = allSubmissions.filter((s) => s.judge_reviewed || s.status === 'judged').length;
      const avgScore = rankings.length > 0
        ? (rankings.reduce((sum, r) => sum + (r.total_score || 0), 0) / rankings.length).toFixed(1)
        : 0;

      setStats({
        pendingReviews: pendingCount,
        completedReviews: completedCount,
        averageScore: avgScore,
        totalSubmissions: total,
      });

      const recent = allSubmissions.slice(0, 4).map((item, index) => ({
        id: item.submission_id || item._id || `${item.team_id}-${index}`,
        title: item.title || `Submission by ${item.team_id}`,
        team: item.team_id || 'Unknown',
        track: item.track || 'N/A',
        status: item.status || 'submitted',
        score: item.judge_total_score || item.score || 0,
        updated: item.submitted_at ? new Date(item.submitted_at).toLocaleString() : 'Unknown',
        submission_time: item.submitted_at || new Date().toISOString(),
        description: item.description || '',
        github_url: item.github_link || item.github_url || null,
      }));

      setRecentSubmissions(recent);
    } catch (error) {
      console.error('Failed to fetch judge dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ icon, value, label, color }) => {
    const colorMap = {
      warning: { bg: 'bg-warning/20', text: 'text-warning' },
      success: { bg: 'bg-success/20', text: 'text-success' },
      cyan: { bg: 'bg-cyan/20', text: 'text-cyan' },
      violet: { bg: 'bg-violet/20', text: 'text-violet' }
    };

    const c = colorMap[color] || { bg: 'bg-white/5', text: 'text-white' };

    return (
      <div className="glass-card rounded-2xl border p-5 h-[120px] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className={`${c.bg} w-5 h-5 rounded flex items-center justify-center`}>
            <i className={`uil ${icon} ${c.text} text-sm`}></i>
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white mb-1">{value}</div>
          <div className="text-sm text-text-muted">{label}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-0">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">Judge Dashboard</h1>
            <p className="text-text-muted">Review submissions and score projects</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-primary h-11 px-6" title="View Queue" onClick={() => navigate('/judge/queue')}>
              <i className="uil uil-list-ul mr-2"></i>
              View Queue
            </button>
            <button className="btn-secondary h-11 w-11 flex items-center justify-center" title="Export">
              <i className="uil uil-download-alt"></i>
            </button>
          </div>
        </div>

        <div className="grid xl:grid-cols-[1.5fr_1fr] lg:grid-cols-1 gap-6">
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                icon="uil-clock" 
                value={stats.pendingReviews} 
                label="Pending Reviews" 
                color="warning"
              />
              <StatCard 
                icon="uil-check" 
                value={stats.completedReviews} 
                label="Completed" 
                color="success"
              />
              <StatCard 
                icon="uil-star" 
                value={stats.averageScore} 
                label="Avg Score" 
                color="cyan"
              />
              <StatCard 
                icon="uil-file-alt" 
                value={stats.totalSubmissions} 
                label="Total Submissions" 
                color="violet"
              />
            </div>

            {/* Recent Submissions */}
            <div className="glass-card rounded-2xl border">
              <div className="p-5 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">Recent Submissions</h2>
              </div>
              <div className="divide-y divide-white/5">
                {isLoading ? (
                  <div className="p-5 text-center text-white/50">Loading...</div>
                ) : recentSubmissions.length === 0 ? (
                  <div className="p-5 text-center text-white/50">No submissions yet</div>
                ) : (
                  recentSubmissions.map(submission => (
                    <div key={submission.id} className="p-5 hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="grid grid-cols-[3fr_1fr_1fr_auto] gap-6 items-center">
                        <div className="min-w-0">
                          <div className="font-medium text-white text-sm leading-tight" title={submission.title}>
                            {submission.title}
                          </div>
                          <div className="text-xs text-text-muted mt-1">
                            {submission.team} • {submission.track}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-success/20 text-success`}>
                          Score: {submission.score?.toFixed(1) || 'N/A'}
                        </span>
                        <div className="text-xs text-text-muted whitespace-nowrap">
                          {submission.updated}
                        </div>
                        <button 
                          onClick={() => navigate('/leaderboard')}
                          className="text-cyan hover:text-white transition-colors text-sm h-9 px-4 rounded-lg border border-cyan/30 hover:bg-cyan/10 whitespace-nowrap"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="glass-card rounded-2xl border p-5">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link to="/judge/queue" className="block">
                  <button className="w-full btn-primary h-12 text-left px-4 flex items-center">
                    <i className="uil uil-list-ul mr-3 text-xl"></i>
                    <div>
                      <div className="font-medium">View Queue</div>
                      <div className="text-xs opacity-80">Review pending submissions</div>
                    </div>
                  </button>
                </Link>
                <Link to="/judge/scores" className="block">
                  <button className="w-full btn-secondary h-12 text-left px-4 flex items-center">
                    <i className="uil uil-chart-line mr-3 text-xl"></i>
                    <div>
                      <div className="font-medium">My Scores</div>
                      <div className="text-xs opacity-70">View scoring history</div>
                    </div>
                  </button>
                </Link>
                <button className="w-full btn-secondary h-12 text-left px-4 flex items-center">
                  <i className="uil uil-download-alt mr-3 text-xl"></i>
                  <div>
                    <div className="font-medium">Export Results</div>
                    <div className="text-xs opacity-70">Download CSV report</div>
                  </div>
                </button>
                <button className="w-full btn-secondary h-12 text-left px-4 flex items-center">
                  <i className="uil uil-book-open mr-3 text-xl"></i>
                  <div>
                    <div className="font-medium">Guidelines</div>
                    <div className="text-xs opacity-70">Judging criteria</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Today's Activity */}
            <div className="glass-card rounded-2xl border p-5">
              <h2 className="text-lg font-semibold text-white mb-4">Today's Activity</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center h-11">
                  <span className="text-text-secondary">Total Submissions</span>
                  <span className="text-white font-medium">{stats.totalSubmissions}</span>
                </div>
                <div className="flex justify-between items-center h-11">
                  <span className="text-text-secondary">Average Score</span>
                  <span className="text-white font-medium">{stats.averageScore}</span>
                </div>
                <div className="flex justify-between items-center h-11">
                  <span className="text-text-secondary">Completed Reviews</span>
                  <span className="text-white font-medium">{stats.completedReviews}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JudgeHome;
