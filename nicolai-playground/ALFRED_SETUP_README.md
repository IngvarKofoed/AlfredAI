# Alfred AI Auto-Startup & Aliases Setup

This document explains the auto-startup configuration and aliases for Alfred AI.

## 🚀 What's Been Set Up

### 1. Backend Auto-Start on Boot
- **Service**: `alfred-backend.service` 
- **Location**: `/etc/systemd/system/alfred-backend.service`
- **Status**: ✅ Enabled and will start automatically on boot
- **Uses**: nodemon for development with auto-restart

### 2. Shell Aliases (Fish Shell)
All aliases are configured in `~/.config/fish/config.fish`

### 3. CLI Auto-Start (Optional)
The CLI can automatically start when you open a new terminal (disabled by default).

## 🎯 Available Commands

### Backend Service Management
```bash
# Service control (systemd)
sudo systemctl start alfred-backend     # Start the service
sudo systemctl stop alfred-backend      # Stop the service  
sudo systemctl restart alfred-backend   # Restart the service
sudo systemctl status alfred-backend    # Check service status
sudo systemctl disable alfred-backend   # Disable auto-start on boot
sudo systemctl enable alfred-backend    # Enable auto-start on boot

# View logs
sudo journalctl -u alfred-backend -f    # Follow service logs
```

### Convenient Aliases
```bash
# Backend
alfred-be           # Start backend in development mode
alfred-restart-be   # Restart backend service
alfred-stop-be      # Stop backend service
alfred-status-be    # Check backend service status  
alfred-logs-be      # View backend service logs

# CLI
alfred-cli          # Start CLI application
alfred-start-now    # Start CLI in current terminal

# Navigation
alfred-cd           # Navigate to Alfred AI directory

# CLI Auto-start Control
alfred-enable-autostart   # Enable CLI auto-start for new terminals
alfred-disable-autostart  # Disable CLI auto-start
```

## 🔧 Configuration Files

### Systemd Service
- **File**: `alfred-backend.service`
- **Installed**: `/etc/systemd/system/alfred-backend.service`
- **Purpose**: Auto-starts backend on boot using nodemon

### Fish Shell Config
- **File**: `~/.config/fish/config.fish`
- **Contains**: All aliases and auto-start functions

## 📋 How It Works

### Backend Auto-Start
1. The systemd service starts automatically on boot
2. It runs `npm run dev:backend` in the Alfred AI directory
3. nodemon watches for changes and restarts automatically
4. The service restarts if it crashes

### CLI Auto-Start
1. **Disabled by default** for normal terminal usage
2. When enabled, checks the `ALFRED_AUTO_START` variable
3. If true, automatically starts the CLI when opening a new terminal
4. Can be toggled on/off with the provided functions

## 🎮 Quick Start Guide

### First Time Setup
```bash
# 1. Install everything (already done)
./install-startup.sh

# 2. Setup Fish aliases (already done)  
./setup-fish-aliases.sh

# 3. Setup CLI auto-start (already done)
./setup-fish-autostart.sh
```

### Daily Usage
```bash
# Check if backend is running
alfred-status-be

# Start CLI manually
alfred-cli

# Enable CLI auto-start for new terminals
alfred-enable-autostart

# View backend logs
alfred-logs-be

# Restart backend if needed
alfred-restart-be
```

## 🔍 Troubleshooting

### Backend Not Starting
```bash
# Check service status
alfred-status-be

# View detailed logs
alfred-logs-be

# Manual restart
alfred-restart-be
```

### Aliases Not Working
```bash
# Reload Fish config
source ~/.config/fish/config.fish

# Or open a new terminal session
```

### CLI Auto-Start Issues
```bash
# Disable auto-start
alfred-disable-autostart

# Check current setting
echo $ALFRED_AUTO_START

# Manual start
alfred-start-now
```

## 📁 Project Structure
```
/home/Nicolai/code/AlfredAI/
├── backend/                 # Backend server
├── cli/                     # CLI application  
├── alfred-backend.service   # Systemd service file
├── install-startup.sh       # Main installation script
├── setup-fish-aliases.sh    # Fish aliases setup
└── setup-fish-autostart.sh # CLI auto-start setup
```

## 🎯 Current Status
- ✅ Backend auto-starts on boot
- ✅ Fish shell aliases configured
- ✅ CLI auto-start available (disabled by default)
- ✅ Service management commands ready
- ✅ All scripts executable and tested

Your Alfred AI is now fully configured for automatic startup and easy management! 🤖 