import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch rankings from backend
        const response = await apiService.judge.getRankings({
          tenant_id: 'default',
          event_id: 'default_event',
          limit: 100
        });

        // Backend returns: { success, message, data: { rankings, total_count, tenant_id, event_id } }
        const rankingsData = response.data?.data?.rankings || response.data?.rankings || [];
        
        // Transform backend data to match UI format
        const transformedTeams = rankingsData.map((item, index) => ({
          id: item.team_id || `team_${index}`,
          name: item.team_id || `Team ${index + 1}`,
          category: 'General', // Backend doesn't provide category, using default
          score: Math.round(item.total_score || 0),
          change: 0, // Backend doesn't track change yet
          trend: 'neutral',
          projects: 1,
          members: 1,
          rank: item.rank || (index + 1),
          clarity: item.clarity || 0,
          quality: item.quality || 0,
          innovation: item.innovation || 0,
          confidence: item.confidence || 0
        }));

        setTeams(transformedTeams);
        setStats({
          total_teams: transformedTeams.length,
          active_projects: transformedTeams.length,
          top_score: transformedTeams[0]?.score || 0
        });
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError('Failed to load leaderboard data. Using fallback data.');

        // Fallback to mock data if API fails
        const mockTeams = [
          { id: 2, name: 'Team Beta', category: 'Web3', score: 2847, change: 12, trend: 'up', projects: 2, members: 3 },
          { id: 1, name: 'Team Alpha', category: 'AI/ML', score: 2756, change: -5, trend: 'down', projects: 3, members: 4 },
          { id: 3, name: 'Team Gamma', category: 'Gaming', score: 2634, change: 23, trend: 'up', projects: 1, members: 5 },
          { id: 4, name: 'Team Delta', category: 'Open Innovation', score: 2521, change: 8, trend: 'up', projects: 2, members: 4 },
          { id: 5, name: 'Team Epsilon', category: 'AI/ML', score: 2398, change: -12, trend: 'down', projects: 1, members: 3 },
          { id: 6, name: 'Team Zeta', category: 'Web3', score: 2287, change: 15, trend: 'up', projects: 1, members: 2 },
          { id: 7, name: 'Team Eta', category: 'Gaming', score: 2156, change: 3, trend: 'up', projects: 1, members: 4 },
          { id: 8, name: 'Team Theta', category: 'Open Innovation', score: 2034, change: -8, trend: 'down', projects: 1, members: 3 }
        ];
        setTeams(mockTeams);
        setStats({ total_teams: 8, active_projects: 12, top_score: 2847 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [filter]);

  const filteredTeams = teams.filter(team =>
    filter === 'all' || team.category === filter
  );

  const topMovers = teams
    .filter(team => Math.abs(team.change) > 10)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);

  const filters = [
    { key: 'all', label: 'All Categories' },
    { key: 'AI/ML', label: 'AI/ML' },
    { key: 'Web3', label: 'Web3' },
    { key: 'Gaming', label: 'Gaming' },
    { key: 'Open Innovation', label: 'Open Innovation' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 text-white">
          <div className="mb-8">
            <div className="h-8 bg-white/10 rounded-lg w-40 mb-2 animate-pulse"></div>
            <div className="h-4 bg-white/5 rounded w-56 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse"></div>
              ))}
            </div>
            <div className="h-80 bg-white/5 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 space-y-8 text-white">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#7C4DFF] via-[#6CCAFF] to-[#34D399] bg-clip-text text-transparent">
            Live Leaderboard
          </h1>
          <p className="text-text-muted">Real-time rankings and competition status</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.key
                  ? 'bg-[#6CCAFF]/20 text-[#6CCAFF] border border-[#6CCAFF]/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-medium text-white/70">Rank</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-white/70">Team</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-white/70">Category</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-white/70">Score</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-white/70">Change</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-white/70">Projects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.map((team, index) => {
                      const rank = index + 1;
                      const isTopThree = rank <= 3;

                      return (
                        <tr
                          key={team.id}
                          className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                            isTopThree ? 'bg-gradient-to-r from-[#FFD700]/5 to-transparent' : ''
                          }`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              {isTopThree && (
                                <i className={`uil uil-trophy mr-2 ${
                                  rank === 1 ? 'text-[#FFD700]' :
                                  rank === 2 ? 'text-[#C0C0C0]' :
                                  'text-[#CD7F32]'
                                }`}></i>
                              )}
                              <span className={`font-bold ${isTopThree ? 'text-[#FFD700]' : ''}`}>
                                #{rank}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#7C4DFF] to-[#6CCAFF] flex items-center justify-center text-white font-bold text-sm mr-3">
                                {team.name.charAt(5)}
                              </div>
                              <span className="font-medium">{team.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                              team.category === 'AI/ML' ? 'bg-[#6CCAFF]/20 text-[#6CCAFF]' :
                              team.category === 'Web3' ? 'bg-[#7C4DFF]/20 text-[#7C4DFF]' :
                              team.category === 'Gaming' ? 'bg-[#FFD700]/20 text-[#FFD700]' :
                              'bg-[#22C55E]/20 text-[#22C55E]'
                            }`}>
                              {team.category}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-lg">{team.score.toLocaleString()}</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className={`flex items-center ${
                              team.trend === 'up' ? 'text-[#22C55E]' : 'text-[#F43F5E]'
                            }`}>
                              <i className={`uil ${team.trend === 'up' ? 'uil-arrow-up' : 'uil-arrow-down'} mr-1`}></i>
                              <span className="font-medium">{Math.abs(team.change)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-white/70">{team.projects}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Movers Sidebar */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <i className="uil uil-chart-line text-[#6CCAFF] mr-2"></i>
              Top Movers
            </h3>

            <div className="space-y-4">
              {topMovers.map((team) => (
                <div key={team.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#7C4DFF] to-[#6CCAFF] flex items-center justify-center text-white font-bold text-sm mr-3">
                      {team.name.charAt(5)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{team.name}</div>
                      <div className="text-xs text-white/50">{team.category}</div>
                    </div>
                  </div>
                  <div className={`flex items-center font-bold ${
                    team.trend === 'up' ? 'text-[#22C55E]' : 'text-[#F43F5E]'
                  }`}>
                    <i className={`uil ${team.trend === 'up' ? 'uil-arrow-up' : 'uil-arrow-down'} mr-1`}></i>
                    <span>{Math.abs(team.change)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Summary */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="font-medium mb-3">Competition Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Total Teams</span>
                  <span className="font-medium">{stats?.total_teams || teams.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Active Projects</span>
                  <span className="font-medium">{stats?.active_projects || teams.reduce((sum, team) => sum + team.projects, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Top Score</span>
                  <span className="font-medium">{stats?.top_score?.toLocaleString() || teams[0]?.score.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
