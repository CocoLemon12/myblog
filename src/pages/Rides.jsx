import React from 'react';
import '../styles/Rides.css';

function Rides() {
  return (
    <div className="rides">
      <h1>Available Rides</h1>
      <div className="rides-list">
        {/* Rides will be added here */}
        <p>No rides available at the moment.</p>
      </div>
    </div>
  );
}

export default Rides;