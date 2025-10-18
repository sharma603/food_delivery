import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import TabNavigator from './src/navigation/TabNavigator';
import { useAuth } from './src/context/AuthContext';
import ErrorBoundary from './src/components/ErrorBoundary';

// Main App Component
function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // You can add a loading screen component here
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

// Root App Component with Providers
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <StatusBar style="auto" />
            <AppContent />
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}