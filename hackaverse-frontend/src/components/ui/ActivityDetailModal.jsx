import React from 'react';

const ActivityDetailModal = ({ isOpen, onClose, activity }) => {
  if (!isOpen || !activity) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className={`uil ${activity.icon || 'uil-info-circle'} text-cyan text-xl`}></i>
              <h2 className="text-xl font-semibold text-white">{activity.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-white transition-colors"
            >
              <i className="uil uil-times text-xl"></i>
            </button>
          </div>
          <p className="text-text-secondary mt-2">{activity.timestamp}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Description</h3>
            <p className="text-text-secondary">{activity.description}</p>
          </div>

          {/* Details */}
          {activity.details && activity.details.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Details</h3>
              <div className="space-y-2">
                {activity.details.map((detail, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-white/5 last:border-b-0">
                    <span className="text-text-secondary">{detail.label}</span>
                    <span className="text-white font-medium">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {activity.progress && (
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Progress</h3>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-cyan h-2 rounded-full transition-all duration-300"
                  style={{ width: `${activity.progress}%` }}
                ></div>
              </div>
              <p className="text-text-secondary text-sm mt-2">{activity.progress}% Complete</p>
            </div>
          )}

          {/* Participants */}
          {activity.participants && activity.participants.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Participants</h3>
              <div className="flex flex-wrap gap-2">
                {activity.participants.map((participant, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                    <div className="w-6 h-6 bg-cyan/20 rounded-full flex items-center justify-center">
                      <i className="uil uil-user text-cyan text-xs"></i>
                    </div>
                    <span className="text-white text-sm">{participant.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {activity.actions && activity.actions.length > 0 && (
            <div className="flex gap-3 pt-4 border-t border-white/10">
              {activity.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    action.primary
                      ? 'bg-cyan text-black hover:bg-cyan/90'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailModal;
