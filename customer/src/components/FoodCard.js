import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const FoodCard = ({ 
  foodItem,
  onAddToCart,
  onFavorite
}) => {
  const [quantity, setQuantity] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleAddToCart = () => {
    if (quantity === 0) {
      setQuantity(1);
    }
    if (onAddToCart) {
      onAddToCart({
        ...foodItem,
        quantity: quantity + 1
      });
    }
    setQuantity(quantity + 1);
  };

  const handleRemoveFromCart = () => {
    if (quantity > 0) {
      setQuantity(quantity - 1);
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    if (onFavorite) {
      onFavorite(foodItem);
    }
  };

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
    if (onAddToCart) {
      onAddToCart({
        ...foodItem,
        quantity: quantity + 1
      });
    }
  };

  const decrementQuantity = () => {
    if (quantity > 0) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Food Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={foodItem.image ? { uri: foodItem.image } : require('../assets/icon.png')} 
          style={styles.foodImage}
          defaultSource={require('../assets/icon.png')}
          onError={(error) => {
            console.log('Image failed to load:', error.nativeEvent.error);
          }}
          onLoad={() => {
            console.log('Image loaded successfully');
          }}
        />
        
        {/* Heart Icon for Favorites */}
        <TouchableOpacity 
          style={styles.favoriteButton} 
          onPress={handleFavorite}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={20} 
            color={isFavorite ? COLORS.ERROR : COLORS.TEXT_LIGHT} 
          />
        </TouchableOpacity>

        {/* Veg/Non Icon */}
        {foodItem.category && (
          <View style={styles.categoryIcon}>
            <Text style={styles.categoryText}>
              {foodItem.category === 'veg' ? '🥬' : '🍖'}
            </Text>
          </View>
        )}
      </View>

      {/* Food Details */}
      <View style={styles.foodDetails}>
        <Text style={styles.foodName} numberOfLines={2}>
          {foodItem.name}
        </Text>
        
        {foodItem.description && (
          <Text style={styles.foodDescription} numberOfLines={2}>
            {foodItem.description}
          </Text>
        )}

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <View style={styles.starRating}>
            <Ionicons name="star" size={12} color={COLORS.RATING_COLOR} />
            <Text style={styles.rating}>{foodItem.rating || '4.0'}</Text>
          </View>
          {foodItem.reviewCount && (
            <Text style={styles.reviewCount}>
              ({foodItem.reviewCount} reviews)
            </Text>
          )}
        </View>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>Rs {foodItem.price}</Text>
          {foodItem.originalPrice && foodItem.originalPrice > foodItem.price && (
            <Text style={styles.originalPrice}>Rs {foodItem.originalPrice}</Text>
          )}
          {foodItem.discountedPrice && (
            <Text style={styles.discount}>
              {Math.round(((foodItem.originalPrice - foodItem.price) / foodItem.originalPrice) * 100)}% off
            </Text>
          )}
        </View>

        {/* Delivery Time */}
        {foodItem.deliveryTime && (
          <Text style={styles.deliveryTime}>
            🕒 {foodItem.deliveryTime} delivery
          </Text>
        )}
      </View>

      {/* Quantity Selector */}
      <View style={styles.actionContainer}>
        {quantity === 0 ? (
          <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.quantitySelector}>
            <TouchableOpacity 
              style={styles.quantityButton} 
              onPress={decrementQuantity}
            >
              <Ionicons name="remove" size={16} color={COLORS.PRIMARY} />
            </TouchableOpacity>
            
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{String(quantity || 0)}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.quantityButton} 
              onPress={incrementQuantity}
            >
              <Ionicons name="add" size={16} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 12,
  },
  foodDetails: {
    padding: 16,
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 6,
  },
  foodDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  rating: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 4,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRICE_COLOR,
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discount: {
    fontSize: 12,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  deliveryTime: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'flex-end',
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addButtonText: {
    color: COLORS.WHITE,
    fontWeight: '600',
    fontSize: 14,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.FOOD_BG,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityButton: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  quantityDisplay: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
});

export default FoodCard;
