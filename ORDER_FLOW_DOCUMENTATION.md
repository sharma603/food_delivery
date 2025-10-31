# Order Flow Documentation - Customer to Restaurant

## Complete Order Lifecycle Flow

### 1. Customer Places Order
- **Status**: `placed` or `pending`
- **Action**: Customer completes order through mobile app/website
- **Order Details**:
  - Items selected
  - Delivery address
  - Payment method
  - Special instructions

---

### 2. Order Reaches Restaurant Portal
- **Status**: `placed` or `pending`
- **Location**: Restaurant Orders Management Dashboard
- **What Restaurant Sees**:
  - Order number
  - Customer name, phone, address
  - Order items and quantities
  - Total amount
  - Delivery zone
  - Order timestamp

---

### 3. Restaurant Actions (First Steps)

#### **Action 1: Start Preparing** ✅
- **When**: Order status is `pending` or `placed`
- **What Happens**:
  - Order automatically gets confirmed
  - Status changes to `preparing`
  - Restaurant starts cooking/preparing the food
- **UI Button**: Orange "Start Preparing" button (Package icon)

#### **Action 2: Cancel Order** ✅
- **When**: Order status is `pending` or `placed` (before starting preparation)
- **What Happens**:
  - Order status changes to `cancelled`
  - Customer is notified
- **UI Button**: Red "Cancel Order" button (X icon)
- **Restrictions**: 
  - ❌ Cannot cancel after starting preparation
  - ❌ Cannot cancel if order is assigned to delivery person
  - ❌ Cannot cancel if order is marked as ready

---

### 4. Order Preparation Phase
- **Status**: `preparing`
- **What Happens**:
  - Restaurant is actively preparing the order
  - Order cannot be cancelled anymore
  - Preparation time is tracked

---

### 5. Mark Order as Ready
- **Status**: `preparing` → `ready`
- **Action**: Restaurant clicks "Mark Ready" button
- **What Happens**:
  - Status changes to `ready`
  - Order is ready for pickup by delivery person
  - All online delivery persons are notified via Socket.IO
  - Customer is notified that order is ready
- **UI Button**: Purple "Mark Ready" button (Alert icon)
- **Important**: 
  - ⚠️ Once marked as ready, restaurant CANNOT change status back
  - ⚠️ Once marked as ready, restaurant CANNOT cancel the order
  - ⚠️ Restaurant cannot change status from ready back to preparing

---

### 6. Delivery Person Picks Up
- **Status**: `ready` → `picked_up`
- **Action**: Delivery person picks up order from restaurant
- **Handled By**: Delivery person (not restaurant)

---

### 7. Order Delivered
- **Status**: `picked_up` → `delivered`
- **Action**: Delivery person delivers to customer
- **Handled By**: Delivery person (not restaurant)

---

## Restaurant Action Summary

### ✅ What Restaurant CAN Do:
1. **Start Preparing** - From `pending`/`placed` status
2. **Cancel Order** - Only from `pending`/`placed` status (before preparation)
3. **Mark Ready** - From `preparing` status

### ❌ What Restaurant CANNOT Do:
1. **Cancel Order** after starting preparation
2. **Cancel Order** if assigned to delivery person
3. **Cancel Order** after marking as ready
4. **Change Status** from ready back to preparing
5. **Change Status** from ready to any previous status
6. **Mark as Delivered** (only delivery person can)
7. **Confirm Orders** (auto-confirmed when starting preparation)
8. **Confirm Selected** (bulk action removed)
9. **Mark Delivered** (bulk action removed)

---

## Order Status Flow Diagram

```
Customer Places Order
        ↓
   [placed/pending]
        ↓
┌───────────────────────┐
│ Restaurant Receives    │
│ Order in Dashboard     │
└───────────────────────┘
        ↓
┌───────────────────────┐
│ FIRST ACTION:         │
│ Choose:               │
│ 1. Start Preparing ✅ │
│ 2. Cancel Order ✅    │
│    (only if not       │
│     assigned yet)     │
└───────────────────────┘
        ↓
   [preparing]
   (Auto-confirmed)
        ↓
┌───────────────────────┐
│ SECOND ACTION:        │
│ Mark Ready ✅         │
│ (Cannot go back)      │
└───────────────────────┘
        ↓
     [ready]
     (No more changes
      allowed by restaurant)
        ↓
   Delivery Person
        ↓
  [picked_up]
        ↓
  [delivered]
```

---

## UI Elements in Restaurant Portal

### Individual Order Actions:
- **Pending/Placed Orders**:
  - ✅ Start Preparing (Orange button)
  - ✅ Cancel Order (Red button)
  - 👁️ View Details (Blue button)
  - 🖨️ Print Order (Green button)

- **Confirmed Orders**:
  - ✅ Start Preparing (Orange button)
  - 👁️ View Details
  - 🖨️ Print Order

- **Preparing Orders**:
  - ✅ Mark Ready (Purple button)
  - 👁️ View Details
  - 🖨️ Print Order

- **Ready Orders**:
  - ❌ No action buttons (status cannot be changed back)
  - 👁️ View Details
  - 🖨️ Print Order

### Bulk Actions (When Multiple Orders Selected):
- ✅ Start Preparing (only if orders are not ready/later)
- ✅ Mark Ready (only if orders are preparing)
- ✅ Cancel Selected (only if orders can be cancelled)
- ❌ Confirm Selected (REMOVED)
- ❌ Mark Delivered (REMOVED)

---

## Key Restrictions Explained

### 1. **Cannot Cancel After Preparation Starts**
- Once restaurant clicks "Start Preparing", order is committed
- This prevents restaurants from cancelling orders mid-preparation
- Protects delivery workflow integrity

### 2. **Cannot Cancel Assigned Orders**
- If delivery person has accepted the order, restaurant cannot cancel
- This prevents disruption of active deliveries
- Contact support for exceptional cases

### 3. **Forward-Only Status Flow**
- Status can only move forward: `placed` → `preparing` → `ready`
- Cannot go backwards from `ready` to `preparing`
- Ensures order progression is tracked correctly

### 4. **Auto-Confirmation on Start Preparing**
- When restaurant starts preparing, order is automatically confirmed
- No separate "Accept/Confirm" step needed
- Streamlines the workflow

---

## Notification Flow

### When Restaurant Starts Preparing:
- Order status: `pending/placed` → `preparing`
- Customer: May receive notification (depends on system)

### When Restaurant Marks Ready:
- Order status: `preparing` → `ready`
- Customer: ✅ Notified that order is ready for pickup
- Delivery Persons: ✅ All online delivery persons notified via Socket.IO
- Order appears in delivery person's available orders list

---

## Best Practices for Restaurants

1. **Review Order Immediately**
   - Check customer details
   - Verify items and special instructions
   - Confirm delivery address is in your zone

2. **Start Preparing Promptly**
   - Click "Start Preparing" as soon as you begin preparing the order
   - This confirms acceptance and starts the timer

3. **Mark Ready When Complete**
   - Only mark as ready when order is fully prepared and packaged
   - Remember: You cannot change this back!
   - Delivery person will be notified immediately

4. **Handle Cancellations Early**
   - Only cancel before starting preparation
   - Contact customer if order needs modification
   - Use cancellation for genuine issues only

---

## Technical Implementation Notes

### Backend Validation:
- Status transitions enforced in `updateOrderStatus` controller
- Explicit checks prevent invalid transitions
- Delivery person assignment checked before cancellation

### Frontend Validation:
- UI buttons conditionally rendered based on order status
- Client-side validation provides immediate feedback
- Server-side validation ensures data integrity

### Real-time Updates:
- Socket.IO notifications for delivery persons
- Customer notifications via email/SMS (if configured)
- Order status updates reflected immediately

---

**Last Updated**: Current Implementation
**Version**: 1.0

