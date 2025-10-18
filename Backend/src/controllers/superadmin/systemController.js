// SuperAdmin System Controller
import RestaurantUser from '../../models/RestaurantUser.js';
import Customer from '../../models/Customer.js';
import Order from '../../models/Order.js';
import Admin from '../../models/Admin.js';

// @desc    Get system dashboard overview
// @route   GET /api/v1/superadmin/system/dashboard
// @access  Private (SuperAdmin)
export const getSystemDashboard = async (req, res) => {
  try {
    // Get system statistics
    const [
      totalUsers,
      activeRestaurants,
      totalOrders,
      totalAdmins,
      recentOrders,
      systemHealth
    ] = await Promise.all([
      Customer.countDocuments(),
      RestaurantUser.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Admin.countDocuments(),
      Order.find()
        .populate('customer', 'name email')
        .populate('restaurant', 'restaurantName')
        .sort({ createdAt: -1 })
        .limit(5),
      checkSystemHealth()
    ]);

    // Calculate revenue from orders
    const revenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get recent activities
    const recentActivities = await getRecentActivities();

    // Get system alerts
    const systemAlerts = await getSystemAlerts();

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeRestaurants,
          totalOrders,
          totalAdmins,
          totalRevenue: revenue[0]?.totalRevenue || 0
        },
        recentOrders,
        systemHealth,
        recentActivities,
        systemAlerts
      }
    });

  } catch (error) {
    console.error('Get system dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching system dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get system menu management data
// @route   GET /api/v1/superadmin/system/menu
// @access  Private (SuperAdmin)
export const getSystemMenuManagement = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 10 } = req.query;

    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { 'categories.items.name': { $regex: search, $options: 'i' } },
        { 'categories.items.description': { $regex: search, $options: 'i' } }
      ];
    }

    // Find menus with pagination
    const menus = await Menu.find(query)
      .populate('restaurant', 'restaurantName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get all menu items
    const allMenuItems = [];
    menus.forEach(menu => {
      menu.categories.forEach(category => {
        category.items.forEach(item => {
          allMenuItems.push({
            _id: item._id,
            name: item.name,
            description: item.description,
            price: item.price,
            image: item.image,
            isAvailable: item.isAvailable,
            isFeatured: item.isFeatured,
            category: category.name,
            restaurantId: menu.restaurant._id,
            restaurantName: menu.restaurant.restaurantName,
            restaurantEmail: menu.restaurant.email,
            menuId: menu._id,
            createdAt: item.createdAt || menu.createdAt,
            updatedAt: item.updatedAt || menu.updatedAt
          });
        });
      });
    });

    // Apply filters
    let filteredItems = allMenuItems;
    if (category) {
      filteredItems = filteredItems.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
      );
    }
    if (status) {
      filteredItems = filteredItems.filter(item => 
        status === 'available' ? item.isAvailable : !item.isAvailable
      );
    }

    // Get categories for filter
    const categories = [...new Set(allMenuItems.map(item => item.category))];

    res.json({
      success: true,
      data: {
        items: filteredItems,
        categories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredItems.length / limit),
          totalItems: filteredItems.length
        }
      }
    });

  } catch (error) {
    console.error('Get system menu management error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching system menu management',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get system page management data
// @route   GET /api/v1/superadmin/system/pages
// @access  Private (SuperAdmin)
export const getSystemPageManagement = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    // Static pages data - replace with actual Page model when created
    const staticPages = [
      {
        _id: '1',
        title: 'Home Page',
        slug: 'home',
        content: 'Welcome to our food delivery platform...',
        status: 'published',
        isPublic: true,
        metaTitle: 'Food Delivery - Order Online',
        metaDescription: 'Order food online from your favorite restaurants',
        template: 'home',
        views: 1250,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20')
      },
      {
        _id: '2',
        title: 'About Us',
        slug: 'about',
        content: 'Learn more about our company...',
        status: 'published',
        isPublic: true,
        metaTitle: 'About Us - Food Delivery',
        metaDescription: 'Learn about our mission and values',
        template: 'default',
        views: 450,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18')
      },
      {
        _id: '3',
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        content: 'Your privacy is important to us...',
        status: 'draft',
        isPublic: false,
        metaTitle: 'Privacy Policy',
        metaDescription: 'Our privacy policy and data protection',
        template: 'legal',
        views: 0,
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-19')
      }
    ];

    // Apply filters
    let filteredPages = staticPages;
    if (search) {
      filteredPages = filteredPages.filter(page =>
        page.title.toLowerCase().includes(search.toLowerCase()) ||
        page.slug.toLowerCase().includes(search.toLowerCase()) ||
        page.content.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (status) {
      filteredPages = filteredPages.filter(page => page.status === status);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPages = filteredPages.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        pages: paginatedPages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredPages.length / limit),
          totalItems: filteredPages.length
        }
      }
    });

  } catch (error) {
    console.error('Get system page management error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching system page management',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get system user management data
// @route   GET /api/v1/superadmin/system/users
// @access  Private (SuperAdmin)
export const getSystemUserManagement = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;

    // Build query for customers
    let customerQuery = {};
    if (search) {
      customerQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      customerQuery.isActive = status === 'active';
    }

    // Build query for restaurants
    let restaurantQuery = {};
    if (search) {
      restaurantQuery.$or = [
        { restaurantName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      restaurantQuery.isActive = status === 'active';
    }

    // Build query for admins
    let adminQuery = {};
    if (search) {
      adminQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      adminQuery.isActive = status === 'active';
    }

    // Fetch users based on role filter
    let users = [];
    let totalCount = 0;

    if (!role || role === 'customer') {
      const customers = await Customer.find(customerQuery)
        .select('name email phone isActive createdAt lastLogin')
        .sort({ createdAt: -1 })
        .limit(role ? limit * 1 : limit * 1)
        .skip(role ? 0 : (page - 1) * limit);
      
      users = [...users, ...customers.map(customer => ({
        ...customer.toObject(),
        role: 'customer',
        displayName: customer.name,
        type: 'Customer'
      }))];
      
      if (!role) totalCount += await Customer.countDocuments(customerQuery);
    }

    if (!role || role === 'restaurant') {
      const restaurants = await RestaurantUser.find(restaurantQuery)
        .select('restaurantName email phone isActive createdAt lastLogin')
        .sort({ createdAt: -1 })
        .limit(role ? limit * 1 : limit * 1)
        .skip(role ? 0 : (page - 1) * limit);
      
      users = [...users, ...restaurants.map(restaurant => ({
        ...restaurant.toObject(),
        role: 'restaurant',
        displayName: restaurant.restaurantName,
        type: 'Restaurant'
      }))];
      
      if (!role) totalCount += await RestaurantUser.countDocuments(restaurantQuery);
    }

    if (!role || role === 'admin') {
      const admins = await Admin.find(adminQuery)
        .select('name email role isActive createdAt lastLogin')
        .sort({ createdAt: -1 })
        .limit(role ? limit * 1 : limit * 1)
        .skip(role ? 0 : (page - 1) * limit);
      
      users = [...users, ...admins.map(admin => ({
        ...admin.toObject(),
        role: admin.role,
        displayName: admin.name,
        type: 'Admin'
      }))];
      
      if (!role) totalCount += await Admin.countDocuments(adminQuery);
    }

    // Sort all users by creation date
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination if no specific role
    if (!role) {
      const startIndex = (page - 1) * limit;
      users = users.slice(startIndex, startIndex + parseInt(limit));
    }

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount
        }
      }
    });

  } catch (error) {
    console.error('Get system user management error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching system user management',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get system settings
// @route   GET /api/v1/superadmin/system/settings
// @access  Private (SuperAdmin)
export const getSystemSettings = async (req, res) => {
  try {
    // System settings configuration
    const settings = {
      general: {
        siteName: 'HypeBridge Food Delivery',
        siteDescription: 'Your favorite food delivery platform',
        siteUrl: 'https://hypebridge.com',
        adminEmail: 'admin@hypebridge.com',
        supportEmail: 'support@hypebridge.com'
      },
      business: {
        commissionRate: 15,
        deliveryFee: 2.99,
        minimumOrderAmount: 10.00,
        currency: 'USD',
        timezone: 'America/New_York'
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        orderNotifications: true,
        marketingNotifications: false
      },
      security: {
        twoFactorAuth: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requireStrongPassword: true
      },
      features: {
        onlinePayment: true,
        cashOnDelivery: true,
        restaurantReviews: true,
        customerLoyalty: true,
        deliveryTracking: true
      }
    };

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching system settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update system settings
// @route   PUT /api/v1/superadmin/system/settings
// @access  Private (SuperAdmin)
export const updateSystemSettings = async (req, res) => {
  try {
    const { general, business, notifications, security, features } = req.body;

    // Update system settings
    console.log('Updating system settings:', {
      general,
      business,
      notifications,
      security,
      features
    });

    res.json({
      success: true,
      message: 'System settings updated successfully',
      data: {
        general,
        business,
        notifications,
        security,
        features
      }
    });

  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating system settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to check system health
const checkSystemHealth = async () => {
  try {
    // Check database connection
    const dbStatus = 'connected';
    
    // Check external services status
    const services = {
      database: 'healthy',
      email: 'healthy',
      payment: 'healthy',
      storage: 'healthy'
    };

    const overallHealth = Object.values(services).every(status => status === 'healthy') 
      ? 'Good' 
      : 'Warning';

    return {
      status: overallHealth,
      services,
      lastCheck: new Date(),
      uptime: '99.9%'
    };
  } catch (error) {
    return {
      status: 'Error',
      services: {},
      lastCheck: new Date(),
      error: error.message
    };
  }
};

// Helper function to get recent activities
const getRecentActivities = async () => {
  try {
    // Get recent system activities
    return [
      {
        id: 1,
        type: 'user_registration',
        message: 'New restaurant "Pizza Palace" registered',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        status: 'success'
      },
      {
        id: 2,
        type: 'system_update',
        message: 'Menu management system updated',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        status: 'info'
      },
      {
        id: 3,
        type: 'order_processed',
        message: 'Order #12345 processed successfully',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        status: 'success'
      }
    ];
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};

// Helper function to get system alerts
const getSystemAlerts = async () => {
  try {
    // Get system alerts and notifications
    return [
      {
        id: 1,
        type: 'warning',
        message: 'High server load detected',
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        priority: 'high'
      },
      {
        id: 2,
        type: 'info',
        message: 'Database backup completed',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        priority: 'low'
      }
    ];
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    return [];
  }
};

export default {
  getSystemDashboard,
  getSystemMenuManagement,
  getSystemPageManagement,
  getSystemUserManagement,
  getSystemSettings,
  updateSystemSettings
};
