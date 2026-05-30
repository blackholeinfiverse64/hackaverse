import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast, ToastContainer } from '../../hooks/useToast.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { CardSkeleton } from '../ui/Skeletons';

export default function ManualReview() {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reviewData, setReviewData] = useState({
    clarity_score: 0,
    quality_score: 0,
    innovation_score: 0,
    comments: ''
  });
  const [errors, setErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const { toasts, success, error: showError } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/judge/submissions/pending');
      setSubmissions(response.data.data || []);
    } catch (err) {
      showError('Failed to fetch submissions');
      console.error('Failed to fetch submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateReview = () => {
    const newErrors = {};
    if (reviewData.clarity_score < 0 || reviewData.clarity_score > 10) newErrors.clarity_score = 'Score must be between 0-10';
    if (reviewData.quality_score < 0 || reviewData.quality_score > 10) newErrors.quality_score = 'Score must be between 0-10';
    if (reviewData.innovation_score < 0 || reviewData.innovation_score > 10) newErrors.innovation_score = 'Score must be between 0-10';
    if (!reviewData.comments.trim()) newErrors.comments = 'Comments are required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitReview = () => {
    if (!validateReview()) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Submit Review',
      message: 'Are you sure you want to submit this review? This action cannot be undone.',
      onConfirm: submitReview
    });
  };

  const selectSubmission = (submission) => {
    setSelectedSubmission(submission);
    setReviewData({
      clarity_score: submission.ai_clarity_score || 0,
      quality_score: submission.ai_quality_score || 0,
      innovation_score: submission.ai_innovation_score || 0,
      comments: ''
    });
  };

  const submitReview = async () => {
    try {
      setLoading(true);
      await api.post('/judge/review/submit', {
        submission_id: selectedSubmission.id,
        ...reviewData,
        final_score: (reviewData.clarity_score + reviewData.quality_score + reviewData.innovation_score) / 3
      });
      
      success('Review submitted successfully!');
      setSelectedSubmission(null);
      setReviewData({ clarity_score: 0, quality_score: 0, innovation_score: 0, comments: '' });
      setErrors({});
      fetchSubmissions();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
      setConfirmDialog({ isOpen: false });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Manual Review</h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 glass-card rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Pending Reviews</h2>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : submissions.length === 0 ? (
            <p className="text-text-muted">No pending submissions</p>
          ) : (
            <div className="space-y-2">
              {submissions.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => selectSubmission(sub)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedSubmission?.id === sub.id ? 'bg-cyan/10 border-cyan' : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="font-semibold text-white">{sub.team_name}</div>
                  <div className="text-sm text-text-secondary">{sub.project_title}</div>
                  <div className="text-xs text-text-muted mt-1">
                    AI Score: {sub.ai_total_score?.toFixed(1) || 'N/A'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-2 glass-card rounded-2xl border border-white/10 p-6">
          {!selectedSubmission ? (
            <div className="text-center text-text-muted py-12">
              Select a submission to review
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">{selectedSubmission.project_title}</h2>
              <p className="text-text-secondary mb-6">Team: {selectedSubmission.team_name}</p>

              <div className="mb-6">
                <h3 className="font-semibold text-white mb-2">Project Description</h3>
                <p className="text-text-secondary bg-white/5 p-4 rounded-lg">{selectedSubmission.description}</p>
              </div>

              {selectedSubmission.github_url && (
                <div className="mb-6">
                  <h3 className="font-semibold text-white mb-2">GitHub Repository</h3>
                  <a
                    href={selectedSubmission.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan hover:underline"
                  >
                    {selectedSubmission.github_url}
                  </a>
                </div>
              )}

              <div className="mb-6 p-4 bg-cyan/10 border border-cyan/30 rounded-lg">
                <h3 className="font-semibold text-white mb-3">AI Scores (Reference)</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-text-secondary">Clarity:</span>
                    <span className="ml-2 font-semibold text-white">{selectedSubmission.ai_clarity_score?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Quality:</span>
                    <span className="ml-2 font-semibold text-white">{selectedSubmission.ai_quality_score?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Innovation:</span>
                    <span className="ml-2 font-semibold text-white">{selectedSubmission.ai_innovation_score?.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-white">Your Review</h3>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Clarity Score (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={reviewData.clarity_score}
                    onChange={(e) => setReviewData({ ...reviewData, clarity_score: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white focus:border-cyan/50 focus:outline-none ${errors.clarity_score ? 'border-red-500' : 'border-white/10'}`}
                  />
                  {errors.clarity_score && <p className="text-red-400 text-xs mt-1">{errors.clarity_score}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Quality Score (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={reviewData.quality_score}
                    onChange={(e) => setReviewData({ ...reviewData, quality_score: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white focus:border-cyan/50 focus:outline-none ${errors.quality_score ? 'border-red-500' : 'border-white/10'}`}
                  />
                  {errors.quality_score && <p className="text-red-400 text-xs mt-1">{errors.quality_score}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Innovation Score (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={reviewData.innovation_score}
                    onChange={(e) => setReviewData({ ...reviewData, innovation_score: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white focus:border-cyan/50 focus:outline-none ${errors.innovation_score ? 'border-red-500' : 'border-white/10'}`}
                  />
                  {errors.innovation_score && <p className="text-red-400 text-xs mt-1">{errors.innovation_score}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Comments *
                  </label>
                  <textarea
                    value={reviewData.comments}
                    onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value })}
                    className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white focus:border-cyan/50 focus:outline-none ${errors.comments ? 'border-red-500' : 'border-white/10'}`}
                    rows="4"
                    placeholder="Provide feedback for the team..."
                  />
                  {errors.comments && <p className="text-red-400 text-xs mt-1">{errors.comments}</p>}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSubmitReview}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
      <ToastContainer toasts={toasts} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Submit Review"
        type="primary"
      />
    </div>
  );
}
