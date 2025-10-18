import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { mobileOfferAPI } from '../services/mobileAPI';

const OffersScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [appliedOffers, setAppliedOffers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load offers and coupons
  useEffect(() => {
    loadOffersAndCoupons();
  }, []);

  const loadOffersAndCoupons = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const [offersResponse, couponsResponse] = await Promise.all([
        mobileOfferAPI.getOffers(),
        mobileOfferAPI.getCoupons()
      ]);
      
      if (offersResponse.success) {
        setOffers(offersResponse.data || []);
      }
      
      if (couponsResponse.success) {
        setCoupons(couponsResponse.data || []);
      }
    } catch (err) {
      console.error('Error loading offers:', err);
      setError(err.message || 'Failed to load offers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOffersAndCoupons();
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="gift-outline" size={80} color={COLORS.TEXT_SECONDARY} />
      <Text style={styles.emptyTitle}>No Offers Available</Text>
      <Text style={styles.emptySubtitle}>
        We're working on bringing you amazing offers. Check back soon!
      </Text>
    </View>
  );

  const renderOfferCard = ({ item }) => (
    <View style={styles.offerCard}>
      <View style={[styles.offerHeader, { backgroundColor: COLORS.PRIMARY }]}>
        <Ionicons name="gift" size={24} color="#fff" />
        <Text style={styles.offerTitle}>{item.title}</Text>
      </View>
      
      <View style={styles.offerContent}>
        <Text style={styles.offerDescription}>{item.description}</Text>
        
        <View style={styles.offerDetails}>
          <Text style={styles.offerDiscount}>
            {item.discount.type === 'percentage' 
              ? `${item.discount.value}% OFF`
              : `Rs ${item.discount.value} OFF`
            }
          </Text>
          <Text style={styles.offerCode}>
            {item.restaurant?.name || 'All Restaurants'}
          </Text>
        </View>
        
        <Text style={styles.offerValidity}>
          Valid till: {new Date(item.validUntil).toLocaleDateString()}
        </Text>
        
        {item.conditions?.minAmount && (
          <Text style={styles.offerConditions}>
            Min order: Rs {item.conditions.minAmount}
          </Text>
        )}
        
        <TouchableOpacity 
          style={styles.applyButton}
          onPress={() => applyOffer(item)}
        >
          <Text style={styles.applyButtonText}>
            {appliedOffers.includes(item._id) ? 'Applied' : 'Apply Offer'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCouponCard = ({ item }) => (
    <View style={styles.offerCard}>
      <View style={[styles.offerHeader, { backgroundColor: COLORS.SUCCESS }]}>
        <Ionicons name="pricetag" size={24} color="#fff" />
        <Text style={styles.offerTitle}>{item.name}</Text>
      </View>
      
      <View style={styles.offerContent}>
        <Text style={styles.offerDescription}>{item.description}</Text>
        
        <View style={styles.offerDetails}>
          <Text style={styles.offerDiscount}>
            {item.type === 'percentage' 
              ? `${item.value}% OFF`
              : item.type === 'fixed_amount'
              ? `Rs ${item.value} OFF`
              : 'FREE DELIVERY'
            }
          </Text>
          <Text style={styles.offerCode}>Code: {item.code}</Text>
        </View>
        
        <Text style={styles.offerValidity}>
          Valid till: {new Date(item.validUntil).toLocaleDateString()}
        </Text>
        
        {item.minOrderAmount > 0 && (
          <Text style={styles.offerConditions}>
            Min order: Rs {item.minOrderAmount}
          </Text>
        )}
        
        <TouchableOpacity 
          style={styles.applyButton}
          onPress={() => applyCoupon(item)}
        >
          <Text style={styles.applyButtonText}>
            {appliedOffers.includes(item._id) ? 'Applied' : 'Apply Coupon'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const applyOffer = (offer) => {
    Alert.alert(
      'Apply Offer',
      `Apply ${offer.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply', 
          onPress: () => {
            if (!appliedOffers.includes(offer._id)) {
              setAppliedOffers([...appliedOffers, offer._id]);
              Alert.alert('Success', 'Offer applied successfully!');
            }
          }
        }
      ]
    );
  };

  const applyCoupon = (coupon) => {
    Alert.alert(
      'Apply Coupon',
      `Apply ${coupon.name} (${coupon.code})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply', 
          onPress: () => {
            if (!appliedOffers.includes(coupon._id)) {
              setAppliedOffers([...appliedOffers, coupon._id]);
              Alert.alert('Success', 'Coupon applied successfully!');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Dashboard');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offers & Deals</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <Text style={styles.headerSubtitle}>Discover amazing offers</Text>
          <Text style={styles.headerDescription}>
            Save more with our exclusive deals and discounts
          </Text>
        </View>

        {/* Applied Offers Count */}
        {appliedOffers.length > 0 && (
          <View style={styles.appliedOffersInfo}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.SUCCESS} />
            <Text style={styles.appliedOffersText}>
              {appliedOffers.length} offer{appliedOffers.length > 1 ? 's' : ''} applied
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={40} color={COLORS.ERROR} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadOffersAndCoupons}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading State */}
        {loading && !error && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading offers...</Text>
          </View>
        )}

        {/* Offers Section */}
        {!loading && !error && offers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
            <FlatList
              data={offers}
              renderItem={renderOfferCard}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Coupons Section */}
        {!loading && !error && coupons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coupon Codes</Text>
            <FlatList
              data={coupons}
              renderItem={renderCouponCard}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && offers.length === 0 && coupons.length === 0 && renderEmptyState()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  menuButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerInfo: {
    marginVertical: 20,
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  appliedOffersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 20,
  },
  appliedOffersText: {
    fontSize: 14,
    color: COLORS.SUCCESS,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
  },
  offerCard: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginLeft: 12,
  },
  offerContent: {
    padding: 16,
  },
  offerDescription: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
    lineHeight: 24,
  },
  offerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  offerDiscount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  offerCode: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontFamily: 'monospace',
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  offerValidity: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  offerConditions: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  applyButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  applyButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 20,
    backgroundColor: '#ffe6e6',
    borderRadius: 12,
    marginVertical: 16,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.ERROR,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: COLORS.ERROR,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
});

export default OffersScreen;
