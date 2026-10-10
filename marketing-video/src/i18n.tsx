import React, { createContext, useContext } from 'react';

type Lang = 'en' | 'ro';

const translations = {
  en: {
    kicker: "EVERY DAY, IN EVERY CITY",
    problemHeadline: "Drivers circle the block.",
    counterText: "min lost searching",
    supplyHeadline: "While millions of driveways sit empty.",
    tagline: "Your city's hidden parking, unlocked.",

    findTitle: "01 — FIND",
    findDesc: "See open spots near you, live.",
    searchBar: "Downtown · Now",
    mapleStreet: "Maple St. Driveway",
    ratingWalk: "★ 4.9 · 2 min walk",
    reserveBtn: "Reserve spot",

    bookTitle: "02 — BOOK",
    bookDesc: "Reserved in seconds.",
    feature1: "Pay in one tap",
    feature2: "Turn-by-turn to the spot",
    feature3: "Verified hosts & insured",
    spotReserved: "Spot reserved",
    receipt: "Maple St. Driveway · Today 18:00–20:00 · Total $4.00",

    parkTitle: "03 — PARK",
    parkDesc: "Your spot, tracked live.",
    parkFeature1: "Live session timer",
    parkFeature2: "Extend in one tap",
    parkFeature3: "Auto-checkout & receipt",
    parkSessionLabel: "ACTIVE SESSION",
    parkSpot: "Maple St. Driveway",
    parkExtend: "Extend 1 hour",
    parkEnd: "End session",
    parkEstimated: "Estimated cost",

    saveTitle: "04 — SAVE",
    saveDesc: "Skip the deposit. Pay less.",
    saveFeature1: "Top up your wallet in seconds",
    saveFeature2: "Park Plus: 20% off every hour",
    saveFeature3: "Municipal passes · no deposit",
    walletBalanceLabel: "Available balance",
    walletTopUp: "Top up",
    passPlusName: "Park Plus",
    passPlusDetail: "20% off every hour",
    passMunicipalName: "Municipal Pass",
    passMunicipalDetail: "No security deposit",
    depositWaivedBadge: "Deposit waived",

    listTitle: "05 — LIST",
    listDesc: "Turn your driveway into income.",
    listFeature1: "Set your own price",
    listFeature2: "Smart weekly availability",
    listFeature3: "Instant, secure payouts",
    hostScreenTitle: "My Spots",
    hostSpotName: "Maple St. Driveway",
    hostSpotMeta: "Live · 87 bookings",
    hostSpotPrice: "$4 / hour",
    hostAvailability: "Weekly availability",
    hostPayout: "Instant payouts · every Friday",
    hostDays: ["M", "T", "W", "T", "F", "S", "S"],

    earnTitle: "06 — EARN",
    earnHeadline: "Have a driveway? Get paid.",
    thisMonth: "This month",

    trustTitle: "07 — TRUST",
    trustDesc: "Every trip rated. Every host verified.",
    trustRatingLabel: "Average rating",
    trustReviewsLabel: "2,480 reviews this month",
    trustVerified: "Verified hosts",
    trustVerifiedDetail: "ID & plate checks",
    trustInsured: "Insured trips",
    trustInsuredDetail: "Covered door to door",
    trustSecure: "Secure payments",
    trustSecureDetail: "Funds held until you arrive",

    outroHeadline: "Park smarter. Share more.",
    outroSub: "Join thousands of drivers and hosts already sharing their city.",
    cta: "Get ParkShare",
    outroWebsite: "www.park-share.ro",
    outroPlatforms: "Available on iOS & Android",
    outroPill1: "Peer-to-peer parking",
    outroPill2: "Instant booking",
    outroPill3: "Secure payments",
    outroPill4: "Verified hosts"
  },
  ro: {
    kicker: "ÎN FIECARE ZI, ÎN ORICE ORAȘ",
    problemHeadline: "Șoferii se învârt în jurul blocului.",
    counterText: "minute pierdute căutând",
    supplyHeadline: "În timp ce milioane de curți stau goale.",
    tagline: "Locurile de parcare ascunse, acum deblocate.",

    findTitle: "01 — GĂSEȘTE",
    findDesc: "Vezi locurile libere de lângă tine, live.",
    searchBar: "Centru · Acum",
    mapleStreet: "Curte str. Arțarilor",
    ratingWalk: "★ 4.9 · 2 min de mers",
    reserveBtn: "Rezervă locul",

    bookTitle: "02 — REZERVĂ",
    bookDesc: "Rezervat în câteva secunde.",
    feature1: "Plătește cu o atingere",
    feature2: "Navigație pas cu pas",
    feature3: "Gazde verificate & asigurat",
    spotReserved: "Loc rezervat",
    receipt: "Curte str. Arțarilor · Azi 18:00–20:00 · Total $4.00",

    parkTitle: "03 — PARCHEAZĂ",
    parkDesc: "Locul tău, urmărit în timp real.",
    parkFeature1: "Cronometru de sesiune live",
    parkFeature2: "Prelungește cu o atingere",
    parkFeature3: "Checkout automat & chitanță",
    parkSessionLabel: "SESIUNE ACTIVĂ",
    parkSpot: "Curte str. Arțarilor",
    parkExtend: "Prelungește 1 oră",
    parkEnd: "Încheie sesiunea",
    parkEstimated: "Cost estimat",

    saveTitle: "04 — ECONOMISEȘTE",
    saveDesc: "Fără garanție. Plătești mai puțin.",
    saveFeature1: "Alimentează portofelul în câteva secunde",
    saveFeature2: "Park Plus: 20% reducere pe oră",
    saveFeature3: "Pass-uri municipale · fără garanție",
    walletBalanceLabel: "Balanță disponibilă",
    walletTopUp: "Alimentează",
    passPlusName: "Park Plus",
    passPlusDetail: "20% reducere pe oră",
    passMunicipalName: "Pass Municipal",
    passMunicipalDetail: "Fără garanție de siguranță",
    depositWaivedBadge: "Garanție anulată",

    listTitle: "05 — LISTEAZĂ",
    listDesc: "Transformă-ți curtea în venit.",
    listFeature1: "Setează-ți propriul preț",
    listFeature2: "Disponibilitate săptămânală inteligentă",
    listFeature3: "Plăți instant, în siguranță",
    hostScreenTitle: "Locurile mele",
    hostSpotName: "Curte str. Arțarilor",
    hostSpotMeta: "Activ · 87 rezervări",
    hostSpotPrice: "$4 / oră",
    hostAvailability: "Disponibilitate săptămânală",
    hostPayout: "Plăți instant · în fiecare vineri",
    hostDays: ["L", "M", "M", "J", "V", "S", "D"],

    earnTitle: "06 — CÂȘTIGĂ",
    earnHeadline: "Ai o curte? Fii plătit.",
    thisMonth: "Luna aceasta",

    trustTitle: "07 — ÎNCREDERE",
    trustDesc: "Fiecare cursă evaluată. Fiecare gazdă verificată.",
    trustRatingLabel: "Rating mediu",
    trustReviewsLabel: "2.480 de recenzii luna aceasta",
    trustVerified: "Gazde verificate",
    trustVerifiedDetail: "Verificare buletin & număr",
    trustInsured: "Curse asigurate",
    trustInsuredDetail: "Protejate de la ușă la ușă",
    trustSecure: "Plăți securizate",
    trustSecureDetail: "Banii sunt reținuți până ajungi",

    outroHeadline: "Parchează inteligent. Împarte mai mult.",
    outroSub: "Alătură-te miilor de șoferi și gazde care își împart orașul.",
    cta: "Descarcă ParkShare",
    outroWebsite: "www.park-share.ro",
    outroPlatforms: "Disponibil pe iOS & Android",
    outroPill1: "Parcare peer-to-peer",
    outroPill2: "Rezervare instant",
    outroPill3: "Plăți securizate",
    outroPill4: "Gazde verificate"
  }
};

const I18nContext = createContext<{ lang: Lang; t: typeof translations['en'] }>({ lang: 'en', t: translations['en'] });

export const I18nProvider: React.FC<{ children: React.ReactNode, lang?: Lang }> = ({ children, lang = 'en' }) => {
  return (
    <I18nContext.Provider value={{ lang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext).t;
