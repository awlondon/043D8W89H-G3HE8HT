import React from 'react';

export const PlaceholderCard: React.FC<{ title: string }> = ({ title, children }) => (
  <div style={{ border: '1px solid #ccc', padding: 12 }}>
    <h3>{title}</h3>
    <div>{children}</div>
  </div>
);
