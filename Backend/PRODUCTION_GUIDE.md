# 🚀 Production Deployment Guide

## Quick Start

### 1. Production Start
```bash
npm run start:prod
```

### 2. Standard Start
```bash
npm start
```

### 3. Development Mode
```bash
npm run dev
```

---

## 📋 Environment Configuration

### Required Variables (.env)
```env
NODE_ENV=production
MONGODB_URI=mongodb://username:password@host:port/database?authSource=admin
JWT_SECRET=your-secret-key-here
PORT=5000
```

### Recommended Variables
```env
CLIENT_URL=http://your-frontend-url.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 🔧 Production Setup

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js --env production

# View status
pm2 status

# View logs
pm2 logs food-delivery-backend

# Restart
pm2 restart food-delivery-backend
```

### Using npm scripts
```bash
# Production mode
npm run start:prod

# Development mode
npm run dev
```

---

## 📊 Health Check

### Test Server Health
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-31T10:00:00.000Z",
  "environment": "production"
}
```

---

## 🔍 Available Endpoints

- **Health Check**: `GET /health`
- **API Documentation**: `GET /api/docs`
- **Nepal Address API**: `GET /api/v1/address/provinces`

---

## ⚙️ Server Configuration

### Port Configuration
- Default: `5000`
- Configure via `PORT` environment variable

### MongoDB Connection
- Configured via `MONGODB_URI` in `.env`
- Supports remote MongoDB servers
- Auto-reconnection enabled

### Environment Modes
- **Production**: `NODE_ENV=production`
- **Development**: `NODE_ENV=development`

---

## 🛠️ Troubleshooting

### Server Won't Start
1. Check `.env` file exists
2. Verify `MONGODB_URI` is set
3. Check port 5000 is available
4. Review error logs

### MongoDB Connection Issues
1. Verify connection string format
2. Check network connectivity
3. Verify credentials
4. Check firewall rules

### Port Already in Use
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (Windows)
taskkill /PID <process_id> /F
```

---

## 📝 Production Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection working
- [ ] NODE_ENV set to production
- [ ] Port 5000 available
- [ ] Health endpoint responding
- [ ] Error logging configured
- [ ] Process manager (PM2) installed (optional)

---

## 🚀 Deployment Commands

```bash
# 1. Install dependencies
npm install

# 2. Set production mode
# Edit .env file: NODE_ENV=production

# 3. Start server
npm run start:prod

# Or with PM2
pm2 start ecosystem.config.js --env production
```

---

Your production server is ready! 🎉
