import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Clock } from 'lucide-react';
import { theme } from '../theme';
import { KineticText } from '../components/KineticText';
import { useTranslation } from '../i18n';

export const Scene1Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslation();

  const countProgress = spring({ fps, frame: frame - 20, config: { damping: 14 } });
  const minutes = Math.floor(interpolate(countProgress, [0, 1], [0, 23]));
  
  const pillY = interpolate(spring({ fps, frame: frame - 15, config: { damping: 14 } }), [0, 1], [50, 0]);
  const pillOpacity = interpolate(frame - 15, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 100 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, textAlign: 'center' }}>
        
        {/* Kicker */}
        <div style={{ fontSize: 26, letterSpacing: '0.2em', fontWeight: 600, color: theme.colors.primaryStart }}>
          <KineticText text={t.kicker} delay={0} />
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 110, fontWeight: 700, margin: 0, color: theme.colors.text, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
          <KineticText text={t.problemHeadline} delay={10} />
        </h1>

        {/* Counter Pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 32px',
          background: theme.colors.white,
          borderRadius: 999,
          boxShadow: '0 20px 40px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05) inset',
          transform: `translateY(${pillY}px)`,
          opacity: pillOpacity,
          marginTop: 20
        }}>
          <Clock size={28} color={theme.colors.primaryStart} />
          <span style={{ fontSize: 28, fontWeight: 600, color: theme.colors.text }}>
            {minutes} {t.counterText}
          </span>
        </div>
        
      </div>
    </AbsoluteFill>
  );
};
