import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast, ToastContainer } from '../../hooks/useToast.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { FormSkeleton, CardSkeleton } from '../ui/Skeletons';
import { API_BASE_URL } from '../../constants/appConstants';
import { getApiKey } from '../../constants/apiKey';

export default function HackathonManagement() {
  const [hackathons, setHackathons] = useState([]);
  const [deletedHackathons, setDeletedHackathons] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [editingHackathon, setEditingHackathon] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    max_team_size: 5,
    min_team_size: 2,
    status: 'active',
    track: 'Open Innovation'
  });
  const [errors, setErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, hackathonId: null, currentStatus: null, action: null });
  const { toasts, success, error: showError } = useToast();

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/hackathons`, {
        headers: { 
          'X-API-Key': getApiKey()
        }
      });
      const data = await response.json();
      setHackathons(data.data || []);
    } catch (err) {
      showError('Failed to fetch hackathons');
      console.error('Failed to fetch hackathons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (hackathon) => {
    setEditingHackathon(hackathon);
    setShowCreateModal(true);
    setFormData({
      name: hackathon.name,
      description: hackathon.description,
      start_date: hackathon.start_date,
      end_date: hackathon.end_date,
      min_team_size: hackathon.min_team_size,
      max_team_size: hackathon.max_team_size,
      status: hackathon.status,
      track: hackathon.track || 'Open Innovation'
    });
  };

  const handleDelete = (hackathon) => {
    console.log('Deleting hackathon:', hackathon);
    setConfirmDialog({ isOpen: true, hackathonId: hackathon.id || hackathon._id, action: 'delete' });
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/hackathons/${confirmDialog.hackathonId}`, {
        method: 'DELETE',
        headers: { 
          'X-API-Key': getApiKey()
        }
      });
      
      if (response.ok) {
        success('Hackathon deleted successfully!');
        await fetchHackathons();
      } else {
        showError('Failed to delete hackathon');
      }
    } catch (err) {
      showError('Failed to delete hackathon');
    } finally {
      setConfirmDialog({ isOpen: false, hackathonId: null, action: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.end_date) newErrors.end_date = 'End date is required';
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      newErrors.end_date = 'End date must be after start date';
    }
    if (formData.min_team_size < 1) newErrors.min_team_size = 'Must be at least 1';
    if (formData.max_team_size < formData.min_team_size) {
      newErrors.max_team_size = 'Must be greater than min size';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      if (editingHackathon) {
        const response = await fetch(`${API_BASE_URL}/hackathons/${editingHackathon.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': getApiKey()
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          success('Hackathon updated successfully!');
          setEditingHackathon(null);
          setShowCreateModal(false);
        } else {
          showError('Failed to update hackathon');
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/hackathons`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': getApiKey()
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          success('Hackathon created successfully!');
          setShowCreateModal(false);
        } else {
          showError('Failed to create hackathon');
        }
      }
      
      setFormData({ name: '', description: '', start_date: '', end_date: '', max_team_size: 5, min_team_size: 2, status: 'active', track: 'Open Innovation' });
      setErrors({});
      fetchHackathons();
    } catch (err) {
      showError(err.response?.data?.message || `Failed to ${editingHackathon ? 'update' : 'create'} hackathon`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (hackathon) => {
    setConfirmDialog({ isOpen: true, hackathonId: hackathon.id || hackathon._id, currentStatus: hackathon.status });
  };

  const confirmToggleStatus = async () => {
    if (confirmDialog.action === 'delete') {
      return confirmDelete();
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/hackathons/${confirmDialog.hackathonId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': getApiKey()
        },
        body: JSON.stringify({ 
          status: confirmDialog.currentStatus === 'active' ? 'inactive' : 'active' 
        })
      });
      
      if (response.ok) {
        success(`Hackathon ${confirmDialog.currentStatus === 'active' ? 'deactivated' : 'activated'} successfully!`);
        fetchHackathons();
      } else {
        showError('Failed to update status');
      }
    } catch (err) {
      showError('Failed to update status');
    } finally {
      setConfirmDialog({ isOpen: false, hackathonId: null, currentStatus: null, action: null });
    }
  };

  return (
    <div className="min-h-screen pt-0">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Hackathon Management</h1>
          <p className="text-text-muted">Create and manage hackathon events</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <i className="uil uil-plus"></i>
          Create Hackathon
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">All Hackathons</h2>
        {loading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : hackathons.length === 0 ? (
          <p className="text-text-muted">No hackathons yet</p>
        ) : (
          <div className="space-y-4">
            {hackathons.map((h) => (
              <div key={h.id || h._id} className="border border-white/10 rounded-lg p-4 bg-white/5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-white">{h.name}</h3>
                    <p className="text-text-secondary text-sm">{h.description}</p>
                    <p className="text-sm mt-2 text-text-muted">
                      {new Date(h.start_date).toLocaleDateString()} - {new Date(h.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-text-muted">Team Size: {h.min_team_size}-{h.max_team_size}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(h)}
                      className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(h)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleToggleStatus(h)}
                      className={`px-4 py-2 rounded-lg font-medium ${h.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}
                    >
                      {h.status}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
      <ToastContainer toasts={toasts} />

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-slate-900 dark:bg-slate-900 rounded-xl shadow-2xl w-[700px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {editingHackathon ? 'Edit Hackathon' : 'Create New Hackathon'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingHackathon(null);
                    setFormData({ name: '', description: '', start_date: '', end_date: '', max_team_size: 5, min_team_size: 2, status: 'active', track: 'Open Innovation' });
                    setErrors({});
                  }}
                  className="text-gray-400 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-text-muted focus:border-cyan/50 focus:outline-none ${errors.name ? 'border-red-500' : 'border-white/10'}`}
                    required
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-text-muted focus:border-cyan/50 focus:outline-none ${errors.description ? 'border-red-500' : 'border-white/10'}`}
                    rows="3"
                    required
                  />
                  {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Start Date</label>
                    <input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white focus:border-cyan/50 focus:outline-none ${errors.start_date ? 'border-red-500' : 'border-white/10'}`}
                      required
                    />
                    {errors.start_date && <p className="text-red-400 text-xs mt-1">{errors.start_date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white focus:border-cyan/50 focus:outline-none ${errors.end_date ? 'border-red-500' : 'border-white/10'}`}
                      required
                    />
                    {errors.end_date && <p className="text-red-400 text-xs mt-1">{errors.end_date}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Min Team Size</label>
                    <input
                      type="number"
                      value={formData.min_team_size}
                      onChange={(e) => setFormData({ ...formData, min_team_size: parseInt(e.target.value) })}
                      className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white focus:border-cyan/50 focus:outline-none ${errors.min_team_size ? 'border-red-500' : 'border-white/10'}`}
                      min="1"
                      required
                    />
                    {errors.min_team_size && <p className="text-red-400 text-xs mt-1">{errors.min_team_size}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Max Team Size</label>
                    <input
                      type="number"
                      value={formData.max_team_size}
                      onChange={(e) => setFormData({ ...formData, max_team_size: parseInt(e.target.value) })}
                      className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white focus:border-cyan/50 focus:outline-none ${errors.max_team_size ? 'border-red-500' : 'border-white/10'}`}
                      min="1"
                      required
                    />
                    {errors.max_team_size && <p className="text-red-400 text-xs mt-1">{errors.max_team_size}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Track</label>
                  <select
                    value={formData.track}
                    onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan/50 focus:outline-none"
                  >
                    <option value="AI/ML">AI / ML</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Blockchain">Blockchain</option>
                    <option value="Open Innovation">Open Innovation</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingHackathon(null);
                      setFormData({ name: '', description: '', start_date: '', end_date: '', max_team_size: 5, min_team_size: 2, status: 'active', track: 'Open Innovation' });
                      setErrors({});
                    }}
                    className="flex-1 px-6 py-2 border border-white/20 text-text-secondary hover:text-white hover:border-white/40 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-cyan hover:bg-cyan/80 text-black font-medium px-6 py-2 rounded-lg disabled:opacity-50 transition-all"
                  >
                    {loading ? (editingHackathon ? 'Updating...' : 'Creating...') : (editingHackathon ? 'Update Hackathon' : 'Create Hackathon')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, hackathonId: null, currentStatus: null, action: null })}
        onConfirm={confirmToggleStatus}
        title={
          confirmDialog.action === 'delete' 
            ? 'Delete Hackathon'
            : `${confirmDialog.currentStatus === 'active' ? 'Deactivate' : 'Activate'} Hackathon`
        }
        message={
          confirmDialog.action === 'delete'
            ? 'Are you sure you want to delete this hackathon? This action cannot be undone.'
            : `Are you sure you want to ${confirmDialog.currentStatus === 'active' ? 'deactivate' : 'activate'} this hackathon?`
        }
        confirmText={
          confirmDialog.action === 'delete'
            ? 'Delete'
            : confirmDialog.currentStatus === 'active' ? 'Deactivate' : 'Activate'
        }
        type={
          confirmDialog.action === 'delete' || confirmDialog.currentStatus === 'active'
            ? 'danger' 
            : 'primary'
        }
      />
    </div>
  );
}
