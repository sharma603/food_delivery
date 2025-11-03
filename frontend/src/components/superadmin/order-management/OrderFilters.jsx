import React, { useState, useEffect } from 'react';
import { superadminApi } from '../../../services/api/superadminApi';
import './OrderFilters.css';

const OrderFilters = ({ filters, onFilterChange, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'placed', label: 'Placed' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'picked_up', label: 'Picked Up' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const paymentStatusOptions = [
    { value: '', label: 'All Payment Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ];

  const dateRangeOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' }
  ];

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await superadminApi.getAllRestaurants();
      setRestaurants(response.data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleDateRangeChange = (value) => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = '';

    switch (value) {
      case 'today':
        dateFrom = today.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFrom = yesterday.toISOString().split('T')[0];
        dateTo = yesterday.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        dateFrom = weekStart.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        dateFrom = monthStart.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      default:
        break;
    }

    setLocalFilters({
      ...localFilters,
      dateRange: value,
      dateFrom,
      dateTo
    });
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
    onClose();
  };

  const clearFilters = () => {
    const clearedFilters = {
      status: '',
      restaurant: '',
      paymentStatus: '',
      dateRange: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const resetFilters = () => {
    setLocalFilters(filters);
  };

  return (
    <div className="order-filters">
      <div className="filters-header">
        <h3>Filter Orders</h3>
        <button onClick={onClose} className="close-btn">
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="filters-content">
        <div className="filter-row">
          <div className="filter-group">
            <label>Order Status</label>
            <select
              value={localFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Payment Status</label>
            <select
              value={localFilters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
            >
              {paymentStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>Restaurant</label>
            <select
              value={localFilters.restaurant}
              onChange={(e) => handleFilterChange('restaurant', e.target.value)}
              disabled={loading}
            >
              <option value="">All Restaurants</option>
              {restaurants.map(restaurant => (
                <option key={restaurant._id} value={restaurant._id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Date Range</label>
            <select
              value={localFilters.dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {localFilters.dateRange === 'custom' && (
          <div className="filter-row">
            <div className="filter-group">
              <label>From Date</label>
              <input
                type="date"
                value={localFilters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>To Date</label>
              <input
                type="date"
                value={localFilters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="filter-row">
          <div className="filter-group full-width">
            <label>Search</label>
            <input
              type="text"
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by order ID, customer name, or restaurant..."
            />
          </div>
        </div>
      </div>

      <div className="filters-actions">
        <button onClick={clearFilters} className="btn btn-secondary">
          Clear All
        </button>
        <button onClick={resetFilters} className="btn btn-secondary">
          Reset
        </button>
        <button onClick={applyFilters} className="btn btn-primary">
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default OrderFilters;
