import { useState, useEffect } from 'react';

const SkillsModal = ({ isOpen, onClose, skills, onSave }) => {
  const [selectedSkills, setSelectedSkills] = useState([...skills]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const availableSkills = [
    'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js', 'Python',
    'Java', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'Ruby',
    'HTML', 'CSS', 'Sass', 'Tailwind CSS', 'Bootstrap',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQLite',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
    'Git', 'GitHub', 'GitLab', 'Bitbucket',
    'Machine Learning', 'AI', 'Deep Learning', 'Data Science', 'Analytics',
    'Blockchain', 'Web3', 'Smart Contracts', 'DeFi',
    'Mobile Development', 'React Native', 'Flutter', 'iOS', 'Android',
    'Game Development', 'Unity', 'Unreal Engine', 'Godot',
    'UI/UX Design', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator',
    'DevOps', 'CI/CD', 'Jenkins', 'Terraform', 'Ansible',
    'Testing', 'Jest', 'Cypress', 'Selenium', 'Unit Testing',
    'GraphQL', 'REST APIs', 'WebSockets', 'Microservices',
    'Security', 'Penetration Testing', 'Ethical Hacking',
    'Project Management', 'Agile', 'Scrum', 'Kanban'
  ];

  const filteredSkills = availableSkills.filter(skill => 
    skill.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedSkills.includes(skill)
  );

  useEffect(() => {
    setSelectedSkills([...skills]);
  }, [skills, isOpen]);

  const handleSkillToggle = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills([...selectedSkills, customSkill.trim()]);
      setCustomSkill('');
      setShowCustomInput(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    onSave(selectedSkills);
    setIsLoading(false);
    onClose();
  };

  const handleClose = () => {
    setSelectedSkills([...skills]);
    setSearchTerm('');
    setCustomSkill('');
    setShowCustomInput(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      ></div>
      
      <div className="relative glass-card-glow rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Manage Skills</h2>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <i className="uil uil-times text-white"></i>
          </button>
        </div>

        <div className="flex flex-col h-full">
          {/* Search Section */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">
                <i className="uil uil-search text-lg"></i>
              </div>
              <input
                type="text"
                placeholder="Search skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control pl-12 w-full"
              />
            </div>
          </div>

          {/* Selected Skills */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Selected Skills ({selectedSkills.length})
            </h3>
            <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-white/5 rounded-xl border border-white/10">
              {selectedSkills.length === 0 ? (
                <p className="text-white/60 text-sm">No skills selected yet</p>
              ) : (
                selectedSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-2 bg-gradient-to-r from-[#BF40BF]/20 to-[#00F2EA]/20 text-[#00F2EA] rounded-full text-sm font-medium border border-[#00F2EA]/30 hover:border-[#00F2EA] hover:scale-105 transition-all cursor-default group"
                  >
                    {skill}
                    <button
                      onClick={() => handleSkillToggle(skill)}
                      className="ml-2 text-[#00F2EA]/60 hover:text-[#00F2EA] transition-colors"
                    >
                      <i className="uil uil-times text-xs"></i>
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Available Skills */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Available Skills</h3>
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="btn-ghost text-sm px-3 py-1"
              >
                <i className="uil uil-plus mr-1"></i>
                Add Custom
              </button>
            </div>

            {/* Custom Skill Input */}
            {showCustomInput && (
              <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter custom skill..."
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    className="form-control flex-1 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSkill()}
                  />
                  <button
                    onClick={handleAddCustomSkill}
                    disabled={!customSkill.trim()}
                    className="btn-primary px-4 h-10"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Skills List */}
            <div className="h-64 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-2">
                {filteredSkills.map((skill, index) => (
                  <button
                    key={index}
                    onClick={() => handleSkillToggle(skill)}
                    className={`p-3 rounded-lg text-left transition-all text-sm ${
                      selectedSkills.includes(skill)
                        ? 'bg-gradient-to-r from-[#BF40BF]/20 to-[#00F2EA]/20 border border-[#00F2EA]/30 text-[#00F2EA]'
                        : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{skill}</span>
                      {selectedSkills.includes(skill) && (
                        <i className="uil uil-check text-[#00F2EA]"></i>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              {filteredSkills.length === 0 && (
                <div className="text-center py-8">
                  <i className="uil uil-search text-4xl text-white/40 mb-2"></i>
                  <p className="text-white/60">
                    {searchTerm ? 'No skills found matching your search' : 'No more skills available'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
            <button 
              onClick={handleClose}
              className="btn-ghost flex-1 h-12"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isLoading}
              className="btn-primary flex-1 h-12 relative overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                <>
                  <i className="uil uil-check mr-2"></i>
                  Save Skills ({selectedSkills.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsModal;