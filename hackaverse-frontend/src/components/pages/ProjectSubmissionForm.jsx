import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { API_BASE_URL } from '../../constants/appConstants';
import { getApiKey } from '../../constants/apiKey';

const ProjectSubmissionForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    githubRepo: '',
    deploymentLink: '',
    demoVideo: '',
    track: '',
    hackathon: ''
  });
  const [hackathons, setHackathons] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const response = await apiService.hackathons.getAll();
        const data = response.data || [];
        if (Array.isArray(data) && data.length > 0) {
          setHackathons(data);
        } else {
          setHackathons([
            { id: 'hack_1', name: 'AI Innovation Challenge 2024' },
            { id: 'hack_2', name: 'Web3 Hackathon' },
            { id: 'hack_3', name: 'Gaming & Metaverse' },
            { id: 'hack_4', name: 'Open Innovation' }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch hackathons:', error);
        setHackathons([
          { id: 'hack_1', name: 'AI Innovation Challenge 2024' },
          { id: 'hack_2', name: 'Web3 Hackathon' },
          { id: 'hack_3', name: 'Gaming & Metaverse' },
          { id: 'hack_4', name: 'Open Innovation' }
        ]);
      }
    };
    fetchHackathons();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.projectName.trim() || formData.projectName.length < 5) {
      newErrors.projectName = 'Project name must be at least 5 characters';
    }
    if (!formData.description.trim() || formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }
    if (!formData.hackathon) {
      newErrors.hackathon = 'Please select a hackathon';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const teamId = localStorage.getItem('team_id');
      const hackathonId = localStorage.getItem('hackathon_id');

      const payload = {
        team_id: teamId || '',
        hackathon_id: formData.hackathon,
        title: formData.projectName,
        description: formData.description,
        github_link: formData.githubRepo || '',
        demo_link: formData.deploymentLink || formData.demoVideo || '',
        submitted_by: localStorage.getItem('user_email') || ''
      };

      console.log('SUBMISSION PAYLOAD:', payload);

      const response = await fetch(`${API_BASE_URL}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': getApiKey()
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('API RESPONSE:', data, 'Status:', response.status);

      if (!response.ok) {
        throw new Error(data.detail || `HTTP ${response.status}`);
      }

      success('Project submitted successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Submission error:', error);
      const errorMessage = error.message || 'Failed to submit project';
      showError(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {errors.submit}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Hackathon *
        </label>
        <select
          name="hackathon"
          value={formData.hackathon}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a hackathon</option>
          {hackathons.map((h) => (
            <option key={h.id || h._id} value={h.id || h._id}>
              {h.name || h.title}
            </option>
          ))}
        </select>
        {errors.hackathon && <p className="text-red-500 text-xs mt-1">{errors.hackathon}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Project Name *
        </label>
        <input
          type="text"
          name="projectName"
          value={formData.projectName}
          onChange={handleChange}
          placeholder="Enter project name"
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.projectName && <p className="text-red-500 text-xs mt-1">{errors.projectName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description * (min 50 characters)
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your project..."
          rows="5"
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className={`text-xs mt-1 ${formData.description.length < 50 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {formData.description.length}/50 characters
        </p>
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          GitHub Repository URL
        </label>
        <input
          type="url"
          name="githubRepo"
          value={formData.githubRepo}
          onChange={handleChange}
          placeholder="https://github.com/..."
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Deployment Link
        </label>
        <input
          type="url"
          name="deploymentLink"
          value={formData.deploymentLink}
          onChange={handleChange}
          placeholder="https://..."
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Demo Video Link
        </label>
        <input
          type="url"
          name="demoVideo"
          value={formData.demoVideo}
          onChange={handleChange}
          placeholder="https://youtube.com/..."
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Track Selection
        </label>
        <select
          name="track"
          value={formData.track}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a track</option>
          <option value="AI/ML">AI/ML</option>
          <option value="Web3">Web3</option>
          <option value="Gaming">Gaming</option>
          <option value="Open Innovation">Open Innovation</option>
        </select>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-sm text-blue-600 dark:text-blue-400">
          <strong>Note:</strong> Your project will be automatically judged by AI. Scores will be available shortly after submission.
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-white text-black border border-gray-300 hover:bg-gray-100 disabled:opacity-50 font-medium py-2 rounded-lg transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Project'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProjectSubmissionForm;
