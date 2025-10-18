# 🚚 Delivery Management System

A comprehensive delivery management system for food delivery platforms with zone-based pricing, real-time tracking, and performance analytics.

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Database Models](#-database-models)
- [API Endpoints](#-api-endpoints)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Testing](#-testing)
- [Deployment](#-deployment)

## ✨ Features

### 🗺️ Zone Management
- **Zone Creation**: Create delivery zones with specific areas and pincodes
- **Dynamic Pricing**: Set zone-specific delivery charges
- **Coverage Mapping**: Define coverage areas and delivery times
- **Status Management**: Active, inactive, and maintenance modes
- **Performance Tracking**: Monitor zone-specific metrics

### 👥 Personnel Management
- **Rider Management**: Add, edit, and manage delivery personnel
- **Zone Assignment**: Assign riders to specific zones
- **Vehicle Tracking**: Track vehicle types and numbers
- **Performance Metrics**: Monitor ratings, delivery times, and earnings
- **Status Monitoring**: On-duty, off-duty, active, suspended statuses
- **Location Tracking**: Real-time GPS location updates

### 📍 Live Tracking
- **Real-time Monitoring**: Track active deliveries in real-time
- **Status Updates**: Assigned, picked up, in transit, delivered, delayed
- **Location Tracking**: Current location of delivery personnel
- **ETA Management**: Estimated delivery times and delays
- **Priority Management**: High, normal, low priority orders
- **Delay Handling**: Automatic delay detection and management

### 📊 Performance Analytics
- **Comprehensive Metrics**: Delivery times, completion rates, customer satisfaction
- **Zone Performance**: Compare performance across different zones
- **Personnel Analytics**: Individual rider performance metrics
- **Time Analytics**: Hourly delivery patterns and trends
- **Revenue Analytics**: Delivery charge revenue and trends
- **Customer Satisfaction**: Rating analysis and feedback

## 🏗️ Architecture

### Backend Structure
```
Backend/src/
├── models/
│   ├── Zone.js                 # Delivery zones
│   ├── DeliveryPersonnel.js    # Delivery riders
│   ├── Delivery.js             # Delivery tracking
│   └── DeliveryAnalytics.js    # Performance analytics
├── controllers/delivery/
│   ├── zoneController.js       # Zone management
│   ├── personnelController.js  # Personnel management
│   ├── trackingController.js   # Live tracking
│   └── analyticsController.js  # Performance analytics
├── routes/delivery/
│   ├── zones.js               # Zone API routes
│   ├── personnel.js           # Personnel API routes
│   ├── tracking.js            # Tracking API routes
│   └── analytics.js           # Analytics API routes
└── middleware/
    └── validation.js          # Input validation
```

### Frontend Structure
```
frontent/src/
├── components/superadmin/delivery/
│   ├── ZoneManagement.jsx      # Zone management UI
│   ├── PersonnelManagement.jsx # Personnel management UI
│   ├── LiveTracking.jsx        # Live tracking UI
│   └── PerformanceAnalytics.jsx # Analytics UI
├── services/api/
│   └── deliveryApi.js          # API service layer
└── utils/
    └── currency.js             # Nepali currency formatting
```

## 🗄️ Database Models

### Zone Model
```javascript
{
  name: String,                 // Zone name
  description: String,          // Zone description
  areas: [String],             // Covered areas
  pincodes: [String],          // Covered pincodes
  deliveryCharge: Number,      // Delivery charge in Rs.
  status: String,              // active, inactive, maintenance
  coverage: String,            // Coverage radius
  estimatedDeliveryTime: String, // Estimated delivery time
  coordinates: Object,         // GPS coordinates
  restaurantCount: Number,     // Number of restaurants
  orderCount: Number,          // Total orders
  totalRevenue: Number         // Total revenue
}
```

### DeliveryPersonnel Model
```javascript
{
  name: String,                // Personnel name
  email: String,               // Email address
  phone: String,               // Phone number
  employeeId: String,          // Employee ID
  status: String,              // active, inactive, on_duty, off_duty, suspended
  zone: ObjectId,              // Assigned zone
  vehicleType: String,         // Motorcycle, Bicycle, Car, Scooter, E-bike
  vehicleNumber: String,       // Vehicle number
  rating: Number,              // Customer rating (1-5)
  totalDeliveries: Number,     // Total deliveries
  completedDeliveries: Number, // Completed deliveries
  averageDeliveryTime: Number, // Average delivery time
  earnings: Number,            // Total earnings
  currentLocation: Object,     // GPS location
  isOnline: Boolean           // Online status
}
```

### Delivery Model
```javascript
{
  orderId: ObjectId,           // Order reference
  orderNumber: String,         // Order number
  customer: Object,            // Customer information
  deliveryAddress: Object,     // Delivery address
  restaurant: Object,          // Restaurant information
  deliveryPersonnel: Object,   // Assigned personnel
  zone: Object,                // Delivery zone
  status: String,              // Delivery status
  priority: String,            // Priority level
  currentLocation: Object,     // Current location
  estimatedDelivery: Date,     // Estimated delivery time
  actualDelivery: Date,        // Actual delivery time
  orderValue: Number,          // Order value
  deliveryCharge: Number,      // Delivery charge
  totalAmount: Number,         // Total amount
  isDelayed: Boolean,          // Delay status
  delayReason: String          // Delay reason
}
```

### DeliveryAnalytics Model
```javascript
{
  date: Date,                  // Analytics date
  hour: Number,                // Hour of day
  zone: Object,                // Zone information
  personnel: Object,           // Personnel information
  totalDeliveries: Number,     // Total deliveries
  completedDeliveries: Number, // Completed deliveries
  averageDeliveryTime: Number, // Average delivery time
  onTimeDeliveries: Number,    // On-time deliveries
  totalRevenue: Number,        // Total revenue
  averageRating: Number,       // Average customer rating
  efficiency: Number           // Performance efficiency
}
```

## 🔌 API Endpoints

### Zone Management
```http
GET    /api/v1/superadmin/delivery/zones              # Get all zones
GET    /api/v1/superadmin/delivery/zones/stats        # Get zone statistics
GET    /api/v1/superadmin/delivery/zones/:zoneId      # Get zone by ID
POST   /api/v1/superadmin/delivery/zones              # Create new zone
PUT    /api/v1/superadmin/delivery/zones/:zoneId      # Update zone
DELETE /api/v1/superadmin/delivery/zones/:zoneId      # Delete zone
GET    /api/v1/superadmin/delivery/zones/area/:area   # Find zone by area
GET    /api/v1/superadmin/delivery/zones/pincode/:pincode # Find zone by pincode
```

### Personnel Management
```http
GET    /api/v1/superadmin/delivery/personnel                    # Get all personnel
GET    /api/v1/superadmin/delivery/personnel/stats              # Get personnel statistics
GET    /api/v1/superadmin/delivery/personnel/:personnelId       # Get personnel by ID
POST   /api/v1/superadmin/delivery/personnel                    # Create new personnel
PUT    /api/v1/superadmin/delivery/personnel/:personnelId       # Update personnel
DELETE /api/v1/superadmin/delivery/personnel/:personnelId       # Delete personnel
PUT    /api/v1/superadmin/delivery/personnel/:personnelId/status # Update status
PUT    /api/v1/superadmin/delivery/personnel/:personnelId/location # Update location
```

### Live Tracking
```http
GET    /api/v1/superadmin/delivery/tracking/active              # Get active deliveries
GET    /api/v1/superadmin/delivery/tracking/stats               # Get tracking statistics
GET    /api/v1/superadmin/delivery/tracking/:deliveryId         # Get delivery by ID
PUT    /api/v1/superadmin/delivery/tracking/:deliveryId/status  # Update status
PUT    /api/v1/superadmin/delivery/tracking/:deliveryId/location # Update location
PUT    /api/v1/superadmin/delivery/tracking/:deliveryId/delay   # Add delay
GET    /api/v1/superadmin/delivery/tracking/history             # Get delivery history
GET    /api/v1/superadmin/delivery/tracking/delayed             # Get delayed deliveries
```

### Performance Analytics
```http
GET    /api/v1/superadmin/delivery/analytics/overall            # Get overall statistics
GET    /api/v1/superadmin/delivery/analytics/zones              # Get zone performance
GET    /api/v1/superadmin/delivery/analytics/personnel          # Get personnel performance
GET    /api/v1/superadmin/delivery/analytics/time               # Get time analytics
GET    /api/v1/superadmin/delivery/analytics/trends             # Get delivery trends
GET    /api/v1/superadmin/delivery/analytics/top-zones          # Get top zones
GET    /api/v1/superadmin/delivery/analytics/top-personnel      # Get top personnel
GET    /api/v1/superadmin/delivery/analytics/revenue            # Get revenue analytics
GET    /api/v1/superadmin/delivery/analytics/satisfaction       # Get customer satisfaction
GET    /api/v1/superadmin/delivery/analytics/report             # Generate report
```

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Redis (optional, for caching)

### Backend Setup
```bash
# Navigate to backend directory
cd Backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
nano .env
```

### Environment Configuration
```env
# Database
MONGODB_URI=mongodb://localhost:27017/food_delivery

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Server
PORT=5000
NODE_ENV=development

# CORS
CLIENT_URL=http://localhost:3000
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontent

# Install dependencies
npm install

# Start development server
npm start
```

## ⚙️ Configuration

### Database Seeding
```bash
# Seed sample delivery data
cd Backend
node scripts/seedDeliveryData.js
```

### Zone Configuration
```javascript
// Example zone configuration
const zone = {
  name: 'Zone A - Kathmandu Valley',
  areas: ['Kathmandu', 'Lalitpur', 'Bhaktapur'],
  pincodes: ['44600', '44700', '44800'],
  deliveryCharge: 50, // Rs. 50
  coverage: '15km radius',
  estimatedDeliveryTime: '30-45 minutes'
};
```

### Personnel Configuration
```javascript
// Example personnel configuration
const personnel = {
  name: 'Rajesh Thapa',
  email: 'rajesh.thapa@delivery.com',
  phone: '+9779841234567',
  employeeId: 'EMP001',
  zone: 'zoneId',
  vehicleType: 'Motorcycle',
  vehicleNumber: 'Ba-01-1234',
  baseSalary: 25000,
  commissionRate: 0.15
};
```

## 📱 Usage

### SuperAdmin Dashboard
1. **Zone Management**: Create and manage delivery zones
2. **Personnel Management**: Add and manage delivery riders
3. **Live Tracking**: Monitor active deliveries in real-time
4. **Performance Analytics**: View comprehensive performance metrics

### Restaurant Panel
1. **Order Management**: View orders with delivery charges and zones
2. **Delivery Information**: See customer zone and delivery charges
3. **Status Updates**: Track delivery status and personnel

### API Integration
```javascript
// Example API usage
import { zoneApi, personnelApi, trackingApi, analyticsApi } from './services/api/deliveryApi';

// Get all zones
const zones = await zoneApi.getAllZones();

// Get active deliveries
const deliveries = await trackingApi.getActiveDeliveries();

// Get performance analytics
const analytics = await analyticsApi.getOverallStats('week');
```

## 🧪 Testing

### Backend Testing
```bash
# Run backend tests
cd Backend
npm test

# Test specific endpoints
npm run test:zones
npm run test:personnel
npm run test:tracking
npm run test:analytics
```

### Frontend Testing
```bash
# Run frontend tests
cd frontent
npm test

# Test delivery components
npm run test:delivery
```

### API Testing with Postman
```bash
# Import Postman collection
# File: Backend/postman/Delivery_Management_API.postman_collection.json

# Test endpoints
GET http://localhost:5000/api/v1/superadmin/delivery/zones
GET http://localhost:5000/api/v1/superadmin/delivery/personnel
GET http://localhost:5000/api/v1/superadmin/delivery/tracking/active
GET http://localhost:5000/api/v1/superadmin/delivery/analytics/overall
```

## 🚀 Deployment

### Production Deployment
```bash
# Build frontend
cd frontent
npm run build

# Start backend
cd Backend
npm start

# Or use PM2
pm2 start ecosystem.config.js
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build individually
docker build -t delivery-backend ./Backend
docker build -t delivery-frontend ./frontent
```

## 📊 Monitoring

### Performance Metrics
- **Delivery Time**: Average delivery time per zone
- **Completion Rate**: Percentage of successful deliveries
- **Customer Satisfaction**: Average customer ratings
- **Revenue**: Total delivery charges collected
- **Efficiency**: Overall system efficiency

### Real-time Monitoring
- **Active Deliveries**: Number of deliveries in progress
- **Delayed Deliveries**: Deliveries running behind schedule
- **Online Personnel**: Number of available riders
- **Zone Coverage**: Delivery coverage by zone

## 🔧 Maintenance

### Database Maintenance
```bash
# Backup database
mongodump --db food_delivery --out backup/

# Restore database
mongorestore --db food_delivery backup/food_delivery/

# Clean old analytics data
node scripts/cleanup-analytics.js
```

### Performance Optimization
- **Indexing**: Ensure proper database indexes
- **Caching**: Use Redis for frequently accessed data
- **Pagination**: Implement pagination for large datasets
- **Compression**: Enable gzip compression for API responses

## 🆘 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod
```

#### API Errors
```bash
# Check server logs
tail -f Backend/logs/app.log

# Test API endpoints
curl http://localhost:5000/health
```

#### Frontend Issues
```bash
# Clear cache
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

For support and questions:
- **Documentation**: Check API documentation at `/api/docs`
- **Logs**: Check server logs for error details
- **Issues**: Report issues with detailed error messages

## 🎯 Future Enhancements

### Planned Features
- **GPS Integration**: Real-time GPS tracking
- **Route Optimization**: Optimal delivery route calculation
- **Mobile App**: Delivery personnel mobile app
- **Push Notifications**: Real-time notifications
- **Advanced Analytics**: Machine learning insights
- **Multi-language Support**: Multiple language support

### Performance Improvements
- **WebSocket Integration**: Real-time updates
- **Caching Strategy**: Advanced caching mechanisms
- **Database Optimization**: Query optimization
- **Load Balancing**: Horizontal scaling support

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

**Built with ❤️ for efficient food delivery management**
