import { useState } from 'react';
import { Link } from 'react-router-dom';
import StartProjectWizard from './StartProjectWizard';
import JoinTeamExplorer from './JoinTeamExplorer';
import SubmitWorkWorkspace from './SubmitWorkWorkspace';

const QuickStartModal = ({ isOpen, onClose }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [showSubmitWorkspace, setShowSubmitWorkspace] = useState(false);

  const quickStartOptions = [
    {
      id: 'project',
      title: 'Start a New Project',
      description: 'Create your hackathon submission from scratch',
      icon: 'uil-rocket',
      color: 'cyan',
      action: 'Start Wizard',
      isWizard: true
    },
    {
      id: 'team',
      title: 'Join a Team',
      description: 'Find talented developers and designers to collaborate with',
      icon: 'uil-users-alt',
      color: 'violet',
      action: 'Browse Teams',
      isExplorer: true
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add skills, bio, and showcase your expertise',
      icon: 'uil-user-circle',
      color: 'orange',
      path: '/app/profile',
      action: 'Edit Profile'
    },
    {
      id: 'submit',
      title: 'Submit Your Work',
      description: 'Ready to submit? Upload your project files',
      icon: 'uil-file-upload-alt',
      color: 'lime',
      action: 'Submit Work',
      isWorkspace: true
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-card rounded-2xl border max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Quick Start Guide</h2>
              <p className="text-text-muted">Choose how you'd like to get started with HackaVerse</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <i className="uil uil-times text-white"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid gap-4">
            {quickStartOptions.map((option, index) => (
              <div
                key={option.id}
                className={`glass-card rounded-xl border p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] animate-slide-in-up ${
                  selectedOption === option.id
                    ? `border-${option.color}-400/50 bg-${option.color}-400/10`
                    : 'border-white/10 hover:border-white/20'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setSelectedOption(option.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-${option.color}-400/20 border border-${option.color}-400/30 flex items-center justify-center flex-shrink-0`}>
                    <i className={`uil ${option.icon} text-${option.color}-400 text-xl`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1">{option.title}</h3>
                    <p className="text-text-muted text-sm mb-3">{option.description}</p>
                    {selectedOption === option.id && (
                      <div className="animate-fade-in">
                        {option.isWizard ? (
                          <button
                            onClick={() => {
                              setShowWizard(true);
                              onClose();
                            }}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-${option.color}-400/20 border border-${option.color}-400/30 text-${option.color}-400 font-medium hover:bg-${option.color}-400/30 transition-colors`}
                          >
                            {option.action}
                            <i className="uil uil-arrow-right text-sm"></i>
                          </button>
                        ) : option.isExplorer ? (
                          <button
                            onClick={() => {
                              setShowExplorer(true);
                              onClose();
                            }}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-${option.color}-400/20 border border-${option.color}-400/30 text-${option.color}-400 font-medium hover:bg-${option.color}-400/30 transition-colors`}
                          >
                            {option.action}
                            <i className="uil uil-arrow-right text-sm"></i>
                          </button>
                        ) : option.isWorkspace ? (
                          <button
                            onClick={() => {
                              setShowSubmitWorkspace(true);
                              onClose();
                            }}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-${option.color}-400/20 border border-${option.color}-400/30 text-${option.color}-400 font-medium hover:bg-${option.color}-400/30 transition-colors`}
                          >
                            {option.action}
                            <i className="uil uil-arrow-right text-sm"></i>
                          </button>
                        ) : (
                          <Link
                            to={option.path}
                            onClick={onClose}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-${option.color}-400/20 border border-${option.color}-400/30 text-${option.color}-400 font-medium hover:bg-${option.color}-400/30 transition-colors`}
                          >
                            {option.action}
                            <i className="uil uil-arrow-right text-sm"></i>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedOption === option.id
                      ? `border-${option.color}-400 bg-${option.color}-400`
                      : 'border-white/30'
                  }`}>
                    {selectedOption === option.id && (
                      <i className="uil uil-check text-white text-xs"></i>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Resources */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Need Help Getting Started?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                to="/app/mentors"
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 bg-blue-400/20 rounded-lg flex items-center justify-center">
                  <i className="uil uil-graduation-cap text-blue-400"></i>
                </div>
                <div>
                  <div className="text-white font-medium group-hover:text-blue-400 transition-colors">Talk to Mentors</div>
                  <div className="text-text-muted text-sm">Get guidance from experts</div>
                </div>
              </Link>
              <Link
                to="/app/leaderboard"
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 bg-yellow-400/20 rounded-lg flex items-center justify-center">
                  <i className="uil uil-trophy text-yellow-400"></i>
                </div>
                <div>
                  <div className="text-white font-medium group-hover:text-yellow-400 transition-colors">View Leaderboard</div>
                  <div className="text-text-muted text-sm">See top performers</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Start Project Wizard */}
      <StartProjectWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
      />

      {/* Join Team Explorer */}
      <JoinTeamExplorer
        isOpen={showExplorer}
        onClose={() => setShowExplorer(false)}
      />

      {/* Submit Work Workspace */}
      <SubmitWorkWorkspace
        isOpen={showSubmitWorkspace}
        onClose={() => setShowSubmitWorkspace(false)}
      />
    </div>
  );
};

export default QuickStartModal;
