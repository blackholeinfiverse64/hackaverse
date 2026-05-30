import { useState } from 'react';

const AITerminalCard = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const content = `$ hacka init --project="Smart Campus"
✔ Environment ready
✔ Project scaffold generated
✔ AI mentor assigned: Dr. Sarah Chen
✔ Team match: 3 collaborators suggested

AI: Welcome builder. Your workspace is live.
AI: I will assist with architecture, reviews, and deployment.

$`;
    
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="ai-terminal-card glass-card" role="region" aria-label="AI setup console">
      <div className="ai-terminal-header">
        <h3 className="ai-terminal-title">HackaVerse AI Mentor Console</h3>
        <button 
          className="ai-terminal-copy"
          onClick={handleCopy}
          aria-label="Copy terminal content"
          title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          <i className={`uil ${copied ? 'uil-check' : 'uil-copy'}`}></i>
        </button>
      </div>
      
      <div className="ai-terminal-body">
        <div className="ai-terminal-line">
          <span className="ai-terminal-prompt">$</span> hacka init --project="Smart Campus"
        </div>
        <div className="ai-terminal-line ai-terminal-success">
          Environment ready
        </div>
        <div className="ai-terminal-line ai-terminal-success">
          Project scaffold generated
        </div>
        <div className="ai-terminal-line ai-terminal-success">
          AI mentor assigned: Dr. Sarah Chen
        </div>
        <div className="ai-terminal-line ai-terminal-success">
          Team match: 3 collaborators suggested
        </div>
        <div className="ai-terminal-line"></div>
        <div className="ai-terminal-line ai-terminal-ai">
          AI: Welcome builder. Your workspace is live.
        </div>
        <div className="ai-terminal-line ai-terminal-ai">
          AI: I will assist with architecture, reviews, and deployment.
        </div>
        <div className="ai-terminal-line"></div>
        <div className="ai-terminal-line ai-terminal-cursor">
          <span className="ai-terminal-prompt">$</span>
        </div>
      </div>
    </div>
  );
};

export default AITerminalCard;