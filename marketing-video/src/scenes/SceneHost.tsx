import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Tag, CalendarDays, Zap, Car, TrendingUp } from 'lucide-react';
import { theme } from '../theme';
import { PhoneMockup } from '../components/PhoneMockup';
import { KineticText } from '../components/KineticText';
import { FeatureList } from '../components/FeatureList';
import { useTranslation } from '../i18n';

export const SceneHost: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslation();

  const phoneIn = spring({ fps, frame, config: { damping: 14 } });
  const phoneY = interpolate(phoneIn, [0, 1], [800, 0]);

  const activeDays = [true, true, false, true, true, true, false];

  return (
    <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: '0 120px' }}>

      {/* Left: Copy */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.1em', color: theme.colors.primaryStart }}>
          <KineticText text={t.listTitle} delay={0} />
        </div>
        <h2 style={{ fontSize: 72, fontWeight: 700, margin: 0, color: theme.colors.text, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
          <KineticText text={t.listDesc} delay={10} />
        </h2>

        <FeatureList
          delay={30}
          items={[
            { icon: <Tag size={28} />, text: t.listFeature1 },
            { icon: <CalendarDays size={28} />, text: t.listFeature2 },
            { icon: <Zap size={28} />, text: t.listFeature3 },
          ]}
        />
      </div>

      {/* Right: Phone with host management */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <PhoneMockup style={{ transform: `translateY(${phoneY}px)` }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC', padding: 30, paddingTop: 74, paddingBottom: 40 }}>

            <div style={{ fontSize: 26, fontWeight: 800, color: theme.colors.text, letterSpacing: '-0.02em' }}>
              {t.hostScreenTitle}
            </div>

            {/* Spot card */}
            <div style={{ marginTop: 22, background: theme.colors.white, borderRadius: 24, padding: 22, boxShadow: '0 16px 40px rgba(0,0,0,0.06)', border: `1px solid ${theme.colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: `linear-gradient(135deg, ${theme.colors.primaryStart}, ${theme.colors.primaryEnd})`, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                  <Car size={28} color={theme.colors.white} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: theme.colors.text }}>{t.hostSpotName}</div>
                  <div style={{ fontSize: 15, color: theme.colors.mutedText, marginTop: 2 }}>{t.hostSpotMeta}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: theme.colors.primaryStart, whiteSpace: 'nowrap' }}>{t.hostSpotPrice}</div>
              </div>
            </div>

            {/* Availability */}
            <div style={{ marginTop: 26, fontSize: 15, fontWeight: 700, color: theme.colors.mutedText, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t.hostAvailability}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              {t.hostDays.map((day, i) => {
                const s = spring({ fps, frame: frame - (40 + i * 6), config: { damping: 12 } });
                const on = activeDays[i];
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '100%', height: 74, borderRadius: 16,
                        background: on ? `linear-gradient(180deg, ${theme.colors.primaryStart}, ${theme.colors.primaryEnd})` : '#EEF2F6',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        color: on ? theme.colors.white : theme.colors.mutedText,
                        transform: `scale(${interpolate(s, [0, 1], [0.5, 1])})`,
                        opacity: s,
                        boxShadow: on ? '0 12px 24px -12px rgba(0,153,103,0.6)' : 'none',
                      }}
                    >
                      {on ? <Car size={22} /> : <span style={{ fontSize: 18, fontWeight: 700 }}>·</span>}
                    </div>
                    <span style={{ marginTop: 8, fontSize: 15, fontWeight: 700, color: theme.colors.mutedText }}>{day}</span>
                  </div>
                );
              })}
            </div>

            {/* Payout note */}
            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 12, background: theme.colors.accent, color: theme.colors.accentForeground, borderRadius: 18, padding: '16px 20px', fontWeight: 700, fontSize: 17 }}>
              <TrendingUp size={22} /> {t.hostPayout}
            </div>

          </div>
        </PhoneMockup>
      </div>

    </AbsoluteFill>
  );
};
