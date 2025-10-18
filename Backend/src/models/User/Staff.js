// Staff Model
// This file structure created as per requested organization
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const staffSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  
  // Restaurant Association
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant is required']
  },
  
  // Role & Permissions
  role: {
    type: String,
    enum: ['manager', 'chef', 'cashier', 'waiter', 'kitchen_helper', 'delivery_coordinator'],
    required: true
  },
  
  permissions: [{
    type: String,
    enum: [
      // Menu Management
      'view_menu', 'add_menu_items', 'edit_menu_items', 'delete_menu_items',
      'manage_categories', 'update_item_availability',
      
      // Order Management
      'view_orders', 'accept_orders', 'reject_orders', 'update_order_status',
      'prepare_orders', 'ready_for_pickup',
      
      // Inventory Management
      'view_inventory', 'update_inventory', 'add_inventory_items',
      'generate_inventory_reports',
      
      // Staff Management
      'view_staff', 'add_staff', 'edit_staff', 'remove_staff',
      'manage_shifts', 'view_staff_reports',
      
      // Financial
      'view_earnings', 'view_sales_reports', 'manage_expenses',
      
      // Settings
      'update_restaurant_profile', 'manage_business_hours',
      'update_delivery_settings',
      
      // Reviews & Ratings
      'view_reviews', 'respond_to_reviews',
      
      // Promotions
      'view_promotions', 'create_promotions', 'edit_promotions',
      
      // Reports
      'view_analytics', 'generate_reports', 'export_data'
    ]
  }],
  
  // Personal Details
  profileImage: String,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  // Employment Details
  employeeId: {
    type: String,
    unique: true
  },
  joiningDate: {
    type: Date,
    required: true
  },
  employmentType: {
    type: String,
    enum: ['full_time', 'part_time', 'contract', 'intern'],
    default: 'full_time'
  },
  
  // Salary & Benefits
  salary: {
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['hourly', 'daily', 'monthly', 'yearly'],
      default: 'monthly'
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  // Work Schedule
  workingHours: {
    monday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    tuesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    thursday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    friday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    saturday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    sunday: { start: String, end: String, isWorking: { type: Boolean, default: false } }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'terminated'],
    default: 'active'
  },
  isOnDuty: {
    type: Boolean,
    default: false
  },
  
  // Performance Tracking
  performance: {
    ordersHandled: {
      type: Number,
      default: 0
    },
    averageOrderTime: {
      type: Number,
      default: 0 // in minutes
    },
    customerRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    punctualityScore: {
      type: Number,
      default: 100 // percentage
    }
  },
  
  // Attendance
  attendance: [{
    date: {
      type: Date,
      required: true
    },
    checkIn: Date,
    checkOut: Date,
    hoursWorked: Number,
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half_day', 'on_leave'],
      default: 'present'
    },
    notes: String
  }],
  
  // Leave Management
  leaves: [{
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['sick', 'casual', 'vacation', 'emergency', 'maternity', 'paternity'],
      required: true
    },
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Documents
  documents: {
    aadhar: String,
    pan: String,
    resume: String,
    photos: [String],
    certificates: [String]
  },
  
  // Emergency Contact
  emergencyContact: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    relation: {
      type: String,
      required: true
    }
  },
  
  // Bank Details (for salary)
  bankDetails: {
    accountName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  
  // App Settings
  settings: {
    notifications: {
      newOrders: { type: Boolean, default: true },
      shiftReminders: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true }
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  
  // Login Information
  lastLogin: Date,
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  
  // Created By
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  
  // Notes
  notes: String,
  
  // Termination Details (if applicable)
  terminationDate: Date,
  terminationReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
staffSchema.index({ restaurant: 1 });
staffSchema.index({ email: 1, restaurant: 1 });
staffSchema.index({ employeeId: 1 });
staffSchema.index({ role: 1 });
staffSchema.index({ status: 1 });
staffSchema.index({ joiningDate: -1 });

// Virtual for full name
staffSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for total leaves taken this year
staffSchema.virtual('totalLeavesThisYear').get(function() {
  const currentYear = new Date().getFullYear();
  return this.leaves.filter(leave => 
    new Date(leave.startDate).getFullYear() === currentYear &&
    leave.status === 'approved'
  ).length;
});

// Pre-save middleware to hash password
staffSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate employee ID
staffSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    const restaurant = await mongoose.model('Restaurant').findById(this.restaurant);
    const count = await this.constructor.countDocuments({ restaurant: this.restaurant });
    this.employeeId = `${restaurant?.restaurantCode || 'REST'}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Instance method to check password
staffSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check in
staffSchema.methods.checkIn = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existingAttendance = this.attendance.find(
    att => att.date.getTime() === today.getTime()
  );
  
  if (!existingAttendance) {
    this.attendance.push({
      date: today,
      checkIn: new Date(),
      status: 'present'
    });
    this.isOnDuty = true;
    await this.save();
  }
  
  return this;
};

// Instance method to check out
staffSchema.methods.checkOut = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const attendanceIndex = this.attendance.findIndex(
    att => att.date.getTime() === today.getTime()
  );
  
  if (attendanceIndex !== -1) {
    const attendance = this.attendance[attendanceIndex];
    attendance.checkOut = new Date();
    
    if (attendance.checkIn) {
      const hoursWorked = (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60);
      attendance.hoursWorked = Math.round(hoursWorked * 100) / 100;
    }
    
    this.isOnDuty = false;
    await this.save();
  }
  
  return this;
};

// Static method to get staff by restaurant and role
staffSchema.statics.getByRestaurantAndRole = function(restaurantId, role) {
  return this.find({
    restaurant: restaurantId,
    role: role,
    status: 'active'
  });
};

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;
