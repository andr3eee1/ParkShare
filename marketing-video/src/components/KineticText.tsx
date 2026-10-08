import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const KineticText: React.FC<{
  text: string;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, style = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const words = text.split(' ');
  
  return (
    <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.25em', ...style }}>
      {words.map((word, i) => {
        const wordDelay = delay + i * 4; // Staggered by 4 frames
        const progress = spring({
          fps,
          frame: frame - wordDelay,
          config: { damping: 14, stiffness: 100, mass: 1 },
        });
        
        const translateY = interpolate(progress, [0, 1], [30, 0]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);
        const blur = interpolate(progress, [0, 1], [8, 0]);
        const scale = interpolate(progress, [0, 1], [1.15, 1]);
        
        return (
          <div key={i} style={{ display: 'inline-block' }}>
            <div style={{ 
              display: 'inline-block',
              transform: `translateY(${translateY}px) scale(${scale})`,
              opacity,
              filter: `blur(${blur}px)`
            }}>
              {word}
            </div>
          </div>
        );
      })}
    </div>
  );
};
