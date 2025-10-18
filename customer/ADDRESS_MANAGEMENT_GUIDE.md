# Address Management Feature

## Overview
This document describes the newly implemented address management feature that allows users to manually add, edit, and delete delivery addresses.

## Features Implemented

### Customer Mobile App

#### 1. **Address Management Screen** (`AddressManagementScreen.js`)
- View all saved addresses
- Display addresses with type indicators (Home, Work, Other)
- Edit existing addresses
- Delete addresses with confirmation
- Pull-to-refresh functionality
- Empty state when no addresses exist
- Visual indicators for different address types with color coding

#### 2. **Add/Edit Address Screen** (`AddAddressScreen.js`)
- Add new addresses
- Edit existing addresses
- Address type selection (Home, Work, Other)
- Comprehensive form fields:
  - Type (Home/Work/Other)
  - Label (Optional custom name)
  - Street Address (Required)
  - Apartment/Suite/Unit (Optional)
  - City (Required)
  - State/Province (Required)
  - Zip/Postal Code (Required)
  - Country (Defaults to Nepal)
  - Delivery Instructions (Optional)
- Form validation
- Visual feedback with icons
- Save and update functionality

#### 3. **Profile Integration**
- Added "Manage Addresses" option in Profile Screen
- Located in Account section
- Easy access to address management

#### 4. **Navigation Updates**
- Integrated address screens into navigation stack
- Proper screen transitions and back navigation
- Consistent header styling

### API Integration

#### Frontend API Service (`api.js`)
New `addressAPI` object with the following methods:
- `getAllAddresses()` - Get all user addresses
- `getAddress(addressId)` - Get single address
- `addAddress(addressData)` - Add new address
- `updateAddress(addressId, addressData)` - Update address
- `deleteAddress(addressId)` - Delete address

### Backend Implementation

#### 1. **Database Models Updated**

**User Model** (`Backend/src/models/User.js`):
```javascript
addresses: [{
  type: { type: String, enum: ['home', 'work', 'other'], default: 'other' },
  label: { type: String },
  street: { type: String, required: true },
  apartment: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, default: 'Nepal' },
  instructions: { type: String },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  }
}]
```

**Customer Model** (`Backend/src/models/Customer.js`):
- Updated with same address structure as User model
- Added `apartment`, `label`, `instructions`, and `country` fields
- Removed `name` field (replaced with optional `label`)

#### 2. **Backend Controllers**

**User Controller** (`Backend/src/controllers/userController.js`):
- `getAllAddresses()` - Get all addresses for logged-in user
- `getAddress()` - Get single address by ID
- `addAddress()` - Add new address
- `updateAddress()` - Update existing address
- `deleteAddress()` - Delete address

**Customer Auth Controller** (`Backend/src/controllers/customerAuthController.js`):
- `getAllCustomerAddresses()` - Get all customer addresses
- `getCustomerAddress()` - Get single customer address
- `addNewCustomerAddress()` - Add new customer address
- `updateCustomerAddress()` - Update customer address
- `deleteCustomerAddress()` - Delete customer address
  - Automatically handles default address reassignment

#### 3. **Backend Routes**

**Auth Routes** (`Backend/src/routes/auth.js`):
```
GET    /api/v1/auth/addresses
POST   /api/v1/auth/addresses
GET    /api/v1/auth/addresses/:addressId
PUT    /api/v1/auth/addresses/:addressId
DELETE /api/v1/auth/addresses/:addressId
```

**Customer Auth Routes** (`Backend/src/routes/customerAuth.js`):
```
GET    /api/v1/customer/auth/addresses
POST   /api/v1/customer/auth/addresses
GET    /api/v1/customer/auth/addresses/:addressId
PUT    /api/v1/customer/auth/addresses/:addressId
DELETE /api/v1/customer/auth/addresses/:addressId
```

**User Routes** (`Backend/src/routes/users.js`):
```
GET    /api/v1/users/addresses/all
POST   /api/v1/users/addresses
GET    /api/v1/users/addresses/:addressId
PUT    /api/v1/users/addresses/:addressId
DELETE /api/v1/users/addresses/:addressId
```

## User Flow

1. **Accessing Address Management**:
   - User navigates to Profile screen
   - Taps on "Manage Addresses" option
   - Views all saved addresses

2. **Adding a New Address**:
   - Tap "Add New Address" button
   - Select address type (Home/Work/Other)
   - Fill in required fields (street, city, state, zip)
   - Optionally add label, apartment, and delivery instructions
   - Tap "Save Address"
   - Address is saved and user returns to address list

3. **Editing an Address**:
   - Tap edit icon on an address card
   - Modify desired fields
   - Tap "Update Address"
   - Changes are saved

4. **Deleting an Address**:
   - Tap delete icon on an address card
   - Confirm deletion in alert dialog
   - Address is removed from list

## API Endpoints

### Customer Auth Endpoints (Recommended for Mobile App)

#### Get All Addresses
```
GET /api/v1/customer/auth/addresses
Headers: Authorization: Bearer {token}
Response: {
  success: true,
  data: [addresses array]
}
```

#### Add Address
```
POST /api/v1/customer/auth/addresses
Headers: Authorization: Bearer {token}
Body: {
  type: "home" | "work" | "other",
  label: "Optional label",
  street: "Required street address",
  apartment: "Optional apartment/unit",
  city: "Required city",
  state: "Required state",
  zipCode: "Required zip code",
  country: "Nepal",
  instructions: "Optional delivery instructions"
}
Response: {
  success: true,
  message: "Address added successfully",
  data: {address object}
}
```

#### Update Address
```
PUT /api/v1/customer/auth/addresses/:addressId
Headers: Authorization: Bearer {token}
Body: {fields to update}
Response: {
  success: true,
  message: "Address updated successfully",
  data: {updated address}
}
```

#### Delete Address
```
DELETE /api/v1/customer/auth/addresses/:addressId
Headers: Authorization: Bearer {token}
Response: {
  success: true,
  message: "Address deleted successfully"
}
```

## Design Features

### Visual Design
- **Color-coded address types**:
  - Home: Primary Orange (#fc8019)
  - Work: Success Green (#26a69a)
  - Other: Warning Orange (#ff9800)
- Icon-based UI for intuitive interaction
- Card-based layout for addresses
- Consistent with app's design language

### User Experience
- Form validation with helpful error messages
- Loading states for async operations
- Pull-to-refresh on address list
- Confirmation dialogs for destructive actions
- Empty state messaging
- Responsive design for different screen sizes

## Technical Details

### State Management
- Uses React hooks (useState, useEffect, useCallback)
- `useFocusEffect` to refresh addresses when screen gains focus
- Proper error handling and user feedback

### Authentication
- All endpoints require authentication
- JWT token automatically attached via axios interceptor
- Proper 401 handling for expired tokens

### Data Validation
- Frontend: Form validation before submission
- Backend: Field validation in controller
- Required fields enforced at database level

## Future Enhancements

Potential improvements for the address management feature:

1. **Location Services**:
   - Add map integration for address selection
   - Auto-fill address from GPS coordinates
   - Show address on map

2. **Default Address**:
   - Mark addresses as default
   - Use default address for quick checkout

3. **Address Verification**:
   - Integrate with address verification API
   - Validate addresses before saving

4. **Recent Addresses**:
   - Show recently used addresses
   - Quick access to frequent delivery locations

5. **Address Search**:
   - Search through saved addresses
   - Filter by type or location

## Testing

To test the address management feature:

1. **Start the Backend Server**:
   ```bash
   cd Backend
   npm start
   ```

2. **Start the Customer App**:
   ```bash
   cd customer
   npm start
   ```

3. **Test Flow**:
   - Login to the app
   - Navigate to Profile
   - Tap "Manage Addresses"
   - Add a new address
   - Edit an existing address
   - Delete an address
   - Verify data persistence

## Troubleshooting

### Common Issues

1. **Addresses not loading**:
   - Check backend server is running
   - Verify API endpoint URL in constants.js
   - Check authentication token is valid

2. **Save/Update failing**:
   - Ensure all required fields are filled
   - Check network connectivity
   - Verify backend routes are registered

3. **Navigation errors**:
   - Clear app cache and restart
   - Check navigation stack configuration
   - Verify screen imports in TabNavigator.js

## Files Modified/Created

### Customer App (Frontend)
- ✅ `customer/src/screens/AddressManagementScreen.js` (New)
- ✅ `customer/src/screens/AddAddressScreen.js` (New)
- ✅ `customer/src/services/api.js` (Modified)
- ✅ `customer/src/navigation/TabNavigator.js` (Modified)
- ✅ `customer/src/screens/ProfileScreen.js` (Modified)

### Backend
- ✅ `Backend/src/models/User.js` (Modified)
- ✅ `Backend/src/models/Customer.js` (Modified)
- ✅ `Backend/src/controllers/userController.js` (Modified)
- ✅ `Backend/src/controllers/customerAuthController.js` (Modified)
- ✅ `Backend/src/routes/auth.js` (Modified)
- ✅ `Backend/src/routes/customerAuth.js` (Modified)
- ✅ `Backend/src/routes/users.js` (Modified)

## Conclusion

The address management feature is now fully implemented and ready for use. Users can easily manage their delivery addresses with a clean, intuitive interface, and the backend properly stores and validates all address data.

