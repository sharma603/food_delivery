#!/bin/bash

# Script to setup PM2 for Food Delivery Backend
# This ensures the backend runs continuously and starts on boot

echo "=========================================="
echo "Setting up PM2 for Food Delivery Backend"
echo "=========================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$BACKEND_DIR"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Installing PM2..."
    npm install -g pm2
    echo "✅ PM2 installed successfully"
else
    echo "✅ PM2 is already installed"
    pm2 --version
fi

echo ""
echo "Creating logs directory if it doesn't exist..."
mkdir -p logs

echo ""
echo "Stopping existing PM2 process if running..."
pm2 stop food-delivery-backend 2>/dev/null || true
pm2 delete food-delivery-backend 2>/dev/null || true

echo ""
echo "Starting backend with PM2..."
pm2 start ecosystem.config.js

echo ""
echo "Waiting for PM2 to start..."
sleep 3

echo ""
echo "Current PM2 status:"
pm2 status

echo ""
echo "Saving PM2 process list..."
pm2 save

echo ""
echo "Setting up PM2 to start on system boot..."
pm2 startup

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Useful PM2 commands:"
echo "  pm2 status              - Check backend status"
echo "  pm2 logs food-delivery-backend - View logs"
echo "  pm2 restart food-delivery-backend - Restart backend"
echo "  pm2 stop food-delivery-backend - Stop backend"
echo "  pm2 monit              - Monitor backend in real-time"
echo ""
echo "Your backend is now running and will start automatically on reboot!"
echo ""

