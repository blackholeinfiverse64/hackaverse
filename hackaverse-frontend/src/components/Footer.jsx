import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="relative z-10 bg-deep-navy/50 border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-display font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
              HackaVerse
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              A Universe of Builders. AI-driven hackathons connecting creators across campuses.
            </p>
            <div className="flex gap-3">
              <a
                href="https://discord.gg/hackaverse"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-purple-500 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Discord"
              >
                <i className="uil uil-discord text-xl text-white"></i>
              </a>
              <a
                href="https://github.com/hackaverse"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-purple-500 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="GitHub"
              >
                <i className="uil uil-github text-xl text-white"></i>
              </a>
              <a
                href="https://linkedin.com/company/hackaverse"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-purple-500 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <i className="uil uil-linkedin text-xl text-white"></i>
              </a>
              <a
                href="https://twitter.com/hackaverse"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-purple-500 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <i className="uil uil-twitter text-xl text-white"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Individual Signup
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Team Registration
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/results" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Tutorials
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Code of Conduct
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} HackaVerse. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm">
            Powered by <span className="text-cyan-400">BHIV</span> & <span className="text-purple-400">Uni-Guru</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
