#!/bin/bash

# ============================================
# Food Delivery Backend - Auto Deployment Script
# ============================================
# This script helps you deploy the backend to your VPS
# Run this on your VPS after uploading files

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="food-delivery-backend"
APP_DIR="/var/www/food-delivery"
NODE_VERSION="18.x"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Banner
echo "=================================================="
echo "Food Delivery Backend - Deployment Script"
echo "=================================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

# Step 1: Update system
print_status "Updating system packages..."
apt update -y
apt upgrade -y
print_success "System updated"

# Step 2: Install essential packages
print_status "Installing essential packages..."
apt install -y curl wget git build-essential ufw
print_success "Essential packages installed"

# Step 3: Install Node.js
if ! command_exists node; then
    print_status "Installing Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION} | bash -
    apt install -y nodejs
    print_success "Node.js $(node --version) installed"
else
    print_success "Node.js $(node --version) already installed"
fi

# Step 4: Install PM2
if ! command_exists pm2; then
    print_status "Installing PM2..."
    npm install -g pm2
    print_success "PM2 installed"
else
    print_success "PM2 already installed"
fi

# Step 5: Install Nginx
if ! command_exists nginx; then
    print_status "Installing Nginx..."
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    print_success "Nginx installed and started"
else
    print_success "Nginx already installed"
fi

# Step 6: Configure firewall
print_status "Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5000/tcp
print_success "Firewall configured"

# Step 7: Create application directory
print_status "Creating application directory..."
mkdir -p $APP_DIR
print_success "Directory created: $APP_DIR"

# Step 8: Create non-root user (optional)
read -p "Do you want to create a non-root user? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Creating non-root user..."
    read -p "Enter username: " username
    adduser $username
    usermod -aG sudo $username
    chown -R $username:$username $APP_DIR
    print_success "User $username created"
    print_warning "Please switch to $username user before continuing:"
    print_warning "su - $username"
    exit 0
fi

# Step 9: Navigate to app directory
cd $APP_DIR

# Step 10: Check if files are uploaded
if [ ! -f "package.json" ]; then
    print_error "package.json not found in $APP_DIR"
    print_error "Please upload your backend files first"
    exit 1
fi

# Step 11: Install dependencies
print_status "Installing dependencies..."
npm install --production --legacy-peer-deps
print_success "Dependencies installed"

# Step 12: Setup environment file
if [ ! -f ".env" ]; then
    print_warning ".env file not found"
    
    # Check for .env.example
    if [ -f ".env.example" ]; then
        print_status "Creating .env from .env.example..."
        cp .env.example .env
        chmod 600 .env
        print_success ".env file created"
        print_warning "Please edit .env file with your configuration:"
        print_warning "nano .env"
        exit 0
    else
        print_error ".env.example not found"
        exit 1
    fi
else
    print_success ".env file exists"
fi

# Step 13: Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs uploads
chmod 775 logs uploads
print_success "Directories created"

# Step 14: Configure Nginx
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/$APP_NAME << 'EOF'
upstream food_delivery_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name 72.60.206.253;

    client_max_body_size 20M;

    location / {
        proxy_pass http://food_delivery_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://food_delivery_backend;
        access_log off;
    }

    access_log /var/log/nginx/food-delivery-access.log;
    error_log /var/log/nginx/food-delivery-error.log;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
if nginx -t; then
    systemctl reload nginx
    print_success "Nginx configured"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Step 15: Start application with PM2
print_status "Starting application with PM2..."
pm2 delete $APP_NAME 2>/dev/null || true

# Check if ecosystem.config.js exists
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --env production
else
    pm2 start server.js --name $APP_NAME --env production
fi

pm2 save
pm2 startup

print_success "Application started"

# Step 16: Final checks
print_status "Running final checks..."
sleep 3

# Check PM2 status
if pm2 list | grep -q $APP_NAME; then
    print_success "PM2: Application running"
else
    print_error "PM2: Application not running"
fi

# Check Nginx status
if systemctl is-active --quiet nginx; then
    print_success "Nginx: Running"
else
    print_error "Nginx: Not running"
fi

# Test health endpoint
sleep 2
if curl -s http://localhost:5000/health > /dev/null; then
    print_success "Health check: OK"
else
    print_warning "Health check: Failed (might need manual check)"
fi

# Display status
echo ""
echo "=================================================="
print_success "Deployment completed!"
echo "=================================================="
echo ""
echo "Application Status:"
pm2 list
echo ""
echo "Useful Commands:"
echo "  pm2 status              - Check application status"
echo "  pm2 logs $APP_NAME    - View logs"
echo "  pm2 restart $APP_NAME - Restart application"
echo "  pm2 monit               - Monitor resources"
echo ""
echo "Access your API:"
echo "  http://72.60.206.253"
echo "  http://72.60.206.253/health"
echo "  http://72.60.206.253/api/v1/address/provinces"
echo ""
print_warning "Next steps:"
echo "  1. Configure .env file with your credentials"
echo "  2. Test all API endpoints"
echo "  3. Setup SSL certificate (if you have domain)"
echo "  4. Create admin account using scripts"
echo ""
print_warning "View logs: pm2 logs $APP_NAME"
echo ""

