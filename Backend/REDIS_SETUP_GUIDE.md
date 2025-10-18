# Redis Setup Guide for Food Delivery System

## Why Redis is Needed

Redis is used for:
- **Rate Limiting**: Prevents "Too many requests" errors
- **Caching**: Improves API response times
- **Session Storage**: Better session management
- **Real-time Features**: WebSocket and notification systems

## Option 1: Install Redis Locally (Recommended for Development)

### Windows:
1. Download Redis from: https://github.com/microsoftarchive/redis/releases
2. Or use Chocolatey: `choco install redis-64`
3. Or use WSL: `sudo apt-get install redis-server`

### macOS:
```bash
brew install redis
brew services start redis
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## Option 2: Use Docker (Easiest)

```bash
# Run Redis in Docker
docker run -d --name redis-server -p 6379:6379 redis:alpine

# Or with persistence
docker run -d --name redis-server -p 6379:6379 -v redis-data:/data redis:alpine redis-server --appendonly yes
```

## Option 3: Cloud Redis (For Production)

- **Redis Cloud**: https://redis.com/try-free/
- **AWS ElastiCache**: https://aws.amazon.com/elasticache/
- **Google Cloud Memorystore**: https://cloud.google.com/memorystore

## Configuration

### 1. Set Environment Variable

Add to your `.env` file:
```env
REDIS_URL=redis://localhost:6379
```

### 2. Test Redis Connection

```bash
# Test if Redis is running
redis-cli ping
# Should return: PONG
```

### 3. Restart Backend Server

```bash
cd Backend
npm start
```

You should see:
```
Connected to Redis
```

## Troubleshooting

### Redis Not Starting:
```bash
# Check if Redis is running
redis-cli ping

# Start Redis manually
redis-server

# Or with Docker
docker start redis-server
```

### Connection Issues:
- Check if port 6379 is available
- Verify REDIS_URL in .env file
- Check firewall settings

### Rate Limiting Still Issues:
- Clear Redis cache: `redis-cli FLUSHALL`
- Restart backend server
- Check Redis logs

## Benefits After Setup

✅ **No more "Too many requests" errors**
✅ **Faster API responses** (caching)
✅ **Better session management**
✅ **Improved real-time features**
✅ **Production-ready rate limiting**

## Quick Start (Docker)

```bash
# 1. Start Redis
docker run -d --name redis-server -p 6379:6379 redis:alpine

# 2. Add to .env
echo "REDIS_URL=redis://localhost:6379" >> Backend/.env

# 3. Restart backend
cd Backend && npm start
```

That's it! Redis will now handle rate limiting properly.
