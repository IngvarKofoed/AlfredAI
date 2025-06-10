#!/bin/bash

# Setup script for Alfred AI aliases

echo "Setting up Alfred AI aliases..."

# Backup existing .bashrc if aliases already exist
if grep -q "Alfred AI aliases" ~/.bashrc; then
    echo "Alfred AI aliases already exist in ~/.bashrc"
    echo "Removing old aliases..."
    sed -i '/# Alfred AI aliases/,/# End Alfred AI aliases/d' ~/.bashrc
fi

# Add aliases to .bashrc
cat >> ~/.bashrc << 'EOF'

# Alfred AI aliases
alias alfred-be="cd /home/Nicolai/code/AlfredAI && npm run dev:backend"
alias alfred-cli="cd /home/Nicolai/code/AlfredAI && npm run dev:cli"
alias alfred-restart-be="sudo systemctl restart alfred-backend"
alias alfred-stop-be="sudo systemctl stop alfred-backend"
alias alfred-status-be="sudo systemctl status alfred-backend"
alias alfred-logs-be="sudo journalctl -u alfred-backend -f"
alias alfred-cd="cd /home/Nicolai/code/AlfredAI"
# End Alfred AI aliases

EOF

echo "Aliases added to ~/.bashrc"
echo ""
echo "Available aliases:"
echo "  alfred-be         - Start backend in development mode"
echo "  alfred-cli        - Start CLI application"
echo "  alfred-restart-be - Restart backend service"
echo "  alfred-stop-be    - Stop backend service"
echo "  alfred-status-be  - Check backend service status"
echo "  alfred-logs-be    - View backend service logs"
echo "  alfred-cd         - Navigate to Alfred AI directory"
echo ""
echo "To use these aliases immediately, run: source ~/.bashrc" 