import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Car, Globe, Smartphone } from 'lucide-react';
import { theme } from '../theme';
import { KineticText } from '../components/KineticText';
import { useTranslation } from '../i18n';

export const Scene7Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslation();

  const iconScale = spring({ fps, frame: frame - 5, config: { damping: 12 } });
  const btnScale = spring({ fps, frame: frame - 25, config: { damping: 14 } });

  const pills = [t.outroPill1, t.outroPill2, t.outroPill3, t.outroPill4];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>

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
        <h2 style={{ fontSize: 76, fontWeight: 800, margin: 0, color: theme.colors.text, letterSpacing: '-0.03em', textAlign: 'center' }}>
          <KineticText text={t.outroHeadline} delay={15} />
        </h2>

        {/* Subline */}
        <div style={{ fontSize: 26, color: theme.colors.mutedText, fontWeight: 500, maxWidth: 900, textAlign: 'center' }}>
          <KineticText text={t.outroSub} delay={30} />
        </div>

        {/* CTA Button */}
        <div style={{
          marginTop: 6,
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

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 14, marginTop: 18 }}>
          {pills.map((pill, i) => {
            const s = spring({ fps, frame: frame - (50 + i * 8), config: { damping: 14 } });
            return (
              <div
                key={i}
                style={{
                  background: theme.colors.white,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 999,
                  padding: '12px 22px',
                  fontSize: 18,
                  fontWeight: 600,
                  color: theme.colors.text,
                  transform: `translateY(${interpolate(s, [0, 1], [16, 0])}px)`,
                  opacity: s,
                  boxShadow: '0 10px 24px rgba(0,0,0,0.04)',
                }}
              >
                {pill}
              </div>
            );
          })}
        </div>

        {/* Footer: website + platforms */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 30, marginTop: 34,
          opacity: interpolate(spring({ fps, frame: frame - 70, config: { damping: 16 } }), [0, 1], [0, 1]),
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.colors.primaryStart, fontSize: 22, fontWeight: 700 }}>
            <Globe size={24} /> {t.outroWebsite}
          </div>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.colors.border }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.colors.mutedText, fontSize: 22, fontWeight: 600 }}>
            <Smartphone size={24} /> {t.outroPlatforms}
          </div>
        </div>

      </div>
    </AbsoluteFill>
  );
};
