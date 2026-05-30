import { useState } from 'react';

const PublicLeaderboard = () => {
  const [filter, setFilter] = useState('Global');
  const [leaderboard] = useState([
    { rank: 1, team: 'Team Alpha', points: 2847, projects: 3, change: '+2', trend: 'up' },
    { rank: 2, team: 'Team Beta', points: 2831, projects: 2, change: '-1', trend: 'down' },
    { rank: 3, team: 'Team Gamma', points: 2798, projects: 4, change: '+3', trend: 'up' },
    { rank: 4, team: 'Team Delta', points: 2756, projects: 2, change: '+1', trend: 'up' },
    { rank: 5, team: 'Team Epsilon', points: 2743, projects: 3, change: '-2', trend: 'down' },
    { rank: 6, team: 'Team Zeta', points: 2721, projects: 2, change: '+1', trend: 'up' },
    { rank: 7, team: 'Team Eta', points: 2698, projects: 1, change: '0', trend: 'same' },
    { rank: 8, team: 'Team Theta', points: 2675, projects: 3, change: '+4', trend: 'up' }
  ]);

  const topMovers = [
    { team: 'Team Theta', change: '+4', trend: 'up' },
    { team: 'Team Gamma', change: '+3', trend: 'up' },
    { team: 'Team Alpha', change: '+2', trend: 'up' }
  ];

  const filters = ['Global', 'AI/ML', 'Web3', 'Gaming', 'Open Innovation'];

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0D1128 0%, #15193B 100%)' }}>
      {/* Header */}
      <nav className="border-b border-white/10 bg-charcoal/90 backdrop-blur-sm">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-cyan rounded flex items-center justify-center">
                <span className="text-charcoal font-bold text-sm">H</span>
              </div>
              <span className="text-lg font-semibold tracking-tight">HackaVerse</span>
            </div>
            <div className="flex items-center gap-3">
              <a href="/" className="text-text-secondary hover:text-text-primary transition-colors text-sm">
                Home
              </a>
              <button className="btn-primary px-4 text-sm">
                Join Hackathon
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-12 space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Live <span className="relative">Leaderboard<span className="absolute bottom-0 left-0 w-full h-1 bg-cyan"></span></span>
          </h1>
          <p className="text-text-secondary">Real-time rankings updated every 5 minutes</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="flex gap-2 mb-6">
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-cyan text-charcoal'
                      : 'bg-gunmetal text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Leaderboard Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-card border-b border-white/10">
                    <tr>
                      <th className="text-left p-4 font-semibold text-text-secondary">Rank</th>
                      <th className="text-left p-4 font-semibold text-text-secondary">Team</th>
                      <th className="text-left p-4 font-semibold text-text-secondary">Points</th>
                      <th className="text-left p-4 font-semibold text-text-secondary">Projects</th>
                      <th className="text-left p-4 font-semibold text-text-secondary">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map(team => (
                      <tr key={team.rank} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                        team.rank <= 3 ? 'bg-gradient-to-r from-transparent to-cyan/5' : ''
                      }`}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              team.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' :
                              team.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' :
                              team.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-black' :
                              'bg-gunmetal text-text-secondary'
                            }`}>
                              #{team.rank}
                            </div>
                            {team.rank === 1 && <i className="uil uil-trophy text-yellow-400"></i>}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-white">{team.team}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-white">{team.points.toLocaleString()}</div>
                        </td>
                        <td className="p-4 text-text-secondary">{team.projects}</td>
                        <td className="p-4">
                          <span className={`flex items-center gap-1 text-sm font-medium ${
                            team.trend === 'up' ? 'text-success' :
                            team.trend === 'down' ? 'text-error' :
                            'text-text-muted'
                          }`}>
                            {team.trend === 'up' && <span className="rank-arrow up">↑</span>}
                            {team.trend === 'down' && <span className="rank-arrow down">↓</span>}
                            {team.change}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Movers Sidebar */}
          <div className="glass-card p-6 h-fit">
            <h3 className="font-semibold mb-4 text-white">Top Movers</h3>
            <div className="space-y-3">
              {topMovers.map((mover, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-bg-card rounded-xl">
                  <span className="text-text-primary font-medium">{mover.team}</span>
                  <span className="flex items-center gap-1 text-success font-medium">
                    <span className="rank-arrow up">↑</span>
                    {mover.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicLeaderboard;