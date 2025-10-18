// OverviewStats Component
// This file structure created as per requested organization
import React from 'react';
import StatCard from '../../common/widgets/StatCard';

const OverviewStats = ({ stats }) => {
  return (
    <div className="overview-stats">
      <div className="stats-grid">
        {stats?.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
          />
        ))}
      </div>
    </div>
  );
};

export default OverviewStats;
