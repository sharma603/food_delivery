// RevenueChart Component
// This file structure created as per requested organization
import React from 'react';
import LineChart from '../../common/charts/LineChart';

const RevenueChart = ({ data }) => {
  return (
    <div className="revenue-chart-container">
      <h3>Revenue Overview</h3>
      <LineChart data={data} />
    </div>
  );
};

export default RevenueChart;
