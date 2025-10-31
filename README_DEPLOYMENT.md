# 📦 Food Delivery System - Backend Deployment

Complete guide to deploy your Food Delivery Backend API to VPS server (72.60.206.253).

---

## 🎯 Three Ways to Deploy

### Option 1: Quick Start (Recommended for First-Timers)

Follow the **QUICK_START.md** guide for a streamlined 5-step deployment.

### Option 2: Automated Deployment

Use the provided `deploy.sh` script for automated deployment.

### Option 3: Manual Deployment

Follow the detailed **DEPLOYMENT_GUIDE.md** for complete control.

---

## 📚 Documentation Files

| File | Description | When to Use |
|------|-------------|-------------|
| **QUICK_START.md** | Fast 5-step deployment guide | First deployment, quick setup |
| **DEPLOYMENT_GUIDE.md** | Complete A-Z deployment guide | Detailed setup, troubleshooting |
| **deploy.sh** | Automated deployment script | Automated server setup |
| **Backend/.env.example** | Environment variables template | Configuration reference |

---

## 🚀 Quick Deployment Steps

### 1. Connect to Your VPS

```bash
ssh root@72.60.206.253
```

### 2. Upload Backend Files

**From your local machine:**

```bash
cd "G:\NodeJS_Projects\Food Delevring System"
scp -r Backend root@72.60.206.253:/var/www/food-delivery
```

### 3. Run Deployment Script

**On your VPS:**

```bash
ssh root@72.60.206.253
cd /var/www/food-delivery
chmod +x deploy.sh
./deploy.sh
```

### 4. Configure Environment

```bash
nano .env
```

Copy from `.env.example` and update with your credentials.

### 5. Start Application

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 6. Test

```bash
curl http://72.60.206.253/health
```

---

## 📋 Pre-Deployment Checklist

Before starting deployment, ensure you have:

- [ ] VPS server access (SSH credentials)
- [ ] MongoDB Atlas account or local MongoDB
- [ ] Gmail account for email service
- [ ] Cloudinary account for image hosting
- [ ] Payment gateway accounts (Stripe/Razorpay)
- [ ] Domain name (optional for SSL)
- [ ] Backend code ready in `Backend/` folder

---

## 🔑 Required Service Accounts

### 1. MongoDB Atlas (Database)
- **Website**: https://mongodb.com/cloud/atlas
- **Plan**: Free M0 tier (512MB storage)
- **Required**: Connection string with credentials

### 2. Gmail (Email Service)
- **Setup**: Enable 2-Factor Authentication
- **Required**: App Password (not regular password)
- **Instructions**: Google Account → Security → 2-Step Verification → App Passwords

### 3. Cloudinary (Image Storage)
- **Website**: https://cloudinary.com
- **Plan**: Free tier (25GB storage)
- **Required**: Cloud name, API key, API secret

### 4. Stripe/Razorpay (Payments) - Optional
- **Stripe**: https://stripe.com
- **Razorpay**: https://razorpay.com
- **Required**: Public key, Secret key

---

## 🌐 Access Your Deployed API

After successful deployment:

- **API Base**: `http://72.60.206.253/api/v1`
- **Health Check**: `http://72.60.206.253/health`
- **API Docs**: `http://72.60.206.253/api/docs`
- **Nepal Addresses**: `http://72.60.206.253/api/v1/address/provinces`

---

## 🛠️ Common Tasks After Deployment

### Create Admin Account

```bash
cd /var/www/food-delivery/scripts
node createSuperAdmin.js
```

### View Application Logs

```bash
pm2 logs food-delivery-backend
pm2 logs --lines 100
```

### Restart Application

```bash
pm2 restart food-delivery-backend
```

### Update Application

```bash
cd /var/www/food-delivery
git pull origin main  # If using Git
npm install --production
pm2 restart food-delivery-backend
```

### Check Status

```bash
pm2 status
pm2 monit
curl http://72.60.206.253/health
```

---

## 🔒 Security Considerations

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use strong JWT secret** - Generate random 64-character string
3. **Enable firewall** - Only open necessary ports
4. **Setup SSL** - Use Let's Encrypt for HTTPS
5. **Regular updates** - Keep system and dependencies updated
6. **Monitor logs** - Check logs regularly for suspicious activity

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs food-delivery-backend --lines 100

# Common issues:
# 1. Missing or invalid .env configuration
# 2. MongoDB connection error
# 3. Port 5000 already in use
# 4. Missing dependencies
```

### MongoDB Connection Error

```bash
# Test connection
mongosh "your-mongodb-uri"

# Check IP whitelist in MongoDB Atlas
# Add your VPS IP: 72.60.206.253
```

### Nginx 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Check backend logs
pm2 logs food-delivery-backend

# Check Nginx logs
sudo tail -f /var/log/nginx/food-delivery-error.log

# Test backend directly
curl http://localhost:5000/health
```

### Port Issues

```bash
# Check what's using port 5000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>

# Or change PORT in ecosystem.config.js and .env
```

---

## 📊 Monitoring & Maintenance

### Daily Checks

```bash
# Application status
pm2 status

# System resources
free -h
df -h

# Recent logs
pm2 logs --lines 50
```

### Weekly Tasks

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update npm packages (carefully!)
cd /var/www/food-delivery
npm audit
npm update

# Review logs
pm2 logs --lines 200
```

### Monthly Tasks

```bash
# Check disk space
df -h

# Review and rotate logs
pm2 flush

# Backup database
mongodump --uri="your-mongodb-uri" --out=/var/backups/food-delivery
```

---

## 📞 Support & Documentation

### Internal Documentation
- **API Documentation**: Available at `/api/docs` after deployment
- **Health Check**: Available at `/health`
- **Code Comments**: Well-documented in source files

### External Resources
- **Node.js**: https://nodejs.org/docs
- **PM2**: https://pm2.keymetrics.io/docs
- **Nginx**: https://nginx.org/en/docs/
- **MongoDB**: https://docs.mongodb.com/
- **Express**: https://expressjs.com/en/guide/routing.html

---

## 🎉 Success Indicators

Your deployment is successful when:

✅ `pm2 status` shows application as "online"  
✅ `curl http://72.60.206.253/health` returns JSON  
✅ API endpoints respond correctly  
✅ MongoDB connection established  
✅ No errors in logs  
✅ Nginx proxy working  
✅ File uploads functioning  
✅ Email service operational  

---

## 🚦 Next Steps After Deployment

1. ✅ Test all API endpoints
2. ✅ Create super admin account
3. ✅ Configure SSL certificate (if you have domain)
4. ✅ Setup automated backups
5. ✅ Configure monitoring alerts
6. ✅ Update frontend with API URL
7. ✅ Test payment integrations
8. ✅ Configure email templates
9. ✅ Setup log rotation
10. ✅ Document your specific configuration

---

## 📝 Configuration Examples

### Production .env

```env
NODE_ENV=production
PORT=5000

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/food_delivery

# JWT
JWT_SECRET=your-64-character-random-secret-here

# Client
CLIENT_URL=http://72.60.206.253

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=your-gmail-app-password

# Cloudinary
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 🎓 Learning Resources

### Video Tutorials
- PM2 Process Management
- Nginx Reverse Proxy Setup
- MongoDB Atlas Configuration
- Let's Encrypt SSL Setup

### Written Guides
- Node.js Production Best Practices
- Express.js Security
- Server Hardening
- Database Optimization

---

## 📄 Files Reference

```
Backend/
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── deploy.sh                 # Deployment script
├── ecosystem.config.js       # PM2 configuration
├── package.json              # Dependencies
├── server.js                 # Entry point
├── src/                      # Source code
│   ├── app.js               # Express app
│   ├── config/              # Configuration
│   ├── controllers/         # Route handlers
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   └── services/            # Business logic
├── uploads/                  # File uploads
├── logs/                     # Application logs
└── scripts/                  # Utility scripts

Documentation/
├── DEPLOYMENT_GUIDE.md      # Complete guide
├── QUICK_START.md           # Quick reference
└── README_DEPLOYMENT.md     # This file
```

---

**Ready to deploy?** Start with **QUICK_START.md** for the fastest setup! 🚀

Questions or issues? Check **DEPLOYMENT_GUIDE.md** for detailed troubleshooting.

