import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../context/NotificationContext';
import {
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  User,
  Phone,
  MapPin,
  Calendar,
  Package,
  TrendingUp,
  MoreVertical,
  ArrowLeft,
  RefreshCw,
  Download,
  Printer,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';

const OrdersManagement = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching orders from API...');
      
      // Get current restaurant ID from user data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const restaurantId = userData._id;
      
      
      if (!restaurantId) {
        console.error('No restaurant ID found in user data');
        setOrders([]);
        setLoading(false);
        return;
      }
      
      const response = await api.get('/restaurant/orders');
      
      if (response.data.success && response.data.data) {
        // Handle the correct API response structure: { success: true, data: { orders: [...] } }
        const ordersData = response.data.data.orders || response.data.data || [];
        
        // Transform the data to match the expected format
        console.log('Raw orders data:', ordersData);
        const transformedOrders = ordersData.map(order => {
          console.log('Processing order:', order._id, 'Customer data:', order.customer);
          return {
          id: order._id || order.orderId,
            orderNumber: order.orderNumber || order._id,
            customerName: order.customer?.name || 
                         order.customer?.customerProfile?.name || 
                         (order.customer?.firstName && order.customer?.lastName ? 
                           order.customer.firstName + ' ' + order.customer.lastName : null) ||
                         order.customer?.fullName ||
                         order.customer?.email ||
                         'Unknown Customer',
            customerPhone: order.customer?.phone || 'N/A',
          customerAddress: order.deliveryAddress?.street ? 
            `${order.deliveryAddress.street}, ${order.deliveryAddress.city}` : 
            'N/A',
          orderDate: new Date(order.createdAt).toISOString().split('T')[0],
          orderTime: new Date(order.createdAt).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          status: order.status || 'pending',
          totalAmount: order.pricing?.total || order.totalAmount || 0,
          items: order.items || [],
          paymentMethod: order.paymentMethod || 'Cash on Delivery',
          deliveryTime: order.estimatedDeliveryTime ? 
            new Date(order.estimatedDeliveryTime).toLocaleTimeString() : 
            '30-45 minutes',
          deliveryCharge: order.pricing?.deliveryCharge || order.deliveryCharge || 0,
          zone: order.deliveryAddress?.zone || order.zone || 'Zone A - West Bay',
          zoneName: order.deliveryAddress?.zoneName || order.zoneName || 'West Bay',
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          // Include original order data for modal
          originalOrder: order
          };
        });
        
        setOrders(transformedOrders);
      } else {
        console.warn('No orders data received from API');
        setOrders([]);
        showNotification('No orders data available', 'warning');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      showNotification('Failed to load orders. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.orderNumber && order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.customerPhone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesDate = !filterDate || order.orderDate === filterDate;

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Clear selections when filters change
  useEffect(() => {
    setSelectedOrders([]);
    setShowBulkActions(false);
  }, [searchTerm, filterStatus, filterDate]);

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'placed':
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' };
      case 'confirmed':
        return { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Confirmed' };
      case 'preparing':
        return { color: 'bg-orange-100 text-orange-800', icon: Package, label: 'Preparing' };
      case 'ready':
        return { color: 'bg-purple-100 text-purple-800', icon: AlertCircle, label: 'Ready' };
      case 'picked_up':
        return { color: 'bg-indigo-100 text-indigo-800', icon: Package, label: 'Picked Up' };
      case 'delivered':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Delivered' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: Clock, label: status || 'Unknown' };
    }
  };

  // Export orders to CSV
  const exportOrders = () => {
    const csvContent = [
      ['Order ID', 'Customer Name', 'Customer Phone', 'Order Date', 'Status', 'Total Amount', 'Payment Method'],
      ...filteredOrders.map(order => [
        order.orderNumber || order.id,
        order.customerName,
        order.customerPhone,
        order.orderDate,
        order.status,
        order.totalAmount,
        order.paymentMethod
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `restaurant-orders-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Orders exported successfully', 'success');
  };

  // Print individual order
  const printOrder = (order) => {
    const printContent = `
      <html>
        <head>
          <title>Invoice - ${order.orderNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            
            * {
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
              margin: 0; 
              padding: 0;
              background: #f8fafc;
              color: #1e293b;
              line-height: 1.6;
            }
            
            .invoice-container {
              max-width: 700px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              border-radius: 16px;
              overflow: hidden;
              position: relative;
            }
            
            .invoice-container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 6px;
              background: linear-gradient(90deg, #f59e0b 0%, #f97316 25%, #ea580c 50%, #dc2626 75%, #b91c1c 100%);
            }
            
            .header { 
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white;
              padding: 40px 30px;
              position: relative;
              overflow: hidden;
            }
            
            .header::after {
              content: '';
              position: absolute;
              top: -50%;
              right: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
              animation: pulse 4s ease-in-out infinite;
            }
            
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
            
            .header-content {
              position: relative;
              z-index: 2;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            
            .company-info {
              flex: 1;
            }
            
            .company-name {
              font-size: 32px;
              font-weight: 800;
              margin: 0 0 8px 0;
              background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              letter-spacing: -0.02em;
            }
            
            .company-tagline {
              font-size: 16px;
              margin: 0 0 20px 0;
              opacity: 0.9;
              font-weight: 400;
              color: #cbd5e1;
            }
            
            .invoice-meta {
              text-align: right;
              flex-shrink: 0;
            }
            
            .invoice-title {
              font-size: 28px;
              font-weight: 700;
              margin: 0 0 10px 0;
              color: #f59e0b;
            }
            
            .order-number {
              font-size: 18px;
              font-weight: 600;
              margin: 0 0 8px 0;
              background: rgba(245, 158, 11, 0.2);
              padding: 8px 16px;
              border-radius: 12px;
              display: inline-block;
              border: 1px solid rgba(245, 158, 11, 0.3);
            }
            
            .generated-info {
              font-size: 14px;
              margin: 0;
              opacity: 0.8;
              color: #94a3b8;
            }
            
            .content {
              padding: 40px 30px;
            }
            
            .invoice-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 40px;
            }
            
            .invoice-section {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border-radius: 16px;
              padding: 24px;
              border: 1px solid #e2e8f0;
              position: relative;
              overflow: hidden;
            }
            
            .invoice-section::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 4px;
              height: 100%;
              background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
            }
            
            .section-header {
              display: flex;
              align-items: center;
              margin-bottom: 20px;
            }
            
            .section-icon {
              width: 40px;
              height: 40px;
              background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 12px;
              font-size: 18px;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: 700;
              color: #1e293b;
              margin: 0;
            }
            
            .info-grid {
              display: grid;
              gap: 12px;
            }
            
            .info-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .info-item:last-child {
              border-bottom: none;
            }
            
            .info-label {
              font-weight: 600;
              color: #64748b;
              font-size: 14px;
            }
            
            .info-value {
              color: #1e293b;
              font-weight: 500;
              font-size: 14px;
              text-align: right;
              max-width: 60%;
            }
            
            .status-badge {
              display: inline-flex;
              align-items: center;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .status-ready { 
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
              color: #1e40af;
              border: 1px solid #93c5fd;
            }
            .status-delivered { 
              background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
              color: #166534;
              border: 1px solid #86efac;
            }
            .status-cancelled { 
              background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
              color: #991b1b;
              border: 1px solid #fca5a5;
            }
            .status-confirmed { 
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              color: #0c4a6e;
              border: 1px solid #7dd3fc;
            }
            .status-preparing { 
              background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
              color: #92400e;
              border: 1px solid #fde68a;
            }
            .status-placed { 
              background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
              color: #7c2d12;
              border: 1px solid #c4b5fd;
            }
            
            .items-section {
              margin: 40px 0;
            }
            
            .items-table { 
              width: 100%; 
              border-collapse: separate;
              border-spacing: 0;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              border: 1px solid #e2e8f0;
            }
            
            .items-table th { 
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white;
              font-weight: 700;
              font-size: 14px;
              padding: 20px 16px;
              text-align: left;
              letter-spacing: 0.5px;
            }
            
            .items-table th:first-child {
              border-top-left-radius: 16px;
            }
            
            .items-table th:last-child {
              border-top-right-radius: 16px;
              text-align: right;
            }
            
            .items-table td { 
              padding: 16px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 14px;
              vertical-align: middle;
            }
            
            .items-table tr:last-child td {
              border-bottom: none;
            }
            
            .items-table tr:nth-child(even) td {
              background-color: #f8fafc;
            }
            
            .item-name {
              font-weight: 600;
              color: #1e293b;
            }
            
            .item-quantity {
              text-align: center;
              font-weight: 600;
              color: #64748b;
              background: #f1f5f9;
              padding: 4px 12px;
              border-radius: 8px;
              display: inline-block;
            }
            
            .item-price, .item-total {
              text-align: right;
              font-weight: 600;
              color: #1e293b;
            }
            
            .total-section { 
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white;
              padding: 30px;
              border-radius: 16px;
              text-align: right;
              margin-top: 30px;
              position: relative;
              overflow: hidden;
            }
            
            .total-section::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="70" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
            }
            
            .total-content {
              position: relative;
              z-index: 2;
            }
            
            .total-amount {
              font-size: 32px;
              font-weight: 800;
              margin: 0;
              background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              letter-spacing: -0.02em;
            }
            
            .footer {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            
            .footer-content {
              max-width: 500px;
              margin: 0 auto;
            }
            
            .thank-you {
              font-size: 16px;
              font-weight: 600;
              color: #1e293b;
              margin-bottom: 12px;
            }
            
            .support-info {
              font-size: 14px;
              color: #64748b;
              margin: 0;
            }
            @media print {
              body { 
                background: white; 
                margin: 0;
                padding: 0;
              }
              .invoice-container { 
                box-shadow: none; 
                max-width: none;
                width: 100%;
                margin: 0;
                border-radius: 0;
              }
              .header {
                padding: 20px 15px;
              }
              .header::after {
                display: none;
              }
              .company-name {
                font-size: 24px;
              }
              .invoice-title {
                font-size: 20px;
              }
              .order-number {
                font-size: 14px;
                padding: 6px 12px;
              }
              .content {
                padding: 20px 15px;
              }
              .invoice-grid {
                grid-template-columns: 1fr;
                gap: 20px;
              }
              .invoice-section {
                padding: 16px;
              }
              .section-icon {
                width: 32px;
                height: 32px;
                font-size: 14px;
              }
              .section-title {
                font-size: 16px;
              }
              .info-item {
                padding: 8px 0;
                font-size: 12px;
              }
              .items-table th, .items-table td {
                padding: 10px 8px;
                font-size: 11px;
              }
              .total-section {
                padding: 20px;
                margin-top: 20px;
              }
              .total-amount {
                font-size: 24px;
              }
              .footer {
                padding: 15px;
                font-size: 12px;
              }
              @page {
                size: A5;
                margin: 0.5cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="header-content">
                <div class="company-info">
                  <h1 class="company-name">HypeBridge</h1>
                  <p class="company-tagline">Fast, Fresh, Delicious</p>
                </div>
                <div class="invoice-meta">
                  <h2 class="invoice-title">INVOICE</h2>
                  <div class="order-number">${order.orderNumber}</div>
                  <p class="generated-info">Generated: ${new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div class="content">
              <div class="invoice-grid">
                <div class="invoice-section">
                  <div class="section-header">
                    <div class="section-icon">👤</div>
                    <h3 class="section-title">Customer Information</h3>
                  </div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">Name</span>
                      <span class="info-value">${order.customerName}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Phone</span>
                      <span class="info-value">${order.customerPhone}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Address</span>
                      <span class="info-value">${order.customerAddress}</span>
                    </div>
                  </div>
                </div>
                
                <div class="invoice-section">
                  <div class="section-header">
                    <div class="section-icon">📋</div>
                    <h3 class="section-title">Order Details</h3>
                  </div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">Order Date</span>
                      <span class="info-value">${order.orderDate} at ${order.orderTime}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Payment Method</span>
                      <span class="info-value">${order.paymentMethod}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Status</span>
                      <span class="status-badge status-${order.status}">${order.status.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
          
              <div class="items-section">
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.items?.map(item => `
                      <tr>
                        <td class="item-name">${item.menuItem?.name || item.name || 'Unknown Item'}</td>
                        <td class="item-quantity">${item.quantity}</td>
                        <td class="item-price">NPR ${item.menuItem?.price || item.price || 0}</td>
                        <td class="item-total">NPR ${(item.menuItem?.price || item.price || 0) * item.quantity}</td>
                      </tr>
                    `).join('') || '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #64748b; font-style: italic;">No items found</td></tr>'}
                  </tbody>
                </table>
              </div>
              
              <div class="total-section">
                <div class="total-content">
                  <div class="total-amount">NPR ${order.totalAmount}</div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-content">
                <p class="thank-you">Thank you for choosing HypeBridge!</p>
                <p class="support-info">For support, contact us at support@hypebridge.com</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    
    showNotification('Professional invoice opened for printing (A5 format)', 'success');
  };

  // Print orders
  const printOrders = () => {
    const printContent = `
      <html>
        <head>
          <title>Orders Report - ${new Date().toLocaleDateString()}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            
            * {
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
              margin: 0; 
              padding: 0;
              background: #f8fafc;
              color: #1e293b;
              line-height: 1.6;
            }
            
            .report-container {
              max-width: 900px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              border-radius: 16px;
              overflow: hidden;
              position: relative;
            }
            
            .report-container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 6px;
              background: linear-gradient(90deg, #f59e0b 0%, #f97316 25%, #ea580c 50%, #dc2626 75%, #b91c1c 100%);
            }
            
            .header { 
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            
            .header::after {
              content: '';
              position: absolute;
              top: -50%;
              right: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
              animation: pulse 4s ease-in-out infinite;
            }
            
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
            
            .header-content {
              position: relative;
              z-index: 2;
            }
            
            .company-name {
              font-size: 32px;
              font-weight: 800;
              margin: 0 0 8px 0;
              background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              letter-spacing: -0.02em;
            }
            
            .company-tagline {
              font-size: 16px;
              margin: 0 0 20px 0;
              opacity: 0.9;
              font-weight: 400;
              color: #cbd5e1;
            }
            
            .report-title {
              font-size: 24px;
              font-weight: 700;
              margin: 0 0 10px 0;
              color: #f59e0b;
              background: rgba(245, 158, 11, 0.2);
              padding: 12px 24px;
              border-radius: 16px;
              display: inline-block;
              border: 1px solid rgba(245, 158, 11, 0.3);
            }
            
            .report-info {
              font-size: 14px;
              margin: 0;
              opacity: 0.8;
              color: #94a3b8;
            }
            
            .content {
              padding: 40px 30px;
            }
            
            .stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-bottom: 40px;
            }
            
            .stat-item {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border-radius: 16px;
              padding: 24px;
              text-align: center;
              border: 1px solid #e2e8f0;
              position: relative;
              overflow: hidden;
            }
            
            .stat-item::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 4px;
              height: 100%;
              background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
            }
            
            .stat-number {
              font-size: 28px;
              font-weight: 800;
              color: #f59e0b;
              margin-bottom: 8px;
              background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            
            .stat-label {
              font-size: 14px;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .table-container {
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              border: 1px solid #e2e8f0;
            }
            
            table { 
              width: 100%; 
              border-collapse: separate;
              border-spacing: 0;
            }
            
            th { 
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              color: white;
              font-weight: 700;
              font-size: 14px;
              padding: 20px 16px;
              text-align: left;
              letter-spacing: 0.5px;
            }
            
            th:first-child {
              border-top-left-radius: 16px;
            }
            
            th:last-child {
              border-top-right-radius: 16px;
            }
            
            td { 
              padding: 16px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 14px;
              vertical-align: middle;
            }
            
            tr:last-child td {
              border-bottom: none;
            }
            
            tr:nth-child(even) td {
              background-color: #f8fafc;
            }
            
            .status-cell {
              text-transform: capitalize;
              font-weight: 600;
              padding: 6px 12px;
              border-radius: 8px;
              font-size: 12px;
            }
            
            .status-delivered { 
              background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
              color: #166534;
            }
            .status-cancelled { 
              background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
              color: #991b1b;
            }
            .status-ready { 
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
              color: #1e40af;
            }
            .status-confirmed { 
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              color: #0c4a6e;
            }
            .status-preparing { 
              background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
              color: #92400e;
            }
            .status-placed { 
              background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
              color: #7c2d12;
            }
            
            .footer {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            
            .footer-content {
              max-width: 500px;
              margin: 0 auto;
            }
            
            .thank-you {
              font-size: 16px;
              font-weight: 600;
              color: #1e293b;
              margin-bottom: 12px;
            }
            
            .support-info {
              font-size: 14px;
              color: #64748b;
              margin: 0;
            }
            @media print {
              body { 
                background: white; 
                margin: 0;
                padding: 0;
              }
              .report-container { 
                box-shadow: none; 
                max-width: none;
                width: 100%;
                margin: 0;
                border-radius: 0;
              }
              .header {
                padding: 20px 15px;
              }
              .header::after {
                display: none;
              }
              .company-name {
                font-size: 24px;
              }
              .report-title {
                font-size: 18px;
                padding: 8px 16px;
              }
              .content {
                padding: 20px 15px;
              }
              .stats {
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 25px;
              }
              .stat-item {
                padding: 16px;
              }
              .stat-number {
                font-size: 20px;
              }
              .stat-label {
                font-size: 12px;
              }
              table th, table td {
                padding: 8px 6px;
                font-size: 10px;
              }
              .footer {
                padding: 15px;
                font-size: 12px;
              }
              @page {
                size: A5;
                margin: 0.5cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <div class="header-content">
                <h1 class="company-name">HypeBridge</h1>
                <p class="company-tagline">Fast, Fresh, Delicious</p>
                <div class="report-title">ORDERS REPORT</div>
                <p class="report-info">Generated: ${new Date().toLocaleString()}</p>
              </div>
            </div>
            
            <div class="content">
              <div class="stats">
                <div class="stat-item">
                  <div class="stat-number">${filteredOrders.length}</div>
                  <div class="stat-label">Total Orders</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">NPR ${filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)}</div>
                  <div class="stat-label">Total Revenue</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">${filteredOrders.filter(o => o.status === 'delivered').length}</div>
                  <div class="stat-label">Delivered</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">${filteredOrders.filter(o => ['pending', 'placed', 'confirmed', 'preparing'].includes(o.status)).length}</div>
                  <div class="stat-label">Active Orders</div>
                </div>
              </div>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Name</th>
                      <th>Customer Phone</th>
                      <th>Order Date</th>
                      <th>Status</th>
                      <th>Total Amount</th>
                      <th>Payment Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredOrders.map(order => `
                      <tr>
                        <td style="font-weight: 600;">${order.orderNumber || order.id}</td>
                        <td>${order.customerName}</td>
                        <td>${order.customerPhone}</td>
                        <td>${order.orderDate}</td>
                        <td><span class="status-cell status-${order.status}">${order.status}</span></td>
                        <td style="font-weight: 600; color: #f59e0b;">NPR ${order.totalAmount}</td>
                        <td style="text-transform: capitalize;">${order.paymentMethod}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-content">
                <p class="thank-you">Thank you for using HypeBridge Management System!</p>
                <p class="support-info">For support, contact us at support@hypebridge.com</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    
    showNotification('Professional orders report opened for printing (A5 format)', 'success');
  };

  // Handle individual order selection
  const handleOrderSelect = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        const newSelected = prev.filter(id => id !== orderId);
        setShowBulkActions(newSelected.length > 0);
        return newSelected;
      } else {
        const newSelected = [...prev, orderId];
        setShowBulkActions(newSelected.length > 0);
        return newSelected;
      }
    });
  };

  // Handle select all orders
  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
      setShowBulkActions(false);
    } else {
      const allOrderIds = filteredOrders.map(order => order.id);
      setSelectedOrders(allOrderIds);
      setShowBulkActions(true);
    }
  };

  // Bulk update order status
  const bulkUpdateOrderStatus = async (newStatus) => {
    try {
      const promises = selectedOrders.map(orderId => 
        api.put(`/restaurant/orders/${orderId}`, { status: newStatus })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(result => result.data.success).length;
      
      if (successCount > 0) {
        // Update local state
        setOrders(orders.map(order => 
          selectedOrders.includes(order.id) 
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
            : order
        ));
        
        showNotification(`${successCount} orders updated to ${newStatus}`, 'success');
      }
      
      // Clear selection
      setSelectedOrders([]);
      setShowBulkActions(false);
      
    } catch (error) {
      showNotification('Error updating orders', 'error');
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      
      const response = await api.put(`/restaurant/orders/${orderId}`, { 
        status: newStatus
      });
      
      
      if (response.data.success) {
        // Update the order in the local state
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order
        ));
        
        // Show success notification
        showNotification(`Order status updated to ${newStatus}`, 'success');
      } else {
        showNotification('Failed to update order status', 'error');
      }
    } catch (error) {
      showNotification('Error updating order status', 'error');
    }
  };

  // Get order statistics
  const getOrderStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(order => order.orderDate === today);
    
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending' || o.status === 'placed').length,
      today: todayOrders.length,
      revenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    };
    
    
    return stats;
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full">
        <div className="p-4 lg:p-6">
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate('/restaurant/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </button>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Orders Management</h1>
                <p className="text-gray-600">Manage and track your restaurant orders</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                <button
                  onClick={fetchOrders}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button 
                  onClick={exportOrders}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button 
                  onClick={printOrders}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">NPR {stats.revenue}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search orders by customer name, order ID, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="placed">Placed</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-orange-800">
                    {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => bulkUpdateOrderStatus('confirmed')}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Confirm Selected
                    </button>
                    <button
                      onClick={() => bulkUpdateOrderStatus('preparing')}
                      className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Start Preparing
                    </button>
                    <button
                      onClick={() => bulkUpdateOrderStatus('ready')}
                      className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Mark Ready
                    </button>
                    <button
                      onClick={() => bulkUpdateOrderStatus('delivered')}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Mark Delivered
                    </button>
                    <button
                      onClick={() => bulkUpdateOrderStatus('cancelled')}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancel Selected
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedOrders([]);
                    setShowBulkActions(false);
                  }}
                  className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Orders Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-50 to-orange-100 border-b-2 border-orange-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                        />
                        <span>Order ID</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">Delivery</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">Zone</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredOrders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <tr key={order.id} className="hover:bg-orange-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={() => handleOrderSelect(order.id)}
                              className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                            />
                            <div className="text-sm font-semibold text-gray-900">{order.orderNumber || order.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.customerPhone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.orderDate}</div>
                          <div className="text-sm text-gray-500">{order.orderTime}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            {order.items?.[0] ? (
                              <>
                                {(() => {
                                  const firstItem = order.items[0];
                                  const itemImage = firstItem.menuItem?.images?.[0] || 
                                                   firstItem.menuItem?.image || 
                                                   firstItem.image || 
                                                   null;
                                  return itemImage ? (
                                    <img 
                                      src={itemImage} 
                                      alt={firstItem.menuItem?.name || firstItem.name || 'Item'} 
                                      className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                      <Package className="w-5 h-5 text-gray-400" />
                                    </div>
                                  );
                                })()}
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{order.items.length} items</div>
                                  <div className="text-sm text-gray-500">{order.items[0].menuItem?.name || order.items[0].name || 'N/A'}</div>
                                </div>
                              </>
                            ) : (
                              <>
                                <Package className="w-5 h-5 text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">0 items</div>
                                  <div className="text-sm text-gray-500">No items</div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">NPR {order.totalAmount}</div>
                          <div className="text-sm text-gray-500">{order.paymentMethod}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">NPR {order.deliveryCharge || 0}</div>
                          <div className="text-sm text-gray-500">Delivery Fee</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-orange-500" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{order.zone}</div>
                              <div className="text-sm text-gray-500">{order.zoneName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${statusInfo.color} shadow-sm`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderModal(true);
                              }}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => printOrder(order)}
                              className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200"
                              title="Print Order"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            {(order.status === 'pending' || order.status === 'placed') && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200"
                                title="Confirm Order"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {order.status === 'confirmed' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'preparing')}
                                className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-all duration-200"
                                title="Start Preparing"
                              >
                                <Package className="w-4 h-4" />
                              </button>
                            )}
                            {order.status === 'preparing' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'ready')}
                                className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-all duration-200"
                                title="Mark Ready for Pickup"
                              >
                                <AlertCircle className="w-4 h-4" />
                              </button>
                            )}
                            {order.status === 'ready' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200"
                                title="Mark Delivered"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {(order.status === 'pending' || order.status === 'placed' || order.status === 'confirmed') && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Cancel Order"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {filteredOrders.length === 0 && !loading && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500 mb-2">
                {searchTerm || filterStatus !== 'all' || filterDate
                  ? 'No orders found'
                  : 'No orders yet'
                }
              </p>
              <p className="text-sm text-gray-400 mb-4">
                {searchTerm || filterStatus !== 'all' || filterDate
                  ? 'Try adjusting your search or filters to find orders'
                  : 'Your restaurant orders will appear here when customers place orders'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Order Details - {selectedOrder.orderNumber || selectedOrder.id}</h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{selectedOrder.customerPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{selectedOrder.customerAddress}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      <span className="font-medium text-orange-600">{selectedOrder.zone}</span>
                    </div>
                  </div>
                </div>

                {/* Order Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{selectedOrder.orderDate} at {selectedOrder.orderTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>Delivery Time: {selectedOrder.deliveryTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span>Payment: {selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-orange-500" />
                      <span>Delivery Charge: NPR {selectedOrder.deliveryCharge || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, index) => {
                      // Get the best available image
                      const itemImage = item.menuItem?.images?.[0] || 
                                       item.menuItem?.image || 
                                       item.image || 
                                       null;
                      
                      return (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center space-x-4">
                            {itemImage ? (
                              <img 
                                src={itemImage} 
                                alt={item.menuItem?.name || item.name || 'Unknown Item'} 
                                className="w-16 h-16 rounded-lg object-cover border border-gray-300"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-gray-200 border border-gray-300 flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">
                                  {item.menuItem?.name || item.name || 'Unknown Item'}
                                </span>
                                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                                  x{item.quantity || 1}
                                </span>
                              </div>
                              {item.menuItem?.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {item.menuItem.description}
                                </p>
                              )}
                              {item.customizations && item.customizations.length > 0 && (
                                <div className="text-xs text-gray-500 mt-2">
                                  <span className="font-medium">Customizations:</span>
                                  <div className="mt-1">
                                    {item.customizations.map((custom, idx) => (
                                      <span key={idx} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded mr-1 mb-1">
                                        {custom.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              NPR {(item.menuItem?.price || item.price || 0) * (item.quantity || 1)}
                            </div>
                            <div className="text-sm text-gray-500">
                              NPR {item.menuItem?.price || item.price || 0} each
                            </div>
                          </div>
                        </div>
                      );
                    }) || (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No items found for this order</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>NPR {(selectedOrder.totalAmount || 0) - (selectedOrder.deliveryCharge || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Delivery Charge</span>
                        <span>NPR {selectedOrder.deliveryCharge || 0}</span>
                      </div>
                      <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border-2 border-orange-200">
                        <span className="font-bold text-xl text-orange-900">Total Amount</span>
                        <span className="font-bold text-xl text-orange-900">NPR {selectedOrder.totalAmount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Status */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Status</h3>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const statusInfo = getStatusInfo(selectedOrder.status);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusInfo.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Handle order actions
                    setShowOrderModal(false);
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
