import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { KineticText } from '../components/KineticText';
import { useTranslation } from '../i18n';

export const Scene2Supply: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslation();

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 100 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 80, width: '100%' }}>
        
        <h2 style={{ fontSize: 80, fontWeight: 700, margin: 0, color: theme.colors.text, textAlign: 'center', letterSpacing: '-0.03em' }}>
          <KineticText text={t.supplyHeadline} delay={0} />
        </h2>

        {/* 6 dashed rectangular parking bays staggered in */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          {[...Array(6)].map((_, i) => {
            const scale = spring({ fps, frame: frame - (15 + i * 5), config: { damping: 12, mass: 0.8 } });
            return (
              <div key={i} style={{
                width: 120, height: 240,
                border: `4px dashed rgba(0,0,0,0.1)`,
                borderRadius: 16,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                transform: `scale(${scale})`,
                backgroundColor: 'rgba(255,255,255,0.5)'
              }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: theme.colors.primaryStart, opacity: 0.8 }}>
                  P
                </div>
              </div>
            );
          })}
        </div>
        
      </div>
    </AbsoluteFill>
  );
};
