# Hostinger VPS Deployment Guide

## Complete Deployment Steps for Hostinger VPS

### 1. VPS Setup Commands

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Nginx
sudo apt install nginx -y

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt install git -y

# Install UFW (Firewall)
sudo apt install ufw -y
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # React App (optional)
sudo ufw enable
```

### 2. Project Setup

```bash
# Create application directory
sudo mkdir -p /var/www/food-delivery
sudo chown -R $USER:$USER /var/www/food-delivery
cd /var/www/food-delivery

# Clone or upload your project
# Option 1: Git clone (if using Git)
git clone <your-repository-url> .

# Option 2: Upload via SFTP/SCP
# Upload your project files to /var/www/food-delivery/
```

### 3. Backend Deployment

```bash
# Navigate to backend directory
cd /var/www/food-delivery/Backend

# Install dependencies
npm install --production

# Create production environment file
cp env.production.template .env

# Edit environment variables
nano .env
```

#### Environment Variables for Production (.env):

```env
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/food_delivery

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRE=7d

# Client URLs
CLIENT_URL=https://yourdomain.com
MOBILE_CLIENT_URL=https://yourdomain.com

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Payment Configuration (Optional)
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Cloudinary Configuration (Optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Database Setup

```bash
# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Create SuperAdmin account
node scripts/createSuperAdmin.js

# Verify database connection
node scripts/health-check.js
```

### 5. Start Backend with PM2

```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs food-delivery-backend
```

### 6. Frontend Deployment

```bash
# Navigate to frontend directory
cd /var/www/food-delivery/frontent

# Install dependencies
npm install

# Build for production
npm run build

# The build files will be in the 'build' directory
```

### 7. Nginx Configuration

Create Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/food-delivery
```

#### Nginx Configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (after getting SSL certificate)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend (React App)
    location / {
        root /var/www/food-delivery/frontent/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # File uploads
    location /uploads/ {
        alias /var/www/food-delivery/Backend/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 8. Enable Site and Restart Nginx

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/food-delivery /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 9. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 10. Mobile App Configuration

Update the mobile app constants to point to your production server:

```javascript
// In customer/src/utils/constants.js
export const SERVER_IP = 'yourdomain.com'; // Change from local IP
export const SERVER_PORT = ''; // Remove port for HTTPS
export const API_CONFIG = {
  BASE_URL: `https://${SERVER_IP}/api/v1`, // Use HTTPS
  TIMEOUT: 10000,
  VERSION: 'v1'
};
```

### 11. Monitoring and Maintenance

```bash
# Monitor application
pm2 monit

# View logs
pm2 logs food-delivery-backend

# Restart application
pm2 restart food-delivery-backend

# Check system resources
htop
df -h
free -h

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 12. Backup Strategy

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db food_delivery --out /var/backups/mongodb/food_delivery_$DATE
find /var/backups/mongodb -name "food_delivery_*" -mtime +7 -delete

# Application backup
tar -czf /var/backups/app/food_delivery_$DATE.tar.gz /var/www/food-delivery
find /var/backups/app -name "food_delivery_*.tar.gz" -mtime +7 -delete
```

### 13. Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSH key authentication enabled
- [ ] Regular security updates
- [ ] Strong passwords for all services
- [ ] SSL certificate installed
- [ ] Database authentication enabled
- [ ] File permissions set correctly
- [ ] Backup strategy implemented

### 14. Performance Optimization

```bash
# Enable MongoDB authentication
sudo nano /etc/mongod.conf
# Add:
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod

# Create database user
mongo
use food_delivery
db.createUser({
  user: "food_delivery_user",
  pwd: "secure_password",
  roles: [{ role: "readWrite", db: "food_delivery" }]
})
```

### 15. Troubleshooting

```bash
# Check if services are running
sudo systemctl status mongod
sudo systemctl status nginx
pm2 status

# Check ports
sudo netstat -tlnp | grep :5000
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Check disk space
df -h

# Check memory usage
free -h

# Check application logs
pm2 logs food-delivery-backend --lines 100
```

## Cost Estimation for Hostinger VPS

### Recommended Hostinger VPS Plans:

1. **VPS 1** (Budget): $3.99/month
   - 1 CPU core, 1GB RAM, 20GB SSD
   - Suitable for testing only

2. **VPS 2** (Recommended): $7.99/month
   - 2 CPU cores, 2GB RAM, 50GB SSD
   - Good for small to medium traffic

3. **VPS 3** (Optimal): $11.99/month
   - 4 CPU cores, 4GB RAM, 100GB SSD
   - Best for production with good traffic

### Additional Costs:
- Domain: $10-15/year
- SSL Certificate: Free (Let's Encrypt)
- Email service: Optional, $5-10/month
- Backup storage: Optional, $2-5/month

## Support and Maintenance

- Monitor application logs regularly
- Set up automated backups
- Keep system and dependencies updated
- Monitor server resources (CPU, RAM, disk)
- Test application functionality after updates

This deployment guide will help you successfully deploy your food delivery system to Hostinger VPS with proper security, performance, and monitoring in place.
