# HypeBridge Customer App

A React Native customer application for the HypeBridge food delivery platform.

## Features

- **User Registration**: Full registration with name, email, phone, and password
- **User Login**: Secure login with email validation
- **Dashboard**: Overview of user stats and quick actions
- **Authentication Context**: Centralized authentication state management
- **API Integration**: Connected to HypeBridge backend API
- **Responsive Design**: Optimized for mobile devices

## Installation

1. Install dependencies:
```bash
npm install
```

2. Make sure the backend server is running on `http://localhost:5000`

3. Start the Expo development server:
```bash
npm start
```

## Project Structure

```
customer/
├── src/
│   ├── components/          # Reusable components
│   │   └── Header.js       # Header component
│   ├── context/            # React Context providers
│   │   └── AuthContext.js  # Authentication context
│   ├── navigation/          # Navigation components
│   │   ├── AuthNavigator.js # Authentication screens
│   │   └── AppNavigator.js  # Main app screens
│   ├── screens/            # Screen components
│   │   ├── LoginScreen.js   # Login screen
│   │   ├── RegisterScreen.js # Registration screen
│   │   └── DashboardScreen.js # Main dashboard
│   └── services/           # API services
│       └── api.js          # API client
├── App.js                  # Main app component
└── package.json           # Dependencies
```

## API Endpoints Used

The app connects to the HypeBridge backend customer authentication endpoints:

- `POST /api/customer/auth/register` - Customer registration
- `POST /api/customer/auth/login` - Customer login  
- `GET /api/customer/auth/me` - Get customer profile
- `PUT /api/customer/auth/profile` - Update profile
- `POST /api/customer/auth/address` - Add address
- `PUT /api/customer/auth/change-password` - Change password

## Usage

### Registration
- Users can register by providing:
  - Full Name
  - Email Address
  - Phone Number
  - Password (minimum 6 characters)
  - Password Confirmation

### Login
- Users can login with:
  - Email Address
  - Password

### Dashboard
- View user statistics (orders, loyalty points, total spent)
- Quick access to main features
- Account management options

## Authentication Flow

1. App checks for stored authentication token on startup
2. If token exists and is valid, user is automatically logged in
3. If no token or invalid token, user sees login/register screen
4. After successful login/registration, token is stored securely
5. User can logout which clears stored authentication data

## Development

### Starting the App
```bash
# Start Expo development server
npm start

# For Android
npm run android

# For iOS  
npm run ios

# For Web
npm run web
```

### Modifying the Backend URL
Update the `BASE_URL` in `src/services/api.js` to point to your backend server.

## Dependencies

- React Native & Expo
- React Navigation (Stack Navigator)
- Axios (HTTP client)
- AsyncStorage (Secure storage)
- React Context (State management)
- Expo Vector Icons (Icons)

## Security Features

- JWT token based authentication
- Secure token storage using AsyncStorage
- Password validation (minimum length)
- Email validation
- Phone number validation
- Automatic token refresh handling
- Protected routes requiring authentication

## Next Steps

- Add restaurant listing screens
- Implement order management
- Add payment integration
- Implement push notifications
- Add profile management
- Implement address management

