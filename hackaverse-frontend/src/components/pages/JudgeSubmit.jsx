import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

const JudgeSubmit = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectTitle: '',
    description: '',
    techStack: '',
    githubUrl: '',
    demoUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.projectTitle.length < 5) {
      setError('Project title must be at least 5 characters');
      return;
    }
    if (formData.description.length < 50) {
      setError('Description must be at least 50 characters for proper evaluation');
      return;
    }
    if (formData.techStack.length < 3) {
      setError('Please provide a valid tech stack');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const teamId = userData.team_id || userData.id || `team_${Date.now()}`;

      const submissionText = `
Project Title: ${formData.projectTitle}

Project Description:
${formData.description}

Technology Stack: ${formData.techStack}

GitHub Repository: ${formData.githubUrl || 'Not provided'}
Live Demo: ${formData.demoUrl || 'Not provided'}

Evaluation Criteria:
- Clarity: How well is the project explained and documented?
- Quality: Code quality, functionality, and completeness
- Innovation: Uniqueness and creative problem-solving
      `.trim();

      const response = await apiService.judge.submitAndScore({
        submission_text: submissionText,
        team_id: teamId,
        tenant_id: 'default',
        event_id: 'default_event',
        request_id: `${teamId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

      console.log('Full API Response:', response);
      console.log('Response.data:', response.data);
      
      // Handle different response structures
      let resultData;
      if (response.data?.data) {
        resultData = response.data.data;
      } else if (response.data?.clarity !== undefined) {
        resultData = response.data;
      } else {
        throw new Error('Invalid response format');
      }
      
      console.log('Result Data:', resultData);
      setResult(resultData);
    } catch (err) {
      console.error('Submission error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      console.error('Error detail:', err.response?.data?.detail);
      
      let errorMsg = 'Failed to submit. Please try again.';
      
      if (err.response?.status === 409) {
        errorMsg = 'This project has already been submitted. Please modify your project or submit a different one.';
      } else if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map(d => d.msg || d).join(', ');
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickTest = () => {
    setFormData({
      projectTitle: 'AI-Powered Task Management System',
      description: 'A comprehensive task management application that uses artificial intelligence to prioritize tasks, predict completion times, and suggest optimal work schedules. The system analyzes user behavior patterns and adapts to individual productivity rhythms. Features include smart notifications, collaborative workspaces, and integration with popular productivity tools.',
      techStack: 'React, Node.js, Express, MongoDB, TensorFlow.js, Socket.io',
      githubUrl: 'https://github.com/example/ai-task-manager',
      demoUrl: 'https://ai-task-demo.example.com'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1128] to-[#15193B] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Submit Project for Judging</h1>
          <button
            onClick={handleQuickTest}
            className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 text-sm"
          >
            <i className="uil uil-flask mr-2"></i>
            Quick Test
          </button>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-white mb-2">Project Title *</label>
                <input
                  type="text"
                  required
                  value={formData.projectTitle}
                  onChange={(e) => setFormData({...formData, projectTitle: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA]"
                  placeholder="Enter project title"
                />
              </div>

              <div>
                <label className="block text-white mb-2">Description * (min 50 characters)</label>
                <textarea
                  required
                  minLength={50}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA]"
                  placeholder="Describe your project in detail - what problem does it solve, key features, implementation details"
                  rows={6}
                />
                <div className="text-xs text-white/40 mt-1">{formData.description.length} / 50 characters</div>
              </div>

              <div>
                <label className="block text-white mb-2">Tech Stack *</label>
                <input
                  type="text"
                  required
                  value={formData.techStack}
                  onChange={(e) => setFormData({...formData, techStack: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA]"
                  placeholder="e.g., React, Node.js, MongoDB"
                />
              </div>

              <div>
                <label className="block text-white mb-2">GitHub URL</label>
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA]"
                  placeholder="https://github.com/..."
                />
              </div>

              <div>
                <label className="block text-white mb-2">Demo URL</label>
                <input
                  type="url"
                  value={formData.demoUrl}
                  onChange={(e) => setFormData({...formData, demoUrl: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA]"
                  placeholder="https://..."
                />
              </div>
            </div>

            {error && typeof error === 'string' && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit for Judging'
              )}
            </button>
          </form>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="uil uil-check text-white text-3xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Submission Judged!</h2>
              <p className="text-white/60">Your project has been evaluated by AI</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-white/60 text-sm mb-1">Clarity</div>
                <div className="text-3xl font-bold text-white">{result?.clarity || 0}</div>
                <div className="text-white/40 text-xs">/ 100</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-white/60 text-sm mb-1">Quality</div>
                <div className="text-3xl font-bold text-white">{result?.quality || 0}</div>
                <div className="text-white/40 text-xs">/ 100</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-white/60 text-sm mb-1">Innovation</div>
                <div className="text-3xl font-bold text-white">{result?.innovation || 0}</div>
                <div className="text-white/40 text-xs">/ 100</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#BF40BF]/20 to-[#00F2EA]/20 border border-white/20 rounded-lg p-6 text-center">
              <div className="text-white/60 text-sm mb-2">Total Score</div>
              <div className="text-5xl font-bold text-white mb-2">{Number(result?.total_score || 0).toFixed(2)}</div>
              <div className="text-white/40 text-sm">Confidence: {Number((result?.confidence || 0) * 100).toFixed(0)}%</div>
              <div className="mt-4 text-xs text-white/50">✓ Sent to Judge Panel for Manual Review</div>
            </div>

            {result?.trace && (
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/60 text-sm mb-2">AI Reasoning</div>
                <div className="text-white/80 text-sm">{String(result.trace)}</div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/leaderboard')}
                className="flex-1 bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] text-white py-3 rounded-lg font-semibold hover:opacity-90"
              >
                View Leaderboard
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setFormData({
                    projectTitle: '',
                    description: '',
                    techStack: '',
                    githubUrl: '',
                    demoUrl: ''
                  });
                }}
                className="flex-1 bg-white/10 border border-white/20 text-white py-3 rounded-lg font-semibold hover:bg-white/20"
              >
                Submit Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JudgeSubmit;
