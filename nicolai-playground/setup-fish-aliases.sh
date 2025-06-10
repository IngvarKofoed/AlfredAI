#!/bin/bash

# Setup script for Alfred AI aliases for Fish shell

echo "Setting up Alfred AI aliases for Fish shell..."

# Create fish config directory if it doesn't exist
mkdir -p ~/.config/fish

# Check if config.fish exists, create if not
if [[ ! -f ~/.config/fish/config.fish ]]; then
    touch ~/.config/fish/config.fish
fi

# Remove existing Alfred AI aliases if they exist
if grep -q "Alfred AI aliases" ~/.config/fish/config.fish; then
    echo "Removing existing Alfred AI aliases..."
    sed -i '/# Alfred AI aliases/,/# End Alfred AI aliases/d' ~/.config/fish/config.fish
fi

# Add Fish-compatible aliases
cat >> ~/.config/fish/config.fish << 'EOF'

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

echo "Fish aliases added to ~/.config/fish/config.fish"
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
echo "Aliases will be available in new Fish shell sessions or run: source ~/.config/fish/config.fish" 