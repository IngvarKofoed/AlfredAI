#!/bin/bash

# Alfred AI Auto-startup Installation Script

echo "🤖 Alfred AI Auto-startup Setup"
echo "================================="
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   echo "Please run as your regular user"
   exit 1
fi

# Check if we're in the correct directory
if [[ ! -f "package.json" ]] || [[ ! -d "backend" ]] || [[ ! -d "cli" ]]; then
    echo "❌ Please run this script from the Alfred AI root directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm run install:all

echo ""
echo "🔧 Setting up systemd service..."

# Copy service file to systemd directory
sudo cp alfred-backend.service /etc/systemd/system/

# Reload systemd and enable the service
sudo systemctl daemon-reload
sudo systemctl enable alfred-backend.service

echo ""
echo "🚀 Setting up shell aliases..."
chmod +x setup-aliases.sh
./setup-aliases.sh

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎯 Your Alfred AI backend will now start automatically on boot!"
echo ""
echo "📝 Available commands:"
echo "  sudo systemctl start alfred-backend    - Start the service now"
echo "  sudo systemctl stop alfred-backend     - Stop the service"
echo "  sudo systemctl status alfred-backend   - Check service status"
echo "  sudo systemctl disable alfred-backend  - Disable auto-start"
echo ""
echo "🔗 Available aliases (after running 'source ~/.bashrc'):"
echo "  alfred-be         - Start backend in development mode"
echo "  alfred-cli        - Start CLI application"
echo "  alfred-restart-be - Restart backend service"
echo "  alfred-stop-be    - Stop backend service"
echo "  alfred-status-be  - Check backend service status"
echo "  alfred-logs-be    - View backend service logs"
echo "  alfred-cd         - Navigate to Alfred AI directory"
echo ""
echo "🏁 To start the service now, run:"
echo "     sudo systemctl start alfred-backend"
echo ""
echo "💡 To reload your shell aliases, run:"
echo "     source ~/.bashrc" 