#!/bin/bash

# Setup script for Alfred AI CLI auto-start in Fish shell

echo "Setting up Alfred AI CLI auto-start for Fish shell..."

# Create fish config directory if it doesn't exist
mkdir -p ~/.config/fish

# Check if config.fish exists, create if not
if [[ ! -f ~/.config/fish/config.fish ]]; then
    touch ~/.config/fish/config.fish
fi

# Remove existing Alfred AI auto-start if it exists
if grep -q "Alfred AI auto-start" ~/.config/fish/config.fish; then
    echo "Removing existing Alfred AI auto-start configuration..."
    sed -i '/# Alfred AI auto-start/,/# End Alfred AI auto-start/d' ~/.config/fish/config.fish
fi

# Add Fish auto-start configuration
cat >> ~/.config/fish/config.fish << 'EOF'

# Alfred AI auto-start
# Set this to 'true' to automatically start Alfred CLI when opening terminal
set -g ALFRED_AUTO_START false

# Auto-start function
function alfred_auto_start
    if test "$ALFRED_AUTO_START" = "true"
        echo "🤖 Starting Alfred AI CLI..."
        cd /home/Nicolai/code/AlfredAI
        npm run dev:cli
    end
end

# Uncomment the line below to enable auto-start
# alfred_auto_start

# Convenience functions to enable/disable auto-start
function alfred-enable-autostart
    set -U ALFRED_AUTO_START true
    echo "✅ Alfred CLI auto-start enabled for new terminals"
    echo "💡 Run 'alfred-disable-autostart' to disable"
end

function alfred-disable-autostart
    set -U ALFRED_AUTO_START false
    echo "❌ Alfred CLI auto-start disabled"
    echo "💡 Run 'alfred-enable-autostart' to re-enable"
end

function alfred-start-now
    echo "🤖 Starting Alfred AI CLI now..."
    cd /home/Nicolai/code/AlfredAI
    npm run dev:cli
end
# End Alfred AI auto-start

EOF

echo "Fish auto-start configuration added to ~/.config/fish/config.fish"
echo ""
echo "🎯 New functions available:"
echo "  alfred-enable-autostart   - Enable CLI auto-start for new terminals"
echo "  alfred-disable-autostart  - Disable CLI auto-start"
echo "  alfred-start-now          - Start Alfred CLI in current terminal"
echo ""
echo "💡 To enable auto-start, run: alfred-enable-autostart"
echo "🔄 Configuration will be available in new Fish shell sessions" 