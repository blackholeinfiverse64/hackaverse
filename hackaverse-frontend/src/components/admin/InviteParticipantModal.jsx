import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const InviteParticipantModal = ({ isOpen, onClose, onSend }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    hackathon: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [hackathons, setHackathons] = useState([]);
  const { success, error: showError } = useToast();

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const response = await apiService.hackathons.getAll();
        if (response.data && Array.isArray(response.data)) {
          setHackathons(response.data);
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          setHackathons(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch hackathons:', error);
      }
    };
    
    if (isOpen) {
      fetchHackathons();
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name is required';
    }
    if (!formData.hackathon) {
      newErrors.hackathon = 'Hackathon selection is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await apiService.admin.inviteParticipant(formData.email, formData.hackathon);
      success('Invitation sent successfully!');
      setFormData({
        email: '',
        name: '',
        hackathon: '',
        message: ''
      });
      onClose();
      if (onSend) onSend(formData);
    } catch (error) {
      showError(error.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl border max-w-md w-full">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Invite Participant</h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-white transition-colors"
            >
              <i className="uil uil-times text-xl"></i>
            </button>
          </div>
          <p className="text-text-secondary mt-2">Send an invitation to join the hackathon</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-white/40 focus:border-cyan focus:ring-2 focus:ring-cyan/40 transition-colors ${
                errors.name ? 'border-red-500' : 'border-white/10'
              }`}
              placeholder="Enter participant's full name"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-white/40 focus:border-cyan focus:ring-2 focus:ring-cyan/40 transition-colors ${
                errors.email ? 'border-red-500' : 'border-white/10'
              }`}
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="hackathon" className="block text-sm font-medium text-white mb-2">
              Hackathon *
            </label>
            <select
              id="hackathon"
              name="hackathon"
              value={formData.hackathon}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white focus:border-cyan focus:ring-2 focus:ring-cyan/40 transition-colors ${
                errors.hackathon ? 'border-red-500' : 'border-white/10'
              }`}
            >
              <option value="">Select a hackathon</option>
              {hackathons.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name || h.title}
                </option>
              ))}
            </select>
            {errors.hackathon && <p className="text-red-400 text-xs mt-1">{errors.hackathon}</p>}
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-cyan focus:ring-2 focus:ring-cyan/40 transition-colors resize-none"
              placeholder="Add a personal message to the invitation..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-cyan text-black rounded-lg hover:bg-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteParticipantModal;
