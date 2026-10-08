import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Car } from 'lucide-react';
import { theme } from '../theme';
import { KineticText } from '../components/KineticText';
import { useTranslation } from '../i18n';

export const Scene7Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslation();

  const iconScale = spring({ fps, frame: frame - 5, config: { damping: 12 } });
  const btnScale = spring({ fps, frame: frame - 25, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
        
        {/* App Icon */}
        <div style={{
          width: 120, height: 120,
          background: `linear-gradient(135deg, ${theme.colors.primaryStart}, ${theme.colors.primaryEnd})`,
          borderRadius: 32,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          transform: `scale(${iconScale})`,
          boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)'
        }}>
          <Car size={60} color={theme.colors.white} strokeWidth={2.5} />
        </div>

        {/* Headline */}
        <h2 style={{ fontSize: 72, fontWeight: 800, margin: 0, color: theme.colors.text, letterSpacing: '-0.03em' }}>
          <KineticText text={t.outroHeadline} delay={15} />
        </h2>
        
        {/* CTA Button */}
        <div style={{
          marginTop: 20,
          padding: '24px 64px',
          background: theme.colors.text,
          borderRadius: 999,
          transform: `scale(${btnScale})`,
          boxShadow: '0 30px 60px rgba(0,0,0,0.1)'
        }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: theme.colors.white, letterSpacing: '0.05em' }}>
            {t.cta}
          </span>
        </div>
        
      </div>
    </AbsoluteFill>
  );
};
