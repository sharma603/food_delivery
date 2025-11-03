# VPS Image Display Issues - Fix Guide

## Common Problems & Solutions

### Problem: Menu images not showing on VPS server but paths are logged

This usually happens due to:
1. **Path Mismatch**: Files saved to one location but served from another
2. **Missing Directory**: Uploads directory doesn't exist on VPS
3. **File Permissions**: Server can't read the files
4. **Static File Serving**: Express static middleware not configured correctly

## ✅ Fixes Applied

### 1. **Consistent Path Resolution**
- Changed from `__dirname` to `process.cwd()` for consistent paths
- Both file upload and serving now use the same base path
- Files are saved and served from: `{project_root}/uploads/menu-items/`

### 2. **Static File Serving Improvements**
- Added proper Content-Type headers for images
- Enabled CORS for image requests
- Added cache headers for better performance
- Directory auto-creation on server start

### 3. **Debug Endpoints**
Access these endpoints to check your VPS setup:

#### Check Uploads Directory
```bash
GET /api/debug/uploads-check
```

This will show:
- Current working directory
- Uploads directory paths
- Directory existence and permissions
- Sample files list
- First file details

#### Test Specific Image
```bash
GET /api/debug/test-image/:filename
```

Example:
```bash
GET /api/debug/test-image/menu-1234567890.jpg
```

## 🔍 How to Debug on VPS

### Step 1: Check Server Logs
When server starts, you should see:
```
✅ Created uploads directory: /path/to/uploads
✅ Menu-items upload directory exists: /path/to/uploads/menu-items
📁 Static file paths:
  - Uploads: /path/to/uploads
  - Public: /path/to/public
  - Admin: /path/to/public/admin
```

### Step 2: Test Debug Endpoint
```bash
curl https://your-vps-domain.com/api/debug/uploads-check
```

### Step 3: Check File Permissions
SSH into your VPS and run:
```bash
# Check if uploads directory exists
ls -la uploads/

# Check menu-items directory
ls -la uploads/menu-items/

# Check file permissions (should be readable)
ls -la uploads/menu-items/*.jpg

# Fix permissions if needed
chmod -R 755 uploads/
```

### Step 4: Verify Image URL
Check the actual image URL in browser or curl:
```bash
curl -I https://your-vps-domain.com/uploads/menu-items/menu-1234567890.jpg
```

Should return:
- Status: 200 OK
- Content-Type: image/jpeg (or image/png)
- Access-Control-Allow-Origin: *

### Step 5: Check Frontend Image URLs
In your frontend code, ensure images use the correct base URL:
- If image path is `/uploads/menu-items/file.jpg`
- Frontend should request: `https://your-api-domain.com/uploads/menu-items/file.jpg`

## 🛠️ Additional VPS Configuration

### If Using Nginx as Reverse Proxy

Add this to your Nginx config:

```nginx
server {
    location /uploads {
        alias /path/to/your/project/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
```

### If Using PM2

Ensure working directory is set correctly:
```json
{
  "apps": [{
    "name": "food-delivery-api",
    "script": "./Backend/src/server.js",
    "cwd": "/path/to/your/project",
    "env": {
      "NODE_ENV": "production"
    }
  }]
}
```

### File Permissions

Make sure the Node.js process can read/write:
```bash
# Set ownership
sudo chown -R $USER:$USER uploads/

# Set permissions
chmod -R 755 uploads/
```

## 📝 Environment Variables

Set these in your `.env` file or VPS environment:

```env
NODE_ENV=production
# Enable debug routes temporarily for troubleshooting
ENABLE_DEBUG_ROUTES=true
```

## ✅ Verification Checklist

- [ ] Uploads directory exists at project root
- [ ] Menu-items subdirectory exists
- [ ] Files are being saved when uploading
- [ ] Server logs show correct paths on startup
- [ ] Debug endpoint returns correct information
- [ ] Image URLs are accessible via browser/curl
- [ ] File permissions allow reading
- [ ] Frontend uses correct API base URL
- [ ] CORS is properly configured
- [ ] Reverse proxy (if any) allows /uploads path

## 🚨 Common Error Messages

### "Cannot GET /uploads/..."
- **Cause**: Static file middleware not configured
- **Fix**: Check `app.js` has `app.use('/uploads', express.static(...))`

### "404 Not Found"
- **Cause**: File doesn't exist at expected path
- **Fix**: Check debug endpoint to see actual file locations

### "403 Forbidden"
- **Cause**: File permissions issue
- **Fix**: Run `chmod -R 755 uploads/`

### Images show broken icon
- **Cause**: CORS or Content-Type header missing
- **Fix**: Check static file serving has proper headers (already added)

## 📞 Still Having Issues?

1. Check server logs when starting
2. Use debug endpoints to verify paths
3. Test image URL directly in browser
4. Check file permissions
5. Verify frontend API base URL matches VPS domain
