import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useToast, ToastContainer } from '../../hooks/useToast.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { TableSkeleton } from '../ui/Skeletons';

const Submissions = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [activeCategory, setActiveCategory] = useState(searchParams.get('status') || 'all');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({ name: '', description: '', github: '', deployment: '', video: '', track: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const { toasts, success, error: showError } = useToast();
  const [filters, setFilters] = useState({
    search: searchParams.get('query') || '',
    track: 'all',
    stage: 'all',
    sort: 'newest'
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.submissions.getAll();
        const data = response.data;
        if (data && Array.isArray(data)) {
          setSubmissions(data);
        } else if (data && data.data && Array.isArray(data.data)) {
          setSubmissions(data.data);
        } else {
          setSubmissions([]);
        }
      } catch (error) {
        console.error('Failed to fetch submissions:', error);
        setSubmissions([]);
        if (import.meta.env.VITE_USE_MOCK_API !== 'false') {
          const mockSubmissions = [
            {
              id: 1,
              project: 'AI Campus Navigator',
              team: 'Team Alpha',
              status: 'scoring',
              stage: 'technical',
              score: 92,
              submitted: '2024-03-07 14:30',
              track: 'AI/ML',
              repoUrl: 'github.com/alpha/ai-nav',
              demoUrl: 'demo.ai-nav.com',
              judges: ['judge-001', 'judge-002']
            },
            {
              id: 2,
              project: 'Blockchain Voting',
              team: 'Team Beta',
              status: 'passed',
              stage: 'final',
              score: 88,
              submitted: '2024-03-06 16:45',
              track: 'Web3',
              repoUrl: 'github.com/beta/voting',
              demoUrl: null,
              judges: ['judge-001', 'judge-003']
            },
            {
              id: 3,
              project: 'AR Study Assistant',
              team: 'Team Gamma',
              status: 'queued',
              stage: 'initial',
              score: null,
              submitted: '2024-03-05 12:15',
              track: 'Gaming',
              repoUrl: 'github.com/gamma/ar-study',
              demoUrl: 'ar-study.demo.com',
              judges: []
            },
            {
              id: 4,
              project: 'Smart City IoT',
              team: 'Team Delta',
              status: 'failed',
              stage: 'technical',
              score: 45,
              submitted: '2024-03-04 09:20',
              track: 'Open Innovation',
              repoUrl: 'github.com/delta/smart-city',
              demoUrl: 'smart-city.demo.com',
              judges: ['judge-002', 'judge-004']
            }
          ];
          setSubmissions(mockSubmissions);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  useEffect(() => {
    if (showSubmitModal) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [showSubmitModal]);

  const categories = [
    { id: 'all', label: 'All', count: Array.isArray(submissions) ? submissions.length : 0 },
    { id: 'queued', label: 'Queued', count: Array.isArray(submissions) ? submissions.filter(s => s.status === 'queued').length : 0 },
    { id: 'scoring', label: 'Scoring', count: Array.isArray(submissions) ? submissions.filter(s => s.status === 'scoring').length : 0 },
    { id: 'passed', label: 'Passed', count: Array.isArray(submissions) ? submissions.filter(s => s.status === 'passed').length : 0 },
    { id: 'failed', label: 'Failed', count: Array.isArray(submissions) ? submissions.filter(s => s.status === 'failed').length : 0 }
  ];

  const filteredSubmissions = Array.isArray(submissions) ? submissions.filter(submission => {
    if (activeCategory !== 'all' && submission.status !== activeCategory) return false;
    if (filters.search && !submission.title?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.track !== 'all' && submission.track !== filters.track) return false;
    if (filters.stage !== 'all' && submission.stage !== filters.stage) return false;
    return true;
  }).sort((a, b) => {
    if (filters.sort === 'newest') return new Date(b.submitted) - new Date(a.submitted);
    if (filters.sort === 'oldest') return new Date(a.submitted) - new Date(b.submitted);
    if (filters.sort === 'priority') return (b.score || 0) - (a.score || 0);
    return 0;
  }) : [];

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setSearchParams({ status: categoryId });
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      setSearchParams({ query: filters.search });
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleReset = () => {
    setFilters({ search: '', track: 'all', stage: 'all', sort: 'newest' });
    setSearchParams({});
    setHasChanges(false);
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleApply = () => {
    setHasChanges(false);
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!submitForm.name.trim() || submitForm.name.length < 5) newErrors.name = 'Project Name must be at least 5 characters';
    if (!submitForm.description.trim() || submitForm.description.length < 50) newErrors.description = 'Description must be at least 50 characters';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Submit Project',
      message: 'Are you sure you want to submit this project? This action cannot be undone.',
      onConfirm: async () => {
        try {
          setSubmitting(true);
          const teamId = localStorage.getItem('team_id') || 'default_team';
          const hackathonId = localStorage.getItem('hackathon_id') || 'hack_1';

          const payload = {
            team_id: teamId,
            hackathon_id: hackathonId,
            title: submitForm.name,
            description: submitForm.description,
            github_link: submitForm.github,
            demo_link: submitForm.deployment || submitForm.video,
            submitted_by: localStorage.getItem('user_email') || ''
          };

          console.log('SUBMITTING SUBMISSION:', payload);

          const response = await apiService.submissions.create(payload);
          if (!response?.data?.success) {
            throw new Error(response?.data?.message || 'Failed to submit project');
          }

          setShowSubmitModal(false);
          setSubmitForm({ name: '', description: '', github: '', deployment: '', video: '', track: '' });
          setErrors({});
          success('Project submitted successfully!');
          setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
          console.error('Submission error:', error);
          showError(error.message || error.response?.data?.message || 'Failed to submit project');
        } finally {
          setSubmitting(false);
          setConfirmDialog({ isOpen: false });
        }
      }
    });
  };

  const handleViewSubmission = (submissionId) => {
    navigate(`/submissions/${submissionId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return 'text-success bg-success/20 shadow-success/20';
      case 'failed': return 'text-error bg-error/20 shadow-error/20';
      case 'scoring': return 'text-warning bg-warning/20 shadow-warning/20';
      case 'queued': return 'text-cyan bg-cyan/20 shadow-cyan/20';
      default: return 'text-text-muted bg-gunmetal';
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'final': return 'text-success bg-success/20 shadow-success/20';
      case 'technical': return 'text-warning bg-warning/20 shadow-warning/20';
      case 'initial': return 'text-text-muted bg-gunmetal';
      default: return 'text-text-muted bg-gunmetal';
    }
  };

  const SubmissionRow = ({ submission, index }) => (
    <tr
      className={`border-b border-white/5 hover:border-cyan/30 hover:bg-white/5 transition-all duration-300 cursor-pointer animate-fade-in group`}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => handleViewSubmission(submission.id)}
    >
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-white group-hover:text-cyan transition-colors text-sm">
            {submission.title || submission.project || 'Untitled'}
          </div>
          <div className="text-xs text-text-muted">{submission.track}</div>
        </div>
      </td>
      <td className="px-4 py-3 text-text-secondary text-sm">{submission.team}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)} shadow-sm hover:shadow-md transition-shadow duration-200`}>
          {submission.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(submission.stage)} shadow-sm hover:shadow-md transition-shadow duration-200`}>
          {submission.stage}
        </span>
      </td>
      <td className="px-4 py-3 text-white text-sm font-medium">{submission.score || '—'}</td>
      <td className="px-4 py-3 text-text-muted text-xs">{submission.submitted}</td>
      <td className="px-4 py-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewSubmission(submission.id);
          }}
          className="text-cyan hover:text-white transition-all duration-200 hover:scale-110 hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]"
        >
          <i className="uil uil-eye text-sm"></i>
        </button>
      </td>
    </tr>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-white/10 rounded-lg w-40"></div>
            <div className="h-5 bg-white/5 rounded w-72"></div>
          </div>
          <TableSkeleton rows={8} />
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
            <h1 className="text-3xl font-bold text-white mb-1">Submissions</h1>
            <p className="text-text-muted text-sm">Track and manage your project submissions</p>
          </div>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-5 py-2.5 bg-white text-black border border-gray-300 hover:bg-gray-100 font-medium rounded-lg transition-all duration-300 hover:shadow-lg flex items-center gap-2"
          >
            <i className="uil uil-plus text-sm"></i>
            Submit Project
          </button>
        </div>

        {/* Category Pills */}
        <div className="glass-card rounded-full border border-white/10 p-1 shadow-lg inline-flex">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`relative px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                activeCategory === category.id
                  ? 'text-black'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {activeCategory === category.id && (
                <div className="absolute inset-0 bg-cyan rounded-full shadow-lg shadow-cyan/25 animate-slide-in"></div>
              )}
              <span className="relative z-10">
                {category.label}
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                  activeCategory === category.id ? 'bg-black/20' : 'bg-white/10'
                }`}>
                  {category.count}
                </span>
              </span>
            </button>
          ))}
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
                  placeholder="Search submissions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyPress={handleSearchSubmit}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-text-muted focus:border-cyan/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Track Filter */}
            <select
              value={filters.track}
              onChange={(e) => handleFilterChange('track', e.target.value)}
              className={`px-3 py-2 bg-white/5 border rounded-full text-white text-sm focus:outline-none transition-all duration-200 ${
                filters.track !== 'all' ? 'border-cyan/50 shadow-lg shadow-cyan/10/20' : 'border-white/10'
              }`}
            >
              <option value="all">All Tracks</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Web3">Web3</option>
              <option value="Gaming">Gaming</option>
              <option value="Open Innovation">Open Innovation</option>
            </select>

            {/* Stage Filter */}
            <select
              value={filters.stage}
              onChange={(e) => handleFilterChange('stage', e.target.value)}
              className={`px-3 py-2 bg-white/5 border rounded-full text-white text-sm focus:outline-none transition-all duration-200 ${
                filters.stage !== 'all' ? 'border-cyan/50 shadow-lg shadow-cyan/10/20' : 'border-white/10'
              }`}
            >
              <option value="all">All Stages</option>
              <option value="initial">Initial</option>
              <option value="technical">Technical</option>
              <option value="final">Final</option>
            </select>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-full text-white text-sm focus:border-cyan/50 focus:outline-none transition-colors"
            >
              <option value="newest">Sort by Newest</option>
              <option value="oldest">Sort by Oldest</option>
              <option value="priority">Sort by Priority</option>
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
          </div>
        </div>

        {/* Submissions Table */}
        <div className={`glass-card rounded-xl border border-white/10 overflow-hidden transition-all duration-500 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr className="h-12">
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary text-sm">Project</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary text-sm">Team</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary text-sm">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary text-sm">Stage</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary text-sm">Score</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary text-sm">Submitted</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission, index) => (
                  <SubmissionRow key={`${submission.id}-${index}`} submission={submission} index={index} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredSubmissions.length === 0 && (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <i className="uil uil-file-upload text-2xl text-text-muted"></i>
              </div>
              <h3 className="text-xl font-semibold text-white">No submissions found</h3>
              <p className="text-text-secondary max-w-sm">
                {filters.search ? `No submissions match "${filters.search}"` : 'No submissions match your current filters.'}
              </p>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-6 py-3 bg-cyan hover:bg-cyan/80 text-black font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyan/25 hover:scale-105 animate-pulse"
              >
                Submit Your First Project
              </button>
            </div>
          </div>
        )}

        {/* Submit Project Modal - FIXED UI */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSubmitModal(false)}>
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 dark:bg-slate-900 light:bg-white rounded-xl shadow-xl p-6 border border-slate-700 light:border-gray-200 mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white dark:text-white light:text-gray-900">Submit Your Project</h2>
                <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-white dark:hover:text-white light:hover:text-gray-600 transition-colors">
                  <i className="uil uil-times text-xl"></i>
                </button>
              </div>
              <form className="space-y-4" onSubmit={handleSubmitProject}>
                <div>
                  <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2">Project Name *</label>
                  <input type="text" value={submitForm.name} onChange={(e) => setSubmitForm({...submitForm, name: e.target.value})} className={`w-full px-3 py-2 bg-white/5 dark:bg-white/5 light:bg-gray-100 border rounded-lg text-white dark:text-white light:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 light:placeholder-gray-400 ${errors.name ? 'border-red-500' : 'border-white/10 dark:border-white/10 light:border-gray-300'}`} placeholder="Enter project name" required minLength="5" />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2">Description * (min 50 characters)</label>
                  <textarea value={submitForm.description} onChange={(e) => setSubmitForm({...submitForm, description: e.target.value})} className={`w-full px-3 py-2 bg-white/5 dark:bg-white/5 light:bg-gray-100 border rounded-lg text-white dark:text-white light:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 light:placeholder-gray-400 ${errors.description ? 'border-red-500' : 'border-white/10 dark:border-white/10 light:border-gray-300'}`} rows="6" placeholder="Describe your project..." required minLength="50" />
                  <p className={`text-xs mt-1 ${submitForm.description.length < 50 ? 'text-red-400' : 'text-gray-400 dark:text-gray-400 light:text-gray-600'}`}>{submitForm.description.length}/50 characters</p>
                  {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2">GitHub Repository URL</label>
                  <input type="url" value={submitForm.github} onChange={(e) => setSubmitForm({...submitForm, github: e.target.value})} className="w-full px-3 py-2 bg-white/5 dark:bg-white/5 light:bg-gray-100 border border-white/10 dark:border-white/10 light:border-gray-300 rounded-lg text-white dark:text-white light:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 light:placeholder-gray-400" placeholder="https://github.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2">Deployment Link</label>
                  <input type="url" value={submitForm.deployment} onChange={(e) => setSubmitForm({...submitForm, deployment: e.target.value})} className="w-full px-3 py-2 bg-white/5 dark:bg-white/5 light:bg-gray-100 border border-white/10 dark:border-white/10 light:border-gray-300 rounded-lg text-white dark:text-white light:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 light:placeholder-gray-400" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2">Demo Video Link</label>
                  <input type="url" value={submitForm.video} onChange={(e) => setSubmitForm({...submitForm, video: e.target.value})} className="w-full px-3 py-2 bg-white/5 dark:bg-white/5 light:bg-gray-100 border border-white/10 dark:border-white/10 light:border-gray-300 rounded-lg text-white dark:text-white light:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 light:placeholder-gray-400" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2">Track Selection *</label>
                  <select value={submitForm.track} onChange={(e) => setSubmitForm({...submitForm, track: e.target.value})} className="w-full px-3 py-2 bg-white/5 dark:bg-white/5 light:bg-gray-100 border border-white/10 dark:border-white/10 light:border-gray-300 rounded-lg text-white dark:text-white light:text-gray-900" required>
                    <option value="" disabled>Select track</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="Web3">Web3</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Open Innovation">Open Innovation</option>
                  </select>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm text-blue-400"><strong>Note:</strong> Your project will be automatically judged by AI. Scores will be available shortly after submission.</p>
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="submit" disabled={submitting} className="flex-1 bg-cyan hover:bg-cyan/80 disabled:opacity-50 text-black font-medium py-3 rounded-lg transition-colors">{submitting ? 'Submitting...' : 'Submit Project'}</button>
                  <button type="button" onClick={() => setShowSubmitModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Submit"
        type="primary"
      />
    </div>
  );
};

export default Submissions;
