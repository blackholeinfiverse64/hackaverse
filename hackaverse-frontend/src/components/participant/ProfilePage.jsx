import { useState, useEffect } from 'react';
import { Component } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

// Import modal components directly
import AvatarEditModal from '../ui/AvatarEditModal';
import SkillsModal from '../ui/SkillsModal';
import ResetPasswordModal from '../ui/ResetPasswordModal';
import TwoFactorModal from '../ui/TwoFactorModal';

// Add CSS animations and styles
const profileStyles = `
  @keyframes floatLabel {
    from {
      transform: translateY(0) scale(1);
      opacity: 0.8;
    }
    to {
      transform: translateY(-24px) scale(0.9);
      opacity: 1;
    }
  }

  @keyframes glowPulse {
    0%, 100% {
      box-shadow: 0 0 8px 0 rgba(191, 64, 191, 0.6);
    }
    50% {
      box-shadow: 0 0 16px 4px rgba(191, 64, 191, 0.8);
    }
  }

  @keyframes rippleEffect {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }

  @keyframes sectionFadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes neonPulse {
    0%, 100% {
      text-shadow: 0 0 5px #00F2EA, 0 0 10px #00F2EA;
    }
    50% {
      text-shadow: 0 0 10px #00F2EA, 0 0 20px #00F2EA, 0 0 30px #00F2EA;
    }
  }

  .floating-label {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    transform-origin: left center;
    transition: all 0.3s ease;
    pointer-events: none;
    background: linear-gradient(90deg, #0D1128 0%, #15193B 100%);
    padding: 0 8px;
    border-radius: 4px;
    color: #00F2EA;
    font-size: 12px;
    font-weight: 500;
  }

  .floating-label.filled, .floating-label.focus {
    transform: translateY(-24px) scale(0.9);
    opacity: 1;
  }

  .glassmorphic-input {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
  }

  .glassmorphic-input:focus-within {
    border-color: #00F2EA;
    box-shadow: 0 0 0 2px rgba(0, 242, 234, 0.2);
  }

  .hover-glow {
    transition: all 0.3s ease;
  }

  .hover-glow:hover {
    box-shadow: 0 0 15px 0 rgba(191, 64, 191, 0.5);
  }

  .neon-outline {
    position: relative;
    border: 2px solid transparent;
    background: linear-gradient(90deg, #0D1128, #15193B) padding-box,
                linear-gradient(90deg, #BF40BF, #00F2EA) border-box;
    transition: all 0.3s ease;
  }

  .neon-outline:hover {
    box-shadow: 0 0 10px #BF40BF, 0 0 20px #00F2EA;
  }

  .neon-pulse {
    animation: glowPulse 2s ease-in-out infinite;
  }

  .ripple-effect {
    position: relative;
    overflow: hidden;
  }

  .ripple-effect::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(0, 242, 234, 0.6);
    transform: translate(-50%, -50%);
    opacity: 0;
    pointer-events: none;
  }

  .ripple-effect:active::after {
    animation: rippleEffect 0.6s ease-out;
  }

  .section-animate {
    animation: sectionFadeIn 0.6s ease-out forwards;
    opacity: 0;
  }

  .section-animate:nth-child(1) { animation-delay: 0.1s; }
  .section-animate:nth-child(2) { animation-delay: 0.2s; }
  .section-animate:nth-child(3) { animation-delay: 0.3s; }
  .section-animate:nth-child(4) { animation-delay: 0.4s; }
`;

// Error boundary component
class ProfileErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Profile page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0D1128] to-[#15193B] flex items-center justify-center">
          <div className="text-center p-8">
            <i className="uil uil-exclamation-triangle text-6xl text-red-400 mb-4"></i>
            <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-white/60 mb-4">We encountered an error loading your profile.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ProfilePage = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  console.log('ProfilePage rendered: authLoading=', authLoading, 'isAuthenticated=', isAuthenticated, 'user=', user);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal states
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: 'Passionate developer interested in AI and blockchain technologies. Love building innovative solutions that make a difference.',
    github: 'https://github.com/johndoe',
    linkedin: 'https://linkedin.com/in/johndoe',
    website: 'https://johndoe.dev',
    trackInterest: 'AI/ML',
    emailNotifications: true,
    projectUpdates: true
  });

  const [errors, setErrors] = useState({});
  const [charCounts, setCharCounts] = useState({ bio: 0 });
  const [skills, setSkills] = useState(['JavaScript', 'React', 'Python', 'Machine Learning', 'Node.js']);

  // Initialize form data when user is available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || 'Passionate developer interested in AI and blockchain technologies. Love building innovative solutions that make a difference.',
        github: user.github || 'https://github.com/johndoe',
        linkedin: user.linkedin || 'https://linkedin.com/in/johndoe',
        website: user.website || 'https://johndoe.dev',
        trackInterest: user.trackInterest || 'AI/ML',
        emailNotifications: user.emailNotifications !== undefined ? user.emailNotifications : true,
        projectUpdates: user.projectUpdates !== undefined ? user.projectUpdates : true
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    if (name === 'bio') {
      setCharCounts(prev => ({ ...prev, bio: value.length }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    setHasChanges(true);
  };

  const handlePaste = (e, fieldName) => {
    const pastedText = e.clipboardData.getData('text');

    if (fieldName === 'github' && !pastedText.startsWith('http')) {
      e.preventDefault();
      const normalized = normalizeUrl(pastedText, 'github');
      setFormData(prev => ({ ...prev, [fieldName]: normalized }));
      setHasChanges(true);
    } else if (fieldName === 'linkedin' && !pastedText.startsWith('http')) {
      e.preventDefault();
      const normalized = normalizeUrl(pastedText, 'linkedin');
      setFormData(prev => ({ ...prev, [fieldName]: normalized }));
      setHasChanges(true);
    }
  };

  const normalizeUrl = (url, type) => {
    if (!url) return '';

    let normalized = url.trim().toLowerCase();

    if (type === 'github' && !normalized.startsWith('http')) {
      normalized = `https://github.com/${normalized}`;
    } else if (type === 'linkedin' && !normalized.startsWith('http')) {
      normalized = `https://linkedin.com/in/${normalized}`;
    }

    if (!normalized.startsWith('http')) {
      normalized = `https://${normalized}`;
    }

    if (normalized.endsWith('/') && normalized !== 'https://' && normalized !== 'http://') {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return !value.trim() ? 'Name is required' : '';
      case 'bio':
        return value.length > 500 ? 'Bio must be under 500 characters' : '';
      case 'github':
        if (value && !value.match(/^https:\/\/(www\.)?github\.com\/.+/)) {
          return 'Enter a valid GitHub URL';
        }
        return '';
      case 'linkedin':
        if (value && !value.match(/^https:\/\/(www\.)?linkedin\.com\/(in|company)\/.+/)) {
          return 'Enter a valid LinkedIn URL';
        }
        return '';
      case 'website':
        if (value && !value.match(/^https?:\/\/.+\..+/)) {
          return 'Enter a valid website URL';
        }
        return '';
      default:
        return '';
    }
  };

  const getUrlStatus = (name, value) => {
    if (!value) return null;
    const error = validateField(name, value);
    return error ? 'invalid' : 'valid';
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      const firstError = Object.keys(errors)[0];
      document.getElementById(firstError)?.focus();
      return;
    }

    setIsSaving(true);

    try {
      // Prepare data for API call
      const updateData = {
        full_name: formData.name,
        bio: formData.bio,
        // Note: In a real app, you would also handle the social links and other fields
        // For now, we'll focus on the core profile fields that match our backend schema
      };

      // Call the actual backend API
      const response = await apiService.user.updateProfile(updateData);

      // Update local state with the response data
      const normalizedData = {
        ...formData,
        github: normalizeUrl(formData.github, 'github'),
        linkedin: normalizeUrl(formData.linkedin, 'linkedin'),
        website: normalizeUrl(formData.website, 'website')
      };

      setFormData(normalizedData);
      setIsEditing(false);
      setHasChanges(false);
      setShowToast({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => setShowToast(null), 3000);
    } catch (error) {
      console.error('Profile update error:', error);
      setShowToast({ type: 'error', message: error.message || 'Failed to update profile. Please try again.' });
      setTimeout(() => setShowToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setHasChanges(false);
    setErrors({});
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      bio: 'Passionate developer interested in AI and blockchain technologies. Love building innovative solutions that make a difference.',
      github: 'https://github.com/johndoe',
      linkedin: 'https://linkedin.com/in/johndoe',
      website: 'https://johndoe.dev',
      trackInterest: 'AI/ML',
      emailNotifications: true,
      projectUpdates: true
    });
  };

  const handleAvatarUpdate = (newAvatar) => {
    // Update avatar logic here
    setShowToast({ type: 'success', message: 'Avatar updated successfully!' });
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleSkillsUpdate = (newSkills) => {
    setSkills(newSkills);
    setHasChanges(true);
    setShowToast({ type: 'success', message: 'Skills updated successfully!' });
    setTimeout(() => setShowToast(null), 2000);
  };

  const handleResetPassword = () => {
    setShowPasswordModal(true);
  };

  const handleTwoFactorAuth = () => {
    setShowTwoFactorModal(true);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  useEffect(() => {
    setCharCounts({ bio: formData.bio.length });
  }, [formData.bio]);

  // Simple loading state - only show loading if auth is still loading
  if (authLoading) {
    console.log('ProfilePage: Showing auth loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D1128] to-[#15193B] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BF40BF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show fallback if no user data is available after auth loading is complete
  if (!user && !isAuthenticated) {
    console.log('ProfilePage: Showing no user data fallback');
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D1128] to-[#15193B] flex items-center justify-center">
        <div className="text-center p-8">
          <i className="uil uil-exclamation-triangle text-6xl text-yellow-400 mb-4"></i>
          <h2 className="text-2xl font-bold text-white mb-2">No Profile Data</h2>
          <p className="text-white/60 mb-4">Please log in to view your profile.</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  console.log('ProfilePage: Rendering main profile content. User:', user);
  return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D1128] to-[#15193B] page-transition">
        <style>{profileStyles}</style>
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
          <div className="space-y-3">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#BF40BF] via-[#C030D8] to-[#00F2EA] bg-clip-text text-transparent neon-pulse">
              Profile Settings
            </h1>
            <p className="text-lg text-white/80 max-w-2xl animate-fade-in" style={{ animationDelay: '0.3s' }}>
              Manage your account information, preferences, and security settings
            </p>
          </div>
          <div className="flex gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary h-12 px-8 font-semibold neon-outline ripple-effect"
              >
                <i className="uil uil-edit mr-2"></i>
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="btn-ghost h-12 px-6 ripple-effect"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || Object.keys(errors).some(key => errors[key])}
                  className="btn-primary h-12 px-8 relative overflow-hidden neon-outline ripple-effect"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <i className="uil uil-check mr-2"></i>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="profile-card glass-card-glow rounded-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] rounded-xl flex items-center justify-center">
                  <i className="uil uil-user text-white text-lg"></i>
                </div>
                <h2 className="text-xl font-bold text-white">Basic Information</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 section-animate">
                  <div className="relative">
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={!isEditing}
                      className={`glassmorphic-input form-control w-full p-4 rounded-lg ${errors.name ? 'error' : ''} ${isEditing ? 'hover-glow' : ''}`}
                      placeholder=" "
                    />
                    <label htmlFor="name" className={`floating-label ${formData.name ? 'filled' : ''} ${isEditing ? 'focus' : ''}`}>
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    {isEditing && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {errors.name ? (
                          <i className="uil uil-exclamation-triangle text-red-400"></i>
                        ) : formData.name && !errors.name ? (
                          <i className="uil uil-check text-green-400"></i>
                        ) : null}
                      </div>
                    )}
                  </div>
                  {errors.name && <div className="form-helper error">{errors.name}</div>}
                </div>

                <div className="space-y-2 section-animate">
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      className="glassmorphic-input form-control w-full p-4 rounded-lg readonly cursor-not-allowed"
                      disabled
                      title="Managed by your account / SSO"
                      placeholder=" "
                    />
                    <label htmlFor="email" className="floating-label filled">
                      Email Address
                    </label>
                  </div>
                  <div className="form-helper">Email cannot be changed</div>
                </div>

                <div className="md:col-span-2 space-y-2 section-animate">
                  <div className="relative">
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={!isEditing}
                      maxLength={500}
                      rows={4}
                      className={`glassmorphic-input form-control form-textarea resize-none w-full p-4 rounded-lg ${errors.bio ? 'error' : ''} ${isEditing ? 'hover-glow' : ''}`}
                      placeholder=" "
                    />
                    <label htmlFor="bio" className={`floating-label ${formData.bio ? 'filled' : ''} ${isEditing ? 'focus' : ''}`}>
                      Bio
                    </label>
                    <div className="absolute bottom-3 right-3 text-xs text-white/50">
                      {charCounts.bio}/500
                    </div>
                  </div>
                  {errors.bio && <div className="form-helper error">{errors.bio}</div>}
                </div>
              </div>
            </div>

            {/* Social Links Section */}
            <div className="profile-card glass-card-glow rounded-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-[#00F2EA] to-[#2DD4BF] rounded-xl flex items-center justify-center">
                  <i className="uil uil-share-alt text-white text-lg"></i>
                </div>
                <h2 className="text-xl font-bold text-white">Social Links</h2>
              </div>

              <div className="space-y-6">
                {[
                  { name: 'github', label: 'GitHub', icon: 'uil-github', placeholder: 'https://github.com/username' },
                  { name: 'linkedin', label: 'LinkedIn', icon: 'uil-linkedin', placeholder: 'https://linkedin.com/in/username' },
                  { name: 'website', label: 'Website', icon: 'uil-globe', placeholder: 'https://yourdomain.com' }
                ].map((field) => (
                  <div key={field.name} className="space-y-2 section-animate">
                    <div className="relative">
                      <div className="absolute left-12 top-1/2 transform -translate-y-1/2 text-white/60">
                        <i className={`uil ${field.icon} text-lg`}></i>
                      </div>
                      <input
                        id={field.name}
                        type="url"
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        onPaste={(e) => handlePaste(e, field.name)}
                        disabled={!isEditing}
                        className={`glassmorphic-input form-control w-full p-4 pl-16 rounded-lg ${errors[field.name] ? 'error' : ''} ${isEditing ? 'hover-glow' : ''}`}
                        placeholder=" "
                      />
                      <label htmlFor={field.name} className={`floating-label ${formData[field.name] ? 'filled' : ''} ${isEditing ? 'focus' : ''}`}>
                        {field.label}
                      </label>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        {getUrlStatus(field.name, formData[field.name]) && (
                          <span className={`px-2 py-1 text-xs rounded-full ${getUrlStatus(field.name, formData[field.name]) === 'valid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {getUrlStatus(field.name, formData[field.name]) === 'valid' ? 'Valid' : 'Invalid'}
                          </span>
                        )}
                        {formData[field.name] && getUrlStatus(field.name, formData[field.name]) === 'valid' && (
                          <button
                            type="button"
                            className="p-1 text-white/60 hover:text-white transition-colors ripple-effect"
                            onClick={() => window.open(formData[field.name], '_blank')}
                            title="Open in new tab"
                          >
                            <i className="uil uil-external-link-alt"></i>
                          </button>
                        )}
                      </div>
                    </div>
                    {errors[field.name] && <div className="form-helper error">{errors[field.name]}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Preferences Section */}
            <div className="profile-card glass-card-glow rounded-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-[#6366F1] to-[#A78BFA] rounded-xl flex items-center justify-center">
                  <i className="uil uil-setting text-white text-lg"></i>
                </div>
                <h2 className="text-xl font-bold text-white">Preferences</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="trackInterest" className="form-label text-sm font-medium">
                    Track Interest
                  </label>
                  <div className="relative">
                    <select
                      id="trackInterest"
                      name="trackInterest"
                      value={formData.trackInterest}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`form-control ${isEditing ? 'hover-glow' : ''}`}
                    >
                      <option value="AI/ML">AI/ML</option>
                      <option value="Web3">Web3</option>
                      <option value="Gaming">Gaming</option>
                      <option value="Open Innovation">Open Innovation</option>
                    </select>
                    {isEditing && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <i className="uil uil-angle-down text-white/60"></i>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-white/80">Notifications</h3>
                  {[
                    { key: 'emailNotifications', label: 'Email notifications' },
                    { key: 'projectUpdates', label: 'Project update notifications' }
                  ].map((toggle) => (
                    <label key={toggle.key} className="flex items-center gap-4 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          name={toggle.key}
                          checked={formData[toggle.key]}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="sr-only"
                        />
                        <div className={`w-12 h-6 rounded-full transition-all duration-300 ${formData[toggle.key] ? 'bg-gradient-to-r from-[#BF40BF] to-[#00F2EA]' : 'bg-white/20'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${formData[toggle.key] ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`}></div>
                        </div>
                      </div>
                      <span className="text-white group-hover:text-[#00F2EA] transition-colors">
                        {toggle.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="profile-card glass-card-glow rounded-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-[#FF4444] to-[#FF6B6B] rounded-xl flex items-center justify-center">
                  <i className="uil uil-shield-check text-white text-lg"></i>
                </div>
                <h2 className="text-xl font-bold text-white">Security</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={handleResetPassword}
                  className="neon-outline h-14 justify-start p-4 hover:scale-105 transition-transform group ripple-effect"
                >
                  <div className="flex items-center gap-3">
                    <i className="uil uil-key-skeleton text-2xl group-hover:animate-pulse neon-pulse"></i>
                    <div className="text-left">
                      <div className="font-medium">Reset Password</div>
                      <div className="text-xs text-white/60">Update your account password</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleTwoFactorAuth}
                  className="neon-outline h-14 justify-start p-4 hover:scale-105 transition-transform group ripple-effect"
                >
                  <div className="flex items-center gap-3">
                    <i className="uil uil-mobile-vibrate text-2xl group-hover:animate-pulse neon-pulse"></i>
                    <div className="text-left">
                      <div className="font-medium">Two-Factor Auth</div>
                      <div className="text-xs text-white/60">Enable 2FA for extra security</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Identity Card */}
            <div className="profile-card glass-card-glow rounded-2xl p-6 border border-white/20 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-gradient-to-r from-[#BF40BF] via-[#C030D8] to-[#00F2EA] rounded-full flex items-center justify-center mx-auto cursor-pointer hover:scale-105 transition-transform group neon-pulse ripple-effect" onClick={() => setShowAvatarModal(true)}>
                  <span className="text-white font-bold text-3xl group-hover:animate-pulse neon-pulse">
                    {formData.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#00F2EA] rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform neon-pulse ripple-effect"
                >
                  <i className="uil uil-camera text-sm"></i>
                </button>
              </div>

              <h3 className="text-xl font-bold text-white mb-1 neon-pulse">{formData.name || user?.name || 'User'}</h3>
              <p className="text-white/60 text-sm mb-4 animate-fade-in">{formData.email || user?.email || 'No email provided'}</p>

              <div className="flex flex-wrap gap-2 justify-center">
                <span className="status-badge status-active neon-pulse ripple-effect">
                  <i className="uil uil-check-circle mr-1"></i>
                  Active Participant
                </span>
                <span className={`status-badge track-${formData.trackInterest.toLowerCase().replace('/', '').replace(' ', '')} neon-pulse ripple-effect`}>
                  <i className="uil uil-star mr-1"></i>
                  {formData.trackInterest}
                </span>
              </div>
            </div>

            {/* Skills Section */}
            <div className="profile-card glass-card-glow rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Skills</h3>
                <button
                  onClick={() => setShowSkillsModal(true)}
                  className="btn-ghost p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <i className="uil uil-edit text-sm"></i>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-2 bg-gradient-to-r from-[#BF40BF]/20 to-[#00F2EA]/20 text-[#00F2EA] rounded-full text-sm font-medium border border-[#00F2EA]/30 hover:border-[#00F2EA] hover:scale-105 transition-all cursor-default neon-pulse ripple-effect section-animate"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setShowSkillsModal(true)}
                className="w-full py-2 border border-dashed border-white/30 rounded-lg text-white/60 hover:border-[#00F2EA] hover:text-[#00F2EA] transition-colors text-sm neon-outline ripple-effect"
              >
                <i className="uil uil-plus mr-2"></i>
                Manage Skills
              </button>
            </div>

            {/* Quick Stats */}
            <div className="profile-card glass-card-glow rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-4">Activity</h3>
              <div className="space-y-3">
                {[
                  { label: 'Projects', value: '3', path: '/projects', icon: 'uil-folder' },
                  { label: 'Teams Joined', value: '2', path: '/teams', icon: 'uil-users' },
                  { label: 'Submissions', value: '1', path: '/submissions', icon: 'uil-file-upload' }
                ].map((stat, index) => (
                  <Link
                    key={index}
                    to={stat.path}
                    className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <i className={`uil ${stat.icon} text-[#00F2EA] group-hover:animate-bounce`}></i>
                      <span className="text-white/80 group-hover:text-white">{stat.label}</span>
                    </div>
                    <span className="text-white font-semibold">{stat.value}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AvatarEditModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSave={handleAvatarUpdate}
        currentAvatar={user?.avatar}
      />

      <SkillsModal
        isOpen={showSkillsModal}
        onClose={() => setShowSkillsModal(false)}
        skills={skills}
        onSave={handleSkillsUpdate}
      />

      <ResetPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          setShowPasswordModal(false);
          setShowToast({ type: 'success', message: 'Password updated successfully!' });
          setTimeout(() => setShowToast(null), 3000);
        }}
      />

      <TwoFactorModal
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
        onSuccess={() => {
          setShowTwoFactorModal(false);
          setShowToast({ type: 'success', message: 'Two-factor authentication enabled!' });
          setTimeout(() => setShowToast(null), 3000);
        }}
      />

      {/* Toast Notifications */}
      {showToast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-xl animate-slide-in-right ${showToast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          <div className="flex items-center gap-3">
            <i className={`uil ${showToast.type === 'success' ? 'uil-check-circle' : 'uil-exclamation-triangle'}`}></i>
            {showToast.message}
          </div>
        </div>
      )}
    </div>
  );
};

const ProfilePageWithErrorBoundary = () => (
  <ProfileErrorBoundary>
    <ProfilePage />
  </ProfileErrorBoundary>
);

export default ProfilePageWithErrorBoundary;