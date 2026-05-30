import { useState, useRef } from 'react';

const AvatarEditModal = ({ isOpen, onClose, onSave, currentAvatar }) => {
  const [step, setStep] = useState('upload'); // 'upload', 'crop', 'preview'
  const [selectedFile, setSelectedFile] = useState(null);
  const [cropData, setCropData] = useState({ x: 0, y: 0, scale: 1, rotation: 0 });
  const [previewAvatar, setPreviewAvatar] = useState(currentAvatar);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewAvatar(e.target.result);
        setStep('crop');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCrop = (newCropData) => {
    setCropData(newCropData);
  };

  const handleSaveAvatar = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSave(previewAvatar);
    onClose();
    resetModal();
  };

  const handleRemoveAvatar = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    onSave(null);
    onClose();
    resetModal();
  };

  const resetModal = () => {
    setStep('upload');
    setSelectedFile(null);
    setCropData({ x: 0, y: 0, scale: 1, rotation: 0 });
    setPreviewAvatar(currentAvatar);
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      ></div>
      
      <div className="relative glass-card-glow rounded-2xl p-8 max-w-md w-full mx-4 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Update Avatar</h2>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <i className="uil uil-times text-white"></i>
          </button>
        </div>

        <div className="flex items-center justify-center mb-8">
          {['Upload', 'Crop', 'Preview'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === stepName.toLowerCase() 
                  ? 'bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] text-white' 
                  : 'bg-white/20 text-white/60'
              }`}>
                {index + 1}
              </div>
              <span className={`ml-2 text-sm ${
                step === stepName.toLowerCase() ? 'text-white' : 'text-white/60'
              }`}>
                {stepName}
              </span>
              {index < 2 && (
                <div className={`w-8 h-0.5 mx-4 ${
                  step === stepName.toLowerCase() ? 'bg-gradient-to-r from-[#BF40BF] to-[#00F2EA]' : 'bg-white/20'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {step === 'upload' && (
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] rounded-full flex items-center justify-center">
              {previewAvatar ? (
                <img 
                  src={previewAvatar} 
                  alt="Current avatar" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <i className="uil uil-user text-4xl text-white"></i>
              )}
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary w-full h-12"
              >
                <i className="uil uil-upload mr-2"></i>
                Choose New Photo
              </button>
              
              <button
                onClick={handleRemoveAvatar}
                className="btn-ghost w-full h-12 text-red-400 hover:bg-red-500/10"
              >
                <i className="uil uil-trash mr-2"></i>
                Remove Current Photo
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {step === 'crop' && (
          <div className="space-y-6">
            <div className="relative w-64 h-64 mx-auto bg-gray-800 rounded-lg overflow-hidden">
              <img 
                src={previewAvatar} 
                alt="Crop preview" 
                className="w-full h-full object-cover"
                style={{
                  transform: `scale(${cropData.scale}) rotate(${cropData.rotation}deg)`,
                  transformOrigin: 'center'
                }}
              />
              
              <div className="absolute inset-0 border-2 border-[#00F2EA] rounded-lg">
                <div className="absolute inset-4 border border-white/30 rounded"></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Zoom: {Math.round(cropData.scale * 100)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={cropData.scale}
                  onChange={(e) => handleCrop({ ...cropData, scale: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Rotation: {cropData.rotation}°
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="15"
                  value={cropData.rotation}
                  onChange={(e) => handleCrop({ ...cropData, rotation: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setStep('upload')}
                className="btn-ghost flex-1 h-12"
              >
                Back
              </button>
              <button 
                onClick={() => setStep('preview')}
                className="btn-primary flex-1 h-12"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto bg-gradient-to-r from-[#BF40BF] to-[#00F2EA] rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src={previewAvatar} 
                alt="Final avatar" 
                className="w-full h-full object-cover"
                style={{
                  transform: `scale(${cropData.scale}) rotate(${cropData.rotation}deg)`
                }}
              />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Preview</h3>
              <p className="text-white/60 text-sm">This is how your avatar will appear to others</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setStep('crop')}
                className="btn-ghost flex-1 h-12"
              >
                Edit Again
              </button>
              <button 
                onClick={handleSaveAvatar}
                className="btn-primary flex-1 h-12"
              >
                <div className="flex items-center justify-center gap-2">
                  <i className="uil uil-check"></i>
                  Save Avatar
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarEditModal;