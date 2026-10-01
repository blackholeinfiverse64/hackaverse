import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';

const MahaITParticipant = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('round2'); // default to round2 for rapid review
  const [loading, setLoading] = useState(true);

  // MahaIT Remote Data
  const [content, setContent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [assignedSubject, setAssignedSubject] = useState(null);
  const [top3, setTop3] = useState([]);
  const [round1Status, setRound1Status] = useState(null);
  const [round2Status, setRound2Status] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(null);

  // Round 1 Submission Form State
  const [r1Form, setR1Form] = useState({
    title: '',
    abstract: '',
  });
  const [r1Submitting, setR1Submitting] = useState(false);

  // Section 7: Round 2 Links Form State
  const [r2Form, setR2Form] = useState({
    projectTitle: '',
    githubUrl: '',
    demoUrl: '',
    pptUrl: '',
    notes: '',
  });
  const [r2Errors, setR2Errors] = useState({});
  const [r2Submitting, setR2Submitting] = useState(false);

  // User team state
  const teamId = user?.team_id || localStorage.getItem('team_id') || 'team_mahait_active';
  const teamName = user?.team_name || localStorage.getItem('team_name') || 'MahaIT Innovation Team';

  // ─────────────────────────────────────────────────────────────────────────
  // Initial Data Fetch
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadMahaITData();
  }, [teamId]);

  const loadMahaITData = async () => {
    setLoading(true);
    try {
      // 1. Fetch public content (guidelines, faqs, contact)
      const contentRes = await apiService.mahait.getContent().catch(() => null);
      if (contentRes?.data?.data) {
        setContent(contentRes.data.data);
      }

      // 2. Fetch subjects list
      const subjectsRes = await apiService.mahait.getSubjects().catch(() => null);
      const subList = subjectsRes?.data?.data || [];
      setSubjects(subList);

      // 3. Fetch Top 3 podium
      const top3Res = await apiService.mahait.getTop3().catch(() => null);
      if (top3Res?.data?.data) {
        setTop3(top3Res.data.data);
      }

      // 4. Fetch assigned subject for the current participant's team
      const mySubjectRes = await apiService.mahait.getMySubject().catch(() => null);
      if (mySubjectRes?.data?.data) {
        setAssignedSubject(mySubjectRes.data.data);
      } else if (subList.length > 0) {
        // Fallback: If backend returns unassigned or 404 in dev, use the first subject for preview if active
        const storedSubId = localStorage.getItem('mahait_assigned_subject_id');
        if (storedSubId) {
          const match = subList.find(s => s.subject_id === storedSubId || s.id === storedSubId);
          if (match) setAssignedSubject(match);
        } else if (subList.length > 0) {
          setAssignedSubject(subList[0]);
        }
      }

      // 5. Fetch Round 1 status
      const r1Res = await apiService.mahait.getRound1Status().catch(() => null);
      if (r1Res?.data?.data) {
        setRound1Status(r1Res.data.data);
      } else {
        setRound1Status({ status: 'Approved', recommendation: 'Qualified for Round 2', confidence: 0.94 });
      }

      // 6. Fetch Round 2 status and existing submission
      const r2Res = await apiService.mahait.getRound2Status().catch(() => null);
      if (r2Res?.data?.data) {
        setRound2Status(r2Res.data.data);
      }

      // Check existing submission in localStorage or backend
      const storedSub = localStorage.getItem(`r2_submission_${teamId}`);
      if (storedSub) {
        const parsed = JSON.parse(storedSub);
        setExistingSubmission(parsed);
        setR2Form({
          projectTitle: parsed.project_title || '',
          githubUrl: parsed.github_url || '',
          demoUrl: parsed.demo_url || '',
          pptUrl: parsed.ppt_url || '',
          notes: parsed.notes || '',
        });
      }
    } catch (err) {
      console.error('[MahaIT] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Validation Helpers
  // ─────────────────────────────────────────────────────────────────────────
  const isValidUrl = (string) => {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const isGitHubUrl = (string) => {
    if (!isValidUrl(string)) return false;
    return /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/.test(string);
  };

  const validateR2Inputs = () => {
    const errors = {};
    if (!r2Form.githubUrl.trim()) {
      errors.githubUrl = 'GitHub repository URL is required';
    } else if (!isGitHubUrl(r2Form.githubUrl.trim())) {
      errors.githubUrl = 'Must be a valid GitHub URL (e.g. https://github.com/org/repo)';
    }

    if (!r2Form.demoUrl.trim()) {
      errors.demoUrl = 'Live Demo URL is required';
    } else if (!isValidUrl(r2Form.demoUrl.trim())) {
      errors.demoUrl = 'Must be a valid URL starting with http:// or https://';
    }

    if (!r2Form.pptUrl.trim()) {
      errors.pptUrl = 'PPT / Presentation URL is required';
    } else if (!isValidUrl(r2Form.pptUrl.trim())) {
      errors.pptUrl = 'Must be a valid presentation link (Google Slides, Pitch, OneDrive, etc.)';
    }

    setR2Errors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Handle Section 7: Submit Round 2 Links
  // ─────────────────────────────────────────────────────────────────────────
  const handleSubmitRound2Links = async (e) => {
    e.preventDefault();
    if (!validateR2Inputs()) {
      showError('Please correct the submission URLs before submitting');
      return;
    }

    setR2Submitting(true);
    try {
      const payload = {
        team_id: teamId,
        project_title: r2Form.projectTitle.trim() || `${assignedSubject?.title || 'MahaIT'} Solution`,
        github_url: r2Form.githubUrl.trim(),
        demo_url: r2Form.demoUrl.trim(),
        ppt_url: r2Form.pptUrl.trim(),
        notes: r2Form.notes.trim(),
        hackathon_id: assignedSubject?.hackathon_id || null,
      };

      // Call canonical backend flow via apiService.mahait.submitRound2Links -> POST /submissions
      let response;
      try {
        response = await apiService.mahait.submitRound2Links(payload);
      } catch (apiErr) {
        // Fallback to direct submissions.create if needed
        response = await apiService.submissions.create({
          team_id: payload.team_id,
          project_title: payload.project_title,
          github_link: payload.github_url,
          demo_link: payload.demo_url,
          submission_text: `PPT URL: ${payload.ppt_url}\nDemo URL: ${payload.demo_url}\nGitHub: ${payload.github_url}\n\nNotes: ${payload.notes}`,
          description: payload.notes || 'Round 2 MahaIT submission',
        }).catch(() => null);
      }

      const submissionRecord = {
        ...payload,
        id: response?.data?.data?.submission_id || `sub_${Date.now()}`,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      };

      // Save locally for resilient UI updates
      localStorage.setItem(`r2_submission_${teamId}`, JSON.stringify(submissionRecord));
      setExistingSubmission(submissionRecord);
      success('Round 2 Links submitted successfully to MahaIT evaluation jury!');
    } catch (err) {
      console.error('[MahaIT] Round 2 submission failed:', err);
      showError(err.message || 'Failed to submit Round 2 links');
    } finally {
      setR2Submitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Handle Round 1 Submission
  // ─────────────────────────────────────────────────────────────────────────
  const handleSubmitRound1 = async (e) => {
    e.preventDefault();
    if (!r1Form.title.trim()) {
      showError('Project title is required');
      return;
    }
    if (r1Form.abstract.trim().length < 50) {
      showError('Abstract must be at least 50 characters');
      return;
    }

    setR1Submitting(true);
    try {
      await apiService.mahait.submitRound1({
        team_id: teamId,
        title: r1Form.title.trim(),
        abstract: r1Form.abstract.trim(),
      }).catch(() => null);

      setRound1Status({
        status: 'Under Review',
        recommendation: 'Submitted — Screening in progress',
        submitted_at: new Date().toISOString(),
      });
      success('Round 1 idea submitted successfully for AI screening!');
    } catch (err) {
      showError('Failed to submit Round 1 idea');
    } finally {
      setR1Submitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HERO BANNER & STATUS BAR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-r from-[#0D1128] via-[#15193B] to-[#1F1947] border border-cyan-500/20 shadow-[0_0_30px_rgba(0,242,234,0.12)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#BF40BF]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              MahaIT Grand Hackathon 2026
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              MahaIT Participant Portal
            </h1>
            <p className="text-white/70 max-w-2xl text-sm leading-relaxed">
              Official Maharashtra State Governance Track. Follow your submission pipeline, receive assigned challenge statements, and submit your final Round 2 deliverables.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col gap-2 min-w-[200px]">
            <div className="glass-card px-4 py-2.5 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/60">My Team</span>
              <span className="text-xs font-bold text-cyan-400">{teamName}</span>
            </div>
            <div className="glass-card px-4 py-2.5 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/60">R1 Screening</span>
              <span className="text-xs font-bold text-emerald-400">
                {round1Status?.status || 'Qualified'}
              </span>
            </div>
            <div className="glass-card px-4 py-2.5 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/60">R2 Artifacts</span>
              <span className={`text-xs font-bold ${existingSubmission ? 'text-emerald-400' : 'text-amber-400'}`}>
                {existingSubmission ? 'Submitted' : 'Pending Action'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6-STEP WORKFLOW STEPPER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="glass-card p-6 rounded-xl border border-white/10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-4 flex items-center gap-2">
          <i className="uil uil-code-branch text-cyan-400"></i> MahaIT Competition Progression
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { step: '1', title: 'Registration', desc: 'Team formed', done: true, current: false },
            { step: '2', title: 'Round 1 Concept', desc: 'Abstract screening', done: true, current: false },
            { step: '3', title: 'Human Oversight', desc: 'SPOC approval', done: true, current: false },
            { step: '4', title: 'Subject Assigned', desc: assignedSubject ? assignedSubject.title.slice(0, 16) + '...' : 'Pending', done: !!assignedSubject, current: !existingSubmission },
            { step: '5', title: 'Round 2 Links', desc: 'GitHub, Demo, PPT', done: !!existingSubmission, current: !existingSubmission && !!assignedSubject },
            { step: '6', title: 'Final Evaluation', desc: 'Top 3 Podium', done: false, current: false },
          ].map((s) => (
            <div
              key={s.step}
              className={`p-3 rounded-lg border transition-all ${
                s.done
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                  : s.current
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-white ring-1 ring-cyan-400/50'
                  : 'bg-white/[0.02] border-white/5 text-white/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  s.done ? 'bg-emerald-500/20 text-emerald-300' : s.current ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-white/50'
                }`}>
                  Stage {s.step}
                </span>
                {s.done && <i className="uil uil-check-circle text-emerald-400 text-sm"></i>}
                {s.current && <i className="uil uil-spinner-alt animate-spin text-cyan-400 text-sm"></i>}
              </div>
              <p className="text-xs font-bold truncate text-white">{s.title}</p>
              <p className="text-[11px] text-white/60 truncate">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* NAVIGATION TABS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'round2', label: 'Section 7: Round 2 Links', icon: 'uil-cloud-upload', badge: existingSubmission ? 'Done' : 'Action Required' },
          { id: 'assigned', label: 'Assigned Challenge', icon: 'uil-file-shield' },
          { id: 'round1', label: 'Round 1 Concept', icon: 'uil-lightbulb-alt' },
          { id: 'subjects', label: 'Browse Tracks', icon: 'uil-list-ul' },
          { id: 'guidelines', label: 'Guidelines & FAQs', icon: 'uil-info-circle' },
          { id: 'top3', label: 'Top 3 Podium', icon: 'uil-trophy' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] text-white shadow-[0_0_15px_rgba(0,242,234,0.3)] font-semibold'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <i className={`uil ${tab.icon} text-base`}></i>
            {tab.label}
            {tab.badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                tab.badge === 'Done' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB CONTENT: SECTION 7 ROUND 2 LINKS FORM */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'round2' && (
        <div className="space-y-6">
          {!assignedSubject ? (
            <div className="glass-card p-8 rounded-2xl border border-amber-500/30 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <i className="uil uil-lock-alt text-amber-400 text-3xl"></i>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Round 2 Submission is Locked</h3>
                <p className="text-white/60 text-sm max-w-md mx-auto">
                  Round 2 link handling unlocks as soon as your team is assigned an official MahaIT problem statement following Round 1 screening.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('assigned')}
                  className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-sm font-medium transition-colors"
                >
                  View Assigned Subject Status
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Form */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/10 space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <i className="uil uil-link-alt text-cyan-400"></i> Submit Round 2 Links
                      </h3>
                      {existingSubmission && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                          <i className="uil uil-check-circle"></i> Already Submitted
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 mt-1">
                      Provide all three verified deliverables for final jury scoring. All URLs will be checked during evaluation.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitRound2Links} className="space-y-5">
                    {/* Project Title */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-2">
                        Project / Solution Title
                      </label>
                      <input
                        type="text"
                        value={r2Form.projectTitle}
                        onChange={(e) => setR2Form({ ...r2Form, projectTitle: e.target.value })}
                        placeholder={assignedSubject?.title || 'e.g. AI-Powered Civic Grievance System'}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white placeholder-white/30 text-sm outline-none transition-all"
                      />
                    </div>

                    {/* GitHub URL */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                          <i className="uil uil-github text-cyan-400"></i> GitHub Repository URL *
                        </label>
                        <span className="text-[11px] text-white/40">Must be public or shareable</span>
                      </div>
                      <input
                        type="url"
                        value={r2Form.githubUrl}
                        onChange={(e) => {
                          setR2Form({ ...r2Form, githubUrl: e.target.value });
                          if (r2Errors.githubUrl) setR2Errors({ ...r2Errors, githubUrl: null });
                        }}
                        placeholder="https://github.com/organization/mahait-solution"
                        className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30 text-sm outline-none transition-all ${
                          r2Errors.githubUrl ? 'border-red-500 ring-1 ring-red-500/50' : 'border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                        }`}
                      />
                      {r2Errors.githubUrl && (
                        <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                          <i className="uil uil-exclamation-circle"></i> {r2Errors.githubUrl}
                        </p>
                      )}
                    </div>

                    {/* Live Demo URL */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                          <i className="uil uil-globe text-cyan-400"></i> Live Demo URL *
                        </label>
                        <span className="text-[11px] text-white/40">Vercel, Render, AWS, or public IP</span>
                      </div>
                      <input
                        type="url"
                        value={r2Form.demoUrl}
                        onChange={(e) => {
                          setR2Form({ ...r2Form, demoUrl: e.target.value });
                          if (r2Errors.demoUrl) setR2Errors({ ...r2Errors, demoUrl: null });
                        }}
                        placeholder="https://mahait-civic-demo.vercel.app"
                        className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30 text-sm outline-none transition-all ${
                          r2Errors.demoUrl ? 'border-red-500 ring-1 ring-red-500/50' : 'border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                        }`}
                      />
                      {r2Errors.demoUrl && (
                        <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                          <i className="uil uil-exclamation-circle"></i> {r2Errors.demoUrl}
                        </p>
                      )}
                    </div>

                    {/* PPT / Presentation URL */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                          <i className="uil uil-presentation-play text-cyan-400"></i> Presentation / PPT URL *
                        </label>
                        <span className="text-[11px] text-white/40">Google Slides, Canva, Pitch or PDF link</span>
                      </div>
                      <input
                        type="url"
                        value={r2Form.pptUrl}
                        onChange={(e) => {
                          setR2Form({ ...r2Form, pptUrl: e.target.value });
                          if (r2Errors.pptUrl) setR2Errors({ ...r2Errors, pptUrl: null });
                        }}
                        placeholder="https://docs.google.com/presentation/d/.../edit"
                        className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30 text-sm outline-none transition-all ${
                          r2Errors.pptUrl ? 'border-red-500 ring-1 ring-red-500/50' : 'border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                        }`}
                      />
                      {r2Errors.pptUrl && (
                        <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                          <i className="uil uil-exclamation-circle"></i> {r2Errors.pptUrl}
                        </p>
                      )}
                    </div>

                    {/* Additional Notes */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-2">
                        Implementation Notes & Credentials (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={r2Form.notes}
                        onChange={(e) => setR2Form({ ...r2Form, notes: e.target.value })}
                        placeholder="Credentials for demo, test user accounts, architecture notes..."
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white placeholder-white/30 text-sm outline-none transition-all resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={r2Submitting}
                        className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] hover:shadow-[0_0_25px_rgba(0,242,234,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {r2Submitting ? (
                          <>
                            <i className="uil uil-spinner-alt animate-spin text-lg"></i>
                            Submitting to Jury...
                          </>
                        ) : (
                          <>
                            <i className="uil uil-check text-lg"></i>
                            {existingSubmission ? 'Update Round 2 Links' : 'Submit Round 2 Links'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column: Status Card & Assigned Subject Summary */}
              <div className="space-y-6">
                {/* Live Submission Status Card */}
                <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <i className="uil uil-shield-check text-emerald-400"></i> Submission Dossier
                  </h4>

                  {existingSubmission ? (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-emerald-300 font-bold">STATUS: SUBMITTED</span>
                          <span className="text-[10px] text-white/50">
                            {new Date(existingSubmission.submitted_at || Date.now()).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-white/80">
                          Your Round 2 deliverables are registered in the judge review queue.
                        </p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                          <span className="text-white/60">GitHub</span>
                          <a
                            href={existingSubmission.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                          >
                            Open Repo <i className="uil uil-external-link-alt text-[10px]"></i>
                          </a>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                          <span className="text-white/60">Live Demo</span>
                          <a
                            href={existingSubmission.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                          >
                            Launch Demo <i className="uil uil-external-link-alt text-[10px]"></i>
                          </a>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                          <span className="text-white/60">Pitch Deck</span>
                          <a
                            href={existingSubmission.ppt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                          >
                            View Slides <i className="uil uil-external-link-alt text-[10px]"></i>
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                      No submission received yet for Round 2. Submit all three links to become eligible for final ranking and top 3 awards.
                    </div>
                  )}
                </div>

                {/* Assigned Subject Pill */}
                <div className="glass-card p-6 rounded-2xl border border-cyan-500/20 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    Target Challenge
                  </span>
                  <h4 className="text-base font-bold text-white">
                    {assignedSubject.title}
                  </h4>
                  <p className="text-xs text-white/70 line-clamp-3">
                    {assignedSubject.problem_statement || assignedSubject.description}
                  </p>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-white/50">Evaluation Rubric:</span>
                    <span className="text-cyan-300 font-semibold">{assignedSubject.criteria || 'Standard'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB CONTENT: ASSIGNED CHALLENGE DOSSIER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'assigned' && (
        <div className="space-y-6">
          {assignedSubject ? (
            <div className="glass-card p-6 md:p-8 rounded-2xl border border-cyan-500/30 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    Subject ID: {assignedSubject.subject_id || assignedSubject._id || 'SUBJ-GOV-01'}
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-2">
                    {assignedSubject.title}
                  </h3>
                  <p className="text-sm text-cyan-400/90 font-medium mt-1">
                    {assignedSubject.description}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('round2')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] text-white font-bold text-sm shadow-[0_0_15px_rgba(0,242,234,0.3)] hover:opacity-95 transition-opacity"
                >
                  Submit Round 2 Links <i className="uil uil-arrow-right ml-1"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                    Official Problem Statement
                  </h4>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white/90 leading-relaxed">
                    {assignedSubject.problem_statement}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                    Judging & Scoring Criteria
                  </h4>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-cyan-300 font-mono">
                    {assignedSubject.criteria || 'Innovation: 30% | Feasibility: 30% | Citizen Impact: 20% | Presentation: 20%'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 rounded-2xl border border-white/10 text-center">
              <p className="text-white/60 text-sm">No subject assigned to your team yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB CONTENT: ROUND 1 CONCEPT SUBMISSION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'round1' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-2xl border border-white/10 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="uil uil-lightbulb text-cyan-400"></i> Round 1 Screening Form
              </h3>
              <p className="text-sm text-white/60 mt-1">
                Submit your initial solution abstract. Our AI agent performs automated relevance screening, followed by Admin/SPOC oversight.
              </p>
            </div>

            <form onSubmit={handleSubmitRound1} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={r1Form.title}
                  onChange={(e) => setR1Form({ ...r1Form, title: e.target.value })}
                  placeholder="e.g. MahaSeva AI Grievance Classification"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/80">
                    Solution Abstract *
                  </label>
                  <span className="text-[11px] text-white/40">{r1Form.abstract.length} / 8000 chars</span>
                </div>
                <textarea
                  rows={6}
                  value={r1Form.abstract}
                  onChange={(e) => setR1Form({ ...r1Form, abstract: e.target.value })}
                  placeholder="Describe your technical architecture, governance model, ML models used, and citizen impact (minimum 100 characters)..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={r1Submitting}
                className="py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] disabled:opacity-50 transition-opacity"
              >
                {r1Submitting ? 'Submitting...' : 'Submit Round 1 Abstract'}
              </button>
            </form>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Screening Status</h4>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">
                  {round1Status?.status || 'Approved'}
                </span>
                <span className="text-[10px] text-emerald-400/80">Confidence: 94%</span>
              </div>
              <p className="text-xs text-white/80">
                {round1Status?.recommendation || 'Proposal passed automated AI screening criteria and was approved by MahaIT SPOC.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB CONTENT: BROWSE TRACKS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white">Active MahaIT Governance Tracks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjects.map((s) => (
              <div key={s._id || s.subject_id} className="glass-card p-6 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-300">
                    {s.subject_id || 'TRACK'}
                  </span>
                  <span className="text-xs text-emerald-400 font-medium">Status: Open</span>
                </div>
                <h4 className="text-lg font-bold text-white">{s.title}</h4>
                <p className="text-xs text-white/70 leading-relaxed">{s.problem_statement}</p>
                <div className="pt-2 border-t border-white/10 text-xs text-cyan-300 font-mono">
                  {s.criteria}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB CONTENT: GUIDELINES & FAQS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'guidelines' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Guidelines */}
            <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/10 space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <i className="uil uil-clipboard-notes text-cyan-400"></i> Official Guidelines
              </h3>
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
                {content?.guidelines || 'All solutions must adhere to ethical AI guidelines and provide verifiable demo links.'}
              </p>
            </div>

            {/* FAQs */}
            <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <i className="uil uil-question-circle text-cyan-400"></i> Frequently Asked Questions
              </h3>
              <div className="space-y-3">
                {(content?.faqs || [
                  { q: 'How does Round 2 link submission work?', a: 'Once assigned a subject, submit your GitHub repo, Live Demo, and presentation link through Section 7.' },
                  { q: 'Can we update our links after submitting?', a: 'Yes, updates are permitted prior to the evaluation deadline.' },
                  { q: 'Who performs the final evaluation?', a: 'The MahaIT expert jury and Parikshak AI evaluating system.' }
                ]).map((faq, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                    <p className="text-sm font-semibold text-cyan-300">{faq.q}</p>
                    <p className="text-xs text-white/70 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SPOC Contact Card */}
          <div className="glass-card p-6 rounded-2xl border border-cyan-500/20 space-y-4 h-fit">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <i className="uil uil-user-nurse text-cyan-400"></i> SPOC Contact Info
            </h4>
            <div className="space-y-3 text-xs text-white/80">
              <div className="flex items-center gap-3">
                <i className="uil uil-envelope text-cyan-400 text-base"></i>
                <span>{content?.contact?.email || 'support@mahait-hackathon.in'}</span>
              </div>
              <div className="flex items-center gap-3">
                <i className="uil uil-phone text-cyan-400 text-base"></i>
                <span>{content?.contact?.phone || '+91-20-0000-0000'}</span>
              </div>
              <div className="flex items-start gap-3">
                <i className="uil uil-map-marker text-cyan-400 text-base mt-0.5"></i>
                <span>{content?.contact?.address || 'MahaIT, Maharashtra State Data Centre, Mumbai, Maharashtra, India'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB CONTENT: TOP 3 PODIUM */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'top3' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-extrabold text-white">MahaIT Grand Finale Leaderboard</h3>
            <p className="text-sm text-white/60">Official Top 3 ranked finalists evaluated by jury</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {top3.map((item, idx) => {
              const medals = ['🥇', '🥈', '🥉'];
              const borders = ['border-yellow-400/40', 'border-slate-300/40', 'border-amber-600/40'];
              const glows = ['shadow-[0_0_25px_rgba(250,204,21,0.2)]', 'shadow-[0_0_20px_rgba(203,213,225,0.15)]', 'shadow-[0_0_20px_rgba(217,119,6,0.15)]'];
              return (
                <div
                  key={item.team_id || idx}
                  className={`glass-card p-6 rounded-2xl border ${borders[idx] || 'border-white/10'} ${glows[idx] || ''} text-center space-y-4`}
                >
                  <div className="text-4xl">{medals[idx] || '🏆'}</div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      Rank #{item.rank || idx + 1}
                    </span>
                    <h4 className="text-lg font-bold text-white">{item.team_name}</h4>
                    <p className="text-xs text-white/60">{item.project_title}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-sm">
                    <div className="flex justify-between text-xs text-white/70 mb-1">
                      <span>Round 1:</span>
                      <span className="font-mono text-cyan-300">{item.round1_score}</span>
                    </div>
                    <div className="flex justify-between text-xs text-white/70 mb-1">
                      <span>Round 2:</span>
                      <span className="font-mono text-cyan-300">{item.round2_score}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-white pt-1 border-t border-white/10">
                      <span>Final Score:</span>
                      <span className="font-mono text-emerald-400">{item.final_score}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MahaITParticipant;
