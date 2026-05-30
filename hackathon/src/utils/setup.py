"""
Setup script for HackaAIverse 2024
This script helps you configure the system and get started quickly
"""

import os
import sys
from config import Config

def check_requirements():
    """Check if all requirements are installed"""
    print("🔍 Checking requirements...")
    
    required_packages = [
        'streamlit', 'groq', 'python-dotenv', 'pandas', 'plotly'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package}")
    
    if missing_packages:
        print(f"\n⚠️ Missing packages: {', '.join(missing_packages)}")
        print("Please install them with: pip install -r requirements.txt")
        return False
    
    print("✅ All required packages are installed!")
    return True

def check_configuration():
    """Check configuration status"""
    print("\n🔧 Checking configuration...")
    
    validation = Config.validate_config()
    
    for key, status in validation.items():
        status_icon = "✅" if status else "❌"
        print(f"{status_icon} {key.replace('_', ' ').title()}")
    
    if not validation['groq_api_key']:
        print("\n⚠️ GROQ_API_KEY not found in .env file")
        print("Please add your Groq API key to the .env file:")
        print("GROQ_API_KEY=your_groq_api_key_here")
        return False
    
    print("✅ Configuration looks good!")
    return True

def setup_demo_data():
    """Ask user if they want to set up demo data"""
    print("\n🎯 Demo Data Setup")
    
    response = input("Would you like to initialize demo data? (y/n): ").lower().strip()
    
    if response in ['y', 'yes']:
        try:
            from initialize_demo_data import initialize_demo_data
            initialize_demo_data()
            print("✅ Demo data initialized successfully!")
            return True
        except Exception as e:
            print(f"❌ Failed to initialize demo data: {e}")
            return False
    else:
        print("⏭️ Skipping demo data initialization")
        return True

def main():
    """Main setup function"""
    print("🚀 HackaAIverse 2024 Setup")
    print("=" * 50)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Check configuration
    if not check_configuration():
        print("\n📝 Please update your .env file with the required configuration")
        print("Current .env file location:", os.path.abspath('.env'))
        sys.exit(1)
    
    # Setup demo data
    setup_demo_data()
    
    print("\n🎉 Setup Complete!")
    print("=" * 50)
    print("🚀 To start the application, run:")
    print("   streamlit run project.py")
    print("\n📚 For more information, check:")
    print("   - README.md for detailed documentation")
    print("   - demo_script.md for demo instructions")
    print("   - hackathon_design_document.md for event details")
    
    # Ask if user wants to start the app
    start_app = input("\nWould you like to start the application now? (y/n): ").lower().strip()
    
    if start_app in ['y', 'yes']:
        print("\n🚀 Starting HackaAIverse...")
        os.system("streamlit run project.py")

if __name__ == "__main__":
    main()
