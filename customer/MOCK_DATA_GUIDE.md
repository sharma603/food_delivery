# My Orders Screen - Mock Data Guide

## 🎯 Overview

Your **My Orders** screen now includes **mock data** for easy testing and demonstration without requiring backend API or user authentication!

---

## ✨ What's Included

### **6 Sample Orders with Different Statuses:**

1. **🚴 On the Way** - Pizza Palace
   - Order #ORD-12345
   - 2 hours ago
   - Rs 680

2. **✅ Delivered** - Burger Junction  
   - Order #ORD-12344
   - Yesterday
   - Rs 450

3. **👨‍🍳 Preparing** - Sushi Master
   - Order #ORD-12343
   - 30 minutes ago
   - Rs 830

4. **⏱️ Pending** - Taco Fiesta
   - Order #ORD-12342
   - 10 minutes ago
   - Rs 680

5. **✅ Delivered** - Indian Spice
   - Order #ORD-12341
   - 3 days ago
   - Rs 460

6. **❌ Cancelled** - Pasta Paradise
   - Order #ORD-12340
   - 5 days ago
   - Rs 510

---

## 🚀 How to Use Mock Data

### **Enable Mock Data** (Default: ON)

In `OrdersScreen.js`, line 51:
```javascript
const USE_MOCK_DATA = true; // ✅ Mock data enabled
```

### **Disable Mock Data** (Use Real API)

```javascript
const USE_MOCK_DATA = false; // ❌ Mock data disabled, uses real API
```

---

## 🎨 Features You Can Test

### **1. Tab Filtering**
- Tap on different tabs (All, Pending, Preparing, etc.)
- Orders automatically filter by status
- See how many orders are in each category

### **2. Action Buttons**
- **Track** button appears on "Preparing" and "On the Way" orders
- **Cancel** button appears on "Pending" orders  
- **Reorder** button appears on "Delivered" orders

### **3. Progress Bars**
- Visual progress indicator at top of each card
- 25% for Pending
- 50% for Preparing
- 75% for On the Way
- 100% for Delivered

### **4. Order Details**
- Tap any order card to view full details
- Scrollable modal with complete information
- Shows all items, prices, and payment breakdown

### **5. Time Display**
- Relative time: "10 min ago", "2 hours ago", "Yesterday"
- Absolute time: "10:30 AM"
- Smart date formatting

### **6. Pull to Refresh**
- Pull down to refresh orders
- Loading indicator shows
- Orders reload with 500ms delay

---

## 📊 Mock Data Structure

Each order includes:

```javascript
{
  _id: 'order_001',                    // Unique ID
  orderNumber: 'ORD-12345',            // Display number
  status: 'on_the_way',                // Order status
  restaurant: {
    _id: 'rest_001',
    name: 'Pizza Palace',
    image: 'https://...'
  },
  deliveryAddress: '123 Main St...',   // Full address
  items: [
    {
      item: { name: 'Margherita Pizza' },
      quantity: 2,
      price: 250
    }
  ],
  totalAmount: 660,                     // Before tax/fees
  finalAmount: 680,                     // After tax/fees
  tax: 20,
  deliveryFee: 0,
  createdAt: '2024-01-15T10:30:00Z'    // ISO date
}
```

---

## 🎯 Testing Scenarios

### **Test 1: Different Order Statuses**
1. Open Orders screen
2. See "On the Way" order at top
3. Tap "Preparing" tab
4. See Sushi Master order
5. Tap "Delivered" tab
6. See 2 delivered orders

### **Test 2: Action Buttons**
1. Find "On the Way" order (Pizza Palace)
2. Tap "Track" button
3. Will try to navigate to tracking screen

4. Find "Pending" order (Taco Fiesta)
5. Tap "Cancel" button
6. Confirm cancellation dialog appears

7. Find "Delivered" order (Burger Junction)
8. Tap "Reorder" button
9. Confirm reorder dialog appears

### **Test 3: Order Details**
1. Tap any order card
2. Modal slides up from bottom
3. Scroll to see all items
4. See payment breakdown
5. Tap outside or close button to dismiss

### **Test 4: UI Elements**
1. Check progress bars show correct colors
2. Verify restaurant icons appear
3. Check quantity badges on items
4. Verify individual item prices show
5. Check relative time updates

---

## 🔧 Customizing Mock Data

### **Add More Orders**

In `OrdersScreen.js`, find the `getMockOrders()` function and add:

```javascript
{
  _id: 'order_007',
  orderNumber: 'ORD-12339',
  status: 'delivered',
  restaurant: {
    _id: 'rest_007',
    name: 'Your Restaurant',
    image: 'https://via.placeholder.com/100'
  },
  deliveryAddress: 'Your Address',
  items: [
    {
      item: { name: 'Your Item', _id: 'item_017' },
      quantity: 1,
      price: 200
    }
  ],
  totalAmount: 200,
  finalAmount: 220,
  tax: 20,
  deliveryFee: 0,
  createdAt: new Date(Date.now() - 60000).toISOString() // 1 min ago
}
```

### **Change Order Times**

```javascript
// Current time
createdAt: new Date().toISOString()

// 5 minutes ago
createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()

// 1 hour ago
createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()

// Yesterday
createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
```

### **Change Order Status**

Available statuses:
- `'pending'` - Just placed
- `'preparing'` - Restaurant is cooking
- `'on_the_way'` - Out for delivery
- `'delivered'` - Successfully delivered
- `'cancelled'` - Cancelled by user/restaurant

---

## 🎨 Visual Preview

```
┌──────────────────────────────────────────┐
│  My Orders                               │
├──────────────────────────────────────────┤
│ [All] Pending  Preparing  On Way  ✓     │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 75%         │ │
│  │                                    │ │
│  │ #ORD-12345         [🚴 ON THE WAY]│ │
│  │ 2 hours ago • 10:30 AM            │ │
│  │                                    │ │
│  │ 🍽️  Pizza Palace                  │ │
│  │ 📍  123 Main Street, Downtown      │ │
│  │                                    │ │
│  │ [2x] Margherita Pizza    Rs 250   │ │
│  │ [1x] Garlic Bread        Rs 80    │ │
│  │ [2x] Coke (500ml)        Rs 40    │ │
│  │                                    │ │
│  │ Total: Rs 680                      │ │
│  │ [Track] [Reorder]                 │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%        │ │
│  │                                    │ │
│  │ #ORD-12344         [✅ DELIVERED]  │ │
│  │ Yesterday • 02:15 PM              │ │
│  │                                    │ │
│  │ 🍽️  Burger Junction               │ │
│  │ 📍  456 Oak Avenue, Suburb         │ │
│  │                                    │ │
│  │ [1x] Classic Burger      Rs 180   │ │
│  │ [1x] Cheese Fries        Rs 120   │ │
│  │ [1x] Chocolate Shake     Rs 100   │ │
│  │                                    │ │
│  │ Total: Rs 450                      │ │
│  │ [Reorder]                         │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

---

## ⚙️ Switching Between Mock and Real Data

### **For Development (Mock Data):**
```javascript
const USE_MOCK_DATA = true;
```
- ✅ No authentication required
- ✅ No backend needed
- ✅ Instant data loading
- ✅ Perfect for UI testing
- ✅ Demo-ready

### **For Production (Real API):**
```javascript
const USE_MOCK_DATA = false;
```
- ✅ Requires user login
- ✅ Connects to backend API
- ✅ Real order data
- ✅ Live updates
- ✅ Production-ready

---

## 📱 Testing Checklist

- [ ] Screen loads with 6 mock orders
- [ ] All tabs work (All, Pending, Preparing, etc.)
- [ ] Each status shows correct number of orders
- [ ] Progress bars display correctly
- [ ] Action buttons appear for correct statuses
- [ ] Track button works (shows alert or navigates)
- [ ] Cancel button shows confirmation dialog
- [ ] Reorder button shows confirmation dialog
- [ ] Order details modal opens on tap
- [ ] Modal shows all order information
- [ ] Pull to refresh works
- [ ] Relative time displays correctly
- [ ] Item prices show correctly
- [ ] Total amounts are accurate

---

## 🎉 Benefits of Mock Data

1. **No Backend Required** - Test UI without API
2. **No Authentication** - Skip login for testing
3. **Instant Loading** - See data immediately
4. **Consistent Data** - Same data every time
5. **Easy Customization** - Modify data easily
6. **Demo Ready** - Show to clients/stakeholders
7. **UI Testing** - Test all order states
8. **Fast Development** - No API wait time

---

## 🚀 Ready to Use!

Your Orders screen now has beautiful mock data that demonstrates all features:
- ✅ Different order statuses
- ✅ Multiple restaurants
- ✅ Various items and prices
- ✅ Realistic timestamps
- ✅ Complete order details

Just navigate to the Orders screen and see it in action! 

When ready for production, simply change `USE_MOCK_DATA = false` and it will connect to your real API.

---

## 💡 Pro Tips

1. **Demo Mode**: Keep mock data enabled for demos
2. **Testing**: Use mock data to test UI edge cases
3. **Development**: Switch between mock and real data easily
4. **Screenshots**: Use mock data for app store screenshots
5. **Training**: Use mock data to train staff

---

Happy Testing! 🎉

