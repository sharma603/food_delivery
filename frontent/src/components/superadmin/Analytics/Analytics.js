import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';

const Analytics = ({ user, onLogout }) => {
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: '$0',
    totalOrders: 0,
    activeUsers: 0,
    topRestaurants: [],
    monthlyGrowth: '0%',
    customerSatisfaction: 'N/A',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await api.get('/superadmin/dashboard/analytics');

        if (response.data.success) {
          setAnalyticsData(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="analytics">
        <main className="analytics-content">
          <div className="analytics-header">
            <h1>Analytics Dashboard</h1>
            <p>Loading analytics data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics">
        <main className="analytics-content">
          <div className="analytics-header">
            <h1>Analytics Dashboard</h1>
            <p className="error-message">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="analytics">

      <main className="analytics-content">
        <div className="analytics-header">
          <h1>Analytics Dashboard</h1>
          <p>Comprehensive insights into your food delivery platform</p>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Total Revenue</h3>
            <p className="metric-value">{analyticsData.totalRevenue}</p>
            <span className="metric-change positive">+12% from last month</span>
          </div>
          <div className="metric-card">
            <h3>Total Orders</h3>
            <p className="metric-value">{analyticsData.totalOrders}</p>
            <span className="metric-change positive">+8% from last month</span>
          </div>
          <div className="metric-card">
            <h3>Active Users</h3>
            <p className="metric-value">{analyticsData.activeUsers}</p>
            <span className="metric-change positive">+22% from last month</span>
          </div>
          <div className="metric-card">
            <h3>Customer Satisfaction</h3>
            <p className="metric-value">{analyticsData.customerSatisfaction}</p>
            <span className="metric-change positive">+0.2 from last month</span>
          </div>
        </div>

        <div className="charts-section">
          <div className="chart-card">
            <h3>Revenue Trends</h3>
            <div className="chart-placeholder">
              <p>Revenue chart would go here</p>
              <div className="chart-placeholder">Chart will be implemented with real data</div>
            </div>
          </div>
          <div className="chart-card">
            <h3>Order Volume</h3>
            <div className="chart-placeholder">
              <p>Order volume chart would go here</p>
              <div className="chart-placeholder">Chart will be implemented with real data</div>
            </div>
          </div>
        </div>

        <div className="top-restaurants">
          <h3>Top Performing Restaurants</h3>
          <div className="restaurants-list">
            {analyticsData.topRestaurants.length > 0 ? (
              analyticsData.topRestaurants.map((restaurant, index) => (
                <div key={index} className="restaurant-item">
                  <div className="restaurant-info">
                    <h4>{restaurant.name}</h4>
                    <p>{restaurant.orders} orders • {restaurant.revenue} revenue</p>
                  </div>
                  <div className="restaurant-rank">#{index + 1}</div>
                </div>
              ))
            ) : (
              <p className="no-data">No restaurant data available yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
