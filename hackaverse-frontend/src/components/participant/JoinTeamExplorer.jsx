import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinTeamExplorer = () => {
  const navigate = useNavigate();
  const [selectedFilters, setSelectedFilters] = useState({
    category: 'all',
    size: 'all',
    skill: 'all'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Mock team data - in real app this would come from API
  const teams = [
    {
      id: 1,
      name: 'Code Crusaders',
      description: 'Building an AI-powered learning platform for developers',
      category: 'ai',
      size: 'medium',
      members: 4,
      maxMembers: 6,
      skills: ['React', 'Python', 'TensorFlow', 'Node.js'],
      leader: 'Sarah Chen',
      avatar: 'SC',
      project: 'AI Study Buddy',
      deadline: 'March 20, 2024',
      status: 'active'
    },
    {
      id: 2,
      name: 'Mobile Mavericks',
      description: 'Cross-platform fitness tracking app with social features',
      category: 'mobile',
      size: 'small',
      members: 3,
      maxMembers: 4,
      skills: ['React Native', 'Firebase', 'Swift', 'Kotlin'],
      leader: 'Mike Johnson',
      avatar: 'MJ',
      project: 'FitConnect',
      deadline: 'March 18, 2024',
      status: 'active'
    },
    {
      id: 3,
      name: 'Web Wizards',
      description: 'Sustainable living web app with carbon footprint calculator',
      category: 'web',
      size: 'large',
      members: 7,
      maxMembers: 8,
      skills: ['Vue.js', 'Django', 'PostgreSQL', 'AWS'],
      leader: 'Emma Rodriguez',
      avatar: 'ER',
      project: 'EcoLife',
      deadline: 'March 25, 2024',
      status: 'active'
    },
    {
      id: 4,
      name: 'Game Dev Guild',
      description: 'Educational puzzle game for environmental awareness',
      category: 'game',
      size: 'small',
      members: 2,
      maxMembers: 4,
      skills: ['Unity', 'C#', 'Blender', 'Photoshop'],
      leader: 'Alex Kim',
      avatar: 'AK',
      project: 'EcoQuest',
      deadline: 'March 22, 2024',
      status: 'active'
    },
    {
      id: 5,
      name: 'IoT Innovators',
      description: 'Smart agriculture sensor network for urban farming',
      category: 'iot',
      size: 'medium',
      members: 5,
      maxMembers: 6,
      skills: ['Arduino', 'Raspberry Pi', 'Python', 'MQTT'],
      leader: 'David Park',
      avatar: 'DP',
      project: 'UrbanFarm IoT',
      deadline: 'March 28, 2024',
      status: 'active'
    },
    {
      id: 6,
      name: 'Solo Developer',
      description: 'Personal finance tracker with AI insights',
      category: 'web',
      size: 'solo',
      members: 1,
      maxMembers: 1,
      skills: ['React', 'Express', 'MongoDB', 'OpenAI API'],
      leader: 'Lisa Wang',
      avatar: 'LW',
      project: 'FinanceAI',
      deadline: 'March 15, 2024',
      status: 'looking'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Categories', icon: 'uil-apps' },
    { id: 'web', label: 'Web Apps', icon: 'uil-web-grid', color: 'cyan' },
    { id: 'mobile', label: 'Mobile Apps', icon: 'uil-mobile-android', color: 'violet' },
    { id: 'ai', label: 'AI/ML', icon: 'uil-brain', color: 'pink' },
    { id: 'game', label: 'Games', icon: 'uil-game-structure', color: 'lime' },
    { id: 'iot', label: 'IoT', icon: 'uil-processor', color: 'orange' }
  ];

  const teamSizes = [
    { id: 'all', label: 'Any Size' },
    { id: 'solo', label: 'Solo (1)' },
    { id: 'small', label: 'Small (2-4)' },
    { id: 'medium', label: 'Medium (5-6)' },
    { id: 'large', label: 'Large (7+)' }
  ];

  const skills = [
    { id: 'all', label: 'All Skills' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'backend', label: 'Backend' },
    { id: 'mobile', label: 'Mobile Dev' },
    { id: 'ai', label: 'AI/ML' },
    { id: 'design', label: 'Design' }
  ];

  const getCategoryColor = (category) => {
    const colors = {
      web: 'cyan',
      mobile: 'violet',
      ai: 'pink',
      game: 'lime',
      iot: 'orange'
    };
    return colors[category] || 'gray';
  };

  const getTeamSizeLabel = (size) => {
    const labels = {
      solo: 'Solo',
      small: 'Small Team',
      medium: 'Medium Team',
      large: 'Large Team'
    };
    return labels[size] || size;
  };

  const filteredTeams = teams.filter(team => {
    const matchesCategory = selectedFilters.category === 'all' || team.category === selectedFilters.category;
    const matchesSize = selectedFilters.size === 'all' || team.size === selectedFilters.size;
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSize && matchesSearch;
  });

  const handleJoinTeam = (team) => {
    // In real app, this would make an API call
    console.log('Joining team:', team.name);
    // For now, just navigate back to teams page
    navigate('/app/teams');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-violet-500/10 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-pink-500/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-20 right-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-in-up">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            <span className="cosmic-text">Find Your</span>
            <br />
            <span className="text-white">Perfect Team</span>
          </h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto">
            Discover amazing teams and collaborate on groundbreaking projects
          </p>
        </div>

        {/* Search and Filters */}
        <div className="glass-card rounded-2xl border p-6 mb-8 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <i className="uil uil-search absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted"></i>
                <input
                  type="text"
                  placeholder="Search teams, skills, or projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-text-muted focus:border-cyan-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedFilters.category}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-cyan-400 focus:outline-none transition-colors"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-gray-800">{cat.label}</option>
                ))}
              </select>

              <select
                value={selectedFilters.size}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, size: e.target.value }))}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-cyan-400 focus:outline-none transition-colors"
              >
                {teamSizes.map(size => (
                  <option key={size.id} value={size.id} className="bg-gray-800">{size.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTeams.map((team, index) => (
            <div
              key={team.id}
              className="glass-card rounded-2xl border p-6 hover:scale-[1.02] transition-all duration-300 animate-slide-in-up cursor-pointer group"
              style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              onClick={() => setSelectedTeam(team)}
            >
              {/* Team Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-violet-400 rounded-xl flex items-center justify-center font-bold text-white">
                    {team.avatar}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {team.name}
                    </h3>
                    <p className="text-text-muted text-sm">Led by {team.leader}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  team.status === 'active'
                    ? 'border-green-400/30 bg-green-400/10 text-green-400'
                    : 'border-yellow-400/30 bg-yellow-400/10 text-yellow-400'
                }`}>
                  {team.status === 'active' ? 'Active' : 'Looking'}
                </div>
              </div>

              {/* Project Info */}
              <div className="mb-4">
                <h4 className="text-white font-medium mb-1">{team.project}</h4>
                <p className="text-text-muted text-sm mb-3">{team.description}</p>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <i className="uil uil-calendar-alt"></i>
                  <span>Due: {new Date(team.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Team Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <i className="uil uil-users-alt text-violet-400"></i>
                  <span className="text-white text-sm">
                    {team.members}/{team.maxMembers} members
                  </span>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium bg-${getCategoryColor(team.category)}-400/20 text-${getCategoryColor(team.category)}-400`}>
                  {getTeamSizeLabel(team.size)}
                </div>
              </div>

              {/* Skills */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {team.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-white/10 rounded text-xs text-text-muted"
                    >
                      {skill}
                    </span>
                  ))}
                  {team.skills.length > 3 && (
                    <span className="px-2 py-1 bg-white/10 rounded text-xs text-text-muted">
                      +{team.skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Join Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoinTeam(team);
                }}
                className="w-full btn-primary py-2 text-sm"
              >
                <i className="uil uil-plus mr-2"></i>
                Join Team
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTeams.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="uil uil-users-alt text-4xl text-text-muted"></i>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No teams found</h3>
            <p className="text-text-muted mb-6">Try adjusting your filters or search terms</p>
            <button
              onClick={() => {
                setSelectedFilters({ category: 'all', size: 'all', skill: 'all' });
                setSearchQuery('');
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Team Detail Modal */}
        {selectedTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedTeam(null)}
            />

            <div className="relative glass-card rounded-2xl border max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-violet-400 rounded-xl flex items-center justify-center font-bold text-white text-xl">
                      {selectedTeam.avatar}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedTeam.name}</h2>
                      <p className="text-text-muted">Led by {selectedTeam.leader}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTeam(null)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <i className="uil uil-times text-white"></i>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Project: {selectedTeam.project}</h3>
                    <p className="text-text-muted">{selectedTeam.description}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-white font-medium mb-3">Team Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-muted">Members:</span>
                          <span className="text-white">{selectedTeam.members}/{selectedTeam.maxMembers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Category:</span>
                          <span className="text-white capitalize">{selectedTeam.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Deadline:</span>
                          <span className="text-white">{new Date(selectedTeam.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-3">Technologies</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTeam.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10">
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedTeam(null)}
                    className="flex-1 px-4 py-2 text-text-muted hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleJoinTeam(selectedTeam)}
                    className="flex-1 btn-primary"
                  >
                    <i className="uil uil-plus mr-2"></i>
                    Join Team
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinTeamExplorer;
