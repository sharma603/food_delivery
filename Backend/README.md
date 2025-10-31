# Food Delivery System - Backend API

A comprehensive backend API for a food delivery system with Nepal address integration, built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Customer Management**: Registration, authentication, profile management
- **Restaurant Management**: Restaurant registration, menu management, order processing
- **Order Management**: Complete order lifecycle from placement to delivery
- **Payment Integration**: Razorpay and Stripe payment gateways
- **Address Management**: Nepal-specific address system with provinces, districts, municipalities
- **Email Services**: Password reset, notifications, and communication
- **File Upload**: Image uploads with Cloudinary integration
- **Security**: JWT authentication, rate limiting, input validation
- **Caching**: Redis integration for performance optimization

## 📋 Prerequisites

- Node.js (>= 16.0.0)
- MongoDB (>= 4.0)
- Redis (optional, for caching)
- npm (>= 8.0.0)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/food_delivery
   JWT_SECRET=your-super-secure-jwt-secret-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   # ... other configurations
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB service
   # Create database: food_delivery
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔧 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `development` |
| `PORT` | Server port | No | `5000` |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_EXPIRE` | JWT expiration time | No | `30d` |
| `EMAIL_HOST` | SMTP host | Yes | - |
| `EMAIL_USER` | SMTP username | Yes | - |
| `EMAIL_PASS` | SMTP password | Yes | - |
| `FRONTEND_URL` | Frontend URL for reset links | Yes | - |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes | - |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes | - |

## 📚 API Documentation

### Authentication Endpoints

#### Customer Authentication
- `POST /api/v1/mobile/auth/register` - Customer registration
- `POST /api/v1/mobile/auth/login` - Customer login
- `POST /api/v1/mobile/auth/forgot-password` - Request password reset
- `POST /api/v1/mobile/auth/reset-password` - Reset password
- `GET /api/v1/mobile/auth/profile` - Get customer profile
- `PUT /api/v1/mobile/auth/profile` - Update customer profile
- `PUT /api/v1/mobile/auth/change-password` - Change password
- `POST /api/v1/mobile/auth/logout` - Logout

#### Restaurant Authentication
- `POST /api/v1/restaurant/auth/register` - Restaurant registration
- `POST /api/v1/restaurant/auth/login` - Restaurant login

### Restaurant Endpoints
- `GET /api/v1/mobile/restaurants` - Get restaurants
- `GET /api/v1/mobile/restaurants/:id` - Get restaurant details
- `GET /api/v1/mobile/menu-items` - Get menu items
- `GET /api/v1/mobile/menu-items/:id` - Get menu item details

### Order Endpoints
- `POST /api/v1/mobile/orders` - Create order
- `GET /api/v1/mobile/orders` - Get customer orders
- `GET /api/v1/mobile/orders/:id` - Get order details
- `PUT /api/v1/mobile/orders/:id/status` - Update order status

### Address Endpoints
- `GET /api/v1/address/provinces` - Get provinces
- `GET /api/v1/address/districts/:provinceId` - Get districts
- `GET /api/v1/address/municipalities/:districtId` - Get municipalities

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Express-validator for request validation
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **MongoDB Sanitization**: Protection against NoSQL injection
- **File Upload Security**: File type and size validation

## 📁 Project Structure

```
Backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   └── mobile/          # Mobile-specific API
├── uploads/             # File uploads directory
├── logs/               # Application logs
├── server.js           # Main server file
└── package.json        # Dependencies and scripts
```

## 🚀 Deployment

### Using PM2 (Recommended)

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Start with PM2**
   ```bash
   pm2 start server.js --name "food-delivery-api"
   pm2 save
   pm2 startup
   ```

### Using Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 5000
   CMD ["npm", "start"]
   ```

2. **Build and run**
   ```bash
   docker build -t food-delivery-api .
   docker run -p 5000:5000 --env-file .env food-delivery-api
   ```

## 📊 Monitoring

- **Health Check**: `GET /health`
- **Logs**: Winston logging with different levels
- **Error Handling**: Centralized error handling middleware

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.
