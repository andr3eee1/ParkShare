import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Timer, Repeat, LogOut, MapPin } from 'lucide-react';
import { theme } from '../theme';
import { PhoneMockup } from '../components/PhoneMockup';
import { KineticText } from '../components/KineticText';
import { FeatureList } from '../components/FeatureList';
import { useTranslation } from '../i18n';

const formatDuration = (totalSeconds: number) => {
  const s = Math.floor(totalSeconds) % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

export const ScenePark: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslation();

  const phoneIn = spring({ fps, frame, config: { damping: 14 } });
  const phoneY = interpolate(phoneIn, [0, 1], [800, 0]);

  // Slow, steady "ticking" progress across the scene.
  const run = spring({ fps, frame: frame - 20, config: { damping: 30, stiffness: 35, mass: 1 } });
  const elapsed = interpolate(run, [0, 1], [0, 5075]); // 01:24:35
  const cost = interpolate(run, [0, 1], [0, 5.6]);
  const circumference = 2 * Math.PI * 118;
  const dash = circumference * interpolate(run, [0, 1], [0, 0.68]);

  return (
    <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: '0 120px' }}>

      {/* Left: Copy */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.1em', color: theme.colors.primaryStart }}>
          <KineticText text={t.parkTitle} delay={0} />
        </div>
        <h2 style={{ fontSize: 72, fontWeight: 700, margin: 0, color: theme.colors.text, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
          <KineticText text={t.parkDesc} delay={10} />
        </h2>

        <FeatureList
          delay={30}
          items={[
            { icon: <Timer size={28} />, text: t.parkFeature1 },
            { icon: <Repeat size={28} />, text: t.parkFeature2 },
            { icon: <LogOut size={28} />, text: t.parkFeature3 },
          ]}
        />
      </div>

      {/* Right: Phone with a live session */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <PhoneMockup style={{ transform: `translateY(${phoneY}px)` }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#F8FAFC', padding: 30, paddingTop: 74, paddingBottom: 40 }}>

            <div style={{ background: theme.colors.accent, color: theme.colors.accentForeground, fontSize: 14, fontWeight: 800, letterSpacing: '0.16em', padding: '8px 20px', borderRadius: 999 }}>
              {t.parkSessionLabel}
            </div>

            {/* Timer ring */}
            <div style={{ position: 'relative', width: 260, height: 260, marginTop: 36 }}>
              <svg width="260" height="260" viewBox="0 0 260 260">
                <circle cx="130" cy="130" r="118" fill="none" stroke="#E2E8F0" strokeWidth="14" />
                <circle
                  cx="130" cy="130" r="118" fill="none"
                  stroke={theme.colors.primaryStart} strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference}`}
                  transform="rotate(-90 130 130)"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontSize: 44, fontWeight: 800, color: theme.colors.text, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                  {formatDuration(elapsed)}
                </span>
                <span style={{ fontSize: 14, color: theme.colors.mutedText, fontWeight: 600, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {t.parkEstimated}
                </span>
                <span style={{ fontSize: 32, fontWeight: 800, color: theme.colors.primaryStart }}>
                  ${cost.toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 30, color: theme.colors.mutedText, fontSize: 18 }}>
              <MapPin size={18} color={theme.colors.primaryStart} />
              <span style={{ fontWeight: 600, color: theme.colors.text }}>{t.parkSpot}</span>
            </div>

            <div style={{ width: '100%', marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: `linear-gradient(135deg, ${theme.colors.primaryStart}, ${theme.colors.primaryEnd})`, color: theme.colors.white, textAlign: 'center', padding: 18, borderRadius: 18, fontWeight: 700, fontSize: 18, boxShadow: '0 18px 36px -16px rgba(0,153,103,0.6)' }}>
                {t.parkExtend}
              </div>
              <div style={{ border: `2px solid ${theme.colors.border}`, color: theme.colors.text, textAlign: 'center', padding: 16, borderRadius: 18, fontWeight: 700, fontSize: 18 }}>
                {t.parkEnd}
              </div>
            </div>

          </div>
        </PhoneMockup>
      </div>

    </AbsoluteFill>
  );
};
