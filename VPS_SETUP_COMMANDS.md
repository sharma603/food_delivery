# 🚀 VPS Setup Commands - Quick Reference

Copy-paste ready commands for deploying Food Delivery Backend to 72.60.206.253

---

## 📍 Connect to Server

```bash
ssh root@72.60.206.253
```

---

## ⚡ Quick Setup (All-in-One)

```bash
# Update system
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git build-essential ufw

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx

# Setup firewall
ufw allow 22,80,443,5000/tcp
ufw enable

# Create app directory
mkdir -p /var/www/food-delivery
cd /var/www/food-delivery

# Your app files should be here now
```

---

## 📤 From Your Local Machine

```powershell
# PowerShell (Windows)
cd "G:\NodeJS_Projects\Food Delevring System"

# Upload Backend folder
scp -r Backend/* root@72.60.206.253:/var/www/food-delivery/
```

**OR use Git:**

```bash
# On VPS
cd /var/www/food-delivery
git clone YOUR_REPO_URL .
```

---

## 🔧 Configure & Install

```bash
cd /var/www/food-delivery

# Install dependencies
npm install --production --legacy-peer-deps

# Setup environment
cp .env.example .env
nano .env  # Edit with your credentials

# Create directories
mkdir -p logs uploads
chmod 775 logs uploads
```

---

## 🌐 Setup Nginx

```bash
# Create config
cat > /etc/nginx/sites-available/food-delivery << 'EOF'
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
ln -sf /etc/nginx/sites-available/food-delivery /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t && systemctl reload nginx
```

---

## 🚀 Start Application

```bash
cd /var/www/food-delivery

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save and auto-start
pm2 save
pm2 startup
# Run the command shown

# Check status
pm2 status
```

---

## ✅ Verify Deployment

```bash
# Check health
curl http://72.60.206.253/health

# Test API
curl http://72.60.206.253/api/v1/address/provinces

# Check logs
pm2 logs --lines 50

# Monitor
pm2 monit
```

---

## 📊 Common Commands

```bash
# Application
pm2 restart food-delivery-backend
pm2 stop food-delivery-backend
pm2 logs food-delivery-backend
pm2 status
pm2 monit

# Nginx
systemctl restart nginx
systemctl reload nginx
nginx -t
tail -f /var/log/nginx/food-delivery-error.log

# System
free -h
df -h
top
ufw status
```

---

## 🔐 Setup SSL (If you have domain)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 🐛 Quick Troubleshooting

```bash
# App not starting?
pm2 logs food-delivery-backend --lines 100
cd /var/www/food-delivery && node server.js

# Nginx 502?
pm2 status
curl http://localhost:5000/health
tail -f /var/log/nginx/food-delivery-error.log

# MongoDB error?
# Check .env MONGODB_URI
# Check MongoDB Atlas IP whitelist

# Permission error?
chown -R $USER:$USER /var/www/food-delivery
chmod -R 755 /var/www/food-delivery
```

---

## 🔄 Update Application

```bash
cd /var/www/food-delivery
git pull origin main  # If using Git
npm install --production --legacy-peer-deps
pm2 restart food-delivery-backend
pm2 logs --lines 50
```

---

## 📝 .env Configuration (Minimum)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/food_delivery
JWT_SECRET=YOUR_RANDOM_64_CHAR_SECRET
CLIENT_URL=http://72.60.206.253

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_NAME=Food Delivery System
FROM_EMAIL=your-email@gmail.com

CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 🎯 Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## ✅ Success Checklist

- [ ] SSH connected
- [ ] Node.js 18 installed
- [ ] PM2 installed
- [ ] Nginx running
- [ ] Firewall configured
- [ ] Files uploaded
- [ ] Dependencies installed
- [ ] .env configured
- [ ] App running (pm2 status)
- [ ] Health check works
- [ ] API responding
- [ ] No errors in logs

---

**All set!** Your API is live at: http://72.60.206.253 🎉

