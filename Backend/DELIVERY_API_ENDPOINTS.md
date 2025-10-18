# Delivery Management API Endpoints

This document outlines all the API endpoints required for the delivery management system.

## Base URL
```
http://your-backend-url/api/v1
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Zone Management Endpoints

### 1. Get All Zones
```http
GET /superadmin/delivery/zones
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ZONE001",
      "name": "Zone A - West Bay",
      "description": "West Bay, Diplomatic Area, Al Dafna",
      "areas": ["West Bay", "Diplomatic Area", "Al Dafna", "Al Sadd"],
      "pincodes": ["12345", "12346", "12347"],
      "deliveryCharge": 5,
      "status": "active",
      "restaurantCount": 15,
      "orderCount": 1250,
      "totalRevenue": 6250,
      "coverage": "5km radius",
      "estimatedDeliveryTime": "25-35 minutes",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 2. Get Zone by ID
```http
GET /superadmin/delivery/zones/:zoneId
```

### 3. Create New Zone
```http
POST /superadmin/delivery/zones
```

**Request Body:**
```json
{
  "name": "Zone E - New Area",
  "description": "New delivery zone description",
  "areas": ["Area 1", "Area 2"],
  "pincodes": ["12345", "12346"],
  "deliveryCharge": 8,
  "coverage": "6km radius",
  "estimatedDeliveryTime": "30-40 minutes"
}
```

### 4. Update Zone
```http
PUT /superadmin/delivery/zones/:zoneId
```

### 5. Delete Zone
```http
DELETE /superadmin/delivery/zones/:zoneId
```

### 6. Get Zone Statistics
```http
GET /superadmin/delivery/zones/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalZones": 4,
    "activeZones": 3,
    "totalDeliveryCharges": 42020,
    "averageCharge": 9.5,
    "totalOrders": 4680,
    "monthlyGrowth": 18.5
  }
}
```

---

## Personnel Management Endpoints

### 1. Get All Personnel
```http
GET /superadmin/delivery/personnel
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "PERS001",
      "name": "Ahmed Hassan",
      "email": "ahmed.hassan@delivery.com",
      "phone": "+974 1234 5678",
      "employeeId": "EMP001",
      "status": "on_duty",
      "zone": "zone_a",
      "zoneName": "Zone A - West Bay",
      "rating": 4.8,
      "totalDeliveries": 1250,
      "completedDeliveries": 1200,
      "cancelledDeliveries": 50,
      "averageDeliveryTime": 28,
      "vehicleType": "Motorcycle",
      "vehicleNumber": "Q-1234",
      "joinDate": "2023-01-15",
      "lastActive": "2024-01-15T14:30:00Z",
      "currentLocation": "West Bay, Doha",
      "isOnline": true,
      "earnings": 15600,
      "performance": "excellent"
    }
  ]
}
```

### 2. Get Personnel by ID
```http
GET /superadmin/delivery/personnel/:personnelId
```

### 3. Create New Personnel
```http
POST /superadmin/delivery/personnel
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@delivery.com",
  "phone": "+974 1234 5678",
  "zone": "zone_a",
  "vehicleType": "Motorcycle",
  "vehicleNumber": "Q-1234"
}
```

### 4. Update Personnel
```http
PUT /superadmin/delivery/personnel/:personnelId
```

### 5. Delete Personnel
```http
DELETE /superadmin/delivery/personnel/:personnelId
```

### 6. Update Personnel Status
```http
PUT /superadmin/delivery/personnel/:personnelId/status
```

**Request Body:**
```json
{
  "status": "on_duty"
}
```

### 7. Get Personnel Statistics
```http
GET /superadmin/delivery/personnel/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPersonnel": 4,
    "activePersonnel": 3,
    "onDutyPersonnel": 2,
    "averageRating": 4.7,
    "totalDeliveries": 4430,
    "monthlyGrowth": 12.5
  }
}
```

---

## Live Tracking Endpoints

### 1. Get Active Deliveries
```http
GET /superadmin/delivery/tracking/active
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "DEL001",
      "orderId": "ORD001",
      "customerName": "Ahmed Hassan",
      "customerPhone": "+974 1234 5678",
      "customerAddress": "West Bay, Building 123, Apartment 45",
      "restaurantName": "Pizza Palace",
      "restaurantAddress": "Al Sadd, Shop 12",
      "deliveryPersonnel": "Omar Khaled",
      "personnelPhone": "+974 3456 7890",
      "personnelId": "PERS003",
      "status": "in_transit",
      "assignedAt": "2024-01-15T14:30:00Z",
      "pickedUpAt": "2024-01-15T14:45:00Z",
      "estimatedDelivery": "2024-01-15T15:15:00Z",
      "currentLocation": "Al Sadd, Doha",
      "destination": "West Bay, Doha",
      "distance": 8.5,
      "estimatedTimeRemaining": 15,
      "orderValue": 125.50,
      "deliveryCharge": 5,
      "totalAmount": 130.50,
      "paymentMethod": "Credit Card",
      "specialInstructions": "Ring doorbell twice",
      "zone": "Zone A - West Bay",
      "priority": "normal",
      "isDelayed": false,
      "delayReason": null
    }
  ]
}
```

### 2. Get Delivery by ID
```http
GET /superadmin/delivery/tracking/:deliveryId
```

### 3. Update Delivery Status
```http
PUT /superadmin/delivery/tracking/:deliveryId/status
```

**Request Body:**
```json
{
  "status": "delivered"
}
```

### 4. Get Tracking Statistics
```http
GET /superadmin/delivery/tracking/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activeDeliveries": 4,
    "completedToday": 45,
    "averageDeliveryTime": 32,
    "onTimeDeliveries": 38,
    "delayedDeliveries": 7,
    "totalDistance": 31.0
  }
}
```

### 5. Get Delivery History
```http
GET /superadmin/delivery/tracking/history
```

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `status`: Filter by status
- `zone`: Filter by zone
- `personnel`: Filter by personnel ID

---

## Performance Analytics Endpoints

### 1. Get Overall Statistics
```http
GET /superadmin/delivery/analytics/overall?dateRange=week
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDeliveries": 4680,
    "completedDeliveries": 4450,
    "cancelledDeliveries": 230,
    "averageDeliveryTime": 32,
    "onTimeRate": 94.5,
    "customerSatisfaction": 4.7,
    "totalRevenue": 42020,
    "averageOrderValue": 89.5
  }
}
```

### 2. Get Zone Performance
```http
GET /superadmin/delivery/analytics/zones?dateRange=week
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "zone": "Zone A - West Bay",
      "totalDeliveries": 1250,
      "completedDeliveries": 1200,
      "averageTime": 28,
      "onTimeRate": 96.2,
      "customerRating": 4.8,
      "revenue": 12500,
      "efficiency": 95.2
    }
  ]
}
```

### 3. Get Personnel Performance
```http
GET /superadmin/delivery/analytics/personnel?dateRange=week
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "PERS001",
      "name": "Ahmed Hassan",
      "zone": "Zone A - West Bay",
      "totalDeliveries": 1250,
      "completedDeliveries": 1200,
      "averageTime": 28,
      "onTimeRate": 96.2,
      "customerRating": 4.8,
      "earnings": 15600,
      "efficiency": 95.2,
      "performance": "excellent"
    }
  ]
}
```

### 4. Get Time Analytics
```http
GET /superadmin/delivery/analytics/time?dateRange=week
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "hour": "09:00",
      "deliveries": 45,
      "averageTime": 25
    }
  ]
}
```

### 5. Get Delivery Trends
```http
GET /superadmin/delivery/analytics/trends?dateRange=week
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "deliveries": 120,
      "revenue": 10800
    }
  ]
}
```

### 6. Get Top Performing Zones
```http
GET /superadmin/delivery/analytics/top-zones?limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "zone": "Zone D - City Center",
      "efficiency": 96.8,
      "deliveries": 890
    }
  ]
}
```

### 7. Get Top Performing Personnel
```http
GET /superadmin/delivery/analytics/top-personnel?limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Omar Khaled",
      "efficiency": 96.8,
      "deliveries": 1450,
      "rating": 4.9
    }
  ]
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Notes

1. All dates should be in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
2. All monetary values should be in Nepali Rupees (Rs.)
3. All endpoints support pagination with `page` and `limit` query parameters
4. All endpoints support filtering and sorting
5. Real-time updates can be implemented using WebSocket connections
6. All endpoints should include proper validation and error handling
