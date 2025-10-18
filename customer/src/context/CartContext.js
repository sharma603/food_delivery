import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

// Cart context
const CartContext = createContext();

// Cart action types
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART',
  SET_RESTAURANT: 'SET_RESTAURANT',
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const { item, restaurant } = action.payload;
      
      console.log('Adding item to cart:', {
        itemId: item._id,
        itemName: item.name,
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        currentRestaurants: Object.keys(state.restaurants).length
      });
      
      const restaurantId = restaurant._id;
      const newRestaurants = { ...state.restaurants };
      
      // Initialize restaurant if it doesn't exist
      if (!newRestaurants[restaurantId]) {
        newRestaurants[restaurantId] = {
          restaurant: restaurant,
          items: [],
          subtotal: 0,
          deliveryFee: restaurant.deliveryFee || 50,
        };
      }
      
      // Check if item already exists in this restaurant
      const existingItemIndex = newRestaurants[restaurantId].items.findIndex(
        cartItem => cartItem._id === item._id
      );

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        console.log('Item already exists, increasing quantity');
        newRestaurants[restaurantId].items[existingItemIndex].quantity += 1;
      } else {
        // Add new item
        console.log('Adding new item to cart');
        newRestaurants[restaurantId].items.push({ ...item, quantity: 1 });
      }
      
      // Recalculate totals for this restaurant
      newRestaurants[restaurantId].subtotal = newRestaurants[restaurantId].items.reduce(
        (sum, cartItem) => sum + (cartItem.price * cartItem.quantity), 0
      );
      
      // Calculate overall totals
      const totalItems = Object.values(newRestaurants).reduce(
        (sum, rest) => sum + rest.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      );
      
      const totalAmount = Object.values(newRestaurants).reduce(
        (sum, rest) => sum + rest.subtotal, 0
      );
      
      const totalDeliveryFee = Object.values(newRestaurants).reduce(
        (sum, rest) => sum + rest.deliveryFee, 0
      );
      
      return {
        ...state,
        restaurants: newRestaurants,
        totalItems,
        totalAmount,
        totalDeliveryFee,
      };
    }

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { itemId, quantity, restaurantId } = action.payload;
      const newRestaurants = { ...state.restaurants };
      
      if (newRestaurants[restaurantId]) {
        newRestaurants[restaurantId].items = newRestaurants[restaurantId].items
          .map(item => item._id === itemId ? { ...item, quantity: Math.max(0, quantity) } : item)
          .filter(item => item.quantity > 0);
        
        // Recalculate totals for this restaurant
        newRestaurants[restaurantId].subtotal = newRestaurants[restaurantId].items.reduce(
          (sum, cartItem) => sum + (cartItem.price * cartItem.quantity), 0
        );
        
        // Remove restaurant if no items left
        if (newRestaurants[restaurantId].items.length === 0) {
          delete newRestaurants[restaurantId];
        }
      }
      
      // Calculate overall totals
      const totalItems = Object.values(newRestaurants).reduce(
        (sum, rest) => sum + rest.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      );
      
      const totalAmount = Object.values(newRestaurants).reduce(
        (sum, rest) => sum + rest.subtotal, 0
      );
      
      const totalDeliveryFee = Object.values(newRestaurants).reduce(
        (sum, rest) => sum + rest.deliveryFee, 0
      );
      
      return {
        ...state,
        restaurants: newRestaurants,
        totalItems,
        totalAmount,
        totalDeliveryFee,
      };
    }

    case CART_ACTIONS.REMOVE_ITEM: {
      const { itemId, restaurantId } = action.payload;
      const newRestaurants = { ...state.restaurants };
      
      if (newRestaurants[restaurantId]) {
        newRestaurants[restaurantId].items = newRestaurants[restaurantId].items.filter(
          item => item._id !== itemId
        );
        
        // Recalculate totals for this restaurant
        newRestaurants[restaurantId].subtotal = newRestaurants[restaurantId].items.reduce(
          (sum, cartItem) => sum + (cartItem.price * cartItem.quantity), 0
        );
        
        // Remove restaurant if no items left
        if (newRestaurants[restaurantId].items.length === 0) {
          delete newRestaurants[restaurantId];
        }
      }
      
      // Calculate overall totals
      const totalItems = Object.values(newRestaurants).reduce(
        (sum, rest) => sum + rest.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      );
      
      const totalAmount = Object.values(newRestaurants).reduce(
        (sum, rest) => sum + rest.subtotal, 0
      );
      
      const totalDeliveryFee = Object.values(newRestaurants).reduce(
        (sum, rest) => sum + rest.deliveryFee, 0
      );
      
      return {
        ...state,
        restaurants: newRestaurants,
        totalItems,
        totalAmount,
        totalDeliveryFee,
      };
    }

    case CART_ACTIONS.CLEAR_CART:
      return {
        restaurants: {},
        totalItems: 0,
        totalAmount: 0,
        totalDeliveryFee: 0,
      };

    case CART_ACTIONS.LOAD_CART:
      return action.payload;

    default:
      return state;
  }
};

// Initial state
const initialState = {
  restaurants: {}, // Object to store items by restaurant ID
  totalItems: 0,
  totalAmount: 0,
  totalDeliveryFee: 0,
};

// Cart provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from storage on app start
  useEffect(() => {
    loadCart();
  }, []);

  // Save cart to storage with debouncing to prevent excessive writes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('Cart state changed:', {
        restaurantsCount: Object.keys(state.restaurants).length,
        totalItems: state.totalItems,
        totalAmount: state.totalAmount,
        totalDeliveryFee: state.totalDeliveryFee,
        restaurants: Object.keys(state.restaurants).map(id => ({
          id,
          name: state.restaurants[id].restaurant.name,
          itemsCount: state.restaurants[id].items.length
        }))
      });
      saveCart();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [state]);

  const loadCart = async () => {
    try {
      const cartData = await AsyncStorage.getItem(STORAGE_KEYS.CART_DATA);
      if (cartData) {
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: JSON.parse(cartData) });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CART_DATA, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addItem = (item, restaurant) => {
    dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: { item, restaurant } });
  };

  const removeItem = (itemId, restaurantId) => {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { itemId, restaurantId } });
  };

  const updateQuantity = (itemId, quantity, restaurantId) => {
    dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { itemId, quantity, restaurantId } });
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  const getCartItemCount = () => {
    return state.totalItems;
  };

  const getTotalItems = () => {
    return Object.values(state.restaurants).reduce((sum, rest) => sum + rest.items.length, 0);
  };

  const getRestaurants = () => {
    return Object.values(state.restaurants).map(rest => rest.restaurant);
  };

  const getItemsByRestaurant = (restaurantId) => {
    return state.restaurants[restaurantId]?.items || [];
  };

  const getRestaurantSubtotal = (restaurantId) => {
    return state.restaurants[restaurantId]?.subtotal || 0;
  };

  const getRestaurantDeliveryFee = (restaurantId) => {
    return state.restaurants[restaurantId]?.deliveryFee || 0;
  };

  const contextValue = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getCartItemCount,
    getTotalItems,
    getRestaurants,
    getItemsByRestaurant,
    getRestaurantSubtotal,
    getRestaurantDeliveryFee,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
