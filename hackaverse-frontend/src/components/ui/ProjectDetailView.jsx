import React from 'react';

const ProjectDetailView = ({ project, onBack }) => {
  if (!project) return null;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors"
      >
        <i className="uil uil-arrow-left"></i>
        Back to Projects
      </button>

      {/* Project Header */}
      <div className="glass-card rounded-xl border p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">{project.title}</h1>
            <p className="text-text-secondary">by {project.team}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              project.status === 'submitted' ? 'text-success bg-success/20' :
              project.status === 'in-progress' ? 'text-warning bg-warning/20' :
              'text-text-muted bg-gunmetal'
            }`}>
              {project.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              project.track === 'AI/ML' ? 'text-cyan bg-cyan/20' :
              project.track === 'Web3' ? 'text-violet bg-violet/20' :
              project.track === 'Gaming' ? 'text-lime bg-lime/20' :
              'text-warning bg-warning/20'
            }`}>
              {project.track}
            </span>
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <i className="uil uil-users-alt text-text-muted"></i>
              <span className="text-text-secondary text-sm">Team Members</span>
            </div>
            <p className="text-white font-semibold">{project.members} members</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <i className="uil uil-calendar-alt text-text-muted"></i>
              <span className="text-text-secondary text-sm">Last Updated</span>
            </div>
            <p className="text-white font-semibold">{project.updated}</p>
          </div>
          {project.score && (
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <i className="uil uil-trophy text-warning"></i>
                <span className="text-text-secondary text-sm">Score</span>
              </div>
              <p className="text-white font-semibold">{project.score}/100</p>
            </div>
          )}
        </div>

        {/* Project Description */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Project Description</h3>
          <p className="text-text-secondary leading-relaxed">
            This is a detailed description of the {project.title} project. It showcases innovative solutions
            in the {project.track} track, demonstrating technical expertise and creative problem-solving.
            The project aims to address real-world challenges through cutting-edge technology and user-centric design.
          </p>
        </div>

        {/* Technologies Used */}
        <div className="mt-6 space-y-4">
          <h3 className="text-xl font-semibold text-white">Technologies Used</h3>
          <div className="flex flex-wrap gap-2">
            {['React', 'Node.js', 'Python', 'MongoDB', 'AWS'].map((tech) => (
              <span key={tech} className="px-3 py-1 bg-cyan/20 text-cyan rounded-full text-sm">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <button className="btn-primary px-6 py-2">
            <i className="uil uil-edit mr-2"></i>
            Edit Project
          </button>
          <button className="btn-secondary px-6 py-2">
            <i className="uil uil-share mr-2"></i>
            Share
          </button>
          <button className="btn-secondary px-6 py-2">
            <i className="uil uil-export mr-2"></i>
            Export
          </button>
        </div>
      </div>

      {/* Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <div className="glass-card rounded-xl border p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Team Members</h3>
          <div className="space-y-3">
            {Array.from({ length: project.members }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan/20 rounded-full flex items-center justify-center">
                  <i className="uil uil-user text-cyan"></i>
                </div>
                <div>
                  <p className="text-white font-medium">Team Member {i + 1}</p>
                  <p className="text-text-secondary text-sm">Role</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Timeline */}
        <div className="glass-card rounded-xl border p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Project Timeline</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <div>
                <p className="text-white font-medium">Project Started</p>
                <p className="text-text-secondary text-sm">2 weeks ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-warning rounded-full"></div>
              <div>
                <p className="text-white font-medium">Development Phase</p>
                <p className="text-text-secondary text-sm">In Progress</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-text-muted rounded-full"></div>
              <div>
                <p className="text-white font-medium">Submission Deadline</p>
                <p className="text-text-secondary text-sm">3 days remaining</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailView;
