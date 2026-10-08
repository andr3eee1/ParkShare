import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CreditCard, Navigation, ShieldCheck } from 'lucide-react';
import { theme } from '../theme';
import { PhoneMockup } from '../components/PhoneMockup';
import { KineticText } from '../components/KineticText';
import { useTranslation } from '../i18n';

export const Scene5Book: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslation();

  const phoneIn = spring({ fps, frame, config: { damping: 14 } });
  const phoneY = interpolate(phoneIn, [0, 1], [800, 0]);

  // Checkmark animation
  const checkProgress = spring({ fps, frame: frame - 40, config: { damping: 12 } });
  const strokeOffset = interpolate(checkProgress, [0, 1], [100, 0]);

  const features = [
    { icon: <CreditCard />, text: t.feature1 },
    { icon: <Navigation />, text: t.feature2 },
    { icon: <ShieldCheck />, text: t.feature3 },
  ];

  return (
    <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: '0 120px' }}>
      
      {/* Left: Copy */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.1em', color: theme.colors.primaryStart }}>
          <KineticText text={t.bookTitle} delay={0} />
        </div>
        <h2 style={{ fontSize: 72, fontWeight: 700, margin: 0, color: theme.colors.text, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
          <KineticText text={t.bookDesc} delay={10} />
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 40 }}>
          {features.map((feat, i) => {
            const fScale = spring({ fps, frame: frame - (30 + i * 10), config: { damping: 14 } });
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 20,
                transform: `scale(${fScale}) translateY(${interpolate(fScale, [0,1], [20,0])}px)`,
                opacity: fScale
              }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: theme.colors.white, display: 'flex', justifyContent: 'center', alignItems: 'center', color: theme.colors.primaryStart, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                  {feat.icon}
                </div>
                <span style={{ fontSize: 28, fontWeight: 600, color: theme.colors.text }}>{feat.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Phone */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <PhoneMockup style={{ transform: `translateY(${phoneY}px)` }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 30, background: '#F8FAFC' }}>
            
            {/* Animated Checkmark */}
            <div style={{ width: 120, height: 120, background: theme.colors.primaryStart, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)' }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" strokeDasharray="100" strokeDashoffset={strokeOffset} />
              </svg>
            </div>

            <h3 style={{ fontSize: 32, fontWeight: 800, marginTop: 30, color: theme.colors.text }}>{t.spotReserved}</h3>

            {/* Receipt Ticket */}
            <div style={{
              width: '100%', marginTop: 40, padding: 30, background: theme.colors.white, borderRadius: 24,
              border: '2px dashed rgba(0,0,0,0.1)',
              transform: `translateY(${interpolate(spring({ fps, frame: frame - 50, config: { damping: 14 } }), [0, 1], [100, 0])}px)`,
              opacity: interpolate(frame - 50, [0, 10], [0, 1])
            }}>
              <div style={{ fontSize: 18, color: theme.colors.mutedText, lineHeight: 1.6, textAlign: 'center' }}>
                {t.receipt.split(' · ').map((line, i) => <div key={i}>{line}</div>)}
              </div>
            </div>

          </div>
        </PhoneMockup>
      </div>

    </AbsoluteFill>
  );
};
