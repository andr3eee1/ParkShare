import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Wallet, Sparkles, Landmark, PlusCircle, CheckCircle2 } from 'lucide-react';
import { theme } from '../theme';
import { PhoneMockup } from '../components/PhoneMockup';
import { KineticText } from '../components/KineticText';
import { FeatureList } from '../components/FeatureList';
import { useTranslation } from '../i18n';

export const SceneWallet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslation();

  const phoneIn = spring({ fps, frame, config: { damping: 14 } });
  const phoneY = interpolate(phoneIn, [0, 1], [800, 0]);

  const balanceSpring = spring({ fps, frame: frame - 25, config: { damping: 22, stiffness: 55 } });
  const balance = interpolate(balanceSpring, [0, 1], [0, 148.5]);

  const passes = [
    { name: t.passPlusName, detail: t.passPlusDetail, icon: <Sparkles size={24} color={theme.colors.primaryStart} />, badge: null as string | null },
    { name: t.passMunicipalName, detail: t.passMunicipalDetail, icon: <Landmark size={24} color={theme.colors.primaryStart} />, badge: t.depositWaivedBadge },
  ];

  return (
    <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: '0 120px' }}>

      {/* Left: Copy */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.1em', color: theme.colors.primaryStart }}>
          <KineticText text={t.saveTitle} delay={0} />
        </div>
        <h2 style={{ fontSize: 72, fontWeight: 700, margin: 0, color: theme.colors.text, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
          <KineticText text={t.saveDesc} delay={10} />
        </h2>

        <FeatureList
          delay={30}
          items={[
            { icon: <Wallet size={28} />, text: t.saveFeature1 },
            { icon: <Sparkles size={28} />, text: t.saveFeature2 },
            { icon: <Landmark size={28} />, text: t.saveFeature3 },
          ]}
        />
      </div>

      {/* Right: Phone with wallet + passes */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <PhoneMockup style={{ transform: `translateY(${phoneY}px)` }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC', padding: 30, paddingTop: 74, paddingBottom: 40 }}>

            {/* Balance card */}
            <div style={{
              background: `linear-gradient(135deg, ${theme.colors.primaryStart}, ${theme.colors.primaryEnd})`,
              borderRadius: 28, padding: 30, color: theme.colors.white,
              boxShadow: '0 30px 60px -24px rgba(0,153,103,0.65)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.9, fontSize: 15, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <Wallet size={18} /> {t.walletBalanceLabel}
              </div>
              <div style={{ fontSize: 62, fontWeight: 800, marginTop: 12, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                ${balance.toFixed(2)}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, background: 'rgba(255,255,255,0.18)', padding: '10px 18px', borderRadius: 999, fontSize: 16, fontWeight: 700 }}>
                <PlusCircle size={18} /> {t.walletTopUp}
              </div>
            </div>

            {/* Pass rows */}
            <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {passes.map((pass, i) => {
                const s = spring({ fps, frame: frame - (35 + i * 12), config: { damping: 14 } });
                return (
                  <div
                    key={i}
                    style={{
                      background: theme.colors.white, borderRadius: 22, padding: 20,
                      display: 'flex', alignItems: 'center', gap: 16,
                      boxShadow: '0 12px 30px rgba(0,0,0,0.05)',
                      border: `1px solid ${theme.colors.border}`,
                      transform: `translateX(${interpolate(s, [0, 1], [60, 0])}px)`,
                      opacity: s,
                    }}
                  >
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: theme.colors.accent, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                      {pass.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 19, fontWeight: 700, color: theme.colors.text }}>{pass.name}</div>
                      <div style={{ fontSize: 15, color: theme.colors.mutedText, marginTop: 2 }}>{pass.detail}</div>
                    </div>
                    {pass.badge ? (
                      <div style={{ background: '#DCFCE7', color: '#166534', fontSize: 12, fontWeight: 800, padding: '6px 10px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                        {pass.badge}
                      </div>
                    ) : (
                      <CheckCircle2 size={24} color={theme.colors.primaryStart} />
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </PhoneMockup>
      </div>

    </AbsoluteFill>
  );
};
