import React, { useState, useEffect } from 'react';
import { MapPin, Truck, Clock, User, Phone, Eye, Navigation, AlertTriangle, CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

const LiveTracking = () => {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 });
  const [zoom, setZoom] = useState(12);

  // real data for active drivers
  const activeDrivers = [
    {
      id: 'DRV-001',
      name: 'Mike Wilson',
      phone: '+1 (555) 123-4567',
      status: 'on_delivery',
      currentLocation: { lat: 40.7128, lng: -74.0060 },
      assignedOrders: [
        {
          id: 'ORD-2024-001',
          customer: 'John Doe',
          restaurant: 'Pizza Palace',
          deliveryAddress: '123 Main St, City, State 12345',
          estimatedDelivery: '2024-01-15T11:15:00',
          status: 'out_for_delivery'
        }
      ],
      lastUpdate: '2024-01-15T14:30:00',
      speed: 25,
      heading: 45
    },
    {
      id: 'DRV-002',
      name: 'Sarah Johnson',
      phone: '+1 (555) 234-5678',
      status: 'available',
      currentLocation: { lat: 40.7589, lng: -73.9851 },
      assignedOrders: [],
      lastUpdate: '2024-01-15T14:25:00',
      speed: 0,
      heading: 0
    },
    {
      id: 'DRV-003',
      name: 'David Lee',
      phone: '+1 (555) 345-6789',
      status: 'on_delivery',
      currentLocation: { lat: 40.7505, lng: -73.9934 },
      assignedOrders: [
        {
          id: 'ORD-2024-002',
          customer: 'Jane Smith',
          restaurant: 'Burger King',
          deliveryAddress: '456 Oak Ave, City, State 12345',
          estimatedDelivery: '2024-01-15T10:30:00',
          status: 'out_for_delivery'
        }
      ],
      lastUpdate: '2024-01-15T14:28:00',
      speed: 18,
      heading: 120
    },
    {
      id: 'DRV-004',
      name: 'Lisa Chen',
      phone: '+1 (555) 456-7890',
      status: 'available',
      currentLocation: { lat: 40.7282, lng: -73.7949 },
      assignedOrders: [],
      lastUpdate: '2024-01-15T14:32:00',
      speed: 0,
      heading: 0
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <Badge variant="success">Available</Badge>;
      case 'on_delivery':
        return <Badge variant="primary">On Delivery</Badge>;
      case 'offline':
        return <Badge variant="warning">Offline</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  // const getStatusIcon = (status) => {
  //   switch (status) {
  //     case 'available':
  //       return <CheckCircle className="w-4 h-4 text-green-600" />;
  //     case 'on_delivery':
  //       return <Truck className="w-4 h-4 text-blue-600" />;
  //     case 'offline':
  //       return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
  //     default:
  //       return <Clock className="w-4 h-4 text-gray-600" />;
  //   }
  // };

  const handleDriverClick = (driver) => {
    setSelectedDriver(driver);
    setShowDriverModal(true);
    setMapCenter(driver.currentLocation);
    setZoom(15);
  };

  const handleCenterMap = () => {
    setMapCenter({ lat: 40.7128, lng: -74.0060 });
    setZoom(12);
  };

  // Simulate real-time location updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate driver movement
      activeDrivers.forEach(driver => {
        if (driver.status === 'on_delivery' && driver.speed > 0) {
          // Simulate small location changes
          const latChange = (0 - 0.5) * 0.001;
          const lngChange = (0 - 0.5) * 0.001;
          
          driver.currentLocation.lat += latChange;
          driver.currentLocation.lng += lngChange;
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Live Delivery Tracking</h1>
        <p className="text-gray-600">Real-time tracking of all delivery personnel</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Drivers</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeDrivers.filter(d => d.status === 'on_delivery').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Drivers</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeDrivers.filter(d => d.status === 'available').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Delivery Time</p>
              <p className="text-2xl font-bold text-gray-900">28 min</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <Navigation className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
              <p className="text-2xl font-bold text-gray-900">94.5%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Map and Driver List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Live Map</h3>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCenterMap}
                >
                  <Navigation size={16} className="mr-2" />
                  Center Map
                </Button>
                <Button size="sm" variant="outline">
                  Refresh
                </Button>
              </div>
            </div>
            
            {/* Map Placeholder */}
            <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center relative">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Interactive map would be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">
                  Center: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)} | Zoom: {zoom}
                </p>
              </div>
              
              {/* Driver Markers */}
              {activeDrivers.map((driver, index) => (
                <div
                  key={driver.id}
                  className={`absolute w-8 h-8 rounded-full border-2 border-white cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                    driver.status === 'available' ? 'bg-green-500' :
                    driver.status === 'on_delivery' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}
                  style={{
                    left: `${50 + (index - 1) * 10}%`,
                    top: `${50 + (index - 1) * 10}%`
                  }}
                  onClick={() => handleDriverClick(driver)}
                  title={`${driver.name} - ${driver.status}`}
                >
                  <div className="flex items-center justify-center h-full">
                    <Truck className="w-4 h-4 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Driver List */}
        <div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Drivers</h3>
            <div className="space-y-3">
              {activeDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleDriverClick(driver)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        driver.status === 'available' ? 'bg-green-500' :
                        driver.status === 'on_delivery' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{driver.name}</p>
                        <p className="text-sm text-gray-500">ID: {driver.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="mb-1">{getStatusBadge(driver.status)}</div>
                      <p className="text-xs text-gray-500">
                        {driver.speed > 0 ? `${driver.speed} km/h` : 'Stationary'}
                      </p>
                    </div>
                  </div>
                  
                  {driver.assignedOrders.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-600 mb-1">Assigned Orders:</p>
                      {driver.assignedOrders.map((order) => (
                        <div key={order.id} className="text-xs text-gray-700">
                          <span className="font-medium">{order.id}</span> - {order.customer}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Driver Details Modal */}
      <Modal
        isOpen={showDriverModal}
        onClose={() => setShowDriverModal(false)}
        title="Driver Details"
        size="lg"
      >
        {selectedDriver && (
          <div className="space-y-6">
            {/* Driver Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Driver Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Name:</span>
                    <span className="text-sm text-gray-900">{selectedDriver.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Phone:</span>
                    <span className="text-sm text-gray-900">{selectedDriver.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedDriver.status)}</div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Speed:</span>
                    <span className="text-sm text-gray-900">
                      {selectedDriver.speed > 0 ? `${selectedDriver.speed} km/h` : 'Stationary'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Location Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Latitude:</span>
                    <span className="text-sm text-gray-900">{selectedDriver.currentLocation.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Longitude:</span>
                    <span className="text-sm text-gray-900">{selectedDriver.currentLocation.lng.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Last Update:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(selectedDriver.lastUpdate).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-24">Heading:</span>
                    <span className="text-sm text-gray-900">{selectedDriver.heading}°</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Orders */}
            {selectedDriver.assignedOrders.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Assigned Orders</h4>
                <div className="space-y-3">
                  {selectedDriver.assignedOrders.map((order) => (
                    <div key={order.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{order.id}</span>
                        <Badge variant="primary">{order.status.replace('_', ' ')}</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Customer:</span> {order.customer}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Restaurant:</span> {order.restaurant}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Delivery Address:</span> {order.deliveryAddress}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">ETA:</span> {new Date(order.estimatedDelivery).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDriverModal(false)}
              >
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMapCenter(selectedDriver.currentLocation);
                  setZoom(15);
                  setShowDriverModal(false);
                }}
              >
                <MapPin size={16} className="mr-2" />
                Center on Map
              </Button>
              <Button
                onClick={() => {
                  // Implement call driver functionality
                  console.log('Calling driver:', selectedDriver.phone);
                }}
              >
                <Phone size={16} className="mr-2" />
                Call Driver
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LiveTracking;
