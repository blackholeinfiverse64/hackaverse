import { useState } from 'react';

const ResetPasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('form'); // 'form', 'success'
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const validateField = (name, value) => {
    switch (name) {
      case 'currentPassword':
        return !value ? 'Current password is required' : '';
      case 'newPassword':
        if (!value) return 'New password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain uppercase, lowercase, and number';
        }
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.newPassword) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const firstError = Object.keys(errors)[0];
      document.getElementById(firstError)?.focus();
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      setErrors({ submit: 'Failed to update password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setErrors({});
    onClose();
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength++;
    return strength;
  };

  const getStrengthColor = (strength) => {
    if (strength <= 2) return 'text-red-400';
    if (strength <= 3) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStrengthText = (strength) => {
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      ></div>
      
      <div className="relative glass-card-glow rounded-2xl p-8 max-w-md w-full mx-4 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Reset Password</h2>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <i className="uil uil-times text-white"></i>
          </button>
        </div>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <label htmlFor="currentPassword" className="form-label text-sm font-medium">
                Current Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`form-control pr-12 ${errors.currentPassword ? 'error' : ''}`}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  <i className={`uil ${showPasswords.current ? 'uil-eye-slash' : 'uil-eye'}`}></i>
                </button>
              </div>
              {errors.currentPassword && <div className="form-helper error">{errors.currentPassword}</div>}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className="form-label text-sm font-medium">
                New Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`form-control pr-12 ${errors.newPassword ? 'error' : ''}`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  <i className={`uil ${showPasswords.new ? 'uil-eye-slash' : 'uil-eye'}`}></i>
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Password Strength:</span>
                    <span className={getStrengthColor(getPasswordStrength(formData.newPassword))}>
                      {getStrengthText(getPasswordStrength(formData.newPassword))}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < getPasswordStrength(formData.newPassword)
                            ? getStrengthColor(getPasswordStrength(formData.newPassword)).replace('text-', 'bg-')
                            : 'bg-white/20'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
              
              {errors.newPassword && <div className="form-helper error">{errors.newPassword}</div>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="form-label text-sm font-medium">
                Confirm New Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`form-control pr-12 ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  <i className={`uil ${showPasswords.confirm ? 'uil-eye-slash' : 'uil-eye'}`}></i>
                </button>
              </div>
              {errors.confirmPassword && <div className="form-helper error">{errors.confirmPassword}</div>}
            </div>

            {/* Password Requirements */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <h4 className="text-sm font-medium text-white/80 mb-2">Password Requirements:</h4>
              <ul className="space-y-1 text-xs text-white/60">
                <li className={`flex items-center gap-2 ${formData.newPassword.length >= 8 ? 'text-green-400' : ''}`}>
                  <i className={`uil ${formData.newPassword.length >= 8 ? 'uil-check' : 'uil-circle'}`}></i>
                  At least 8 characters long
                </li>
                <li className={`flex items-center gap-2 ${/(?=.*[a-z])/.test(formData.newPassword) ? 'text-green-400' : ''}`}>
                  <i className={`uil ${/(?=.*[a-z])/.test(formData.newPassword) ? 'uil-check' : 'uil-circle'}`}></i>
                  Contains lowercase letter
                </li>
                <li className={`flex items-center gap-2 ${/(?=.*[A-Z])/.test(formData.newPassword) ? 'text-green-400' : ''}`}>
                  <i className={`uil ${/(?=.*[A-Z])/.test(formData.newPassword) ? 'uil-check' : 'uil-circle'}`}></i>
                  Contains uppercase letter
                </li>
                <li className={`flex items-center gap-2 ${/(?=.*\d)/.test(formData.newPassword) ? 'text-green-400' : ''}`}>
                  <i className={`uil ${/(?=.*\d)/.test(formData.newPassword) ? 'uil-check' : 'uil-circle'}`}></i>
                  Contains a number
                </li>
              </ul>
            </div>

            {errors.submit && (
              <div className="form-helper error text-center">{errors.submit}</div>
            )}

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={handleClose}
                className="btn-ghost flex-1 h-12"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isLoading}
                className="btn-primary flex-1 h-12 relative overflow-hidden"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating...
                  </div>
                ) : (
                  <>
                    <i className="uil uil-lock mr-2"></i>
                    Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center space-y-6 py-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <i className="uil uil-check text-white text-2xl"></i>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Password Updated!</h3>
              <p className="text-white/60">Your password has been successfully changed.</p>
            </div>
            
            <div className="text-sm text-white/40">
              You will be redirected shortly...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordModal;