import User from '../models/User.js';

const getUsers = async (req, res) => {
  const users = await User.find({});
  res.json(users);
};

const getUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.addresses = req.body.addresses || user.addresses;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.remove();
    res.json({ message: 'User removed' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// Get all addresses for the logged-in user
const getAllAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: user.addresses || []
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch addresses' 
    });
  }
};

// Get single address by ID
const getAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const address = user.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({ 
        success: false, 
        message: 'Address not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch address' 
    });
  }
};

// Add new address
const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const { type, label, street, apartment, city, state, zipCode, country, instructions } = req.body;

    // Validate required fields
    if (!street || !city || !state || !zipCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required address fields' 
      });
    }

    const newAddress = {
      type: type || 'other',
      label,
      street,
      apartment,
      city,
      state,
      zipCode,
      country: country || 'Nepal',
      instructions
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: user.addresses[user.addresses.length - 1]
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add address' 
    });
  }
};

// Update address
const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const address = user.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({ 
        success: false, 
        message: 'Address not found' 
      });
    }

    const { type, label, street, apartment, city, state, zipCode, country, instructions } = req.body;

    // Update fields
    if (type) address.type = type;
    if (label !== undefined) address.label = label;
    if (street) address.street = street;
    if (apartment !== undefined) address.apartment = apartment;
    if (city) address.city = city;
    if (state) address.state = state;
    if (zipCode) address.zipCode = zipCode;
    if (country) address.country = country;
    if (instructions !== undefined) address.instructions = instructions;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: address
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update address' 
    });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const address = user.addresses.id(req.params.addressId);
    
    if (!address) {
      return res.status(404).json({ 
        success: false, 
        message: 'Address not found' 
      });
    }

    address.remove();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete address' 
    });
  }
};

export { 
  getUsers, 
  getUser, 
  updateUser, 
  deleteUser,
  getAllAddresses,
  getAddress,
  addAddress,
  updateAddress,
  deleteAddress
};