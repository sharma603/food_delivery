# 🚀 Quick Start - Deploy to VPS

## Prerequisites Checklist

Before you start, make sure you have:

- [ ] VPS Server credentials (IP: 72.60.206.253)
- [ ] MongoDB Atlas account OR local MongoDB
- [ ] Gmail account for email service
- [ ] Cloudinary account for image uploads
- [ ] Stripe/Razorpay account for payments (optional)
- [ ] Domain name (optional, for SSL)

---

## 🎯 Quick Deployment (5 Steps)

### Step 1: Connect to Your Server

```bash
ssh root@72.60.206.253
```

### Step 2: Run Auto-Deployment Script

```bash
# Download and run deployment script
cd /root
wget https://raw.githubusercontent.com/yourusername/food-delivery-backend/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

**OR** upload files manually first:

```bash
# On your local machine
cd "G:\NodeJS_Projects\Food Delevring System\Backend"
scp -r * root@72.60.206.253:/var/www/food-delivery/

# Then on VPS
ssh root@72.60.206.253
cd /var/www/food-delivery
chmod +x deploy.sh
./deploy.sh
```

### Step 3: Configure Environment

```bash
cd /var/www/food-delivery
nano .env
```

**Minimum required configuration:**

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/food_delivery
JWT_SECRET=generate-random-secret-here
CLIENT_URL=http://72.60.206.253
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Save:** `Ctrl+X`, then `Y`, then `Enter`

### Step 4: Restart Application

```bash
pm2 restart food-delivery-backend
pm2 logs food-delivery-backend
```

### Step 5: Test

```bash
# Test health endpoint
curl http://72.60.206.253/health

# Should return JSON with status
```

---

## 📝 Detailed Deployment (Manual)

If you prefer manual deployment, follow the complete guide in **DEPLOYMENT_GUIDE.md**

---

## 🐛 Troubleshooting

### Application won't start

```bash
# Check logs
pm2 logs food-delivery-backend --lines 100

# Common issues:
# 1. Missing .env file or wrong configuration
# 2. MongoDB connection error
# 3. Port 5000 already in use
```

### MongoDB Connection Error

```bash
# Test MongoDB connection
mongosh "your-connection-string"

# Check if IP is whitelisted in MongoDB Atlas
```

### Port Already in Use

```bash
# Check what's using port 5000
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>
```

### Permission Errors

```bash
# Fix permissions
cd /var/www/food-delivery
sudo chown -R $USER:$USER .
chmod 755 .
```

---

## ✅ Post-Deployment Checklist

- [ ] Application running: `pm2 status`
- [ ] Health check works: `curl http://72.60.206.253/health`
- [ ] API endpoints accessible
- [ ] MongoDB connected
- [ ] Email service configured
- [ ] File uploads working
- [ ] Nginx proxy working
- [ ] Firewall configured
- [ ] Logs directory writable
- [ ] PM2 auto-restart configured

---

## 🔗 Important Links

- **Health Check**: http://72.60.206.253/health
- **API Docs**: http://72.60.206.253/api/docs
- **API Base**: http://72.60.206.253/api/v1

---

## 📞 Quick Commands

```bash
# Application management
pm2 restart food-delivery-backend
pm2 logs food-delivery-backend
pm2 status
pm2 monit

# Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/food-delivery-error.log

# System
free -h
df -h
top

# Application directory
cd /var/www/food-delivery
```

---

## 🎉 Next Steps

1. **Create Admin Account**:
   ```bash
   cd /var/www/food-delivery/scripts
   node createSuperAdmin.js
   ```

2. **Setup SSL** (if you have domain):
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

3. **Configure Monitoring**:
   - Setup log rotation
   - Configure backups
   - Setup uptime monitoring

4. **Test All Features**:
   - User registration/login
   - Restaurant creation
   - Order placement
   - Payment processing
   - File uploads

---

## 🆘 Need Help?

Check the detailed **DEPLOYMENT_GUIDE.md** for:
- Detailed step-by-step instructions
- Complete configuration examples
- Security best practices
- Advanced troubleshooting
- Monitoring setup

Good luck! 🚀

