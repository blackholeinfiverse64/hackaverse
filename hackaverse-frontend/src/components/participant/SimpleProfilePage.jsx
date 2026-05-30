import { useState } from 'react';
import { Link } from 'react-router-dom';

const SimpleProfilePage = () => {
  // Simple hardcoded data - no auth dependency
  const [formData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Passionate developer interested in AI and blockchain technologies.',
    github: 'https://github.com/johndoe',
    linkedin: 'https://linkedin.com/in/johndoe',
    website: 'https://johndoe.dev',
    trackInterest: 'AI/ML',
  });

  const [skills] = useState(['JavaScript', 'React', 'Python', 'Machine Learning', 'Node.js']);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1128] to-[#15193B]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white">Profile Settings</h1>
            <p className="text-lg text-white/80 max-w-2xl">
              Manage your account information, preferences, and security settings
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/app/profile/edit"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] hover:from-[#C030D8] hover:to-[#00E0D0] text-white font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00F2EA] focus:ring-offset-2 focus:ring-offset-[#0D1128] group"
              title="Edit your profile information"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit Profile
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>
              <div className="space-y-3">
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Bio:</strong> {formData.bio}</p>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Social Links</h2>
              <div className="space-y-2">
                <p><a href={formData.github} className="text-blue-400">GitHub</a></p>
                <p><a href={formData.linkedin} className="text-blue-400">LinkedIn</a></p>
                <p><a href={formData.website} className="text-blue-400">Website</a></p>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Preferences</h2>
              <div className="space-y-2">
                <p><strong>Track Interest:</strong> {formData.trackInterest}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Card */}
            <div className="bg-white/10 rounded-2xl p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-3xl">{formData.name.charAt(0).toUpperCase()}</span>
              </div>
              <h3 className="text-xl font-bold text-white">{formData.name}</h3>
              <p className="text-white/60 mb-4">{formData.email}</p>

              {/* Quick Edit button in user card */}
              <Link
                to="/app/profile/edit"
                className="inline-flex items-center justify-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 font-medium rounded-lg transition-colors duration-200 border border-white/20 hover:border-white/30 text-sm mb-4"
                title="Quick edit profile"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Quick Edit
              </Link>

              <div className="mt-4">
                <h4 className="font-medium text-white mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-white/20 text-white rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Projects</span>
                  <span className="font-semibold">3</span>
                </div>
                <div className="flex justify-between">
                  <span>Teams Joined</span>
                  <span className="font-semibold">2</span>
                </div>
                <div className="flex justify-between">
                  <span>Submissions</span>
                  <span className="font-semibold">1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleProfilePage;