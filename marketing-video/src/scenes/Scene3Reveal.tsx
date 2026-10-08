import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Car } from 'lucide-react';
import { theme } from '../theme';
import { KineticText } from '../components/KineticText';
import { useTranslation } from '../i18n';

export const Scene3Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslation();

  const iconSpring = spring({ fps, frame: frame - 5, config: { damping: 14 } });
  const iconY = interpolate(iconSpring, [0, 1], [-200, 0]);
  const iconRot = interpolate(iconSpring, [0, 1], [-20, 0]);
  
  const titleSpring = spring({ fps, frame: frame - 15, config: { damping: 18 } });
  const titleTracking = interpolate(titleSpring, [0, 1], [0.5, -0.05]); // em

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30 }}>
        
        {/* App Icon */}
        <div style={{
          width: 140, height: 140,
          background: `linear-gradient(135deg, ${theme.colors.primaryStart}, ${theme.colors.primaryEnd})`,
          borderRadius: 40,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          transform: `translateY(${iconY}px) rotate(${iconRot}deg)`,
          boxShadow: '0 30px 60px rgba(16, 185, 129, 0.3)'
        }}>
          <Car size={72} color={theme.colors.white} strokeWidth={2.5} />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 140, fontWeight: 800, margin: 0, color: theme.colors.text,
          letterSpacing: `${titleTracking}em`,
          opacity: interpolate(frame - 15, [0, 10], [0, 1])
        }}>
          ParkShare
        </h1>
        
        {/* Tagline */}
        <div style={{ fontSize: 36, color: theme.colors.text, opacity: 0.8, fontWeight: 500 }}>
          <KineticText text={t.tagline} delay={25} />
        </div>
        
      </div>
    </AbsoluteFill>
  );
};
