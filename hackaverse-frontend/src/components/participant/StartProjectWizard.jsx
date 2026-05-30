import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StartProjectWizard = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    category: '',
    technologies: [],
    teamSize: 'solo',
    deadline: ''
  });

  const categories = [
    { id: 'web', label: 'Web Application', icon: 'uil-web-grid', color: 'cyan' },
    { id: 'mobile', label: 'Mobile App', icon: 'uil-mobile-android', color: 'violet' },
    { id: 'ai', label: 'AI/ML Project', icon: 'uil-brain', color: 'pink' },
    { id: 'game', label: 'Game Development', icon: 'uil-game-structure', color: 'lime' },
    { id: 'iot', label: 'IoT/Smart Device', icon: 'uil-processor', color: 'orange' },
    { id: 'other', label: 'Other', icon: 'uil-plus', color: 'gray' }
  ];

  const technologies = [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#',
    'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'TensorFlow', 'PyTorch',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Firebase'
  ];

  const teamSizes = [
    { value: 'solo', label: 'Solo Project', icon: 'uil-user', description: 'Build it yourself' },
    { value: 'small', label: 'Small Team (2-4)', icon: 'uil-users-alt', description: 'Perfect for hackathons' },
    { value: 'medium', label: 'Medium Team (5-8)', icon: 'uil-building', description: 'More complex projects' },
    { value: 'large', label: 'Large Team (9+)', icon: 'uil-city', description: 'Enterprise-scale' }
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Here you would typically send the data to your backend
    console.log('Creating submission:', projectData);
    // For now, route to submissions page
    navigate('/app/submissions');
    onClose();
  };

  const updateProjectData = (field, value) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTechnology = (tech) => {
    setProjectData(prev => ({
      ...prev,
      technologies: prev.technologies.includes(tech)
        ? prev.technologies.filter(t => t !== tech)
        : [...prev.technologies, tech]
    }));
  };

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
              <h2 className="text-2xl font-bold text-white mb-2">Start Your Project</h2>
              <p className="text-text-muted">Step {currentStep} of 4</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <i className="uil uil-times text-white"></i>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-400 to-violet-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">What's your project name?</h3>
                <p className="text-text-muted mb-4">Choose a clear, descriptive name for your project</p>
                <input
                  type="text"
                  value={projectData.name}
                  onChange={(e) => updateProjectData('name', e.target.value)}
                  placeholder="e.g., EcoTracker - Carbon Footprint Calculator"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-text-muted focus:border-cyan-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Project Description</h3>
                <p className="text-text-muted mb-4">Briefly describe what your project does</p>
                <textarea
                  value={projectData.description}
                  onChange={(e) => updateProjectData('description', e.target.value)}
                  placeholder="Describe your project's main goal and features..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-text-muted focus:border-cyan-400 focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">What type of project is this?</h3>
                <p className="text-text-muted mb-6">Select the category that best fits your project</p>
                <div className="grid grid-cols-2 gap-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => updateProjectData('category', category.id)}
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        projectData.category === category.id
                          ? `border-${category.color}-400 bg-${category.color}-400/20`
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-${category.color}-400/20 rounded-lg flex items-center justify-center`}>
                          <i className={`uil ${category.icon} text-${category.color}-400`}></i>
                        </div>
                        <span className="text-white font-medium">{category.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Technologies & Tools</h3>
                <p className="text-text-muted mb-6">Select the technologies you'll be using</p>
                <div className="flex flex-wrap gap-2">
                  {technologies.map((tech) => (
                    <button
                      key={tech}
                      onClick={() => toggleTechnology(tech)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        projectData.technologies.includes(tech)
                          ? 'bg-cyan-400/20 border border-cyan-400/50 text-cyan-400'
                          : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                      }`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Team Size</h3>
                <p className="text-text-muted mb-6">How many people will work on this project?</p>
                <div className="grid grid-cols-2 gap-4">
                  {teamSizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => updateProjectData('teamSize', size.value)}
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        projectData.teamSize === size.value
                          ? 'border-violet-400 bg-violet-400/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <i className={`uil ${size.icon} text-violet-400`}></i>
                        <span className="text-white font-medium">{size.label}</span>
                      </div>
                      <p className="text-text-muted text-sm">{size.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Set a Deadline</h3>
                <p className="text-text-muted mb-4">When do you plan to complete this project?</p>
                <input
                  type="date"
                  value={projectData.deadline}
                  onChange={(e) => updateProjectData('deadline', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-cyan-400 focus:outline-none transition-colors"
                />
              </div>

              {/* Project Summary */}
              <div className="glass-card rounded-xl border p-4">
                <h4 className="text-lg font-semibold text-white mb-4">Project Summary</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Name:</span>
                    <span className="text-white">{projectData.name || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Category:</span>
                    <span className="text-white">
                      {categories.find(c => c.id === projectData.category)?.label || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Team Size:</span>
                    <span className="text-white">
                      {teamSizes.find(s => s.value === projectData.teamSize)?.label || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Technologies:</span>
                    <span className="text-white">
                      {projectData.technologies.length > 0
                        ? projectData.technologies.join(', ')
                        : 'None selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Deadline:</span>
                    <span className="text-white">
                      {projectData.deadline
                        ? new Date(projectData.deadline).toLocaleDateString()
                        : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-6 py-2 text-text-muted hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-text-muted hover:text-white transition-colors"
            >
              Cancel
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && (!projectData.name || !projectData.description)) ||
                  (currentStep === 2 && !projectData.category)
                }
                className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="btn-primary px-6 py-2"
              >
                Create Project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartProjectWizard;
