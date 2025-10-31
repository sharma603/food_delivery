import Offer from '../../models/Promotion/Offer.js';
import Coupon from '../../models/Promotion/Coupon.js';
import Restaurant from '../../models/Restaurant.js';

// Get all active offers
export const getMobileOffers = async (req, res) => {
  try {
    const { restaurantId, type } = req.query;
    
    // Build query
    const query = {
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    };
    
    if (restaurantId) {
      query.restaurant = restaurantId;
    }
    
    if (type) {
      query.type = type;
    }
    
    // Get offers with restaurant details
    const offers = await Offer.find(query)
      .populate('restaurant', 'restaurantName cuisine image')
      .populate('applicableItems', 'name price image')
      .sort({ priority: -1, createdAt: -1 })
      .lean();
    
    // Transform offers for mobile
    const transformedOffers = offers.map(offer => ({
      _id: offer._id,
      title: offer.title,
      description: offer.description,
      type: offer.type,
      discount: offer.discount,
      conditions: offer.conditions,
      validFrom: offer.validFrom,
      validUntil: offer.validUntil,
      restaurant: {
        _id: offer.restaurant._id,
        name: offer.restaurant.restaurantName,
        cuisine: offer.restaurant.cuisine,
        image: offer.restaurant.image
      },
      applicableItems: offer.applicableItems?.map(item => ({
        _id: item._id,
        name: item.name,
        price: item.price,
        image: item.image
      })) || [],
      isExpired: new Date() > offer.validUntil,
      usageCount: offer.usageCount,
      usageLimit: offer.usageLimit
    }));
    
    res.status(200).json({
      success: true,
      data: transformedOffers
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offers',
      error: error.message
    });
  }
};

// Get specific offer
export const getMobileOffer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const offer = await Offer.findById(id)
      .populate('restaurant', 'restaurantName cuisine image')
      .populate('applicableItems', 'name price image')
      .lean();
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }
    
    // Check if offer is valid
    const now = new Date();
    const isValid = offer.isActive && 
                   offer.validFrom <= now && 
                   offer.validUntil >= now &&
                   (!offer.usageLimit || offer.usageCount < offer.usageLimit);
    
    const transformedOffer = {
      _id: offer._id,
      title: offer.title,
      description: offer.description,
      type: offer.type,
      discount: offer.discount,
      conditions: offer.conditions,
      validFrom: offer.validFrom,
      validUntil: offer.validUntil,
      restaurant: {
        _id: offer.restaurant._id,
        name: offer.restaurant.restaurantName,
        cuisine: offer.restaurant.cuisine,
        image: offer.restaurant.image
      },
      applicableItems: offer.applicableItems?.map(item => ({
        _id: item._id,
        name: item.name,
        price: item.price,
        image: item.image
      })) || [],
      isValid,
      usageCount: offer.usageCount,
      usageLimit: offer.usageLimit
    };
    
    res.status(200).json({
      success: true,
      data: transformedOffer
    });
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offer',
      error: error.message
    });
  }
};

// Get all active coupons
export const getMobileCoupons = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    
    // Build query
    const query = {
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    };
    
    if (restaurantId) {
      query.$or = [
        { restaurant: restaurantId },
        { applicableRestaurants: restaurantId }
      ];
    }
    
    // Get coupons
    const coupons = await Coupon.find(query)
      .populate('restaurant', 'restaurantName cuisine image')
      .populate('applicableRestaurants', 'restaurantName cuisine image')
      .sort({ createdAt: -1 })
      .lean();
    
    // Transform coupons for mobile
    const transformedCoupons = coupons.map(coupon => ({
      _id: coupon._id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      usageLimit: coupon.usageLimit,
      usageCount: coupon.usageCount,
      terms: coupon.terms,
      restaurant: coupon.restaurant ? {
        _id: coupon.restaurant._id,
        name: coupon.restaurant.restaurantName,
        cuisine: coupon.restaurant.cuisine,
        image: coupon.restaurant.image
      } : null,
      applicableRestaurants: coupon.applicableRestaurants?.map(restaurant => ({
        _id: restaurant._id,
        name: restaurant.restaurantName,
        cuisine: restaurant.cuisine,
        image: restaurant.image
      })) || [],
      isExpired: new Date() > coupon.validUntil,
      isAvailable: !coupon.usageLimit || coupon.usageCount < coupon.usageLimit.total
    }));
    
    res.status(200).json({
      success: true,
      data: transformedCoupons
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupons',
      error: error.message
    });
  }
};

// Validate coupon code
export const validateMobileCoupon = async (req, res) => {
  try {
    const { code, orderAmount, restaurantId } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }
    
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    }).lean();
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired coupon code'
      });
    }
    
    // Check if coupon is available
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit.total) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit exceeded'
      });
    }
    
    // Check minimum order amount
    if (orderAmount && coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of Rs ${coupon.minOrderAmount} required`
      });
    }
    
    // Check restaurant applicability
    if (restaurantId) {
      const isApplicable = coupon.restaurant?.toString() === restaurantId ||
                          coupon.applicableRestaurants?.some(id => id.toString() === restaurantId);
      
      if (!isApplicable) {
        return res.status(400).json({
          success: false,
          message: 'Coupon not applicable for this restaurant'
        });
      }
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    if (orderAmount) {
      if (coupon.type === 'percentage') {
        discountAmount = (orderAmount * coupon.value) / 100;
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }
      } else if (coupon.type === 'fixed_amount') {
        discountAmount = Math.min(coupon.value, orderAmount);
      } else if (coupon.type === 'free_delivery') {
        discountAmount = 0; // Free delivery is handled separately
      }
    }
    
    const transformedCoupon = {
      _id: coupon._id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      discountAmount,
      terms: coupon.terms,
      validUntil: coupon.validUntil
    };
    
    res.status(200).json({
      success: true,
      data: transformedCoupon
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate coupon',
      error: error.message
    });
  }
};

// Get offers for specific restaurant
export const getMobileRestaurantOffers = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const offers = await Offer.find({
      restaurant: restaurantId,
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    })
    .populate('applicableItems', 'name price image')
    .sort({ priority: -1, createdAt: -1 })
    .lean();
    
    const transformedOffers = offers.map(offer => ({
      _id: offer._id,
      title: offer.title,
      description: offer.description,
      type: offer.type,
      discount: offer.discount,
      conditions: offer.conditions,
      validFrom: offer.validFrom,
      validUntil: offer.validUntil,
      applicableItems: offer.applicableItems?.map(item => ({
        _id: item._id,
        name: item.name,
        price: item.price,
        image: item.image
      })) || [],
      isExpired: new Date() > offer.validUntil,
      usageCount: offer.usageCount,
      usageLimit: offer.usageLimit
    }));
    
    res.status(200).json({
      success: true,
      data: transformedOffers
    });
  } catch (error) {
    console.error('Error fetching restaurant offers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant offers',
      error: error.message
    });
  }
};
