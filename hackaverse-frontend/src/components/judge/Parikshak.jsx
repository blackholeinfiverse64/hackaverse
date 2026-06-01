import React from 'react';
import { PARIKSHAK_URL } from '../../config/parikshak.config';

export default function Parikshak() {
  const handleLaunch = () => {
    window.open(PARIKSHAK_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Parikshak AI Evaluation Engine</h1>
            <p className="text-text-secondary max-w-3xl">
              AI-powered repository evaluation and code review platform.<br />
              Analyze GitHub repositories, evaluate project quality, generate detailed feedback, 
              and assess hackathon submissions using advanced AI analysis.
            </p>
          </div>
          <div className="bg-cyan/10 border border-cyan/30 text-cyan px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
            <i className="uil uil-external-link-alt"></i>
            External Evaluation Platform
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-2xl border border-white/10 p-8">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <i className="uil uil-microscope text-cyan text-3xl"></i>
                Launch Evaluation
              </h2>
              <p className="text-text-secondary text-lg mb-8">
                Parikshak extends HackaVerse judging capabilities through AI-powered repository analysis.
                Judges can launch the Parikshak platform to perform deep GitHub repository evaluation, 
                generate detailed technical feedback, and obtain automated scoring insights.
              </p>
              
              <button 
                onClick={handleLaunch}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan to-blue-500 hover:from-cyan/80 hover:to-blue-500/80 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg shadow-cyan/20 text-lg"
              >
                <span>Launch Parikshak</span>
                <i className="uil uil-arrow-right text-xl"></i>
              </button>
            </div>

            <div className="glass-card rounded-2xl border border-white/10 p-8">
              <h3 className="text-xl font-semibold text-white mb-6">System Capabilities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  'Repository Analysis',
                  'Code Quality Assessment',
                  'Documentation Review',
                  'Security Assessment',
                  'AI Feedback Generation',
                  'Automated Scoring',
                  'Project Evaluation Reports'
                ].map((cap, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white/5 p-4 rounded-lg border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0">
                      <i className="uil uil-check"></i>
                    </div>
                    <span className="text-white font-medium">{cap}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl border border-cyan/20 p-6 bg-gradient-to-b from-cyan/10 to-transparent">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="uil uil-rocket text-cyan"></i>
                Future Integration Roadmap
              </h3>
              <p className="text-sm text-text-secondary mb-6">
                Upcoming features planned for Phase 2 API integration with HackaVerse.
              </p>
              
              <div className="space-y-4">
                {[
                  { title: 'Automated GitHub Repository Analysis', icon: 'uil-github' },
                  { title: 'AI Evaluation Synchronization', icon: 'uil-sync' },
                  { title: 'Direct Score Import', icon: 'uil-import' },
                  { title: 'Unified Judge Workflow', icon: 'uil-layer-group' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="mt-1 w-6 h-6 rounded bg-white/10 flex items-center justify-center flex-shrink-0 text-text-muted">
                      <i className={`uil ${item.icon}`}></i>
                    </div>
                    <div className="text-text-secondary text-sm">
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
