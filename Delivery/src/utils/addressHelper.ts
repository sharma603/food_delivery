/**
 * Helper functions to get customer addresses from Customer table
 */

export const getCustomerAddressFromOrder = (order: any): string => {
  // First try to match order's deliveryAddress with customer's addresses
  if (order.customer?.addresses && Array.isArray(order.customer.addresses) && order.customer.addresses.length > 0) {
    let addressToUse = null;
    
    // Try to find matching address based on street and city
    if (order.deliveryAddress?.street && order.deliveryAddress?.city) {
      addressToUse = order.customer.addresses.find((addr: any) => 
        addr.street?.toLowerCase() === order.deliveryAddress.street?.toLowerCase() &&
        addr.city?.toLowerCase() === order.deliveryAddress.city?.toLowerCase()
      );
    }
    
    // If no match found, use default address, otherwise first address
    if (!addressToUse) {
      addressToUse = order.customer.addresses.find((addr: any) => addr.isDefault) || order.customer.addresses[0];
    }
    
    // Format address from Customer table
    if (addressToUse) {
      const parts = [
        addressToUse.apartment,
        addressToUse.street,
        addressToUse.city,
        addressToUse.state,
        addressToUse.zipCode
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : '';
    }
  }
  
  // Fallback to order's deliveryAddress
  return formatAddress(order.deliveryAddress);
};

export const formatAddress = (addr: any): string => {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  const parts = [
    addr.apartment,
    addr.street, 
    addr.city, 
    addr.state, 
    addr.zipCode || addr.pincode
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '';
};

