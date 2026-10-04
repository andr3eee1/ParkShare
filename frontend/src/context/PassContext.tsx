import React, { createContext, useContext, useMemo, useState } from 'react';
import { DemoParkingSpot } from '../data/demoLocations';

export type PassKind = 'commuter' | 'night-owl' | 'park-plus';

export type ParkingPass = {
  id: PassKind;
  kind: PassKind;
  name: string;
  description: string;
  price: number;
  billingLabel: string;
  icon: 'briefcase-outline' | 'moon-outline' | 'globe-outline';
  accent: string;
  targetSpotId?: string;
  targetSpotLabel?: string;
  schedule?: string;
  perks: string[];
};

export const PASS_CATALOG: ParkingPass[] = [
  {
    id: 'park-plus',
    kind: 'park-plus',
    name: 'Park Plus',
    description: 'Premium savings across the entire ParkShare network.',
    price: 49,
    billingLabel: 'RON / month',
    icon: 'globe-outline',
    accent: '#C06B1A',
    perks: ['15% off hourly and daily bookings', '15 minutes free on bookings over 2 hours', 'Zero security deposit everywhere'],
  },
  {
    id: 'commuter',
    kind: 'commuter',
    name: '9-to-5 Commuter Pass',
    description: 'Your reserved weekday spot for the workday.',
    price: 129,
    billingLabel: 'RON / month',
    icon: 'briefcase-outline',
    accent: '#0F766E',
    targetSpotId: 'piata-victoriei-1',
    targetSpotLabel: 'Piața Victoriei · Driveway (Verified)',
    schedule: 'Monday – Friday · 08:00 – 18:00',
    perks: ['Exclusive access to one spot', 'Zero security deposit', 'GPS check-in included'],
  },
  {
    id: 'night-owl',
    kind: 'night-owl',
    name: 'Night Owl Pass',
    description: 'A secure overnight spot for your home base.',
    price: 99,
    billingLabel: 'RON / month',
    icon: 'moon-outline',
    accent: '#5B4B8A',
    targetSpotId: 'tineretului-12',
    targetSpotLabel: 'Tineretului Park · Night Owl Parking',
    schedule: 'Every day · 19:00 – 07:00',
    perks: ['Exclusive overnight access', 'Zero security deposit', 'GPS check-in included'],
  },
];

type PassContextValue = {
  activePasses: ParkingPass[];
  isPassActive: (passId: PassKind) => boolean;
  togglePass: (passId: PassKind) => void;
  getPassForSpot: (spot: DemoParkingSpot | null) => ParkingPass | null;
  isParkPlusActive: boolean;
};

const PassContext = createContext<PassContextValue | null>(null);

export const PassProvider = ({ children }: { children: React.ReactNode }) => {
  const [activePassIds, setActivePassIds] = useState<PassKind[]>([]);

  const value = useMemo<PassContextValue>(() => {
    const activePasses = PASS_CATALOG.filter((pass) => activePassIds.includes(pass.id));
    const isPassActive = (passId: PassKind) => activePassIds.includes(passId);
    const getPassForSpot = (spot: DemoParkingSpot | null) => {
      if (!spot) return null;
      const parkPlus = activePasses.find((pass) => pass.kind === 'park-plus');
      const spotPass = activePasses.find((pass) => pass.targetSpotId === spot.id);
      return spotPass || parkPlus || null;
    };

    return {
      activePasses,
      isPassActive,
      togglePass: (passId) => {
        setActivePassIds((current) => current.includes(passId)
          ? current.filter((id) => id !== passId)
          : [...current, passId]);
      },
      getPassForSpot,
      isParkPlusActive: isPassActive('park-plus'),
    };
  }, [activePassIds]);

  return <PassContext.Provider value={value}>{children}</PassContext.Provider>;
};

export const usePasses = () => {
  const context = useContext(PassContext);
  if (!context) throw new Error('usePasses must be used inside PassProvider');
  return context;
};