import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

export const AestheticBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ 
      background: `radial-gradient(circle at center, ${theme.colors.accent}, ${theme.colors.background})`,
      overflow: 'hidden' 
    }}>
      {/* Moving Wireframe Grid */}
      <div style={{
        position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
        backgroundImage: `linear-gradient(${theme.colors.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.colors.border} 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        transform: `translateY(${t * 30}px) rotate(15deg)`,
        maskImage: 'radial-gradient(circle at center, black 20%, transparent 60%)',
        WebkitMaskImage: 'radial-gradient(circle at center, black 20%, transparent 60%)',
      }} />

      {/* Floating Ambient Green Blur Orbs */}
      <div style={{
        position: 'absolute', top: '20%', left: '30%', width: 600, height: 600,
        background: `radial-gradient(circle, ${theme.colors.primaryStart}, transparent)`,
        borderRadius: '50%',
        filter: 'blur(100px)',
        transform: `translate(${Math.sin(t * 0.5) * 100}px, ${Math.cos(t * 0.3) * 100}px)`,
        opacity: 0.15
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '20%', width: 800, height: 800,
        background: `radial-gradient(circle, ${theme.colors.primaryEnd}, transparent)`,
        borderRadius: '50%',
        filter: 'blur(150px)',
        transform: `translate(${Math.cos(t * 0.4) * 150}px, ${Math.sin(t * 0.6) * 100}px)`,
        opacity: 0.15
      }} />
    </AbsoluteFill>
  );
};
