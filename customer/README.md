# Food Delivery System - Customer Mobile App

A React Native mobile application for customers to order food from restaurants, built with Expo and React Navigation.

## 🚀 Features

- **User Authentication**: Registration, login, forgot password
- **Restaurant Discovery**: Browse restaurants and view menus
- **Order Management**: Place orders, track status, view history
- **Address Management**: Add and manage delivery addresses
- **Shopping Cart**: Add items, modify quantities, checkout
- **Push Notifications**: Order updates and promotions
- **Location Services**: GPS-based restaurant discovery
- **Offline Support**: Basic offline functionality

## 📋 Prerequisites

- Node.js (>= 16.0.0)
- npm (>= 8.0.0)
- Expo CLI
- Android Studio / Xcode (for device testing)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd customer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Create .env file
   echo "EXPO_PUBLIC_SERVER_IP=your-server-ip" > .env
   echo "EXPO_PUBLIC_SERVER_PORT=5000" >> .env
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/emulator**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `EXPO_PUBLIC_SERVER_IP` | Backend server IP address | Yes | `localhost` |
| `EXPO_PUBLIC_SERVER_PORT` | Backend server port | No | `5000` |

### API Configuration

The app connects to the backend API at:
```
http://${SERVER_IP}:${SERVER_PORT}/api/v1
```

## 📱 App Structure

```
customer/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context providers
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # App screens
│   ├── services/       # API services
│   ├── utils/          # Utility functions
│   └── hooks/          # Custom React hooks
├── assets/             # Images and static assets
├── App.js              # Main app component
└── package.json        # Dependencies and scripts
```

## 🔑 Key Features

### Authentication
- **Registration**: Create new customer account
- **Login**: Sign in with email/phone and password
- **Forgot Password**: Reset password via email
- **Profile Management**: Update personal information

### Restaurant & Menu
- **Restaurant List**: Browse available restaurants
- **Menu Items**: View restaurant menus with categories
- **Search**: Search restaurants and menu items
- **Filters**: Filter by cuisine, price, ratings

### Ordering
- **Shopping Cart**: Add/remove items, modify quantities
- **Checkout**: Review order, select address, payment
- **Order Tracking**: Real-time order status updates
- **Order History**: View past orders

### Address Management
- **Add Address**: Nepal-specific address system
- **Edit Address**: Modify existing addresses
- **Default Address**: Set preferred delivery address
- **Location Services**: GPS-based address detection

## 🎨 UI/UX Features

- **Modern Design**: Clean, intuitive interface
- **Responsive Layout**: Works on different screen sizes
- **Dark/Light Theme**: Theme support (configurable)
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages
- **Offline Support**: Basic offline functionality

## 📦 Dependencies

### Core Dependencies
- **React Native**: Mobile app framework
- **Expo**: Development platform and tools
- **React Navigation**: Navigation library
- **Axios**: HTTP client for API calls
- **AsyncStorage**: Local data persistence

### UI Dependencies
- **React Native Vector Icons**: Icon library
- **React Native Safe Area Context**: Safe area handling
- **React Native Gesture Handler**: Touch gestures

### Feature Dependencies
- **Expo Notifications**: Push notifications
- **Expo Location**: GPS and location services
- **Expo Constants**: App configuration

## 🚀 Building for Production

### Android APK
```bash
# Build APK
expo build:android

# Or use EAS Build
eas build --platform android
```

### iOS App
```bash
# Build iOS app
expo build:ios

# Or use EAS Build
eas build --platform ios
```

### Web App
```bash
# Build web version
expo build:web
```

## 📱 Device Testing

### Android
1. Install Expo Go app from Play Store
2. Scan QR code from `npm start`
3. Or run `npm run android` for emulator

### iOS
1. Install Expo Go app from App Store
2. Scan QR code from `npm start`
3. Or run `npm run ios` for simulator

## 🔧 Development

### Code Structure
- **Components**: Reusable UI components
- **Screens**: Main app screens
- **Services**: API communication
- **Context**: State management
- **Utils**: Helper functions

### State Management
- **AuthContext**: User authentication state
- **CartContext**: Shopping cart state
- **NotificationContext**: Push notification state

### API Integration
- **mobileAPI.js**: Main API service
- **addressService.js**: Address-related API calls
- **notificationService.js**: Push notification handling

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **Dependency conflicts**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Android build issues**
   ```bash
   cd android && ./gradlew clean
   ```

4. **iOS build issues**
   ```bash
   cd ios && pod install
   ```

## 📊 Performance

- **Image Optimization**: Optimized image loading
- **Lazy Loading**: Components loaded on demand
- **Caching**: API response caching
- **Bundle Size**: Optimized bundle size

## 🔒 Security

- **Token Storage**: Secure token storage
- **API Security**: HTTPS communication
- **Input Validation**: Client-side validation
- **Error Handling**: Secure error messages

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