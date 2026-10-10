import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

/**
 * Thin brand-gradient progress bar pinned to the bottom of the frame.
 * Gives the longer cut a sense of momentum and runtime.
 */
export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pct = interpolate(frame, [0, durationInFrames - 1], [0, 100], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 6,
        background: 'rgba(16, 24, 38, 0.06)',
        zIndex: 100,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${theme.colors.primaryStart}, ${theme.colors.primaryEnd})`,
        }}
      />
    </div>
  );
};
