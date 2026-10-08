import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import { KineticText } from '../components/KineticText';
import { useTranslation } from '../i18n';

export const Scene6Earn: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslation();

  const countProgress = spring({ fps, frame: frame - 20, config: { damping: 20 } });
  const amount = Math.floor(interpolate(countProgress, [0, 1], [0, 412]));
  
  const cardScale = spring({ fps, frame: frame - 15, config: { damping: 14 } });

  const bars = [0.3, 0.5, 0.4, 0.7, 0.6, 0.9, 1.0];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 100 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 60, width: '100%' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.1em', color: theme.colors.primaryStart }}>
            <KineticText text={t.earnTitle} delay={0} />
          </div>
          <h2 style={{ fontSize: 80, fontWeight: 700, margin: 0, color: theme.colors.text, textAlign: 'center', letterSpacing: '-0.03em' }}>
            <KineticText text={t.earnHeadline} delay={10} />
          </h2>
        </div>

        {/* Analytics Card */}
        <div style={{
          width: 500, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 40, padding: 50,
          boxShadow: '0 40px 80px rgba(0,0,0,0.05), 0 0 0 1px rgba(255,255,255,0.5) inset',
          transform: `scale(${cardScale})`
        }}>
          <div style={{ fontSize: 20, color: theme.colors.mutedText, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {t.thisMonth}
          </div>
          <div style={{ fontSize: 80, fontWeight: 800, color: theme.colors.text, margin: '20px 0' }}>
            ${amount}
          </div>

          {/* Bar Chart */}
          <div style={{ display: 'flex', gap: 12, height: 120, alignItems: 'flex-end', marginTop: 40 }}>
            {bars.map((bar, i) => {
              const barSpring = spring({ fps, frame: frame - (30 + i * 5), config: { damping: 14 } });
              const h = interpolate(barSpring, [0, 1], [0, bar * 120]);
              return (
                <div key={i} style={{
                  flex: 1, height: h,
                  background: `linear-gradient(to top, ${theme.colors.primaryEnd}, ${theme.colors.primaryStart})`,
                  borderRadius: 8
                }} />
              );
            })}
          </div>
        </div>
        
      </div>
    </AbsoluteFill>
  );
};
