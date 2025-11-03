// TopRestaurants Component
// This file structure created as per requested organization
import React from 'react';

const TopRestaurants = ({ restaurants = [] }) => {
  return (
    <div className="top-restaurants">
      <h3>Top Performing Restaurants</h3>
      <div className="restaurants-list">
        {restaurants.map((restaurant, index) => (
          <div key={index} className="restaurant-item">
            <div className="restaurant-rank">#{index + 1}</div>
            <div className="restaurant-info">
              <h4>{restaurant.name}</h4>
              <p>{restaurant.revenue}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopRestaurants;
