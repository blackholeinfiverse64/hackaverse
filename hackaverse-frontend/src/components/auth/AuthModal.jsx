import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';

const AuthModal = ({ isOpen, onClose, redirectTo }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login, signup } = useAuth();
  const toast = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (activeTab === 'signup') {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (activeTab === 'login') {
        await login(formData.email, formData.password);
        toast.success('Welcome back!');
      } else {
        await signup(formData.name, formData.email, formData.password);
        toast.success('Account created successfully!');
      }
      
      onClose();
      
      if (redirectTo) {
        window.location.href = redirectTo;
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
    setActiveTab('login');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative w-full max-w-md glass-card rounded-2xl p-6 animate-scale-in">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
        >
          <i className="uil uil-times text-xl"></i>
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">
            {activeTab === 'login' ? 'Welcome Back' : 'Join HackaVerse'}
          </h2>
          <p className="text-text-muted">
            {activeTab === 'login' 
              ? 'Sign in to your account' 
              : 'Create your account to get started'
            }
          </p>
        </div>

        <div className="flex mb-6 bg-bg-card rounded-xl p-1">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'login'
                ? 'bg-primary-purple text-white'
                : 'text-text-muted hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'signup'
                ? 'bg-primary-purple text-white'
                : 'text-text-muted hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'signup' && (
            <div>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full h-11 px-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-purple transition-all ${
                  errors.name ? 'border-error-red' : 'border-gray-300 dark:border-border-light'
                }`}
              />
              {errors.name && <p className="text-error-red text-sm mt-1">{errors.name}</p>}
            </div>
          )}

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full h-11 px-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-purple transition-all ${
                errors.email ? 'border-error-red' : 'border-gray-300 dark:border-border-light'
              }`}
            />
            {errors.email && <p className="text-error-red text-sm mt-1">{errors.email}</p>}
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full h-11 px-4 pr-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-purple transition-all ${
                errors.password ? 'border-error-red' : 'border-gray-300 dark:border-border-light'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-text-muted hover:text-gray-700 dark:hover:text-white"
            >
              <i className={`uil ${showPassword ? 'uil-eye-slash' : 'uil-eye'}`}></i>
            </button>
            {errors.password && <p className="text-error-red text-sm mt-1">{errors.password}</p>}
          </div>

          {activeTab === 'signup' && (
            <div>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full h-11 px-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-purple transition-all ${
                  errors.confirmPassword ? 'border-error-red' : 'border-gray-300 dark:border-border-light'
                }`}
              />
              {errors.confirmPassword && <p className="text-error-red text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-gradient-to-r from-primary-purple to-secondary-cyan text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary-purple/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {activeTab === 'login' ? 'Signing In...' : 'Creating Account...'}
              </div>
            ) : (
              activeTab === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {activeTab === 'login' && (
          <div className="text-center mt-4">
            <button
              className="text-primary-purple hover:text-secondary-cyan transition-colors"
              onClick={() => console.log('Forgot password clicked')}
            >
              Forgot Password?
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
