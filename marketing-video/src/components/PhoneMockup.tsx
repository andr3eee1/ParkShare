import React from 'react';
import { theme } from '../theme';

export const PhoneMockup: React.FC<{ children: React.ReactNode, style?: React.CSSProperties }> = ({ children, style }) => {
  return (
    <div style={{
      width: 440,
      height: 880,
      backgroundColor: theme.colors.card,
      borderRadius: 60,
      border: `12px solid ${theme.colors.border}`,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      ...style
    }}>
      {/* Box shadow workaround */}
      <div style={{
        position: 'absolute', top: -20, left: -20, right: -20, bottom: -20, zIndex: -1,
        boxShadow: `0 30px 80px -30px ${theme.colors.primary}40` // appending hex alpha
      }} />
      
      {/* Dynamic Island */}
      <div style={{
        position: 'absolute',
        top: 15,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 120,
        height: 35,
        backgroundColor: '#000',
        borderRadius: 20,
        zIndex: 10
      }} />
      
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};
