import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Search, MapPin, Star } from 'lucide-react';
import { theme } from '../theme';
import { PhoneMockup } from '../components/PhoneMockup';
import { KineticText } from '../components/KineticText';
import { useTranslation } from '../i18n';

export const Scene4Find: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTranslation();

  const phoneIn = spring({ fps, frame, config: { damping: 14 } });
  const phoneY = interpolate(phoneIn, [0, 1], [800, 0]);
  const phoneRot = interpolate(phoneIn, [0, 1], [-10, 0]);
  
  const pins = [
    { x: 100, y: 300, price: "$3/h" },
    { x: 280, y: 200, price: "$4/h" },
    { x: 200, y: 400, price: "$2/h", isTarget: true }, // Highlighted at frame 80
    { x: 320, y: 550, price: "$5/h" },
    { x: 80, y: 600, price: "$3/h" },
  ];

  const bottomSheetY = interpolate(spring({ fps, frame: frame - 80, config: { damping: 14 } }), [0, 1], [400, 0]);

  return (
    <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: '0 120px' }}>
      
      {/* Left: Phone */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <PhoneMockup style={{ transform: `translateY(${phoneY}px) rotate(${phoneRot}deg)` }}>
          {/* Faux Map Background */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: '#F1F5F9',
            backgroundImage: 'linear-gradient(#E2E8F0 2px, transparent 2px), linear-gradient(90deg, #E2E8F0 2px, transparent 2px)',
            backgroundSize: '40px 40px'
          }} />
          
          {/* Search Bar */}
          <div style={{
            position: 'absolute', top: 80, left: 20, right: 20,
            background: theme.colors.white, borderRadius: 24, padding: '16px 20px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 12
          }}>
            <Search size={20} color={theme.colors.text} opacity={0.5} />
            <span style={{ fontSize: 18, fontWeight: 500, color: theme.colors.text }}>{t.searchBar}</span>
          </div>

          {/* Map Pins */}
          {pins.map((pin, i) => {
            const pinScale = spring({ fps, frame: frame - (20 + i * 5), config: { damping: 12 } });
            const isHighlighted = pin.isTarget && frame >= 80;
            return (
              <div key={i} style={{
                position: 'absolute', left: pin.x, top: pin.y,
                background: isHighlighted ? theme.colors.primaryStart : theme.colors.white,
                color: isHighlighted ? theme.colors.white : theme.colors.text,
                padding: '8px 16px', borderRadius: 20, fontWeight: 700, fontSize: 16,
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                transform: `scale(${pinScale}) translateY(${isHighlighted ? -10 : 0}px)`,
                transition: 'all 0.3s'
              }}>
                {pin.price}
              </div>
            );
          })}

          {/* Bottom Sheet */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: theme.colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32,
            padding: 30, paddingBottom: 50,
            boxShadow: '0 -20px 40px rgba(0,0,0,0.05)',
            transform: `translateY(${bottomSheetY}px)`
          }}>
            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.colors.text }}>{t.mapleStreet}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, color: theme.colors.mutedText, fontSize: 16 }}>
              <Star size={16} fill="#F59E0B" color="#F59E0B" />
              <span>{t.ratingWalk}</span>
            </div>
            <div style={{
              marginTop: 24, background: `linear-gradient(135deg, ${theme.colors.primaryStart}, ${theme.colors.primaryEnd})`,
              padding: '16px', borderRadius: 20, color: theme.colors.white, textAlign: 'center', fontWeight: 700, fontSize: 18
            }}>
              {t.reserveBtn}
            </div>
          </div>
        </PhoneMockup>
      </div>

      {/* Right: Copy */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.1em', color: theme.colors.primaryStart }}>
          <KineticText text={t.findTitle} delay={10} />
        </div>
        <h2 style={{ fontSize: 72, fontWeight: 700, margin: 0, color: theme.colors.text, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
          <KineticText text={t.findDesc} delay={20} />
        </h2>
      </div>

    </AbsoluteFill>
  );
};
