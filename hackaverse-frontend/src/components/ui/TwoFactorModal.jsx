import { useState } from 'react';

const TwoFactorModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('setup'); // 'setup', 'verify', 'success'
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock QR code and secret for demo
  const qrCodeData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const secretKey = 'JBSWY3DPEHPK3PXP';

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Simulate API verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock verification - accept 123456
      if (verificationCode === '123456') {
        setStep('success');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    // Show toast or notification
  };

  const handleClose = () => {
    setStep('setup');
    setVerificationCode('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      ></div>
      
      <div className="relative glass-card-glow rounded-2xl p-8 max-w-lg w-full mx-4 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Two-Factor Authentication</h2>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <i className="uil uil-times text-white"></i>
          </button>
        </div>

        {step === 'setup' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="uil uil-mobile-vibrate text-white text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Secure Your Account</h3>
              <p className="text-white/60 text-sm">
                Add an extra layer of security to your account with two-factor authentication
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-white/80">Step 1: Install an Authenticator App</h4>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white/80 text-sm mb-3">
                  Download and install one of these authenticator apps:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a 
                    href="https://apps.apple.com/app/google-authenticator/id388497605" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-[#00F2EA]/50 transition-colors text-center"
                  >
                    <i className="uil uil-apple text-2xl text-white/80 mb-1"></i>
                    <div className="text-xs text-white/60">Google Authenticator</div>
                  </a>
                  <a 
                    href="https://play.google.com/store/apps/details?id=com.authy.authy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-[#00F2EA]/50 transition-colors text-center"
                  >
                    <i className="uil uil-shield-check text-2xl text-white/80 mb-1"></i>
                    <div className="text-xs text-white/60">Authy</div>
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-white/80">Step 2: Scan QR Code</h4>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <div className="inline-block p-4 bg-white rounded-lg mb-4">
                  <img 
                    src={qrCodeData} 
                    alt="QR Code" 
                    className="w-32 h-32"
                  />
                </div>
                <p className="text-white/60 text-xs mb-2">Scan this QR code with your authenticator app</p>
                <button
                  onClick={handleCopySecret}
                  className="text-[#00F2EA] text-xs hover:underline"
                >
                  Can't scan? Enter this code manually
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-white/80">Manual Entry Code</h4>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <code className="text-[#00F2EA] font-mono text-sm bg-black/20 px-2 py-1 rounded">
                    {secretKey}
                  </code>
                  <button
                    onClick={handleCopySecret}
                    className="btn-ghost p-2 text-xs"
                  >
                    <i className="uil uil-copy"></i>
                  </button>
                </div>
                <p className="text-white/60 text-xs mt-2">
                  Enter this code in your authenticator app
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleClose}
                className="btn-ghost flex-1 h-12"
              >
                Cancel
              </button>
              <button 
                onClick={() => setStep('verify')}
                className="btn-primary flex-1 h-12"
              >
                <i className="uil uil-arrow-right mr-2"></i>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] rounded-full flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
                <i className="uil uil-shield-check text-white text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Verify Setup</h3>
              <p className="text-white/60 text-sm">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="verificationCode" className="form-label text-sm font-medium">
                  Verification Code
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  className={`form-control text-center text-2xl font-mono tracking-widest ${error ? 'error' : ''}`}
                  placeholder="000000"
                  maxLength={6}
                />
                <div className="text-center text-xs text-white/60">
                  Enter the code from your authenticator app
                </div>
                {error && <div className="form-helper error text-center">{error}</div>}
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setStep('setup')}
                  className="btn-ghost flex-1 h-12"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className="btn-primary flex-1 h-12 relative overflow-hidden"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Verifying...
                    </div>
                  ) : (
                    <>
                      <i className="uil uil-check mr-2"></i>
                      Verify & Enable
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-6 py-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <i className="uil uil-check text-white text-2xl"></i>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Two-Factor Authentication Enabled!</h3>
              <p className="text-white/60">Your account is now more secure.</p>
            </div>
            
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-center gap-3 text-green-400 text-sm">
                <i className="uil uil-info-circle"></i>
                <span>Keep your backup codes safe in case you lose access to your device</span>
              </div>
            </div>
            
            <div className="text-sm text-white/40">
              You will be redirected shortly...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorModal;