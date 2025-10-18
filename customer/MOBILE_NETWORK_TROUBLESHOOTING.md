# Mobile App Network Troubleshooting Guide

## ✅ Issues Fixed

### 1. **Network Connectivity Test Fixed**
- **Problem**: The network connectivity test was using incorrect URL construction
- **Solution**: Fixed the URL construction in `customer/src/services/mobileAPI.js`
- **Before**: `http://${API_CONFIG.BASE_URL.replace('http://', '').replace('/api/v1', '')}/health`
- **After**: `const baseServerUrl = API_CONFIG.BASE_URL.replace('/api/v1', ''); const healthUrl = ${baseServerUrl}/health`

### 2. **CORS Configuration Updated**
- **Problem**: Mobile apps might be blocked by CORS policy
- **Solution**: Updated CORS configuration in `Backend/src/app.js` to be more permissive for mobile apps
- **Changes**: Added logging and better handling for requests with no origin (mobile apps)

### 3. **Server Configuration Verified**
- **IP Address**: `192.168.18.38` (current Windows IP)
- **Port**: `5000`
- **Health Endpoint**: `http://192.168.18.38:5000/health`
- **Mobile API**: `http://192.168.18.38:5000/api/v1/mobile/`

## 🔧 Current Status

✅ **Backend Server**: Running on `192.168.18.38:5000`
✅ **Health Endpoint**: Working (`/health`)
✅ **Mobile API**: Working (`/api/v1/mobile/restaurants`)
✅ **CORS**: Configured to allow mobile apps
✅ **Network Test**: Fixed in mobile app

## 📱 Mobile App Troubleshooting Steps

### Step 1: Restart the Mobile App
```bash
# Stop the React Native Metro bundler
# Then restart:
cd customer
npm start --reset-cache
```

### Step 2: Check Network Connection
- Ensure your mobile device/emulator is on the same network as the development machine
- Network: Same WiFi network as `192.168.18.38`

### Step 3: Test API Endpoints Manually
```bash
# Test health endpoint
curl http://192.168.18.38:5000/health

# Test mobile restaurants endpoint
curl http://192.168.18.38:5000/api/v1/mobile/restaurants
```

### Step 4: Check Mobile App Logs
Look for these log messages in your mobile app console:
- ✅ `"Testing health endpoint: http://192.168.18.38:5000/health"`
- ✅ `"Network test successful: 200"`
- ❌ `"Network test failed: Network Error"`

### Step 5: Verify IP Address
If your IP address changes, update `customer/src/utils/constants.js`:
```javascript
export const SERVER_IP = 'YOUR_CURRENT_IP'; // Update this
```

## 🚨 Common Issues & Solutions

### Issue: "Network Error" in Mobile App
**Solutions:**
1. Restart the mobile app completely
2. Check if backend server is running: `netstat -an | findstr :5000`
3. Verify IP address in constants.js
4. Ensure same network connection

### Issue: "CORS Error"
**Solutions:**
1. Backend CORS is now configured to allow mobile apps
2. Restart backend server if you made changes
3. Check backend logs for CORS messages

### Issue: "Connection Timeout"
**Solutions:**
1. Increase timeout in `API_CONFIG.TIMEOUT` (currently 10000ms)
2. Check firewall settings
3. Verify server is accessible from mobile device

## 🔍 Debug Information

### Backend Server Status
- **URL**: `http://192.168.18.38:5000`
- **Health**: `http://192.168.18.38:5000/health`
- **Mobile API**: `http://192.168.18.38:5000/api/v1/mobile/`

### Mobile App Configuration
- **Base URL**: `http://192.168.18.38:5000/api/v1`
- **Mobile Base URL**: `http://192.168.18.38:5000/api/v1/mobile`
- **Timeout**: 10000ms

### Network Requirements
- Same WiFi network for mobile device and development machine
- Port 5000 must be accessible
- No firewall blocking the connection

## 📞 Quick Fix Commands

```bash
# 1. Check if server is running
netstat -an | findstr :5000

# 2. Test health endpoint
curl http://192.168.18.38:5000/health

# 3. Restart backend server
cd Backend
npm run dev

# 4. Restart mobile app with cache reset
cd customer
npm start --reset-cache
```

## ✅ Success Indicators

When everything is working, you should see:
- ✅ Backend server running on port 5000
- ✅ Health endpoint returning 200 status
- ✅ Mobile API endpoints returning restaurant data
- ✅ Mobile app successfully loading restaurants and menu items
- ✅ No "Network Error" messages in mobile app logs

---

**Last Updated**: October 13, 2025
**Server IP**: 192.168.18.38
**Status**: ✅ All issues resolved
