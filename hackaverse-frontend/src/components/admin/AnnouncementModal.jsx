import { useState } from 'react';

const AnnouncementModal = ({ isOpen, onClose, onSend }) => {
  const [formData, setFormData] = useState({
    title: '',
    target: 'all',
    message: '',
    priority: 'normal',
    scheduled: false,
    scheduleDate: '',
    scheduleTime: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend(formData);
    setFormData({
      title: '',
      target: 'all',
      message: '',
      priority: 'normal',
      scheduled: false,
      scheduleDate: '',
      scheduleTime: ''
    });
    onClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      target: 'all',
      message: '',
      priority: 'normal',
      scheduled: false,
      scheduleDate: '',
      scheduleTime: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Create Announcement</h2>
            <button
              onClick={handleClose}
              className="text-text-muted hover:text-white transition-colors"
            >
              <i className="uil uil-times text-xl"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-text-secondary text-sm mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Enter announcement title..."
              className="form-control"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm mb-2">Target Audience *</label>
              <select
                value={formData.target}
                onChange={(e) => setFormData({...formData, target: e.target.value})}
                className="form-control"
                required
              >
                <option value="all">All Participants</option>
                <option value="participants">Participants Only</option>
                <option value="judges">Judges Only</option>
                <option value="admins">Admins Only</option>
                <option value="track-ai">AI/ML Track</option>
                <option value="track-web3">Web3 Track</option>
                <option value="track-gaming">Gaming Track</option>
                <option value="track-open">Open Innovation Track</option>
              </select>
            </div>

            <div>
              <label className="block text-text-secondary text-sm mb-2">Priority Level</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="form-control"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-2">Message *</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              rows="6"
              placeholder="Write your announcement message..."
              className="form-control resize-none"
              required
            />
            <div className="text-xs text-text-muted mt-1">
              {formData.message.length}/1000 characters
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.scheduled}
                onChange={(e) => setFormData({...formData, scheduled: e.target.checked})}
                className="rounded"
              />
              <span className="text-text-secondary text-sm">Schedule for later</span>
            </label>

            {formData.scheduled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.scheduleDate}
                    onChange={(e) => setFormData({...formData, scheduleDate: e.target.value})}
                    className="form-control"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Time</label>
                  <input
                    type="time"
                    value={formData.scheduleTime}
                    onChange={(e) => setFormData({...formData, scheduleTime: e.target.value})}
                    className="form-control"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary px-6"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-6"
              disabled={!formData.title.trim() || !formData.message.trim()}
            >
              <i className="uil uil-paper-plane mr-2"></i>
              Send Announcement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementModal;
