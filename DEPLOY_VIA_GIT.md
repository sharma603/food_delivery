# 🚀 Deploy via Git - Step by Step Guide

Complete guide to deploy your Food Delivery Backend using Git on VPS server **72.60.206.253**.

---

## 🎯 Prerequisites

Before starting, ensure you have:

- [ ] Git repository with your backend code (GitHub/GitLab/Bitbucket)
- [ ] VPS server access: root@72.60.206.253
- [ ] SSH access to your Git repository
- [ ] All environment variables ready

---

## 📍 Option 1: GitHub (Recommended)

### Step 1: Push Your Backend to GitHub

**On your local machine:**

```powershell
# Navigate to Backend folder
cd "G:\NodeJS_Projects\Food Delevring System\Backend"

# Initialize Git repository (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Production ready"

# Add GitHub remote (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/food-delivery-backend.git

# Push to GitHub
git push -u origin main
```

**Make sure .env is NOT committed:**
```bash
# Check .gitignore includes .env
cat .gitignore

# Should include:
# .env
# .env.production
# .env.local
```

---

## 🖥️ Step 2: Connect to VPS and Initial Setup

```bash
# Connect to your VPS
ssh root@72.60.206.253

# Update system
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git build-essential ufw

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx

# Setup firewall
ufw allow 22,80,443,5000/tcp
ufw enable

# Install MongoDB (if using local MongoDB)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org

# Start MongoDB
systemctl start mongod
systemctl enable mongod

# Verify MongoDB is running
systemctl status mongod

# Secure MongoDB (Important!)
# MongoDB comes with default no-auth, configure if needed
# For production: Setup authentication
```

**Configure MongoDB Security (Optional but Recommended):**

```bash
# Connect to MongoDB
mongosh

# Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "YOUR_SECURE_PASSWORD",
  roles: [{ role: "root", db: "admin" }]
})

# Exit MongoDB shell
exit

# Enable authentication
nano /etc/mongod.conf

# Add/edit these lines:
# security:
#   authorization: enabled

# Restart MongoDB
systemctl restart mongod

# Now connect with authentication
mongosh -u admin -p YOUR_SECURE_PASSWORD --authenticationDatabase admin
```

---

## 📥 Step 3: Clone Your Repository

```bash
# Create application directory
mkdir -p /var/www
cd /var/www

# Clone your repository
git clone https://github.com/YOUR_USERNAME/food-delivery-backend.git food-delivery

# Or if using SSH
git clone git@github.com:YOUR_USERNAME/food-delivery-backend.git food-delivery

# Navigate to project
cd food-delivery

# Verify files
ls -la
```

---

## 🔐 Step 4: Configure Environment Variables

```bash
# Create .env file from template
cp .env.example .env

# Edit .env file
nano .env
```

**Add your configuration:**

```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================
NODE_ENV=production
PORT=5000

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
# Local MongoDB (on VPS) - No Authentication
MONGODB_URI=mongodb://localhost:27017/food_delivery

# Local MongoDB with Authentication
# MONGODB_URI=mongodb://admin:YOUR_PASSWORD@localhost:27017/food_delivery?authSource=admin

# OR MongoDB Atlas (cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/food_delivery?retryWrites=true&w=majority

# ===========================================
# JWT CONFIGURATION
# ===========================================
JWT_SECRET=GENERATE_RANDOM_64_CHAR_STRING_HERE
JWT_EXPIRE=30d
JWT_REFRESH_EXPIRE=7d

# ===========================================
# CLIENT CONFIGURATION
# ===========================================
CLIENT_URL=http://72.60.206.253

# ===========================================
# EMAIL CONFIGURATION
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_NAME=Food Delivery System
FROM_EMAIL=your-email@gmail.com

# ===========================================
# CLOUDINARY CONFIGURATION
# ===========================================
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ===========================================
# PAYMENT GATEWAYS
# ===========================================
STRIPE_PUBLIC_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Save:** `Ctrl+X`, then `Y`, then `Enter`

**Secure the file:**
```bash
chmod 600 .env
```

---

## 📦 Step 5: Install Dependencies

```bash
# Install production dependencies
npm install --production --legacy-peer-deps

# If installation fails, try without --legacy-peer-deps
npm install --production
```

---

## 🗂️ Step 6: Create Necessary Directories

```bash
# Create logs and uploads directories
mkdir -p logs uploads

# Set permissions
chmod 775 logs uploads

# Create any other required directories
mkdir -p public
```

---

## 🌐 Step 7: Configure Nginx

```bash
# Create Nginx configuration
cat > /etc/nginx/sites-available/food-delivery << 'EOF'
upstream food_delivery_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name 72.60.206.253;

    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

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
ln -sf /etc/nginx/sites-available/food-delivery /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Check status
systemctl status nginx
```

---

## 🚀 Step 8: Start Application with PM2

```bash
# Navigate to project directory
cd /var/www/food-delivery

# Start application with PM2
pm2 start ecosystem.config.js --env production

# Or start directly
pm2 start server.js --name food-delivery-backend --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup

# This will show a command like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
# Copy and run that command
```

**Example output:**
```
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

**Run the generated command, then:**
```bash
# Save again
pm2 save
```

---

## ✅ Step 9: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Should show application as "online"

# View logs
pm2 logs food-delivery-backend

# Check recent logs
pm2 logs --lines 50

# Test health endpoint
curl http://72.60.206.253/health

# Should return JSON with status

# Test API endpoint
curl http://72.60.206.253/api/v1/address/provinces
```

---

## 🔄 Step 10: Setup Auto-Deploy Script

Create a script to easily update your application:

```bash
# Create deploy script
cat > /var/www/food-delivery/deploy.sh << 'EOF'
#!/bin/bash
set -e

cd /var/www/food-delivery

echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production --legacy-peer-deps

# Restart application
echo "🔄 Restarting application..."
pm2 restart food-delivery-backend

# Show logs
echo "📋 Recent logs:"
pm2 logs food-delivery-backend --lines 20

echo "✅ Deployment complete!"
EOF

# Make executable
chmod +x /var/www/food-delivery/deploy.sh
```

**Use it:**
```bash
cd /var/www/food-delivery
./deploy.sh
```

---

## 🎯 Post-Deployment Tasks

### 1. Create Super Admin Account

```bash
cd /var/www/food-delivery/scripts
node createSuperAdmin.js
```

Follow the prompts to create your admin account.

### 2. Test All Endpoints

```bash
# Health check
curl http://72.60.206.253/health

# API documentation
curl http://72.60.206.253/api/docs

# Address API
curl http://72.60.206.253/api/v1/address/provinces
```

### 3. Monitor Application

```bash
# Real-time monitoring
pm2 monit

# Check logs
pm2 logs food-delivery-backend

# Check system resources
free -h
df -h
```

---

## 🔄 Updating Your Application

When you make changes to your code:

### Option 1: Manual Update

```bash
# On your VPS
cd /var/www/food-delivery
git pull origin main
npm install --production --legacy-peer-deps
pm2 restart food-delivery-backend
pm2 logs --lines 50
```

### Option 2: Using Deploy Script

```bash
cd /var/www/food-delivery
./deploy.sh
```

### Option 3: Automated with Webhooks (Advanced)

Setup GitHub webhooks to auto-deploy on push.

---

## 🔐 Security Best Practices

### 1. Secure .env File

```bash
# Already done, but verify
chmod 600 /var/www/food-delivery/.env

# Check .gitignore
cat .gitignore | grep ".env"
```

### 2. SSH Key Authentication

Instead of using password, use SSH keys:

```bash
# On your local machine
ssh-keygen -t ed25519 -C "your-email@gmail.com"

# Copy public key to VPS
ssh-copy-id root@72.60.206.253

# Or manually
cat ~/.ssh/id_ed25519.pub
# Copy the output

# On VPS
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the public key
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 3. Configure Git Credentials

```bash
# On VPS
git config --global user.name "Your Name"
git config --global user.email "your-email@gmail.com"

# For private repositories, setup SSH
ssh-keygen -t ed25519
cat ~/.ssh/id_ed25519.pub
# Add to GitHub Settings → SSH Keys
```

### 4. Setup SSL (If you have domain)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is set up automatically
certbot renew --dry-run
```

---

## 🐛 Troubleshooting

### Issue: Git Clone Fails

**Private Repository:**
```bash
# Use SSH instead of HTTPS
git clone git@github.com:USERNAME/REPO.git food-delivery

# Or setup GitHub token
git clone https://USERNAME:TOKEN@github.com/USERNAME/REPO.git food-delivery
```

### Issue: MongoDB Connection Error

```bash
# Check if MongoDB is running
systemctl status mongod

# Start MongoDB if not running
systemctl start mongod

# Connect to MongoDB
mongosh

# Or with authentication
mongosh -u admin -p YOUR_PASSWORD --authenticationDatabase admin

# Test connection from Node.js
cd /var/www/food-delivery
node -e "require('mongoose').connect('mongodb://localhost:27017/food_delivery').then(() => console.log('✅ Connected')).catch(e => console.log('❌', e.message))"

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
systemctl restart mongod
```

### Issue: Application Won't Start

```bash
# Check logs
pm2 logs food-delivery-backend --lines 100

# Check .env file
cat .env

# Test manual start
cd /var/www/food-delivery
node server.js
```

### Issue: Nginx 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Test backend directly
curl http://localhost:5000/health

# Check Nginx logs
tail -f /var/log/nginx/food-delivery-error.log
```

### Issue: Permission Denied

```bash
cd /var/www/food-delivery
chown -R $USER:$USER .
chmod -R 755 .
chmod -R 775 logs uploads
```

---

## 📋 Quick Reference Commands

```bash
# Git operations
git pull origin main                    # Update code
git status                              # Check status
git log --oneline                       # View commit history

# Application management
pm2 status                              # Check status
pm2 logs food-delivery-backend         # View logs
pm2 restart food-delivery-backend      # Restart
pm2 reload food-delivery-backend       # Zero-downtime reload
pm2 stop food-delivery-backend         # Stop
pm2 monit                              # Monitor

# MongoDB management
systemctl status mongod               # Status
systemctl start mongod                # Start
systemctl restart mongod              # Restart
mongosh                               # Connect to MongoDB shell
mongod --version                      # Check version
tail -f /var/log/mongodb/mongod.log   # View logs

# Nginx management
systemctl status nginx                 # Status
systemctl restart nginx                # Restart
nginx -t                               # Test config
tail -f /var/log/nginx/food-delivery-access.log

# System
free -h                                # Memory
df -h                                  # Disk
top                                    # Processes

# Quick deploy
cd /var/www/food-delivery && ./deploy.sh
```

---

## 🎉 Success Checklist

Your Git-based deployment is successful when:

✅ Code pushed to GitHub/GitLab  
✅ MongoDB installed and running  
✅ Repository cloned on VPS  
✅ .env configured correctly  
✅ Dependencies installed  
✅ PM2 running application  
✅ Nginx configured and running  
✅ Health check responding  
✅ All API endpoints working  
✅ MongoDB connected  
✅ Logs show no errors  

---

## 🚀 Next Steps

After successful deployment:

1. ✅ Create super admin account
2. ✅ Test all API endpoints
3. ✅ Configure frontend
4. ✅ Setup SSL certificate
5. ✅ Configure backups
6. ✅ Setup monitoring
7. ✅ Go live! 🎉

---

## 📝 Git Workflow Summary

```
Local Development:
├── Make changes to code
├── Test locally
├── Commit changes
└── Push to GitHub

VPS Deployment:
├── SSH to VPS
├── cd /var/www/food-delivery
├── git pull origin main
├── npm install --production
├── pm2 restart food-delivery-backend
└── pm2 logs (verify)

Or use deploy.sh:
./deploy.sh
```

---

## 🎓 Advanced: Branch-Based Deployment

For production/staging environments:

```bash
# On VPS, clone specific branch
git clone -b production https://github.com/USERNAME/REPO.git food-delivery-prod

# Or switch branches
cd /var/www/food-delivery
git checkout production
git pull origin production
pm2 restart food-delivery-backend
```

---

**Your application is now deployed via Git! 🎉**

For issues, check the troubleshooting section or refer to **DEPLOYMENT_GUIDE.md**

