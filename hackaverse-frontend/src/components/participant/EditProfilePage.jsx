import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const EditProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    github: user?.github || '',
    linkedin: user?.linkedin || '',
    profilePicture: user?.profilePicture || null,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorAuth: user?.twoFactorAuth || false,
    accountVisibility: user?.accountVisibility || 'public',
    emailNotifications: user?.emailNotifications || true,
    projectUpdates: user?.projectUpdates || true,
    systemAnnouncements: user?.systemAnnouncements || true,
    notificationFrequency: user?.notificationFrequency || 'weekly'
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [charCount, setCharCount] = useState(formData.bio.length);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        github: user.github || '',
        linkedin: user.linkedin || '',
        profilePicture: user.profilePicture || null,
        twoFactorAuth: user.twoFactorAuth || false,
        accountVisibility: user.accountVisibility || 'public',
        emailNotifications: user.emailNotifications || true,
        projectUpdates: user.projectUpdates || true,
        systemAnnouncements: user.systemAnnouncements || true,
        notificationFrequency: user.notificationFrequency || 'weekly'
      }));
      setCharCount(user?.bio?.length || 0);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Update character count for bio
    if (name === 'bio') {
      setCharCount(value.length);
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        setErrors(prev => ({ ...prev, profilePicture: 'Please upload an image file' }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profilePicture: 'File size must be less than 5MB' }));
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
        setFormData(prev => ({ ...prev, profilePicture: file }));
        setErrors(prev => ({ ...prev, profilePicture: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';

    // URL validation
    if (formData.github && !/^https?:\/\/(www\.)?github\.com\/.+/.test(formData.github)) {
      newErrors.github = 'Invalid GitHub URL';
    }
    if (formData.linkedin && !/^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/.+/.test(formData.linkedin)) {
      newErrors.linkedin = 'Invalid LinkedIn URL';
    }

    // Password validation
    if (formData.newPassword && formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Navigate back to profile after save
      setTimeout(() => navigate('/app/profile'), 2000);

    } catch (error) {
      setErrorMessage('Failed to save changes. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/app/profile');
  };

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    // Redirect to home page
    window.location.href = '/';
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = () => {
    // Handle account deletion
    setShowDeleteConfirm(false);
    // In a real app, this would call an API to delete the account
    navigate('/');
  };

  const exportData = () => {
    // Handle data export
    // In a real app, this would trigger a data export process
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1128] to-[#15193B]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white">Edit Profile</h1>
            <p className="text-lg text-white/80 max-w-2xl">
              Update your personal information and preferences
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 rounded-lg transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] hover:from-[#C030D8] hover:to-[#00E0D0] text-white font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00F2EA] focus:ring-offset-2 focus:ring-offset-[#0D1128] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-400">Profile updated successfully!</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-red-400">{errorMessage}</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8">
          {/* Main Form Section */}
          <div className="space-y-6">
            {/* Profile Information Form */}
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>

              <div className="space-y-5">
                {/* Name Field */}
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-white/80">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-white/5 border ${errors.name ? 'border-red-400' : 'border-white/20'} rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA] focus:border-transparent`}
                    placeholder="Enter your full name"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  {errors.name && <p id="name-error" className="text-sm text-red-400 mt-1">{errors.name}</p>}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-white/80">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-white/5 border ${errors.email ? 'border-red-400' : 'border-white/20'} rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA] focus:border-transparent`}
                    placeholder="Enter your email address"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && <p id="email-error" className="text-sm text-red-400 mt-1">{errors.email}</p>}
                </div>

                {/* Bio Field */}
                <div className="space-y-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-white/80">
                    Bio
                  </label>
                  <div className="relative">
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      maxLength={500}
                      className={`w-full px-4 py-3 bg-white/5 border ${errors.bio ? 'border-red-400' : 'border-white/20'} rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA] focus:border-transparent resize-none`}
                      placeholder="Tell us about yourself..."
                      aria-invalid={!!errors.bio}
                      aria-describedby={errors.bio ? "bio-error" : undefined}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-white/50">
                      {charCount}/500 characters
                    </div>
                  </div>
                  {errors.bio && <p id="bio-error" className="text-sm text-red-400 mt-1">{errors.bio}</p>}
                </div>

                {/* GitHub URL Field */}
                <div className="space-y-2">
                  <label htmlFor="github" className="block text-sm font-medium text-white/80">
                    GitHub URL
                  </label>
                  <input
                    id="github"
                    name="github"
                    type="url"
                    value={formData.github}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-white/5 border ${errors.github ? 'border-red-400' : 'border-white/20'} rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA] focus:border-transparent`}
                    placeholder="https://github.com/username"
                    aria-invalid={!!errors.github}
                    aria-describedby={errors.github ? "github-error" : undefined}
                  />
                  {errors.github && <p id="github-error" className="text-sm text-red-400 mt-1">{errors.github}</p>}
                </div>

                {/* LinkedIn URL Field */}
                <div className="space-y-2">
                  <label htmlFor="linkedin" className="block text-sm font-medium text-white/80">
                    LinkedIn URL
                  </label>
                  <input
                    id="linkedin"
                    name="linkedin"
                    type="url"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-white/5 border ${errors.linkedin ? 'border-red-400' : 'border-white/20'} rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA] focus:border-transparent`}
                    placeholder="https://linkedin.com/in/username"
                    aria-invalid={!!errors.linkedin}
                    aria-describedby={errors.linkedin ? "linkedin-error" : undefined}
                  />
                  {errors.linkedin && <p id="linkedin-error" className="text-sm text-red-400 mt-1">{errors.linkedin}</p>}
                </div>

                {/* Profile Picture Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20">
                      {profilePicturePreview ? (
                        <img src={profilePicturePreview} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#BF40BF] to-[#00F2EA] flex items-center justify-center text-white font-bold text-xl">
                          {formData.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        id="profilePicture"
                        name="profilePicture"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="block w-full text-sm text-white/80
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-medium
                          file:bg-white/10 file:text-white
                          hover:file:bg-white/20
                          cursor-pointer"
                      />
                      {errors.profilePicture && <p className="text-sm text-red-400 mt-1">{errors.profilePicture}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Settings Section */}
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6">Account Settings</h2>

              <div className="space-y-5">
                {/* Password Change */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Change Password</h3>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-white/80">
                        Current Password
                      </label>
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA] focus:border-transparent"
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="newPassword" className="block text-sm font-medium text-white/80">
                        New Password
                      </label>
                      <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-white/5 border ${errors.newPassword ? 'border-red-400' : 'border-white/20'} rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA] focus:border-transparent`}
                        placeholder="Enter new password (min 8 characters)"
                        aria-invalid={!!errors.newPassword}
                        aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
                      />
                      {errors.newPassword && <p id="newPassword-error" className="text-sm text-red-400 mt-1">{errors.newPassword}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80">
                        Confirm New Password
                      </label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-white/5 border ${errors.confirmPassword ? 'border-red-400' : 'border-white/20'} rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00F2EA] focus:border-transparent`}
                        placeholder="Confirm new password"
                        aria-invalid={!!errors.confirmPassword}
                        aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                      />
                      {errors.confirmPassword && <p id="confirmPassword-error" className="text-sm text-red-400 mt-1">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <h3 className="font-medium text-white">Two-Factor Authentication</h3>
                    <p className="text-sm text-white/60">Add an extra layer of security to your account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="twoFactorAuth"
                      checked={formData.twoFactorAuth}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#00F2EA] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full peer-checked:bg-[#00F2EA] after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>

                {/* Account Visibility */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">
                    Account Visibility
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="accountVisibility"
                        value="public"
                        checked={formData.accountVisibility === 'public'}
                        onChange={handleInputChange}
                        className="text-[#00F2EA] focus:ring-[#00F2EA]"
                      />
                      <span className="text-white/80">Public</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="accountVisibility"
                        value="private"
                        checked={formData.accountVisibility === 'private'}
                        onChange={handleInputChange}
                        className="text-[#00F2EA] focus:ring-[#00F2EA]"
                      />
                      <span className="text-white/80">Private</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6">Notification Preferences</h2>

              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-white">Email Notifications</h3>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">New Messages</h4>
                      <p className="text-sm text-white/60">Receive emails for new messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={formData.emailNotifications}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#00F2EA] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full peer-checked:bg-[#00F2EA] after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">Project Updates</h4>
                      <p className="text-sm text-white/60">Receive emails for project updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="projectUpdates"
                        checked={formData.projectUpdates}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#00F2EA] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full peer-checked:bg-[#00F2EA] after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">System Announcements</h4>
                      <p className="text-sm text-white/60">Receive important system updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="systemAnnouncements"
                        checked={formData.systemAnnouncements}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#00F2EA] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full peer-checked:bg-[#00F2EA] after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="notificationFrequency" className="block text-sm font-medium text-white/80">
                    Notification Frequency
                  </label>
                  <select
                    id="notificationFrequency"
                    name="notificationFrequency"
                    value={formData.notificationFrequency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00F2EA] focus:border-transparent"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Danger Zone */}
          <div className="space-y-6">
            {/* Danger Zone */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-red-400 mb-6">Danger Zone</h2>

              <div className="space-y-4">
                {/* Logout Section */}
                <div className="space-y-3">
                  <h3 className="font-medium text-white">Logout</h3>
                  <p className="text-sm text-white/60">Sign out of your account on this device</p>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>

                {/* Delete Account */}
                <div className="space-y-3 pt-4 border-t border-red-500/20">
                  <h3 className="font-medium text-white">Delete Account</h3>
                  <p className="text-sm text-white/60">Permanently remove your account and all associated data</p>
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors"
                  >
                    Delete Account
                  </button>
                </div>

                {/* Export Data */}
                <div className="space-y-3 pt-4 border-t border-red-500/20">
                  <h3 className="font-medium text-white">Export Data</h3>
                  <p className="text-sm text-white/60">Download all your account data</p>
                  <button
                    onClick={exportData}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 rounded-lg transition-colors"
                  >
                    Export My Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1E293B] rounded-2xl p-6 max-w-md w-full mx-4 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">Confirm Account Deletion</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-white/60 hover:text-white"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-white/80 mb-4">
                Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
              </p>
              <div className="bg-red-500/10 p-3 rounded-lg text-sm text-red-300">
                <strong>Warning:</strong> This action is irreversible. All projects, submissions, and account data will be deleted.
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors"
              >
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfilePage;