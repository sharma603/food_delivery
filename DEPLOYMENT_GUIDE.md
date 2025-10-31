# 🚀 VPS Deployment Guide for Food Delivery Backend

Complete step-by-step guide to deploy your Food Delivery Backend on VPS Server (72.60.206.253)

---

## 📋 Prerequisites

- **VPS Server**: Ubuntu 20.04 LTS or higher
- **SSH Access**: Your VPS credentials
- **Domain Name** (Optional): For SSL certificate
- **MongoDB Atlas Account**: Cloud database (Recommended)
- **Node.js**: Version 18.x or higher
- **PM2**: Process manager

---

## 🎯 Step 1: Initial VPS Setup

### 1.1 Connect to Your VPS

```bash
ssh root@72.60.206.253
```

**If using password:**
```bash
ssh root@72.60.206.253
# Enter your password when prompted
```

**If using SSH key:**
```bash
ssh -i /path/to/your/private-key root@72.60.206.253
```

### 1.2 Update System Packages

```bash
# Update package list
apt update

# Upgrade installed packages
apt upgrade -y

# Install essential tools
apt install -y curl wget git build-essential
```

### 1.3 Create Non-Root User (Recommended for Security)

```bash
# Create new user
adduser deployer

# Add to sudo group
usermod -aG sudo deployer

# Switch to new user
su - deployer
```

---

## 🟢 Step 2: Install Node.js

### 2.1 Install Node.js 18.x

```bash
# Install Node.js 18.x using NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### 2.2 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Verify PM2 installation
pm2 --version
```

---

## 🍃 Step 3: Install MongoDB

### Option A: MongoDB Atlas (Cloud - Recommended)

1. **Create Account**: Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Create Cluster**: Choose free M0 tier
3. **Network Access**: Add IP `72.60.206.253` to whitelist (or use `0.0.0.0/0` for all IPs)
4. **Database User**: Create admin user
5. **Get Connection String**: Copy MongoDB URI

**Example MongoDB URI:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/food_delivery?retryWrites=true&w=majority
```

### Option B: Install MongoDB on VPS

```bash
# Import public key
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update packages
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify installation
sudo systemctl status mongod
```

---

## 🔧 Step 4: Install Nginx (Web Server & Reverse Proxy)

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
sudo systemctl status nginx

# Open firewall for HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## 📦 Step 5: Deploy Backend Application

### 5.1 Create Application Directory

```bash
# Create directory for your application
sudo mkdir -p /var/www/food-delivery
sudo chown deployer:deployer /var/www/food-delivery

# Navigate to directory
cd /var/www/food-delivery
```

### 5.2 Upload Your Backend Files

**Option A: Using Git (Recommended if your code is in repository)**

```bash
# Clone your repository
git clone https://github.com/yourusername/food-delivery-backend.git .

# Or if you have a private repository
git clone https://username:token@github.com/yourusername/food-delivery-backend.git .
```

**Option B: Using SCP (From Your Local Machine)**

On your **local machine**, run:

```bash
# Navigate to your backend folder
cd "/mnt/g/NodeJS_Projects/Food Delevring System/Backend"

# Upload files to server
scp -r * root@72.60.206.253:/var/www/food-delivery/

# Or if using non-root user
scp -r * deployer@72.60.206.253:/var/www/food-delivery/
```

**Option C: Using SFTP**

```bash
# Connect via SFTP
sftp root@72.60.206.253

# Navigate to target directory
cd /var/www/food-delivery

# Upload files
put -r ./*

# Exit SFTP
exit
```

### 5.3 Install Dependencies

```bash
# Navigate to application directory
cd /var/www/food-delivery

# Install production dependencies
npm install --production

# If installation fails, try with legacy peer deps
npm install --legacy-peer-deps
```

### 5.4 Create Environment Configuration

```bash
# Create .env file
nano .env
```

**Add the following configuration:**

```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================
NODE_ENV=production
PORT=5000

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/food_delivery?retryWrites=true&w=majority
REDIS_URL=redis://localhost:6379

# ===========================================
# JWT CONFIGURATION
# ===========================================
JWT_SECRET=your-super-secure-random-secret-key-change-this-immediately
JWT_EXPIRE=30d
JWT_REFRESH_EXPIRE=7d

# ===========================================
# CLIENT CONFIGURATION
# ===========================================
CLIENT_URL=http://your-domain.com

# ===========================================
# EMAIL CONFIGURATION (Gmail Example)
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
FROM_NAME=Food Delivery System
FROM_EMAIL=your-email@gmail.com

# ===========================================
# CLOUDINARY CONFIGURATION
# ===========================================
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# ===========================================
# PAYMENT GATEWAY - STRIPE
# ===========================================
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# ===========================================
# PAYMENT GATEWAY - RAZORPAY
# ===========================================
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# ===========================================
# GOOGLE MAPS API
# ===========================================
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# ===========================================
# COMMISSION RATES
# ===========================================
RESTAURANT_COMMISSION=15
DELIVERY_COMMISSION=20
```

**Important Configuration Notes:**

1. **JWT_SECRET**: Generate a strong random key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **MONGODB_URI**: Use your MongoDB Atlas connection string
3. **SMTP_PASS**: Use Gmail App Password (not regular password)
4. **CLIENT_URL**: Your frontend domain
5. **CLOUDINARY**: Create account at cloudinary.com

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

---

## 🔒 Step 6: Configure Firewall

```bash
# Check current firewall status
sudo ufw status

# Allow necessary ports
sudo ufw allow 22/tcp        # SSH
sudo ufw allow 80/tcp        # HTTP
sudo ufw allow 443/tcp       # HTTPS
sudo ufw allow 5000/tcp      # Backend API (if needed for direct access)

# Enable firewall
sudo ufw enable

# Verify firewall rules
sudo ufw status numbered
```

---

## 🌐 Step 7: Configure Nginx as Reverse Proxy

### 7.1 Create Nginx Configuration

```bash
# Create configuration file
sudo nano /etc/nginx/sites-available/food-delivery
```

**Add the following configuration:**

```nginx
upstream food_delivery_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Client max body size for file uploads
    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # API endpoints
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://food_delivery_backend;
        access_log off;
    }

    # Logging
    access_log /var/log/nginx/food-delivery-access.log;
    error_log /var/log/nginx/food-delivery-error.log;
}

# If no domain, use IP address
server {
    listen 80 default_server;
    server_name 72.60.206.253;

    client_max_body_size 20M;
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;

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
```

### 7.2 Enable Site Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/food-delivery /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test successful, reload Nginx
sudo systemctl reload nginx
```

---

## 🔐 Step 8: Setup SSL Certificate (Let's Encrypt)

**Skip this step if you don't have a domain name**

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot will:
# 1. Automatically configure Nginx for HTTPS
# 2. Set up auto-renewal
# 3. Test renewal
```

**Auto-renewal is set up automatically, but test it:**

```bash
sudo certbot renew --dry-run
```

---

## 🚀 Step 9: Start Application with PM2

### 9.1 Start Application

```bash
# Navigate to application directory
cd /var/www/food-delivery

# Start application with PM2
pm2 start ecosystem.config.js --env production

# Or start directly
pm2 start server.js --name food-delivery-backend --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Copy the generated command and run it (e.g., sudo env PATH=$PATH...)
```

### 9.2 Useful PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs food-delivery-backend

# View real-time logs
pm2 logs --lines 50

# Restart application
pm2 restart food-delivery-backend

# Stop application
pm2 stop food-delivery-backend

# Delete application
pm2 delete food-delivery-backend

# Monitor resources
pm2 monit

# Reload application (zero-downtime)
pm2 reload food-delivery-backend
```

---

## ✅ Step 10: Verify Deployment

### 10.1 Check Application Status

```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs food-delivery-backend --lines 100
```

### 10.2 Test API Endpoints

```bash
# Test health endpoint
curl http://72.60.206.253/health

# Or if you have domain
curl https://your-domain.com/health

# Test API
curl http://72.60.206.253/api/v1/address/provinces
```

### 10.3 Check Nginx Status

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/food-delivery-access.log
sudo tail -f /var/log/nginx/food-delivery-error.log
```

---

## 🛠️ Step 11: Post-Deployment Tasks

### 11.1 Create Admin Account

```bash
# Navigate to scripts directory
cd /var/www/food-delivery/scripts

# Create super admin
node createSuperAdmin.js

# Follow prompts to create admin account
```

### 11.2 Setup MongoDB Indexes

```bash
# If needed, run scripts to setup database indexes
# This is usually handled automatically by MongoDB models
```

### 11.3 Configure File Permissions

```bash
# Set proper permissions
cd /var/www/food-delivery

# Create necessary directories
mkdir -p logs uploads

# Set permissions
chmod -R 755 .
chmod -R 775 uploads logs

# Set ownership (if using non-root user)
sudo chown -R deployer:deployer .
```

---

## 📊 Step 12: Setup Monitoring & Logs

### 12.1 View Application Logs

```bash
# PM2 logs
pm2 logs food-delivery-backend

# Application specific logs
tail -f /var/www/food-delivery/logs/combined.log
tail -f /var/www/food-delivery/logs/error.log

# Nginx logs
tail -f /var/log/nginx/food-delivery-access.log
tail -f /var/log/nginx/food-delivery-error.log
```

### 12.2 Setup Log Rotation

```bash
# Create log rotation config
sudo nano /etc/logrotate.d/food-delivery
```

**Add:**

```
/var/www/food-delivery/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deployer deployer
    sharedscripts
}
```

---

## 🔄 Step 13: Deployment Updates

### 13.1 Update Application

```bash
# Navigate to application directory
cd /var/www/food-delivery

# Pull latest changes (if using Git)
git pull origin main

# Install new dependencies
npm install --production

# Restart application
pm2 restart food-delivery-backend

# View logs to verify
pm2 logs food-delivery-backend --lines 50
```

### 13.2 Database Migrations

```bash
# If you have database migrations
node scripts/migrate.js
```

---

## 🐛 Troubleshooting Common Issues

### Issue 1: Application Not Starting

```bash
# Check PM2 logs
pm2 logs food-delivery-backend --lines 100

# Check Node.js version
node --version

# Check if port 5000 is in use
sudo netstat -tlnp | grep 5000

# Check application directly
cd /var/www/food-delivery
node server.js
```

### Issue 2: MongoDB Connection Error

```bash
# Test MongoDB connection
mongosh "your-mongodb-uri"

# Check MongoDB status
sudo systemctl status mongod

# Check firewall allows MongoDB port
sudo ufw status
```

### Issue 3: Nginx 502 Bad Gateway

```bash
# Check if application is running
pm2 status

# Check application logs
pm2 logs food-delivery-backend

# Check Nginx configuration
sudo nginx -t

# Test backend directly
curl http://localhost:5000/health
```

### Issue 4: Permission Denied

```bash
# Fix file permissions
cd /var/www/food-delivery
sudo chown -R $USER:$USER .
chmod -R 755 .
```

### Issue 5: Out of Memory

```bash
# Check memory usage
free -h

# Check PM2 memory usage
pm2 monit

# Restart application
pm2 restart food-delivery-backend

# If needed, add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 🔒 Security Best Practices

### 1. Keep System Updated

```bash
# Update packages regularly
sudo apt update && sudo apt upgrade -y
```

### 2. Secure .env File

```bash
# Set proper permissions on .env
chmod 600 /var/www/food-delivery/.env

# Don't commit .env to Git
# Make sure .env is in .gitignore
```

### 3. Enable Firewall

```bash
# Make sure firewall is enabled
sudo ufw status

# Only open necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
```

### 4. Regular Backups

```bash
# Backup script example
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/food-delivery"

mkdir -p $BACKUP_DIR

# Backup MongoDB (if local)
mongodump --out $BACKUP_DIR/mongodb_$DATE

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/food-delivery

# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -delete
```

### 5. Monitor Logs

```bash
# Check for suspicious activity
sudo tail -f /var/log/auth.log

# Check application logs regularly
pm2 logs --lines 100
```

---

## 📱 Testing Your Deployment

### Test API Endpoints

```bash
# 1. Health Check
curl http://72.60.206.253/health

# 2. Get Nepal Provinces
curl http://72.60.206.253/api/v1/address/provinces

# 3. API Documentation
curl http://72.60.206.253/api/docs
```

### From Your Browser

```
http://your-domain.com/health
http://your-domain.com/api/docs
http://your-domain.com/api/v1/address/provinces
```

---

## 📞 Quick Reference Commands

```bash
# ============================================
# APPLICATION MANAGEMENT
# ============================================
cd /var/www/food-delivery
pm2 start ecosystem.config.js --env production
pm2 restart food-delivery-backend
pm2 stop food-delivery-backend
pm2 logs food-delivery-backend
pm2 status
pm2 monit

# ============================================
# NGINX MANAGEMENT
# ============================================
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo nginx -t
sudo tail -f /var/log/nginx/food-delivery-access.log
sudo tail -f /var/log/nginx/food-delivery-error.log

# ============================================
# SYSTEM MANAGEMENT
# ============================================
sudo apt update && sudo apt upgrade -y
sudo ufw status
sudo systemctl status mongod
free -h
df -h

# ============================================
# LOGS
# ============================================
pm2 logs --lines 100
tail -f /var/www/food-delivery/logs/combined.log
tail -f /var/www/food-delivery/logs/error.log
sudo journalctl -u nginx -f
```

---

## ✅ Deployment Checklist

- [ ] VPS server accessible via SSH
- [ ] Node.js and npm installed
- [ ] PM2 installed
- [ ] MongoDB configured (Atlas or local)
- [ ] Nginx installed and configured
- [ ] Firewall configured
- [ ] Application files uploaded
- [ ] Dependencies installed
- [ ] .env file configured
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed (if using domain)
- [ ] Application started with PM2
- [ ] PM2 startup configured
- [ ] Health check endpoint working
- [ ] API endpoints accessible
- [ ] Logs configured
- [ ] Security measures in place
- [ ] Backup strategy implemented

---

## 🎉 Congratulations!

Your Food Delivery Backend is now deployed and running on your VPS!

**Your API is now accessible at:**
- **Without Domain**: `http://72.60.206.253`
- **With Domain**: `https://your-domain.com`

**Important URLs:**
- Health Check: `http://72.60.206.253/health`
- API Docs: `http://72.60.206.253/api/docs`
- API Base: `http://72.60.206.253/api/v1`

---

## 📚 Additional Resources

- [Node.js Documentation](https://nodejs.org/docs)
- [PM2 Documentation](https://pm2.keymetrics.io/docs)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com/)
- [Let's Encrypt](https://letsencrypt.org/)

---

## 🆘 Need Help?

If you encounter any issues:

1. Check application logs: `pm2 logs`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/food-delivery-error.log`
3. Verify environment variables
4. Test MongoDB connection
5. Check firewall rules
6. Review this guide carefully

Good luck with your deployment! 🚀

