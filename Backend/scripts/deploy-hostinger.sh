#!/bin/bash

# Hostinger VPS Deployment Script for Food Delivery System
# Run this script on your Hostinger VPS

set -e

echo "🚀 Starting Hostinger VPS Deployment for Food Delivery System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/food-delivery"
DOMAIN=""
EMAIL=""

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    print_error "Domain name is required!"
    exit 1
fi

# Get email for SSL certificate
read -p "Enter your email for SSL certificate: " EMAIL
if [ -z "$EMAIL" ]; then
    print_error "Email is required for SSL certificate!"
    exit 1
fi

print_status "Domain: $DOMAIN"
print_status "Email: $EMAIL"

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
print_status "Installing Node.js 18+..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
print_status "Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Nginx
print_status "Installing Nginx..."
sudo apt install nginx -y

# Install PM2
print_status "Installing PM2..."
sudo npm install -g pm2

# Install Git
print_status "Installing Git..."
sudo apt install git -y

# Install UFW Firewall
print_status "Configuring firewall..."
sudo apt install ufw -y
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # React App (optional)
sudo ufw --force enable

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Check if project files exist
if [ ! -f "$APP_DIR/Backend/package.json" ]; then
    print_warning "Project files not found in $APP_DIR"
    print_status "Please upload your project files to $APP_DIR first"
    print_status "You can use SCP, SFTP, or Git to upload your files"
    exit 1
fi

# Backend setup
print_status "Setting up backend..."
cd $APP_DIR/Backend

# Install dependencies
print_status "Installing backend dependencies..."
npm install --production

# Create production environment file
if [ ! -f ".env" ]; then
    print_status "Creating production environment file..."
    cp env.production.template .env
    
    # Update environment variables
    sed -i "s/CLIENT_URL=.*/CLIENT_URL=https:\/\/$DOMAIN/" .env
    sed -i "s/MOBILE_CLIENT_URL=.*/MOBILE_CLIENT_URL=https:\/\/$DOMAIN/" .env
    
    print_warning "Please edit $APP_DIR/Backend/.env file with your production values:"
    print_warning "- JWT_SECRET: Generate a strong secret key"
    print_warning "- MONGODB_URI: Update if using remote MongoDB"
    print_warning "- Email, payment, and other service configurations"
    read -p "Press Enter after updating the .env file..."
fi

# Start MongoDB
print_status "Starting MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Create SuperAdmin account
print_status "Creating SuperAdmin account..."
if [ -f "scripts/createSuperAdmin.js" ]; then
    node scripts/createSuperAdmin.js
else
    print_warning "SuperAdmin creation script not found. Please create manually."
fi

# Start backend with PM2
print_status "Starting backend with PM2..."
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Frontend setup
print_status "Setting up frontend..."
cd $APP_DIR/frontent

if [ -f "package.json" ]; then
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Build for production
    print_status "Building frontend for production..."
    npm run build
else
    print_warning "Frontend package.json not found. Skipping frontend build."
fi

# Create Nginx configuration
print_status "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/food-delivery > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend (React App)
    location / {
        root $APP_DIR/frontent/build;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # File uploads
    location /uploads/ {
        alias $APP_DIR/Backend/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable the site
print_status "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/food-delivery /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
print_status "Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Install Certbot for SSL
print_status "Installing Certbot for SSL certificate..."
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
print_status "Obtaining SSL certificate for $DOMAIN..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL

# Test auto-renewal
print_status "Testing SSL certificate auto-renewal..."
sudo certbot renew --dry-run

# Create backup directory
print_status "Creating backup directories..."
sudo mkdir -p /var/backups/mongodb /var/backups/app
sudo chown -R $USER:$USER /var/backups

# Create backup script
print_status "Creating backup script..."
sudo tee /usr/local/bin/backup-food-delivery.sh > /dev/null <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
mongodump --db food_delivery --out /var/backups/mongodb/food_delivery_$DATE

# Application backup
tar -czf /var/backups/app/food_delivery_$DATE.tar.gz /var/www/food-delivery

# Clean old backups (keep 7 days)
find /var/backups/mongodb -name "food_delivery_*" -mtime +7 -delete
find /var/backups/app -name "food_delivery_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

sudo chmod +x /usr/local/bin/backup-food-delivery.sh

# Add backup to crontab
print_status "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-food-delivery.sh") | crontab -

# Final status check
print_status "Checking deployment status..."
echo ""
echo "=== DEPLOYMENT STATUS ==="
echo "MongoDB: $(sudo systemctl is-active mongod)"
echo "Nginx: $(sudo systemctl is-active nginx)"
echo "Backend: $(pm2 list | grep food-delivery-backend | awk '{print $10}')"
echo ""

# Test endpoints
print_status "Testing application endpoints..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health | grep -q "200"; then
    print_status "✅ Backend health check: OK"
else
    print_warning "⚠️  Backend health check: FAILED"
fi

if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200"; then
    print_status "✅ Frontend: OK"
else
    print_warning "⚠️  Frontend: FAILED"
fi

echo ""
print_status "🎉 Deployment completed successfully!"
echo ""
echo "=== NEXT STEPS ==="
echo "1. Visit https://$DOMAIN to access your application"
echo "2. Check application logs: pm2 logs food-delivery-backend"
echo "3. Monitor system: pm2 monit"
echo "4. Update mobile app constants to use: https://$DOMAIN"
echo ""
echo "=== USEFUL COMMANDS ==="
echo "Restart backend: pm2 restart food-delivery-backend"
echo "View logs: pm2 logs food-delivery-backend"
echo "Monitor: pm2 monit"
echo "Check Nginx: sudo nginx -t"
echo "Reload Nginx: sudo systemctl reload nginx"
echo ""
echo "=== BACKUP ==="
echo "Manual backup: /usr/local/bin/backup-food-delivery.sh"
echo "Automated backups run daily at 2 AM"
echo ""
print_warning "Don't forget to:"
print_warning "1. Update your mobile app's server URL to https://$DOMAIN"
print_warning "2. Configure email and payment services in .env file"
print_warning "3. Set up monitoring and alerts"
