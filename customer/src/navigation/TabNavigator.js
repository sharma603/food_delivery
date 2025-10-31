import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import Dashboard from '../screens/Dashboard';
import ProfileScreen from '../screens/ProfileScreen';
import RestaurantScreen from '../screens/RestaurantScreen';
import BrowseScreen from '../screens/BrowseScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OffersScreen from '../screens/OffersScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import RestaurantMenuScreen from '../screens/RestaurantMenuScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import AddressManagementScreen from '../screens/AddressManagementScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CartScreen from '../screens/CartScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack including RestaurantScreen
const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.WHITE,
        borderBottomColor: COLORS.BORDER,
        borderBottomWidth: 1,
        shadowColor: COLORS.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      headerTintColor: COLORS.PRIMARY,
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 20,
      },
    }}
  >
    <Stack.Screen 
      name="Dashboard" 
      component={Dashboard}
      options={{
        title: 'FoodHub',
        headerShown: false, // Hide header since it's in the tab bar
      }}
    />
    <Stack.Screen 
      name="RestaurantScreen" 
      component={RestaurantScreen}
      options={{
        headerShown: false, // Hide navigation header since RestaurantScreen has its own
      }}
    />
    <Stack.Screen 
      name="RestaurantMenuScreen" 
      component={RestaurantMenuScreen}
      options={{
        headerShown: false, // Hide navigation header since RestaurantMenuScreen has its own
      }}
    />
    <Stack.Screen 
      name="BrowseScreen" 
      component={BrowseScreen}
      options={{
        headerShown: false, // Hide navigation header since BrowseScreen has its own
      }}
    />
    <Stack.Screen 
      name="OrdersScreen" 
      component={OrdersScreen}
      options={{
        title: 'My Orders',
      }}
    />
    <Stack.Screen 
      name="OffersScreen" 
      component={OffersScreen}
      options={{
        title: 'Offers',
      }}
    />
    <Stack.Screen 
      name="RestaurantDetailScreen" 
      component={RestaurantDetailScreen}
      options={{
        headerShown: false, // Hide navigation header since RestaurantDetailScreen has its own
      }}
    />
    <Stack.Screen 
      name="NotificationsScreen" 
      component={NotificationsScreen}
      options={{
        headerShown: false, // Hide navigation header since NotificationsScreen has its own
      }}
    />
    <Stack.Screen 
      name="CartScreen" 
      component={CartScreen}
      options={{
        headerShown: false, // Hide navigation header since CartScreen has its own
      }}
    />
  </Stack.Navigator>
);

// Profile Stack including EditProfile and ChangePassword
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.WHITE,
        borderBottomColor: COLORS.BORDER,
        borderBottomWidth: 1,
        shadowColor: COLORS.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      headerTintColor: COLORS.PRIMARY,
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 20,
      },
    }}
  >
    <Stack.Screen 
      name="ProfileMain" 
      component={ProfileScreen}
      options={{
        title: 'Profile',
        headerShown: false, // Hide header since it's in the tab bar
      }}
    />
    <Stack.Screen 
      name="EditProfile" 
      component={EditProfileScreen}
      options={{
        headerShown: false, // Hide navigation header since EditProfileScreen has its own
      }}
    />
    <Stack.Screen 
      name="ChangePassword" 
      component={ChangePasswordScreen}
      options={{
        headerShown: false, // Hide navigation header since ChangePasswordScreen has its own
      }}
    />
    <Stack.Screen 
      name="AddressManagement" 
      component={AddressManagementScreen}
      options={{
        headerShown: false, // Hide navigation header since AddressManagementScreen has its own
      }}
    />
    <Stack.Screen 
      name="AddAddress" 
      component={AddAddressScreen}
      options={{
        headerShown: false, // Hide navigation header since AddAddressScreen has its own
      }}
    />
    <Stack.Screen 
      name="OrderHistoryFromProfile" 
      component={OrderHistoryScreen}
      options={{
        headerShown: false, // Hide navigation header since OrderHistoryScreen has its own
      }}
    />
    <Stack.Screen 
      name="OrderDetailFromProfile" 
      component={OrderDetailScreen}
      options={{
        headerShown: false, // Hide navigation header since OrderDetailScreen has its own
      }}
    />
  </Stack.Navigator>
);

// Orders Stack including OrderHistory and OrderDetail
const OrdersStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.WHITE,
        borderBottomColor: COLORS.BORDER,
        borderBottomWidth: 1,
        shadowColor: COLORS.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      headerTintColor: COLORS.PRIMARY,
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 20,
      },
    }}
  >
    <Stack.Screen 
      name="OrdersMain" 
      component={OrdersScreen}
      options={{
        title: 'My Orders',
        headerShown: false, // Hide header since it's in the tab bar
      }}
    />
    <Stack.Screen 
      name="OrderHistory" 
      component={OrderHistoryScreen}
      options={{
        headerShown: false, // Hide navigation header since OrderHistoryScreen has its own
      }}
    />
    <Stack.Screen 
      name="OrderDetail" 
      component={OrderDetailScreen}
      options={{
        headerShown: false, // Hide navigation header since OrderDetailScreen has its own
      }}
    />
  </Stack.Navigator>
);

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: '#8b949e',
        tabBarStyle: {
          backgroundColor: '#161b22',
          borderTopColor: '#30363d',
          borderTopWidth: 1,
          paddingVertical: 4,
          height: 55,
          paddingBottom: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: COLORS.WHITE,
          borderBottomColor: COLORS.BORDER,
          borderBottomWidth: 1,
          shadowColor: COLORS.SHADOW,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        headerTintColor: COLORS.PRIMARY,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersStack}
        options={{
          title: 'My Orders',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
