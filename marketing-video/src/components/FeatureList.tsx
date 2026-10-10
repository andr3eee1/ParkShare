import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

/**
 * Reusable animated list of feature rows (icon + label) used across the
 * marketplace scenes. Rows spring in one after another.
 */
export const FeatureList: React.FC<{
  items: { icon: React.ReactNode; text: string }[];
  delay?: number;
  stagger?: number;
  gap?: number;
}> = ({ items, delay = 0, stagger = 10, gap = 24 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, marginTop: 40 }}>
      {items.map((item, i) => {
        const s = spring({ fps, frame: frame - (delay + i * stagger), config: { damping: 14 } });
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              transform: `translateY(${interpolate(s, [0, 1], [22, 0])}px) scale(${interpolate(s, [0, 1], [0.96, 1])})`,
              opacity: s,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: theme.colors.white,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: theme.colors.primaryStart,
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                flexShrink: 0,
              }}
            >
              {item.icon}
            </div>
            <span style={{ fontSize: 28, fontWeight: 600, color: theme.colors.text }}>{item.text}</span>
          </div>
        );
      })}
    </div>
  );
};
