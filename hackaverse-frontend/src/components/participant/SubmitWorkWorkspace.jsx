import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

const SubmitWorkWorkspace = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProject, setSelectedProject] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [submissionDetails, setSubmissionDetails] = useState({
    title: '',
    description: '',
    demoUrl: '',
    repoUrl: '',
    tags: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock project data - in real app this would come from API
  const userProjects = [
    {
      id: 1,
      name: 'AI Study Buddy',
      description: 'AI-powered learning platform',
      category: 'ai',
      status: 'in_progress',
      deadline: 'March 20, 2024',
      progress: 75
    },
    {
      id: 2,
      name: 'EcoQuest',
      description: 'Educational puzzle game for environmental awareness',
      category: 'game',
      status: 'completed',
      deadline: 'March 22, 2024',
      progress: 100
    },
    {
      id: 3,
      name: 'FitConnect',
      description: 'Cross-platform fitness tracking app',
      category: 'mobile',
      status: 'in_progress',
      deadline: 'March 18, 2024',
      progress: 60
    }
  ];

  const acceptedFileTypes = [
    '.zip', '.rar', '.tar.gz', '.pdf', '.doc', '.docx',
    '.ppt', '.pptx', '.jpg', '.png', '.gif', '.mp4',
    '.mov', '.avi', '.html', '.css', '.js', '.py',
    '.java', '.cpp', '.c', '.php', '.rb', '.go'
  ];

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      return acceptedFileTypes.includes(extension);
    });

    if (validFiles.length !== files.length) {
      alert('Some files were rejected. Only supported file types are allowed.');
    }

    setUploadedFiles(prev => [...prev, ...validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type || 'Unknown'
    }))]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Get user data for team_id
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const teamId = userData.team_id || userData.id || 'guest_user';

      // Prepare submission text combining all details
      const submissionText = `
Project: ${selectedProject?.name}
Title: ${submissionDetails.title}
Description: ${submissionDetails.description}
Demo URL: ${submissionDetails.demoUrl || 'N/A'}
Repository: ${submissionDetails.repoUrl || 'N/A'}
Tags: ${submissionDetails.tags.join(', ') || 'N/A'}
Files: ${uploadedFiles.map(f => f.file.name).join(', ')}
      `.trim();

      // Submit to backend for judging
      const response = await apiService.judge.submitAndScore({
        submission_text: submissionText,
        team_id: teamId,
        tenant_id: 'default',
        event_id: 'default_event'
      });

      console.log('Submission successful:', response.data);

      // Show success message
      alert('Submission successful! Your work has been submitted for judging.');

      setIsSubmitting(false);
      navigate('/app/submissions');
    } catch (error) {
      console.error('Error submitting work:', error);
      alert(error.userMessage || 'Failed to submit. Please try again.');
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedProject !== null;
      case 2: return uploadedFiles.length > 0;
      case 3: return submissionDetails.title.trim() && submissionDetails.description.trim();
      case 4: return true;
      default: return false;
    }
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
      <div className="relative glass-card rounded-2xl border max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Submit Your Work</h2>
              <p className="text-text-muted">Upload your project files and submit for judging</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <i className="uil uil-times text-white"></i>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {[
              { step: 1, label: 'Select Project', icon: 'uil-folder-open' },
              { step: 2, label: 'Upload Files', icon: 'uil-cloud-upload' },
              { step: 3, label: 'Submission Details', icon: 'uil-edit' },
              { step: 4, label: 'Review & Submit', icon: 'uil-check-circle' }
            ].map((step) => (
              <div key={step.step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  currentStep >= step.step
                    ? 'border-lime-400 bg-lime-400/20 text-lime-400'
                    : 'border-white/30 text-text-muted'
                }`}>
                  <i className={`uil ${step.icon} text-sm`}></i>
                </div>
                <div className="ml-3 hidden sm:block">
                  <div className={`text-sm font-medium ${currentStep >= step.step ? 'text-white' : 'text-text-muted'}`}>
                    {step.label}
                  </div>
                </div>
                {step.step < 4 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    currentStep > step.step ? 'bg-lime-400' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Select Project */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h3 className="text-xl font-semibold text-white mb-4">Choose Your Project</h3>
              <div className="grid gap-4">
                {userProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`glass-card rounded-xl border p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                      selectedProject?.id === project.id
                        ? 'border-lime-400/50 bg-lime-400/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-1">{project.name}</h4>
                        <p className="text-text-muted text-sm mb-3">{project.description}</p>
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span className="capitalize">{project.category}</span>
                          <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                          <span className={`px-2 py-1 rounded ${
                            project.status === 'completed' ? 'bg-green-400/20 text-green-400' : 'bg-yellow-400/20 text-yellow-400'
                          }`}>
                            {project.status === 'completed' ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedProject?.id === project.id
                          ? 'border-lime-400 bg-lime-400'
                          : 'border-white/30'
                      }`}>
                        {selectedProject?.id === project.id && (
                          <i className="uil uil-check text-white text-xs"></i>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-text-muted mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-lime-400 to-green-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Upload Files */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <h3 className="text-xl font-semibold text-white mb-4">Upload Project Files</h3>

              {/* Upload Area */}
              <div
                className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-lime-400/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-lime-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="uil uil-cloud-upload text-2xl text-lime-400"></i>
                </div>
                <h4 className="text-lg font-medium text-white mb-2">Drop files here or click to browse</h4>
                <p className="text-text-muted text-sm mb-4">
                  Supported formats: ZIP, RAR, PDF, DOC, PPT, Images, Videos, Code files
                </p>
                <p className="text-text-muted text-xs">
                  Maximum file size: 100MB per file
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={acceptedFileTypes.join(',')}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-white font-medium mb-3">Uploaded Files ({uploadedFiles.length})</h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((fileData) => (
                      <div key={fileData.id} className="flex items-center justify-between glass-card rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-lime-400/20 rounded-lg flex items-center justify-center">
                            <i className="uil uil-file text-lime-400 text-sm"></i>
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">{fileData.file.name}</div>
                            <div className="text-text-muted text-xs">{fileData.size} • {fileData.type}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(fileData.id)}
                          className="w-6 h-6 rounded bg-red-400/20 hover:bg-red-400/30 flex items-center justify-center transition-colors"
                        >
                          <i className="uil uil-times text-red-400 text-xs"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Submission Details */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <h3 className="text-xl font-semibold text-white mb-4">Submission Details</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">Submission Title *</label>
                  <input
                    type="text"
                    value={submissionDetails.title}
                    onChange={(e) => setSubmissionDetails(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter a compelling title for your submission"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-text-muted focus:border-lime-400 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Description *</label>
                  <textarea
                    value={submissionDetails.description}
                    onChange={(e) => setSubmissionDetails(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your project, its features, and what makes it unique..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-text-muted focus:border-lime-400 focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Demo URL</label>
                    <input
                      type="url"
                      value={submissionDetails.demoUrl}
                      onChange={(e) => setSubmissionDetails(prev => ({ ...prev, demoUrl: e.target.value }))}
                      placeholder="https://your-demo.com"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-text-muted focus:border-lime-400 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Repository URL</label>
                    <input
                      type="url"
                      value={submissionDetails.repoUrl}
                      onChange={(e) => setSubmissionDetails(prev => ({ ...prev, repoUrl: e.target.value }))}
                      placeholder="https://github.com/username/repo"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-text-muted focus:border-lime-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Tags</label>
                  <input
                    type="text"
                    placeholder="Add tags separated by commas (e.g., AI, React, Mobile)"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-text-muted focus:border-lime-400 focus:outline-none transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const tag = e.target.value.trim();
                        if (tag && !submissionDetails.tags.includes(tag)) {
                          setSubmissionDetails(prev => ({
                            ...prev,
                            tags: [...prev.tags, tag]
                          }));
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                  {submissionDetails.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {submissionDetails.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-lime-400/20 border border-lime-400/30 text-lime-400 rounded-full text-sm flex items-center gap-2"
                        >
                          {tag}
                          <button
                            onClick={() => setSubmissionDetails(prev => ({
                              ...prev,
                              tags: prev.tags.filter((_, i) => i !== index)
                            }))}
                            className="hover:text-red-400 transition-colors"
                          >
                            <i className="uil uil-times text-xs"></i>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="animate-fade-in">
              <h3 className="text-xl font-semibold text-white mb-4">Review Your Submission</h3>

              <div className="space-y-6">
                {/* Project Summary */}
                <div className="glass-card rounded-xl p-4">
                  <h4 className="text-white font-medium mb-3">Project</h4>
                  <div className="text-text-muted">
                    <div className="font-medium text-white">{selectedProject?.name}</div>
                    <div className="text-sm">{selectedProject?.description}</div>
                  </div>
                </div>

                {/* Files Summary */}
                <div className="glass-card rounded-xl p-4">
                  <h4 className="text-white font-medium mb-3">Files ({uploadedFiles.length})</h4>
                  <div className="space-y-2">
                    {uploadedFiles.slice(0, 3).map((fileData) => (
                      <div key={fileData.id} className="flex items-center gap-3 text-sm">
                        <i className="uil uil-file text-lime-400"></i>
                        <span className="text-white">{fileData.file.name}</span>
                        <span className="text-text-muted">({fileData.size})</span>
                      </div>
                    ))}
                    {uploadedFiles.length > 3 && (
                      <div className="text-text-muted text-sm">
                        +{uploadedFiles.length - 3} more files
                      </div>
                    )}
                  </div>
                </div>

                {/* Submission Details */}
                <div className="glass-card rounded-xl p-4">
                  <h4 className="text-white font-medium mb-3">Submission Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-text-muted">Title:</span> <span className="text-white">{submissionDetails.title}</span></div>
                    <div><span className="text-text-muted">Description:</span> <span className="text-white line-clamp-2">{submissionDetails.description}</span></div>
                    {submissionDetails.demoUrl && (
                      <div><span className="text-text-muted">Demo:</span> <span className="text-lime-400">{submissionDetails.demoUrl}</span></div>
                    )}
                    {submissionDetails.repoUrl && (
                      <div><span className="text-text-muted">Repository:</span> <span className="text-lime-400">{submissionDetails.repoUrl}</span></div>
                    )}
                    {submissionDetails.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {submissionDetails.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-lime-400/20 text-lime-400 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Terms */}
                <div className="glass-card rounded-xl p-4 border-orange-400/20 bg-orange-400/5">
                  <div className="flex items-start gap-3">
                    <i className="uil uil-exclamation-triangle text-orange-400 mt-0.5"></i>
                    <div>
                      <h4 className="text-white font-medium mb-1">Important Notes</h4>
                      <ul className="text-text-muted text-sm space-y-1">
                        <li>• Ensure all files are properly uploaded and accessible</li>
                        <li>• Double-check that your demo and repository links work</li>
                        <li>• Submissions cannot be modified after final submission</li>
                        <li>• Make sure your project meets all hackathon requirements</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <button
              onClick={currentStep === 1 ? onClose : prevStep}
              className="px-6 py-2 text-text-muted hover:text-white transition-colors"
            >
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </button>

            <div className="flex items-center gap-3">
              <span className="text-text-muted text-sm">
                Step {currentStep} of 4
              </span>

              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <i className="uil uil-arrow-right ml-2"></i>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <i className="uil uil-spinner-alt animate-spin mr-2"></i>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="uil uil-check mr-2"></i>
                      Submit Work
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitWorkWorkspace;
