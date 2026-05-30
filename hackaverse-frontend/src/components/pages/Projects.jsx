import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectDetailView from '../ui/ProjectDetailView';
import { apiService } from '../../services/api';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    track: 'all',
    status: 'all',
    sort: 'newest'
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.projects.getAll();
        const data = response.data;
        // Ensure projects is always an array
        if (data && Array.isArray(data)) {
          setProjects(data);
        } else if (data && data.data && Array.isArray(data.data)) {
          setProjects(data.data);
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        setProjects([]);
        // Fallback to mock data for development
        if (import.meta.env.VITE_USE_MOCK_API !== 'false') {
          const mockProjects = [
            { 
              id: 1, 
              title: 'AI Campus Navigator', 
              team: 'Team Alpha', 
              track: 'AI/ML', 
              status: 'submitted', 
              updated: '2 hours ago', 
              score: 92, 
              members: 4 
            },
            { 
              id: 2, 
              title: 'Blockchain Voting System', 
              team: 'Team Beta', 
              track: 'Web3', 
              status: 'in-progress', 
              updated: '1 day ago', 
              score: null, 
              members: 3 
            },
            { 
              id: 3, 
              title: 'AR Study Assistant', 
              team: 'Team Gamma', 
              track: 'Gaming', 
              status: 'draft', 
              updated: '3 hours ago', 
              score: null, 
              members: 5 
            }
          ];
          setProjects(mockProjects);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = Array.isArray(projects) ? projects.filter(project => {
    if (filters.search && !project.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.track !== 'all' && project.track !== filters.track) return false;
    if (filters.status !== 'all' && project.status !== filters.status) return false;
    return true;
  }) : [];

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
        { value: 'submitted', label: 'Submitted' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'draft', label: 'Draft' }
      ]
    },
    {
      placeholder: 'Sort',
      value: filters.sort,
      onChange: (value) => handleFilterChange('sort', value),
      options: [
        { value: 'newest', label: 'Newest' },
        { value: 'oldest', label: 'Oldest' },
        { value: 'score', label: 'Score' }
      ]
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'text-success bg-success/20';
      case 'in-progress': return 'text-warning bg-warning/20';
      case 'draft': return 'text-text-muted bg-gunmetal';
      default: return 'text-text-muted bg-gunmetal';
    }
  };

  const getTrackColor = (track) => {
    switch (track) {
      case 'AI/ML': return 'text-cyan bg-cyan/20';
      case 'Web3': return 'text-violet bg-violet/20';
      case 'Gaming': return 'text-lime bg-lime/20';
      case 'Open Innovation': return 'text-warning bg-warning/20';
      default: return 'text-text-muted bg-gunmetal';
    }
  };

  const ProjectCard = ({ project }) => (
    <div
      className="glass-card rounded-xl border border-white/10 p-5 hover:border-cyan/40 hover:shadow-lg hover:shadow-cyan/10/20 transition-all duration-300 cursor-pointer group hover:transform hover:scale-[1.02]"
      onClick={() => setSelectedProject(project)}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-white group-hover:text-cyan transition-colors leading-tight line-clamp-2">
          {project.title}
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white/10 rounded flex items-center justify-center">
            <i className="uil uil-users-alt text-text-muted text-xs"></i>
          </div>
          <span className="text-text-secondary text-sm truncate">{project.team}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTrackColor(project.track)}`}>
            {project.track}
          </span>
          <span className="text-text-muted text-xs">{project.members} members</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="text-xs text-text-muted">Updated {project.updated}</span>
        {project.score && (
          <div className="flex items-center gap-1.5">
            <i className="uil uil-trophy text-warning text-sm"></i>
            <span className="text-sm font-semibold text-white">{project.score}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 space-y-8">
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-white/10 rounded-lg w-40"></div>
            <div className="h-5 bg-white/5 rounded w-72"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[200px] bg-white/5 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show detailed view if a project is selected
  if (selectedProject) {
  return (
    <div className="min-h-screen pt-0">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
          <ProjectDetailView
            project={selectedProject}
            onBack={() => setSelectedProject(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Projects</h1>
            <p className="text-text-muted text-sm">Build and showcase your hackathon projects</p>
          </div>
          <button
            onClick={() => navigate('/projects/create')}
            className="px-5 py-2.5 bg-cyan hover:bg-cyan/80 text-black font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyan/25 hover:scale-105 flex items-center gap-2"
          >
            <i className="uil uil-plus text-sm"></i>
            Create Project
          </button>
        </div>

        {/* Compact Filter Bar */}
        <div className="glass-card rounded-xl border border-white/10 p-4 shadow-lg">
          <div className="flex flex-wrap items-center gap-3">

            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <i className="uil uil-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted text-sm"></i>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && navigate(`/projects?query=${filters.search}`)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:border-cyan/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Track Filter */}
            <select
              value={filters.track}
              onChange={(e) => handleFilterChange('track', e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-full text-white text-sm focus:border-cyan/50 focus:outline-none transition-colors"
            >
              <option value="all">All Tracks</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Web3">Web3</option>
              <option value="Gaming">Gaming</option>
              <option value="Open Innovation">Open Innovation</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-full text-white text-sm focus:border-cyan/50 focus:outline-none transition-colors"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="in-progress">In Progress</option>
              <option value="draft">Draft</option>
            </select>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-full text-white text-sm focus:border-cyan/50 focus:outline-none transition-colors"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="score">Score</option>
            </select>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-text-secondary hover:text-white text-sm transition-all duration-200"
            >
              Reset
            </button>

            {/* Apply */}
            <button
              onClick={handleApply}
              disabled={!hasChanges}
              className="px-4 py-2 bg-cyan hover:bg-cyan/80 disabled:bg-white/5 disabled:text-text-muted text-black font-medium rounded-full text-sm transition-all duration-200 disabled:cursor-not-allowed"
            >
              Apply
            </button>

            {/* View Toggle */}
            <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-cyan text-black shadow-md'
                    : 'text-text-secondary hover:text-white hover:bg-white/10'
                }`}
              >
                <i className="uil uil-apps text-sm"></i>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-cyan text-black shadow-md'
                    : 'text-text-secondary hover:text-white hover:bg-white/10'
                }`}
              >
                <i className="uil uil-list-ul text-sm"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredProjects.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <i className="uil uil-rocket text-2xl text-text-muted"></i>
              </div>
              <h3 className="text-xl font-semibold text-white">No projects found</h3>
              <p className="text-text-secondary max-w-sm">
                {filters.search ? `No projects match "${filters.search}"` : 'Start building something amazing and showcase your work!'}
              </p>
              <button
                onClick={() => navigate('/projects/create')}
                className="px-6 py-3 bg-cyan hover:bg-cyan/80 text-black font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyan/25 hover:scale-105 animate-pulse"
              >
                Create Your First Project
              </button>
            </div>
          </div>
        ) : (
          <div className={`transition-all duration-500 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr className="h-12">
                        <th className="text-left px-5 py-3 font-semibold text-text-secondary text-sm">Project</th>
                        <th className="text-left px-5 py-3 font-semibold text-text-secondary text-sm">Team</th>
                        <th className="text-left px-5 py-3 font-semibold text-text-secondary text-sm">Track</th>
                        <th className="text-left px-5 py-3 font-semibold text-text-secondary text-sm">Status</th>
                        <th className="text-left px-5 py-3 font-semibold text-text-secondary text-sm">Score</th>
                        <th className="text-left px-5 py-3 font-semibold text-text-secondary text-sm">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map(project => (
                        <tr
                          key={project.id}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => setSelectedProject(project)}
                        >
                          <td className="px-5 py-4">
                            <div className="font-medium text-white text-sm">{project.title}</div>
                          </td>
                          <td className="px-5 py-4 text-text-secondary text-sm">{project.team}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTrackColor(project.track)}`}>
                              {project.track}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-white text-sm">{project.score || '—'}</td>
                          <td className="px-5 py-4 text-text-muted text-sm">{project.updated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;