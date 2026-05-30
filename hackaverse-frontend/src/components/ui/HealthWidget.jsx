import { useState, useEffect } from 'react';
import api from '../../services/api';

const HealthWidget = () => {
  const [health, setHealth] = useState('Unknown');
  const [isVisible, setIsVisible] = useState(true);

  const healthStates = {
    'Healthy': { color: 'success', icon: 'uil-heart' },
    'Warning': { color: 'warning', icon: 'uil-exclamation-triangle' },
    'Critical': { color: 'error', icon: 'uil-exclamation-octagon' },
    'Unknown': { color: 'text-muted', icon: 'uil-question-circle' }
  };

  const colorClassMap = {
    success: 'text-success',
    cyan: 'text-cyan',
    warning: 'text-warning',
    error: 'text-red-400',
    'text-muted': 'text-text-muted'
  };

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await api.get('/system/health');
        const healthStatus = response.data?.status || response.data?.data?.status || 'healthy';
        const formattedStatus = String(healthStatus).charAt(0).toUpperCase() + String(healthStatus).slice(1);
        setHealth(formattedStatus);
      } catch (error) {
        console.error('Failed to fetch health status:', error);
        setHealth('Unknown');
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const currentHealth = healthStates[health] || healthStates['Unknown'];
  const currentClass = colorClassMap[currentHealth.color] || 'text-text-muted';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="glass-card p-3 flex items-center gap-3 min-w-[140px]">
        <i className={`uil ${currentHealth.icon} ${currentClass}`}></i>
        <div>
          <div className="text-xs text-text-muted">Health</div>
          <div className={`text-sm font-medium ${currentClass}`}>{health}</div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-text-muted hover:text-text-primary transition-colors ml-2"
        >
          <i className="uil uil-times text-xs"></i>
        </button>
      </div>
    </div>
  );
};

export default HealthWidget;
