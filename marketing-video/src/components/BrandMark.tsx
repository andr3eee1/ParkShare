import React from 'react';

/**
 * The Share-P symbol, drawn from the canonical brand geometry
 * (see docs/brand/svg/symbol.svg — viewBox 0 0 52 66).
 * Rendered as inline vector SVG so it stays crisp at any size in the video.
 *
 * `size` is the symbol's height in px; the width follows the 52:66 ratio.
 * Mirrors the app icon lockup: white mark on the translucent gradient tile.
 */
export const BrandMark: React.FC<{
  size?: number;
  fill?: string;
  style?: React.CSSProperties;
}> = ({ size = 72, fill = '#FFFFFF', style }) => {
  const width = size * (52 / 66);
  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 52 66"
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {/* Stem */}
      <rect x="0" y="0" width="13" height="62" rx="6" fill={fill} />
      {/* Left bowl piece */}
      <path d="M 15 0 L 15 38 A 19 19 0 0 0 23.95 35.76 L 23.95 2.24 A 19 19 0 0 0 15 0 Z" fill={fill} />
      {/* Right bowl piece */}
      <path d="M 25.05 2.87 L 25.05 35.13 A 19 19 0 0 0 25.05 2.87 Z" fill={fill} />
    </svg>
  );
};