import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, APP_CONFIG, SERVER_IP, SERVER_PORT } from '../utils/constants';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

const MenuCard = ({ item, onPress }) => {
  const formatPrice = (price) => {
    return `${APP_CONFIG.CURRENCY_SYMBOL} ${price}`;
  };


  const getImageSource = () => {
    // First priority: Check for images array from database
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      const imagePath = item.images[0];
      console.log('Using database image:', imagePath);
      // If it's already a full URL, return it
      if (imagePath.startsWith('http')) {
        return { uri: imagePath };
      }
      // If it's a relative path, construct full URL
      return { uri: `http://${SERVER_IP}:${SERVER_PORT}${imagePath}` };
    }
    
    // Fallback: Check for other image fields
    if (item.image && typeof item.image === 'string' && item.image.trim() !== '') {
      return { uri: item.image };
    }
    
    if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim() !== '') {
      return { uri: item.imageUrl };
    }
    
    if (item.imageUrl && typeof item.imageUrl === 'object' && item.imageUrl.url) {
      return { uri: item.imageUrl.url };
    }
    
    if (item.imagePath && typeof item.imagePath === 'string' && item.imagePath.trim() !== '') {
      return { uri: item.imagePath };
    }
    
    if (item.photo && typeof item.photo === 'string' && item.photo.trim() !== '') {
      return { uri: item.photo };
    }
    
    if (item.picture && typeof item.picture === 'string' && item.picture.trim() !== '') {
      return { uri: item.picture };
    }
    
    // Return null to use fallback icon (no more dummy images)
    console.log('No image found for item:', item.name);
    return null;
  };

  const getRatingStars = (rating = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={12} color={COLORS.RATING_COLOR} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={12} color={COLORS.RATING_COLOR} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={12} color={COLORS.RATING_COLOR} />
      );
    }

    return stars;
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress && onPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {getImageSource() ? (
          <Image 
            source={getImageSource()} 
            style={styles.image}
            resizeMode="cover"
            onError={() => {
              console.log('Image failed to load for item:', item.name);
            }}
          />
        ) : (
          <View style={styles.fallbackImageContainer}>
            <Ionicons name="restaurant" size={40} color={COLORS.TEXT_LIGHT} />
            <Text style={styles.fallbackImageText}>No Image</Text>
          </View>
        )}
        {item.isVeg && (
          <View style={styles.vegBadge}>
            <Ionicons name="leaf" size={10} color="#fff" />
          </View>
        )}
        {!item.isAvailable && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>Unavailable</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.itemName} numberOfLines={1}>
          {String(item.name || '')}
        </Text>
        
        <Text style={styles.restaurantName} numberOfLines={1}>
          {String(item.restaurant?.name || 'Restaurant')}
        </Text>

        <Text style={styles.description} numberOfLines={2}>
          {String(item.description || 'Delicious food item')}
        </Text>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
            {item.restaurant?.rating && (
              <View style={styles.ratingContainer}>
                {getRatingStars(item.restaurant.rating?.average || 0)}
                <Text style={styles.ratingText}>
                  ({String(item.restaurant.rating?.count || 0)})
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.addButton, { opacity: item.isAvailable ? 1 : 0.5 }]}
            tabIndex={item.isAvailable ? 0 : -1}
          >
            <Ionicons 
              name={item.isAvailable ? "add" : "close"} 
              size={18} 
              color={COLORS.WHITE} 
            />
          </TouchableOpacity>
        </View>

        {item.category && (
          <View style={styles.categoryContainer}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category?.name || 'Category'}</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 8,
    width: cardWidth,
    elevation: 3,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 120,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackImageText: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    marginTop: 4,
    textAlign: 'center',
  },
  vegBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 16,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRICE_COLOR,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 4,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  categoryContainer: {
    marginTop: 8,
  },
  categoryBadge: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default MenuCard;
