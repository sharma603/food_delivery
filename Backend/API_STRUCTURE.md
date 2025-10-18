# Food Delivery System - API Structure

## Overview
The backend API has been reorganized to separate SuperAdmin and Restaurant APIs to avoid conflicts and provide better organization.

## API Endpoints Structure

### 1. SuperAdmin APIs (`/api/v1/superadmin/`)
All SuperAdmin endpoints require authentication and `super_admin` role authorization.

#### Dashboard
- `GET /api/v1/superadmin/dashboard` - Get dashboard overview

#### Orders Management
- `GET /api/v1/superadmin/orders` - Get all orders
- `GET /api/v1/superadmin/orders/:id` - Get order by ID
- `PUT /api/v1/superadmin/orders/:id` - Update order status
- `GET /api/v1/superadmin/orders/stats` - Get order statistics
- `GET /api/v1/superadmin/orders/analytics` - Get order analytics
- `POST /api/v1/superadmin/orders` - Export orders

#### Restaurant Management
- `GET /api/v1/superadmin/restaurants` - Get all restaurants
- `GET /api/v1/superadmin/restaurants/:id` - Get restaurant by ID
- `POST /api/v1/superadmin/restaurants` - Create restaurant
- `PUT /api/v1/superadmin/restaurants/:id` - Update restaurant
- `DELETE /api/v1/superadmin/restaurants/:id` - Delete restaurant
- `PUT /api/v1/superadmin/restaurants/:id/approve` - Approve restaurant
- `PUT /api/v1/superadmin/restaurants/:id/suspend` - Suspend restaurant

#### User Management
- `GET /api/v1/superadmin/users` - Get all users 
- `GET /api/v1/superadmin/users/:id` - Get user by ID
- `POST /api/v1/superadmin/users` - Create user
- `PUT /api/v1/superadmin/users/:id` - Update user
- `DELETE /api/v1/superadmin/users/:id` - Delete user
- `PUT /api/v1/superadmin/users/:id/suspend` - Suspend user
- `PUT /api/v1/superadmin/users/:id/activate` - Activate user

#### Analytics
- `GET /api/v1/superadmin/analytics/dashboard` - Get dashboard analytics
- `GET /api/v1/superadmin/analytics/revenue` - Get revenue analytics
- `GET /api/v1/superadmin/analytics/orders` - Get order analytics
- `GET /api/v1/superadmin/analytics/restaurants` - Get restaurant analytics
- `GET /api/v1/superadmin/analytics/customers` - Get customer analytics
- `GET /api/v1/superadmin/analytics/system` - Get system analytics
- `GET /api/v1/superadmin/analytics/realtime` - Get real-time metrics

#### Payments
- `GET /api/v1/superadmin/payments` - Get all payments
- `GET /api/v1/superadmin/payments/:id` - Get payment by ID
- `GET /api/v1/superadmin/payments/stats` - Get payment statistics
- `POST /api/v1/superadmin/payments/payouts` - Process payout
- `GET /api/v1/superadmin/payments/payouts` - Get payout history

#### Notifications
- `GET /api/v1/superadmin/notifications` - Get all notifications
- `POST /api/v1/superadmin/notifications` - Create notification
- `POST /api/v1/superadmin/notifications/broadcast` - Send broadcast notification
- `PUT /api/v1/superadmin/notifications/:id` - Update notification
- `DELETE /api/v1/superadmin/notifications/:id` - Delete notification

#### System
- `GET /api/v1/superadmin/system` - Get system settings
- `PUT /api/v1/superadmin/system` - Update system settings

### 2. Restaurant APIs (`/api/v1/restaurant/`)
All Restaurant endpoints require authentication and `restaurant` role authorization.

#### Dashboard
- `GET /api/v1/restaurant/dashboard` - Get restaurant dashboard

#### Orders
- `GET /api/v1/restaurant/orders` - Get restaurant orders
- `GET /api/v1/restaurant/orders/:id` - Get order by ID
- `PUT /api/v1/restaurant/orders/:id` - Update order status
- `PUT /api/v1/restaurant/orders/:id/accept` - Accept order
- `PUT /api/v1/restaurant/orders/:id/reject` - Reject order
- `PUT /api/v1/restaurant/orders/:id/ready` - Mark order as ready
- `GET /api/v1/restaurant/orders/stats` - Get order statistics
- `GET /api/v1/restaurant/orders/history` - Get order history

#### Menu
- `GET /api/v1/restaurant/menu` - Get restaurant menu
- `POST /api/v1/restaurant/menu` - Create menu item
- `PUT /api/v1/restaurant/menu/:id` - Update menu item
- `DELETE /api/v1/restaurant/menu/:id` - Delete menu item

#### Profile
- `GET /api/v1/restaurant/profile` - Get restaurant profile
- `PUT /api/v1/restaurant/profile` - Update restaurant profile
- `PUT /api/v1/restaurant/profile/settings` - Update restaurant settings
- `POST /api/v1/restaurant/profile/image` - Upload restaurant image
- `GET /api/v1/restaurant/profile/stats` - Get restaurant stats

#### Analytics
- `GET /api/v1/restaurant/analytics` - Get restaurant analytics

#### Reviews
- `GET /api/v1/restaurant/reviews` - Get restaurant reviews
- `GET /api/v1/restaurant/reviews/:id` - Get review by ID
- `PUT /api/v1/restaurant/reviews/:id/respond` - Respond to review
- `POST /api/v1/restaurant/reviews/:id/report` - Report review
- `GET /api/v1/restaurant/reviews/stats` - Get review statistics

#### Earnings
- `GET /api/v1/restaurant/earnings` - Get restaurant earnings
- `GET /api/v1/restaurant/earnings/stats` - Get earnings statistics
- `GET /api/v1/restaurant/earnings/history` - Get earnings history
- `POST /api/v1/restaurant/earnings/payouts` - Request payout
- `GET /api/v1/restaurant/earnings/payouts` - Get payout history

#### Settings
- `GET /api/v1/restaurant/settings` - Get restaurant settings
- `PUT /api/v1/restaurant/settings` - Update restaurant settings
- `PUT /api/v1/restaurant/settings/password` - Update password
- `PUT /api/v1/restaurant/settings/notifications` - Update notification settings

### 3. Authentication APIs
- `POST /api/v1/auth/superadmin/login` - SuperAdmin login
- `POST /api/v1/restaurant/auth/login` - Restaurant login
- `POST /api/v1/customer/auth/login` - Customer login

## Frontend API Services

### SuperAdmin API Service (`superadminApi`)
- Located in `frontent/src/services/api/superadminApi.js`
- Handles all SuperAdmin API calls
- Base URL: `/superadmin`

### Restaurant API Service (`restaurantApi`)
- Located in `frontent/src/services/api/restaurantApi.js`
- Handles all Restaurant API calls
- Base URL: `/restaurant`

## Benefits of Separation

1. **No Conflicts**: SuperAdmin and Restaurant APIs are completely separated
2. **Better Organization**: Clear structure for different user roles
3. **Easier Maintenance**: Each role has its own dedicated endpoints
4. **Better Security**: Role-based access control is more granular
5. **Scalability**: Easy to add new features for specific roles
6. **Clear Documentation**: Each API group is well-documented

## Usage Examples

### SuperAdmin Dashboard
```javascript
import { superadminApi } from '../services/api/superadminApi';

// Get dashboard data
const dashboardData = await superadminApi.getDashboardData();

// Get all orders
const orders = await superadminApi.getAllOrders({ page: 1, limit: 10 });

// Get order statistics
const stats = await superadminApi.getOrderStats();
```

### Restaurant Dashboard
```javascript
import { restaurantApi } from '../services/api/restaurantApi';

// Get restaurant dashboard
const dashboardData = await restaurantApi.getDashboardData();

// Get restaurant orders
const orders = await restaurantApi.getRestaurantOrders({ status: 'pending' });

// Update order status
await restaurantApi.updateOrderStatus(orderId, 'preparing');
```

## Migration Notes

- All existing SuperAdmin components now use `superadminApi`
- All Restaurant components should use `restaurantApi`
- Authentication remains the same for both roles
- Role-based middleware ensures proper access control
