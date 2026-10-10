import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Star, BadgeCheck, ShieldCheck, Lock } from 'lucide-react';
import { theme } from '../theme';
import { KineticText } from '../components/KineticText';
import { useTranslation } from '../i18n';

export const SceneTrust: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslation();

  const ratingSpring = spring({ fps, frame: frame - 25, config: { damping: 24, stiffness: 55 } });
  const rating = interpolate(ratingSpring, [0, 1], [0, 4.9]);
  const stars = Math.round(rating);

  const cards = [
    { icon: <BadgeCheck size={30} color={theme.colors.primaryStart} />, title: t.trustVerified, detail: t.trustVerifiedDetail },
    { icon: <ShieldCheck size={30} color={theme.colors.primaryStart} />, title: t.trustInsured, detail: t.trustInsuredDetail },
    { icon: <Lock size={30} color={theme.colors.primaryStart} />, title: t.trustSecure, detail: t.trustSecureDetail },
  ];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 100 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>

        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.1em', color: theme.colors.primaryStart }}>
          <KineticText text={t.trustTitle} delay={0} />
        </div>
        <h2 style={{ fontSize: 78, fontWeight: 700, margin: 0, color: theme.colors.text, textAlign: 'center', letterSpacing: '-0.03em' }}>
          <KineticText text={t.trustDesc} delay={10} />
        </h2>

        {/* Rating + trust cards */}
        <div style={{ display: 'flex', gap: 28, marginTop: 40, alignItems: 'stretch' }}>

          {/* Big rating card */}
          <div style={{
            width: 360, background: `linear-gradient(135deg, ${theme.colors.primaryStart}, ${theme.colors.primaryEnd})`,
            borderRadius: 36, padding: 40, color: theme.colors.white, display: 'flex', flexDirection: 'column', justifyContent: 'center',
            boxShadow: '0 40px 80px -30px rgba(0,153,103,0.6)',
            transform: `scale(${interpolate(spring({ fps, frame: frame - 15, config: { damping: 14 } }), [0, 1], [0.9, 1])})`,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.9 }}>
              {t.trustRatingLabel}
            </div>
            <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
              {rating.toFixed(1)}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              {[0, 1, 2, 3, 4].map((i) => {
                const on = i < stars;
                const s = spring({ fps, frame: frame - (30 + i * 5), config: { damping: 10 } });
                return (
                  <div key={i} style={{ transform: `scale(${interpolate(s, [0, 1], [0, 1])})` }}>
                    <Star size={30} fill={on ? '#FDE68A' : 'transparent'} color={on ? '#FDE68A' : 'rgba(255,255,255,0.5)'} />
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 17, marginTop: 16, opacity: 0.9 }}>{t.trustReviewsLabel}</div>
          </div>

          {/* Feature cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' }}>
            {cards.map((card, i) => {
              const s = spring({ fps, frame: frame - (35 + i * 12), config: { damping: 14 } });
              return (
                <div
                  key={i}
                  style={{
                    width: 460, display: 'flex', alignItems: 'center', gap: 20,
                    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: 26, padding: 24, boxShadow: '0 24px 50px rgba(0,0,0,0.06)',
                    transform: `translateX(${interpolate(s, [0, 1], [70, 0])}px)`,
                    opacity: s,
                  }}
                >
                  <div style={{ width: 60, height: 60, borderRadius: 18, background: theme.colors.accent, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                    {card.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: theme.colors.text }}>{card.title}</div>
                    <div style={{ fontSize: 17, color: theme.colors.mutedText, marginTop: 2 }}>{card.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </AbsoluteFill>
  );
};
